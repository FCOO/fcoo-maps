/****************************************************************************
    fcoo-maps.js,

    (c) 2020, FCOO

    https://github.com/FCOO/fcoo-maps
    https://github.com/FCOO



To create an application call window.fcoo.map.createApplication(options: OPTIONS)

createApplication will load e serie of mandatory and optional setup-json-files or setup-json-objects
each with a 'build'-function
After the build the settings in fcoo.appSetting and globalSetting are loaded

OPTIONS: {
    setup    : FILENAME or SETUP-OBJECT,
    leftMenu,
    rightMenu: {
        fileName: FILENAME, or
        data    : JSON-OBJECT,
        resolve : function( data, $leftMenuContainer ) - optional. default = fcoo.map.createLeftMenu (see fcoo-maps-create-menu.js)
    },
    metadata: {
        fileName: FILENAME,
        resolve : function( data ),
        reload  : BOOLEAN or NUMBER. If true the file will be reloaded every hour. If NUMBER the file will be reloaded every reload minutes
    },
    other: []{fileName, resolve, reload} Same as metadata

    finally: function() - optional. Function to be called when all is ready
}

FILENAME = Path to file. Two versions:
    1: Relative path locally e.q. "data/info.json"
    2: Using ns.dataFilePath (See fcoo-data-files): {subDir, fileName}.
    E.q. {subDir: "theSubDir", fileName:"theFileName.json"} => "https://app.fcoo.dk/static/theSubDir/theFileName.json"

SETUP-OBJECT: See fcoo-maps-setup-files.js for details

****************************************************************************/
(function ($, moment, L, window/*, document, undefined*/) {
    "use strict";

    var ns = window.fcoo = window.fcoo || {},
        nsMap = ns.map = ns.map || {};


    /*************************************************************************
    createApplication
    *************************************************************************/
    var whenFinish = null;
    nsMap.createApplication = function(options){
        //Add all setup-files needed to fcoo.promiseList

        //1. setup
        var opt = {
                resolve : nsMap.createFCOOMap,
                wait    : true
            };
        if (window.intervals.isFileName(options.setup))
            opt.fileName = options.setup;
        else
            opt.data = options.setup;
        ns.promiseList.append(opt);

        //2. left-menu
        if (options.leftMenu){
            var resolveLeft = options.leftMenu.resolve || nsMap.createLeftMenu;
            options.leftMenu.resolve = function(data){ resolveLeft(data, nsMap.main.leftMenu.$menu); };
            options.leftMenu.wait = true;
            ns.promiseList.append(options.leftMenu);
        }

        //3. right-menu
        if (options.rightMenu){
            var resolveRight = options.rightMenu.resolve || nsMap.createRightMenu;
            options.rightMenu.resolve = function(data){ resolveRight(data, nsMap.main.rightMenu.$menu); };
            options.rightMenu.wait = true;
            ns.promiseList.append(options.rightMenu);
        }

        //4: Other
        $.each(options.other || [], function(index, opt){
            ns.promiseList.append(opt);
        });

        //4: Meta-data (allow both syntax)
        ns.promiseList.append(opt.metadata || opt.metaData);

        //5: Finish
        whenFinish = options.finally;

       ns.promiseList.options.finally = promise_all_finally;

        //Load all setup-files
        Promise.defaultPrefetch();
        ns.promiseList_getAll();
    };

    function promise_all_finally(){
        //Call ns.globalSetting.load => ns.appSetting.load => whenFinish => Promise.defaultFinally
        ns.globalSetting.load(null, function(){
            ns.appSetting.load(null, function(){
                if (whenFinish)
                    whenFinish();
                ns.events.fire(ns.events.CREATEAPPLICATIONFINALLY);
                Promise.defaultFinally();
            });
        });
        return true;
    }
}(jQuery, window.moment, L, this, document));



