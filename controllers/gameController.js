const { GAME_LIST } = require("../models/GameList.js");

function joinGame(req, res) {
    const gameId = req.params.gameId;
    const cardAmount = parseInt(req.query.n);
    const isValidAmount = cardAmount >= 2 && cardAmount % 2 == 0;
    if (!gameId || !cardAmount || !isValidAmount) {
        return res.redirect("/");
    }
    const game = GAME_LIST.findGameById(gameId);
    if (game && game.cardAmount != cardAmount) {
        return res.redirect("/");
    }
    if (!game) {
        GAME_LIST.addGame({ id: gameId, cardAmount });
    }
    res.render("game", { gameId, cardAmount });
}

function startGame(socket, gameId) {
    const game = GAME_LIST.findGameById(gameId);
    if (!game) {
        socket.emit("redirectHome", { reason: "This game does not exist." });
    } else if (game.players.length >= GAME_LIST.playerAmount) {
        socket.emit("redirectHome", { reason: "This game is already full." });
    } else {
        game.players.push(socket);
        if (game.players.length === GAME_LIST.playerAmount) {
            game.start();
        }
    }
}

function handleDisconnect(socket) {
    const game = GAME_LIST.findGameByPlayer(socket);
    if (!game) return;
    GAME_LIST.removeGame(game, { reason: "The other player has disconnected." });
}

function openCard(socket, { gameId, cardId }) {
    const game = GAME_LIST.findGameById(gameId);
    if (game && game.currentPlayer == socket) {
        game.openCard(cardId);
    }
}

module.exports = { joinGame, startGame, handleDisconnect, openCard };