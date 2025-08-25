"use strict";

const { configuration } = require("./configuration.js");
const { encryptData } = require("./encryption.js");
const axios = require("axios");
const apiBaseUrl = configuration.apiUrl.replace(/\/+$/, "") + "/api/";

function retryRequest(requestFn, delay = 5000) {
  return new Promise((resolve, reject) => {
    requestFn()
      .then(resolve)
      .catch((error) => {
        setTimeout(() => {
          retryRequest(requestFn, delay).then(resolve).catch(reject);
        }, delay);
      });
  });
}


// new game round crate api
async function createNewRound (alias) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/round/create", {
      alias,
    });
    if (response.data.status === "success" && response.data.data.gameRound) {
      return response.data.data.gameRound;
    } else {
      return response.data.status;
    }
  });
}


// bet placement api
async function placeBet(formData, gameType) {
  try {
    let response = null;
    // Encrypt id and user_id before sending
    const encryptedFormData = {
      ...formData,
      game_round_id: encryptData(formData.game_round_id),
      user_id: encryptData(formData.user_id),
    };
    if(gameType == configuration.rocketCrashGame.alias) {
      response = await axios.post(apiBaseUrl + "game/rocket/bet/store", encryptedFormData);
    } else if(gameType == configuration.rouletteWheelGame.alias) {
      response = await axios.post(apiBaseUrl + "game/roulette/bet/store", encryptedFormData);
    } else if(gameType == configuration.andarBaharGame.alias) {
      response = await axios.post(apiBaseUrl + "game/andar/bahar/bet/store", encryptedFormData);
    } else if(gameType == configuration.baccaratGame.alias) {
      response = await axios.post(apiBaseUrl + "game/baccarat/bet/store", encryptedFormData);
    }
    return response.data;
  } catch (error) {
    return error;
  }
}


// rocket crash game api start here
function getRocketCrashMultiplier(id) {
  return retryRequest(async () => {
    const response = await axios.post(
      apiBaseUrl + "game/rocket/crash/multiplier",
      { 
        id: encryptData(id)
      }
    );
    if (response.data.status === "success") {
      return {
        status: "success",
        crashMultiplier: response.data.data.crashMultiplier,
      };
    }
  });
}

async function cashOut(user_id, id, odds) {
  try {
    const response = await axios.post(
      apiBaseUrl + "game/rocket/bet/cashout",
      { 
        user_id: encryptData(user_id), 
        id: encryptData(id), 
        odds },
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    return error;
  }
}

function endRocketCrashGameRound(id, crash_multiplier) {
  return retryRequest(async () => {
    const response = await axios.post(
      apiBaseUrl + "game/rocket/crash/end/round",
      { 
        id: encryptData(id), 
        crash_multiplier 
      }
    );
    if (response.data.status === "success") {
      return {
        lostBetIds: response.data.data.lostBetIds,
        totalBetAmount: response.data.data.totalBetAmount,
        totalWinAmount: response.data.data.totalWinAmount,
      };
    }
  });
}
// rocket crash game api end here


// roulette game api start here
function getRouletteGameWinningNumber(id) {
  return retryRequest(async () => {
    const response = await axios.post(
      apiBaseUrl + "game/roulette/winning/number",
      { 
        id: encryptData(id),
      }
    );
    if (response.data.status === "success") {
      return {
        status: "success",
        winningNumber: response.data.data.winningNumber,
      };
    }
  });
}

function getRouletteGameResult(id, winningNumber) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/roulette/result", {
      id: encryptData(id),
      winning_number: winningNumber,
    });
    if (response.data.status === "success") {
      return {
        status: "success",
        winningNumber: response.data.data.winningNumber,
        totalBetAmount: response.data.data.totalBetAmount,
        totalWinAmount: response.data.data.totalWinAmount,
        winBetLists: response.data.data.winBetLists,
      };
    }
  });
}
// roulette game api end here


// andar bahar game api start here
function getAndarBaharJokerCard(id) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/andar/bahar/joker", {
      id: encryptData(id),
    });
    if (response.data.status === "success") {
      return {
        jokerCard: response.data.data.jokerCard,
        totalDealts: response.data.data.totalDealts,
        totalDealtCards: response.data.data.totalDealtCards,
        winSideBetLists: response.data.data.winSideBetLists,
        totalWinAmount: response.data.data.totalWinAmount,
        winSide: response.data.data.winSide,
      };
    }
  });
}


function getAndarBaharWinSide(id) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/andar/bahar/win/side", {
      id: encryptData(id),
    });
    if (response.data.status === "success") {
      return {
        winSide: response.data.data.winSide
      };
    }
  });
}

function getAndarBaharWinResult(id, jokerCard, winSide, winDealtNo, totalDealts) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/andar/bahar/result", {
      id: encryptData(id),
      win_side: winSide,
      win_dealt_no: winDealtNo,
      total_dealt: totalDealts,
      ...jokerCard
    });    
    if (response.data.status === "success") {
      return {
        winBetLists: response.data.data.winBetLists,
        winSideBetLists: response.data.data.winSideBetLists,
        totalWinAmount: response.data.data.totalWinAmount,
        result: response.data.data.result
      };
    }
  });
}
// andar bahar game api end here


// bacarrat game api start here
function getBaccaratWinSide(id) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/baccarat/win/side", {
      id: encryptData(id),
    });
    if (response.data.status === "success") {
      return {
        player: response.data.data.player,
        banker: response.data.data.banker,
        winSide: response.data.data.winSide,
        thirdCardBy: response.data.data.thirdCardBy,
        pairSide: response.data.data.pairSide,
      };
    }
  });
}


function getBaccaratWinResult(id, winSide, pairSide) {
  return retryRequest(async () => {
    const response = await axios.post(apiBaseUrl + "game/baccarat/result", {
      id: encryptData(id),
      win_side: winSide,
      pair_side: pairSide,
    });    
    if (response.data.status === "success") {
      return {
        winBetLists: response.data.data.winBetLists,
        totalWinAmount: response.data.data.totalWinAmount,
        result: response.data.data.result
      };
    }
  });
}
// bacarrat game api end here


module.exports = {
  api: {
    createNewRound,
    endRocketCrashGameRound,
    getRocketCrashMultiplier,
    getRouletteGameWinningNumber,
    getRouletteGameResult,
    placeBet,
    cashOut,
    getAndarBaharJokerCard,
    getAndarBaharWinSide,
    getAndarBaharWinResult,
    getBaccaratWinSide,
    getBaccaratWinResult
  },
};
