#!/bin/bash

GIT_BRANCH="express-server"
EXPRESS_SERVER_PORT=80

# DISABLED SINCE THIS IS MANAGED BY GITHUB ACTIONS
# update source
# git fetch origin $GIT_BRANCH
# git reset --hard origin/$GIT_BRANCH
# git pull --rebase origin $GIT_BRANCH
# git checkout $GIT_BRANCH
# code is copied to /opt/

npm install
PORT=$EXPRESS_SERVER_PORT npm run server
