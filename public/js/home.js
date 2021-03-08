let cardAmount = 16;
let roundAmount = 10;
let url;
updateDisplay();

$("#plusCardBtn").click(() => {
    cardAmount += 2;
    updateDisplay();
});

$("#minusCardBtn").click(() => {
    if (cardAmount >= 4) {
        cardAmount -= 2;
        updateDisplay();
    }
});

$("#plusRoundBtn").click(() => {
    roundAmount += 1;
    updateDisplay();
});

$("#minusRoundBtn").click(() => {
    if (roundAmount >= 2) {
        roundAmount--;
        updateDisplay();
    }
});

function updateDisplay() {
    $("#amountDisplay").text(cardAmount);
    $("#roundDisplay").text(roundAmount);
    url = `${window.location}${id}?n=${cardAmount}&r=${roundAmount}`;
    $("#link").text(url).attr("href", url);
}

$("#copyBtn").click(() => {
    copyStringToClipboard(url);
});

$(".welcome i").click(function () {
    $(this).addClass("clicked");
    setTimeout(() => {
        $(this).removeClass("clicked");
    }, 200);
});

function copyStringToClipboard(str) {
    const el = document.createElement("textarea");
    el.style.opacity = 0;
    el.value = str;
    el.setAttribute("readonly", "");
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    el.remove();
}
