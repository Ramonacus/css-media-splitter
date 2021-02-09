import fs, { writeFileSync } from "fs";
import { type } from "os";
import stripCssComments from "strip-css-comments";

const args: string[] = process.argv.slice(2);

type MediaQueryDict = {
	all: string;
	[key: string]: string;
};

type MediaQueryObject = {
	media: string;
	content: string;
	length: number;
};

fs.readFile(
	//args[0],
	".\\example.css",
	{
		encoding: "utf-8",
	},
	(err: NodeJS.ErrnoException | null, css: string) => {
		if (err) {
			throw err;
		}
		css = stripCssComments(css, { preserve: false });
		const mqDict: MediaQueryDict = generateMediaQueryDict(css);
		writeFiles(mqDict);
		createLinkTemplate(mqDict, "<link rel='stylesheet' href='%file%' media='%media%' id='%id%'>");
	}
);

function generateMediaQueryDict(css: string): MediaQueryDict {
	const indexes: number[] = getMacthIndexes(css, /@media/gi);
	const mediaQueriesDict: { [key: string]: string } = {};
	let index: number | undefined;

	while ((index = indexes.pop()) !== undefined) {
		const mediaQuery: MediaQueryObject = extractMediaQueryAtIndex(css, index);
		css = stringSplice(css, index, mediaQuery.length);
		if (!mediaQueriesDict[mediaQuery.media]) {
			mediaQueriesDict[mediaQuery.media] = "";
		}
		mediaQueriesDict[mediaQuery.media] = mediaQuery.content + mediaQueriesDict[mediaQuery.media];
	}

	mediaQueriesDict.all = css;

	return mediaQueriesDict as MediaQueryDict;
}

function extractMediaQueryAtIndex(css: string, index: number): MediaQueryObject {
	let substring = css.substr(index);
	const regex = /}(?:\s|[\r\n])*}/g;
	const result: RegExpExecArray | null = regex.exec(substring);

	if (!result) {
		throw new Error("Malformed media query");
	}
	substring = substring.substr(0, result[0].length + result.index);

	const mediaStart: number = substring.indexOf("@media ") + 7;
	const contentStart: number = substring.indexOf("{");
	const mediaStr: string = substring.slice(mediaStart, contentStart).trim();
	const contentStr = substring.slice(contentStart, -1).replace(/(^{[\r\n]*|\t)/g, "");

	return {
		media: mediaStr,
		content: contentStr,
		length: substring.length,
	};
}

function writeFiles(mqDict: MediaQueryDict): void {
	for (const media in mqDict) {
		if (mqDict.hasOwnProperty(media)) {
			fs.writeFile(`media-${fileFriendlyName(media)}.css`, mqDict[media], { encoding: "utf-8" }, (err) => {
				if (err) {
					throw err;
				} else {
					console.log(`media-${fileFriendlyName(media)}.css written successfuly`);
				}
			});
		}
	}
}

function fileFriendlyName(name: string): string {
	return name.replace(/[/\\?%*:|"<>\s]/g, "");
}

function createLinkTemplate(mqDict: MediaQueryDict, template: string) {
	for (const media in mqDict) {
		if (mqDict.hasOwnProperty(media)) {
			console.log(
				template
					.replace("%file%", `media-${fileFriendlyName(media)}.css`)
					.replace("%media%", media)
					.replace("%id%", fileFriendlyName(media))
			);
		}
	}
}

function getMacthIndexes(str: string, regex: RegExp): number[] {
	const indexes: number[] = [];
	let result: RegExpExecArray | null;
	while ((result = regex.exec(str))) {
		indexes.push(result.index);
	}
	return indexes;
}

function stringSplice(str: string, start: number, deleteCount?: number): string {
	let strArr = str.split("");
	strArr.splice(start, deleteCount);
	return strArr.join("");
}
