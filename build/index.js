"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var strip_css_comments_1 = __importDefault(require("strip-css-comments"));
var args = process.argv.slice(2);
fs_1.default.readFile(
//args[0],
".\\example.css", {
    encoding: "utf-8",
}, function (err, css) {
    if (err) {
        throw err;
    }
    css = strip_css_comments_1.default(css, { preserve: false });
    var mqDict = generateMediaQueryDict(css);
    writeFiles(mqDict);
    createLinkTemplate(mqDict, "<link rel='stylesheet' href='%file%' media='%media%' id='%id%'>");
});
function generateMediaQueryDict(css) {
    var indexes = getMacthIndexes(css, /@media/gi);
    var mediaQueriesDict = {};
    var index;
    while ((index = indexes.pop()) !== undefined) {
        var mediaQuery = extractMediaQueryAtIndex(css, index);
        css = stringSplice(css, index, index + mediaQuery.length);
        if (!mediaQueriesDict[mediaQuery.media]) {
            mediaQueriesDict[mediaQuery.media] = "";
        }
        mediaQueriesDict[mediaQuery.media] = mediaQuery.content + mediaQueriesDict[mediaQuery.media];
    }
    mediaQueriesDict.all = css;
    return mediaQueriesDict;
}
function extractMediaQueryAtIndex(css, index) {
    var substring = css.substr(index);
    var regex = /}(?:\s|[\r\n])*}/g;
    var result = regex.exec(substring);
    if (!result) {
        throw new Error("Malformed media query");
    }
    substring = substring.substr(0, result[0].length + result.index);
    var mediaStart = substring.indexOf("@media ") + 7;
    var contentStart = substring.indexOf("{");
    var mediaStr = substring.slice(mediaStart, contentStart).trim();
    var contentStr = substring.slice(contentStart, -1).replace(/(^{[\r\n]*|\t)/g, "");
    return {
        media: mediaStr,
        content: contentStr,
        length: substring.length,
    };
}
function writeFiles(mqDict) {
    var _loop_1 = function (media) {
        if (mqDict.hasOwnProperty(media)) {
            fs_1.default.writeFile("media-" + fileFriendlyName(media) + ".css", mqDict[media], { encoding: "utf-8" }, function (err) {
                if (err) {
                    throw err;
                }
                else {
                    console.log("media-" + fileFriendlyName(media) + ".css written successfuly");
                }
            });
        }
    };
    for (var media in mqDict) {
        _loop_1(media);
    }
}
function fileFriendlyName(name) {
    return name.replace(/[/\\?%*:|"<>\s]/g, "");
}
function createLinkTemplate(mqDict, template) {
    for (var media in mqDict) {
        if (mqDict.hasOwnProperty(media)) {
            console.log(template
                .replace("%file%", "media-" + fileFriendlyName(media) + ".css")
                .replace("%media%", media)
                .replace("%id%", fileFriendlyName(media)));
        }
    }
}
function getMacthIndexes(str, regex) {
    var indexes = [];
    var result;
    while ((result = regex.exec(str))) {
        indexes.push(result.index);
    }
    return indexes;
}
function stringSplice(str, start, deleteCount) {
    var strArr = str.split("");
    strArr.splice(start, deleteCount);
    return strArr.join("");
}
