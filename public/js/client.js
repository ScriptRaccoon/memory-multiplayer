$("#status").html("Waiting for an opponent...").fadeIn();

const socket = io();

socket.on("connect", () => {
    socket.emit("gameId", gameId);
});

socket.on("redirectHome", ({ reason }) => {
    $("#game").hide();
    $("#score").hide();
    const seconds = 3;
    $("#status").html(`${reason}<br><br>
    You will be redirected to the main page in ${seconds} seconds.`);
    setTimeout(redirectHome, seconds * 1000);
});

function redirectHome() {
    const url = window.location;
    const baseURL = url.protocol + "//" + url.host + "/" + url.pathname.split("/")[1];
    window.location.href = baseURL;
}

$("#closeBtn").click(redirectHome);

socket.on("gameStart", ({ cardAmount }) => {
    $(".header").addClass("duringGame");
    for (let i = 0; i < cardAmount / 2; i++) {
        for (let j = 0; j < 2; j++) {
            const cardId = 2 * i + j;
            const card = $("<div></div>")
                .attr("id", `card-${cardId}`)
                .addClass("card")
                .click(() => socket.emit("openCard", { gameId, cardId }))
                .appendTo("#game")
                .fadeIn();
            $("<div></div>").addClass("front").appendTo(card);
            $("<div></div>").addClass("back").appendTo(card);
        }
    }
});

socket.on("turn", () => {
    $("#status").html("It's your turn");
    $(".card").css("cursor", "pointer");
});

socket.on("noturn", () => {
    $("#status").html("It's your opponent's turn");
    $(".card").css("cursor", "not-allowed");
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

socket.on("message", (message) => {
    $("#status").html(message);
});

socket.on("score", ({ round, score }) => {
    $("#score").text(`Round ${round} / Score ${score}`);
});

socket.on("loading", (loading) => {
    if (loading) {
        $("#status").html("Images are loaded...");
        $("#game").css("opacity", 0.7);
    } else {
        $("#game").css("opacity", 1);
    }
});
