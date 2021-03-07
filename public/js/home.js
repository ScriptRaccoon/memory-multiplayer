let cardAmount = $("#amountInput").val();
let url = `${window.location}${id}?n=${cardAmount}`;

$("#link").text(url).attr("href", url);

$("#amountInput").change(() => {
    cardAmount = $("#amountInput").val();
    url = `${window.location}${id}?n=${cardAmount}`;
    $("#link").text(url).attr("href", url);
});

$("#copyBtn").click(() => {
    copyStringToClipboard(url);
    $("#copyBtn").addClass("clicked");
    setTimeout(() => {
        $("#copyBtn").removeClass("clicked");
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
