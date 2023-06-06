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
        '             Forsvarets Center for Operativ Oceanografi',
        '             Defence Centre for Operational Oceanography',
        '                       fcoo.dk - info@fcoo.dk',
    ];

    /* eslint-disable no-console, no-constant-condition*/
    for (var i=0; i<text.length; i++)
        console.log(text[i]);

    if ('{APPLICATION_NAME_DA}' != ('{APPLICATION_' + 'NAME_DA}'))
        console.log('{APPLICATION_NAME_DA}');
    if ('{APPLICATION_NAME_EN}' != ('{APPLICATION_' + 'NAME_EN}'))
        console.log('{APPLICATION_NAME_EN}');
    var version_build = '';
    if ('{VERSION}' != ('{VER' + 'SION}'))
        version_build = 'Version '+'{VERSION}';
    if ('{BUILD}' != ('{BUI' + 'LD}'))
        version_build = version_build + (version_build ? ' / ':'') + '{BUILD}';
    if (version_build)
        console.log(version_build);

    /* eslint-enable no-console, no-constant-condition */

}(this, document));



