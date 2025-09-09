# layer-z-index.json

layer-z-index.json contains constants with z-index for different type of panes and layers

## Leaflet 
Leaflet has one parent-pane and six different panes for different layers.

See https://leafletjs.com/reference.html#map-pane

| Pane    | Z-index | Description |
| ------- | :-----: | ----------- |
| mapPane     | auto  | Pane that contains all other map panes |
| tilePane    | 200 | Pane for GridLayers and TileLayers |
| overlayPane | 400 | Pane for vectors (Paths, like Polylines and  Polygons), ImageOverlays and VideoOverlays |
| shadowPane  | 500 | Pane for overlay shadows (e.g. Marker shadows) |
| markerPane  | 600 | Pane for Icons of Markers |
| tooltipPane | 650 | Pane for Tooltips. |
| popupPane   | 700 | Pane for Popups. |

### Methods

    Map.createPane(<String> name, <HTMLElement> container?)
    Map.getPane(<String|HTMLElement> pane)	HTMLElement
    Map.getPanes()

## FCOO-applications
All tile-layers (and other grid-layers) has `options.zIndex` controlling the order

If a Layer contains Marker and/or polylines etc. each layer gets its own pane inside
overlayPane, shadowPane, and/or markerPane with z-index given directly in options or
via the layers id in fcoo.map.zIndex[id]

### Methods
The following methods are avaiable to get/create new panes with z-index relative to other of the standard Leaflet panes above

    L.Map.getPaneBelow(paneId) 
    //Create and return a pane named paneId+'below' that gets zIndex just below pane with paneId
    
    L.Map.getPaneAbove(paneId) 
    //Create and return a pane named paneId+'above' that gets zIndex just above pane with paneId
    
    L.Map._getPaneDeltaZIndex(paneId, postfix, deltaZIndex) 
    //Create and return a pane named paneId+postfix that gets zIndex deltaZIndex (+/-) relative to pane with paneId

### z-index
The file `layer-z-index.json` contains a sorteret list of ids and description.
The packages [fcoo-maps](https://github.com/FCOO/fcoo-maps) will read the file and create constants in name-space `window.fcoo.map.zIndex` 
#### Example
In `layer-z-index.json` : `{"id": "THIS_IS_A_TEST", "desc": ".."}`

Result in `const window.fcoo.map.zIndex.THIS_IS_A_TEST = 1234;`
