const { app, io } = require("./server.js");

const {
    joinGame,
    startGame,
    handleDisconnect,
    openCard,
} = require("./controllers/gameController.js");

const { showHome } = require("./controllers/homeController.js");

app.get("/", showHome);
app.get("/:gameId", joinGame);

io.on("connect", (socket) => {
    socket.on("gameId", (gameId) => startGame(socket, gameId));
    socket.on("openCard", (data) => openCard(socket, data));
    socket.on("disconnect", () => handleDisconnect(socket));
});
