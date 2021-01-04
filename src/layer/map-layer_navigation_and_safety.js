/****************************************************************************
layer_navegation_and_safety.js,

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    createNavigationAndSafety
    Load and create all layers regarding navigation and safety
    ***********************************************************/
    nsMap.createNavigationAndSafety = function(groupIndex){
        ns.promiseList.append({
            fileName: {subDir:"navigation", fileName:"navigation_and_safety.json"},
            resolve  : function(layerList){
                $.each(layerList, function(id, options){
                    var mapLayerOptions =
                            $.extend({
                                id    : id,
                                index : groupIndex++,
                                icon  : 'fas fa-slash fa-navigation',
                                zIndex: nsMap.zIndex.STATIC_LAYER_WATER,
                            },
                            options
                        );
                    nsMap._addMapLayer(id, nsMap.MapLayer_static, mapLayerOptions );
                });
            }
        });
    };

}(jQuery, L, this, document));
