function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
}

function randInt(a, b) {
    return a + Math.floor((b - a) * Math.random());
}

module.exports = { shuffle, randInt };
