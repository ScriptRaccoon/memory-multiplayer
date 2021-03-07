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

module.exports = { app, io };
