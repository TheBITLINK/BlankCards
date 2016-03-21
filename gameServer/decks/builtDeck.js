/**
 * BlankCards built-in Deck
 * ©2016 thebit.link
 * 
 * This extends FileDeck to provide access to decks in the /decks directory
 * If a localised version exists, it's loaded instead of the default
 */
'use strict';

const Deck = require('./');
const FileDeck = require('./fileDeck');
const Globals = require('../globals');
const async = require('async');

class BuiltDeck extends Deck
{
    constructor(deckName, doneHandler)
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
        this.type = 'Built-in';
        async.waterfall([
            callback => 
            {
                new FileDeck(`decks/${deckName}/${Globals.serverSettings.serverLocale}.json`, (err, deck)=>
                {
                    (!err) ? callback(true, deck) : callback(null, deck);
                });
            },
            (deck, callback) =>
            {
                new FileDeck(`decks/${deckName}/default.json`, (err, deck)=>
                {
                    (!err) ? callback(true, deck) : callback(null, deck);
                });
            },
            (deck, callback) =>
            {
                new FileDeck(`decks/${deckName}/index.json`, (err, deck)=>
                {
                    (!err) ? callback(true, deck) : callback(null, deck);
                });
            },
            (deck, callback) =>
            {
                new FileDeck(`decks/${deckName}.json`, (err, deck)=>
                {
                    (!err) ? callback(true, deck) : callback(null, deck);
                });
            },
        ],
        (err, data) =>
        {
            deck.type        = 'Built-In';
            deck.deckName    = data.deckName;
            deck.by          = data.by;
            deck.description = data.description;
            deck.locale      = data.locale;
            deck.whiteCards  = data.whiteCards || data.WhiteCards;
            deck.blackCards  = data.blackCards || data.BlackCards;
            deck.doneHandler(null, deck);
        });
    }
}

module.exports = BuiltDeck;
