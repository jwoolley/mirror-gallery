'use strict';

const Config = require('../config');
const HeadlineMaker = require('./headline-maker');
const buildGrammar = require('./build-grammar');

const DEFAULT_ORIGIN_STRING = `#origin#`;

class NewsEngine {  
  constructor(grammarPath, originOverride) {
    // load the default grammar
    this.grammar = buildGrammar(grammarPath || Config.globalConfig.defaultGrammarPath);
    // Override the origin
    this.grammar.origin = originOverride || this.grammar.origin;

    if (originOverride) {
      console.info(`Grammar origin was overridden to ${JSON.stringify(originOverride)}`);
    }

    this.headlineMaker = new HeadlineMaker(this.grammar);
  }

  async generateHeadline(customOrigin) {
    return await this.headlineMaker.generateHeadline(customOrigin || DEFAULT_ORIGIN_STRING);
  }

  async generateHeadlines(customOrigin, numHeadlines) {
    const headlines = [];
    for (let i = 0; i < numHeadlines; i++) {
      headlines.push(await this.headlineMaker.generateHeadline(customOrigin || DEFAULT_ORIGIN_STRING));
    }
    return headlines;
  }

  async generateTextHeadlines(customOrigin, numHeadlines) {
    const headlines = [];
    for (let i = 0; i < numHeadlines; ++i) {
      headlines.push(await this.headlineMaker.generateTextHeadline(customOrigin || DEFAULT_ORIGIN_STRING));
    }
    return headlines;
  }
}

module.exports = NewsEngine;
