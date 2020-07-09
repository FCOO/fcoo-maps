/****************************************************************************
fcoo-maps-create-main.js,
****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},
        default_setup = {
            applicationName: {da:'Dansk titel', en:'English title'},


            topMenu: {
                search   : false,                                   //true if use search
                nominatim: 'https://nominatim.openstreetmap.org',   //Path to OpenStreetMap Nominatin-service
                /*
                Path to messages-files. Two versions:
                1: Relative path locally e.q. "data/info.json"
                2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
                   E.q. {subDir: "theSubDir", fileName:"fileName.json"} => "https://app.fcoo.dk/static/theSubDir/fileName.json"
                */
                help     : null, //null or STRING or {subDir:STRING, fileName:STRING}
                messages : null, //null or STRING or {subDir:STRING, fileName:STRING}
                warning  : null, //null or STRING or {subDir:STRING, fileName:STRING}

                helpId: {   //id in help message-file for different default modals
                    globalSetting  : '',  //Modal with fcoo.globalSetting
                    mapSetting     : '',  //Modal with settings for a single map
                    multiMapSetting: '',  //Modal with multi-maps setting
                },

                //Add button before setting-button with settings for map(s)
                preSetting: {
                    icon   : ns.mapSettingIcon,
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
                allowDifferentTime: false, //If true the different maps can have differnet time - relative to the main map eq. +2h
            }
        };


    /*************************************************************************
    createFCOOMap
    *************************************************************************/
    nsMap.createFCOOMap = function( data ){
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

/*/TEST
data.leftMenuButtons.bookmark = function(){ alert('bookmark'); }
data.leftMenuButtons.share = function(){ alert('share'); }
data.leftMenuButtons.load = function(){ alert('load'); }
data.leftMenuButtons.save = function(){ alert('save'); }
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
                nsMap.mainMap._selfSetView();
                nsMap.mainMap.invalidateSize({pan:false, debounceMoveend:true});

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

nsMap.mainMap.setView([55.651, 12.757], 6); //HER TODO skal hentes fra gemte options
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', nsMap.layerMinMaxZoom).addTo(nsMap.mainMap);

            nsMap.mapSync.add(nsMap.mainMap);


            for (var i=1; i<data.multiMaps.maxMaps; i++){
                var map = nsMap.multiMaps.addMap( $.extend({}, nsMap.secondaryMapOptions ) );

                map.on('showInMultiMaps', map.onShowInMultiMaps, map );
                map.on('hideInMultiMaps', map.onHideInMultiMaps, map );

                nsMap.mapSync.add(map, {enabled: false});

map.setView([56.2, 11.5], 4); //HER skal hentes fra gemte options
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', nsMap.backgroundLayerMinMaxZoom).addTo(map);

                map.onHideInMultiMaps();
            }
        }
        else {
            //Creae single map
            nsMap.mainMap = L.map(nsMap.main.$mainContainer.get(0), nsMap.mainMapOptions);
            nsMap.mainMap.$container = $(nsMap.mainMap._container);

nsMap.mainMap.setView([56.2, 11.5], 6);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', data.maps).addTo(nsMap.mainMap);
        }

/* TEST
var niord = new L.GeoJSON.Niord({domain:'fa fe nw nm'});
niord.addTo(nsMap.mainMap);
*/
    };


}(jQuery, window.moment, L, this, document));



