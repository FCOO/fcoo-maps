/***********************************************************
L.Control.Permalink.initialize

L.Control.Permalink works like this:
To include the setting for a given control (or other) eg. named "myControl" 
include a function "initialize_myControl()" (must be named "initialize_...") 
to "L.Control.Permalink" that sets up the needed calls to "this._update( obj )"
where obj = json-object with {id:value}

this._update( { test: 1 } ) => url get updated with "index.html#....&test=1&..."
Ex.
var myControl = new MyControl(...);

L.Control.Permalink.include({
    initialize_myControl: function() {
        this._map.on('something', this._update_myControl, this);
    },
    _update_myControl: function(){
        this._update( {'myControl': myControl.getSomeValue() } ); 
    }

L.Control.Permalink.initialize contains the setups for different 
leaflet-controls needed to be included in Permalink
***********************************************************/

(function (L /*, window, document, undefined*/){
    "use strict";

    /*******************************************************
    Including L.Control.NAME in Permalink
    *******************************************************/
/*
    L.Control.Permalink.include({
        initialize_NAME: function() {
            this.on('add', this._onadd_NAME, this);
        },

        _onadd_NAME: function() {

            
            this._update_NAME();
        },

        _update_NAME: function() {
            this._update(options);
        }
    });
*/

})(L, this, document);
