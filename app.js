const { app } = require("./server.js");
const { io } = require("./socket.js");
const shortid = require("shortid");

// import game class
const { Game } = require("./Game.js");

// start route
app.get("/", (req, res) => {
    const id = shortid.generate();
    res.render("home", { id });
});

// game route
app.get("/:gameId", async (req, res) => {
    const gameId = req.params.gameId;
    const cardAmount = parseInt(req.query.n);
    const isValidAmount = cardAmount >= 2 && cardAmount % 2 == 0;
    if (!gameId || !cardAmount || !isValidAmount) {
        return res.redirect("/");
    }
    if (!Game.findGameById(gameId)) {
        new Game(gameId, cardAmount);
    }
    res.render("game", { gameId });
});

// socket connection
io.on("connect", (socket) => {
    socket.on("gameId", (gameId) => {
        const game = Game.findGameById(gameId);
        if (!game) {
            socket.emit("redirectHome", { reason: "This game does not exist." });
        } else if (game.players.length >= 2) {
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
