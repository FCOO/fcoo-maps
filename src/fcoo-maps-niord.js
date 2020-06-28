/****************************************************************************
    fcoo-maps-niord.js,

    Set options for leaflet-bootstrap-niord

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsNiordOptions = window.Niord.options;

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
        latLng      : ''  //A la N12&deg;34'56" E12&deg;34'56"
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


    //********************************************

}(jQuery, L, this, document));
