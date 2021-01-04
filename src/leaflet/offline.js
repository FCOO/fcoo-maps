/****************************************************************************
offline.js

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    /*
    Add events to Offline to detect if a map have been changed during offline
    If so the map is redraw when the browser in online again
    */

    function map_offline_down(){
        this.centerAndZoomWhenOffline = {
            center: this.getCenter(),
            zoom  : this.getZoom()
        };
    }
    function map_offline_up(){
        if (!this.centerAndZoomWhenOffline) return;

        if (!this.centerAndZoomWhenOffline.center.equals(this.getCenter()) || (this.centerAndZoomWhenOffline.center.zoom != this.getZoom()))
            this.eachLayer(function(layer){
                if (layer.redraw)
                    layer.redraw();
            });
        this.centerAndZoomWhenOffline = null;
    }
    function map_offline_off(){
        window.Offline.off('down', map_offline_down, this);
        window.Offline.off('up',   map_offline_up,   this);
    }


    L.Map.addInitHook(function () {
        window.Offline.on('down', map_offline_down, this);
        window.Offline.on('up',   map_offline_up,   this);
        this.on('unload', map_offline_off, this);
    });

}(jQuery, L, this, document));



