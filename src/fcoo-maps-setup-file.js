/****************************************************************************
fcoo-maps-setup-file
****************************************************************************/
(function ($, L, window/*, document, undefined*/) {
	"use strict";

    window.fcoo = window.fcoo || {};
    var ns = window.fcoo.map = window.fcoo.map || {};

    var default_setup = {
            applicationName: {da:'Dansk titel', en:'English title'},


            topMenu: {
                search: false, //true if use search

                /*
                Path to messages-files. Two versions:
                1: Relative path locally e.q. "data/info.json"
                2: Using window.fcoo.dataFilePath (See fcoo-data-files): {subDir, fileName}.
                   E.q. {subDir: "theSubDir", fileName:"fileName.json"} => "https://app.fcoo.dk/static/theSubDir/fileName.json"
                */
                help     : null, //null or STRING or {subDir:STRING, fileName:STRING}
                messages : null, //null or STRING or {subDir:STRING, fileName:STRING}
                warning  : null, //null or STRING or {subDir:STRING, fileName:STRING}
            },

            leftMenuWidth      : 300,   //Width of left-menu
            keepLeftMenuButton : false, //Set to true if leftMenuWidth == 0 to keep menu-button
            rightMenuWidth     : 300,   //Set to 0 to aviod right-side menu
            keepRightMenuButton: false, //Set to true if rightMenuWidth == 0 to keep menu-button

        };


    /*************************************************************************
    readSetupFile( fileName )
    *************************************************************************/
    ns.readSetupFile = function( fileName ){
        if ($.isPlainObject( fileName ) )
            fileName = window.fcoo.dataFilePath( fileName.subDir , fileName.fileName );

        window.Promise.getJSON(fileName, {},
            function( data ){ ns.createFCOOMap( adjustData( data ) ); }
        );
    };

    /*************************************************************************
    adjustData( data )
    *************************************************************************/
    function adjustData( data ){
        data = $.extend(true, {}, default_setup, data );

        //Add header to top-menu
        data.topMenu.header = data.applicationName;

        //Adjust path
        var local = window.fcoo.LOCAL_DATA;
        window.fcoo.LOCAL_DATA = false;
        $.each(['help', 'messages', 'warning'], function(index, id){
            var topMenuPath = data.topMenu[id];
            if (topMenuPath){
                if ($.isPlainObject(topMenuPath))
                    topMenuPath = window.fcoo.dataFilePath( topMenuPath.subDir , topMenuPath.fileName );
                data.topMenu[id] = {url: topMenuPath};
            }
        });
        window.fcoo.LOCAL_DATA = local;

        //Adjust menu-width
        data.leftMenu  = data.leftMenuWidth  ? {width: data.leftMenuWidth}  : null;
        data.rightMenu = data.rightMenuWidth ? {width: data.rightMenuWidth} : null;



        return data;
    }





}(jQuery, L, this, document));



