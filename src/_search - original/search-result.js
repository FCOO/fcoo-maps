/****************************************************************************
search-result.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*************************************************************************
    **************************************************************************
    SearchResult
    Represent one result of a search
    **************************************************************************
    *************************************************************************/
    var searchResults = nsMap.searchResults = {};

    var searchResultDetailModal = null;

    var SearchResult = nsMap.SearchResult = function(options){
        options.include = nsMap.osm_include(options);
        options.address = options.address || {};
        options.latLng = options.latLng || L.latLng(options.lat, options.lon);
        this.id = '_' + (options.osm_id || options.latLng.lat+'_'+options.latLng.lng);

        this.update(options);


        this.showMarker = true;
        this.showPoly   = false;
        if (this.options.geojson && this.options.geojson.coordinates && (this.options.geojson.type != 'Point') && (this.options.geojson.type != 'MultiPoint')){
            var map        = nsMap.mainMap,
                markerSize = 14;
            /*
            Calculate dimentions of the polygon/line at max-zoom see if it is big enough to be visible at max-zoom eq bigger than the marker
            If it is => hide the marker at the zoom-level where the polygon/line has approx. the same size as the marker
            else => Only show the marker
            */
            var minZoom = map.getMinZoom(),
                maxZoom = map.getMaxZoom();

            this.latLngs = L.GeoJSON.coordsToLatLngs(this.options.geojson.coordinates, this.options.geojson.type == 'MultiPolygon' ? 2 : this.options.geojson.type == 'LineString' ? 0 : 1);

            var bounds = L.latLngBounds(this.latLngs),
                /* All is shown as line
                isLine      = (options.geojson.type == 'LineString') || (options.geojson.type == 'MultiLineString'),
                */
                widthAtMaxZoom  = Math.abs(map.project(bounds.getNorthWest(), maxZoom).x - map.project(bounds.getNorthEast(), maxZoom).x ),
                heightAtMaxZoom = Math.abs(map.project(bounds.getNorthWest(), maxZoom).y - map.project(bounds.getSouthWest(), maxZoom).y ),
                maxDimAtMaxZoom = Math.max(widthAtMaxZoom, heightAtMaxZoom),
                zoomDiff        = Math.log2(maxDimAtMaxZoom / markerSize);

            this.visibleAtZoom = Math.ceil(maxZoom - zoomDiff),
            this.showPoly      = maxDimAtMaxZoom > markerSize;
            this.showMarker    = this.visibleAtZoom > minZoom;
        }

        //inclPositionIsDetails: true if the search-result has a single point and bo polygons OR the polygon is smaller that a given size. It is to give small cities a point but not big areas like countries etc.
        this.inclPositionIsDetails = options.latLng && this.showMarker && (!this.showPoly || (this.visibleAtZoom >= 6 /* OR 5*/));

        //Create BsModalContentPromise to update modal-content in modal-window
        this.bsModalContentPromise = new $.BsModalContentPromise({
            url             : $.proxy(this._getUrl, this),
            update          : $.proxy(this._update, this),
            afterUpdate     : $.proxy(this._afterUpdate, this),
            reject          : this._reject,
            needToUpdate    : $.proxy(this._needToUpdate, this),
            getModalOptions : $.proxy(this._getModalOptions, this),
        });

        this.bsModalContentPromise.addBsModalOwner(this);
    }

	//Extend the prototype
	SearchResult.prototype = {
        //Internal methods used by this.bsModalContentPromise
        _getUrl: function(){
            var lang = ns.globalSetting.get('language'),
                params = {
                    'osm_ids'        : this.options.osm_type.toUpperCase()[0] + this.options.osm_id,
                    'format'         : 'jsonv2',
                    'addressdetails' : 1,
                    'extratags'      : 1,
                    'namedetails'    : 1,
                    'accept-language': 'en'
                };
            if (lang != 'en')
                params['accept-language'] = lang + ',en';

            return nsMap.setupOptions.topMenu.nominatim + '/lookup' + L.Util.getParamString(params);
        },

        _needToUpdate: function(){
            if (this.langDetails && this.langDetails[ ns.globalSetting.get('language') ])
                return false;
            return true;
        },

        _update: function(options){
            if (searchResultDetailModal)
                searchResultDetailModal._bsModalPromise_Update(options);
        },

        _afterUpdate: function(){
            if (searchResultDetailModal && searchResultDetailModal.showAfterUpdate){
                searchResultDetailModal.showAfterUpdate = false;
                searchResultDetailModal.show();
            }
        },

        _reject: function(){
            if (searchResultDetailModal)
                searchResultDetailModal._bsModalPromise_Reject();
        },

        _getModalOptions: function(options){
            this.update(options[0]);

            //Create the dynamic part of the modal-options
            var lang = ns.globalSetting.get('language'),
                content = [{
                    label    : {da:'Navn(e)', en:'Name(s)'},
                    type     : 'text',
                    text     : this.names[lang].split('&nbsp;/&nbsp;').join('<br>'),
                    center   : true,
                    textStyle: 'font-weight-bold'
                }];

            //Add position.
            if (this.inclPositionIsDetails)
                content.push({
                    label    : {da:'Position', en:'Position'},
                    type     : 'text',
                    vfFormat : 'latlng',
                    vfValue  : this.options.latLng,
                    center   : true,
                    textStyle: 'center',

                    onClick  : $.proxy(this.showLatLngModal, this)
                });


            //Add content from details
            content = content.concat( nsMap.osm_details_list(this, {type: 'text', center: true} ) );

            //Special case: Add flag
            if (this.options.extratags && this.options.extratags.flag)
                content.push({
                    label    : {da:'Flag', en:'Flag'},
                    type     : 'text',
                    text     : '<img src="'+this.options.extratags.flag+'" style="border: 1px solid gray; height:100px"/>',
                    center   : true
                });

            this.langDetails = this.langDetails || {};
            this.langDetails[lang] = this.langDetails[lang] || {
                header      : this.header,
                content     : content,
            };
            return this.langDetails[lang];
        },

        /**********************************************
        //update - append new options and update object
        **********************************************/
        update: function(newOptions){
            this.optionsLang = ns.globalSetting.get('language'); //The lang used to get the new options

            this.options = this.options || {};
            $.extend(true, this.options, newOptions);

            var opt = this.options;

            this.countryCode = opt.address && opt.address.country_code ? opt.address.country_code : '';
            this.flagIcon = this.countryCode ? 'fa fa-flag-' + this.countryCode : '';
            this.typeText = nsMap.osm_type_text(opt) || opt.type;
            this.name = opt.name || '';
            this.displayName = nsMap.osm_display_name(opt);

            if (opt.isPosition)
                this.names = this.name;
            else {
                if (!this.name && opt.namedetails){
                    //Construct name and name = {lang:STRING} for all lang in i18next.languages and the local language (if found)
                    var _this = this,
                        localLang = ns.country2lang(this.countryCode),
                        localName = opt.namedetails.name || opt.namedetails['name:'+localLang] || '',
                        defaultName = opt.namedetails['name:en'] || '';

                    //Set local name (if not allerady set)
                    opt.namedetails['name:'+localLang] = opt.namedetails['name:'+localLang] || localName;
                    $.each(i18next.languages, function(index, lang){
                        //Create list of language-code with localLang, lang, all other
                        var namedetailsId = [localLang, lang].concat(i18next.languages);

                        //Find all names in namedetils with language-code in namedetailsId
                        var nameList = [];
                        $.each(namedetailsId, function(index, id){
                            var name = opt.namedetails['name:'+id];
                            if (name && (nameList.indexOf(name) == -1))
                                nameList.push(name);

                            _this.name = _this.name || {};
                            name = name || defaultName;
                            if (name){
                                //Add [localname / ]name/defaultNme as name[id]
                                if (localName && (localName != name))
                                    _this.name[id] = localName + ' / ' + name;
                                else
                                    _this.name[id] = name;
                            }
                        });
                        _this.names = _this.names || {};
                        _this.names[lang] = nameList.join('&nbsp;/&nbsp;');
                    });
                }

                //Sync between name and names
                this.name = this.name || {};
                this.names = this.names || {};
                $.each(this.names, function(lang, names){
                    if (!_this.name[lang])
                        _this.name[lang] = names.split('&nbsp;/&nbsp;')[0];
                });
                $.each(this.name, function(lang, name){
                    if (!_this.names[lang])
                        _this.names[lang] = name;
                });
            }

            //Remove display_name if if it is contained in names
            if (this.names[this.optionsLang] && this.options.display_name && (this.names[this.optionsLang].indexOf(this.options.display_name) > -1))
                this.options.display_name = '';

            this.header = {
                icon: this.flagIcon,
                text: this.name
            };
        },

        /**********************************************
		listContent - Return content for the list of results
        **********************************************/
		listContent: function( options ){

            options = options || {};

            var thisOpt     = this.options,
                content     = [],
                displayName = nsMap.osm_display_name(thisOpt);

            function add(opt){
                content.push( $('<div/>').addClass('search-result-row')._bsAddHtml(opt) );
            }
            /*Only test:
            content.push({
                text     : thisOpt.category+'  / '+thisOpt.type,
                textClass: 'd-block search-result-type'
            });
            */

            //Extend the display with other informations
            if (this.typeText)
                add({
                    text     : this.typeText,
                    textClass: 'd-block search-result-type'
                });

            if (this.names)
                add({
                    icon     : this.flagIcon,
                    text     : this.names,
                    textClass: 'd-inline-block search-result-name'
                });

            if (displayName)
                add({
                    icon     : this.names ? '' : this.flagIcon,
                    text     : displayName,
                    textClass: 'd-inline-block ' + (this.names ? 'search-result-display' : 'search-result-name')
                });

            options.content = content;
            return options;
		},


        /**********************************************
        //showOnMainMap - find or create the corresponding SearchResultGeoJSON and show it on the map
        **********************************************/
        showOnMainMap: function(){
            this.searchResultGeoJSON =
                nsMap.searchResultGeoJSONs[this.id] = nsMap.searchResultGeoJSONs[this.id] || new nsMap.SearchResultGeoJSON(this);

            this.searchResultGeoJSON.searchResult = this;
            this.searchResultGeoJSON.create();

            if (this.showPoly)
                nsMap.mainMap.fitBounds(
                    this.searchResultGeoJSON.poly.getBounds(),
                    $.extend(
                        {maxZoom: nsMap.mainMap.getZoom()},
                        nsMap.mainMap._mapSync_NO_ANIMATION
                    )
                );
            else
                this.searchResultGeoJSON.centerOnMap();

            //Open popup
            this.searchResultGeoJSON.marker.openPopup();

console.log( nsMap.searchResultGeoJSONs );

        },


        /**********************************************
        //showLatLngModal - show modal with position
        **********************************************/
        showLatLngModal: function(){
            nsMap.latLngAsModal(this.options.latLng, {header: this.header});
        },

        /**********************************************
        //showDetails - create and show modal with detalis
        **********************************************/
        showDetails: function(){
            searchResultDetailModal =
                searchResultDetailModal ||
                    $.bsModal({
                        scroll : true,
                        content: ' ',
                        _buttons: [{
                            icon: 'fa-map-marker',
                            text: {da:'Vis på kort', en:'Show on map'},
                            onClick: function(){
                                searchResultDetailModal.close();
                                searchResultModal.close();
                                searchResultList[selectedSearchResultIndex].showOnMainMap();
                            }
                        }],
                        footer : [{icon:'fa-copyright', text: 'OpenStreetMap', link: 'https://www.openstreetmap.org/copyright'},{text:'contributors'}],
                        show   : false,
                    });

            searchResultDetailModal.showAfterUpdate = true;
            this.bsModalContentPromise.update();
        },
    };
}(jQuery, L, this.i18next, this, document));