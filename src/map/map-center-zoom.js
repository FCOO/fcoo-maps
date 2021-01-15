/****************************************************************************
map-center-zoom.js

Objects and methods to handle save and setting of map center-position and zoom
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    nsMap.defaultCenterZoom = {center: [56.2, 11.5], zoom: 6};

   /*********************************************************************
    L.Control.MapCenterZoomControl = Hidden control used to set and get
    the maps center-position and zoom in the map's SettingGroup
    *********************************************************************/
    L.Control.MapCenterZoomControl = L.Control.extend({

        initialize: function(map){
            this.id = map.fcooMapId + '_center_zoom';
            this._map = map;
            this.lastCenterZoomStr = '';

            ns.appSetting.add({
                id          : this.id,
                applyFunc   : $.proxy(this.applyFunc, this),
                defaultValue: nsMap.defaultCenterZoom
            });
            map.on('moveend mapsyncdisabled', this.onMoveend, this);

            return L.Control.prototype.initialize.apply(this, arguments);
        },

        useCenterZoom: function(centerZoom){
            if (this._map._mapSync && this._map.options.mapSync && this._map.options.mapSync.enabled && !this._map.options.mapSync.isMainMap)
                return false;

            var centerZoomStr = centerZoom.center.toString()+'_'+centerZoom.zoom;
            if (centerZoomStr != this.lastCenterZoomStr){
                this.lastCenterZoomStr = centerZoomStr;
                return true;
            }
            return false;
        },

        onMoveend: function(){
            var centerZoom = {
                    center: this._map.getCenter(),
                    zoom  :this._map.getZoom()
                };

            if ( this.useCenterZoom(centerZoom)){
                ns.appSetting.set(this.id, {
                    center: [centerZoom.center.lat, centerZoom.center.lng],
                    zoom  : centerZoom.zoom
                });
                this.doNotApply = true;
                //ns.appSetting.save();
                this.doNotApply = false;
            }
        },

        applyFunc: function(centerZoom){
            if (this.doNotApply)
                return;

            centerZoom.center = L.latLng(centerZoom.center);
            if (this.useCenterZoom(centerZoom))
                this._map.setView(centerZoom.center, centerZoom.zoom, {animate: false});
        }
    });


    L.Map.mergeOptions({
        mapCenterZoomControl: true//TODO = false
    });

    L.Map.addInitHook(function () {
        if (this.options.mapCenterZoomControl)
            this.mapCenterZoomControl = new L.Control.MapCenterZoomControl(this);
    });
}(jQuery, L, this, document));
