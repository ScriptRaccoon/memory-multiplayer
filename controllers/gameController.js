const { GAME_LIST } = require("../models/GameList.js");

function joinGame(req, res) {
    const gameId = req.params.gameId;
    const cardAmount = parseInt(req.query.n);
    const roundAmount = parseInt(req.query.r);
    const isValidAmount = cardAmount >= 2 && cardAmount % 2 == 0 && roundAmount >= 1;
    if (!gameId || !cardAmount || !isValidAmount) {
        return res.redirect("/");
    }
    const game = GAME_LIST.findGameById(gameId);
    if (game && (game.cardAmount != cardAmount || game.roundAmount != roundAmount)) {
        return res.redirect("/");
    }
    if (!game) {
        GAME_LIST.addGame({ id: gameId, cardAmount, roundAmount });
    }
    res.render("game", { gameId, cardAmount, roundAmount });
}

function startGame(socket, gameId) {
    const game = GAME_LIST.findGameById(gameId);
    if (!game) {
        socket.emit("redirectHome", { reason: "This game does not exist." });
    } else if (game.players.length < GAME_LIST.playerAmount) {
        game.addPlayer(socket);
        if (game.players.length === GAME_LIST.playerAmount) {
            game.start();
        }
    } else {
        game.addViewer(socket);
    }
}

function handleDisconnect(socket) {
    let game = GAME_LIST.findGameByPlayer(socket);
    if (game) {
        GAME_LIST.removeGame(game, { reason: "The other player has disconnected." });
        return;
    }
    game = GAME_LIST.findGameByViewer(socket);
    if (game) {
        game.removeViewer(socket);
    }
}

function openCard(socket, { gameId, cardId }) {
    const game = GAME_LIST.findGameById(gameId);
    if (game && game.currentPlayer == socket) {
        game.openCard(cardId);
    }
}

module.exports = { joinGame, startGame, handleDisconnect, openCard };
