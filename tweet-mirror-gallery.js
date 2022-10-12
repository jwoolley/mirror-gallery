#!/usr/bin/env node --harmony
'use strict';

global.mtgnewsbot = global.mtgnewsbot || {};

const fs = require('fs');
const path = require('path');
const Config = require('./config');

function loadConfig(overridePath) {
	let config = new Config(overridePath);
	global.mtgnewsbot.config = config;
	return config;
}

// TODO: reintroduce commander CLI options
const configFilePath = './config/heroku-config-override.js';

console.log('process.env: ', JSON.stringify(process.env, null, ' '));

console.log('Loading config...');
loadConfig(configFilePath);

const config = global.mtgnewsbot.config;

if (!path.existsSync(config.paths.tempDirectory)) {
    fs.mkdirSync(config.paths.tempDirectory, { recursive: true, mode: 744 });
}

const options = {
 count: 1,
 origin: '#flippedCardImage#',
 verbose: true,
 tweet: true
}

const MtgNewsbot = require('./src/mtgnewsbot.js');
let bot = new MtgNewsbot(options);
bot.run();
