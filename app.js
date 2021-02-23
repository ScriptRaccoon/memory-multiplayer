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

const shortid = require("shortid");

const games = [];

app.get("/", (req, res) => {
    const id = shortid.generate();
    res.render("welcome", { id });
    games.push({ id, players: [] });
    console.log(games);
});

app.get("/game", (req, res) => {
    const id = req.query.id;
    if (!id || !games.map((game) => game.id).includes(id)) {
        return res.redirect("/");
    }
    res.render("game", { id });
    console.log(games);
});

io.on("connect", (socket) => {
    console.log(socket.id);
    console.log(games);
    socket.on("gameId", (gameId) => {
        const game = games.find((game) => game.id === gameId);
        if (!game || game.players.length >= 2) {
            socket.emit("redirectHome");
            return;
        }
        game.players.push(socket.id);
        socket.join(gameId);
        io.to(gameId).emit("userNumber", game.players.length);
        console.log(games);
    });
    socket.on("disconnect", () => {
        const index = games.findIndex((game) => game.players.includes(socket.id));
        if (index >= 0) {
            const game = games[index];
            const otherSocket = game.players.find((player) => player != socket.id);
            io.to(otherSocket).emit("redirectHome");
            games.splice(index, 1);
            console.log(games);
        }
    });
});
