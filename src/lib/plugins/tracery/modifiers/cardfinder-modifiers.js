'use strict';
const request = require('request');
const config = global.mtgnewsbot.config;
const readJsonFile = require('../../../util/read-json-file.js');
const staticCardDataFile = './src/data/cards/example-cards.json';

const logger = config.loggers.cardfinder;

function randomElement(array) {
  return array && array[Math.floor(Math.random() * array.length)];
}

const colorNames = {
  W: 'white',
  U: 'blue',
  B: 'black',
  R: 'red',
  G: 'green',
  WU: 'UW',
  WR: 'RW',
  WG: 'GW',
  BR: 'RB',
  UBG: 'BUG',
  URG: 'RUG'
};

const escapedParams = {
  '_COMMA_': ','
};

const TRACERY_LABEL_PREFIX = '_card';

class CardSearchResultField {
  constructor(traceryLabel, parser) {
    this.traceryLabel = traceryLabel;
    this.parser = parser;
  }

  parseField(card) {
    return this.parser(card);
  }

  getLabel() {
    return TRACERY_LABEL_PREFIX + this.traceryLabel.charAt(0).toUpperCase() + this.traceryLabel.slice(1);
  }
}

function getFamiliarName(entityName) {
  var firstName = entityName.split(',')[0];
  if (firstName.length < entityName.length) {
    return firstName;
  }

  firstName = entityName.split(' of the ')[0];
  if (firstName.length < entityName.length) {
    return firstName;
  }

  firstName = entityName.split(' of ')[0];
  if (firstName.length < entityName.length) {
    return firstName;
  }

  return entityName.split(' the ')[0];
}

function getColorDescription(colorIdentity) {
  if (!colorIdentity) {
    return 'colorless';
  } else if (colorIdentity.length == 5) {
    return 'WUBRG';
  }

  const colorDescription = colorIdentity.join('');
  return colorNames[colorDescription] || colorDescription;
}

function getColorFullDescription(colorIdentity) {
  if (!colorIdentity) {
    return 'colorless';
  }

  return colorIdentity.map(color => colorNames[color]).join('-');
}

function getColorCategory(colorIdentity) {
  if (!colorIdentity) {
    return 'colorless';
  }

  if (colorIdentity.length === 1) {
    return colorNames[colorIdentity[0]];
  } else {
    return 'multicolored';
  }
}

function getSomeColor(colorIdentity) {
  if (!colorIdentity) {
    return 'colorless';
  }

  return colorNames[randomElement(colorIdentity)];
}


function getSomeCardTypeOrSubtype(types, subtypes) {
  const typesAndSubtypes = types.concat(subtypes ? subtypes : []);
  return randomElement(typesAndSubtypes);
}

function getSomeCreatureType(types, subtypes) {
  if (types.indexOf('Creature') === -1 || !subtypes) {
    return undefined;
  }
  return randomElement(subtypes);
}

async function cardSearchTwoParter(separator, params) {
  const searchTerm = separator.match(/^".*"$/) ? separator : `"? ${separator} "`;
  const splitter = separator.match(/^".*"$/) && separator.match(/[^?!"|]+/) ? separator.match(/[^?!"|]+/)[0] : ` ${separator} `; 

  const additionalQueryTerms = decodeURIComponent(params[2]);

  const query = { 
    q: `name:${searchTerm}` + (additionalQueryTerms ? ` ${additionalQueryTerms}` : '')
  };

  logger.log(`separator: ${separator}`);
  logger.log(`searchTerm: ${searchTerm}`);
  logger.log(`query.q: ${query.q}`);

  // optional string prefix to remove before parsing
  var ignorePrefix = params[1] || '';

  Object.keys(escapedParams).forEach(escapeCode => {
    ignorePrefix = ignorePrefix.replace(new RegExp(escapeCode, 'g'), escapedParams[escapeCode]);
  });

  const firstPart = new CardSearchResultField('NameFirstPart', card => {
    var name = card.name.replace(new RegExp(`^${ignorePrefix}`), '').trim();
    return traceryEscape(name.split(splitter)[0]).trim();
  });

  const secondPart = new CardSearchResultField('NameSecondPart', card => {
    let secondPart = card.name.split(splitter)[1];
    return traceryEscape(secondPart ? secondPart : '').trim();
  });

  const additionalFields = [];
  additionalFields.push(firstPart, secondPart);

  return cardFinderSearch(query, params, additionalFields);
}

async function randomCards(limit) {
    logger.log(`Finding ${limit} random cards`);

  const query = { 
    q: 'cmc >= 0',
    limit: limit || 1,
    sort: 'random'
  };
  return searchCardFinder(query);
}

function randomStaticCards(limit) {
  const cardData = readJsonFile(staticCardDataFile);
  const cards = [];
  for (let i = 0; i < limit || 1; i++) {
    cards.push(randomElement(cardData));
  }
  return cards;
}

// fix for unhiged card names e.g. Sly Spy (e) -> Sly Spy
function stripVersionLetterCode(s) {
  try {
    const letterCodeRegExp = /(.*)\s+\(\w\)/;
    const match = s.match(letterCodeRegExp);

    if (match) {
      return match[1];
    }
  } catch (e) {
    logger.warn('Error parsing version letter code: ' + e);
  }
  return s;  
}

function escapeParentheses(s) {
  return s.replace(/(\(|\))/g,'%5C$1');
}

async function cardSearchRandom(undefined, params) {
  const query = { 
    q: 'not rarity:basic'
  };
  return cardFinderSearch(query, params);    
}

async function cardSearchByName(s, params) {
  const query = { 
    q: `name:"${s}"`
  };
  return cardFinderSearch(query, params);    
}

async function cardSearchBySet(s, params) {
  const query = { 
    q: 'set:' + s
  };
  return cardFinderSearch(query, params);    
}

async function cardSearchByText(s, params) {
  const query = { 
    q: 'text:' + s
  };
  return cardFinderSearch(query, params);  
}

async function cardSearchByType(s, params) {
  const query = { 
    q: 't:' + s
  };
  return cardFinderSearch(query, params);
}

async function cardSearchOneWordName(undefined, params) {
  const cardTypes = params.slice(1);
  const query = {
    q: 'not name:"? "'
  };
  if (cardTypes.length > 0) {
    query.q += cardTypes.reduce((list, type) => {
      list = list.length === 0 ? ' ' : list + ' OR ';
      return list += 't: ' + type;
    }, '');
  }
  return cardFinderSearch(query, params);  
}

async function cardSearchCustomQuery(s, params) {
  if (s) {
    logger.log('parsing query argument: ' + s);    

    logger.log('[cardSearchCustomQuery.s]: ' + s);


    // replace spaces in quotes strings with +s
    const quotedSubstrings = s.match(/".*?"/g);
    if (quotedSubstrings) {
      quotedSubstrings.forEach(match => {
        s = s.replace(match, match.replace(/\s+/g, '+'));
      });
    }

    logger.log('[cardSearchCustomQuery.s (post space-replace)]: ' + s);

    const terms = s.trim().split(/\s+/);

    logger.log('[cardSearchCustomQuery.terms]: ' + terms);

    try {
      let query = terms.reduce((query, term) => {        
        let key = term.split('=')[0];
        let value = term.split('=')[1] ? term.split('=')[1].replace(/\++/g, ' ') : term;

        if (query.length > 0) {
          query += ' ';
        }

        if (key.endsWith('!')) {
          key = 'not ' + key.substring(0, key.length - 1);
        }  else if (key.endsWith('|')) {
          key = 'or ' + key.substring(0, key.length - 1);
        } else if (key.endsWith('~')) {
          key = ' ' + key.substring(0, key.length - 1);
        } else if (query.length > 0) {
          key = 'and ' + key;
        }
        return query += `${key}:${value}`;
      }, '');
      logger.log('parsed query argument: ' + query);
      return cardFinderSearch({ q: query }, params);
    } catch (e) {
      logger.warn(e);
    }    
  } else {
    logger.log('query argument not specified.');        
  }

  return cardSearchRandom(undefined, params);
}

async function searchCardFinder(query) {
  const SEARCH_API_JSON_URL = 'https://goodgamery.com/api/mtg/card/json';

  return new Promise((resolve, reject) => {
    request.get({ url: SEARCH_API_JSON_URL, qs: query }, (err, data, body) => {
      logger.log('REQUEST DATA '); logger.log(JSON.stringify(data));

      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    });
  });
}

function traceryEscape(string) {
  return string.replace(/:/g,'#colon#').replace(/,/g,"#comma#");
}

async function cardFinderSearch(query, params, additionalFields) {
  let resultData;
  let result;
  let queryLimit = 1;

  if (params.length > 0) {
    if (parseInt(params[0]) > 0) {
      queryLimit = parseInt(params[0]);
    } else {
      logger.warn(`Invalid query limit specified for query ${JSON.stringify(query)}: '${params[0]}' is not a positive integer.`);
    }
  }

  query.limit = queryLimit;
  query.sort = 'random';

  logger.log(`Searching for ${queryLimit} cards.`);
  try {
    try {
      resultData = await searchCardFinder(query);
      try {
        result = JSON.parse(resultData);

        logger.log('Retrieved ' + result.length + ' cards.');

        if (result.error) {
          result = [];
        }

        if (result.length < queryLimit) {          
          logger.warn(`Zero or insufficient results returned from card search: expected ${queryLimit} but received ${result.length}.`);
            
          if (params[1] === 'notRandom') {
            logger.warn(`'notRandom' paramter specified. Returning empty result.`);            
            return '';
          }

          logger.warn('Fetching random cards.');

          resultData = await randomCards(queryLimit - result.length);
          logger.log('Retrieved ' + JSON.parse(resultData).length + ' additional cards.');

          result = result.concat(JSON.parse(resultData));
        }
      } catch (e) {
        throw new Error('Error parsing card data: ' + e);    
      }        
    } catch (e) {
      throw new Error('Failed to fetch card data: ' + e);
    }      
  } catch (e) {
    logger.warn(e);    
    result = [randomStaticCards(queryLimit)];
  }

  logger.log('Result: ' + JSON.stringify(result));
  logger.log('Total cards: ' + result.length);

  try {    
    let finalResult = '';
    for (let i = 1; i <= queryLimit; i++) {
      const card = result[i - 1];

      const rawName = traceryEscape(card.name);
      const familiarName = traceryEscape(getFamiliarName(card.name));
      const sanitizedName = stripVersionLetterCode(rawName);    

      let name = rawName;
      const set = traceryEscape(card.set);
      const setCode = traceryEscape(card.code);      
      const rarity = traceryEscape(card.rarity);      
      const type = randomElement(card.types);
      const subtype = randomElement(card.subtypes);
      const fullType = card.types ? card.types.join(' ') : (card.layout === 'token' ? 'token' : undefined);
      const fullSubtype = card.subtypes && card.subtypes.join(' ');    
      const someTypeOrSubtype = fullType === 'token' ? 'token' : card.types && getSomeCardTypeOrSubtype(card.types, card.subtypes);
      const someCreatureType = fullType === 'token' ? 'token' : card.types && getSomeCreatureType(card.types, card.subtypes);
      const imgUrl = traceryEscape(card.imageUrl);
      const color = getColorDescription(card.colorIdentity);
      const colorDescriptive = getColorFullDescription(card.colorIdentity);
      const colorClass = getColorCategory(card.colorIdentity);    
      const someColor = getSomeColor(card.colorIdentity);
      const nameFirstWord = card.name.split(" ")[0];
      const nameLastWord = card.name.split(" ").pop();
      const cmc = card.cmc || '0';

      if (card.layout === 'token' && name.toLowerCase().indexOf('token') === -1) {
        name += ' Token';
      } else if (card.layout === 'vanguard') {
        name += ' Avatar';
      } else if (card.layout === 'split' || card.layout === 'aftermath') {
        name = card.names ? card.names.reduce((fullName, name) => fullName.length === 0 ? name : `${fullName} // ${name}`) : card.name;
      }

      const prefix = TRACERY_LABEL_PREFIX;

      // match given string, set an enumerated field to the value of each '$'
      // $! ==> single-word match; $? ==> lazy match
      const cardTextMatches = params[2] && card.text && (card.text.match(new RegExp(params[2].replace(/\$!/g, '\\b([^ ]+?)\\b').replace(/\$\?/g, '(.+?)').replace(/\$/g, '(.+)'), 'i')) || []).slice(1)
        .reduce((list, match, index) => `${list}[${prefix}TextMatch${index+1}_${i}:${match}]`, '');

      finalResult = finalResult.concat(
        `[${prefix}Name${i}:${name}]`,
        `[${prefix}RawName${i}:${rawName}]`,
        `[${prefix}FamiliarName${i}:${familiarName}]`,
        `[${prefix}SanitizedName${i}:${sanitizedName}]`,                
        `[${prefix}Set${i}:${set}]`,
        `[${prefix}SetCode${i}:${setCode}]`,        
        `[${prefix}Rarity${i}:${rarity}]`,      
        `[${prefix}Type${i}:${type}]`,     
        `[${prefix}FullSubtype${i}:${fullSubtype}]`,
        `[${prefix}FullType${i}:${fullType}]`,   
        `[${prefix}SomeTypeOrSubtype${i}:${someTypeOrSubtype}]`,                              
        `[${prefix}ImgUrl${i}:${imgUrl}]`,
        `[${prefix}Descriptive${i}:${colorDescriptive}]`,
        `[${prefix}NameFirstWord${i}:${nameFirstWord}]`,        
        `[${prefix}NameLastWord${i}:${nameLastWord}]`,
        `[${prefix}Cmc${i}:${cmc}]`,        
        subtype ? `[${prefix}Subtype${i}:${subtype}]` : '',
        someCreatureType ? `[${prefix}SomeCreatureType${i}:${someCreatureType}]` : '', 
        color ? `[${prefix}Color${i}:${color}]` : '',             
        colorClass ? `[${prefix}ColorClass${i}:${colorClass}]` : '',
        someColor ? `[${prefix}SomeColor${i}:${someColor}]`: '',
        cardTextMatches ? cardTextMatches : ''        
      );

      if (additionalFields) {
        additionalFields.forEach(field => {
          try {
            const label = `${field.getLabel()}${i}`;
            const value = field.parseField(card);
            finalResult = finalResult.concat(`[${label}:${value}]`);
          } catch (e) {
            logger.warn(`Unable to parse additional field ${field.getLabel()}: ${e}`);
          }
        });
      }      
    }

    logger.log('Constructed cardsearch result: ' + finalResult);
    return finalResult;
  } catch (e) {
    logger.warn(e);
    return 'SEARCH_FAILED_NO_RESULT';
  }
}

module.exports = {
  cardSearchByName: (name) => cardSearchByName(name, 1),
  cardSearchBySet,
  cardSearchByText,
  cardSearchByType,  
  cardSearchTwoParter,
  cardSearchOneWordName,
  cardSearchCustomQuery,
  escapeParentheses,
  randomCard:   () => cardSearchRandom(undefined, 1),
  randomCards:  cardSearchRandom,
  sanityCheck: (s) => console.log(s)
};