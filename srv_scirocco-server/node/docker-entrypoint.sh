#!/bin/sh

cd $HOME
git pull
npm install
cp .env.dist .env
npm start
