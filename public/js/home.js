let cardAmount = 16;
let url;
updateLink();

$("#plusBtn").click(() => {
    cardAmount += 2;
    updateLink();
});

$("#minusBtn").click(() => {
    if (cardAmount >= 4) {
        cardAmount -= 2;
        updateLink();
    }
});

function updateLink() {
    $("#amountDisplay").text(cardAmount);
    url = `${window.location}${id}?n=${cardAmount}`;
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
