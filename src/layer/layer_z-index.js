/****************************************************************************
layer_z-index.js,

fcoo.map.zIndex contains constants with z-index for different type of panes

------------------------------------------------------------------------------
Leaflet has one parent-pane and six different panes for different layers.
See https://leafletjs.com/reference-1.7.1.html#map-overlaypane

Pane	    Z-index	Description
mapPane	      auto	Pane that contains all other map panes
tilePane	  200	Pane for GridLayers and TileLayers
overlayPane   400	Pane for vectors (Paths, like Polylines and Polygons), ImageOverlays and VideoOverlays
shadowPane	  500	Pane for overlay shadows (e.g. Marker shadows)
markerPane	  600	Pane for Icons of Markers
tooltipPane	  650	Pane for Tooltips.
popupPane	  700	Pane for Popups.


Map.createPane(<String> name, <HTMLElement> container?)
Map.getPane(<String|HTMLElement> pane)	HTMLElement
Map.getPanes()
------------------------------------------------------------------------------


All tile-layers (and other grid-layers) has options.zIndex controling the order

If a Layer contains Marker and/or polylines etc. each layer gets its own pane inside
overlayPane, shadowPane, and/or markerPane with z-index given directly in options or
via the layers id in fcoo.map.zIndex[id]

****************************************************************************/
(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    nsMap.zIndex = {

        //Z-index for layers in overlayPane and markerPane. Typical geoJSON-layer
        'NAVIGATION_PILOT_BOARDING_POSITIONS': 100,


        'NAVIGATION_NIORD'                   : 90,


        //Z-index for tile-layer in tilePane


        //BACKGROUND_LAYER_COASTLINE: Must be above all dynamic layers
        "BACKGROUND_LAYER_COASTLINE": 2000,




        //STATIC_LAYER = Default static layer eq. EEZ, VTS-lines, SAR-areas etc.
        "STATIC_LAYER_LAND"         : 1000,

        "STATIC_LAYER"              : 900,  //TODO




        //BACKGROUND_LAYER_LAND, BACKGROUND_LAYER_WATER = Layer with background land and water
        "BACKGROUND_LAYER_LAND"     : 500,

        "STATIC_LAYER_WATER"        : 400,




        "BACKGROUND_LAYER_WATER"    : 300   //TODO


    };

//sæt window.L_GEOPOLYLINE_ZINDEX = 100; i relation til de andre ting TODO


}(jQuery, this, document));
