#!/bin/bash

#noisy
set -x

#log the path
echo $PATH

#log node version
node -v

# install fonts
# cp ./src/data/fonts/*.ttf /usr/local/share/fonts
# cp ./src/data/fonts/*.otf /usr/local/share/fonts

# install dependencies
npm install --production

# tweet

if
  [ -z "$1" ]
then
	echo "generating mirror gallery image"
	node --trace-deprecation --harmony mtgnews --tweet -o "#flippedCardImage#"
else
	echo "generating $1 mirror gallery image(s)"
	node --trace-deprecation --harmony mtgnews -c $1 -o "#flippedCardImage#"
fi
# node --harmony mtgnews -o "#flippedCardImage#" # --tweet --toot --discord

#silent
set +x
