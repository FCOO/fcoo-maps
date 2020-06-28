/*
Estendetions to L.Control.locate
*/

(function (L, window/*, document, undefined*/) {
	"use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {};

    //Add senses to i18next
    window.i18next.addPhrases( 'locate', {
        distance: {
            da: "Din placering<br>er indenfor<br><strong>{{distance}} meter</strong><br>fra dette punkt",
            en: "Your location<br>is within<br><strong>{{distance}} metre</strong><br>from this point"
        },
        state_inactive: {
            da: "Vis din placering",
            en: "Show your location",
        },
        state_requesting: {
            da: "Arbejder...",
            en: "Working..."
        },
        state_following: {
            da: "Følger din placering. Klik for at stoppe",
            en: "Following your location. Click to stop"
        },
        state_active: {
            da: "Viser din placering. Klik for at stoppe",
            en: "Showing your location. Click to stop"
        },
        tooltip: {
            da: "Din placering",
            en: "Your location",
        },
    });


    //Extending the default options
    L.extend( L.Control.Locate.prototype.options, {

            position            : 'bottomright', //Position of the control
            layer               : undefined,     //The layer that the user's location should be drawn on. By default creates a new layer.
            setView             : 'untilPan',    //Updates the map view when location changes. The map view follows the users location. Stops updating the view if the user has manually panned the map.
            keepCurrentZoomLevel: true,          // Keep the current map zoom level when setting the view and only pan.
            flyTo               : true,          // Smooth pan and zoom to the location of the marker. Only works in Leaflet 1.0+.
            clickBehavior: {
                inView   : 'stop',    //When the user clicks on the control while the location is within the current view: stop locating and remove the location marker
                outOfView: 'setView', //When user clicks on the control while the location is outside the current view: zoom and pan to the current location
            },
            returnToPrevBounds: false, //If set, save the map bounds just before centering to the user's location. When control is disabled, set the view back to the bounds that were saved.
            cacheLocation     : true,  // Keep a cache of the location after the user deactivates the control. If set to false, the user has to wait until the locate API returns a new location before they see where they are again.

            drawCircle: true, // If set, a circle that shows the location accuracy is drawn.
            drawMarker: true, // If set, the marker at the users' location is drawn.

            markerClass: L.BsMarkerCircle, // The class to be used to create the marker. For example L.CircleMarker or L.Marker
            markerStyle: {
                size           : 'sm',
                colorName      : 'standard',
                borderColorName: 'black',
                puls           : true,
                tooltipHideWhenPopupOpen: true
            },

            // The CSS class for the icon.
            icon          : 'far fa-crosshairs', //'far fa-dot-circle',
            iconLoading   : ns.icons.working,    //Same spinner as fcoo-application
            iconElementTag: 'i',                 // The element to be created for icons. For example span or i

            circlePadding: [0, 0], // Padding around the accuracy circle.

            metric: true,           // Use metric units.

            // This event is called in case of any location error that is not a time out error.
            onLocationError: function(err) {
                window.notyError({ en: 'ERROR<br><em>' + err.message + '</em>', da: 'FEJL<br><em>' + err.message + '</em>' });
            },

             // This even is called when the user's location is outside the bounds set on the map. The event is called repeatedly when the location changes.
            onLocationOutsideMapBounds: function(control) {
                control.stop();
                window.notyInfo(
                    { en: 'You seem located outside the boundaries of the map', da: 'Du ser ud til at befinde dig udenfor kortets grænser' },
                    { timeout: 5000 }
                );
            },


            showPopup: true, //Display a pop-up when the user click on the inner marker.

            //
            strings: {
                title              : "", //Not used. Is changed in _updateLinkTitle
                metersUnit         : "", //Not used. Is changed in _drawMarker
                feetUnit           : "", //Not used. Is changed in _drawMarker
                popup              : "NOT USED", //Not used. Is changed in _drawMarker
                outsideMapBoundsMsg: "", //Not used. Is set in onLocationOutsideMapBounds
            },

            /** The default options passed to leaflets locate method. */
            locateOptions: {
                maxZoom: Infinity,
                watch  : true,    // if you overwrite this, visualization cannot be updated
                setView: false    // have to set this to false because we have to do setView manually
            }

    });

/* When bsButton is implementet use something a la
<span class="fa-stack fa-sm">
<i class="text-primary far fa-circle fa-pulsate fa-stack-2x"></i>
<i class="fas fa-circle fa-stack-1x" style="color: red;"></i>
<i class="text-primary fas fa-circle fa-xs fa-stack-1x"></i>
</span>For icon in popup selector
*/

    /***********************************************************
    Ocverwrite onAdd to update title on the button
    ***********************************************************/
    L.Control.Locate.prototype.onAdd = function ( onAdd ) {
        return function () {
            var result = onAdd.apply(this, arguments);

            //Add class="leaflet-control-fa-button" to adjust size of icon
            L.DomUtil.addClass( result, "leaflet-control-fa-button" );

            this._updateLinkTitle();

            //Only allow locate if protocol is https
            if (  (window.location.protocol.indexOf('https') == -1) &&
                  (window.location.host.indexOf('localhost') == -1)){
                //Remove onClick and replace with info-box
                L.DomEvent.off(this._link, 'click', this._onClick, this);
                L.DomEvent.on(this._link, 'click', function(){
                    window.notyWarning(
                        {
                            en: 'For security reasons <em>Your location</em> is only available when the protocol is <em>http<strong>s</strong></em>',
                            da: 'Af sikkerhedshensyn er <em>Din placering</em> kun tilgængelig, hvis protokollen er <em>http<strong>s</strong></em>'
                        },
                        { layout :'bottomRight', timeout: 5000, queue: 'leaflet_locateControl', }
                    );
                });
            }


            return result;
        };
	} ( L.Control.Locate.prototype.onAdd );


    /***********************************************************
    Ocverwrite _drawMarker to capture and change the popup
    ***********************************************************/
    L.Control.Locate.prototype._drawMarker = function ( _drawMarker ) {
        return function () {

            var result = _drawMarker.apply(this, arguments);

            this._marker.locateControl = this;

            //Remove the circle again
            this._map.removeLayer( this._circle );

            if (this._marker && !this._marker._tooltip)
                this._marker.bindTooltip({text: 'locate:tooltip'});

            //Replace default text with i18next-translated
            if (this._marker && this._marker._popup){
                var distance = Math.round(this._event.accuracy);
                this._marker
                    .on('popupopen', function( popup ){
                        //Add the circle
                        var locateControl = popup.target.locateControl;
                        locateControl._circle.addTo( locateControl._layer );
                    })
                    .on('popupclose', function( popup ){
                        //Remove the circle
                        var locateControl = popup.target.locateControl;
                        locateControl._map.removeLayer( locateControl._circle );
                    })
                    .setPopupContent(
                            $('<div style="text-align:center"></div>')
                                .i18n('locate:distance', 'html', {distance: distance})
                                .localize()[0]
                        );
            }
            this._updateLinkTitle();

            return result;
        };
	} ( L.Control.Locate.prototype._drawMarker );



    /***********************************************************
    Overwrite _updateContainerStyle to update title on the button and style for marker
    ***********************************************************/
    L.Control.Locate.prototype._updateContainerStyle = function ( _updateContainerStyle ) {
        return function () {
            var result = _updateContainerStyle.apply(this, arguments);
            //Change pulsing of marker
            if (this._marker && this._marker._icon)
                $(this._marker._icon).toggleClass('lbm-puls', !!this._isFollowing());

            this._updateLinkTitle();
            return result;
        };
	} ( L.Control.Locate.prototype._updateContainerStyle );


    /***********************************************************
    _updateLinkTitle
    ***********************************************************/
    L.Control.Locate.prototype._updateLinkTitle = function () {
        var i18n = '';

        //Get the current i18n-code for the title of the button
        if (this._active && !this._event)
            // active but don't have a location yet
            i18n = 'state_requesting';
        else
            if (this._isFollowing())
                i18n = 'state_following';
            else
                if (this._active)
                    i18n = 'state_active';
                else
                    i18n = 'state_inactive';

        $(this._link).i18n('locate:'+i18n, 'title').localize();

    };

}(L, this/*, document*/));

