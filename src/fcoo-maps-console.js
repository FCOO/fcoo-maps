/****************************************************************************
    fcoo-maps-console.js,

****************************************************************************/
(function (/*window, document, undefined*/) {
    "use strict";

    /*

    ████████  ██████    ██████    ██████
    ███████  ████████  ████████  ████████
    ██       ██    ██  ██    ██  ██    ██
    ██       ██        ██    ██  ██    ██
    █████    ██        ██    ██  ██    ██        █ █
    █████    ██        ██    ██  ██    ██        █ █  █
    ██       ██        ██    ██  ██    ██     ████ █ █
    ██       ██    ██  ██    ██  ██    ██    █   █ ██
    ██       ████████  ████████  ████████    █   █ █ █
    ██        ██████    ██████    ██████   █  ████ █  █

        Forsvarets Center for Operativ Oceanografi
                  fcoo.dk  - info@fcoo.dk
    ████████   ██████     ██████     ██████
    ██        ██    ██   ██    ██   ██    ██
    ██        ██         ██    ██   ██    ██
    █████     ██         ██    ██   ██    ██
    ██        ██         ██    ██   ██    ██
    ██        ██    ██   ██    ██   ██    ██
    ██         ██████     ██████     ██████


XXXXXX   XXXX     XXXX     XXXX
X       X    X   X    X   X    X
X       X        X    X   X    X
XXXX    X        X    X   X    X
X       X        X    X   X    X
X       X    X   X    X   X    X
X        XXXX     XXXX     XXXX


 XXXX    XXXXXX   XXXX   X     X  XXXXXX  XXXXXXX   XXXX    XXXX
X    X   X       X    X  XX   XX  X          X     X    X  X    X
X        X       X    X  X X X X  X          X     X    X  X
X        XXXX    X    X  X  X  X  XXXX       X     X    X  X
X   XXX  X       X    X  X     X  X          X     X    X  X
X    XX  X       X    X  X     X  X          X     X    X  X    X
 XXXX X  XXXXXX   XXXX   X     X  XXXXXX     X      XXXX    XXXX


XXXXXXXXXXXXXXXX  XXXXXXXX        XXXXXXXX         XXXXXXXX
XXXXXXXXXXXXXXX XXXXXXXXXXXX    XXXXXXXXXXXX     XXXXXXXXXXXX
XXXX           XXXX      XXXX  XXXX      XXXX   XXXX      XXXX
XXXX          XXXX       XXXX XXXX        XXXX XXXX        XXXX
XXXX          XXXX            XXXX        XXXX XXXX        XXXX
XXXX          XXXX            XXXX        XXXX XXXX        XXXX
XXXXXXXXXX    XXXX            XXXX        XXXX XXXX        XXXX
XXXXXXXXXX    XXXX            XXXX        XXXX XXXX        XXXX
XXXX          XXXX            XXXX        XXXX XXXX        XXXX
XXXX          XXXX            XXXX        XXXX XXXX        XXXX
XXXX          XXXX       XXXX XXXX        XXXX XXXX        XXXX
XXXX          XXXX       XXXX  XXXX      XXXX   XXXX      XXXX
XXXX            XXXXXXXXXXXX    XXXXXXXXXXXX     XXXXXXXXXXXX
XXXX              XXXXXXXX        XXXXXXXX         XXXXXXXX
          Forsvarets Center for Operativ Oceanografi
                    fcoo.dk - info@fcoo.dk
*/

/*
    var text = [
        '████████████████  ████████        ████████         ████████',
        '███████████████ ████████████    ████████████     ████████████',
        '████           ████      ████  ████      ████   ████      ████ ',
        '████          ████       ████ ████        ████ ████        ████',
        '████          ████            ████        ████ ████        ████',
        '████          ████            ████        ████ ████        ████',
        '██████████    ████            ████        ████ ████        ████',
        '██████████    ████            ████        ████ ████        ████',
        '████          ████            ████        ████ ████        ████',
        '████          ████            ████        ████ ████        ████',
        '████          ████       ████ ████        ████ ████        ████',
        '████          ████       ████  ████      ████   ████      ████ ',
        '████            ████████████    ████████████     ████████████',
        '████              ████████        ████████         ████████',
        '          Forsvarets Center for Operativ Oceanografi',
        '                    fcoo.dk - info@fcoo.dk',
    ];
    var text = [
        'XXXXXXXXXXXXX  XXXXXXXX        XXXXXXXX         XXXXXXXX',
        'XXXXXXXXXXXX XXXXXXXXXXXX    XXXXXXXXXXXX     XXXXXXXXXXXX',
        'XXXX        XXXX      XXXX  XXXX      XXXX   XXXX      XXXX ',
        'XXXX       XXXX       XXXX XXXX        XXXX XXXX        XXXX',
        'XXXXXXXXX  XXXX            XXXX        XXXX XXXX        XXXX',
        'XXXXXXXXX  XXXX            XXXX        XXXX XXXX        XXXX',
        'XXXX       XXXX       XXXX XXXX        XXXX XXXX        XXXX',
        'XXXX       XXXX       XXXX  XXXX      XXXX   XXXX      XXXX ',
        'XXXX         XXXXXXXXXXXX    XXXXXXXXXXXX     XXXXXXXXXXXX',
        'XXXX            XXXXXXXX        XXXXXXXX         XXXXXXXX',
        '         Forsvarets Center for Operativ Oceanografi          ',
        '                    fcoo.dk - info@fcoo.dk',
    ];

*/
    var text = [
        '   █████████',
        ' █████████  ',
        '████        ████████████        ████████████         ████████████',
        '████      ████████████████    ████████████████     ████████████████',
        '████     ████          ████  ████          ████   ████          ████ ',
        '███████ ████           ████ ████            ████ ████            ████',
        '███████ ████                ████            ████ ████            ████',
        '████    ████                ████            ████ ████            ████',
        '████    ████           ████ ████            ████ ████            ████',
        '████    ████           ████  ████          ████   ████          ████ ',
        '████      ████████████████    ████████████████     ████████████████',
        '████        ████████████        ████████████         ████████████',
    ];

    /* eslint-disable no-console, no-constant-condition*/
    var maxTxtLgd = 0;
    for (var i=0; i<text.length; i++){
        maxTxtLgd = Math.max(maxTxtLgd, text[i].length);
        console.log(text[i]);
    }

    function centerConsole( txt ){
        if (txt.length < maxTxtLgd)
            txt = txt.padStart((txt.length + maxTxtLgd)/2);
        console.log(txt);
    }
    centerConsole('Forsvarets Center for Operativ Oceanografi');
    centerConsole('Defence Centre for Operational Oceanography');
    centerConsole('fcoo.dk - info@fcoo.dk');


    if ('{APPLICATION_NAME_DA}' != ('{APPLICATION_' + 'NAME_DA}'))
        centerConsole('{APPLICATION_NAME_DA}');
    if ('{APPLICATION_NAME_EN}' != ('{APPLICATION_' + 'NAME_EN}'))
        centerConsole('{APPLICATION_NAME_EN}');
    var version_build = '';
    if ('{APPLICATION_VERSION}' != ('{APPLICATION_' + 'VERSION}'))
        version_build = 'Version '+'{APPLICATION_VERSION}';
    if ('{APPLICATION_BUILD}' != ('{APPLICATION_' + 'BUILD}'))
        version_build = version_build + (version_build ? ' / ':'') + '{APPLICATION_BUILD}';
    if (version_build)
        centerConsole(version_build);

    /* eslint-enable no-console, no-constant-condition */

}(this, document));



