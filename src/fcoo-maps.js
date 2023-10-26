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
    To create an application call window.fcoo.map.createApplication(setup, layerMenu)
    setup            = SETUP or FILENAME = filename with SETUP
    layerMenu        = LAYERMENU or FILENAME = filename with LAYERMENU

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"


    SETUP = see src/10_fcoo-maps_setup.js for description af default values = nsMap.default_setup


    layerMenu contains the menu-structure with all the available layers.
    All layers and there menus are build using the methods and default options descripted in src/layer
    LAYERMENU = []LAYERITEM
    LAYERITEM = {ID: BOOLEAN}           - false : Do not include, true: Include with default options (=LAYEROPTIONS) given in the packages that build the layer, or
    LAYERITEM = {ID: FILENAME}          - Include with the options (=LAYEROPTIONS) given in FILENAME pared with the default options, or
    LAYERITEM = {ID: (=LAYEROPTIONS)}   - Include with (=LAYEROPTIONS) pared with the default options, or
    LAYERITEM = MMENUITEMOPTIONS        = Options for a menu-item without layer-toggle. See fcoo/jquery-bootstrap-mmenu for details.

    LAYEROPTIONS are individual for the different layers but they can also contain info on sub-menuitems. The creation of a layer can include reading a setup-file
    Eash layer-builder methods must also return options for the mmenu needed for the layer

    The layer-menu are build either in the left- (default) or right-side menu


    createApplication(...) will
        1: "Load" (*) setup and proccess the options
        2: "Load" standard setup/options for differnet parts of the application
        3: "Load" content for left- and/or right-menu
        4: "Load" layerMenu and create the layers and the options for the mmenu
        5: "Load" the added layers via there build-method
        6: Create the main structure and the left and/or right menu
        7: "Load" options.other and options.metaData (if any)
        8: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)

    *) "Load" can be loading from a file or using given or default options

    ****************************************************************************/


    /*************************************************************************
    options2promiseOptions(fileNameOrData, resolve, wait)
    Return a promise-options based on fileNameOrData
    *************************************************************************/
    function options2promiseOptions(fileNameOrData, resolve = null, wait = false){
        var result = {
                resolve: resolve,
                wait   : wait
            };
        if (window.intervals.isFileName(fileNameOrData))
            result.fileName = ns.dataFilePath(fileNameOrData);
        else
            result.data = fileNameOrData;
        return result;
    }


    /*************************************************************************
    setOptions(options, defaultOptions)
    If any id:value in options is id:true and a corresponding id:{...} exists
    in defaultOptions => Replace true with {...}
    *************************************************************************/
    function setOptions(options, defaultOptions){
        if (!defaultOptions || !$.isPlainObject(defaultOptions)  || !$.isPlainObject(options))
            return options;

        options = $.extend(true, {}, defaultOptions, options);
        $.each(options, function(indexOrId, value){
            if ((value === true) && defaultOptions[indexOrId])
                options[indexOrId] = defaultOptions[indexOrId];
        });
        return options;
    }

    /*************************************************************************
    createApplication
    *************************************************************************/
    var whenFinish = null;

    nsMap.createApplication = function(options, layerMenu = {subDir: 'setup', fileName:'fcoo-maps-menu.json'}){
        //Set viewpoint to no-scalable
        ns.viewport_no_scalable = true;

        //1: "Load" setup and proccess the options
        nsMap.layerMenu = layerMenu;

        var promiseOptions = options2promiseOptions(options);
        if (promiseOptions.fileName)
            Promise.getJSON(promiseOptions.fileName, {}, resolve_setup);
        else
            resolve_setup(promiseOptions.data);
    };


    /******************************************************************
    resolve_setup(options)
    ******************************************************************/
    function resolve_setup(options){
        //Adjust options
        nsMap.setupOptions = options = setOptions(options, nsMap.default_setup);

        nsMap.setupOptions.bottomMenu = nsMap.setupOptions.bottomMenu || nsMap.BOTTOM_MENU;

        //Adjust path
        $.each(['help', 'messages', 'warning'], function(index, id){
            var topMenuPath = options.topMenu[id];
            if (topMenuPath)
                options.topMenu[id] = {url: ns.dataFilePath( topMenuPath )};
        });

        //Add helpId to modal for globalSetting (if any)
        if (nsMap.setupOptions.topMenu.helpId.globalSetting){
            var modalOptions = ns.globalSetting.options.modalOptions = ns.globalSetting.options.modalOptions || {};
            modalOptions.helpId = nsMap.setupOptions.topMenu.helpId.globalSetting;
            modalOptions.helpButton = true;
        }

        //Get multi-maps and max-maps. Set modernizr-classes first
        window.modernizrOn ( 'single-maps-selected');
        window.modernizrOff( 'multi-maps-selected');


        function getDeviceDependendValue( obj ){
            if ($.isPlainObject(obj)){
                if (ns.modernizrDevice.isDesktop) return obj.desktop;
                if (ns.modernizrDevice.isTablet) return obj.tablet;
                return obj.mobile;
            }
            else
                return obj;
        }

        nsMap.hasMultiMaps = options.multiMaps && getDeviceDependendValue(options.multiMaps.enabled);
        if (nsMap.hasMultiMaps)
            //Get max-maps
            options.multiMaps.maxMaps = getDeviceDependendValue(options.multiMaps.maxMaps);


        //Adjust text on reset-button for the layer-menu and/or map-options
        var resetLayerText;
        if (nsMap.hasMultiMaps){
            if (options.multiMaps.maxMaps == 2)
                resetLayerText = {
                    da: 'Fravælg alle lag i begge kort',
                    en: 'Unselect all layers in both maps'
                };
            else
                resetLayerText = {
                    da: 'Fravælg alle lag i alle kort',
                    en: 'Unselect all layers in all maps'
                };
        }
        else
            resetLayerText = {
                da: 'Fravælg alle lag i kortet',
                en: 'Unselect all layers in the map'
            };

        if (nsMap.setupOptions.layerMenuOptions)
            nsMap.setupOptions.layerMenuOptions.resetText = resetLayerText;

        //2: "Load" standard setup/options for differnet parts of the application. Check if there are any resolve-function assigned in nsMap.standard
        $.each(options.standard, function(id, fileNameOrData){
            if (nsMap.standard[id])
                ns.promiseList.append( options2promiseOptions(fileNameOrData, nsMap.standard[id]) );
        });

        //Do not create MapLayer with search-results if search is not pressent AND only include search if MapLayer with is included
        if (!nsMap.setupOptions.topMenu.search)
            delete nsMap.createMapLayer[nsMap.searchMapLayerId];


        //3: "Load" content for left- and/or right-menu. If the menu isn't the layer-menu its content is loaded last to have the $-container ready
        $.each(['left', 'right'], function(index, prefix){
            var menuId = prefix+'Menu',
                menuOptions = options[menuId];
            if (!menuOptions) return;

            if (menuOptions.isLayerMenu){
                //Set the options for mmenu
                menuOptions.menuOptions =
                    $.extend({}, menuOptions.bsMenuOptions || {}, options.layerMenuOptions || {}, {list: []});

                //Set ref to the list. Menu-items are added in resolve_layerMenu
                options.layerMenuPrefix = prefix;
            }

            else {
                /*  menuOptions contains:
                      fileName: FILENAME, or
                      data    : JSON-OBJECT, or
                      content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap
                      create or resolve : function( data, $container ) - function to create the menus content in $container. Only if fileName or data is given

                    Create the resolve-function */
                var resolve, menuResolve;
                if (menuOptions.content)
                    resolve = function( content ){
                        nsMap.main[menuId].$menu._bsAddHtml( content );
                    };
                else {
                    menuResolve = menuOptions.resolve || menuOptions.create;
                    resolve = function( data ){
                        menuResolve( data, nsMap.main[menuId].$menu );
                    };
                }

                ns.promiseList.appendLast({
                    fileName: menuOptions.fileName,
                    data    : menuOptions.data || menuOptions.content,
                    resolve : resolve
                });
            }
        });

        //4: "Load" layerMenu and create the layers and the options for the mmenu
        nsMap.layerMenu = nsMap.layerMenu || options.layerMenu;

        if (nsMap.layerMenu)
            //5: "Load" the added layers via there build-method
            ns.promiseList.append( options2promiseOptions( nsMap.layerMenu, resolve_layerMenu, true ) );


        //6: Create the main structure and the left and/or right menu. Is excecuded after the layer-menus and before lft/rigth menu creation
        ns.promiseList.prependLast({
            data   : 'none',
            resolve: createFCOOMap
        });


        //7: Load files in options.other and options.metaData (if any)
        $.each(options.other || [], function(index, otherOptions){
            ns.promiseList.appendLast(otherOptions);
        });
        ns.promiseList.appendLast(options.metadata || options.metaData);


        //8: Load settings in fcoo.appSetting and globalSetting and call options.finally (if any)
        ns.promiseList.options.finally = promise_all_finally;
        whenFinish = options.finally;

        //Load all setup-files
        Promise.defaultPrefetch();
        ns.promiseList_getAll();
    }


    /******************************************************************
    resolve_layerMenu(listOrMenus)
    5: "Load" the added layers via there build-method
    ******************************************************************/
    function resolve_layerMenu(listOrMenus){
        /*********************************************
        function convertList(listOrMenus)
        listOrMenus =
            list-mode = []MENUITEM. MWENUITEM = "MENU-ID" or {"MENU-ID": true/false/MENU-OPTIONS}
        or
            obj-mode  = {MENU-ID: MENU-OPTIONS-2}

        MENU-OPTIONS / MENU-OPTIONs-2 = {
            id: STRING (Only in MENU-OPTIONS)
            icon, text,
            list    : sub-menus in list-mode, or
            submenus: sub-menus in obj-mode
        }

        Convert menu-items on the form "MENU_ID" or {"MENU_ID": true/false/options} => {id: "MENU_ID", options: true/false/options}
        *********************************************/
        function adjustMenuItem( id, menuItem ){
            //MENU-ITEM == false or empty
            if (!menuItem)
                return false;


            //MENU-ITEM = STRING
            if ($.type(menuItem) == 'string')
                return {
                    id            : menuItem,
                    isMapLayerMenu: true,
                    options       : true
                };

            //If the menuItem only contains ONE element its assumed that it is {"MENU_ID": true/false/options}
            var keys = Object.keys(menuItem);
            if (keys.length == 1){
                id = keys[0];
                return {
                    id            : id,
                    isMapLayerMenu: true,
                    options       : menuItem[id]
                };
            }

            menuItem.id = menuItem.id || id;
            //Convert/adjust the items submenus (in list or submenus)
            menuItem.list = convertList( menuItem.list || menuItem.submenus );
            delete menuItem.submenus;

            return menuItem;

        }
        //*************************************************************
        function convertList(listOrSubmenus){
            if (!listOrSubmenus)
                return null;

            var result = [];
            if ($.isArray(listOrSubmenus))
                $.each(listOrSubmenus, function(index, menuItem){
                    var adjustedMenuItem = adjustMenuItem(null, menuItem);
                    if (adjustedMenuItem)
                        result.push( adjustedMenuItem );
                });

            if ($.isPlainObject(listOrSubmenus))
                $.each(listOrSubmenus, function(id, menuItem){
                    var adjustedMenuItem = adjustMenuItem(id, menuItem);
                    if (adjustedMenuItem)
                        result.push( adjustedMenuItem );
                });


            return result;
        }
        //*********************************************

        //Append menu-items in menuList to the list with item for the layer-menu
        var layerMenuOptions = nsMap.setupOptions[nsMap.setupOptions.layerMenuPrefix+'Menu'].menuOptions;

        layerMenuOptions.list = layerMenuOptions.list.concat( convertList(listOrMenus) );


        /*********************************************
        nsMap.createMapLayer contains {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description

        nsMap.createMapLayerAndMenu(list) will create the mapLayer and replase/add menu-item-options to list

        Eq. list[3] = {id: 'NAVIGATION_WARNING', isMapLayerMenu: true}
        Some mapLayer "creator" has set nsMap.createMapLayer['NAVIGATION_WARNING'] = function(options, addMenu){...}
        This function is called to create the mapLayer and set the new menu-item-options (via addMenu-function)
        The code for nsMap.createMapLayerAndMenu is in src/layer/map-layer_00.js
        *********************************************/
        nsMap.createMapLayerAndMenu(layerMenuOptions.list);

    }

    /*************************************************************************
    createFCOOMap()
    6: Create the main structure and the left and/or right menu
    *************************************************************************/
    function createFCOOMap(){
        var setupOptions = nsMap.setupOptions;

        //Create main structure
        nsMap.main = ns.createMain({
            mainContainerAsHandleContainer: true,

            applicationName     : setupOptions.applicationName,
            applicationHeader   : setupOptions.applicationHeader,
            header              : setupOptions.header,

            //top-, left-, right-, and bottom-menus
            topMenu            : setupOptions.topMenu,

            leftMenu           : setupOptions.leftMenu,
            keepLeftMenuButton : setupOptions.keepLeftMenuButton,

            rightMenu          : setupOptions.rightMenu,
            keepRightMenuButton: setupOptions.keepRightMenuButton,

            bottomMenu         : setupOptions.bottomMenu,

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


        //Link layerMenu items and the mapLayer
        function link(menuItem){
            if (menuItem.options.mapLayerId){
                menuItem.mapLayer = nsMap.getMapLayer(menuItem.options.mapLayerId);
                menuItem.mapLayer.menuItem = menuItem;
            }
            var subItem = menuItem.first;
            while (subItem){
                link(subItem);
                subItem = subItem.next;
            }
        }

        if (nsMap.setupOptions.layerMenuPrefix)
            link( nsMap.main[nsMap.setupOptions.layerMenuPrefix+'Menu'].mmenu );

        //Update search-button
        if (setupOptions.topMenu.search){
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
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        });

        //zoomModernizrOptions = options for leaflet-zoom-modernizr
        $.extend(nsMap.mainMapOptions.zoomModernizrOptions, {
            //Set default minZoom and maxZoom
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        });

        //nsMap.layerMinMaxZoom = zoom-options for any layer
        nsMap.layerMinMaxZoom = {
            minZoom: setupOptions.map.minZoom,
            maxZoom: setupOptions.map.maxZoom
        };

        if (nsMap.hasMultiMaps){

            $.extend(nsMap.secondaryMapOptions, {
                minZoom: nsMap.mainMapOptions.minZoom,
                maxZoom: nsMap.mainMapOptions.maxZoom,
            });
            $.extend(nsMap.secondaryMapOptions.zoomModernizrOptions, {
                minZoom: setupOptions.map.minZoom,
                maxZoom: setupOptions.map.maxZoom
            });

            //backgroundLayerMinMaxZoom = zoom-options for layers visible in all zooms
            //incl outside zoom-range given in setup => allows background to be visible
            //in secondary maps when main maps is at min or max zoom and secondary maps
            nsMap.backgroundLayerMinMaxZoom = {
                minZoom: Math.max(0, setupOptions.map.minZoom - setupOptions.multiMaps.maxZoomOffset),
                maxZoom: setupOptions.map.maxZoom + setupOptions.multiMaps.maxZoomOffset
            };

            //Create multi-maps
            nsMap.multiMaps = L.multiMaps(
                $('<div/>').prependTo(nsMap.main.$mainContainer), {
                border : false,
                maxMaps: setupOptions.multiMaps.maxMaps
            });

            //Create may-sync
            nsMap.mapSync = new L.MapSync({
                inclDisabled: true, // => Show shadow-cursor and outline on disabled maps (when shadow-cursor or outline is enabled)
                mapIsVisible: function( map ){
                    //Using isVisibleInMultiMaps from multi-maps to report if a map is visible
                    return map.isVisibleInMultiMaps;
                },
                //maxZoomOffset = Expected max different in zoom-level between any maps. Since it can be +/- nsMap.setupOptions.multiMaps.maxZoomOffset => 2*
                maxZoomOffset: 2 * nsMap.setupOptions.multiMaps.maxZoomOffset,


            });

            //Create main map
            nsMap.mainMap = nsMap.multiMaps.addMap( nsMap.mainMapOptions );
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);


            nsMap.mapSync.add(nsMap.mainMap);


            for (var i=1; i<setupOptions.multiMaps.maxMaps; i++){
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

    /******************************************************************
    promise_all_finally()
    8: Load settings in fcoo.appSetting and globalSetting
    ******************************************************************/
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









}(jQuery, window.moment, L, this, document));



