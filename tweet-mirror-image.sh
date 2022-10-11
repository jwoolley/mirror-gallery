#!/bin/bash

#noisy
set -x

#log the path
echo $PATH

#log node version
node -v

# install dependencies
npm install --production

mkdir -p tmp

# tweet
node --trace-deprecation --harmony tweet-mirror-gallery --tweet
#silent
set +x
