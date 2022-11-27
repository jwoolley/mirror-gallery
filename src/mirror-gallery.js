const Config = require('../config');

function run(options) {
  Config.initGlobalConfig(options.configOverride)
  const MirrorGallery = require('./mtgnewsbot.js');
  let bot = new MirrorGallery(options);
  return bot.run();
}

module.exports = { run }