/****************************************************************************
_layer_NEW.js,

Template for new Layer-classes

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        defaultOptions = {


        };

    //createMapLayer = {MAPLAYER_ID: CREATE_MAPLAYER_AND_MENU_FUNCTION} See fcoo-maps/src/map-layer_00.js for description
    nsMap.createMapLayer = nsMap.createMapLayer || {};


    /***********************************************************
    MapLayer_NAME
    ***********************************************************/
    function MapLayer_NAME(options) {
        //Adjust options

        nsMap.MapLayer.call(this, options); //Or nsMap.MapLayer_ANOTHER.call(this, options);

    }
    nsMap.MapLayer_NAME = MapLayer_NAME;

    MapLayer_NAME.prototype = Object.create(nsMap.MapLayer.prototype); //OR = Object.create(nsMap.MapLayer_ANOTHER.prototype);

    MapLayer_NAME.prototype.createLayer = function(options){
        return new L.SOME_LAYER_CONSTRUCTOR(null, options);
    };


    MapLayer_NAME.prototype = $.extend({}, nsMap.MapLayer.prototype, {    //OR nsMap.MapLayer_ANOTHER.prototype, {

        //Extend METHOD
	    METHOD: function (METHOD) {
		    return function () {

                //New extended code
                ......extra code

                //Original function/method
                METHOD.apply(this, arguments);
		    }
	    } (nsMap.MapLayer.prototype.METHOD),


        //Overwrite METHOD2
        METHOD2: function(){

        },

    });


    /***********************************************************
    Add MapLayer_NAME to createMapLayer
    ***********************************************************/
    nsMap.createMapLayer[ID] = function(options, addMenu){

        adjust default options with options info mapLayerOptions

        var mapLayer = nsMap._addMapLayer(id, nsMap.MapLayer_NAME, mapLayerOptions )

        addMenu( mapLayer.menuItemOptions() ); OR list of menu-items
    };



}(jQuery, L, this, document));
