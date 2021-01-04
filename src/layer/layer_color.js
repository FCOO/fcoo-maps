/****************************************************************************
layer_color.js

Extensions to L.Map and L.TileLayer to allow tile-layers to fire event "color" with
color and layLng at the cursor/map center using the map's position-control (L.Control.BsPosition)

Each Map using its bsPositionControl (if any) to get current position of the cursor/mouse or map-center
and use this position (if any) to fire event 'color' on all the tileLayers at the map
To get the best resolution the map checks all the other maps in its mapSync to see
if there are other maps with the same tileLayer (options.id) at a higher zoom-level
that includes current position, and use this other map to get the color
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    function rgba2Hex( n ){
        var result = Number(n).toString(16);
        return (result.length < 2 ? '0' : '') + result;
    }

    /***********************************************************
    Add initHook to get bsPosition-control (if any) and use it to
    get cursor-/center-position
    /***********************************************************/
    L.Map.addInitHook(function() {
        var bsPositionOptions = this.bsPositionControl ? this.bsPositionControl.options : this.options.bsPositionControl ? this.options.bsPositionOptions : null;
        if (bsPositionOptions){
            bsPositionOptions.onCenterPosition = bsPositionOptions.onMousePosition = $.proxy(this._onColorPosition, this);
            this.on('zoomend', onZoomend_fireColor, this);
        }
    });

    function onZoomend_fireColor(){
        if (this.bsPositionControl && (this.bsPositionControl.options.mode == 'MAPCENTER'))
            this._onColorPosition( this.getCenter() );
    }

    /***********************************************************
    Extend L.Map with methods to get color at given position
    for the layers on the map
    /***********************************************************/
    L.Map.include({
        lastColorLatLng   : null,
        lastColorLatLngStr: '',

        /***********************************************************
        _onColorPosition(latLng)
        latLng =
            position => Update
            null     => cursor outside map
            true     => update with last position - e.q. when time change
        ***********************************************************/
        _onColorPosition: function(latLng){

            if (nsMap.hasMultiMaps && !this.isVisibleInMultiMaps) return;

            var _this = this;

            if (latLng === true){
                //Force all layers to fire getColor-event
                latLng = this.lastColorLatLng;
                this.lastColorLatLngStr = 'FORCE';
            }
            else
                this.lastColorLatLng = latLng;

            var colorLatLngStr = (latLng ? latLng.toString() : 'null') + +this.getZoom();
            if (colorLatLngStr == this.lastColorLatLngStr) return;

            this.lastColorLatLngStr = colorLatLngStr;

            //Create a list of maps that includes latLng and has zoom > this map's zoom
            var mapList = [];
            if (latLng && this._mapSync){
                this._mapSync.forEachMap( function(id, map){
                    if ((map !== _this) && (map.getZoom() > _this.getZoom()) && map.getBounds().contains(latLng))
                        mapList.push(map);
                });
                mapList.sort(function(map1, map2){ return map1.getZoom() - map2.getZoom(); });
            }

            //Find all layers (if any) that has a color-event
            this.eachLayer(function(layer){
                if ( layer.listens('color') ){
                    var layerColorRGBA = null;
                    if (latLng){
                        var layerToUse = layer;
                        //Check if the same layer also is pressent in one of the maps in mapList => use that version of the layer instead
                        $.each(mapList, function(index, map){
                            return map.eachLayer( function(layer){
                                if (layer.options.id == layerToUse.options.id){
                                    layerToUse = layer;
                                    return true;
                                }
                            });
                        });
                        layerColorRGBA = layerToUse.getColor(latLng);

                        //Fire color-event if the layer returned a color else force next event to try again
                        if (layerColorRGBA)
                            layer._fireOnColor(layerColorRGBA, latLng);
                        else
                            _this.lastColorLatLngStr = '';
                    }
                    else
                        //Cursor is outside the map
                        layer._fireOnColor(null, null);
                }
            });
        }
    });

    /***********************************************************
    Extend L.TileLayer with options and methods to get color from position
    ***********************************************************/
    L.TileLayer.mergeOptions({id:''});

    L.TileLayer.include({
        /******************************************************************
        getColor(latLng) return the color (rgb-array) from the position latLng
        Taken from https://github.com/frogcat/leaflet-tilelayer-colorpicker
        ******************************************************************/
        getColor: function(latLng){

            var size = this.getTileSize(),
                point = this._map.project(latLng, this._tileZoom).floor(),
                coords = point.unscaleBy(size).floor(),
                offset = point.subtract(coords.scaleBy(size));
            coords.z = this._tileZoom;
            var tile = this._tiles[this._tileCoordsToKey(coords)];

            if (!tile || !tile.loaded)
                return null;
            try {
                var canvas = document.createElement("canvas");
                canvas.width = 1;
                canvas.height = 1;
                var context = canvas.getContext('2d');

                context.drawImage(tile.el, -offset.x, -offset.y, size.x, size.y);

                return context.getImageData(0, 0, 1, 1).data;
            }
            catch (e) {
                return null;
            }
        },

        /******************************************************************
        _fireOnColor
        Fire the event 'color' on the layer with the color and position
        ******************************************************************/
        _fireOnColor: function(colorRGBA, latLng){
            this.fire('color', {
                colorRGBA : colorRGBA,
                colorHex  : colorRGBA ? '#' + rgba2Hex(colorRGBA[0]) + rgba2Hex(colorRGBA[1]) + rgba2Hex(colorRGBA[2]) + rgba2Hex(colorRGBA[3]) : null,
                latLng    : latLng
            });
        }
    });

}(jQuery, L, this, document));
