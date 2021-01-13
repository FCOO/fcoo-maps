/****************************************************************************
layer_pilot-boarding-positions.js

Create GEOJSON-layer to read and display pilot points

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        bsMarkerOptions = {
            size           : 'small',
            colorName      : 'white',
            borderColorName: 'danger',
            innerIconClass : 'fas fa-diamond text-danger',
            scaleInner     : 180,
            round          : true,
            transparent    : true,
            hover          : true,
            tooltipHideWhenPopupOpen: true
        };

    /*****************************************************
    PilotBoardingPosition = One marker
    *****************************************************/
    var PilotBoardingPosition = function(options, groupOptions, list){
        this.options = options;
        this.groupOptions = groupOptions;
        this.list = list;
        this.latLng = L.latLng( this.options.position );
    };

    PilotBoardingPosition.prototype = {
        createMarker: function(){

            this.marker =
                L.bsMarkerCircle( this.latLng, bsMarkerOptions)
                    .bindTooltip(this.options.name);
            return this.marker;
        },

        addPopup: function(marker){
            var _this = this,
                content = [];

            $.each(this.list, function(index, point){
                if (_this.groupOptions.id == point.groupOptions.id){
                    if (content.length)
                        content.push($('<hr style="margin:4px">'));
                    content.push(
                        {text:point.options.name,                   textClass:'d-block'},
                        {vfFormat:'latlng', vfValue: point.latLng,  textClass:'d-block', onClick: $.proxy(_this.showLatLngInModal, _this, point)}
                    );
                }
            });

            //Create header-icon to look like the marker
            var headerIcon = L.bsMarkerAsIcon(bsMarkerOptions.colorName, bsMarkerOptions.borderColorName);
            headerIcon.push('fas fa-diamond fa-inside-circle text-danger');

            marker.bindPopup({
                width  : 180,
                fixable: true,
                header : {
                    icon: [headerIcon],
                    text: this.groupOptions.name
                },
                content: content,

                footer: [
                    {da:'Info/Bestilling:', en:'Info/Order:'},
                    {_icon: 'fa-copyright', text: 'name:danpilot', link: 'link:danpilot'}
//                    {icon: 'fa-copyright', text: 'name:dpa', link: 'link:dpa'}
                ]
            });
        },


        showLatLngInModal: function(point){
            nsMap.latLngAsModal(
                point.latLng, {
                header: [point.groupOptions.name, '-', point.options.name]
            });
        }
    };



    /*****************************************************
    L.GeoJSON.PilotBoardingPositions = L.GeoJSON layer to
    display all points
    *****************************************************/
    L.GeoJSON.PilotBoardingPositions = L.GeoJSON.extend({

        //Default options
		options: {
            fileName: 'fcoo-pilot-boarding-positions.json',
            subDir  : 'navigation'
		},

        //initialize
        initialize: function(initialize){
            return function (/*options*/) {

                var result = initialize.apply(this, arguments);

                this.options.pointToLayer = $.proxy(this.pointToLayer, this);
                this.options.onEachFeature = $.proxy(this.onEachFeature, this);



                this.list = [];

                //Read the meta-data
                window.Promise.getJSON( window.fcoo.dataFilePath(this.options.subDir, this.options.fileName), {}, $.proxy(this._resolve, this) );

                return result;
            };
        } (L.GeoJSON.prototype.initialize),


       //_resolve
       _resolve: function( data ){
            var geoJSON = {
                    type    : "FeatureCollection",
                    features: []
                },
                _this = this;

            //Create all PilotBoardingPosition and add them to the geoJSON-data
            $.each(data, function(index, groupOptions ){
                $.each( groupOptions.pointList, function(index, options ){
                    var pilotBoardingPosition = new PilotBoardingPosition(options, groupOptions, _this.list);
                    _this.list.push(pilotBoardingPosition);

                    geoJSON.features.push({
                        geometry: {
                            type       : "Point",
                            coordinates: [pilotBoardingPosition.latLng.lng, pilotBoardingPosition.latLng.lat]
                        },
                        type      : "Feature",
                        properties: { index: _this.list.length-1 }
                    });
                });
            });
            this.addData( geoJSON );
       },

        _findPilotBoardingPositionByFeature: function( feature, methodName, arg ){
            var pilotBoardingPosition = this.list[ feature.properties.index ];
            return pilotBoardingPosition[methodName].apply(pilotBoardingPosition, arg);
        },

        pointToLayer: function (feature/*, latLng*/) {
            return this._findPilotBoardingPositionByFeature( feature, 'createMarker'/*, [latLng] */);
        },

        //onEachFeature
        onEachFeature: function (feature, layer) {
            return this._findPilotBoardingPositionByFeature( feature, 'addPopup', [layer] );
        },
	});


    /***********************************************************
    MapLayer_PilotBoardingPositions = The fcoo.map.Layer for pilot points
    ***********************************************************/
    function MapLayer_PilotBoardingPositions(options) {
        var icon = $.bsMarkerAsIcon('text-white', 'text-danger')[0];
        icon.push('fas fa-diamond text-danger fa-pilot-boarding-position-diamond');

        nsMap.MapLayer.call(this,
            $.extend({
                icon: [icon],
                text: {da:'Lodsmødesteder', en:'Pilot Boarding Positions'},
                createMarkerPane: true,
                minZoom: 6,

radioGroup: 'TEST',
            }, options)
        );
    }
    nsMap.MapLayer_PilotBoardingPositions = MapLayer_PilotBoardingPositions;

    MapLayer_PilotBoardingPositions.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_PilotBoardingPositions.prototype.createLayer = function(options){
        return new L.GeoJSON.PilotBoardingPositions(null, options);
    };

    var id = 'NAVIGATION_PILOT_BOARDING_POSITIONS';
    bsMarkerOptions.pane = nsMap.getMarkerPaneName(id);
    bsMarkerOptions.shadowPane = nsMap.getShadowPaneName(id);
    nsMap._addMapLayer(id, MapLayer_PilotBoardingPositions);



}(jQuery, L, this, document));
