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


    /***********************************************************
    Layer_NAME
    ***********************************************************/
    function Layer_NAME(options) {
        //Adjust options

        nsMap.MapLayer.call(this, options); //Or nsMap.MapLayer_ANOTHER.call(this, options);

    }
    nsMap.Layer_NAME = Layer_NAME;

    Layer_NAME.prototype = Object.create(nsMap.MapLayer.prototype); //OR = Object.create(nsMap.MapLayer_ANOTHER.prototype);

    Layer_NAME.prototype.createLayer = function(options){
        return new L.SOME_LAYER_CONSTRUCTOR(null, options);
    };


    Layer_NAME.prototype = $.extend({}, nsMap.MapLayer.prototype, {    //OR nsMap.MapLayer_ANOTHER.prototype, {

        //Extend METHOD
	    METHOD: function (METHOD) {
		    return function () {

                //New extended code
                ......extra code

                //Original function/method
                METHOD.apply(this, arguments);
		    }
	    } (nsMap.MapBaseLayer.prototype.METHOD),


        //Overwrite METHOD2
        METHOD2: function(){

        },

    });

}(jQuery, L, this, document));
