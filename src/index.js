'use strict';
const chalk = require('chalk');
const tracery = require(`tracery-grammar`);
const the_pros = require(`./grammar.json`);
const grammar = tracery.createGrammar(the_pros);

grammar.addModifiers(tracery.baseEngModifiers); 

for (let i = 0; i < 5; ++i) {
    console.log(grammar.flatten('#origin#'));
}