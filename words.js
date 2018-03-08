const {map, flatten, uniq} = require('lodash');
const {encode} = require('querystring');
const questions = require('./_data/tests');
const keys = Object.keys(questions);
const {WORDS_DELIMITER} = require('./words-delimeter');

const words = uniq(
    flatten(
      keys
        .map(string => string
          .split(WORDS_DELIMITER)
          .map(unifyWord)
          .filter(({length}) => length >= 3)
          //.slice(0, 2)
        )
    )
);

function unifyWord(word) {
  return word
    .slice(0, 3)
    .toLowerCase()
}

console.log(words.join('\n'));