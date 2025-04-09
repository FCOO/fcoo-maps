/****************************************************************************
search-result.js
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    function removeDuplicates(arr){
        return arr.filter(function(item, pos, self) { return self.indexOf(item) == pos; });
    }


    var searchResultLineColor = 'black',
        searchResultColor     = 'search-result';

    /*************************************************************************
    searchResultButtonList = []options for all buttons used
    options = button-options plus
    isPosition   : BOOLEAN: Only for SearchResult with options.isPosition
    isNotPosition: BOOLEAN: Only for SearchResult with not options.isPosition
    hasPosition  : BOOLEAN: Only for SearchResult with inclPositionIsDetails
    hasPoly      : BOOLEAN: Only for SearchResult with showPoly

    *************************************************************************/
    nsMap.searchResultButtonList = [
        {                     icon: 'fa-crosshairs',   text: {da:'Centrér',  en:'Center'  },                    className: 'sr-center-on-map',     method: '_centerOnMap',     closeOnClick: true  },
        {hasPoly      : true, icon: 'fa-expand',       text: {da:'Udvid',    en:'Expand'  },                    className: 'sr-expand-on-map',     method: '_expandOnMap',     closeOnClick: true  },
        {hasPosition  : true, icon: 'fa-location-dot', text: {da:'Position', en:'Position'},                    className: 'sr-show-latlng-modal', method: '_showLatLngModal', },
        {isNotPosition: true, icon: 'fa-info-circle',  text: {da:'Detaljer', en:'Details' },                    className: 'sr-show-details',      method: '_showDetails',     },
        {                     icon: 'fa-trash-alt',    text: {da:'Fjern',    en:'Remove'  }, spaceBefore: true, className: 'sr-remove-from',       method: '_remove',          reloadOnClick: true }
    ];


    /*************************************************************************
    SearchResult
    Represent one result of a search
    *************************************************************************/
    nsMap.searchResults = {};
    var searchResultDetailModal = null;

    var SearchResult = nsMap.SearchResult = function(options){
        //Save options needed to recreate the SearchResult: Position: All, Location: Just
        if (options.isPosition)
            this.saveOptions = $.extend(true, {}, options);
        else
            this.saveOptions = {
                osm_type: options.osm_type,
                osm_id  : options.osm_id
            };

        //Allow both format = "json" and "jsonv2"
        options.category = options.category || options.class;

        options.include = nsMap.osm_include(options);
        options.address = options.address || {};

        //Create a L.LatLng from the options
        var lat = options.latLng ? options.latLng.lat : options.lat,
            lng = options.latLng ? options.latLng.lng : options.lon,
            isLngLat = options.latLng && options.latLng.isLngLat;
        options.latLng = L.latLng(lat, lng);
        options.latLng.isLngLat = isLngLat;

        this.id = '_' + (options.osm_id || options.latLng.lat+'_'+options.latLng.lng);
        this.saveOptions.id = this.id;

        this.update(options);

        this.showMarker = true;
        this.showPoly   = false;

        this.markers = {}; //{MAPINDEX:  L.bsMarkerSimpleRound}
        this.polys   = {}; //{MAPINDEX: L.polygon}

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

        //inclPositionIsDetails: true if the search-result has a single point and no polygons OR the polygon is smaller that a given size. It is to give small cities a point but not big areas like countries etc.
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
    };


    ns.getNominatimLookupUrl = function( searchResultList, inclPolygon ){
        searchResultList = $.isArray(searchResultList) ? searchResultList : [searchResultList];

        var osm_ids = '';
        searchResultList.forEach( function(searchResult){
            if (osm_ids.length)
                osm_ids += ',';
            osm_ids += searchResult.options.osm_type.toUpperCase()[0] + searchResult.options.osm_id;
        });

        var lang = ns.globalSetting.get('language'),
            params = {
                'osm_ids'          : osm_ids,
                'format'           : 'jsonv2',
                'addressdetails'   : 1,
                'extratags'        : 1,
                'namedetails'      : 1,
                'polygon_geojson'  : inclPolygon ? 1 : 0,
                'polygon_threshold': ns.osm_polygon_threshold,
                'accept-language'  : 'en'
            };
        if (lang != 'en')
            params['accept-language'] = lang + ',en';

        return nsMap.setupOptions.topMenu.nominatim + '/lookup' + L.Util.getParamString(params);
    };

	//Extend the prototype
	SearchResult.prototype = {
        //Internal methods used by this.bsModalContentPromise
        _getUrl: function(){
            return ns.getNominatimLookupUrl( this );
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

            const lang = ns.globalSetting.get('language');


            //Create the dynamic part of the modal-options
            let langList = [lang, 'en', this.localLang],
                nameList = [];
            
            langList.forEach( lang => {
                if (lang && this.name[lang])
                    nameList.push(this.name[lang]);
            }, this);                

            nameList = removeDuplicates(nameList);
            nameList[0] = '<strong>' + nameList[0] + '</strong>';
            
            let content = [{
                    label    : nameList.length == 1 ? {da:'Navn', en:'Name'} : {da:'Navne', en:'Names'},
                    type     : 'text',
                    text     : nameList.join('<br>'),
                    center   : true,
                    //textStyle: 'fw-bold'
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


            //Add flag lang-flag-icon
            if (this.countryCode && (this.options.addresstype == "country"))
                content.push({
                    label    : {da:'Flag', en:'Flag'},
                    type     : 'text',
                    text     : '<img src="images/'+this.countryCode+'_4x3.svg" style="border: 1px solid gray; height:100px"/>',
                    center   : true
                });

            //@TODO Test if it should be a accordion
            //Convert conternt to accordion-content
            content.forEach( (part, index) => {
                let newPart = {
                        text: part.label
                    };
                part.noLabel = true;
                part.type = null;
                newPart.content = part;
                content[index] = newPart;
            });                

            content = {
                type        : 'accordion',
                list        : content,
                neverClose  : true,                      
                multiOpen   : true,                     
                allOpen     : true,
            };

            this.langDetails = this.langDetails || {};
            this.langDetails[lang] = this.langDetails[lang] || {
                header : this.header,
                content: content    
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
            this.localLang   = ns.country2lang(this.countryCode),
            this.flagIcon    = this.countryCode ? 'fa fa-flag-' + this.countryCode : '';
            this.typeText    = nsMap.osm_type_text(opt) || opt.type;
            this.name        = opt.name || '';
            this.displayName = nsMap.osm_display_name(opt);

            if (opt.isPosition){
                this.names = this.name;
            }                
            else {
                if (opt.namedetails){
                    //There are multi-language names for the Search-Result
                    
                    let localName   = opt.namedetails.name || opt.namedetails['name:'+this.localLang] || '',
                        defaultName = opt.namedetails['name:en'] || '';

                    //Set local name (if not allerady set)
                    opt.namedetails['name:'+this.localLang] = opt.namedetails['name:'+this.localLang] || localName;

                    //langList = []Language-code for lang in i18next.languages and the local language (if found)
                    let langList = [];
                    i18next.languages.forEach( lang => langList.push(lang) );
                    if (this.localLang){
                        langList.push(this.localLang);
                        langList = removeDuplicates(langList);
                    }                        
                     
                    //Set name = {lang:STRING}
                    this.name = {};
                    langList.forEach( lang => {
                        this.name[lang] = opt.namedetails['name:'+lang] || opt.name || defaultName;                         
                    }, this);                        

                    /*
                    Construct names = {lang:STRING} for all lang in i18next.languages
                    The STRING = name in language + (localName) - if any
                    Eq. names = {
                            da: "Danmark",
                            en: "Denmark (Danmark)"
                        }                            
                    */
                    const localNameStr = localName ? ' (' + localName + ')' : '';
                    this.names = {};
                    i18next.languages.forEach( lang => {
                        const nextName = this.name[lang];
                        this.names[lang] = nextName + (nextName != localName ? localNameStr : '');
                    }, this);
                }

                //If only one name is given => convert to {lang:name}
                if (this.name && (typeof this.name == 'string')){
                    var nameStr = this.name;
                    this.name = {};
                    this.name[this.optionsLang] = nameStr;
                }

                //Sync between name and names
                this.name = this.name || {};
                this.names = this.names || {};

                $.each(this.names, function(lang, names){
                    if (!this.name[lang])
                        this.name[lang] = names.split('&nbsp;/&nbsp;')[0];
                }.bind(this));
                $.each(this.name, function(lang, name){
                    if (!this.names[lang])
                        this.names[lang] = name;
                }.bind(this));
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
		listContent: function( listIndex ){
            var thisOpt = this.options,
                options = {
                    id       : 'item_'+listIndex,
                    selected : !listIndex,
                    textClass: 'text-wrap'
                },
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
        addTo(layerGroup, map) - Create marker and/or polyline and add them to layerGroup
        **********************************************/
        addTo: function(layerGroup, map){
            let mapIndex = map ? map.fcooMapIndex : layerGroup.fcooMapIndex,
                markerClassName = '',
                poly = null;

            if (this.showPoly){
                markerClassName = 'show-for-leaflet-zoom-'+this.visibleAtZoom+'-down';

                if (this.polys[mapIndex])
                    poly = this.polys[mapIndex];
                else {
                    //Create polyline
                    poly = L.polyline(this.latLngs, {
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

                        className: 'hide-for-leaflet-zoom-'+this.visibleAtZoom+'-down'
                            
                    });

                    poly.bindTooltip(this.header);
                    this._addPopupAndContextMenu(poly, layerGroup);

                    this.polys[mapIndex] = poly;
                }

                layerGroup.addLayer( this.polys[mapIndex] );
            }

            //Create the marker - is allways created to be used for initial popup
            if (!this.markers[mapIndex]){
                var marker = L.bsMarkerSimpleRound(this.options.latLng, {
                        size           : 'small',
                        colorName      : searchResultColor,
                        borderColorName: searchResultLineColor,
                        transparent    : true,
                        hover          : true,
                        puls           : false,
                        interactive    : true,
                        tooltip                 : this.header,
                        tooltipPermanent        : false,
                        tooltipHideWhenDragging : true,
                        tooltipHideWhenPopupOpen: true,
                        shadowWhenPopupOpen     : true
                    });

                this._addPopupAndContextMenu(marker, layerGroup);
                if (this.showMarker)
                    marker.addClass(markerClassName);
                else
                    marker.setOpacity(0);

                this.markers[mapIndex] = marker;
            }

            layerGroup.addLayer(this.markers[mapIndex]);
        },

        /**********************************************
        _getPoly, _getMarker
        **********************************************/
        _getPoly  : function( mapOrMapIndexOrMapId ){ return this._getObj(mapOrMapIndexOrMapId, 'polys'); },
        _getMarker: function( mapOrMapIndexOrMapId ){ return this._getObj(mapOrMapIndexOrMapId, 'markers'); },

        _getObj   : function( mapOrMapIndexOrMapId, listId ){
            if (!this.mapLayer) return null;

            var map = nsMap.getMap(mapOrMapIndexOrMapId),
                mapIndex = map ? map.fcooMapIndex : -1;

            return mapIndex > -1 ? this[listId][mapIndex] : null;
        },

        /**********************************************
        _getButtonList
        Return a copy of nsMap.searchResultButtonList with each button marked included: true/false
            isPosition   : BOOLEAN: Only for SearchResult with options.isPosition
            isNotPosition: BOOLEAN: Only for SearchResult with not options.isPosition
            hasPosition  : BOOLEAN: Only for SearchResult with options.inclPositionIsDetails
            hasPoly      : BOOLEAN: Only for SearchResult with showPoly
        **********************************************/
        _getButtonList: function(onlySetInclude){
            var _this   = this,
                thisOpt = this.options,
                list    = [];

            $.each($.extend(true, {}, nsMap.searchResultButtonList), function(index, o /*=button options */){
                var include = (
                    (!o.isPosition    || thisOpt.isPosition) &&
                    (!o.isNotPosition || !thisOpt.isPosition) &&
                    (!o.hasPosition   || _this.inclPositionIsDetails) &&
                    (!o.hasPoly       || _this.showPoly)
                );
                if (onlySetInclude)
                    o.include = include;

                if (include || onlySetInclude)
                    list.push(o);
            });
            return list;
        },

        /**********************************************
        _addPopupAndContextMenu
        **********************************************/
        _addPopupAndContextMenu: function( obj, layerGroup ){
            var _this = this,
                menuList = [];

            $.each(this._getButtonList(), function(index, buttonOptions){
                menuList.push({
                    icon       : buttonOptions.icon,
                    text       : buttonOptions.text,
                    spaceBefore: buttonOptions.spaceBefore,
                    class      : buttonOptions.className,
                    onClick    : _this[buttonOptions.method],
                    context    : _this
                });
            });

            obj.setContextmenuParent(layerGroup);
            obj.setContextmenuOptions({alsoAsPopup: true});
            obj.setContextmenuHeader(this.header);
            obj.excludeMapContextmenu();

            obj.addContextmenuItems(menuList);

            return this;
        },


        /**********************************************
        Internal methods to find correct arguments from
        arguments = (id, latLng,   $button, map, owner)
        See fcoo/leaflet-bootstrap src/00_leaflet-bootstrap.js
        **********************************************/
        _centerOnMap    : function(id, latLng, $button, map/*, owner*/){ this.centerOnMap( map );     },
        _expandOnMap    : function(id, latLng, $button, map/*, owner*/){ this.expandOnMap( map );     },
        _showLatLngModal: function(id, latLng, $button, map/*, owner*/){ this.showLatLngModal( map ); },
        _showDetails    : function(id, latLng, $button, map/*, owner*/){ this.showDetails( map );     },
        _remove         : function(id, latLng, $button, map/*, owner*/){ this.remove( map );          },


        /**********************************************
        _closePopup( map )
        **********************************************/
        _closePopup: function( map ){
            var marker = this._getMarker(map),
                poly   = this._getPoly(map);

            if (marker)
                marker.closePopup();
            if (poly)
                poly.closePopup();
        },

        /**********************************************
        centerOnMap( map )
        **********************************************/
        centerOnMap: function( map = nsMap.mainMap ){
            this.mapLayer.addTo(map);
            this._closePopup( map );
            map.setView(this.options.latLng, map.getZoom(), map._mapSync_NO_ANIMATION);
        },


        /**********************************************
        expandOnMap( map )
        **********************************************/
        expandOnMap: function( map = nsMap.mainMap ){
            this.mapLayer.addTo(map);
            this._closePopup( map );
            var poly = this._getPoly( map );
            if (poly)
                map.fitBounds(poly.getBounds(), map._mapSync_NO_ANIMATION);
        },


        /**********************************************
        showLatLngModal - show modal with position
        **********************************************/
        showLatLngModal: function( map ){
            this._closePopup( map );
            nsMap.latLngAsModal(this.options.latLng, {header: this.header});
        },

        /**********************************************
        showDetails - create and show modal with detalis
        **********************************************/
        showDetails: function( map ){
            this._closePopup( map );

            searchResultDetailModal =
                $.bsModal({
                    scroll : true,
                    content: ' ',
                    footer : [{icon:'fa-copyright', text: 'OpenStreetMap', link: 'https://www.openstreetmap.org/copyright'},{text:'contributors'}],
                    show   : false,
                    remove : true
                });

            searchResultDetailModal.showAfterUpdate = true;
            this.bsModalContentPromise.update();
        },

        /**********************************************
        remove()
        **********************************************/
        remove: function(){
            this.mapLayer.remove( this );
        },

        /**********************************************
        removeFrom( map ) - Remove marker and/or polyline from map
        **********************************************/
        removeFrom: function( map ){
            this._getMarker(map) ? this._getMarker(map).remove() : null;
            this._getPoly(map)   ? this._getPoly(map).remove()   : null;
        },

        /**********************************************
        showOnMap - Makes the SearchResult visible on map
        Enable the mapLayer on map and center this
        **********************************************/
        showOnMap: function( map ){
            //Add the mapLayer to the map
            this.mapLayer.addTo(map);

            //Fit to poly or center marker
            if (this.showPoly)
                map.fitBounds(
                    this._getPoly(map).getBounds(),
                    $.extend(
                        {maxZoom: map.getZoom()},
                        map._mapSync_NO_ANIMATION
                    )
                );
            else
                this.centerOnMap( map );

            //Open popup
            var popupOwner = this._getMarker(map) || this._getPoly(map);
            if (popupOwner)
                popupOwner.openPopup();
        }
    };
}(jQuery, L, this.i18next, this, document));