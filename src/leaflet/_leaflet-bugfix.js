/****************************************************************************
leaflet-bugfix.js

Contains bigfix for Leaflet version 1.5.x


****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

	// @method setStyle(style: Path options): this
	// Changes the appearance of a Path based on the options in the `Path options` object.
    L.Path.prototype.setStyle = function (style) {
		setOptions(this, style);
		if (this._renderer) {
			this._renderer._updateStyle(this);
			if (this.options.stroke && style.hasOwnProperty('weight')) {
				//this._updateBounds();
				this._project();
			}
		}
		return this;
	};



}(jQuery, L, this, document));



