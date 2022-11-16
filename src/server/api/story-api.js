#!/usr/bin/env node --harmony
'use strict';

const configOverrides = {
	defaultGrammarPath:  './src/data/grammar-storytelling',
};

function loadConfig(newsbotConfigOverridePath) {
	const Config = require('../../../config');
	let loadedConfig = new Config(newsbotConfigOverridePath);
	const config = { ...loadedConfig, ...configOverrides}
	global.mtgnewsbot.config = config;
	return config;
}

var configLoaded = false;

async function getStories(count=1) {
	global.mtgnewsbot = global.mtgnewsbot || {};
	if (!configLoaded) {
		loadConfig(process.env.NEWSBOT_CONFIG_OVERRIDE_PATH || undefined);
	}
	const MtgNewsbot = require('../../mtgnewsbot.js');	
	let bot = new MtgNewsbot({ count });
	const storyJson = await bot.run();
	return storyJson.map(result => result.text);
}

module.exports = {
	getStories,
};

