/****************************************************************************
fcoo-maps-search
****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        searchText             = '',
        selectedSearchResultId = '',
        searchLang             = '', //The language selected during last search
        minSearchLength        = 3;


    ns.events.on( ns.events.LANGUAGECHANGED, function(){
        searchText = '';
    });


    /*************************************************************************
    search( text )
    *************************************************************************/
    nsMap.search = function( text ){
        /* TEST
        text = text || '12 12 - 12 12';
        text = text || "56° 28,619'N - 006° 05,055'E";
        */

        var lang = ns.globalSetting.get('language');
        if (text === null){
            showSearchModalForm(searchText);
            return;
        }
        text = (text || '').trim();

        //If text is same as last search => show same result!
        if ((text == searchText) && (searchLang == lang)){
            showSearchResultModal(searchResultList);
            return;
        }

        //If text to short => open modal to enter search
        if (text.length < minSearchLength){
            showSearchModalForm(text);
            return;
        }

        //Save text and lang as last search
        searchText = text;
        searchLang = lang;

        //Add search to end of history-list
        searchHistoryList.goLast();
        searchHistoryList.add(text);

        //Update input in top-menu with latest search
        nsMap.main.topMenuObject.searchInput.val(searchText);

        //First: Search for position
        var latLngList = nsMap.text2LatLng(text);
        if (latLngList.length){
            var currentGroupHeaderId = null,
                list = [];
            $.each(latLngList, function(index, rec){
                if (rec.groupHeaderId !== currentGroupHeaderId)
                    currentGroupHeaderId = rec.groupHeaderId;
                list.push(
                    new SearchResult({
                            latLng    : rec.latLng,
                            name      : rec.text,
                            type      : rec.groupHeader,
                            isPosition: true
                        })
                );
            });
            showSearchResultModal(list);
        }
        else {
            //If no position was found => search in OpenStreetMap
            var params = {
                    'q'               : searchText,
                    'format'          : 'jsonv2',
                    'polygon_geojson' : 1,
                    'extratags'       : 1,
                    'namedetails'     : 1,
                    'addressdetails'  : 1,
                    'accept-language' : 'en',
                    'limit'           : 20,
                };

            if (lang != 'en')
                params['accept-language'] = lang + ',en';
            $.workingOn();
            Promise.getJSON( nsMap.setupData.topMenu.nominatim + '/search' + L.Util.getParamString(params), {}, nominatim_response, nominatim_reject );
        }
    };

    function nominatim_response(json){
        $.workingOff();

        var list = [], noToInclude = 10;
        $.each(json, function(index, nominatim){
            var searchResult = new SearchResult(nominatim);
            if (searchResult.options.include && noToInclude){
                noToInclude--;
                list.push(searchResult);
            }
        });
        showSearchResultModal(list);
    }

    function nominatim_reject(){
        $.workingOff();
        window.notyError({
            da: 'Søgningen efter "'+searchText+'" mislykkedes<br>Prøv eventuelt igen senere',
            en: 'The search for "'+searchText+'" failed<br>Try again later',
        }, {textAlign: 'center'});
    }


    /*************************************************************************
    showSearchModalForm( text )
    *************************************************************************/
    var searchModalForm = null,
        searchHistoryList = new window.HistoryList({
            action: function( text ){
                if (searchModalForm)
                    searchModalForm.getInput('search').setValue(text);
            }
        });

    function showSearchModalForm( text ){
        searchModalForm = searchModalForm || $.bsModalForm({
            header        : {icon: 'fa-search', text:{da:'Søg efter position eller lokation', en:'Search for Position or Location'}},
            static        : false,
            keyboard      : true,
            formValidation: true,
            content: {
                id         : 'search',
                type       : 'input',
                placeholder: {da:'Søg...', en:'Search..'},
                validators : [ {'stringLength': {min:minSearchLength, trim:true}}, 'notEmpty' ]
            },
            closeWithoutWarning: true,
            historyList: searchHistoryList,
            submitIcon: 'fa-search',
            submitText: {da:'Søg', en:'Search'},
            onSubmit  : function(data){ nsMap.search(data.search); },
        });
        searchModalForm.edit({search: text});
        searchModalForm.getInput('search').$element.get(0).select();
    }


    /*************************************************************************
    showSearchResultModal( list )
    list = []{[icon,] text, [latLng,] [geoJSON]}
    *************************************************************************/
    var searchResultModal = null,
        searchResultList = [],
        selectedSearchResultIndex = -1;

    function showSearchResultModal( list ){

        searchResultList = list;

        var searchAgainButton = {
                type: 'button',
                icon: 'fa-search',
                text: {da:'Søg igen', en:'New Search'},
                onClick: function(){
                    if (searchResultModal)
                        searchResultModal.close();
                    showSearchModalForm(searchText);
                }
            },
            selectlistItems = [];

        //Create result-list
        selectedSearchResultIndex = 0;
        $.each(list, function(index, searchResult){
            if (searchResult.id == selectedSearchResultId)
                selectedSearchResultIndex = index;
        });
        var inclDetails = true;
        $.each(list, function(index, searchResult){
            if (searchResult.options.isPosition)
                inclDetails = false;
            selectlistItems.push(
                    searchResult.listContent({
                        id       : searchResult.options.latLng ? 'item_'+index : null,
                        selected : index == selectedSearchResultIndex,
                        textClass: 'text-wrap'
                    })
            );
        });

        if (selectlistItems.length){
            var onClick = function(){
                    searchResultModal.close();
                    searchResultList[selectedSearchResultIndex].showOnMainMap();
                },
                buttons = [];


            if (inclDetails)
                buttons.push({
                    icon   : 'fa-info-circle',
                    text   : {da:'Detaljer', en:'Details'},
                    onClick: function(){
                        searchResultList[selectedSearchResultIndex].showDetails();
                    }
                });
            buttons.push({
                icon   : 'fa-map-marker',
                text   : {da:'Vis på kort', en:'Show on map'},
                onClick: onClick
            });

            var options = {
                    header   : {icon: 'fa-search', text:{da:'Søgeresultater', en:'Search Results'}},
                    static   : false,
                    keyboard : true,
                    flexWidth: true,
                    content : [{
                        type : 'text',
                        label: {da:'Søgte efter', en:'Searched for'},
                        text : searchText,
                        after: searchAgainButton
                    },{
                        type  : 'selectlist',
                        list  : selectlistItems,
                        onChange: function(id){
                            selectedSearchResultIndex = parseInt(id.split('_')[1]);
                            selectedSearchResultId = searchResultList[selectedSearchResultIndex].id;
                        },
                        onDblClick: onClick
                    }],
                    buttons : buttons,
                    footer: {
                        text: {da:'Søgning efter positioner, byer, havområder og lign. - men ikke efter adresser', en:'Search for positions, cities, seas and the likes - but not for addresses'},
                        textClass: 'd-block text-wrap'
                    }
                };
            searchResultModal = searchResultModal ? searchResultModal.update(options) : $.bsModal(options);
            searchResultModal.show();
        }
        else {
            $.bsNoty({
                type     : 'alert',
                layout   : 'center',
                header   : {icon:'fa-search', text:{da:'Søg', en:'Search'}},
                text     : {da:'Søgning after "'+searchText+'" gav ikke noget resultat', en:'Search for "'+searchText+'" gave no result'},
                buttons  : [searchAgainButton],
                closeWith: ['click', 'button'],
                                    timeout  : 4000,
                textAlign: 'center'
            });
        }
    }


    /*************************************************************************
    **************************************************************************
    SearchResult
    Represent one result of a search
    **************************************************************************
    *************************************************************************/
    var searchResultDetailModal = null;

    function SearchResult(options){
        options.include = nsMap.osm_include(options);
        options.address = options.address || {};
        options.latLng = options.latLng || L.latLng(options.lat, options.lon);

        this.id = '_' + (options.osm_id || options.latLng.lat+'_'+options.latLng.lng);

        this.update(options);

        //Create BsModalContentPromise to update modal-content in modal-window and popup
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

            return nsMap.setupData.topMenu.nominatim + '/lookup' + L.Util.getParamString(params);
        },

        _needToUpdate: function(){
            if (this.langDetails && this.langDetails[ ns.globalSetting.get('language') ])
                return false;
            return true;
        },

        _update: function(options){
            if (searchResultDetailModal)
                searchResultDetailModal._bsModalPromise_Update(options);

            if (this.searchResultGeoJSON)
                this.searchResultGeoJSON.update(options);
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

            if (this.searchResultGeoJSON)
                this.searchResultGeoJSON._reject();
        },

        _getModalOptions: function(options){
            this.update(options[0]);

            //Create the dynamic part of the modal-options
            var lang = ns.globalSetting.get('language'),
                content = [{
                    label    : {da:'Navn(e)', en:'Name(s)'},
                    type     : 'textarea',
                    text     : this.names[lang].split('&nbsp;/&nbsp;').join('<br>'),
                    textClass: 'd-block font-weight-bold text-center w-100',
                }];
                content = content.concat( nsMap.osm_details_list(this, {type: 'textarea', textClass: 'd-block text-center w-100'} ) );

            //Special case: Add flag
            if (this.options.extratags && this.options.extratags.flag)
                content.push({
                    label    : {da:'Flag', en:'Flag'},
                    type     : 'textarea',
                    text     : '<img src="'+this.options.extratags.flag+'" style="border: 1px solid gray; height:100px"/>',
                    textClass: 'd-block text-center w-100'
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
            this.searchResultGeoJSON = searchResultGeoJSONList[this.id] = searchResultGeoJSONList[this.id] || new SearchResultGeoJSON(this);
            this.searchResultGeoJSON.searchResult = this;
            this.searchResultGeoJSON.create();

            if (this.searchResultGeoJSON.poly){
                nsMap.mainMap.fitBounds(
                    this.searchResultGeoJSON.poly.getBounds(),
                    $.extend(
                        {maxZoom: nsMap.mainMap.getZoom()},
                        nsMap.mainMap._mapSync_NO_ANIMATION
                    )
                );

                //Only open popup if the poly is hidden at current zoom-level - MANGLER
                //MANGLER this.searchResultGeoJSON.poly.openPopup();
            }
            else
                nsMap.mainMap.setView(this.options.latLng, null, nsMap.mainMap._mapSync_NO_ANIMATION);
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
                        buttons: [{
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

    /*************************************************************************
    SearchResultGeoJSON
    Represent one result of a search as geoJSON on the main map
    *************************************************************************/
    var searchResultGeoJSONList = {},
        searchResultLineColor = 'black',
        searchResultColor     = 'osm';

    function SearchResultGeoJSON(searchResult){
        this.searchResult = searchResult;
    }

	//Extend the prototype
	SearchResultGeoJSON.prototype = {
        /**********************************************
        create - Create marker and polygon for this.searchResult
        **********************************************/
		create: function(){
            if (this.marker || this.poly) return;

            var map = nsMap.mainMap,
                options         = this.searchResult.options,
                markerSize      = 14,
                markerClassName = '',
                showMarker      = true;

            if (options.geojson && options.geojson.coordinates && (options.geojson.type != 'Point') && (options.geojson.type != 'MultiPoint')){
                /*
                Calculate dimentions of the polygon/line at max-zoom see if it is big enough to be visible at max-zoom eq bigger than the marker
                If it is => hide the marker at the zoom-level where the polygon/line has approx. the same size as the marker
                else => Only show the marker
                */

                var minZoom     = map.getMinZoom(),
                    maxZoom     = map.getMaxZoom(),
                    latLngs     = L.GeoJSON.coordsToLatLngs(options.geojson.coordinates, options.geojson.type == 'MultiPolygon' ? 2 : options.geojson.type == 'LineString' ? 0 : 1),
                    bounds      = L.latLngBounds(latLngs),
                    /* All is shown as line
                    isLine      = (options.geojson.type == 'LineString') || (options.geojson.type == 'MultiLineString'),
                    */

                    widthAtMaxZoom  = Math.abs(map.project(bounds.getNorthWest(), maxZoom).x - map.project(bounds.getNorthEast(), maxZoom).x ),
                    heightAtMaxZoom = Math.abs(map.project(bounds.getNorthWest(), maxZoom).y - map.project(bounds.getSouthWest(), maxZoom).y ),
                    maxDimAtMaxZoom = Math.max(widthAtMaxZoom, heightAtMaxZoom),
                    zoomDiff        = Math.log2(maxDimAtMaxZoom / markerSize),
                    visibleAtZoom   = Math.ceil(maxZoom - zoomDiff),
                    showPoly        = maxDimAtMaxZoom > markerSize;

                showMarker = visibleAtZoom > minZoom;

                if (showPoly){
                    markerClassName = 'hide-for-leaflet-zoom-'+visibleAtZoom+'-up';
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
                    this.poly = L.polyline(latLngs, polylineOptions );


                    this.poly.addTo(map);
                    this.poly.bindTooltip(this.searchResult.header);

                    this._addPopupAndContextMenu(this.poly);

                    //Add class to hide  on when marker is visible
                    this.poly._addClass(null, 'hide-for-leaflet-zoom-'+(visibleAtZoom-1)+'-down');
                }
            }

            if (showMarker){
                //Create the marker
                this.marker = L.bsMarkerCircle(options.latLng, {
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
                this.marker.addClass(markerClassName);
                this.marker.addTo(map);
            }
        },

        /**********************************************
        _addPopupAndContextMenu
        **********************************************/
        _addPopupAndContextMenu: function( obj ){
            if (!this.contextMenuList){
                var expandOnMap = $.proxy(this.expandOnMap, this),
                    removeFromMap = $.proxy(this.removeFromMap, this);
                this.buttonList = [];
                this.contextMenuList = [
                    this.searchResult.header,
                    {id: 'center', icon: 'fa-crosshairs', text:{da:'Centrér', en:'Center'}, onClick: $.proxy(this.centerOnMap, this)}
                ];
                if (this.poly){
                    this.contextMenuList.push({ id: 'expand', icon: 'fa-expand', text:{da:'Udvid', en:'Expand'}, onClick: expandOnMap });
                    this.buttonList.push(     {               icon: 'fa-expand', text:{da:'Udvid', en:'Expand'}, onClick: expandOnMap });
                }
                this.contextMenuList.push({id: 'remove', lineBefore: true, icon: 'fa-trash-alt', text:{da:'Fjern', en:'Remove'}, onClick: removeFromMap});
                this.buttonList.push(     {                                icon: 'fa-trash-alt', text:{da:'Fjern', en:'Remove'}, onClick: removeFromMap});
            }

            //Add contextmenu
            obj
                .setContextmenuWidth(100)
                .addContextmenuItems(this.contextMenuList);


            //Add popup
            if (!this.searchResult.options.isPosition){
                var bsModalContentPromise = this.searchResult.bsModalContentPromise;
                obj.bindPopup({
                    onChange   : $.proxy(bsModalContentPromise.update, bsModalContentPromise),
                    header     : this.searchResult.header,
                    width      : 260,
                    maxHeight  : 200,
                    scroll     : true,
                    content    : ' ',
                    buttons    : this.buttonList.length ? this.buttonList : null,
                    /* Mulighed senere. Pt virker et ikke med bsModalContentPromise
                    minimized: {
                        content: {
                            type: 'textbox',
                            icon: this.searchResult.header.icon,
                            text: this.searchResult.header.text
                        },
                        showHeaderOnClick: true
                    },
                    isMinimized: true,
                    */
                    closeButton: true,
                });
            }
        },

        _reject: function(){
            if (this.marker)
                this.marker._bsModalPromise_Reject();
            if (this.poly)
                this.poly._bsModalPromise_Reject();
        },

        update: function(options){
            if (this.marker)
                this.marker._bsModalPromise_Update(options);
            if (this.poly)
                this.poly._bsModalPromise_Update(options);
        },

        centerOnMap: function(){
            //this.setView();
            this._closePopup();
            nsMap.mainMap.setView(this.searchResult.options.latLng);
        },
        expandOnMap: function(){
            this._closePopup();
            nsMap.mainMap.fitBounds(this.poly.getBounds());
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
            delete searchResultGeoJSONList[this.searchResult.id];
        },

        _closePopup: function(){
            if (this.marker)
                this.marker.closePopup();
            if (this.poly)
                this.poly.closePopup();
        }
	};

}(jQuery, L, this.i18next, this, document));