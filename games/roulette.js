"use strict";

const { configuration } = require("../configuration.js");
const { api } = require("../api.js");
const { generateRouletteRandomBet, getRandomNumber } = require("../random_bet.js");
const { returnResponse } = require("../return_response.js");
const { logError } = require('../logger.js');

const alias = configuration.rouletteWheelGame.alias;
const gameName = "Rocket Crash";
let gameIsActive = configuration.rouletteWheelGame.status;
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
    bettingPhaseTime: configuration.rouletteWheelGame.bettingPhaseTime * 1000,
    nextRoundStartTime: (configuration.rouletteWheelGame.nextRoundStartTime * 1000) + 2000,
    bettingPhaseEndTime: 0,
    bettingIdlePhaseEndTime: 0,
};
let winningNumber = null;


async function startRouletteGameRound() {
    try {
        resetGameVariables();
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

        returnResponse(alias, null, "bettingPhase", true, { betLists, betSummary }, "Betting phase started! Place your bets.", true );
        idlePhaseData.bettingPhaseEndTime = Date.now() + idlePhaseData.bettingPhaseTime;

        startRandomBetAdd();

        setTimeout(() => {
            clearInterval(randomBetInterval);
            bettingOpen = false;
            gameStatus = "gameStart";
            startGame();
        }, idlePhaseData.bettingPhaseTime);
    } catch (error) {
        logError(error, { gameName, function: 'startRouletteGameRound' });
    }
}

function resetGameVariables() {
    betLists = [];
    gameRoundData = {};
    betSummary = { totalPlayers: 0, totalBetAmounts: 0, totalWinAmounts: 0 };
    gameStatus = "";
    idlePhaseData.bettingPhaseEndTime = 0;
    idlePhaseData.bettingIdlePhaseEndTime = 0;
    randomBetLists = [];
    clearInterval(randomBetInterval);
}

async function startGame() {
    try {
        winningNumber = null;
        const winResponse = await api.getRouletteGameWinningNumber(gameRoundData.id);
        
        if (winResponse.status === "success") {
            winningNumber = winResponse.winningNumber;
            returnResponse(alias, null, "gameStart", true, { winningNumber }, "Game has started! Waiting for result", true);
            
            setTimeout(async () => {
                try {
                    const response = await api.getRouletteGameResult(gameRoundData.id, winningNumber);
                
                    if (response.status === "success") {
                        let randomWinBet = getWinRandomBets(winningNumber);
                        if (randomWinBet.betList.length > 0) {
                            response.winBetLists = response.winBetLists.concat(randomWinBet.betList);
                        }
                        betSummary.totalWinAmounts = (parseFloat(response.totalWinAmount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
                        response.betSummary = betSummary;
                        returnResponse(alias, null, "gameEnd", true, response, "The game has ended! Result has been declared!", true);
                        idlePhase();
                        winningNumber = null;
                    }
                } catch (error) {
                    logError(error, { gameName, function: 'startGame' });
                }
            }, 7000);
        }
    } catch (error) {
        logError(error, { gameName, function: 'startGame' });
    }
}

function idlePhase() {
    let nextRoundStartTime = idlePhaseData.nextRoundStartTime;
    gameStatus = "idlePhase";
    idlePhaseData = { ...idlePhaseData, idlePhase: true, startTime: new Date(), endTime: Date.now() + nextRoundStartTime};

    returnResponse(alias, null, "idlePhase", true, { idlePhaseData, gameStatus }, `${nextRoundStartTime}-second cooldown before the next round.`, true);

    setTimeout(() => {
        if (gameIsActive) { 
            startRouletteGameRound();
        } else {
        gameStatus = "gameInactive";
            
        returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
        }
    }, nextRoundStartTime);
}

function updateRouletteGameStatus(status, isUpdateConfiguration = false) {
    try {
        gameIsActive = status;
        if(gameIsActive == true && gameStatus == "gameInactive") {
            startRouletteGameRound();
        }
        if(isUpdateConfiguration == true) {
            idlePhaseData = {
                bettingPhaseTime: configuration.rouletteWheelGame.bettingPhaseTime * 1000,
                nextRoundStartTime: (configuration.rouletteWheelGame.nextRoundStartTime * 1000) + 2000,
            };
            returnResponse(alias, null, "updateConfiguration", true, {idlePhaseData}, "Game configuration has been updated.", true);
        }
    } catch (error) {
        logError(error, { gameName, function: 'updateRouletteGameStatus' });
        
    }
}

function startRandomBetAdd() {
    try {
        if (configuration.rouletteWheelGame.enableRandomBet == true) {
            setTimeout(() => {
                let numberOfTotalRandomBet = getRandomNumber(500, 3000);
                let perSecondBets = numberOfTotalRandomBet / configuration.rouletteWheelGame.bettingPhaseTime;
                if(perSecondBets < 1) {
                    perSecondBets = numberOfTotalRandomBet / 20
                }
                randomBetInterval = setInterval(() => {
                    if (randomBetLists.length >= numberOfTotalRandomBet) {
                        clearInterval(randomBetInterval);
                    } else {
                        addRandomBet(perSecondBets);
                    }
                }, 500);
            }, 1000);
        }
    } catch (error) {
        logError(error, { gameName, function: 'startRandomBetAdd' });
    }
}

function addRandomBet(totalRandomBet) {
    try {
        let bets = [];
        totalRandomBet -= getRandomNumber(1, 20); 
        for (let i = 0; i < totalRandomBet; i++) {
            let bet = generateRouletteRandomBet();
            randomBetLists.push(bet);
            bets.push(bet);
        }
        updateBetSummary(bets, true);
    } catch (error) {
        logError(error, { gameName, function: 'addRandomBet' });
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
        logError(error, { gameName, function: 'updateBetSummary' });
    }
  }

function requestPlaceBet(data, ws) {
    try {
        let betAmount = data.betAmount;
        let userId = data.userId;
        let cardType = data.cardType;
        let cardNumber = data.cardNumber;
        let errorMessages = [];
        if (!userId) errorMessages.push("User ID is required!");

        if (cardNumber == [] || cardNumber == '') errorMessages.push("Card selection is required!");

        if (betAmount.length !== cardType.length || cardType.length !== cardNumber.length || cardNumber.length !== betAmount.length) {
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
                selection_type: cardType,
                selections: cardNumber,
            };
            placeNewBet(formData, ws);
        }
    } catch (error) {
        logError(error, { gameName, function: 'requestPlaceBet' });
    }
}

async function placeNewBet(formData, ws) {
    try {
      const response = await api.placeBet(formData, configuration.rouletteWheelGame.alias);
      if (response.status === "success") {
        updateBetSummary(response.data.bets);
        returnResponse(alias, ws, "betPlaced", true, {balance: response.data.balance, betLists: response.data.bets, betSummary,}, "Bet placed successfully!", false);
      } else {
        returnResponse(alias, ws, "betPlaced", false, response, "Bet placement failed", false);
      }
    } catch (error) {
      returnResponse(alias, ws, "betPlaced", false, { error }, "Bet placement failed",  false);
      logError(error, { gameName, function: 'betPlaced' });
    }
}

function getWinRandomBets(winningNumber) {
    try {
        let randomWinBet = { betList: [], winAmount: 0 };
        if (configuration.rouletteWheelGame.enableRandomBet == true) {
            let totalRandomBet = randomBetLists.length;
            if (totalRandomBet) {
                randomBetLists.forEach(bet => {
                    if (bet.selections.includes(winningNumber)) {
                        bet.win_amount = (bet.bet_amount * bet.odds).toFixed(2);
                        bet.status = 2;
                        randomWinBet.betList.push(bet);
                        randomWinBet.winAmount = (parseFloat(bet.win_amount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
                    }
                });
            }
        }
        return randomWinBet;
    } catch (error) {
        logError(error, { gameName, function: 'getWinRandomBets' });
    }
}


function handleRouletteEvent(ws) {
    try {
        let initialData = {
        betLists,
        betSummary,
        idlePhaseData,
        gameStatus,
        winningNumber,
        gameIsActive
        };
        returnResponse(alias, ws, "betLists", true, initialData, "Initial bet list", false);
        
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'placeBet' && bettingOpen) {
                requestPlaceBet(data, ws);
            }
        });
    } catch (error) {
        logError(error, { gameName, function: 'handleRouletteEvent' });
    }
}


module.exports = { handleRouletteEvent, startRouletteGameRound, updateRouletteGameStatus };
