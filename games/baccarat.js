"use strict";

const { configuration } = require("../configuration.js");
const { api } = require("../api.js");
const { generateBaccaratRandomBet, getRandomNumber } = require("../random_bet.js");
const { returnResponse } = require("../return_response.js");
const { logError } = require('../logger.js');

const alias = configuration.baccaratGame.alias;
const gameName = "Baccarat";
let gameIsActive = configuration.baccaratGame.status;
let gameRoundData = {};
let betLists = [];
let betSummary = { totalPlayers: 0, totalBetAmounts: 0, totalWinAmounts: 0 };
let bettingOpen = false;
let gameStatus = "";
let randomBetLists = [];
let randomBetInterval = null;
let idlePhaseData = {
  idlePhase: false,
  startTime: null,
  endTime: null,
  bettingPhaseTime: configuration.baccaratGame.bettingPhaseTime * 1000,
  nextRoundStartTime: configuration.baccaratGame.nextRoundStartTime * 1000,
  bettingPhaseEndTime: 0,
  bankerScore: "", 
  playerScore: "",
  result: "",
};
let dealtCards = [];

async function startBaccaratGameRound() {
  try {
    resetGameVariables();
    
    const roundData = await api.createNewRound(alias);
    if(roundData == 'error') {
      gameIsActive = false;
      gameStatus = "gameInactive";
      returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
      return;
    }

    gameRoundData = roundData;
    gameStatus = "bettingPhase";
    bettingOpen = true;

    returnResponse(alias, null, "bettingPhase", true, { betLists, betSummary }, "Betting phase started! Place your bets.", true);

    idlePhaseData.bettingPhaseEndTime = Date.now() + idlePhaseData.bettingPhaseTime;
    startRandomBetAdd();

    setTimeout(() => {
      clearInterval(randomBetInterval);
      bettingOpen = false;
      startGame();
    }, idlePhaseData.bettingPhaseTime);
  } catch (error) {
    logError(error, { gameName, function: 'startBaccaratGameRound' });
  }
}

function resetGameVariables() {
    betLists = [];
    betSummary = { totalPlayers: 0, totalBetAmounts: 0, totalWinAmounts: 0 };
    bettingOpen = false;
    randomBetLists = [];
    clearInterval(randomBetInterval);
    gameStatus = "";
    dealtCards = [];
    idlePhaseData.bankerScore = ""; 
    idlePhaseData.playerScore = "";
    idlePhaseData.result = "";
}

async function startGame() {
  try {
    gameStatus = "gameStart";

    const data = await api.getBaccaratWinSide(gameRoundData.id);
    idlePhaseData.bankerScore = data.banker?.score; 
    idlePhaseData.playerScore = data.player?.score;

    returnResponse(alias, null, "gameStart", true, { bankerScore: data.banker?.score, playerScore: data.player?.score }, "Game has started!", true);

    gameStatus = "dealtCard";
    startToDealt(data);
  } catch (error) {
    logError(error, { gameName, function: 'startGame' });
  }
}

function startToDealt(data) {
  try {
    let dealtCardNo = 1;
    let totalDealtThirdCard = getTotalDealtWithThirdDealt(data);
    let totalDealt = totalDealtThirdCard.totalDealt;
    let thirdDealts = totalDealtThirdCard.thirdDealts;
    
    let dealtInterval = setInterval(async () => {
      let dealtData = null;
      if(dealtCardNo > 4 && totalDealt > 4) {
        let dealt = thirdDealts[dealtCardNo];
        dealtData = {
          dealtSide: dealt.dealtSide,
          cardName: dealt.cardName 
        }
      } else {
        let dealtSide = getdealtSide(dealtCardNo);
        dealtData = {
          dealtSide,
          cardName: data[dealtSide]['cards'][getCardIndex(dealtCardNo)] 
        }
      }    
      dealtCards.push(dealtData);
      dealtCardNo++;
      returnResponse( alias, null, "dealtCard", true, {dealtData}, "Card dealt successfully!", true );
      
      if(dealtCardNo > totalDealt) {
        clearInterval(dealtInterval);
        endGame(data.winSide, data.pairSide);
      }
    }, 1000);
  } catch (error) {
    logError(error, { gameName, function: 'startToDealt' });
  }
}

function getTotalDealtWithThirdDealt(data) {
  try {
    let totalDealt = 4;
    let thirdDealts = {
      "5": {},
      "6": {},
    }
    if(data.thirdCardBy == "Player") {
      thirdDealts["5"].cardName = data['player']['cards'][2];
      thirdDealts["5"].dealtSide = "player";
      totalDealt = 5;
      if(data['banker']['cards'][2] != undefined && data['banker']['cards'][2] != null) {
        totalDealt = 6;
        thirdDealts["6"].cardName = data['banker']['cards'][2];
        thirdDealts["6"].dealtSide = "banker";
      }
    } else if(data.thirdCardBy == "Banker") {
      thirdDealts["5"].cardName = data['banker']['cards'][2];
      thirdDealts["5"].dealtSide = "banker";
      totalDealt = 5;
      if(data['player']['cards'][2] != undefined && data['player']['cards'][2] != null) {
        totalDealt = 6;
        thirdDealts["6"].cardName = data['player']['cards'][2];
        thirdDealts["6"].dealtSide = "player";
      }
    }
    return { totalDealt, thirdDealts };
  } catch (error) {
    logError(error, { gameName, function: 'getTotalDealtWithThirdDealt' });
  }
}

function getCardIndex(dealtCardNo) {
  return Math.floor((dealtCardNo - 1) / 2);
}


async function endGame(winSide, pairSide) {
  try {
    let randomWinBet = getWinRandomBets(winSide, pairSide);

    const response = await api.getBaccaratWinResult(gameRoundData.id, winSide, pairSide);
    idlePhaseData.result = response.result; 
    gameStatus = "gameEnd";
    if (randomWinBet.betList.length > 0) {
      response.winBetLists = response.winBetLists.concat(randomWinBet.betList);
    }
    betSummary.totalWinAmounts = (parseFloat(response.totalWinAmount) + parseFloat(randomWinBet.winAmount)).toFixed(2);
    response.betSummary = betSummary;
    returnResponse(alias, null, "gameEnd", true, response, "The game has ended! Result has been declared!", true);
    idlePhase();
  } catch (error) {
    logError(error, { gameName, function: 'endGame' });
  }
}

function getdealtSide(dealtCardNo) {
  if (dealtCardNo % 2 === 0) {
    return "banker"; 
  } else {
    return "player"; 
  }
}

function idlePhase() {
  gameStatus = "idlePhase";
  idlePhaseData = {
    ...idlePhaseData,
    idlePhase: true,
    startTime: new Date(),
    endTime: Date.now() + idlePhaseData.nextRoundStartTime,
  };

  returnResponse( alias, null, "idlePhase", true, { idlePhaseData, gameStatus, }, `${idlePhaseData.nextRoundStartTime}-second cooldown before next round.`, true );
  setTimeout(() => {
      if (gameIsActive) { 
        startBaccaratGameRound();
      } else {
          gameStatus = "gameInactive";
          
          returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
      }
  }, idlePhaseData.nextRoundStartTime);
}


function updateBaccaratGameStatus(status, isUpdateConfiguration = false) {
  try {
    gameIsActive = status;
    if(gameIsActive == true && gameStatus == "gameInactive") {
      startBaccaratGameRound();
    }
  
    if(isUpdateConfiguration == true) {
      idlePhaseData = {
        bettingPhaseTime: configuration.baccaratGame.bettingPhaseTime * 1000,
        nextRoundStartTime: configuration.baccaratGame.nextRoundStartTime * 1000 + 2000,
      };
      returnResponse(alias, null, "updateConfiguration", true, {idlePhaseData}, "Game configuration has been updated.", true);
    }
  } catch (error) {
    logError(error, { gameName, function: 'updateBaccaratGameStatus' });
    
  }
}


function startRandomBetAdd() {
  try {
    if (configuration.baccaratGame.enableRandomBet == true) {
      setTimeout(() => {
        let numberOfTotalRandomBet = getRandomNumber(500, 3000);
        let perSecondBets = numberOfTotalRandomBet / configuration.baccaratGame.bettingPhaseTime;
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
      let bet = generateBaccaratRandomBet();
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
    betList.forEach((bet) => {
      betLists.push(bet);
      betSummary.totalBetAmounts = (
        parseFloat(betSummary.totalBetAmounts) + parseFloat(bet.bet_amount)
      ).toFixed(2);
    });
    (isRandomBet) ? (betSummary.totalPlayers = parseInt(betSummary.totalPlayers) + parseInt(betList.length)) : betSummary.totalPlayers++;
    returnResponse( alias, null, "updateBets", true, { betList, betSummary }, "New bet added.", true );
  } catch (error) {
    logError(error, { gameName, function: 'updateBetSummary' });
  }
}

function requestPlaceBet(data, ws) {
  try {
    let { betAmount, userId, selections } = data;
    let errorMessages = [];
    if (!userId) errorMessages.push("User ID is required!");

    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      errorMessages.push("Selection is required!");
    }

    if (betAmount.length !== selections.length) {
      errorMessages.push("Mismatch in selected bets.");
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
      returnResponse( alias, ws, "validationError", false, { errorMessages }, "Validation error", false );
    } else {
      placeNewBet(
        {
          user_id: userId,
          game_round_id: gameRoundData.id,
          bet_amount: betAmount,
          selections,
        },
        ws
      );
    }
  } catch (error) {
    logError(error, { gameName, function: 'requestPlaceBet' });
  }
}

async function placeNewBet(formData, ws) {
  try {
    const response = await api.placeBet(formData, alias);
    if (response.status === "success") {
      updateBetSummary(response.data.bets);
      returnResponse( alias, ws, "betPlaced",  true, 
        {
          balance: response.data.balance,
          betLists: response.data.bets,
          betSummary,
        }, 
        "Bet placed successfully.", false );
    } else {
      returnResponse( alias, ws, "betPlaced", false, response, "Failed to place bet", false );
    }
  } catch (err) {
    returnResponse( alias, ws, "betPlaced", false, { error: err }, "Bet placement failed", false );
    logError(err, { gameName, function: 'placeNewBet' });
  }
}

function getWinRandomBets(winSide, pairSide) {
  try {
    let data = { betList: [], winAmount: 0 };
    if (configuration.baccaratGame.enableRandomBet == true) {
      randomBetLists.forEach((bet) => {
        if (bet.selections.includes(winSide) || bet.selections.includes(pairSide)) {
          bet.win_amount = (bet.bet_amount * bet.odds).toFixed(2);
          bet.status = 2;
          data.betList.push(bet);
          data.winAmount = (
            parseFloat(data.winAmount) + parseFloat(bet.win_amount)
          ).toFixed(2);
        }
      });
    }
    return data;
  } catch (error) {
    logError(error, { gameName, function: 'getWinRandomBets' });
  }
}

function handleBaccaratEvent(ws) {
  try {
    let initData = {
      betLists,
      betSummary,
      idlePhaseData,
      gameStatus,
      dealtCards,
      gameIsActive,
    };

    returnResponse( alias, ws, "betLists", true, initData, "Initial data", false );

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      if (data.type === "placeBet" && bettingOpen) {
        requestPlaceBet(data, ws);
      }
    });
  } catch (error) {
    logError(error, { gameName, function: 'handleBaccaratEvent' });
  }
}

module.exports = {
  handleBaccaratEvent,
  startBaccaratGameRound,
  updateBaccaratGameStatus
};
