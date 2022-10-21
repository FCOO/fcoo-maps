/****************************************************************************
search-latlng
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {},

        llf = window.latLngFormat,

        //groupHeader = header of different groups of results
        groupHeader = [], //[groudId]text

        //Create two new special groups for lat-lng-formats: Lattitude/Longitude and Longitude/Latitude. All other uses formatId as groupId
        latLngGroupId = 0,
        lngLatGroupId = 1;

    groupHeader[latLngGroupId] = {da: 'Bredde/Længdegrader', en: 'Latitude/Longitude'};
    groupHeader[lngLatGroupId] = {da: 'Længde/Breddegrader', en: 'Longitude/Latitude'};
    //For all none-latlng formats: Use header from window.latLngFormat
    for (var formatId = llf.LATLNGFORMAT_LAST_LATLNG + 1; formatId <= llf.LATLNGFORMAT_LAST; formatId++)
        groupHeader[formatId] = llf.options.text[formatId];

    /***************************************************************
    compareTwoStrings(first, second)
    Adjusted version from https://github.com/aceakash/string-similarity
    ***************************************************************/
    function compareTwoStrings(first, second) {
        first = first.replace(/\s+/g, '');
        second = second.replace(/\s+/g, '');

        if (!first.length && !second.length) return 1;                   // if both are empty strings
        if (!first.length || !second.length) return 0;                   // if only one is empty string
        if (first === second) return 1;                                    // identical
        if (first.length === 1 && second.length === 1) return 0;         // both are 1-letter strings
        if (first.length < 2 || second.length < 2) return 0;             // if either is a 1-letter string

        var firstBigrams = new Map(),
            i, bigram, count;
        for (i=0; i < first.length-1; i++) {
            bigram = first.substring(i, i + 2);
            count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram) + 1
                    : 1;
            firstBigrams.set(bigram, count);
        }

        var intersectionSize = 0;
        for (i=0; i<second.length-1; i++) {
            bigram = second.substring(i, i + 2),
            count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram)
                    : 0;
            if (count > 0) {
                firstBigrams.set(bigram, count - 1);
                intersectionSize++;
            }
        }

        return (2.0 * intersectionSize) / (first.length + second.length - 2);
    }

    /*************************************************************************
    text2LatLng( text, options )
    Try to convert a position as string into a valid latLng
    options:
        onlyLatLng
        onlyLngLat
    Return []{formatId, latlng, text, priority, groupHeader}
    *************************************************************************/
    nsMap.text2LatLng = function( text, options = {}){

        //***************************************************
        function addResult(formatId, value, isLngLat){
            if (value){
                var latLng = L.latLng(value);
                latLng.isLngLat = !!isLngLat;
                formatResult.push( latLng );
            }
        }
        //***************************************************
        function checkLatLngPair(formatId, latLngText){
            if (!options.onlyLngLat)
                addResult(formatId, llf(latLngText[0], latLngText[1]).value());
            if (!options.onlyLatLng && (options.onlyLngLat || (latLngText[0] != latLngText[1])))
                addResult(formatId, llf(latLngText[1], latLngText[0]).value(), true);
        }
        //***************************************************
        //Convert all latLng to {formatId, latLng, text, priority}
        function getText(latLng, trunc, useEditMask){
            var options = {asArray: true, useEditMask:useEditMask},
                array = trunc ? latLng.formatTrunc(options) : latLng.format(options);
            return latLng.isLngLat ? array[1]+'  '+array[0] : array.join('  ');
        }
        //***************************************************

        //First: Search for valid positions
        var saveFormatId = llf.options.formatId,
            formatResult = [],
            positionList = [];

        //Trim for multi space, and space around "," and "."
        var trimmedText = text
                            .replace(/\s{2,}/mg, ' ')
                            .replace(/\s*[.]\s*/mg, '.')
                            .replace(/\s*[,]\s*/mg, ',');

        //Check if search match a position in any of the avaiable formats
        for (var formatId = llf.LATLNGFORMAT_FIRST; formatId <= llf.LATLNGFORMAT_LAST; formatId++){

            formatResult = [];

            llf.setFormat( formatId, true/*dontCallOnChange*/ );

            if ((formatId >= llf.LATLNGFORMAT_FIRST_LATLNG) && (formatId <= llf.LATLNGFORMAT_LAST_LATLNG)){
                //lat-lng-format => split in two

                /*
                Special case:
                1: text contains one or tree comma => split at the middle comma
                2: text contains one - => split at -
                */
                var splitAtList = [' '],
                    commas = (trimmedText.match(/\,/g) || []).length;
                if (commas == 1)
                    splitAtList.push(',');
                if ((trimmedText.match(/\-/g) || []).length == 1)
                    splitAtList.push('-');

                if (commas == 3)
                    //split at 2. comma
                    checkLatLngPair(formatId, [
                        trimmedText.split(',', 2).join(','),
                        trimmedText.split(',').slice(2).join(',')
                    ]);
                else
                    $.each(splitAtList, function(index, splitAt){
                        //Check all combi of split the text in two
                        var array = trimmedText.split(splitAt);
                        for (var i=1; i<array.length; i++)
                        checkLatLngPair(formatId, [
                            array.slice(0,i).join(splitAt),
                            array.slice(i).join(splitAt)
                        ]);
                    });
            }
            else
                //Single text format
                addResult(formatId, llf(text).value());

            if (formatResult.length){
                //Convert all found latlng to {formatId, latLng, groupId, text, priority}
                $.each( formatResult, function(index, latLng){
                    var text1 = getText(latLng),
                        text2 = getText(latLng, true),
                        //Calc the priority as best of normal-mode and edit-mode since offen there are no degree or minut sign in input. Trunc gets the overhand
                        priority1 = Math.max( compareTwoStrings(text1, text), compareTwoStrings(getText(latLng, false, true), text) ),
                        priority2 = Math.max( compareTwoStrings(text2, text), compareTwoStrings(getText(latLng, true,  true), text) ) * 1.05,
                        newRec = {
                            formatId: formatId,
                            latLng  : latLng,
                            priority: Math.max(priority1, priority2),
                            text    : priority1 > priority2 ? text1 : text2
                        };

                    //Set groupId = index in groupHeader
                    newRec.groupHeaderId = formatId;
                    if (formatId <= llf.LATLNGFORMAT_LAST_LATLNG)
                        newRec.groupHeaderId = newRec.latLng.isLngLat ? lngLatGroupId : latLngGroupId;
                    newRec.groupHeader = groupHeader[newRec.groupHeaderId];
                    newRec.isCurrentFormat = (formatId == saveFormatId);

                    positionList.push( newRec );
                });
            }
        } //for (var formatId =
        llf.setFormat( saveFormatId, true );


        //Sort positionList
        positionList.sort(function(pos1, pos2){
            var result = 0;
            if (!result)
                result = pos1.groupHeaderId - pos2.groupHeaderId;
            if (!result)
                result = (pos2.isCurrentFormat ? 1 : 0) - (pos1.isCurrentFormat ? 1 : 0);
            if (!result)
                result = pos2.priority - pos1.priority;
            return result;
        });

        //Remove duplicates
        $.each(positionList, function(index, rec){
            for (var i=index+1; i<positionList.length; i++)
                if ((rec.groupId == positionList[i].groupId) && (rec.latLng.lat == positionList[i].latLng.lat) && (rec.latLng.lng == positionList[i].latLng.lng))
                    positionList[i].text = '';
        });
        //Clean up
        var result = [];
        $.each(positionList, function(index, rec){
            if (rec.text)
                result.push(rec);
        });
        return result;
    };



}(jQuery, L, this, document));



