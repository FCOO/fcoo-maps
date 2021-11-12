/****************************************************************************
parent-layer.js

Implement L.Layer._parentLayerList = []L.LayerGroup = The 'parent' L.Layer(Group) the L.Layer belong to

Based on https://stackoverflow.com/questions/40884232/how-to-get-name-id-of-featuregroup-when-layer-is-clicked
****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    L.Layer.addInitHook(function(){
        this._parentLayerList = [];
    });


    L.LayerGroup.include({
        addLayer: function(_addLayer){
            return function(layer){
                layer._parentLayerList.push(this);
                return _addLayer.apply(this, arguments);
            };
        }(L.LayerGroup.prototype.addLayer),

        removeLayer: function(_removeLayer){
            return function(layer){
                layer._parentLayerList.splice(layer._parentLayerList.indexOf(this), 1);
                return _removeLayer.apply(this, arguments);
            };
        }(L.LayerGroup.prototype.removeLayer)
    });

/* ORIGINAL CODE
L.LayerGroup.include({
    addLayer: function (layer) {
        var id = this.getLayerId(layer);
        this._layers[id] = layer;
        if (this._map) {
            this._map.addLayer(layer);
        }

        // Add this group to the layer's known groups
        layer._groups.push(this);

        return this;
    },

    removeLayer: function (layer) {
        var id = layer in this._layers ? layer : this.getLayerId(layer);
        if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
        }
        delete this._layers[id];

        // Remove this group from the layer's known groups
        layer._groups.splice(layer._groups.indexOf(this), 1);

        return this;
    }
});

// Make sure to init a property in L.Layer
L.Layer.addInitHook(function(){
    this._groups = [];
});

*/
}(jQuery, L, this, document));
