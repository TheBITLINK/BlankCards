/**
 * BlankCards Base Deck Class
 * ©2016 thebit.link
 * 
 * To be extended by other deck classes (or generate decks at runtime, maybe :D)
 */
'use strict';

const Globals = require('../globals');

class Deck
{
    constructor()
    {
        this.type = 'Default';
        this.deckName = '';
        this.by = '';
        this.description = '';
        this.locale = Globals.serverSettings.serverLocale;
        this.blackCards = [];
        this.whiteCards = [];
    }
    
    addBlackCard(card)
    {
        this.blackCards.push(card);
    }
    
    addWhiteCard(card)
    {
        this.whiteCards.push(card);
    }
}

module.exports = Deck;
