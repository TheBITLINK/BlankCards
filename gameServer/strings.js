/**
 * Strings
 */
'use strict';
const fs = require('fs');
const settings = require('../BlankCards.json');

let strings = require('../strings/en-us.json');

if (fs.existsSync('../strings/' + settings.serverLocale + '.json'))
{
    Object.assign(strings, require('../strings/' + serverLocale + '.json'));
}

// Generate a string from a template
strings.buildString = (str, data) =>
{
    for (let key in data)
    {
        let rE = new RegExp('\\{' + key + '\\}', 'g');
        str = str.replace(rE, data[key]);
    }
    return str;
};

module.exports = strings;
