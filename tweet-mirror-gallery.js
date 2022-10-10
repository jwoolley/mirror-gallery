#!/usr/bin/env node --harmony
'use strict';

global.mtgnewsbot = global.mtgnewsbot || {};

const Config = require('./config');

function loadConfig(overridePath) {
	let config = new Config(overridePath);
	global.mtgnewsbot.config = config;
	return config;
}

loadConfig();

const options = {
 count: 1,
 origin: '#flippedCardImage#',
 verbose: true,
 tweet: true
}

const MtgNewsbot = require('./src/mtgnewsbot.js');
let bot = new MtgNewsbot(options);
bot.run();
