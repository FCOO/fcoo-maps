/****************************************************************************
search-mapLayer.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    /***********************************************************
    MapLayer_SearchResult
    ***********************************************************/
    var MapLayer_SearchResult = function(options = {}) {


        nsMap.MapLayer.call(this, options);
    };

var testP = 12;
    MapLayer_SearchResult.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_SearchResult.prototype = $.extend({}, nsMap.MapLayer.prototype, {

//        defaultMarkerOptions: nsMap.defaultMarkerOptions,

        /*****************************************************
        createLayer
        *****************************************************/
        createLayer: function(layerOptions, map){

console.log('createLayer', map)


            var layerGroup =
                    L.layerGroup({
                        //pane: 'MANGLER - TODO'
                    });
testP = testP + .5;

            var test = L.marker([55, testP]);
layerGroup.addLayer(test);

            return layerGroup;
        },






    });


    /***********************************************************
    Add MapLayer_SearchResult to createMapLayer
    ***********************************************************/
    var id = "SEARCH-RESULT";
    nsMap.createMapLayer[id] = function(options, addMenu){
        var mapLayer = nsMap._addMapLayer(id, MapLayer_SearchResult, {
                icon: 'fa-search',
                text: {da: 'Søgningsresultater', en: 'Search Results'}
            });
        addMenu( mapLayer.menuItemOptions() );
    };

}(jQuery, L, this.i18next, this, document));