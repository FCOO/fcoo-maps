/****************************************************************************
    map-layer_niord.js,

    Set options for leaflet-bootstrap-niord

****************************************************************************/
(function ($, L, i18next, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},
        nsNiord = window.Niord = window.Niord || {},
        nsNiordOptions = nsNiord.options;

    //Update icon with pro-versions
    $.extend(nsNiordOptions.partIcon, {
        MAP        : 'fal fa-map-marker-alt', //'fa-map-marker',
        //REFERENCE  : 'fa-link',
        //CATEGORY   : 'fa-folder',
        //TIME       : 'fa-clock',
        DETAILS    : $.bsNotyIcon.info, //'fa-info',
        //PROHIBITION: 'fa-times',
        //SIGNALS    : 'fa-volume-up',
        //NOTE       : 'far fa-sticky-note',
        //ATTACHMENT : 'fa-paperclip',
        //AREA       : 'far fa-square',
        //CHART      : 'fa-map',
        //PUBLICATION: 'fa-book-open',
        //SOURCE     : 'fa-copyright'
    });

    //Add link to time-setting for time-part
    nsNiordOptions.partFooter.TIME = ns.globalSettingFooter(ns.events.TIMEZONECHANGED, false/*or true*/ );

    //Set format for different type of data
    //vfFormatId = id for the format to use for date, time and position (latLng) when using the jquery-value-format
    nsNiordOptions.vfFormatId = {
        time        : 'time',           //"16:00" in selected timezone
        date        : 'date',           //"24. Dec 2018" in selected timezone
        date_weekday: 'date_weekday',   //"Monday 24. Dec 2018" in selected timezone
        date_long   : 'date_long',      //"24. December 2018" in selected timezone
        latLng      : ''                //A la N12&deg;34'56" E12&deg;34'56"
    };


    //Set options for when modal and extended modal is available

    //openNewModal : If true a "new"-icon in small-modal will open a new modal. Typical used if small modals are use as popups and the screen is widther
    nsNiordOptions.openNewModal = true;

    //normalModalExtendable : If true the mormal modal can extend to a version with map and inlined attachments.
    nsNiordOptions.normalModalExtendable = ns.modernizrDevice.isDesktop || ns.modernizrDevice.isTablet;


    //modalFooter = Footer in modal
    nsNiordOptions.modalFooter = {
        icon: 'fa-copyright',
        text: 'name:dma',
        link: 'link:dma'
    };
    nsNiordOptions.modalSmallFooter = null; //OR nsNiordOptions.modalFooter;

    //domainOnlyHover = [domain-id] of boolean. If true => polygon only 'visible' on hover
    nsNiordOptions.domainOnlyHover = {fa: true};

    //Icon for filter rest-button = gray filter with cross over
    nsNiordOptions.resetFilterIcon = [['fal text-secondary fa-filter', 'fa-times']];


    /**********************************************************
    options for leaflet-bootstrap-niord
    **********************************************************/
    var nsNiordOptionsLeaflet = nsNiordOptions.leaflet;

    //tileUrl = url for the tile-layer of the map inside the bsModal-window
    //nsNiordOptionsLeaflet.tileUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    //mapOptions = options for map-objects in modal-windows
    $.extend(nsNiordOptionsLeaflet.mapOptions, {maxZoom: 18});

    //mmmIcons = class-names for different icons used in select of details in modal
    $.extend(nsNiordOptionsLeaflet.mmmIcons, {
        tooltipIcon: 'fa-rectangle-wide'
    });

    /**************************************************
    Set up onClickCoordinate to use common latLng-modal
    **************************************************/
    nsNiord.options.onClickCoordinate  = function(coord, text/*, message*/){
        //Include text only if the current format is different from 'standard' Niord-format (= degree + decimal minutes)
        L.latLng(coord[1], coord[0]).asModal( ns.globalSetting.get('latlng') != window.latLngFormat.LATLNGFORMAT_DMM ? {header: {text:text}} : null);
    };

    /**************************************************
    Set up default error for Niord-data
    **************************************************/
    var firstError = true;
    window.Niord.defaultPromiseOptions = {useDefaultErrorHandler: false};
    window.Niord.defaultErrorHandler = function(){
        if (firstError)
            $.bsNoty({
                type     : 'error',
                layout   : 'topCenter',
                closeWith: ['button'],
                content  : [
                    $('<div class="font-weight-bold"/>').i18n({da:'Fejl', en:'Error'}),
                    {
                        da: 'Der opstod en fejl under hentning af data med Navigationsadvarsler, Efterretninger for Søfarende samt Skydeområder og Skydeadvarsler fra Søfartsstyrelsen.<br>'+
                            'Prøv at indlæse siden igen lidt senere eller se informationerne på',
                        en: 'An error occurred while retrieving data with Navigational Warnings, Notices to Mariners, as well as Firing Areas and Warnings from the Danish Maritime Authority.<br>'+
                            'Try to reload this page later or find the information at'
                    },
                    {
                        text: {da:'Søfartsstyrelsens hjemmeside', en:'the Danish Maritime Authority webpage'},
                        link: {da:'https://www.soefartsstyrelsen.dk', en: 'https://www.dma.dk'}
                    }
                ]
            });
        firstError = false;
        return false;
    };


    /**************************************************
    Add header (name) for the combines group of fa and fe
    **************************************************/
    i18next.addPhrases('niord', {
        'fa-fe_plural': {da:'Skydeområder og -advarsler',   en:'Firing Areas and Warnings'}
    });

    //Use same buttons in legends
    var niordOptions = window.Niord.options,
        niordLegendButtonList = [
            {icon: 'fa-th-list',                      text: {da:'Vis alle', en:'Show all'}, onClick: function(){ window.Niord.messages.asModal();  }},
            {icon: niordOptions.partIcon.PUBLICATION, text: 'niord:PUBLICATION',            onClick: function(){ window.Niord.publications.show(); }}
        ];

    /**************************************************
    MapLayer_Niord = Extended MapLayer with Niord-data
    **************************************************/
    function MapLayer_Niord(options) {
        $.extend(options, {
            layerOptions: {
                domain       : options.domain,
                backgroundWMS: options.backgroundWMS,
                colorInfo    : options.colorInfo,
                minZoom      : 6,
            },
            paneId          : 'NAVIGATION_NIORD',
            createPane      : true,
            createMarkerPane: true,
            minZoom         : 6,
            buttonList      : niordLegendButtonList
        });
        nsMap.MapLayer.call(this, options);
    }
    MapLayer_Niord.prototype = Object.create(nsMap.MapLayer.prototype);
    MapLayer_Niord.prototype.createLayer = function(options){
        if (options.backgroundWMS)
            return L.layerGroup([
                new L.GeoJSON.Niord(options),
                nsMap.layer_static({
                    layers   : options.backgroundWMS,
                    minZoom  : options.minZoom,
                    maxZoom  : options.maxZoom,
                    colorInfo: options.colorInfo
                })
            ]);
        else
            return new L.GeoJSON.Niord(options);
    };


    //Add three different Niord-map-layers
    //Navigational Warnings (nw) and Notices to Mariners (nm) are identical
    $.each(['nw', 'nm'], function(index, id){
        nsMap._addMapLayer('navigation_niord_'+id, MapLayer_Niord, {
            domain: id,
            icon  : L.bsMarkerAsIcon('niord-'+id, 'niord-'+id),
            text  : 'niord:'+id+'_plural',
        });
    });

    //Firing Areas and Warnings is a special case since it contains two Niord domains and a underling map-layer with inactice areas
    nsMap._addMapLayer('navigation_niord_fa', MapLayer_Niord, {
        domain       : 'fa fe',
        backgroundWMS: 'firing-areas-dk_latest',
        icon         : L.bsMarkerAsIcon('niord-fe', 'niord-fe', {faClassName: 'fa-triangle',    extraClassName:'fa-rotate-90'}),
        text         : 'niord:fa-fe_plural',

buttonList      : niordLegendButtonList,


//TEST START
radioGroup: 'TEST',
colorInfo: {
    show: true,
    icon: 'far fa-home',
    onlyLand : false,
    onlyWater : true,
    bgColor: 'yellow',
    width: 199,
    allowTransparentColor: true,
    getColor: function(options){
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return options.transparent ? color : '';
    },


    getText: function(options){
        return options.transparent ? {icon: 'fa-home', text: Math.random()} : {icon:'fa-grin-beam', text:'BINGO'};
    }
},
//TEST END
    });

}(jQuery, L, this.i18next, this, document));
