#!/bin/sh

export SCIROCCO_NO_ENV_FILE=true
cd $HOME
git pull
npm install
npm start
