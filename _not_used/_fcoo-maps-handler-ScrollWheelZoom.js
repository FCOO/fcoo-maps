/****************************************************************************
fcoo-maps-handler-ScrollWheelZoom.js

Create a new scrollWheel-handler (GoogleScrollWheelZoom)
to imitate the behaver of Google Maps

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    var mouseWheelTicksProZoomLevel = 2;
    var GoogleScrollWheelZoom = L.Handler.extend({
        addHooks: function () {
            $(this._map)
//                .on('zoomstart', $.proxy(this._onZoomStart, this))
                .on('zoomend',   $.proxy(this._onZoomEnd, this));

            $(this._map._container)
                .mousewheel( $.proxy(this._onWheelScroll, this) );

            this.mousewheelZoom = 0;
            this.mouseWheelTicks = 0;
        },

        removeHooks: function () {
            $(this._map._container).unmousewheel( $.proxy(this._onWheelScroll, this) );
        },

//        _onZoomStart: function(){
//        },

        _onZoomEnd  : function(){
            //Zomm the 'rest' of the mousewheel ticks (if any)
            if (this.mousewheelZoom)
                this._performZoom(this.mouseWheelTicks <= 2);
        },

        _onWheelScroll: function (e) {
            //Increase/decrease total zoom (='ticks' on mouse wheel)
            var ticks = e.shiftKey ? mouseWheelTicksProZoomLevel : 1;
            this.mousewheelZoom += ticks * e.deltaY / mouseWheelTicksProZoomLevel;
            this.mouseWheelTicks += ticks;

            this._lastMousePos = this._map.mouseEventToContainerPoint(e);

            if (this._isZooming || this._timer){
                //Nothing: Wait for _onZoomEnd or the timeout to include the zoom
            }
            else
                this._timer = setTimeout($.proxy(this._performZoom, this), 80);

            e.preventDefault();
            e.stopPropagation();
            return this;
        },

        _performZoom: function ( dontAnimate) {
            var map = this._map,
                newZoom = map._limitZoom( map.getZoom() + this.mousewheelZoom);
            newZoom = Math.round( newZoom * 100 )/100;

            this._timer = null;
            this.mousewheelZoom = 0;
            this.mouseWheelTicks = 0;

            // stop panning and fly animations if any
            map._stop();

            if (map.options.googleScrollWheelZoom === 'center')
                map.setZoom(newZoom, {animate: !dontAnimate});
            else
                map.setZoomAround(this._lastMousePos, newZoom, {animate: !dontAnimate});
        },
    });


    L.Map.addInitHook('addHandler', 'googleScrollWheelZoom', GoogleScrollWheelZoom);

}(jQuery, L, this, document));



