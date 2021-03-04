const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log("server started on port", PORT);
});
app.use(express.static("public"));
app.set("view engine", "ejs");

const socket = require("socket.io");
const io = socket(server);

const { Game } = require("./Game.js");

const games = [];

app.get("/", (req, res) => {
    const game = new Game(io);
    games.push(game);
    res.render("welcome", { id: game.id });
});

app.get("/game", (req, res) => {
    const id = req.query.id;
    if (!id || !games.map((game) => game.id).includes(id)) {
        return res.redirect("/");
    }
    res.render("game", { id });
});

io.on("connect", (socket) => {
    socket.on("gameId", (gameId) => {
        const game = games.find((game) => game.id === gameId);
        if (!game || game.players.length >= 2) {
            socket.emit("redirectHome");
            return;
        }
        game.players.push(socket.id);
        if (game.players.length === 2) {
            game.start();
        }
    });
    socket.on("disconnect", () => {
        const index = games.findIndex((game) => game.players.includes(socket.id));
        if (index >= 0) {
            const game = games[index];
            const otherSocket = game.players.find((player) => player != socket.id);
            io.to(otherSocket).emit("redirectHome");
            games.splice(index, 1);
        }
    });
    socket.on("openCard", ({ gameId, playerIndex, cardId }) => {
        const game = games.find((game) => game.id === gameId);
        if (game && game.turn === playerIndex) {
            game.openCard(cardId);
        }
    });
});
