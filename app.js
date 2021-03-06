const { app } = require("./server.js");
const { io } = require("./socket.js");
const shortid = require("shortid");

// import game class
const { Game } = require("./Game.js");

// start route
app.get("/", (req, res) => {
    const id = shortid.generate();
    res.render("welcome", { id });
});

// game route
app.get("/game", (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.redirect("/");
    }
    if (!Game.findGameById(id)) {
        new Game(id);
    }
    res.render("game", { id });
});

// socket connection
io.on("connect", (socket) => {
    socket.on("gameId", (gameId) => {
        const game = Game.findGameById(gameId);
        if (!game || game.players.length >= 2) {
            socket.emit("redirectHome");
        } else {
            game.players.push(socket.id);
            if (game.players.length === 2) {
                game.start();
            }
        }
    });
    socket.on("disconnect", () => {
        const game = Game.findGameByPlayer(socket.id);
        if (!game) return;
        game.remove();
    });
    socket.on("openCard", ({ gameId, playerIndex, cardId }) => {
        const game = Game.findGameById(gameId);
        if (game && game.turn === playerIndex) {
            game.openCard(cardId);
        }
    });
});
