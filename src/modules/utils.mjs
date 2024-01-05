function getKeyCode(event) {
    return event.which;
}

function getColor(FB) {
    let color = borderColor;
    if (FB == 0) {
        color = "black";
    } else if (FB == 1) {
        color = "#07ed19";
    } else if (FB == -1) {
        color = "#f20202";
    } else if (FB == 0.1) {
        color = "#1bb527";
    } else if (FB == -0.1) {
        color = "#ba1616";
    }
    return color;
}


function createCode() {
    return Math.floor(Math.random() * 10000000000);
}


function createDiv(ParentID, ChildID) {

    let d = $(document.createElement('div'))
        .attr("id", ChildID);
    let container = document.getElementById(ParentID);
    d.appendTo(container);
}

function shuffle(array) {
    let counter = array.length;

    /* While there are elements in the array */
    while (counter > 0) {
        /* Pick a random index */
        let index = Math.floor(Math.random() * counter);

        /* Decrease counter by 1 */
        counter--;

        /* And swap the last element with it */
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}  /* function shuffle(array) */


// simple range function
function range(start, stop, step) {
    let a = [start], b = start;
    while (b < stop) {
        a.push(b += step || 1);
    }
    return a;
}


/**
 * Asserts a condition
 * @param condition
 * @param message
 */
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}


const sum = arr => arr.reduce((a, b) => a + b, 0);


function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}


function isString(x) {
    return Object.prototype.toString.call(x) === "[object String]"
}


function getBrowser() {

    let nVer = navigator.appVersion;
    let nAgt = navigator.userAgent;
    let browserName = navigator.appName;
    let fullVersion = '' + parseFloat(navigator.appVersion);
    let majorVersion = parseInt(navigator.appVersion, 10);
    let nameOffset, verOffset, ix;

    /*In Opera, the true version is after "Opera" or after "Version"*/
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In MSIE, the true version is after "MSIE" in userAgent*/
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "Microsoft Internet Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }

    /*In Chrome, the true version is after "Chrome"*/
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }

    /*In Safari, the true version is after "Safari" or after "Version"*/
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In Firefox, the true version is after "Firefox"*/
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }

    /*In most other browsers, "name/version" is at the end of userAgent*/
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }

    if ((ix = fullVersion.indexOf(";")) != -1)
        fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(" ")) != -1)
        fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return browserName + ' ' + fullVersion + ' ' + majorVersion + ' ' + navigator.appName + ' ' + navigator.userAgent;
} /* function getBrowser() */

function getOS() {
    let OSName = "Unknown OS";
    if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
    if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
    if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
    if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux";
    return OSName;
}

function getURLParams(name) {
    return (new URL(document.location)).searchParams.get(name);
}

export {
    sum, assert, range, shuffle,
    getBrowser, getColor, getKeyCode,
    getOS, isFloat, createDiv, isString, randint, createCode, getURLParams
};
 
