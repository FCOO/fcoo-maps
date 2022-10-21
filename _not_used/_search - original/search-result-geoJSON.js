/****************************************************************************
search-result-geoJSON.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};



    /*************************************************************************
    SearchResultGeoJSON
    Represent one result of a search as geoJSON on the main map
    *************************************************************************/
    var searchResultLineColor = 'black',
        searchResultColor     = 'search-result';

    var searchResultGeoJSONs = nsMap.searchResultGeoJSONs = {};

    var SearchResultGeoJSON = nsMap.SearchResultGeoJSON = function(searchResult){
        this.searchResult = searchResult;
    }

	//Extend the prototype
	SearchResultGeoJSON.prototype = {
        /**********************************************
        create - Create marker and polygon for this.searchResult
        **********************************************/
		create: function(){
            if (this.marker || this.poly) return;

            var map             = nsMap.mainMap,
                markerClassName = '';

            if (this.searchResult.showPoly){
                markerClassName = 'hide-for-leaflet-zoom-'+this.searchResult.visibleAtZoom+'-up';
                var polylineOptions = {
                        fill         : false,
                        lineColorName: searchResultColor,
                        weight       : 5,
                        border       : true,
                        shadow       : true,
                        hover        : true,
                        transparent  : true,

                        tooltipHideWhenPopupOpen: true,
                        shadowWhenPopupOpen     : true,
                        shadowWhenInteractive   : true,

                        addInteractive     : true,
                        interactive        : true,
                    };
                /* All are shown as line
                var polygonOptions = $.extend({}, polylineOptions, {colorName: 'transparent', fill: true});
                this.poly = isLine ?
                    L.polyline(latLngs, polylineOptions ) :
                    L.polygon (latLngs, polygonOptions );
                */
                this.poly = L.polyline(this.searchResult.latLngs, polylineOptions );

                this.poly.addTo(map);

                this.poly.bindTooltip(this.searchResult.header);

                this._addPopupAndContextMenu(this.poly);

                //Add class to hide  on when marker is visible
                this.poly._addClass(null, 'hide-for-leaflet-zoom-'+(this.searchResult.visibleAtZoom-1)+'-down');
            }

            //Create the marker - is allways created to be used for initial popup
            this.marker = L.bsMarkerSimpleRound(this.searchResult.options.latLng, {
                size           : 'small',
                colorName      : searchResultColor,
                borderColorName: searchResultLineColor,
                transparent    : true,
                hover          : true,
                puls           : false,
                interactive    : true,
                tooltip                 : this.searchResult.header,
                tooltipPermanent        : false,
                tooltipHideWhenDragging : true,
                tooltipHideWhenPopupOpen: true,
                shadowWhenPopupOpen     : true
            });

            this._addPopupAndContextMenu(this.marker);
            if (this.searchResult.showMarker)
                this.marker.addClass(markerClassName);
            else
                this.marker.setOpacity(0);

            this.marker.addTo(map);
        },

        /**********************************************
        _addPopupAndContextMenu
        **********************************************/
        _addPopupAndContextMenu: function( obj ){
            var _this = this,
                menuList = [];

            function addMenuItem(icon, text, methodName, lineBefore){
                menuList.push({icon: icon, text: text, onClick: $.proxy(_this[methodName], _this), lineBefore: lineBefore});
            }

            if (!this.searchResult.options.isPosition)
                addMenuItem('fa-info-circle', {da:'Detaljer', en:'Details'}, 'showDetails');

            if (this.searchResult.inclPositionIsDetails)
                addMenuItem('fa-map-marker', {da:'Position', en:'Position'}, 'showLatLngModal');

            addMenuItem('fa-crosshairs', {da:'Centrér', en:'Center'}, 'centerOnMap');

            if (this.poly)
                addMenuItem('fa-expand', {da:'Udvid', en:'Expand'}, 'expandOnMap');

            addMenuItem('fa-trash-alt', {da:'Fjern', en:'Remove'}, 'removeFromMap', true);

            obj.bindPopup({
                width  : 105,
                header : this.searchResult.header,
                content: {type:'menu', fullWidth: true, list: menuList},
            });


            obj.setContextmenuHeader(this.searchResult.header);
            obj.addContextmenuItems(menuList);

            return this;
        },

        centerOnMap: function(){
            this._closePopup();
            nsMap.mainMap.setView(this.searchResult.options.latLng, nsMap.mainMap.getZoom(), nsMap.mainMap._mapSync_NO_ANIMATION);
        },
        expandOnMap: function(){
            this._closePopup();
            nsMap.mainMap.fitBounds(this.poly.getBounds());
        },

        showLatLngModal: function(){

console.log('>>>>>>>', arguments);

            this._closePopup();
            this.searchResult.showLatLngModal();
        },

        showDetails: function(){
            this._closePopup();
            this.searchResult.showDetails();
        },

        removeFromMap: function(){
            this._closePopup();
            if (this.marker)
                this.marker.remove();
            if (this.poly)
                this.poly.remove();
            delete nsMap.searchResultGeoJSONs[this.searchResult.id];
        },

        _closePopup: function(){
            if (this.marker)
                this.marker.closePopup();
            if (this.poly)
                this.poly.closePopup();
        }
	};

}(jQuery, L, this.i18next, this, document));