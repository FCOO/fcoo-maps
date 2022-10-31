/****************************************************************************
global-events.js
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create fcoo-namespace
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /*****************************************************************************
    ControlGlobalEvents = Object to add methods to be called on global-events for
    different classes of L.Control and L.Layer
    *****************************************************************************/
    var ControlGlobalEvents = function(){
        var _this = this;
        this.events = {};
        $.each( ns.events.eventNames, function(index, eventName){
            ns.events.onLast(eventName, $.proxy(_this.onEvent, _this, eventName));
        });
    };

    $.extend(ControlGlobalEvents.prototype, {
        // add(objectName, eventNames, method) addes a class and event
        add: function(objectName, eventNames, method){
            var _this = this;
            eventNames = $.isArray(eventNames) ? eventNames : eventNames.split(' ');
            $.each(eventNames, function(index, eventName){
                _this.events[eventName] = _this.events[eventName] || {};
                _this.events[eventName][objectName] = method;
            });
        },


        onEvent: function(eventName){
            if (!this.events[eventName])
                return;

            var _this = this;
            //Find all Controls with given 'name' in all maps and call the event-method
            $.each(nsMap.mapList, function(id, map){
                $.each(_this.events[eventName], function(objectName, method){
                    var control = map[objectName];
                    if (control){
                        var func = $.isFunction(method) ? method : control[method];
                        func.call(control, eventName);
                    }
                });
            });
        },
    });
    ns.controlGlobalEvents = new ControlGlobalEvents();


    /*****************************************************************************
    Add methods to different global-events for different controls
    *****************************************************************************/
    //bsScaleControl = L.Control.BsScale
    ns.controlGlobalEvents.add(
        'bsScaleControl',
        [ns.events.UNITCHANGED, ns.events.NUMBERFORMATCHANGED],
        function(){
            var lengthMode = ns.globalSetting.get('length');
            this.setState({
                mode: lengthMode == 'METRIC2' ? 'METRIC' : lengthMode
            });
        }
    );

    //bsPositionControl = L.Control.BsPosition
    //Notyhing - is taken care of by value-format

    //latLngGraticule = L.latLngGraticule
    ns.controlGlobalEvents.add('latLngGraticule', ns.events.NUMBERFORMATCHANGED, '_draw');

    //routeControl = L.Control.Route
    ns.controlGlobalEvents.add('routeControl', [ns.events.UNITCHANGED, ns.events.LANGUAGECHANGED], 'onGlobalEvents');

}(jQuery, L, this, document));



