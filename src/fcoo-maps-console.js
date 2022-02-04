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
        '                       fcoo.dk - info@fcoo.dk',
    ];

    /* eslint-disable no-console */
    for (var i=0; i<text.length; i++)
        console.log(text[i]);
    /* eslint-enable no-console */

}(this, document));



