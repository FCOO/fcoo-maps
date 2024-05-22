/****************************************************************************
10_fcoo-maps_setup.js,

Default options DEFAULT-OPTIONS for fcoo.maps.createApplication( options: OPTIONS, defaultOptions: DEFAULT-OPTIONS,...}

The default options are an extended version of the defalut application options from fcoo-application: src/fcoo-application-default-options


****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /****************************************************************************
    OPTIONS and DEFAULT-OPTIONS are extended with
    {

        ** maps and multi-maps **
        //Default map
        map: {
            minZoom:  3,
            maxZoom: 12,
        },

        //Multi maps
        multiMaps: {
            enabled           : true, //OR {mobile:BOOLEAN, tablet:BOOLEAN, desktop:BOOLEAN}
            maxMaps           : 5, //OR {mobile:INTEGER, tablet:INTEGER, desktop:INTEGER}
            maxZoomOffset     : 2
        }
    }

    ****************************************************************************/


    /****************************************************************************
    adjustMenuItemIcon( icon )
    Allow the icon of menu-items to be given in different ways.

    In fcoo/jquery-bootstrap there are the method $.bsMarkerAsIcon:
        $.bsMarkerAsIcon(colorClassName, borderColorClassName, options)
        Return options to create a marker-icon = round icon with
        inner color given as color in colorClassName and
        border-color given as color in borderColorClassName
        options:
            faClassName: fa-class for symbol. Default = "fa-circle"
            extraClassName: string or string[]. Extra class-name added
            partOfList : true if the icon is part of a list => return [icon-name] instead of [[icon-name]]


    In fcoo/leaflet-bootstrap-marker there are the method L.bsMarkerAsIcon:
        L.bsMarkerAsIcon
        Return the options to create a icon locking like a bsMarker[TYPE]
        with the given color and border-color
        Can be used in four ways:
            1:  L.bsMarkerAsIcon(options: OBJECT)
                    options = same as for BsMarkerBase BsMarkerCircle

            2:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, round: BOOLEAN = true)

            3:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, faClassName: STRING)

            4:  L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, options: OBJECT)
                    options = {
                        faClassName   : STRING (default = 'fa-circle'),
                        extraClassName: STRING (default = '')}
                    }

    function adjustMenuItemIcon( options )
        if options = {
                [colorClassName || borderColorClassName],
                faClassName   : STRING (optional)
                extraClassName: STRING (optional)
                round         : BOOLEAN (optional)
            }  => use $.bsMarkerAsIcon(colorClassName: STRING, borderColorClassName: STRING, options: OBJECT)
        if options = {
                [colorName || borderColorName],
                faClassName   : STRING (optional)
                extraClassName: STRING (optional)
                round         : BOOLEAN (optional)
            }  => use L.bsMarkerAsIcon(colorName: STRING, borderColorName: STRING, options: OBJECT)

    ****************************************************************************/
    function adjustMenuItemIcon( options ){
        if (!options || $.isArray(options))
            return options;

        if (typeof options == 'string')
            return [[options]];

        var result      = '',
            iconOptions = {
                faClassName   : options.faClassName ? options.faClassName : options.round ? 'fa-circle' : 'fa-square-full',
                extraClassName: options.extraClassName
            };

        if (options.colorClassName || options.borderColorClassName)
            //Use $.bsMarkerAsIcon(colorClassName, borderColorClassName, options)
            result = $.bsMarkerAsIcon(options.colorClassName, options.borderColorClassName, iconOptions );


        if (options.colorName || options.borderColorName)
            //Use L.bsMarkerAsIcon
            result = L.bsMarkerAsIcon(options.colorName, options.borderColorName, iconOptions);

        return result;
    }


    /****************************************************************************
    Extend ns.defaultApplicationOptions with default options for map-application
    ****************************************************************************/
    ns.defaultApplicationOptions = $.extend(true, ns.defaultApplicationOptions, {
        topMenu: {
            search   : true,                                    //true if use search
            nominatim: 'https://nominatim.openstreetmap.org',   //Path to OpenStreetMap Nominatin-service

            /*
            help, messages, warning = Path to messages-files. Two versions:
            1: Relative path locally e.q. "data/info.json"
            2: Using ns.dataFilePath (See fcoo-data-files): {subDir:STRING, fileName:STRING}. E.q. {subDir: "theSubDir", fileName:"fileName.json"} => "https://app.fcoo.dk/static/theSubDir/fileName.json"
            */
            help     : null, //null or STRING or {subDir:STRING, fileName:STRING}
            messages : null, //null or STRING or {subDir:STRING, fileName:STRING}
            warning  : null, //null or STRING or {subDir:STRING, fileName:STRING}

            helpId: {   //id in help message-file for different default modals
                globalSetting  : '',  //Modal with fcoo.globalSetting
                mapSetting     : '',  //Modal with settings for a single map
                multiMapSetting: '',  //Modal with multi-maps setting
            },

            //Add button before setting-button with settings for map(s)
            preSetting: {
                icon   : ns.icons.mapSettingGlobal,
                onClick: function(){
                    if (nsMap.hasMultiMaps)
                        nsMap.showMapSettingMain();
                    else
                        nsMap.editMapSetting(0);
                }
            },
            setting: false,
        },

        standardMenuOptions: {
            inclBar     : true,
            barCloseAll : true,

            resetIcon: 'far fa-layer-group',
            reset: {
                resetState  : "RESET",
            }
        },

        leftMenu: {
            width  : 359,   //Width of left-menu. Supports mobil device with screen width = 360+
            buttons: {
                reset  : true,
                setting: true
            },
            isStandardMenu : true,
            bsMenuOptions: {
                adjustIcon: adjustMenuItemIcon
            },
        },
        leftMenuIcon: 'fa-layer-group',

        //Default map
        map: {
            minZoom:  3,
            maxZoom: 12,
        },

        //Multi maps
        multiMaps: {
            enabled: true,
            maxMaps: {
                mobile : 3,
                tablet : 4,
                desktop: 5
            },
            maxZoomOffset: 2
        },

        //Standard setup/options
        standard: {
            wms: {subDir:"layers", fileName:"wms.json"} //Standard options for WMS-layers - see src/layer/layer_wms.js
            //time: {subDir, fileName} - options for time-dimention See github/fcoo/fcoo-maps-time
        }
    });
}(jQuery, window.moment, L, this, document));



