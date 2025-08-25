"use strict";

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const { configuration, handleConfiguratinEvent } = require("./configuration.js");
const { handleRocketEvent, startRocketGameRound, updateRocketGameStatus } = require('./games/rocket.js');
const { handleRouletteEvent, startRouletteGameRound, updateRouletteGameStatus } = require('./games/roulette.js');
const { handleAndarBaharEvent, startAndarBaharGameRound, updateAndarBaharGameStatus } = require('./games/andar_bahar.js');
const { handleBaccaratEvent, startBaccaratGameRound, updateBaccaratGameStatus } = require('./games/baccarat.js');
const { activeGamesUsers } = require('./socket_users.js');
const { logError } = require('./logger.js');

const app = express();
const PORT = configuration.port;
const socketPath = '/'+configuration.applicationPath;

app.use(cors());


app.get('/game', (req, res) => {
  const whichGame = req.query.whichGame;
  if (['rocketCrashGame', 'rouletteWheelGame', 'andarBaharGame', 'baccaratGame', 'updateConfiguration'].includes(whichGame)) {
    return res.json({ success: true, gameType: whichGame });
  }
  return res.status(400).json({ success: false, error: "Invalid game type" });
});

const httpsServer = http.createServer(app);

const wss = new WebSocket.Server({ server: httpsServer, path: socketPath });

wss.on('connection', (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const gameType = parsedUrl.query.whichGame || null;
  const requestDomainName = req.headers.origin.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
  if (requestDomainName != configuration.domainName) {
    logError({message: "Invalid domain for socket connection request"}, { gameName: "socket connection", function: 'connection', requestFrom: req.headers.origin});
    ws.terminate();
    return;
  }

  if (activeGamesUsers.has(gameType)) {
    activeGamesUsers.get(gameType).add(ws);

    if (gameType === configuration.rocketCrashGame.alias) {
      handleRocketEvent(ws, wss);
    } else if (gameType === configuration.rouletteWheelGame.alias) {
      handleRouletteEvent(ws, wss);
    } else if (gameType === configuration.andarBaharGame.alias) {
      handleAndarBaharEvent(ws, wss);
    } else if (gameType === configuration.baccaratGame.alias) {
      handleBaccaratEvent(ws, wss);
    } else if (gameType === "updateConfiguration") {
      const gameStatusUpdateFunction = {
        updateRocketGameStatus,
        updateRouletteGameStatus,
        updateAndarBaharGameStatus,
        updateBaccaratGameStatus,
        startGameRound
      };
      handleConfiguratinEvent(ws, gameStatusUpdateFunction);
    }
  } else {
    ws.close();
  }

  ws.on('close', () => {
    if (gameType && activeGamesUsers.has(gameType)) {
      activeGamesUsers.get(gameType).delete(ws);
    }
  });

  ws.on('error', (error) => console.error('WebSocket error:', error));
});

httpsServer.listen(PORT, () => {
  startGameRound();
});


function startGameRound() {
  try {
    startRocketGameRound();
    startRouletteGameRound();
    startAndarBaharGameRound();
    startBaccaratGameRound();
  } catch (error) {
    logError(error, { gameName: "game start", function: 'start' });
  }
}

