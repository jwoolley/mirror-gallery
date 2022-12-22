#!/usr/bin/env node --harmony
'use strict';

// Command processor
const commander = require('commander');

function getOptions(commandLineOptions) {
  // Combine with default options	
	const options = Object.assign({
    count: 1,
    origin: '#origin#',
    verbose: false,
    tweet: false,
    toot: false,
    discord: false,
    configOverride: undefined,
  }, commandLineOptions);

  // Time to log
  if (options.verbose) {
    console.log(`Options:`);
    console.log(` - Count:   ${options.count}`);
    console.log(` - Origin: "${options.origin}"`);
    console.log(` - Verbose: ${options.verbose}`);
    console.log(` - Tweet:   ${options.tweet}`);
    console.log(` - Toot:    ${options.toot}`);
    console.log(` - Discord: ${options.discord}`);
    console.log(` - Config Override: ${options.configOverride}`);
  }

  return options;
}

commander
    .version('1.0.0')
    .usage('[options]')
    .option('-f --config-override [path]', 'set path to config override path. defaults to ./config-override.json')   
    .option(`-c --count <n>`, `Count of news articles to generate`)
    .option(`-o --origin [string]`, `Origin string to flatten. Defaults to "#origin#"`)
    .option('-v --verbose', "Verbose logging")
    .option('-t --tweet', "Tweet the result to Twitter. Overrides count to 1.")
    .option('-m --toot', "Toot the result to Mastodon. Overrides count to 1.")
    .option('-d --discord', "Post the result on discord")
    .option('--debug', "Post the result on debugging discord channel")
    .parse(process.argv);

const options = getOptions(commander);
const MirrorGallery = require('./src/mirror-gallery.js');
MirrorGallery.run(options);
