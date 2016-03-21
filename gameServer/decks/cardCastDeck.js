/**
 * BlankCards CardCast Deck Importer
 * ©2016 thebit.link
 * 
 * This imports decks from CardCast using their API
 */
'use strict';

const Deck = require('./');
const Globals = require('../globals');
const request = require('request');

class CardCastDeck extends Deck
{
    constructor(deckId, doneHandler)
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
        this.type = 'CardCast';
        request(`https://api.cardcastgame.com/v1/decks/${deckId}/cards`, (error, responde, body) =>
        {
            if (!error && response.statusCode === 200) 
            {
                try 
                {
                    const oriDeck = JSON.parse(body);
                    deck.blackCards = oriDeck.calls;
                    deck.WhiteCards = oriDeck.responses;
                    doneHandler(null, deck);
                }
                catch (ex)
                {
                    deck.type = 'Placeholder';
                    doneHandler(ex, deck);
                }
            }
            else
            {
                // Placeholder deck
                deck.type = 'Placeholder';
                doneHandler(true, deck);
            }
        });
                
    }
}

module.exports = CardCastDeck;
