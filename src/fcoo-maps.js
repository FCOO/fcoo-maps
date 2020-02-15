/****************************************************************************
    fcoo-maps.js,

    (c) 2020, FCOO

    https://github.com/FCOO/fcoo-maps
    https://github.com/FCOO

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {};


    ns.createFCOOMap = function( data ){
        //Create main structure
        ns.main = window.fcoo.createMain({
            mainContainerAsHandleContainer: true,
            topMenu             : data.topMenu,
            leftMenu            : data.leftMenu,
            keepLeftMenuButton  : data.keepLeftMenuButton,
            rightMenu           : data.rightMenu,
            keepRightMenuButton : data.keepRightMenuButton,

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
                window.fcoo.visitAllMaps(function(map){
                    //Disable history-list during resizing
                    if (map.bsZoomControl)
                        map.bsZoomControl.disableHistory();

                    //Hide center map position marker (if any)
                    map.$container.addClass('hide-control-position-map-center');

                    //If map visible and sync-enabled => disable it while resizing (Not quit sure why it works....)
                    map._enableAfterResize = map.isVisibleInMultiMaps && map._mapSync && map.options.mapSync && map.options.mapSync.enabled && !map.options.mapSync.isMainMap;
                    if (map._enableAfterResize)
                        map._mapSync.disable(map);
                });
            },
/*
            onResizing: function(){
                ns.mainMap._selfSetView();
                ns.mainMap.invalidateSize({pan:false, debounceMoveend:true});
            },
*/
            //Update all maps and enable zoom-history again when main-container is resized
            onResizeEnd: function(){
                ns.mainMap._selfSetView();
                ns.mainMap.invalidateSize({pan:false, debounceMoveend:true});

                window.fcoo.visitAllMaps(function(map){
                    //Show center map position marker (if any)
                    map.$container.removeClass('hide-control-position-map-center');

                    map.invalidateSize({pan:false, debounceMoveend:true});

                    if (map._enableAfterResize){
                        map._enableAfterResize = false;
                        map._mapSync.enable(map);
                    }

                    if (map.bsZoomControl)
                        map.bsZoomControl.enableHistory();
                });
            }
        });

        //Crerate div in header of left menu to hole settings-buttons
        ns.main.leftMenu.$preMenu.addClass('justify-content-between');
        ns.main.$settingButtons = $('<div/>').appendTo(ns.main.leftMenu.$preMenu);

        //Update search-button
        if (data.topMenu.search){
            var searchFunc = function(){
                    ns.search( ns.main.topMenuObject.searchInput.val() );
                    ns.main.topMenuObject.searchInput.select().focus();
                };
            ns.main.topMenuObject.search.on('submit', searchFunc );
            ns.main.topMenuObject.searchButton.on('click', searchFunc );
        }


        //Set min- and max-zoom for main-map
        $.extend(ns.mainMapOptions, {
            //Set default minZoom and maxZoom
            minZoom: data.map.minZoom,
            maxZoom: data.map.maxZoom
        });
        //ns.layerMinMaxZoom = zoom-options for any layer
        ns.layerMinMaxZoom = {
            minZoom: data.map.minZoom,
            maxZoom: data.map.maxZoom
        };

        if (data.multiMaps && data.multiMaps.enabled){

//TEST
$.bsButton({
    icon  : ns.settingIcon('fa-map'),
    square: true,
    onClick: ns.editMultiAndSyncMapOptions
}).appendTo( ns.main.$settingButtons );


            $.extend(ns.secondaryMapOptions, {
                minZoom: ns.mainMapOptions.minZoom,
                maxZoom: ns.mainMapOptions.maxZoom,
            });

            //backgroundLayerMinMaxZoom = zoom-options for layers visible in all zooms
            //incl outside zoom-range given in setup => allows background to be visible
            //in secondary maps when main maps is at min or max zoom and secondary maps
            ns.backgroundLayerMinMaxZoom = {
                minZoom: Math.max(0, data.map.minZoom - data.multiMaps.maxZoomOffset),
                maxZoom: data.map.maxZoom + data.multiMaps.maxZoomOffset
            };

            //Create multi-maps
            ns.multiMaps = L.multiMaps(
                $('<div/>').prependTo(ns.main.$mainContainer), {
                border : false,
                maxMaps: data.multiMaps.maxMaps
            });

            //Create may-sync
            var mapSync_Options = {
                    showOutline     : false, //HER TODO skal hentes fra gemte options
                    showShadowCursor: false, //HER TODO skal hentes fra gemte options
                    inclDisabled    : true, // => Show shadow-cursor and outline on disabled maps (when shadow-cursor or outline is enabled)
                    mapIsVisible    : function( map ){
                        //Using isVisibleInMultiMaps from multi-maps to report if a map is visible
                        return map.isVisibleInMultiMaps;
                    }
                };
            ns.mapSync = new L.MapSync(mapSync_Options);

            //Create main map
            ns.mainMap = ns.multiMaps.addMap( ns.mainMapOptions );
            ns.mainMap.setView([55.651, 12.757], 6); //HER TODO skal hentes fra gemte options

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', ns.layerMinMaxZoom).addTo(ns.mainMap);
            ns.mapSync.add(ns.mainMap);

            for (var i=1; i<data.multiMaps.maxMaps; i++){
                var options = $.extend({}, ns.secondaryMapOptions ),
                    mapSyncOptions = {
                        enabled   : false, //HER TODO skal hentes fra gemte options
                        zoomOffset: 0      //HER TODO skal hentes fra gemte options
                    };
                options.mapSyncOptions.active = mapSyncOptions.enabled;

                var map = ns.multiMaps.addMap( options );

                map.on('showInMultiMaps', map.onShowInMultiMaps, map );
                map.on('hideInMultiMaps', map.onHideInMultiMaps, map );

                ns.mapSync.add(map, mapSyncOptions);

                map.setView([56.2, 11.5], 4); //HER skal hentes fra gemte options

                L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', ns.backgroundLayerMinMaxZoom).addTo(map);

                map.onHideInMultiMaps();
            }

            ns.setSyncMapOptions( mapSync_Options );

            ns.multiMaps.set('1'); //HER TODO skal hentes fra gemte options
        }
        else {
            //Creae single map
            ns.mainMap = L.map(ns.main.$mainContainer.get(0), ns.mainMapOptions);
            ns.mainMap.setView([56.2, 11.5], 6);
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', data.maps).addTo(ns.mainMap);
        }
    };


}(jQuery, L, this, document));



