"use strict";

const { activeGamesUsers } = require('./socket_users.js');

function returnResponse(gameType, ws, type, status, data, message, allActiveClients = false) {
    const responseData = JSON.stringify({ type, status, data, message });
    if (allActiveClients) {
        broadcastToAll(gameType, responseData);
    } else if (ws) {
        ws.send(responseData);
    }
}

function broadcastToAll(gameType, data) {
    activeGamesUsers.get(gameType).forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
}

module.exports = { returnResponse };
