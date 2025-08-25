"use strict";

const betAmounts = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 500, 1000, 2000, 5000, 10000];

function getUsername(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWX'; // A to X only
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

function getBetId() {
    // Generate a random bet id string with max length 10
    return `BET${Math.random().toString(36).substr(2, 7).toUpperCase()}`.substr(0, 10);
}

function getRandomNumber(min = 0, max = 36) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



// generate rocket crash random bet
function generateRocketCrashRandomBet() {
    const betAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]; // Select a random bet amount
    return {
        "game_round_id": "",
        "user_id": getUsername(),
        "bet_type": "",
        "bet_amount": betAmount,
        "odds": 0,
        "selection_type": "",
        "selections": [],
        "win_amount": 0,
        "status": 1,
        "updated_at": "",
        "created_at": "",
        "id": getBetId(),
        "bet_no": getBetId(),
        "username": getUsername(),
        "fullname": `John Doe`
    };
}



// generate roulette wheel random bet
function generateRouletteRandomBet() {
    const betAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]; // Select a random bet amount
    const selectionTypes = ['1_12', '13_24', '25_36', '1_18', '19_36', 'even', 'odd', 'red', 'black', '2_1_1', '2_1_2', '2_1_3', "number"];
    const cardNumbers = [0,1,2,3,4,5,6,7,8,9,10,10,10,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36];
    let selections = [cardNumbers[getRandomNumber()]];
    const selectionType = selectionTypes[getRandomNumber(0, 12)];
    let odds = 36;
    if(selectionType != "number") {
        if(selectionType == '1_12'){
            selections = [1,2,3,4,5,6,7,8,9,10,10,10,10,11,12];
        }else if(selectionType == '13_24'){
            selections = [13,14,15,16,17,18,19,20,21,22,23,24];
        }else if(selectionType == '25_36'){
            selections = [25,26,27,28,29,30,31,32,33,34,35,36];
        }else if(selectionType == '1_18'){
            selections = [1,2,3,4,5,6,7,8,9,10,10,10,10,11,12,13,14,15,16,17,18];
        }else if(selectionType == '19_36'){
            selections = [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36];
        }else if(selectionType == 'even'){
            selections = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36];
        }else if(selectionType == 'odd'){
            selections = [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35];
        }else if(selectionType == 'red'){
            selections = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        }else if(selectionType == 'black'){
            selections = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
        }else if(selectionType == '2_1_1'){
            selections = [3,6,9,12,15,18,21,24,27,30,33,36];
        }else if(selectionType == '2_1_2'){
            selections = [2,5,8,11,14,17,20,23,26,29,32,35];
        }else if(selectionType == '2_1_3'){
            selections = [1,4,7,10,13,16,19,22,25,28,31,34];
        }

        odds = 36 / selections.length;
    }

    return {
        "game_round_id": "",
        "user_id": getUsername(),
        "bet_type": "",
        "bet_amount": betAmount,
        "odds": odds,
        "selection_type": selectionType,
        "selections": selections,
        "win_amount": 0,
        "status": 1,
        "updated_at": "",
        "created_at": "",
        "id": getBetId(),
        "bet_no": getBetId(),
        "username": getUsername(),
        "fullname": `John Doe`
    };
}



// generate andar bahar random bet
function generateAndarBaharRandomBet(isMainBet = false) {
    const betAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]; // Select a random bet amount
    const selectionTypes = ['Suits', 'Colors', 'Values', 'Above Below', 'Cards', "Super Bahar", ""];
    const suits = ["Spades", "Hearts", "Diamonds", "Clubs"];
    const colors = ["Red", "Black"];
    const values = ["Any Number", "J", "Q", "K", "A"];
    const aboceBelows = ["Above 8", "8", "Below 8"];
    const cardsDealt = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, "20+"];
    const baharNums = [1, 2, 3, 4, 5, 6];
    const mainBets = ["Andar", "Bahar"];
    let selections = mainBets[getRandomNumber(0,1)];
    const selectionType = selectionTypes[getRandomNumber(0, 6)];
    let odds = 0;
    if(selectionType != "" && !isMainBet) {
        if(selectionType == 'Suits'){
            selections = suits[getRandomNumber(0, 3)];
            odds = 3.80;
        } else if(selectionType == 'Colors'){
            selections = colors[getRandomNumber(0, 1)];
            odds = 1.90;
        } else if(selectionType == 'Values'){
            selections = values[getRandomNumber(0, 4)];
            if(selections == "Any Number"){
                odds = 1.30;
            } else {
                odds = 12.45;
            }
        } else if(selectionType == 'Above Below'){
            selections = aboceBelows[getRandomNumber(0, 2)];
            if(selections == "8"){
                odds = 12.45;
            } else {
                odds = 2.50;
            }
        } else if(selectionType == 'Cards'){
            selections = cardsDealt[getRandomNumber(0, 21)];
            if (selections <= 20) {
                odds = 16.25 + (selections - 1) * 0.75;
            } else {
                let valueAt20 = 16.25 + (20 - 1) * 0.75;
                odds = valueAt20 + (selections - 20) * 4.4;
            }
        } else if(selectionType == 'Super Bahar'){
            selections = baharNums[getRandomNumber(0, 5)];
            if(selections == 6){
                odds = 11.00;
            } else {
                odds = (9 - selections).toFixed(2);
            }
        }
    }

    return {
        "game_round_id": "",
        "bet_type": "",
        "user_id": getUsername(),
        "bet_amount": betAmount,
        "odds": odds,
        "selection_type": selectionType,
        "selections": [selections],
        "win_amount": 0,
        "status": 1,
        "updated_at": "",
        "created_at": "",
        "id": getBetId(),
        "bet_no": getBetId(),
        "username": getUsername(),
        "fullname": `John Doe`
    };
}

// generate baccarat random bet
function generateBaccaratRandomBet() {
    const betAmount = betAmounts[Math.floor(Math.random() * betAmounts.length)]; // Select a random bet amount
    const selections = ['Player', 'Banker', 'Tie', 'Player Pair', 'Banker Pair'];
    let selection = selections[getRandomNumber(0,4)];
    let odds = 2.00;
    if(selections == "Banker") {
        odds = 1.95;
    } else if(selections == "Player") {
        odds = 2.00;
    } else if(selections == "Tie") {
        odds = 8.00;
    }
    return {
        "game_round_id": "",
        "user_id": getUsername(),
        "bet_type": "",
        "bet_amount": betAmount,
        "odds": odds,
        "selection_type": "",
        "selections": [selection],
        "win_amount": 0,
        "status": 1,
        "updated_at": "",
        "created_at": "",
        "id": getBetId(),
        "bet_no": getBetId(),
        "username": getUsername(),
        "fullname": `John Doe`
    };
}

module.exports = { generateRocketCrashRandomBet, generateRouletteRandomBet, generateAndarBaharRandomBet, generateBaccaratRandomBet, getRandomNumber };