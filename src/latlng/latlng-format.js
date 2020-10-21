/****************************************************************************
latlng-format.js
****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";


    /***************************************************
    Extend the format 'latlng' from fcoo-value-format
    to also accept Leaflet.LatLng as input
    ***************************************************/
    var latlngFormat = $.valueFormat.formats['latlng'];

    latlngFormat.convert = function(input){
        return input instanceof L.LatLng ? [input.lat, input.lng] : input;
    };

    /* convertBack not used since no element only contains 'copy' of input-object
    latlngFormat.convertBack = function(latLngArray){
        return latLngArray ? L.latLng(latLngArray) : null;
    }
    */

}(jQuery, L, this, document));



