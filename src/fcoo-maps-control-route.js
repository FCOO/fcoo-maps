/****************************************************************************
fcoo-maps-control-route.js

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {};


    //Slider-options for different speed-units
    var speedeSliderOptions = {};
    speedeSliderOptions[ns.unit.METRIC]   = { min: 1, max: 20 };
    speedeSliderOptions[ns.unit.METRIC2]  = { min: 4, max: 70 };
    speedeSliderOptions[ns.unit.NAUTICAL] = { min: 2, max: 40 };

    var routeChangeCount =  0; //'Dummy' variable increased every time the route is changed. Used to detect changes in the form

    L.Control.Route = L.Control.BsButton.extend({
        options: {
            //position: "bottomright",
            position: "topcenter",
            icon    : 'fa-route',
        },

        initialize: function(options) {
            L.Util.setOptions(this, options);

            var _this = this;

            this.data = {
                departure: moment(),
                arrival  : moment(),
                speed    : 10 //unit = dafault (= knots)
            };

            this.editData = {
                departure: 0,
                speed    : this.data.speed,
                dummy    : -1,
            };
            this.currentMomentValue = 0; // = The current relative time on the map. Is set using this.setMoment( moment )


            //Create the modalForm-control to edit depature time and speed
            var routeTutorial = [
                {da: '- Klik på kortet for at tilføje et punkt',  en: '- Click on the map to add a point'},
                {da: '- Klik på linie for at tilføje et punkt',   en: '- Click on a line to add a point'},
                {da: '- Træk i et punkt for at ændre det',        en: '- Drag a point to change it'},
                {da: '- Klik på et punkt for fjerne det',         en: '- Click on a point to remove it'},
            ];
            $.each( routeTutorial, function( index, text ){
                routeTutorial[index] = {type:'textbox', noBorder: true, text: text};
            });

            this.modalFormControl = L.control.bsModalForm({
                id: 'formRoute',
                header: {icon: 'fa-route', text:{da: 'Rute', en:'Route'}},
                width: 320,
                _fixedContent: 'FIXED',
                isExtended: true,
                useExtended: true,
                content: '',
                extended: {
                    content: {
                        type: 'accordion',
                        list: [
                            {
                                icon: 'fa-route', text: {da:'Ruten', en:'The Route'},
                                content: routeTutorial
                            },
                            {
                                icon: 'fa-ship', text: {da:'Dit fartøj', en:'Your Vessel'},
                                content: [
                                    //Hidden element to register route change
                                    {   id: 'dummy', type: 'hidden' },

                                    //Slider for departure
                                    {
                                        id: 'departure', type:'timeslider',
                                        label: {icon: 'fa-clock', text:{da:'Afgang', en:'Departure'}},
                                        min:-24, max:48, majorTicksOffset:0, stepOffset:0,
                                        showFromTo: true, grid: true, handleFixed: true, mousewheel: true, showLineColor: false, resizable: false,

                                        lineColors        : [{ to: 0, color: '#7ABAE1'}, {color:'#4D72B8'}],
                                        labelColors       : [{value:0, backgroundColor:'green', color:'white'}],

                                        width: 3*360,
                                    },
                                    //Slider for speed
                                    {
                                        id: 'speed', type:'slider', _noBorder: false,
                                        label: [
                                            {
                                                icon: 'fa-tachometer',
                                                text: {da:'Hastighed', en:'Speed'},
                                            },
                                            {
                                                vfFormat :'speed_unit',
                                                //vfValue  :' ',
                                                vfOptions: {
                                                    prefix : '(',
                                                    postfix: ')'
                                                }
                                            }
                                        ],
                                        grid: true, min:2, max:30, _showFromTo: false, postfix: ' Kn',
                                    }
                                ]
                            },
                        ]
                    }, //end of content
                }, // end of extended
                onChanging: $.proxy( this.update, this ),
                onSubmit  : $.proxy( this.onSubmit, this ),
                onCancel  : $.proxy( this.onCancel, this ),
                onClose   : $.proxy( this.onClose, this )
            });

            //Create the route
            this.route = new L.Route({
                interactive: false,
                isPolygon: false,
                onUpdate: function( /*list, currentPoint*/ ){
                    //Update 'dummy' data to mark changing of the route
                    routeChangeCount = (routeChangeCount+1) % 1000000;
                    _this.modalFormControl.bsModalForm.originalValues.dummy = routeChangeCount;
                },
                events: {
//                    dragstart: function(){
//                    },
//                    dragend: function(){
//                    }
                }
            });

            //Add the vessel (a yellow boat)
//            this.route.addVessel(-1, {color: "yellow", shape: 'boat'});
            this.route.addVessel(-1, {color: "#4285F4", shape: 'boat'}); //#4285F4 = standard google maps. TODO: use colorName when vesselMarker is implemented in leaflet-bootstrap-marker

            this.options.onClick = $.proxy( this.edit, this );

        },


        /***********************************************
        onAdd
        ***********************************************/
        onAdd: function(map) {
            var result = L.Control.BsButton.prototype.onAdd.call(this, map);
            map.addControl( this.modalFormControl );
            this.route.addTo(map);

            return result;
        },

        /***********************************************
        setMoment - Set current moment and update route
        ***********************************************/
        setMoment: function( m ){
            function roundMoment( m ){ return m.floor(1, 'Hours'); }
            this.currentMomentValue = roundMoment( m ).diff(roundMoment(moment()), 'hours');
            this.update();
        },


        /***********************************************
        edit
        ***********************************************/
        edit: function(){
            $(this.getContainer()).hide();
            this.route.setInteractiveOn();
            this.modalFormControl.edit( this.editData );
        },

        onGlobalEvents: function(/*id, value*/){
            var newSpeedUnit = ns.globalSetting.get('speed');

            this.speedSlider = this.speedSlider || this.modalFormControl.bsModalForm.getInput('speed').getSlider();

            //Convert this.editData.speed from this.speedUnit/default unit => SI-unit => newSpeedUnit
            var speedIS = ns.unit.convertValueBack(this.editData.speed, 'speed', this.speedUnit || ns.globalSetting.settings['speed'].options.defaultValue);
            this.editData.speed = Math.round( ns.unit.getSpeed(speedIS) );

            this.speedUnit = newSpeedUnit;

            //Update this.editData.speed to new unit
            this.update({speed: this.editData.speed});

            //Update speed-slider
            $.extend(this.speedSlider.options, speedeSliderOptions[this.speedUnit]);

            var postfix;
            switch (this.speedUnit){
                case ns.unit.METRIC  : postfix = 'm/s'; break;
                case ns.unit.METRIC2 : postfix = window.i18next.sentence( {da:'km/t', en:'km/h'}); break;
                case ns.unit.NAUTICAL: postfix = 'kn'; break;
            }
            this.speedSlider.options.postfix = ' '+postfix;

            this.speedSlider.update();
            this.speedSlider.setValue(this.editData.speed);
        },

        onSubmit: function( data ){
            this.update( data );
        },
        onCancel: function( data ){
            this.route.restore();
            this.onSubmit( data );
        },
        onClose: function(){
            this.route.setInteractiveOff();
            $(this.getContainer()).show();

        },
        //update
        update: function( editData ){
            this.editData = $.extend( this.editData, editData || {} );
            var vessel = this.route.vesselList[0];
            vessel.distance = (this.currentMomentValue - this.editData.departure)*ns.unit.getSpeedBack(this.editData.speed)*60*60; //Converts speed [selected unit] to speed [m/hour]
            vessel.update();
        }
    }); //end of L.Control.Route
}(jQuery, window.moment, L, this, document));



