#!/usr/bin/env node --harmony
'use strict';

const Config = require('../../../config');
const NewsEngine = require('../../news-engine');

const DEFAULT_GRAMMAR_PATH = './src/data/grammar-storytelling';

module.exports = class StoryApi {
	constructor(grammarPath, originOverride) {
		Config.initGlobalConfig(process.env.NEWSBOT_CONFIG_OVERRIDE_PATH);				
		this.newsEngine = new NewsEngine(
			grammarPath || DEFAULT_GRAMMAR_PATH,			
			originOverride || Config.globalConfig.origin,
		);
	}

	async getStoriesAsJson(count=1, customOrigin) {
		return this.newsEngine.generateHeadlines(customOrigin, count);
	}

	async getStoriesAsText(count=1, customOrigin) {
		const storyJson = await this.getStoriesAsJson(count, customOrigin);
		return storyJson.map(result => result.text);
	}	
}