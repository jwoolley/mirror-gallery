'use strict';
const path = require('path')
const merge = require('lodash.merge');
const Logger = require('./src/lib/util/logger');

const DEFAULT_OVERRIDE_JSON_PATH = './config-override.json';
const DEFAULT_OVERRIDE_JS_PATH = './config-override.js';
const DEFAULT_GRAMMAR_PATH = './src/data/grammar-storytelling';
const TWEET_LENGTH = 280;
const TEMPFILE_PATH = '/tmp';

function loadConfigOverride(overridePath) {
	const possibleOverrides = overridePath 
		? [overridePath]
		: [DEFAULT_OVERRIDE_JSON_PATH, DEFAULT_OVERRIDE_JS_PATH];

	return possibleOverrides.reduce((config, possiblePath) => {	
	  if (!config) {
		try {
		  config = require(path.resolve('.', possiblePath));
		  console.log(`Loaded config overrides from ${possiblePath}`);
		} catch (e) {
		  if (e.code === 'MODULE_NOT_FOUND') { 
		    console.log(`No config override found at ${possiblePath}`);
		  } else {
		    console.warn(`Unable to load config override: ${e}`);
		  }
		} 
	  }
	  return config;
	}, undefined);
}

class Config {
	constructor(overridePath) {

		let base = {
		  defaultGrammarPath:  DEFAULT_GRAMMAR_PATH,
		  debugOptions: {
		    deleteTempImages: true
		  },  
		  loggers: { },
		  logPrefs:  { cardfinder: true, html: true, svg: true, scryfall: true },
		  origin: undefined,
		  tweetLength: TWEET_LENGTH,
		  paths: {
		    tempDirectory: TEMPFILE_PATH
		  },
		  twitterLink: `https://twitter.com/MTGnewsbot`,
		  webhookUrl: null,
		  webhookUrlErr: null,
		  TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
		  TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
		  TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
		  TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
		  MASTODON_API_TOKEN: process.env.MASTODON_API_TOKEN,
		  MASTODON_API_URL: process.env.MASTODON_API_URL
		};

		merge(this, base);
		// apply overrides from config overrides file
		if (overridePath) {		
		  	let override = loadConfigOverride(overridePath);
		  	if (override) {
			  merge(this, override);	
		  	}
		}

		// create loggers and enable or disable based on preferences
		const loggers = {
			cardfinder: new Logger('cardfinder', this.logPrefs.cardfinder),
			html: new Logger('html', this.logPrefs.html),
			svg: new Logger('svg', this.logPrefs.svg),
			scryfall: new Logger('scryfall', this.logPrefs.scryfall)
		};

		merge(this, { loggers: loggers });

		Object.freeze(this);
	}
}

module.exports = Config;
