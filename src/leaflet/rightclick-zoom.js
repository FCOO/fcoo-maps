/****************************************************************************
rightclick-zoom.js
Implement zoom-out on double right click.
Based on https://github.com/GhostGroup/Leaflet.DoubleRightClickZoom
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    L.Map.mergeOptions({
        doubleRightClickZoom: true
    });

    L.Map.DoubleRightClickZoom = L.Handler.extend({
        addHooks: function() {
            this._rightClicks = 0;
            this._map.on('contextmenu', this._onDoubleRightClick, this);
        },

        removeHooks: function(){
            this._map.off('contextmenu', this._onDoubleRightClick, this);
        },

        _onDoubleRightClick: function(){
            this._rightClicks++;
            if (this._rightClicks == 1)
                window.setTimeout( $.proxy(this._handleDoubleRightClick, this), 300);
            return false;
        },

        _handleDoubleRightClick: function(){
            if (this._rightClicks > 1)
                this._map.setZoom(Math.ceil(this._map.getZoom()) - 1);
            this._rightClicks = 0;
        }
    });

    L.Map.addInitHook('addHandler', 'doubleRightClickZoom', L.Map.DoubleRightClickZoom);

}(jQuery, L, this, document));
