'use strict';

const path = require('path');
const tracery = require(`./lib/tracery`);
const customTraceryModifiers = require(`./lib/plugins/tracery/modifiers`);
const pathToFileUrl = require(`./lib/util/path-to-file-url`);

class HeadlineMaker {

  constructor(grammar) {
    this.grammar = tracery.createGrammar(grammar);
    this.grammar.addModifiers(tracery.baseEngModifiers);
    this.grammar.addModifiers(customTraceryModifiers);    
    this.origin = `#origin#`;
  }

  /**
   * Generates a headline and returns a headline object in the following format:
   */
  async generateHeadline(customOrigin) {
    return parseMessage(await this.grammar.flatten(customOrigin || this.origin));
  }

  /**
   * Generates a headline and returns its text contents, with any tags stripped out
   */
  async generateTextHeadline(customOrigin) {
    return await this.generateHeadline(customOrigin).text;
  }
}

module.exports = HeadlineMaker;

/**
 * Object representation of a headline, with the format:
 * {
 *		text {string}: text of the headline, with any tags stripped out, as a string
 * 		tags {Object}: a map of tags and their attributes, if the headline contains any. otherwise undefined.
 * }
 *
 * Expected tag format is {tagname attr1="one" attr2="two"} and is parsed as
 *	tagname: {
 *		attr1: "one",
 * 		attr2 = "two"
 *  }
 */
class Headline {
  constructor(text, tags, altText) {
    this.text = text;
    this.altText = altText;
    if (tags) {
      this.tags = tags;
    }
    Object.freeze(this);
  }
}

function parseMessage(message) {
  let tags = {};
  let altText = `MTG Image`;
  const ENDL_MARKER = `|`;
  let text = message
    .trim()
    .split('\n')
    .join(ENDL_MARKER);  // Support multiline strings from YAML;

  const replacementTags = {
    newline: '\n',
    hashtag: '#'
  };

  const replacementTagRegexp = /\{\s*\w+\s*\}/g;
  let replacementTagMatches = text.match(replacementTagRegexp);
  if (replacementTagMatches) {
    replacementTagMatches.forEach(match => {
      const tagMatch = match.match(/\w+/);
      const tag = tagMatch[0];
      if (tag && replacementTags[tag.toLowerCase()]) {
        text = text.replace(match, replacementTags[tag.toLowerCase()]);
      }
    });
  }

  const regexp = /\{\s*\w+?(\s+?.*)?\}/g;
  let matches = text.match(regexp);
  if (matches) {
    const removeEndlRegex = new RegExp(`\\${ENDL_MARKER}`, `g`);
    matches.forEach(match => {
      const tagMatch = match.match(/\{\s*(\w+)(\s?)/);
      const tag = tagMatch[1];

      if (tagMatch[2] && !tags[tag] || replacementTags[tagMatch[2]]) {
        const matchMatch = match.match(/(\w+=`.*?`)/g);
          if (matchMatch) {
            tags[tag] = matchMatch.reduce((result, next) => {
            let key = next.match(/(\w+)=/)[1];
            let value = next.match(/=`(.*?)`/)[1];
            result[key] = value;
            return result;
          }, {});
        }

        // remove the tags from the message text now that we've stored the data in the tags object
        text = text.replace(match, '').replace(removeEndlRegex, '').trim();        
      }
    });

    // Further process svg tags
    if (tags.svg && tags.svg.svgString) {
      tags.svg.svgString = tags.svg.svgString
        .split(ENDL_MARKER).join('\n')              // Restore endlines from before
        .replace(/`/g, '"')													// This gets quotes working
        .replace(/<</g, '{').replace(/>>/g, '}');


      // Get the alt text out of it
      altText = tags.svg.altText || altText;        
    }

    // Further process htmlimg tags
    if (tags.htmlImg && tags.htmlImg.htmlImgString) {
      tags.htmlImg.htmlImgString = tags.htmlImg.htmlImgString
        .split(ENDL_MARKER).join('\n')                        // Restore endlines from before
        .replace(/`/g, '"')																		// This gets quotes working
        .replace(/<</g, '{').replace(/>>/g, '}');     	 			// This gets curly braces working

      // Patch up CSS file paths
      tags.htmlImg.htmlImgString = resolveCssUrls(tags.htmlImg.htmlImgString);

      // Patch up HTML file paths
      tags.htmlImg.htmlImgString = resolveHtmlUrls(tags.htmlImg.htmlImgString);

      // Get the alt text out of it
      altText = tags.htmlImg.altText || altText;
    }

    const tagsToStrip = [
      "&#173;" // HTML shy tag (suggested linebreaks)
    ];

    tagsToStrip.forEach(tag => {
      text = text.replace(new RegExp(tag,'ig'),'');
    });
  }

  text = text.trim().replace(/ +/g,' ');

  return new Headline(text, tags, altText);
}

function resolveCssUrls(html) {
  var newHtml = html.toString();

  function fileUrl(url) {
    var pathName = path.resolve(url).replace(/\\/g, '/');
    // windows drive letters must be prefixed with a slash
    if (pathName[0] !== '/') {
      pathName = '/' + pathName;
    }
    return encodeURI('file://' + pathName);
  }

  const matches = newHtml.match(/url\(\..*?\)/g);
  if (!matches) {
    return html;
  }
  matches.forEach(match => {
    newHtml = newHtml.replace(match, 'url('+ fileUrl(match.match(/url\((\..*?)\)/)[1])  + ')');
  });
  return newHtml;
}

function resolveHtmlUrls(html) {
  const matchRegexes = [
    { matchRegex: /\ssrc="\..*?"/g, replacementRegex: /"(\.?\/.*)"/ }
  ];

  var htmlImgHasLocalPaths = false;
  matchRegexes.forEach(regex => {
    htmlImgHasLocalPaths = true;

    var imgMatch = html.match(regex.matchRegex);
    if (imgMatch) {
      imgMatch.forEach(match => {
        const _match = match.match(regex.replacementRegex);
        if (_match) {
          const _adjustedPath =  pathToFileUrl(process.cwd()) + (_match[1].charAt(0) === '.' ? _match[1].substr(1) : _match[1]);
          html = html.replace(_match[1], _adjustedPath);
        }
      });      
    }  
  });

  if (htmlImgHasLocalPaths) {
    const htmlBaseTag = '<base href="/"/>';    
    html = htmlBaseTag + html;
  }
  return html;
}