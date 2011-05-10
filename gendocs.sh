#!/bin/bash
# I use this script to expand tabs to 4 spaces and back.
# btw, VERY dangerous afaik
mv cedilla.js cedilla_TEMP.js
expand -t 4 cedilla_TEMP.js > cedilla.js;
docco cedilla.js;
rm cedilla.js
mv cedilla_TEMP.js cedilla.js
