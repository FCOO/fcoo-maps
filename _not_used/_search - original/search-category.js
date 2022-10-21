/****************************************************************************
search-category.js
****************************************************************************/
(function (window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};

    var categories = {

            aeroway: {
                _all: true,
                aerodrome: {da: 'lufthavn/flyveplads'},
                //apron
                //control_tower
                //control_center
                //gate
                //hangar
                //helipad
                //heliport
                //navigationaid
                //runway
                //taxilane
                //taxiway
                //terminal
                //windsock
                //highway_strip
            },

            amenity: false, //for describing useful and important facilities for visitors and residents. facilities include for example toilets, telephones, banks, pharmacies, prisons and schools.

            boundary: {
                _all: true,
                administrative  : {da: 'adminstrativ'},
                postal_code     : {da: 'postnummer'},
                //landuse,
                //political,
                //national_park,
                //marker,
                //lot,
                //forest_compartment,
                //census,
                //religious_administration,
                //forestry_compartment,
                //health,
                maritime        : {da: 'maritimt'},
                //civil_parish,
                //historic,
                //place,
                //aboriginal_lands,
                //historic_parish,
                //civil,
                local_authority: {da: 'lokal myndighed'}
                //natural ,
                //marker,
                //protected_area,
            },

            building    : false,

            changing_table: false,

            emergency   : false,

            highway     : false,

            historic    : false,

            landuse     : false,

            leisure     : false,

            man_made    : false,

            natural: {
                _all: true,
                //wood
                //tree_row
                //tree
                //scrub
                //heath
                //moor
                //grassland
                //fell
                //bare_rock
                //scree
                //shingle
                //sand
                //mud
                water       : {da: 'vand'},
                //wetland
                glacier     : {da: 'gletscher'},
                bay         : {da: 'bugt'},
                cape        : {da: 'kap'},
                strait      : {da: 'stræde'},
                beach       : {da: 'strand'},
                coastline   : {da: 'kystlinje'},
                reef        : {da: 'rev'},
                //spring
                //hot_spring
                //geyser
                //peak
                //dune
                //hill
                //volcano
                valley      :  {da: 'dal'},
                //ridge
                //arete
                //cliff
                //saddle
                //isthmus
                //peninsula
                //rock
                //stone
                //sinkhole
                //cave_entrance
            },

            office: false,

            place: {
                country     : { da: 'land' },
                state       : { da: 'stat' },
                region      : { da: 'region' },
                province    : { da: 'provins' },
                district    : { da: 'distrikt' },
                county      : { da: 'region' },
                municipality: { da: 'kommune' },
                city        : { da: 'by' },
                borough     : false,
                suburb      : {da: 'forstad'},
                postcode    : {da: 'postnummer'},
                quarter     : false,
                neighbourhood: false,
                city_block  : false,
                plot        : false,
                town        : { da: 'by' },
                village     : { da: 'landsby' },
                hamlet      : { da: 'landsby' },
                isolated_dwelling: false,
                farm        : false,
                allotments  : false,
                continent   : {da: 'kontinent'},
                archipelago : {da: 'øhav'},
                island      : {da: 'ø'},
                islet       : {da: 'holm'},
                square      : false,
                locality    : false,
                sea         : {da: 'hav'},
                ocean       : {da: 'ocean'},
            },

            railway : false,

            shop    : false,

            tourism : false,

            waterway: {
                _all: true,
                river       : {da: 'flod'},
                riverbank   : {da: 'flodbred'},
                stream      : {da: 'strøm'},
                tidal_channel: {da: 'tidevandskanal '},
                //wadi
                //drystream
                canal       : {da: 'kanal'},
                //pressurised
                //drain
                //ditch
                //fairway
                dock        : {da: 'dok'},
                boatyard    : {da: 'værft'},
                //dam
                //weir
                //waterfall
                //lock_gate
                //turning_point
                //water_point
                //fuel
            },

        };//end of categories

    nsMap.osm_include = function(options){
        if (options && categories[options.category] && (categories[options.category]._ALL || categories[options.category][options.type]))
            return true;
        return false;
    };

    nsMap.osm_type_text = function(options){
        if (!nsMap.osm_include(options))
            return null;

        var result = {en: options.type.replace('_', ' ')};
        if (categories[options.category] && categories[options.category][options.type] && $.isPlainObject(categories[options.category][options.type]))
            $.extend(result, categories[options.category][options.type]);

        //Detect if it is a country - not completely the correct way to do it
        if (options.extratags && (options.extratags.flag || options.extratags.capital_city) )
            result = {da:'land', en:'country'};



        return result;
    };

    nsMap.osm_display_name = function(options){
        if (!nsMap.osm_include(options) || !options.display_name)
            return null;

        /*
        Acording to https://github.com/osm-search/Nominatim/issues/1662
        options.address cabn contain fields with id "addressNN" where NN >= 29
        This is used to seperat "real" addresses from "other" eq. seas
        */
        var addressAsStr = JSON.stringify(options.address),
            regex = /address(29|3\d|(4-9)\d|\d{3,})/g,
            found = addressAsStr.match(regex);

        if (found && found.length)
            return null;
        else
            return options.display_name;
    };

}(this, document));
