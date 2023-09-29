/****************************************************************************
10_fcoo-maps_setup.js,

Description and default value of SETUP in
window.fcoo.map.createApplication(setup: SETUP of FILE-OF-SETUP, layerMenu: []FILE-OF-MENU-OPTIONS or []MENU-OPTIONS or {MENU-ID: MENU-OPTIONS})
See src/fcoo-maps.js

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    /****************************************************************************
    SETUP = {
        applicationName  : {da:STRING, en:STRING},  //applicationName or applicationHeader are used. Two options aavaiable for backward combability
        applicationHeader: {da:STRING, en:STRING},

        topMenu: {
            See description in fcoo/fcoo-application and in nsMap.default_setup below
        }

        layerMenuOptions: {
            inclBar    : true,
            barCloseAll: true,
            inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true)
            barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus
            favorites  : Nothing or false. Nothing = default saving, false: no favorites
        }

        leftMenu/rightMenu: true or false or {
            width: 359,
            buttons: As leftMenuButtons and rightMenuButtons in fcoo-aapplication = {
                preButtons  = []buttonOptions or buttonOptions or null //Individuel button(s) placed before the standard buttons
                save        = true or onClick or buttonOptions, //Standard save-button
                load        = true or onClick or buttonOptions, //Standard load-button
                bookmark    = true or onClick or buttonOptions, //Standard bootmark-button
                share       = true or onClick or buttonOptions, //Standard share-button
                user        = true or onClick or buttonOptions, //Standard user-button
                setting     = true or onClick or buttonOptions, //Standard setting-button
                postButtons = []buttonOptions or buttonOptions or null //Individuel button(s) placed after the standard buttons
            }

            isLayerMenu   : true    //True => the layer-menu is created in this side
            bsMenuOptions : {}    //Only if isLayerMenu: true => options for $.BsMmenu when creating the content of the left/right side


            if isLayerMenu: false:
            fileName: FILENAME, or
            data    : JSON-OBJECT, or
            content : A JSON-OBJECT with content as in fcoo/jquery-bootstrap

            create or resolve : function( data, $container ) - function to create the menus content in $container. Only if fileName or data is given (and isLayerMenu: false)

        },

        keepLeftMenuButton  : false, //Keeps the left menu-button even if leftMenu is null
        keepRightMenuButton : false, //Keeps the right menu-button even if rightMenu is null


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


        ** Standard setup/options in setup-files or as objects **
        ** The following ids are fixed and the corresponding resolve-methods are given in the default-oin the


        ** Setup-files or objects used by the specific application **
        metadata: {
            fileName: FILENAME,
            resolve : function( data ),
            reload  : BOOLEAN or NUMBER. If true the file will be reloaded every hour. If NUMBER the file will be reloaded every reload minutes
        },
        other: []{fileName, resolve, reload} Same as metadata

        finally: function() - optional. Function to be called when all is ready


        //A list of setup-files or objects are used


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
                faClassName   : options.faClassName ? options.faClassName : options.round ? 'fa-circle' : 'fa-square',
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



    nsMap.default_setup = {
            applicationName: {da:'Dansk titel', en:'English title'},


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
                    icon   : ns.icons.mapSetting,
                    onClick: function(){
                                 if (nsMap.hasMultiMaps)
                                     nsMap.showMapSettingMain();
                                 else
                                     nsMap.editMapSetting(0);
                             }
                },
                setting: false,
            },

            layerMenuOptions: {
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
                isLayerMenu : true,
                bsMenuOptions: {
                    adjustIcon: adjustMenuItemIcon
                },

                content    : '',
                resolve    : null
            },
            keepLeftMenuButton: false,

            rightMenu          : false,
            keepRightMenuButton: false,


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
            },


            other: null, //PROMISE_OPTIONS or []PROMISE_OPTIONS

            metaData: null, //PROMISE_OPTIONS


            finally: null  //function() that are called when all setup- and menu-files/options are read and processed


        };



}(jQuery, window.moment, L, this, document));



