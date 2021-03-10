const { io } = require("../server.js");
const { Game } = require("./Game.js");

const oneHour = 1000 * 60 * 60;

class GameList {
    constructor() {
        this.list = [];
        this.playerAmount = 2;
    }

    addGame(data) {
        const game = new Game(data);
        this.list.push(game);
        setTimeout(() => this.removeGameWhenIdle(game), oneHour);
    }

    removeGame(game, { reason }) {
        const index = this.list.findIndex((g) => g.id === game.id);
        this.list.splice(index, 1);
        io.to(game.id).emit("redirectHome", { reason });
    }

    removeGameWhenIdle(game) {
        const currentTime = new Date().getTime();
        if (currentTime - game.lastMoveTime > oneHour) {
            removeGame(game, { reason: "This game has been detected as idle." });
        } else {
            setTimeout(() => this.removeWhenIdle(game), oneHour);
        }
    }

    findGameById(id) {
        return this.list.find((game) => game.id === id);
    }

    findGameByPlayer(socket) {
        return this.list.find((game) => game.players.includes(socket));
    }

    findGameByViewer(socket) {
        return this.list.find((game) => game.viewers.includes(socket));
    }
}

const GAME_LIST = new GameList();

module.exports = { GAME_LIST };
