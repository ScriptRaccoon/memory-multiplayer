$("#statusMessage").html("Waiting for an opponent...").fadeIn();

const socket = io();

socket.on("connect", () => {
    socket.emit("gameId", gameId);
});

socket.on("redirectHome", () => {
    const seconds = 3;
    $("#statusMessage")
        .html(`This game is either full or does not exist (anymore).<br><br>
    You will be redirected to the main page in ${seconds} seconds.`);
    setTimeout(() => {
        const url = window.location;
        const baseURL = url.protocol + "//" + url.host + "/" + url.pathname.split("/")[1];
        window.location.href = baseURL;
    }, seconds * 1000);
});

socket.on("userNumber", (userNumber) => {
    if (userNumber === 2) {
        $("#statusMessage").html("The game can start now!");
        // todo
    }
});

// for debugging
// socket.on("message", (msg) => {
//     console.log("new message from server:");
//     console.log(msg);
// });
