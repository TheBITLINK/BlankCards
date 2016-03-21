/**
 * BlankCards File Deck
 * ©2016 thebit.link
 * 
 * This class attemps to read a deck JSON at the specified path
 */
'use strict';

const Deck = require('./');
const fs = require('fs');
const async = require('async');

class FileDeck extends Deck
{
    constructor(fileName, doneHandler)
    {
        doneHandler = doneHandler || function(error)
        {
            if (error)
            {
                console.error(error);
            }
        };
        super();
        const deck = this;
        this.type = 'File';
        async.waterfall([
            callback => 
            {
                fs.exists(fileName, result =>
                {
                    result ? callback(null, result) : callback(true, {});
                });
            },
            (exists, callback) =>
            {
                fs.readFile(fileName, 'utf-8', callback);
            },
            function(data, callback)
            {
                callback(null, JSON.parse(data));
            }
        ],
        (err, data) =>
        {
            if (!err)
            {
                deck.type        = 'File';
                deck.deckName    = data.deckName;
                deck.by          = data.by;
                deck.description = data.description;
                deck.locale      = data.locale;
                deck.whiteCards  = data.whiteCards || data.WhiteCards;
                deck.blackCards  = data.blackCards || data.BlackCards;
                deck.doneHandler(null, deck);
            }
            else
            {
                // Create a placeholder deck instead
                deck.type = 'Placeholder';
                deck.doneHandler(err, deck);
            }
        });
    }
}

module.exports = FileDeck;
