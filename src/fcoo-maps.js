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
    To create an application call window.fcoo.map.createApplication(options, fileNameOrMenuOptions)
    options                = OPTIONS or FILENAME = filename with OPTIONS
    fileNameOrMenuOptions  = MENU-OPTIONS or FILENAME with menu-options. Default = FCOO Standard menu (see fcoo-applicaion)

    FILENAME = Path to file. Two versions:
        1: Relative path locally e.q. "data/info.json"
        2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
        E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

    OPTIONS = see src/10_fcoo-maps_setup.js and fcoo-application for description af default values = ns.defaultApplicationOptions

    The layer-menu are build either in the left- (default) or right-side menu

    createApplication(...) will use createApplication from fcoo-application to create the application with layer-menu and map(s)

    ****************************************************************************/

    /*************************************************************************
    createApplication
    *************************************************************************/
    nsMap.createApplication = function(options, fileNameOrMenuOptions){
        /*
        When resizing the main-container:
        - Turn zoom-history off to avoid many entries
        - Save all maps center and zoom
        */
        options.onResizeStart = function(){
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
        };

        //Update all maps and enable zoom-history again when main-container is resized
        options.onResizeEnd = function(){
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
        };

        //Create the application
        let menuOptions = {
                //Standard FCOO menu
                ownerList            : nsMap.createMapLayer,
                finallyFunc          : fcoo_maps_menu_finally,
                fileNameOrMenuOptions: fileNameOrMenuOptions
            };

        if (fileNameOrMenuOptions === false)
            menuOptions = null;

        ns.createApplication(
            options,
            fcoo_maps_create_content,
            menuOptions,
            fcoo_maps_resolve_setup,
            nsMap
        );
    };

    /*************************************************************************
    fcoo_maps_menu_finally( menuList, menuOptions )
    *************************************************************************/
    function fcoo_maps_menu_finally(/* menuList, menuOptions */){
        //Not used at the moment
    }

    /*************************************************************************
    fcoo_maps_resolve_setup( options )
    *************************************************************************/
    function fcoo_maps_resolve_setup( options ){
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

        if (options.layerMenuOptions)
            options.layerMenuOptions.resetText = resetLayerText;

        //Do not create MapLayer with search-results if search is not pressent AND only include search if MapLayer with is included
        if (!options.topMenu.search)
            delete nsMap.createMapLayer[nsMap.searchMapLayerId];
    }

    /*************************************************************************
    fcoo_maps_create_content($mainContainer, setupOptions)
    *************************************************************************/
    function fcoo_maps_create_content($mainContainer, setupOptions){
        //Link standard-menu-items and the corresponding mapLayer
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

        if (nsMap.setupOptions.standardMenuId)
            link( nsMap.main[nsMap.setupOptions.standardMenuId].mmenu );

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
                $('<div/>').prependTo(/*nsMap.main.*/$mainContainer), {
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
            nsMap.mainMap = L.map($mainContainer.get(0), nsMap.mainMapOptions);
            nsMap.mainMap.setView(nsMap.defaultCenterZoom.center, nsMap.defaultCenterZoom.zoom);
        }
    }
}(jQuery, window.moment, L, this, document));



