/****************************************************************************
layer_z-index.js,

fcoo.map.zIndex contains constants with z-index for different type of panes

------------------------------------------------------------------------------
Leaflet has one parent-pane and six different panes for different layers.
See https://leafletjs.com/reference.html#map-pane

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


The following methods are avaiable to get/create new panes with z-index relative to other of the standard Leaflet panes above

L.Map.getPaneBelow(paneId) Create and return a pane named paneId+'below' that gets zIndex just below pane with paneId

L.Map.getPaneAbove(paneId) Create and return a pane named paneId+'above' that gets zIndex just above pane with paneId

L.Map._getPaneDeltaZIndex(paneId, postfix, deltaZIndex) Create and return a pane named paneId+postfix that gets zIndex deltaZIndex (+/-) relative to pane with paneId


****************************************************************************/

(function ($, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    nsMap.zIndex     = {};
    nsMap.zIndexList = [];

    ns.promiseList.append({
        fileName: {subDir: "layers", fileName: "layer-z-index.yaml"},
        format  : 'YAML',
        resolve : function( list ){

            //DEMO/TEST in LAYERZINDEX
            list = window.LAYERZINDEX || list;

            let zIndex = 2000 + list.length * 1000;
            list.forEach( rec => {
                let id = rec.toUpperCase();
                nsMap.zIndex[id] = zIndex;
                nsMap.zIndexList.push({id: id, zIndex: zIndex});
                zIndex = zIndex - 1000;
            });
            nsMap.zIndexList.sort( (rec1, rec2) => {return rec2.zIndex - rec1.zIndex; });
        }
    });

    //Methods for z-index
    nsMap.getZIndex = function(id, delta=0){
        return (nsMap.zIndex[id.toUpperCase()] || 0) + delta;
    };

    /* Previous const that seems to be used
    //Z-index for layers in overlayPane and markerPane. Typical geoJSON-layer
    nsMap.zIndex.NAVIGATION_PILOT_BOARDING_POSITIONS = 100;
    nsMap.zIndex.NAVIGATION_NIORD = 90;
    */

}(jQuery, this, document));
