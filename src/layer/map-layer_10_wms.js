/****************************************************************************
layer_wms.js

Classes to creraet static and dynamic WMS-layers

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /***********************************************************
    MapLayer_wms - Creates a MapLayer with a wms-layer
    options = {
        icon,
        text,
        static      : BOOLEAN
        creatLayer  : FUNCTION - Create the Leaflet-layer
        layerOptions: {
            service     : STRING ("WMS")            (1)
            request     : STRING ("GetMap")         (1)
            dataset     : STRING,                   (1)
            layers      : STRING, OBJECT or ARRAY   (1)
            styles      : STRING, OBJECT or ARRAY   (1)
            cmap        : STRING,                   (1)
            LayerConstructor                        (1)
            etc.
        }

        zIndex      : NUMBER
        deltaZIndex : NUMBER (optional)
        minZoom     : NUMBER (optional)
        maxZoom     : NUMBER (optional)
    }
    (1) Can for convenience also be set direct in options
    ***********************************************************/
    function MapLayer_wms(options) {
        //Move options regarding tileLayer into layerOptions (if any)
        options.layerOptions = options.layerOptions || {};

        ['service', 'request', 'dataset', 'layers', 'styles', 'cmap', 'zIndex', 'deltaZIndex', 'minZoom', 'maxZoom', 'LayerConstructor'].forEach( id => {
            if (options[id] !== undefined){
                options.layerOptions[id] = options.layerOptions[id] || options[id];
                delete options[id];
            }
        });
        nsMap.MapLayer.call(this, options);
    }
    nsMap.MapLayer_wms = MapLayer_wms;

    MapLayer_wms.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_wms.prototype.createLayer = nsMap.layer_wms;

    /***********************************************************
    MapLayer_wms_static - Creates a MapLayer with static WMS-layer
    Also as MapLayer_static for backward combability
    ***********************************************************/
    function MapLayer_wms_static(options) {
        nsMap.MapLayer_wms.call(this, options);
    }
    nsMap.MapLayer_wms_static = nsMap.MapLayer_static = MapLayer_wms_static;

    MapLayer_wms_static.prototype = Object.create(nsMap.MapLayer_wms.prototype);
    MapLayer_wms_static.prototype.createLayer = nsMap.layer_wms_static;


    /***********************************************************
    MapLayer_wms_dynamic - Creates a MapLayer with dynamic WMS-layer
    Also as MapLayer_dynamic for backward combability
    ***********************************************************/
    function MapLayer_wms_dynamic(options) {
        nsMap.MapLayer_wms.call(this, options);
    }
    nsMap.MapLayer_wms_dynamic = nsMap.MapLayer_dynamic = MapLayer_wms_dynamic;

    MapLayer_wms_dynamic.prototype = Object.create(nsMap.MapLayer_wms.prototype);
    MapLayer_wms_dynamic.prototype.createLayer = nsMap.layer_wms_dynamic;


    MapLayer_wms_dynamic.prototype.createLayer = nsMap.layer_wms_dynamic;





}(jQuery, L, this, document));
