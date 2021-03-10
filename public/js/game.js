let myIndex;

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

socket.on("index", (index) => {
    myIndex = index;
    $(`#player${index}`).text(`You`);
    $(`#player${1 - index}`).text(`Opponent`);
});

socket.on("redirectHome", ({ reason }) => {
    $("#game, #scoreBoard").hide();
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

// socket.on("turn", (isMyTurn) => {
//     if (isMyTurn) {
//         $("#status").html("It's your turn");
//         $(".card").css("cursor", "pointer");
//     } else {
//         $("#status").html("It's your opponent's turn");
//         $(".card").css("cursor", "default");
//     }
// });

socket.on("turnIndex", (index) => {
    $(`.score`).removeClass("current");
    $(`#score${index}`).addClass("current");
    if (myIndex == null) {
        $("#status").html(`It's Player ${index + 1}'s turn`);
    } else if (myIndex === index) {
        $("#status").html("It's your turn");
        $(".card").css("cursor", "pointer");
    } else {
        $("#status").html("It's your opponent's turn");
        $(".card").css("cursor", "default");
    }
});

socket.on("openCard", ({ cardId, image }) => {
    const card = $(`#card-${cardId}`).addClass("flipped");
    card.children(".front").css("backgroundImage", `url(${image})`);
});

socket.on("closeCard", ({ cardId, duration }) => {
    const card = $(`#card-${cardId}`).addClass("turned");
    card.removeClass("flipped");
    setTimeout(() => {
        card.children(".front").css("backgroundImage", "");
    }, duration);
});

socket.on("message", (msg) => {
    $("#status").css("fontSize", "30px").html(msg);
    setTimeout(() => $("#status").css("fontSize", "18px"), 4500);
});

socket.on("scores", (scores) => {
    $("#score0").text(scores[0]);
    $("#score1").text(scores[1]);
});

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
    $("#game").css("border-color", "var(--outline-color)");
} else {
    $("#resizeModal").show();
}

$("#closeModal").click(() => {
    $("#resizeModal").slideUp("fast");
    $("#game").css("border-color", "var(--outline-color)");
    localStorage.setItem("resizeModal", 0);
});

socket.on("viewMode", () => {
    $("#title").text("Memory (View Mode)");
});
