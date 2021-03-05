let playerIndex = null;

$("#statusMessage").html("Waiting for an opponent...").fadeIn();

const socket = io();

socket.on("connect", () => {
    socket.emit("gameId", gameId);
});

socket.on("redirectHome", () => {
    $("#game").hide();
    $("#roundMessage").hide();
    const seconds = 3;
    $("#statusMessage")
        .html(`This game is either full or does not exist (anymore).<br><br>
    You will be redirected to the main page in ${seconds} seconds.`);
    setTimeout(redirectHome, seconds * 1000);
});

function redirectHome() {
    const url = window.location;
    const baseURL = url.protocol + "//" + url.host + "/" + url.pathname.split("/")[1];
    window.location.href = baseURL;
}

$("#closeBtn").click(redirectHome);

socket.on("gameStart", ({ index, cardAmount }) => {
    playerIndex = index;
    for (let i = 0; i < cardAmount / 2; i++) {
        for (let j = 0; j < 2; j++) {
            const cardId = 2 * i + j;
            const card = $("<div></div>")
                .attr("id", `card-${cardId}`)
                .addClass("card")
                .click(() => socket.emit("openCard", { gameId, playerIndex, cardId }))
                .appendTo("#game")
                .fadeIn();
            $("<div></div>").addClass("front").appendTo(card);
            $("<div></div>").addClass("back").appendTo(card);
        }
    }
});

socket.on("turn", () => {
    $("#statusMessage").html("It's your turn");
});

socket.on("noturn", () => {
    $("#statusMessage").html("It's your opponent's turn");
});

socket.on("openCard", ({ cardId, image, duration }) => {
    const card = $(`#card-${cardId}`);
    card.addClass("turned");
    setTimeout(() => {
        card.children(".front").show().css("backgroundImage", `url(${image})`);
        card.children(".back").hide();
    }, duration / 2);

    setTimeout(() => {
        card.removeClass("turned");
    }, duration);
});

socket.on("closeCard", ({ cardId, duration }) => {
    const card = $(`#card-${cardId}`);
    card.addClass("turned");
    setTimeout(() => {
        card.children(".front").hide().css("backgroundImage", "");
        card.children(".back").show();
    }, duration / 2);
    setTimeout(() => {
        card.removeClass("turned");
    }, duration);
});

socket.on("win", (message) => {
    $("#statusMessage").html(message);
});

socket.on("round", (round) => {
    $("#roundMessage").text(`Round ${round}`);
});
