/****************************************************************************
    fcoo-maps.js,

    (c) 2020, FCOO

    https://github.com/FCOO/fcoo-maps
    https://github.com/FCOO

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /****************************************************************************
    To create an application call window.fcoo.map.createApplication(options: OPTIONS)

    createApplication will load e serie of mandatory and optional setup-json-files or setup-json-objects
    each with a 'build'-function
    After the build the settings in fcoo.appSetting and globalSetting are loaded

    OPTIONS: {
        setup    : FILENAME or SETUP-OBJECT,
        leftMenu,
        rightMenu: {
            fileName: FILENAME, or
            data    : JSON-OBJECT,
            resolve : function( data, $leftMenuContainer ) - optional. default = fcoo.map.createLeftMenu (see menu/menu.js)
        },
        metadata: {
            fileName: FILENAME,
            resolve : function( data ),
            reload  : BOOLEAN or NUMBER. If true the file will be reloaded every hour. If NUMBER the file will be reloaded every reload minutes
        },
        other: []{fileName, resolve, reload} Same as metadata

        finally: function() - optional. Function to be called when all is ready
    }

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

    ****************************************************************************/
    var default_setup = {
            applicationName: {da:'Dansk titel', en:'English title'},


            topMenu: {
                search   : true,                                    //true if use search
                nominatim: 'https://nominatim.openstreetmap.org',   //Path to OpenStreetMap Nominatin-service
                /*
                Path to messages-files. Two versions:
                1: Relative path locally e.q. "data/info.json"
                2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
                   E.q. {subDir: "theSubDir", fileName:"fileName.json"} => "https://app.fcoo.dk/static/theSubDir/fileName.json"
                */

                help     : null, //null or STRING or {subDir:STRING, fileName:STRING}
                messages : "data/test.json", //null, //null or STRING or {subDir:STRING, fileName:STRING}
                warning  : null, //null or STRING or {subDir:STRING, fileName:STRING}

                helpId: {   //id in help message-file for different default modals
                    globalSetting  : '',  //Modal with fcoo.globalSetting
                    mapSetting     : '',  //Modal with settings for a single map
                    multiMapSetting: '',  //Modal with multi-maps setting
                },

                //Add button before setting-button with settings for map(s)
                preSetting: {
                    icon   : nsMap.mapSettingIcon,
                    onClick: function(){
                                 if (nsMap.hasMultiMaps)
                                     nsMap.showMapSettingMain();
                                 else
                                     nsMap.editMapSetting(0);
                             }
                },
                setting: false,
            },

            leftMenuWidth      : 300,   //Width of left-menu
            leftMenuButtons    : {
                setting: function(){ ns.globalSetting.edit(); }
            },
            keepLeftMenuButton : false, //Set to true if leftMenuWidth == 0 to keep menu-button
            rightMenuWidth     : 300,   //Set to 0 to aviod right-side menu
            rightMenuButtons   : {},
            keepRightMenuButton: false, //Set to true if rightMenuWidth == 0 to keep menu-button

            //Default map
            map: {
                minZoom:  3,
                maxZoom: 12,
            },

            //Multi maps
            multiMaps: {
                enabled      : true,
                maxMaps      : 5, //OR {mobile, tablet, desktop}
                maxZoomOffset: 2,
                allowDifferentTime: true, //If true the different maps can have differnet time - relative to the main map eq. +2h
            }
        };

    /*************************************************************************
    createApplication
    *************************************************************************/
    var whenFinish = null;
    nsMap.createApplication = function(options){
        //Add all setup-files needed to fcoo.promiseList

        //1. setup
        var opt = {
                resolve : createFCOOMap,
                wait    : true
            };
        if (window.intervals.isFileName(options.setup))
            opt.fileName = options.setup;
        else
            opt.data = options.setup;
        ns.promiseList.append(opt);

        //2. left-menu
        if (options.leftMenu){
            var resolveLeft = options.leftMenu.resolve || nsMap.createLeftMenu;
            options.leftMenu.resolve = function(data){ resolveLeft(data, nsMap.main.leftMenu.$menu); };
            options.leftMenu.wait = true;
            ns.promiseList.append(options.leftMenu);
        }

        //3. right-menu
        if (options.rightMenu){
            var resolveRight = options.rightMenu.resolve || nsMap.createRightMenu;
            options.rightMenu.resolve = function(data){ resolveRight(data, nsMap.main.rightMenu.$menu); };
            options.rightMenu.wait = true;
            ns.promiseList.append(options.rightMenu);
        }

        //4: Other
        $.each(options.other || [], function(index, opt){
            ns.promiseList.append(opt);
        });

        //4: Meta-data (allow both syntax)
        ns.promiseList.append(opt.metadata || opt.metaData);

        //5: Finish
        whenFinish = options.finally;

       ns.promiseList.options.finally = promise_all_finally;

        //Load all setup-files
        Promise.defaultPrefetch();
        ns.promiseList_getAll();
    };

    function promise_all_finally(){
        //Call ns.globalSetting.load => ns.appSetting.load => whenFinish => Promise.defaultFinally
        ns.globalSetting.load(null, function(){
            ns.appSetting.load(null, function(){
                if (whenFinish)
                    whenFinish();
                ns.events.fire(ns.events.CREATEAPPLICATIONFINALLY);
                Promise.defaultFinally();
            });
        });
        return true;
    }

    /*************************************************************************
    createFCOOMap(data)

    *************************************************************************/
    function createFCOOMap( data ){
        //Adjust data
        nsMap.setupData = data = $.extend(true, {}, default_setup, data );
        nsMap.hasMultiMaps = nsMap.setupData.multiMaps && nsMap.setupData.multiMaps.enabled;

        //Add header to top-menu
        data.topMenu.header = data.applicationName;

        //Adjust path
        $.each(['help', 'messages', 'warning'], function(index, id){
            var topMenuPath = data.topMenu[id];
            if (topMenuPath)
                data.topMenu[id] = {url: ns.dataFilePath( topMenuPath )};
        });

        //Adjust menu-width
        data.leftMenu  = data.leftMenuWidth  ? {width: data.leftMenuWidth}  : null;
        data.rightMenu = data.rightMenuWidth ? {width: data.rightMenuWidth} : null;

        //Get max-maps
        if (nsMap.hasMultiMaps){
            //Get max-maps
            if ($.isPlainObject(data.multiMaps.maxMaps))
                data.multiMaps.maxMaps =
                    ns.modernizrDevice.isDesktop ? data.multiMaps.maxMaps.desktop :
                    ns.modernizrDevice.isTablet  ? data.multiMaps.maxMaps.tablet :
                    data.multiMaps.maxMaps.mobile;
        }


        //Add helpId to modal for globalSetting (if any)
        if (nsMap.setupData.topMenu.helpId.globalSetting){
            var modalOptions = ns.globalSetting.options.modalOptions = ns.globalSetting.options.modalOptions || {};
            modalOptions.helpId = nsMap.setupData.topMenu.helpId.globalSetting;
            modalOptions.helpButton = true;
        }

//*/TEST
data.leftMenuButtons.bookmark = function(){ alert('bookmark'); };
data.leftMenuButtons.share = function(){ alert('share'); };
data.leftMenuButtons.load = function(){ alert('load'); };
data.leftMenuButtons.save = function(){ alert('save'); };
//*/

        //Create main structure
        nsMap.main = ns.createMain({
            mainContainerAsHandleContainer: true,
            topMenu             : data.topMenu,
            leftMenu            : data.leftMenu,
            keepLeftMenuButton  : data.keepLeftMenuButton,
            leftMenuButtons     : data.leftMenuButtons,
            rightMenu           : data.rightMenu,
            keepRightMenuButton : data.keepRightMenuButton,
            rightMenuButtons    : data.rightMenuButtons,

            _bottomMenu: {  //Just DEMO
                height : 120,
                handleWidth: 200,
                handleHeight: 26,
                //handleClassName: 'testHandle',
                toggleOnHandleClick: true,
                hideHandleWhenOpen: true
            },


            /*
            When resizing the main-container:
            - Turn zoom-history off to avoid many entries
            - Save all maps center and zoom
            */
            onResizeStart: function(){
                nsMap.visitAllMaps(function(map){
                    //Disable history-list during resizing
                    if (map.bsZoomControl && map.bsZoomControl.options.historyEnabled){
                        map.enableHistoryOnResizeEnd = true;
                        map.bsZoomControl.disableHistory();
                    }

                    //Hide center map position marker (if any)
                    map.$container.addClass('hide-control-position-map-center');

                    //If map visible and sync-enabled => disable it while resizing (Not quit sure why it works....)
                    map._enableAfterResize = map.isVisibleInMultiMaps && map._mapSync && map.options.mapSync && map.options.mapSync.enabled && !map.options.mapSync.isMainMap;
                    if (map._enableAfterResize)
                        map._mapSync.disable(map);
                });
            },

            //Update all maps and enable zoom-history again when main-container is resized
            onResizeEnd: function(){

                if (nsMap.mainMap){
                    nsMap.mainMap._selfSetView();
                    nsMap.mainMap.invalidateSize({pan:false, debounceMoveend:true});
                }

                nsMap.visitAllMaps(function(map){
                    //Show center map position marker (if any)
                    map.$container.removeClass('hide-control-position-map-center');

                    map.invalidateSize({pan:false, debounceMoveend:true});

                    if (map._enableAfterResize){
                        map._enableAfterResize = false;
                        map._mapSync.enable(map);
                    }

                    if (map.enableHistoryOnResizeEnd){
                        map.bsZoomControl.enableHistory();
                        map.enableHistoryOnResizeEnd = false;
                    }
                });
            }
        });


        //Update search-button
        if (data.topMenu.search){
            var topMenuSearchInput = nsMap.main.topMenuObject.searchInput,
                submitSearch = function(){
                    topMenuSearchInput.select().focus();
                    nsMap.search( topMenuSearchInput.val() );
                },
                clickSearch = function(){
                    //If search-input is hidden => show search-input-modal else click == submit
                    if (topMenuSearchInput.hasClass('top-menu-element-hide'))
                        nsMap.search( null );
                    else
                        submitSearch();
                };
            nsMap.main.topMenuObject.search.on('submit', submitSearch );
            nsMap.main.topMenuObject.searchButton.on('click', clickSearch );
        }


        //Set min- and max-zoom for main-map
        $.extend(nsMap.mainMapOptions, {
            //Set default minZoom and maxZoom
            minZoom: data.map.minZoom,
            maxZoom: data.map.maxZoom
        });

        //zoomModernizrOptions = options for leaflet-zoom-modernizr
        $.extend(nsMap.mainMapOptions.zoomModernizrOptions, {
            //Set default minZoom and maxZoom
            minZoom: data.map.minZoom,
            maxZoom: data.map.maxZoom
        });

        //nsMap.layerMinMaxZoom = zoom-options for any layer
        nsMap.layerMinMaxZoom = {
            minZoom: data.map.minZoom,
            maxZoom: data.map.maxZoom
        };

        if (nsMap.hasMultiMaps){
            $.extend(nsMap.secondaryMapOptions, {
                minZoom: nsMap.mainMapOptions.minZoom,
                maxZoom: nsMap.mainMapOptions.maxZoom,
            });
            $.extend(nsMap.secondaryMapOptions.zoomModernizrOptions, {
                minZoom: data.map.minZoom,
                maxZoom: data.map.maxZoom
            });

            //backgroundLayerMinMaxZoom = zoom-options for layers visible in all zooms
            //incl outside zoom-range given in setup => allows background to be visible
            //in secondary maps when main maps is at min or max zoom and secondary maps
            nsMap.backgroundLayerMinMaxZoom = {
                minZoom: Math.max(0, data.map.minZoom - data.multiMaps.maxZoomOffset),
                maxZoom: data.map.maxZoom + data.multiMaps.maxZoomOffset
            };

            //Create multi-maps
            nsMap.multiMaps = L.multiMaps(
                $('<div/>').prependTo(nsMap.main.$mainContainer), {
                border : false,
                maxMaps: data.multiMaps.maxMaps
            });

            //Create may-sync
            nsMap.mapSync = new L.MapSync({
                inclDisabled: true, // => Show shadow-cursor and outline on disabled maps (when shadow-cursor or outline is enabled)
                mapIsVisible: function( map ){
                    //Using isVisibleInMultiMaps from multi-maps to report if a map is visible
                    return map.isVisibleInMultiMaps;
                }
            });

            //Create main map
            nsMap.mainMap = nsMap.multiMaps.addMap( nsMap.mainMapOptions );
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);


            nsMap.mapSync.add(nsMap.mainMap);


            for (var i=1; i<data.multiMaps.maxMaps; i++){
                var map = nsMap.multiMaps.addMap( $.extend({}, nsMap.secondaryMapOptions ) );

                map.on('showInMultiMaps', map.onShowInMultiMaps, map );
                map.on('hideInMultiMaps', map.onHideInMultiMaps, map );

                nsMap.mapSync.add(map, {enabled: false});

                map.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);

                map.onHideInMultiMaps();
            }
        }
        else {
            //Create single map
            nsMap.mainMap = L.map(nsMap.main.$mainContainer.get(0), nsMap.mainMapOptions);
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);

        }
    }

}(jQuery, window.moment, L, this, document));



