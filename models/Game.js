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
    constructor({ id, cardAmount }) {
        this.id = id;
        this.cardAmount = cardAmount;
        this.players = [];
        this.scores = [0, 0];
        this.pairedCards = 0;
        this.previousCard = null;
        this.cards = [];
        this.canOpen = false;
        this.turn = 0;
        this.round = 1;
        this.lastMoveTime = null;
    }

    get currentPlayer() {
        return this.players[this.turn];
    }

    get otherPlayer() {
        return this.players[1 - this.turn];
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
        this.turn = this.round % 2 === 0 ? 1 : 0;
        this.showScores();
        this.showTurn();
    }

    showTurn() {
        this.currentPlayer.emit("turn", true);
        this.otherPlayer.emit("turn", false);
    }

    showScores() {
        for (let i = 0; i < 2; i++) {
            this.players[i].emit("score", {
                round: this.round,
                score: this.scores[i],
            });
        }
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
            duration: turnDuration,
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
            cardA.status = CARD_STATES.PAIRED;
            cardB.status = CARD_STATES.PAIRED;
            this.pairedCards += 2;
            this.canOpen = true;
            if (this.pairedCards == this.cardAmount) {
                this.handleWin();
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

    handleWin() {
        this.scores[this.turn]++;
        this.currentPlayer.emit("message", "You won the round!");
        this.otherPlayer.emit("message", "You lost the round!");
        setTimeout(() => {
            this.restart();
        }, 1000);
    }
}

module.exports = { Game };
