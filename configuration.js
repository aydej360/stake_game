"use strict";

const { logError } = require('./logger.js');

const configuration = {
  rocketCrashGame: {
    alias: "rocketCrashGame",
    status: true,
    bettingPhaseTime: 15, // seconds
    idlePhaseTime: 3, // seconds
    nextRoundStartTime: 5, // seconds
    enableRandomBet: true // true or false
  },
  rouletteWheelGame: {
    alias: "rouletteWheelGame",
    status: true,
    bettingPhaseTime: 15, // seconds
    nextRoundStartTime: 7, // seconds
    enableRandomBet: true // true or false
  },
  andarBaharGame: {
    alias: "andarBaharGame",
    status: true,
    bettingPhaseTime: 15, // seconds
    secondBetPhaseTime: 15, // seconds
    nextRoundStartTime: 7, // seconds
    enableRandomBet: true // true or false
  },
  baccaratGame: {
    alias: "baccaratGame",
    status: true,
    bettingPhaseTime: 15, // seconds
    nextRoundStartTime: 7, // seconds
    enableRandomBet: true // true or false
  },
  port: 3000,
  host: "localhost",
  apiUrl: "http://localhost/live-gaming",
  domainName: "localhost",
  applicationPath: "ws",
  updateConfiguration: 'updateConfiguration',
}


function updateConfigurationData(data, gameStatusUpdateFunction) {
  try {
    Object.keys(data).forEach(key => {
      if (typeof configuration[key] === 'object' && typeof data[key] === 'object') {
        Object.assign(configuration[key], data[key]);
        
      } else if (configuration.hasOwnProperty(key)) {
        configuration[key] = data[key];
      }
    });
    gameStatusUpdateFunction.updateRocketGameStatus(configuration.rocketCrashGame.status, true);
    gameStatusUpdateFunction.updateRouletteGameStatus(configuration.rouletteWheelGame.status, true);
    gameStatusUpdateFunction.updateAndarBaharGameStatus(configuration.andarBaharGame.status, true);
    gameStatusUpdateFunction.updateBaccaratGameStatus(configuration.baccaratGame.status, true);
    return {configuration};
  } catch (error) {
    logError(error, { gameName: "updateConfiguration", function: 'updateConfigurationData', data});
    return {'configuration': configuration, error: error.message };
  }
}

function handleConfiguratinEvent(ws, gameStatusUpdateFunction) {
  try { 
    ws.on('message', (message) => {
      const data = JSON.parse(message); 

      if (data.type === 'updateGameStatus') {
        let game = null;         
        if(data.alias == configuration.rocketCrashGame.alias) {
          configuration.rocketCrashGame.status = data.status;
          game = configuration.rocketCrashGame;
          gameStatusUpdateFunction.updateRocketGameStatus(game.status);
        } else if (data.alias == configuration.rouletteWheelGame.alias) {
          configuration.rouletteWheelGame.status = data.status;
          game = configuration.rouletteWheelGame;
          gameStatusUpdateFunction.updateRouletteGameStatus(game.status);
        } else if (data.alias == configuration.andarBaharGame.alias) {
          configuration.andarBaharGame.status = data.status;
          game = configuration.andarBaharGame;
          gameStatusUpdateFunction.updateAndarBaharGameStatus(game.status);
        }  else if (data.alias == configuration.baccaratGame.alias) {
          configuration.baccaratGame.status = data.status;
          game = configuration.baccaratGame;
          gameStatusUpdateFunction.updateBaccaratGameStatus(game.status);
        }
        const responseData = JSON.stringify({ type: 'updateGameStatus', status: true, data: {game}, message: "Game status has been updated!" });
        ws.send(responseData);
      } else if (data.type === 'configuration') {
        const responseData = JSON.stringify({ type: 'configuration', status: true, data: {configuration} });
        ws.send(responseData);
      } else if(data.type === 'updateConfiguration') {
        const configurationData = updateConfigurationData(data.configuration, gameStatusUpdateFunction);
        const responseData = JSON.stringify({ type: 'updateConfiguration', data: configurationData, status: true, message: "Configuration has been updated!" });
        ws.send(responseData);
      } else if(data.type === 'restartGame') {        
        gameStatusUpdateFunction.startGameRound();
      }
    });
  } catch (error) {
    logError(error, { gameName: "updateConfiguration", function: 'updateGameStatus', data});
  }
}
  

module.exports = { configuration, handleConfiguratinEvent };
  
  
