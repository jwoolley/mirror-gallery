const { watch } = require('fs/promises');
const MirrorGallery = require('../src/mirror-gallery');
const NUM_HEADLINES = 5;

function runMirrorGallery() {
  MirrorGallery.run({ count: NUM_HEADLINES });
}

async function watchProject() {
  const ac = new AbortController();
  const { signal } = ac;
  const pathToWatch = `${process.env.NODE_PATH}`;

  console.clear();
  console.log(`Watching ${pathToWatch}`);

  runMirrorGallery();

  try {
    const watcher = watch(pathToWatch, { signal, recursive: true });
    for await (const _event of watcher) {
      console.log(`Watching ${pathToWatch}`);
      console.clear();      
      console.log(`Change detected at ${(new Date()).toLocaleTimeString()}`);
      runMirrorGallery();
    }
  } catch(e) {
    if (e.name === 'AbortError') {
      return;
    }
    throw e;
  }
}

watchProject();

