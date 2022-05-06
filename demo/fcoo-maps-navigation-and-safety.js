/****************************************************************************
    fcoo-maps-navigation-and-safety

    (c) 2021, FCOO

    https://github.com/FCOO/fcoo-maps-navigation-and-safety
    https://github.com/FCOO

****************************************************************************/



(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description
    nsMap.createMapLayer = nsMap.createMapLayer || {};


    /***********************************************************
    Load and create all layers regarding navigation and safety
    ***********************************************************/
    nsMap.createMapLayer['NAVIGATION_AND_SAFETY'] = function(options, addMenu){
        ns.promiseList.append({
            fileName: {subDir:"navigation", fileName:"navigation_and_safety.json"},
            resolve  : function(layerList){
                var menuList = [];
                $.each(layerList, function(id, options){
                    var mapLayerOptions =
                            $.extend({
                                id    : id,
                                //index : groupIndex++, MANGLER Hvad bruges den til????????????????
                                icon  : 'fas fa-slash fa-navigation',
                                zIndex: nsMap.zIndex.STATIC_LAYER_WATER,
                            },
                            options
                        );
                    menuList.push( nsMap._addMapLayer(id, nsMap.MapLayer_static, mapLayerOptions ).menuItemOptions() );
                });
                addMenu(menuList);
            }
        });
    };

}(jQuery, L, this, document));
