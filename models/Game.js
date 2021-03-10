const fetch = require("node-fetch");
const { io } = require("../server.js");
const { shuffle, randInt, sleep } = require("../controllers/utils.js");

const CARD_STATES = {
    OPEN: 0,
    CLOSED: 1,
    PAIRED: 2,
};

const turnDuration = 250;
const cardWidth = 100;
const cardHeight = 140;
const variation = 100;

class Game {
    constructor({ id, cardAmount, roundAmount }) {
        this.id = id;
        this.cardAmount = cardAmount;
        this.roundAmount = roundAmount;
        this.players = [];
        this.scores = [0, 0];
        this.pairedCards = 0;
        this.previousCard = null;
        this.cards = [];
        this.canOpen = false;
        this.turn = 0;
        this.round = 1;
        this.lastMoveTime = null;
        this.roundScore = [0, 0];
    }

    get currentPlayer() {
        return this.players[this.turn];
    }

    get otherPlayer() {
        return this.players[1 - this.turn];
    }

    addPlayer(socket) {
        socket.emit("index", this.players.length);
        this.players.push(socket);
    }

    addViewer(socket) {
        socket.join(this.id);
        socket.join(this.id + "view");
        socket.emit("round", this.round);
        socket.emit("scores", this.scores);
        socket.emit("turnIndex", this.turn);
        socket.emit("viewMode");
        for (const card of this.cards) {
            if (card.state != CARD_STATES.CLOSED) {
                socket.emit("openCard", {
                    cardId: card.id,
                    image: card.image,
                    duration: turnDuration,
                });
            }
        }
    }

    async start() {
        for (const player of this.players) {
            player.join(this.id);
        }
        await this.generateCards();
        this.showTurn();
        this.lastMoveTime = new Date().getTime();
    }

    async restart() {
        for (const card of this.cards) {
            this.closeCard(card);
        }
        await this.generateCards();
        this.round++;
        this.roundScore = [0, 0];
        this.turn = this.round % 2 === 0 ? 1 : 0;
        this.showRound();
        this.showTurn();
    }

    showTurn() {
        io.to(this.id).emit("turnIndex", this.turn);
        this.currentPlayer.emit("turn", true);
        this.otherPlayer.emit("turn", false);
    }

    showRound() {
        io.to(this.id).emit("round", this.round);
    }

    showScores() {
        io.to(this.id).emit("scores", this.scores);
    }

    changeTurns() {
        this.turn = 1 - this.turn;
        this.showTurn();
    }

    async generateCards() {
        io.to(this.id).emit("loading", true);
        this.canOpen = false;
        this.pairedCards = 0;
        this.previousCard = null;
        this.cards = [];
        const imageURLs = [];
        for (let i = 0; i < this.cardAmount / 2; i++) {
            try {
                const width = randInt(cardWidth, cardWidth + variation);
                const height = randInt(cardHeight, cardHeight + variation);
                const response = await fetch(`https://unsplash.it/${width}/${height}`);
                const { url } = response;
                if (imageURLs.includes(url)) {
                    i--;
                } else {
                    imageURLs.push(url, url);
                }
            } catch (err) {
                console.log(err);
                return;
            }
        }

        shuffle(imageURLs);

        this.cards = imageURLs.map((image, id) => {
            return { id, image, state: CARD_STATES.CLOSED };
        });

        this.canOpen = true;
        io.to(this.id).emit("loading", false);
    }

    async openCard(cardId) {
        if (!this.canOpen) return;
        const card = this.cards[cardId];
        if (!card || card.state != CARD_STATES.CLOSED) return;
        this.lastMoveTime = new Date().getTime();
        card.state = CARD_STATES.OPEN;
        io.to(this.id).emit("openCard", {
            cardId: cardId,
            image: card.image,
        });
        await sleep(turnDuration);
        if (!this.previousCard) {
            this.previousCard = card;
        } else {
            this.handlePairing(this.previousCard, card);
        }
    }

    async handlePairing(cardA, cardB) {
        this.canOpen = false;
        this.previousCard = null;
        if (cardA.image === cardB.image) {
            cardA.state = CARD_STATES.PAIRED;
            cardB.state = CARD_STATES.PAIRED;
            this.pairedCards += 2;
            this.canOpen = true;
            this.roundScore[this.turn]++;
            if (this.pairedCards == this.cardAmount) {
                this.finishRound();
            }
        } else {
            await sleep(turnDuration * 2);
            this.closeCard(cardA);
            this.closeCard(cardB);
            await sleep(turnDuration);
            this.canOpen = true;
            this.changeTurns();
        }
    }

    closeCard(card) {
        card.state = CARD_STATES.CLOSED;
        io.to(this.id).emit("closeCard", {
            cardId: card.id,
            duration: turnDuration,
        });
    }

    finishRound() {
        if (this.roundScore[0] === this.roundScore[1]) {
            io.to(this.id).emit("message", "The round is drawn! 🤝");
            this.scores[0]++;
            this.scores[1]++;
        } else if (this.roundScore[0] > this.roundScore[1]) {
            this.scores[0]++;
            this.players[0].emit("message", "You won the round! 😀");
            this.players[1].emit("message", "You lost the round! 😕");
            io.to(this.id + "view").emit("message", "Player 1 won the round.");
        } else {
            this.scores[1]++;
            this.players[0].emit("message", "You lost the round! 😕");
            this.players[1].emit("message", "You won the round! 😀");
            io.to(this.id + "view").emit("message", "Player 2 won the round.");
        }
        this.showScores();
        setTimeout(() => {
            if (this.round < this.roundAmount) {
                this.restart();
            } else {
                this.finishGame();
            }
        }, 5000);
    }

    finishGame() {
        if (this.scores[0] === this.scores[1]) {
            io.to(this.id).emit("message", "The game is drawn! 🤝");
        } else if (this.scores[0] > this.scores[1]) {
            this.players[0].emit("message", "You won the game! 🎉");
            this.players[1].emit("message", "You lost the game! 😔");
            io.to(this.id + "view").emit("message", "Player 1 won the game.");
        } else {
            this.players[0].emit("message", "You lost the game! 😔");
            this.players[1].emit("message", "You won the game! 🎉");
            io.to(this.id + "view").emit("message", "Player 2 won the game.");
        }
    }
}

module.exports = { Game };
