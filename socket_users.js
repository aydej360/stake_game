"use strict";

const { configuration } = require("./configuration.js");

const activeGamesUsers = new Map([
    [configuration.rocketCrashGame.alias, new Set()],
    [configuration.rouletteWheelGame.alias, new Set()],
    [configuration.andarBaharGame.alias, new Set()],
    [configuration.baccaratGame.alias, new Set()],
    [configuration.updateConfiguration, new Set()]
]);

module.exports = { activeGamesUsers };