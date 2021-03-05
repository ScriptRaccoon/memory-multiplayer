const { server } = require("./server.js");
const socket = require("socket.io");
const io = socket(server);

module.exports = { io };
