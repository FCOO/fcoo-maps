/****************************************************************************
fcoo-maps-search-details.js
****************************************************************************/
(function (window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    //details = same structure as json result from nominatim.openstreetmap.org/details?osmtype=R&osmid=2263653&format=json&pretty=1&addressdetails=1&keywords=0&group_hierarchy=0
    //with {da:STRING,en:STRING} for the values to include



    var details = {
            "typeText": {da:'Type', en:'Type', options:{textClass: 'd-block text-center w-100 text-capitalize'}},
            "options" : {
                "display_name": { da: "Detaljer", en:"Details"},
                "extratags"   : {
                    "sqkm"            : {da:'Areal', en:'Area', vfFormat:'area', convert:function(km2){return parseInt(km2)*1000*1000;}},
                    "population"      : {da:'Befolkning', en:'Population', vfFormat:'number'},
                    "capital_city"    : {da:'Hovedstad', en:'Capital City'},
                    "default_language": {da:'Sprog (standard)', en:'Language (default)', convert:ns.getLanguageName},
                    "timezone"        : {da:'Tidszone', en:'Time zone'},
                    "currency"        : {da:'Valuta', en:'Currency'},
                    "contact:website" : {da:'Hjemmeside', en:'Homepage', isLink: true},
                    "opendata_portal" : {da:'Hjemmeside (Open Data)', en:'Homepage (Open Data)', isLink: true},
                },
            },
        };

    nsMap.osm_details_list = function(data, defaultOptions){
        var result = [];
        //****************************
        function extractFrom(ids, subData){
            $.each(ids, function(id, opt){
                if (subData && subData[id]){
                    if (opt.da){
                        var data = subData[id],
                            item = {
                                label: {da: opt.da, en:opt.en}
                            };
                        item.text = opt.convert ? opt.convert(data) : data;
                        if (opt.vfFormat){
                            $.extend(item, {
                                vfFormat : opt.vfFormat,
                                vfValue  : item.text,
                                vfOptions: opt.vfOptions
                            });
                            delete item.text;
                        }
                        if (opt.isLink)
                            item.link = item.text;

                        result.push($.extend({}, item, defaultOptions, opt.options));
                    }
                    else
                        extractFrom(opt, subData[id]);
                }
            });
        }
        //****************************
        extractFrom(details, data);

        return result;
    };
}(this, document));
