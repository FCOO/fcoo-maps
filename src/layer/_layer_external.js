/****************************************************************************
    layer_external.js,

    Load options for external tile-provider
    Create L.Layer-Class to contain external layer

****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    //Create namespaces
    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    var defaultOptions = {
            "osm": {
                "name": {"da": "OpenStreetMap", "en": "OpenStreetMap"},
                "url" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "background": true,
                "attribution": {
                    "name": "OpenStreetMap",
                    "link": "https://www.openstreetmap.org/copyright"
                },
                "defaultOptions"   : {
                    "subdomains"  : "abc"
                }
            },
            "esri" : {
                "list": [{
                    "name": {"da": "Esri (sub-sæt)", "en": "Esri (Subset)"},
                    "url" : "",
                    "background": true
                }, {
                    "name": {"da": "Esri (sub-sæt #2)", "en": "Esri (Subset #2)"},
                    "url" : "",
                    "background": true
                }],

                "attribution": {
                    "name": "Esri",
                    "link": "https://www.esri.com"
                },
                "defaultOptions"   : {
                }
            }
        };


    //Load external-options from setup-file MANGLER
    ns.promiseList.append({
        _fileName: {subDir:"layers", fileName:"external.json"},
        data     : defaultOptions,
        resolve  : function(options){
            $.each(options, function(/*id, external*/){
                //console.log(id, external.url);
            });
        }
    });


    /***********************************************************
    layer_external - Creates a L.tileLayer with layer from an
    external provider
    ***********************************************************/
    nsMap.layer_external = function(/*id, options*/){


    };

}(jQuery, L, this, document));
