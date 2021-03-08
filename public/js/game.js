$(() => {
    $("#status").html("Waiting for an opponent...").fadeIn();
    for (let cardId = 0; cardId < cardAmount; cardId++) {
        const card = $("<div></div>")
            .attr("id", `card-${cardId}`)
            .addClass("card")
            .click(() => socket.emit("openCard", { gameId, cardId }))
            .appendTo("#game")
            .fadeIn();
        $("<div></div>").addClass("front").appendTo(card);
        $("<div></div>").addClass("back").appendTo(card);
    }
});

const socket = io();

socket.on("connect", () => {
    socket.emit("gameId", gameId);
});

socket.on("redirectHome", ({ reason }) => {
    $("#game, #score").hide();
    $("#status").html(`${reason}<br><br>
    You will now be redirected to the main page.`);
    setTimeout(redirectHome, 3000);
});

$("#closeBtn").click(redirectHome);

function redirectHome() {
    const url = window.location;
    const baseURL = url.protocol + "//" + url.host;
    url.href = baseURL;
}

socket.on("turn", (isMyTurn) => {
    if (isMyTurn) {
        $("#status").html("It's your turn");
        $(".card").css("cursor", "pointer");
    } else {
        $("#status").html("It's your opponent's turn");
        $(".card").css("cursor", "default");
    }
});

socket.on("openCard", ({ cardId, image, duration }) => {
    const card = $(`#card-${cardId}`).addClass("turned");
    card.children(".front").css("backgroundImage", `url(${image})`);
    setTimeout(() => {
        card.children(".front").css("zIndex", 1);
        card.children(".back").css("zIndex", 0);
    }, duration / 2);
    setTimeout(() => {
        card.removeClass("turned");
    }, duration);
});

socket.on("closeCard", ({ cardId, duration }) => {
    const card = $(`#card-${cardId}`).addClass("turned");
    setTimeout(() => {
        card.children(".front").css("zIndex", 0);
        card.children(".back").css("zIndex", 1);
    }, duration / 2);
    setTimeout(() => {
        card.removeClass("turned");
        card.children(".front").css("backgroundImage", "");
    }, duration);
});

socket.on("message", (msg) => {
    $("#status").css("fontSize", "30px").html(msg);
    setTimeout(() => $("#status").css("fontSize", "18px"), 5000);
});

socket.on("score", (score) => $("#score").text(score));

socket.on("round", (round) => $("#round").text(round));

socket.on("loading", (loading) => {
    if (loading) {
        $("#game").css("opacity", 0.4);
    } else {
        $("#game").css("opacity", 1);
    }
});

if (localStorage.getItem("resizeModal") == 0) {
    $("#resizeModal").remove();
} else {
    $("#resizeModal").show();
}

$("#closeModal").click(() => {
    $("#resizeModal").slideUp("fast");
    localStorage.setItem("resizeModal", 0);
});
