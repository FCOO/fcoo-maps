/****************************************************************************
fcoo-maps-time
Objects,methods, and events to handle time (moment)
****************************************************************************/
(function ($, L, moment, /*i18next,*/ window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = 'hour',
        timeReady = false;  //Wait for creating the application before the maps time are set

    //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
    nsTime.nowMoment = moment().startOf(unit);

    //currentMoment = moment representing the current moment data on the map is displayed at
    nsTime.currentMoment  = moment(nsTime.nowMoment);

    //currentRelative = relative hour-value representing the current moment data. Saved in application-settings (see below)
    nsTime.currentRelative = 0;

    //currentAnimation = {start, end} relative hour-value representing the start and end of animation
    nsTime.currentAnimation = {start:0, end:24};

    /***************************************
    TIME-MODE
    There are four possible modes to display and select current time/moment:
    'SCALE', 'SELECT', 'RELATIVE', or 'ANIMATION'
    ***************************************/
    var //tmScale       = nsTime.tmScale     = 1,
        //Not used: tmSelect      = nsTime.tmSelect    = 2,
        tmRelative    = nsTime.tmRelative  = 4,
        tmAnimation   = nsTime.tmAnimation = 8,
        //Not used: tmAbsolute    = tmScale + tmSelect,
        tmAnyRelative = tmRelative + tmAnimation;

    nsTime.timeMode = tmRelative; //tmScale;

    //Add timeMode to application-settings
/*
    ns.appSetting.add({
        id          : 'timeMode',
        callApply   : false,
        applyFunc   : function( timeMode ){
            nsTime.timeMode = timeMode;
            ns.events.fire('TIMEMODECHANGED', timeMode);
//console.log('MANGLER timeMode=', timeMode);
        },
        defaultValue: tmScale
    });
*/
    function timeModeIsRelative(){
        return !!(nsTime.timeMode & tmAnyRelative);
    }

    /***************************************
    EVENTS
    There are four events fired in when any of the moment-variables are changed:
    now-moment-changed, current-moment-changed, current-relative-changed, time-mode-changed
    ***************************************/
    //Create global events to be fired when now, current time or time mode is changed
    $.each( ['NOWMOMENTCHANGED', 'CURRENTMOMENTCHANGED', 'CURRENTRELATIVECHANGED', 'TIMEMODECHANGED'], function( index, eventName ){
        ns.events[ eventName ] = eventName;
    });

    /***************************************
    set(newNow, newCurrent, newRelative)
    When one of nsTime.nowMoment, nsTime.currentMoment, or nsTime.currentRelative is changed one of the two other variable is calculated
    Witch one that is recalculated dependes on nsTime.timeMode is relative or absolute mode
    ***************************************/
    function set(newNow, newCurrent, newRelative){
        if (!timeReady) return;

        var previousNow      = nsTime.nowMoment,
            previousCurrent  = nsTime.currentMoment,
            previousRelative = nsTime.currentRelative;

        if (newNow){
            nsTime.nowMoment = newNow;
            if (timeModeIsRelative())
                nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
            else {
                nsTime.currentMoment = nsTime.currentMoment || moment(nsTime.nowMoment);
                nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
            }
        }
        else
        if (newCurrent){
            nsTime.currentMoment = newCurrent;
            nsTime.currentRelative = nsTime.currentMoment.diff(nsTime.nowMoment, unit);
        }
        else
        if (newRelative !== false){
            nsTime.currentRelative = newRelative;
            nsTime.currentMoment = moment(nsTime.nowMoment).add(nsTime.currentRelative, unit);
        }


        var data = {
                now             : nsTime.nowMoment,
                nowMoment       : nsTime.nowMoment,
                current         : nsTime.currentMoment,
                currentMoment   : nsTime.currentMoment,
                relative        : nsTime.currentRelative,
                currentRelative : nsTime.currentRelative
            },
            updateMaps = false;

        if (!previousNow || !previousNow.isSame(nsTime.nowMoment)){
            ns.events.fire('NOWMOMENTCHANGED', data);
            updateMaps = true;
        }
        if (!previousCurrent || !previousCurrent.isSame(nsTime.currentMoment)){
            ns.events.fire('CURRENTMOMENTCHANGED', data);
            updateMaps = true;
        }
        if (!previousRelative || (previousRelative != nsTime.currentRelative)){
            ns.events.fire('CURRENTRELATIVECHANGED', data);
            ns.appSetting.data['currentRelative'] = nsTime.currentRelative;
            ns.appSetting.save();
            updateMaps = true;
        }

        if (updateMaps)
            nsMap.callAllMaps('_updateTime');
    }

    /******************************************************************
    nsTime.setNowMoment()
    nsTime.setCurrentMoment( newCurrentMoment )
    nsTime.setCurrentRelative( newCurrentRelative )
    nsTime.setCurrentAnimation( startAndEnd )
    ******************************************************************/
    nsTime.setNowMoment = function()                          { set( moment().startOf(unit), false,            false              ); };
    nsTime.setCurrentMoment = function( newCurrentMoment )    { set( false,                  newCurrentMoment, false              ); };
    nsTime.setCurrentRelative = function( newCurrentRelative ){ set( false,                  false,            newCurrentRelative ); };

    nsTime.setCurrentAnimation = function( startAndEnd ){
        nsTime.currentAnimation = startAndEnd;
        ns.appSetting.data['currentAnimation'] = nsTime.currentAnimation;
        ns.appSetting.save();

        //TODO - MANGLER: Update whatever need to be updated
    };

    //Add currentRelative and currentAnimation to application-settings
    ns.appSetting.add({
        id          : 'currentRelative',
        callApply   : false,
        applyFunc   : nsTime.setCurrentRelative,
        defaultValue: 0
    });
    ns.appSetting.add({
        id          : 'currentAnimation',
        callApply   : false,
        applyFunc   : nsTime.setCurrentAnimation,
        defaultValue: {start:0, end:24}
    });


    //Add init-function to be called at the end of creating the site
    nsMap.addFinallyEvent(function(){
        //Reset all global variable to force update
        nsTime.nowMoment       = null;
        nsTime.currentMoment   = null;
        nsTime.currentRelative = null;

        timeReady = true;

        window.intervals.addInterval({
            duration: 60,
            data    : {},
            resolve : nsTime.setNowMoment
        });
    });


    /******************************************************************
    The time displayed in a given map is stored in
    map.time = {now: MOMENT, current: MOMENT, relative: NUMBER}

    When any of these vaules change the following events are fired on the map:
    "momentchanged" with parameter {now: MOMENT, current: MOMENT, relative: NUMBER}
    "datetimechange" with parameter {datetime: ISOSTRING} for backware compatibility
    ******************************************************************/

    /******************************************************************
    L.Map.prototype._updateTime
    ******************************************************************/
    L.Map.prototype._updateTime = function(){
        if (!timeReady || !this.isVisibleInMultiMaps)
            return this;

        //Create own copy of current
        this.time = {
            now     : nsTime.nowMoment,
            current : moment(nsTime.currentMoment),
            relative: nsTime.currentRelative
        };

        //Adjust for timme-offset in sync with main map
        if (this./*bsMapSyncInfoControl*/bsTimeInfoControl && this.options.mapSync && this.options.mapSync.timeOffset){
            var timeOffset = this.options.mapSync.timeOffset;
            this.time.current.add(timeOffset, unit);
            this.time.relative += timeOffset;
        }

        var newTimeAsString =
                this.time.now.toISOString() + '_' +
                this.time.current.toISOString() + '_' +
                this.time.relative;

        if (this.timeAsString == newTimeAsString)
            return this;

        this.timeAsString = newTimeAsString;

        //Update /*bsMapSyncInfoControl*/bsTimeInfoControl
        if (this./*bsMapSyncInfoControl*/bsTimeInfoControl)
            this./*bsMapSyncInfoControl*/bsTimeInfoControl.$currentTime.vfValue(this.time.current);

        //Call events
        this.fire("momentchanged", this.time);
        this.fire("datetimechange", {datetime: this.time.current.toISOString()});

        return this;
    };

    /******************************************************************
    L.Control.BsTimeInfoControl 
    Control to show current time and info on time sync with main map
    ******************************************************************/
    L.Control.BsTimeInfoControl = L.Control.BsButtonBox.extend({
        options: {
            position       : "topcenter",
            small          : window.bsIsTouch,
            tooltipOnButton: true,
            width          : 'auto',
            content : {
                semiTransparent: true,
                clickable      : true,
                noHeader       : true,
                useTouchSize   : false,
                small          : true,
                content        : 'This is not empty',
            },
        },

        initialize: function(options){
            var msgHeader = nsMap.msgHeader[nsMap.msgSync];

            options = options || {};
            options.popupList = options.isMainMap ? [] : [{
                type        : 'button',
                icon        : msgHeader.icon,
                text        : msgHeader.smallText,
                onClick     : $.proxy(this.editSetting, this),
                closeOnClick: true,
                lineAfter   : true
            }];
            //Add links to settings for timezone and date & time-format
            $.each(['TIMEZONECHANGED','DATETIMEFORMATCHANGED'], function(index, id){
                var accOptions = ns.globalSettingAccordion(id);
                options.popupList.push({
                    type     : 'button',
                    icon     : accOptions.header.icon,
                    text     : accOptions.header.text,
                    onClick  : function(){ ns.globalSetting.edit(id); },
                    closeOnClick: true,
                });
            });
            L.Control.BsButtonBox.prototype.initialize.call(this, options);
        },

        onAdd: function(map){
            this._map = map;
            var isMainMap = this.options.isMainMap,
                isSecondaryMap = !isMainMap,
                result = L.Control.BsButtonBox.prototype.onAdd.call(this, map),
                $contentContainer = this.$contentContainer.bsModal.$body;

            if (isSecondaryMap)
                this.bsButton.removeClass('square');
            this.$container.css('cursor', 'default'); //Why do I need to do this?

            //Append time-icon to both button and content
            $contentContainer.empty()._bsAddHtml(
                isMainMap ? [
                    {icon: 'fa-clock', text:'12:00 am(+1)', textClass: 'current-time'}
                ] : [
                    {icon: 'fa-clock', text:'12:00 am(+1)', textClass: 'current-time'},
                    {                  text:'+24t',         textClass: 'time-sync-info-text'}

                ]
            );
            this.bsButton
                .empty()
                .addClass('show-as-normal') //To allow the button to be 'normal' when disabled
                ._bsAddHtml(
                    isMainMap ?
                        {icon: 'fa-clock fa-lg'} :
                        {icon: 'fa-clock', text:'not empty', textClass: 'time-sync-info-text'}
                );

            this.timeSyncList = this.$container.find('span.time-sync-info-text');

            this.$currentTime = $contentContainer.find('span.current-time');
            if (isSecondaryMap)
                this.timeSyncList.css({
                    'border-left' : '1px solid gray',
                    'padding-left': '.35em'
                });
            this.$currentTime.vfFormat('time_now_sup');
            return result;
        },

        editSetting: function(){
            nsMap.editMapSetting( this._map.fcooMapIndex, {msgIndex: nsMap.msgSync} );
        },

        onChange: function(options){
            if (!this.options.isMainMap){
                var syncOptions = this._map.options.mapSync || {};

                this.bsButton.toggleClass('disabled', !this.options.show);

                //If timeOffset != 0 and the bsTimeInfoControl is hidden it is forced to be displayed to allways see the time-offset
                var forcedShown = !this.options.show && (syncOptions.timeOffset != 0);
                this.$container.toggleClass('forced-shown', forcedShown);
                if (forcedShown)
                    this.disable();
                else
                    this.enable();

                var isRelative = (syncOptions.timeOffset != 0);

                //Update sync time (relative time)
                this.timeSyncList.empty().hide();
                if (isRelative){
                    var text = (syncOptions.timeOffset > 0 ? '+ ' : '- ') + Math.abs(syncOptions.timeOffset);
                    this.timeSyncList.i18n({da: text+'t', en: text+'h'}, 'html').show();
                }

                //Adjust the button: 
                //If not reletive => shape = square and big icon and no margin
                this.bsButton.toggleClass('square', !isRelative);
                this.bsButton.find('i')
                    .toggleClass('icon-active', isRelative)
                    .toggleClass('fa-lg fa-no-margin', !isRelative);
                this.$contentContainer.find('i').toggleClass('icon-active', isRelative);
            }

            //Update current time of the map
            this._map._updateTime();
        },
    });

    
    L.Map.addInitHook(function () {
        this.on('showinmultimaps', this._updateTime, this);
    
        if (this.options.timeInfoControl) {
            this.bsTimeInfoControl = new L.Control.BsTimeInfoControl({isMainMap: this.options.isMainMap});
            this.addControl(this.bsTimeInfoControl);
        }
    });
}(jQuery, L, window.moment, /*window.i18next,*/ this, document));