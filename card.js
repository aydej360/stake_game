"use strict";

const cards = [
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "2",
        "name": "2-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "2",
        "name": "2-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "2",
        "name": "2-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "2",
        "name": "2-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "3",
        "name": "3-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "3",
        "name": "3-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "3",
        "name": "3-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "3",
        "name": "3-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "4",
        "name": "4-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "4",
        "name": "4-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "4",
        "name": "4-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "4",
        "name": "4-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "5",
        "name": "5-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "5",
        "name": "5-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "5",
        "name": "5-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "5",
        "name": "5-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "6",
        "name": "6-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "6",
        "name": "6-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "6",
        "name": "6-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "6",
        "name": "6-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "7",
        "name": "7-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "7",
        "name": "7-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "7",
        "name": "7-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "7",
        "name": "7-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "8",
        "name": "8-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "8",
        "name": "8-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "8",
        "name": "8-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "8",
        "name": "8-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "9",
        "name": "9-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "9",
        "name": "9-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "9",
        "name": "9-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "9",
        "name": "9-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "10",
        "name": "10-C"
    },
    {
        "suits": "Diamonds",
        "color": "BRed",
        "card_no": "10",
        "name": "10-D"
    },
    {
        "suits": "Hearts",
        "color": "BRed",
        "card_no": "10",
        "name": "10-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "10",
        "name": "10-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "A",
        "name": "A-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "A",
        "name": "A-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "A",
        "name": "A-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "A",
        "name": "A-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "J",
        "name": "J-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "J",
        "name": "J-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "J",
        "name": "J-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "J",
        "name": "J-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "K",
        "name": "K-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "K",
        "name": "K-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "K",
        "name": "K-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "K",
        "name": "K-S"
    },
    {
        "suits": "Clubs",
        "color": "Black",
        "card_no": "Q",
        "name": "Q-C"
    },
    {
        "suits": "Diamonds",
        "color": "Red",
        "card_no": "Q",
        "name": "Q-D"
    },
    {
        "suits": "Hearts",
        "color": "Red",
        "card_no": "Q",
        "name": "Q-H"
    },
    {
        "suits": "Spades",
        "color": "Black",
        "card_no": "Q",
        "name": "Q-S"
    }
];

module.exports = { cards };