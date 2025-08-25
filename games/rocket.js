"use strict";

  const { configuration } = require("../configuration.js");
  const { api } = require("../api.js");
  const { generateRocketCrashRandomBet, getRandomNumber } = require("../random_bet.js");
  const { returnResponse } = require("../return_response.js");
  const { logError } = require('../logger.js');

  const alias = configuration.rocketCrashGame.alias;
  const gameName = "Rocket Crash";
  let gameIsActive = configuration.rocketCrashGame.status;
  let gameRoundData = {};
  let betLists = [];
  let betSummary = {
    totalPlayers: 0,
    totalBetAmounts: 0,
    totalWinAmounts: 0,
  };
  let bettingOpen = true;
  let gameActive = false;
  let gameStatus = "";
  let randomBetIds = [];
  let randomBetInterval = null;
  let multiplier = 1.0;
  let crashMultiplier = null;
  let randomBetCashoutInterval = null;
  let idlePhaseData = {
    idlePhase: false,
    startTime: null,
    endTime: null,
    idlePhaseTime: configuration.rocketCrashGame.idlePhaseTime * 1000,
    bettingPhaseTime: configuration.rocketCrashGame.bettingPhaseTime * 1000,
    nextRoundStartTime: configuration.rocketCrashGame.nextRoundStartTime * 1000,
    bettingPhaseEndTime: 0,
  };

  async function startRocketGameRound() {
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

      returnResponse(alias, null, "bettingPhase", true, { betLists, betSummary }, "Betting phase started! Place your bets.", true);
      idlePhaseData.bettingPhaseEndTime = Date.now() + idlePhaseData.bettingPhaseTime;

      startRandomBetAdd();
      
      setTimeout(() => {
        clearInterval(randomBetInterval);
        bettingOpen = false;
        gameStatus = "bettingPhaseOver";
        returnResponse(alias, null, "bettingPhaseOver", true, {}, "Wating for rocket launch!", true);

        setTimeout(() => {
          startGame();
        }, idlePhaseData.idlePhaseTime);

      }, idlePhaseData.bettingPhaseTime);
    } catch (error) {
      logError(error, { gameName, function: 'startRocketGameRound' });
    }
  }

  function resetGameVariables() {
    betLists = [];
    gameRoundData = {};
    betSummary = { totalPlayers: 0, totalBetAmounts: 0, totalWinAmounts: 0 };
    gameActive = false;
    gameStatus = "";
    idlePhaseData.bettingPhaseEndTime = 0;
    randomBetIds = [];
    clearInterval(randomBetInterval);
  }

  async function startGame() {
    try {
      gameActive = true;
      multiplier = 1.0;
      crashMultiplier = null;
      const response = await api.getRocketCrashMultiplier(gameRoundData.id);

      if (response.status === "success") {
        gameStatus = "gameStart";
        crashMultiplier = response.crashMultiplier;
        returnResponse(alias, null, "gameStart", true, {}, `Rocket launched! Crash point unknown...`, true );

        let intervalTime = 200;

        const updateMultiplier = async () => {
          multiplier = (parseFloat(multiplier) + 0.01).toFixed(2);
          returnResponse(alias, null, "multiplier", true, { multiplier: multiplier }, `Current multiplier is ${multiplier}`, true );

          if (multiplier >= crashMultiplier) {
            gameActive = false;
            clearInterval(interval);
            clearInterval(randomBetCashoutInterval);
            let data = {
              crashMultiplier: crashMultiplier,
              betSummary: betSummary,
            };
            returnResponse(alias, null, "gameEnd", true,  data, "Boom! Rocket crashed!", true);
            await api.endRocketCrashGameRound(gameRoundData.id, crashMultiplier);
            idlePhase();
          } else {
            intervalTime = Math.max(10, intervalTime - 7);
            clearInterval(interval);
            interval = setInterval(updateMultiplier, intervalTime);
          }
        };

        let interval = setInterval(updateMultiplier, intervalTime);

        // random bet cashout
        cashoutRandomBets();
      }
    } catch (error) {
      logError(error, { gameName, function: 'startGame' });
    }
  }

  function idlePhase() {
    let nextRoundStartTime = idlePhaseData.nextRoundStartTime;
    gameStatus = "idlePhase";
    idlePhaseData = { ...idlePhaseData, idlePhase: true, startTime: new Date(), endTime: Date.now() + nextRoundStartTime};
    returnResponse(alias, null, "idlePhase", true, { idlePhaseData, gameStatus }, `${idlePhaseData.nextRoundStartTime}-second cooldown before the next round.`, true);

    setTimeout(() => {
      if (gameIsActive) { 
        startRocketGameRound();
      } else {
        gameStatus = "gameInactive";
          
        returnResponse(alias, null, "gameInactive", true, {}, "The game is currently inactive. Please wait for it to start.", true );
      }
    }, nextRoundStartTime);
  }

  function updateRocketGameStatus(status, isUpdateConfiguration = false) {
    try { 
      gameIsActive = status;
      if(gameIsActive == true && gameStatus == "gameInactive") {
        startRocketGameRound();
      }
      if(isUpdateConfiguration == true) {
        idlePhaseData = {
          idlePhaseTime: configuration.rocketCrashGame.idlePhaseTime * 1000,
          bettingPhaseTime: configuration.rocketCrashGame.bettingPhaseTime * 1000,
          nextRoundStartTime: configuration.rocketCrashGame.nextRoundStartTime * 1000,
        };
        returnResponse(alias, null, "updateConfiguration", true, {idlePhaseData}, "Game configuration has been updated.", true);
      }
    } catch (error) {
      logError(error, { gameName, function: 'updateRocketGameStatus' });
      
    }
  }


  function cashoutRandomBets() {
    try {
      if (configuration.rocketCrashGame.enableRandomBet == true) {
        let intervalTime = 300;
        randomBetCashoutInterval = setInterval(() => {
          if (gameActive) {
            addRandomCashout();
            intervalTime = Math.max(100, intervalTime - 20);
            clearInterval(randomBetCashoutInterval);
            randomBetCashoutInterval = setInterval(() => {
              if (gameActive) {
                addRandomCashout();
              } else {
                clearInterval(randomBetCashoutInterval);
              }
            }, intervalTime);
          } else {
            clearInterval(randomBetCashoutInterval);
          }
        }, intervalTime);
      }
    } catch (error) {
      logError(error, { gameName, function: 'cashoutRandomBets' });
    }
  }

  function addRandomCashout() {
    try {
      let randomBetId = randomBetIds[getRandomNumber(1, randomBetIds.length)];
      let betData = betLists.find(betli => betli.id == randomBetId);
      if(betData != "" && betData && gameActive) {
        betData.odds = parseFloat(multiplier).toFixed(2);;
        betData.win_amount = Math.round(betData.bet_amount * betData.odds);
        betData.status = 2;
        cashOutSuccessfulMsg(betData);
      }
    } catch (error) {
      logError(error, { gameName, function: 'addRandomCashout' });
    }
  }

  async function placeNewBet(formData, ws) {
    try {
      const response = await api.placeBet(formData, configuration.rocketCrashGame.alias);
      if (response.status === "success") {
        updateBetSummary(response.data.bet);
        returnResponse(alias, ws, "betPlaced", true, {balance: response.data.balance,betList: response.data.bet, betSummary,}, "Bet placed successfully!", false);
      } else {
        returnResponse(alias, ws, "betPlaced", false, response, "Bet placement failed", false );
      }
    } catch (error) {
      returnResponse(alias, ws, "betPlaced", false, { error }, "Bet placement failed",  false );
      logError(error, { gameName, function: 'placeNewBet' });
    }
  }

  function updateRandomBetSummary(betList, totalBet, betAmount) {
    try {
      betLists = betLists.concat(betList);
      betSummary.totalPlayers = parseInt(betSummary.totalPlayers) + parseInt(totalBet);
      betSummary.totalBetAmounts = (parseFloat(betSummary.totalBetAmounts) + parseFloat(betAmount)).toFixed(2);
      returnResponse(alias, null, "updateRBets", true, { betList, betSummary }, "New bet has been added successfully.", true);
    } catch (error) {
      logError(error, { gameName, function: 'updateRandomBetSummary' });
    }
  }


  function updateBetSummary(betList) {
    try {
      betLists.push(betList);
      betSummary.totalPlayers++;
      betSummary.totalBetAmounts = (parseFloat(betSummary.totalBetAmounts) + parseFloat(betList.bet_amount)).toFixed(2);
      returnResponse(alias, null, "updateBets", true, { betList, betSummary }, "New bet has been added successfully.", true);
    } catch (error) {
      logError(error, { gameName, function: 'updateBetSummary' });
    }
  }

  function startRandomBetAdd() {
    try {
      if (configuration.rocketCrashGame.enableRandomBet == true) {
        setTimeout(() => {
          let numberOfTotalRandomBet = getRandomNumber(500, 3000);
          let perSecondBets = numberOfTotalRandomBet / configuration.rocketCrashGame.bettingPhaseTime;
          if(perSecondBets < 1) {
            perSecondBets = numberOfTotalRandomBet / 20
          }
          randomBetInterval = setInterval(() => {
            if (randomBetIds.length >= numberOfTotalRandomBet) {
              clearInterval(randomBetInterval);
            } else {
              addRandomBet(perSecondBets);
            }
          }, 500);
        }, 2000);
      }
    } catch (error) {
      logError(error, { gameName, function: 'startRandomBetAdd' });
    }
  }

  function addRandomBet(totalRandomBet) {
    try {
      let bets = [];
      let betAmount = 0;
      totalRandomBet -= getRandomNumber(1, 20); 
      for (let i = 0; i < totalRandomBet; i++) {
        let bet = generateRocketCrashRandomBet();
        randomBetIds.push(bet.id);
        bets.push(bet);
        betAmount = parseFloat(bet.bet_amount) + parseFloat(betAmount);
      }
      updateRandomBetSummary(bets, totalRandomBet, betAmount);
    } catch (error) {
      logError(error, { gameName, function: 'addRandomBet' });
    }
  }


  function requestPlaceBet(data, ws) {
    try {
      let betAmount = parseInt(data.betAmount);
      let userId = data.userId;
      let errorMessages = [];
      if(betAmount == 0 || betAmount == '' || betAmount == undefined) {
        errorMessages.push('Bet amount is required!');
      } else if(parseInt(betAmount) > parseInt(gameRoundData.max_bet_amount)) {
        errorMessages.push(`Bet amount exceeds the maximum allowed of ${parseInt(gameRoundData.max_bet_amount)}!`);
      } else if(parseInt(betAmount) < parseInt(gameRoundData.min_bet_amount)) {
        errorMessages.push(`Bet amount is less than the minimum allowed of ${parseInt(gameRoundData.min_bet_amount)}!`);
      }
      if(userId == '' || userId == undefined) {
        errorMessages.push('User ID is required!');
      }      
      if(errorMessages.length > 0) {        
        returnResponse(alias, ws, "validationError", false, { errorMessages }, "Validation error", false);
      } else {
        let formData = {
          user_id: userId,
          bet_amount: betAmount,
          game_round_id: gameRoundData.id,
        }
        placeNewBet(formData, ws);
      }
    } catch (error) {
      logError(error, { gameName, function: 'requestPlaceBet' });
    }
  }

  function cashOutSuccessfulMsg(bet) {
    try {
      betSummary.totalWinAmounts = (parseFloat(betSummary.totalWinAmounts) + parseFloat(bet.win_amount)).toFixed(2);
      let data = {
        betList : bet,
        betSummary: betSummary
      }
      returnResponse(alias, null, "cashOutSuccessful", true, data, "Cash out successful!", true);
    } catch (error) {
      logError(error, { gameName, function: 'cashOutSuccessfulMsg' });
    }
  }

  async function cashOut(betData, userId, betId, multiplier, ws) {
    try {
        // Call the API to cash out the bet
        const response = await api.cashOut(userId, betId, multiplier);

        if (response.status === 'success') {
          betData.odds = response.data.bet.odds;
          betData.win_amount = parseFloat(response.data.bet.win_amount).toFixed(2);
          betData.status = response.data.bet.status;
          betData.balance = response.data.bet.balance;
          cashOutSuccessfulMsg(betData);
        } else {
            returnResponse(alias, ws, "cashOutFail", false, response, "Cash out fail!", false);
        }
    } catch (error) {
        returnResponse(alias, ws, "cashOutFail", false, {}, error.message, false);
        logError(error, { gameName, function: 'cashOut' });
    }
  }

  function handleRocketEvent(ws) {
    try {
      let initialData = {
        betLists,
        betSummary,
        gameActive,
        idlePhaseData,
        gameStatus,
        multiplier,
        gameIsActive
      };
      returnResponse(alias, ws, "betLists", true, initialData, "Initial bet list", false);
      
      ws.on('message', (message) => {
          const data = JSON.parse(message);
          if (data.type === 'placeBet' && bettingOpen) {
              requestPlaceBet(data, ws);
          }

          if (data.type === 'cashOut' && gameActive) {
              let betData = betLists.find(bet => bet.id == data.betList.id);
              if (betData) {
                cashOut(betData, data.userId, data.betList.id, multiplier, ws);
              } else {
                returnResponse(alias, ws, "cashOutFail", false, {}, "Cash out failed! Bet not found.", false);
              }
          }
      });
    } catch (error) {
      logError(error, { gameName, function: 'handleRocketEvent' });
    }
  }

  module.exports = { handleRocketEvent, startRocketGameRound, updateRocketGameStatus };
