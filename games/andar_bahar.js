"use strict";

const { configuration } = require("../configuration.js");
const { api } = require("../api.js");
const { generateAndarBaharRandomBet, getRandomNumber } = require("../random_bet.js");
const { returnResponse } = require("../return_response.js");
const { cards } = require("../card.js");
const { logError } = require('../logger.js');

const alias = configuration.andarBaharGame.alias;
const gameName = "Andar Bahar";
let gameIsActive = configuration.andarBaharGame.status;
let gameRoundData = {};
let betLists = [];
let betSummary = {
    totalPlayers: 0,
    totalBetAmounts: 0,
    totalWinAmounts: 0,
};
let bettingOpen = true;
let gameStatus = "";
let randomBetLists = [];
let randomBetInterval = null;
let idlePhaseData = {
    idlePhase: false,
    startTime: null,
    endTime: null,
    bettingPhaseTime: configuration.andarBaharGame.bettingPhaseTime * 1000,
    secondBetPhaseTime: configuration.andarBaharGame.secondBetPhaseTime * 1000,
    nextRoundStartTime: (configuration.andarBaharGame.nextRoundStartTime * 1000) + 2000,
    bettingPhaseEndTime: 0,
    bettingIdlePhaseEndTime: 0,
};
let jokerCard = null;
let winSide = null;
let totalDealts = 0;
let totalDealtCards = 0;
let dealtCardNames = [];
let dealtCardNo = 1;
let lastDealtCard = {
    andar: {},
    bahar: {},
}



async function startAndarBaharGameRound() {
    try {
        resetData();

        const roundData = await api.createNewRound(alias);
        if(roundData == 'error') {
            gameIsActive = false;
            gameStatus = "gameInactive";
            returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
            return;
        }

        bettingOpen = true;
        gameStatus = "bettingPhase";
        gameRoundData = roundData;
        jokerCard = null;
        totalDealts = 0;
        totalDealtCards = 0;
        winSide = null;
        dealtCardNames = [];
        lastDealtCard = {
            andar: {},
            bahar: {},
        }


        returnResponse(alias, null, "bettingPhase", true, { betLists, betSummary }, "Betting phase started! Place your bets.", true );
        idlePhaseData.bettingPhaseEndTime = Date.now() + idlePhaseData.bettingPhaseTime;

        startRandomBetAdd(true);
        setTimeout(() => {
            clearInterval(randomBetInterval);
            bettingOpen = false;
            gameStatus = "gameStart";
            startGame();
        }, idlePhaseData.bettingPhaseTime);
    } catch (error) {
        logError(error, { gameName, function: 'startAndarBaharGameRound' });
    }
}

function resetData() {
    betLists = [];
    gameRoundData = {};
    betSummary = { totalPlayers: 0, totalBetAmounts: 0, totalWinAmounts: 0 };
    gameStatus = "";
    idlePhaseData.bettingPhaseEndTime = 0;
    idlePhaseData.bettingIdlePhaseEndTime = 0;
    idlePhaseData.endTime = "";
    randomBetLists = [];
    clearInterval(randomBetInterval);
}

async function startGame() {
    try {
        const response = await api.getAndarBaharJokerCard(gameRoundData.id);
        jokerCard = response.jokerCard;
        totalDealts = response.totalDealts;
        totalDealtCards = response.totalDealtCards;
        winSide = response.winSide;
        let winSideBetLists = response.winSideBetLists;
        let randomWinBet = getWinRandomBets(true);
        if (randomWinBet.sideBetList.length > 0) {
            winSideBetLists = winSideBetLists.concat(randomWinBet.sideBetList);
        }
        betSummary.totalWinAmounts = (parseFloat(response.totalWinAmount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
        returnResponse(alias, null, "gameStart", true, { jokerCard, winSideBetLists, betSummary }, "Game has started! Joker has been declared", true);
        
        gameStatus = "dealtCard";
        dealtCardNo = 1;
        startToDealt();
    } catch (error) {
        logError(error, { gameName, function: 'startGame'});
    }
}


function startToDealt() {
    try {
        let winDealtNo = null;

        let dealtInterval = setInterval(async () => {
            let dealtSide = getdealtSide(dealtCardNo);
            let winDeclared = false;
            let dealtCard = getDealtCard();
            if (((dealtCardNo == totalDealtCards) || ((dealtCardNo + 1) == totalDealtCards)) && dealtSide == winSide) {
                dealtCard = getDealtCard(true);
                winDealtNo = dealtCardNo;
                winDeclared = true;
            }
            
            if(dealtSide == "Andar") {
                lastDealtCard.andar = dealtCard;
            } else {
                lastDealtCard.bahar = dealtCard;
            }
            let data = {
                dealtCard: dealtCard,
                dealtCardNo: dealtCardNo,
                dealtSide: dealtSide,
            };
            dealtCardNames.push(dealtCard.name);
            returnResponse(alias, null, "dealtCard", true, data, "Card dealt successfully!", true);
            if(dealtCardNo == 2 && totalDealtCards > 2) {
                dealtCardNo++;
                clearInterval(dealtInterval);
                startSecondBettingPhase();
            } else {
                dealtCardNo++;
                if (dealtCardNo > totalDealtCards || winDeclared) {
                    clearInterval(dealtInterval);
                    endGame(winSide, winDealtNo, totalDealts);
                }
            }
        }, 1500);
    } catch (error) {
        logError(error, { gameName, function: 'startToDealt' });
    }
}

function getdealtSide(dealtCardNo) {
    if (dealtCardNo % 2 === 0) {
        return "Bahar"; // Even numbers are considered "bahar" // 2,4,6...
    } else {
        return "Andar"; // Odd numbers are considered "andar" // 1,3,5...
    }
}

function getDealtCard(isJoker = false) {
    try {
        let card;
        do {
            card = cards[getRandomNumber(0, 51)];
            if (isJoker) {
                if (card.card_no === jokerCard.card_no && card.name !== jokerCard.name) {
                    break;
                }
            } else {
                if (card.card_no !== jokerCard.card_no && !dealtCardNames.includes(card.name)) {
                    break;
                }
            }
        } while (true);
        return card;
    } catch (error) {
        logError(error, { gameName, function: 'getDealtCard'});
    }
}


async function endGame(winSide, winDealtNo, totalDealts) {
    try {
        let randomWinBet = getWinRandomBets(false, winDealtNo, totalDealts, winSide);

        const response = await api.getAndarBaharWinResult(gameRoundData.id, jokerCard, winSide, winDealtNo, totalDealts);
        
        gameStatus = "gameEnd";
        if (randomWinBet.betList.length > 0) {
            response.winBetLists = response.winBetLists.concat(randomWinBet.betList);
        }
        if (randomWinBet.sideBetList.length > 0) {
            response.winSideBetLists = response.winSideBetLists.concat(randomWinBet.sideBetList);
        }
        response.winBetLists = response.winBetLists.concat(response.winSideBetLists);
        betSummary.totalWinAmounts = (parseFloat(response.totalWinAmount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
        response.betSummary = betSummary;
        returnResponse(alias, null, "gameEnd", true, response, "The game has ended! Result has been declared!", true);
        idlePhase();
        lastDealtCard = {
            andar: {},
            bahar: {},
        }
    } catch (error) {
        logError(error, { gameName, function: 'endGame'});
    }
}

function startSecondBettingPhase() {
    try {
        bettingOpen = true;
        gameStatus = "secondBettingPhase";
        returnResponse(alias, null, "secondBettingPhase", true, {}, "Second Betting phase started! Place your bets.", true);

        startRandomBetAdd();
        idlePhaseData.bettingPhaseEndTime = Date.now() + idlePhaseData.secondBetPhaseTime;
        setTimeout(async () => {
            try {
                clearInterval(randomBetInterval);
                bettingOpen = false;
                gameStatus = "secondBettingPhaseOver";
                returnResponse(alias, null, "secondBettingPhaseOver", true, {}, "Betting phase is over!", true );

                const response = await api.getAndarBaharWinSide(gameRoundData.id);
                winSide = response.winSide;
                gameStatus = "dealtCard";
                startToDealt();
            } catch (error) {
                logError(error, { gameName, function: 'startSecondBettingPhase'});
            }
            
        }, idlePhaseData.secondBetPhaseTime);
    } catch (error) {
        logError(error, { gameName, function: 'startSecondBettingPhase'});
    }
}

function idlePhase() {
    try {
        let nextRoundStartTime = idlePhaseData.nextRoundStartTime;
        gameStatus = "idlePhase";
        idlePhaseData = { ...idlePhaseData, idlePhase: true, startTime: new Date(), endTime: Date.now() + nextRoundStartTime};

        returnResponse(alias, null, "idlePhase", true, { idlePhaseData, gameStatus }, `${nextRoundStartTime}-second cooldown before the next round.`, true);

        setTimeout(() => {
            if (gameIsActive) { 
                startAndarBaharGameRound();
            } else {
                gameStatus = "gameInactive";
                
                returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
            }
        }, nextRoundStartTime);
    } catch (error) {
        logError(error, { gameName, function: 'idlePhase'});
    }
}


function updateAndarBaharGameStatus(status, isUpdateConfiguration = false) {
    try {
        gameIsActive = status;
        if(gameIsActive == true && gameStatus == "gameInactive") {
            startAndarBaharGameRound();
        }
        if(isUpdateConfiguration == true) {
            idlePhaseData = {
                bettingPhaseTime: configuration.andarBaharGame.bettingPhaseTime * 1000,
                secondBetPhaseTime: configuration.andarBaharGame.secondBetPhaseTime * 1000,
                nextRoundStartTime: (configuration.andarBaharGame.nextRoundStartTime * 1000) + 2000,
            };
            returnResponse(alias, null, "updateConfiguration", true, {idlePhaseData}, "Game configuration has been updated.", true);
        }
    } catch (error) {
        logError(error, { gameName, function: 'updateAndarBaharGameStatus'});
        
    }
}
    

function startRandomBetAdd(withSideBet = false) {
    try {
        if (configuration.andarBaharGame.enableRandomBet == true) {
            setTimeout(() => {
                let numberOfTotalRandomBet = getRandomNumber(500, 3000);
                let perSecondBets = numberOfTotalRandomBet / configuration.andarBaharGame.bettingPhaseTime;
                if(perSecondBets < 1) {
                    perSecondBets = numberOfTotalRandomBet / 20
                }
                randomBetInterval = setInterval(() => {
                    if (randomBetLists.length >= numberOfTotalRandomBet) {
                        clearInterval(randomBetInterval);
                    } else {
                        addRandomBet(withSideBet, perSecondBets);
                    }
                }, 500);
            }, 1000);
        }
    } catch (error) {
        logError(error, { gameName, function: 'startRandomBetAdd'});
    }
}

function addRandomBet(withSideBet, totalRandomBet) {
    try {
        let bets = [];
        totalRandomBet -= getRandomNumber(1, 20); 
        
        for (let i = 0; i < totalRandomBet; i++) {
            let bet = generateAndarBaharRandomBet(!withSideBet);
            if(["Andar", "Bahar"].includes(bet.selections.toString())) {
                bet.bet_type = (withSideBet == false) ? 2 : 1;
            }
            randomBetLists.push(bet);
            bets.push(bet);            
        }
        updateBetSummary(bets, true);
    } catch (error) {
        logError(error, { gameName, function: 'addRandomBet'});
    }
}

function updateBetSummary(betList, isRandomBet = false) {
    try {
        betList.forEach(bet => {
            betLists.push(bet);
            betSummary.totalBetAmounts = (
                parseFloat(betSummary.totalBetAmounts) + parseFloat(bet.bet_amount)
            ).toFixed(2);
        });
        (isRandomBet) ? (betSummary.totalPlayers = parseInt(betSummary.totalPlayers) + parseInt(betList.length)) : betSummary.totalPlayers++;
        returnResponse(alias, null, "updateBets", true, { betList, betSummary }, "New bet has been added successfully.", true);
    } catch (error) {
        logError(error, { gameName, function: 'updateBetSummary'});
    }
  }

function requestPlaceBet(data, ws) {
    try {
        let betAmount = data.betAmount;
        let userId = data.userId;
        let betType = data.betType;
        let selectionType = data.selectionType;
        let selections = data.selections;
        let errorMessages = [];
        if (!userId) errorMessages.push("User ID is required!");

        if (selections == [] || selections == '') errorMessages.push("Card selection is required!");

        if (betAmount.length !== selectionType.length || selectionType.length !== selections.length || selections.length !== betAmount.length || betType == "") {
            errorMessages.push("Mismatch in selected bets. Please ensure all selections are valid.");
        } else {
            for (let i = 0; i < betAmount.length; i++) {
                if (betAmount[i] == 0 || betAmount[i] == '' || betAmount[i] == undefined) {
                    errorMessages.push(`Bet amount is required!`);
                } else if (parseInt(betAmount[i]) > parseInt(gameRoundData.max_bet_amount)) {
                    errorMessages.push(`Bet amount exceeds the maximum allowed of ${parseInt(gameRoundData.max_bet_amount)}!`);
                } else if (parseInt(betAmount[i]) < parseInt(gameRoundData.min_bet_amount)) {
                    errorMessages.push(`Bet amount is less than the minimum allowed of ${parseInt(gameRoundData.min_bet_amount)}!`);
                }
            }
        }

        if (errorMessages.length > 0) {
            returnResponse(alias, ws, "validationError", false, { errorMessages }, "Validation error", false);
        } else {
            let formData = {
                user_id: userId,
                bet_amount: betAmount,
                game_round_id: gameRoundData.id,
                bet_type: betType,
                selection_type: selectionType,
                selections: selections,
            };
            placeNewBet(formData, ws);
        }
    } catch (error) {
        logError(error, { gameName, function: 'requestPlaceBet'});
    }
}

async function placeNewBet(formData, ws) {
    try {        
      const response = await api.placeBet(formData, configuration.andarBaharGame.alias);
      if (response.status === "success") {
        updateBetSummary(response.data.bets);
        returnResponse(alias, ws, "betPlaced", true, {balance: response.data.balance, betLists: response.data.bets, betSummary,}, "Bet placed successfully!", false);
      } else {
        returnResponse(alias, ws, "betPlaced", false, response, "Bet placement failed", false);
      }
    } catch (error) {
      returnResponse(alias, ws, "betPlaced", false, { error }, "Bet placement failed",  false);
      logError(error, { gameName, function: 'placeNewBet'});
    }
}

function getWinRandomBets(onlySideBet = false, winDealtNo = null, totalDealts = null, winSide = null) {
    try {
        let randomWinBet = { betList: [], sideBetList: [], winAmount: 0 };
        if (configuration.andarBaharGame.enableRandomBet == true) {
            let totalRandomBet = randomBetLists.length;
            if (totalRandomBet) {
                randomBetLists.forEach(bet => {
                    if(onlySideBet) {
                        let resBet = getWinRandomSideBet(bet);
                        if(resBet) {
                            randomWinBet.sideBetList.push(resBet);
                            randomWinBet.winAmount = (parseFloat(resBet.win_amount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
                        }
                    } else {
                        if(bet.selections.includes(winSide) && bet.status == 1) {
                            bet.win_amount = (bet.bet_amount * bet.odds).toFixed(2);
                            bet.status = 2;
                            randomWinBet.betList.push(bet);
                            randomWinBet.winAmount = (parseFloat(bet.win_amount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
                        } else if(bet.selection_type != "" && bet.status == 1) {
                            let resBet = getWinRandomSideBet(bet, winDealtNo, totalDealts, winSide);
                            if(resBet) {
                                randomWinBet.sideBetList.push(resBet);
                                randomWinBet.winAmount = (parseFloat(resBet.win_amount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
                            }
                        }
                    }
                });
            }
        }
        return randomWinBet;
    } catch (error) {
        logError(error, { gameName, function: 'getWinRandomBets'});
    }
}

function getWinRandomSideBet(bet, winDealtNo, totalDealts, winSide) {
    try {
        if (bet.selection_type != "" && bet.status == 1) {
            let betWin = false;
            if(winDealtNo != null && totalDealts != null && winSide != null) {
                if(bet.selection_type == "Cards" && ((bet.selections == "20+" && winDealtNo > 20) || (bet.selections == winDealtNo))) {
                    betWin = true;
                }else if(bet.selection_type == "Super Bahar" && winSide == "Bahar" && bet.selections.includes(totalDealts)) {
                    betWin = true;
                }
            } else {
                if(bet.selection_type == "Suits" && bet.selections.includes(jokerCard.suits)) {
                    betWin = true;
                }else if(bet.selection_type == "Colors" && bet.selections.includes(jokerCard.color)) {
                    betWin = true;
                }else if(bet.selection_type == "Values" && ((bet.selections == "Any Number" && ["2", "3", "4", "5", "6", "7", "8"].includes(jokerCard.card_no)) || (bet.selections.includes(jokerCard.card_no)))) {
                    betWin = true;
                }else if(bet.selection_type == "Above Below" && ((bet.selections == "Above 8" && ["J", "Q", "K", "A"].includes(jokerCard.card_no)) || (bet.selections == "Below 8" && ["2", "3", "4", "5", "6", "7"].includes(jokerCard.card_no)) || (bet.selections.includes(jokerCard.card_no)))) {
                    betWin = true;
                }
            }
            if(betWin) {
                bet.win_amount = (bet.bet_amount * bet.odds).toFixed(2);
                bet.status = 2;
                return bet;
            } else {
                return false;
            }
        }
        return false;
    } catch (error) {
        logError(error, { gameName, function: 'getWinRandomSideBet'});
    }
}


function handleAndarBaharEvent(ws) {
    try {
        let initialData = {
            betLists: betLists,
            betSummary: betSummary,
            idlePhaseData: idlePhaseData,
            gameStatus: gameStatus,
            jokerCard,
            lastDealtCard,
            dealtCardNo,
            gameIsActive,
            winSide
        };
        returnResponse(alias, ws, "betLists", true, initialData, "Initial bet list", false);
        
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'placeBet' && bettingOpen) {
                requestPlaceBet(data, ws);
            }
        });
    } catch (error) {
        logError(error, { gameName, function: 'handleAndarBaharEvent'});
    }
}


module.exports = { handleAndarBaharEvent, startAndarBaharGameRound, updateAndarBaharGameStatus };
