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
app.get("/game", async (req, res) => {
    const id = req.query.id;
    if (!id) {
        return res.redirect("/");
    }
    if (!Game.findGameById(id)) {
        const game = new Game(id);
    }
    res.render("game", { id });
});

// socket connection
io.on("connect", (socket) => {
    socket.on("gameId", (gameId) => {
        const game = Game.findGameById(gameId);
        if (!game || game.players.length >= 2) {
            socket.emit("redirectHome", { reason: "This game is already full." });
        } else {
            game.players.push(socket);
            if (game.players.length === 2) {
                game.start();
            }
        }
    });
    socket.on("disconnect", () => {
        const game = Game.findGameByPlayer(socket);
        if (!game) return;
        game.remove({ reason: "The other player has disconnected." });
    });
    socket.on("openCard", ({ gameId, cardId }) => {
        const game = Game.findGameById(gameId);
        if (game && game.players[game.turn].id === socket.id) {
            game.openCard(cardId);
        }
    });
});
