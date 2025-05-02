/****************************************************************************
layer_wms.js

Classes to creraet static and dynamic WMS-layers

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
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
        layerOptions: OBJECT
        layers      : STRING,
        zIndex      : NUMBER
        deltaZIndex : NUMBER (optional)
        minZoom     : NUMBER (optional)
        maxZoom     : NUMBER (optional)
    }
    ***********************************************************/
    function MapLayer_wms(options) {
        //Move options regarding tileLayer into layerOptions
        options.layerOptions = options.layerOptions || {};
        ['layers', 'zIndex', 'deltaZIndex', 'minZoom', 'maxZoom', 'LayerConstructor'].forEach( id => {
            options.layerOptions[id] = options[id];
            delete options[id];
        });
        nsMap.MapLayer.call(this, options);
    }
    nsMap.MapLayer_wms = MapLayer_wms;

    MapLayer_wms.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_wms.prototype.createLayer = nsMap.layer_wms;

    /***********************************************************
    MapLayer_wms_static - Creates a MapLayer with static WMS-layer
    Also as MapLayer_static for backward combability
    options = {
        icon,
        text,
        layers     : STRING,
        zIndex     : NUMBER
        deltaZIndex: NUMBER (optional)
        minZoom    : NUMBER (optional)
        maxZoom    : NUMBER (optional)
    }
    ***********************************************************/
    function MapLayer_wms_static(options) {
        nsMap.MapLayer_wms.call(this, options);
    }
    nsMap.MapLayer_wms_static = nsMap.MapLayer_static = MapLayer_wms_static;

    MapLayer_wms_static.prototype = Object.create(nsMap.MapLayer_wms.prototype);
    MapLayer_wms_static.prototype.createLayer = nsMap.layer_wms_dynamic;





}(jQuery, L, this, document));
