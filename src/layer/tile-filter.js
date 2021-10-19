/****************************************************************************
tile-filter.js

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

/*
    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};
*/

    /***********************************************************
    Extend L-TileLayer with options and methods to grayscale, filter
    and change color of tile-layer
    Based on https://github.com/Zverik/leaflet-grayscale

    Tree possible filter:
        options.grayscale: true => Grayscale with options.quotaRed, options.quotaGreen, options.quotaBlue
        options.filterOneColor: [red, green, blue[,alpha] => Replacing all non-transparent color with options.filterOneColor
        options.colorFilter: STRING with css-filter. See map-layer_background.js

    ***********************************************************/
    L.TileLayer.include({
        onAdd: function (L_TileLayer_onAdd) {
            return function(){
                var options = this.options,
                    allreadyHasFilter = options.hasFilter;

                //crossOrigin = 'anonymous' needed for both filter and getColor-method
                options.crossOrigin = 'anonymous';

                if (!allreadyHasFilter){
                    options.hasFilter = true;
                    if (options.grayscale){
                        options =   $.extend(true, {
                                        quotaRed        : 21,
                                        quotaGreen      : 71,
                                        quotaBlue       : 8,
                                        quotaDividerTune: 0
                                    }, options );
                        options.quotaDivider = options.quotaRed + options.quotaGreen + options.quotaBlue + options.quotaDividerTune;
                        options.filterFunc = this._tileGrayscale;
                    }

                    else

                    if (options.filterOneColor){
                        options.filterFunc = this._tileFilterOneColor;
                    }

                    else

                    if (options.colorFilter){
                        //No filterFunc needed
                        options.filterFunc = null;
                    }
                    else
                        options.hasFilter = false;
                }
                this.options = options;
                var result = L_TileLayer_onAdd.apply(this, arguments);

                if (!allreadyHasFilter && options.hasFilter && options.filterFunc){
                    this.on('tileload', this._onTileLoad_filter, this);
                }

                return result;
            };
        }(L.TileLayer.prototype.onAdd),



        _initContainer: function (L_TileLayer__initContainer) {
            return function(){
                var result = L_TileLayer__initContainer.apply(this, arguments);
                if (this.options.colorFilter)
                    this._container.style.filter = this.options.colorFilter;
                return result;
            };
        }(L.TileLayer.prototype._initContainer),

        _onTileLoad_filter: function(event) {
            var image = event.tile;
            if (image.getAttribute('data-filtered'))
                return;

            image.crossOrigin = '';
            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            this.options.filterFunc(imageData.data, this.options);

            ctx.putImageData(imageData, 0, 0);

            image.setAttribute('data-filtered', true);
            image.src = canvas.toDataURL();

        },

        _tileGrayscale: function (pixels, options) {
            for (var i = 0, n = pixels.length; i < n; i += 4)
                pixels[i] = pixels[i + 1] = pixels[i + 2] = (options.quotaRed * pixels[i] + options.quotaGreen * pixels[i + 1] + options.quotaBlue * pixels[i + 2]) / options.quotaDivider;
        },

        _tileFilterOneColor: function (pixels, options) {
            var i, pLng = pixels.length, j, cLng = options.filterOneColor.length;
            for (i = 0; i < pLng; i += 4)
                if (pixels[i+3] != 0)
                    for (j = 0; j < cLng; j++)
                        pixels[i+j] = options.filterOneColor[j];
        }
    });

}(jQuery, L, this, document));
