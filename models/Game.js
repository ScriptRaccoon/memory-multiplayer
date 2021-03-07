const fetch = require("node-fetch");
const { io } = require("../server.js");
const { shuffle, randInt } = require("../controllers/utils.js");

const CARD_STATES = {
    OPEN: 0,
    CLOSED: 1,
    PAIRED: 2,
};

class Game {
    constructor({ id, cardAmount }) {
        this.id = id;
        this.cardAmount = cardAmount;
        this.players = [];
        this.scores = [0, 0];
        this.pairedCards = 0;
        this.previousCard = null;
        this.turnDuration = 250;
        this.cardWidth = 100;
        this.cardHeight = 140;
        this.variation = 100;
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
                const width = randInt(this.cardWidth, this.cardWidth + this.variation);
                const height = randInt(this.cardHeight, this.cardHeight + this.variation);
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

        for (let i = 0; i < this.cardAmount; i++) {
            this.cards[i] = { id: i, image: imageURLs[i], state: CARD_STATES.CLOSED };
        }

        this.canOpen = true;
        io.to(this.id).emit("loading", false);
    }

    openCard(cardId) {
        if (!this.canOpen) return;
        const card = this.cards[cardId];
        if (!card || card.state != CARD_STATES.CLOSED) return;
        this.lastMoveTime = new Date().getTime();
        card.state = CARD_STATES.OPEN;
        io.to(this.id).emit("openCard", {
            cardId: cardId,
            image: card.image,
            duration: this.turnDuration,
        });

        if (!this.previousCard) {
            this.previousCard = card;
        } else {
            this.canOpen = false;
            const previousCard = this.previousCard;
            this.previousCard = null;
            if (card.image === previousCard.image) {
                card.status = CARD_STATES.PAIRED;
                previousCard.status = CARD_STATES.PAIRED;
                this.pairedCards += 2;
                this.canOpen = true;
                if (this.pairedCards == this.cardAmount) {
                    setTimeout(() => {
                        this.handleWin();
                    }, this.turnDuration);
                }
            } else {
                this.closeCard(card);
                this.closeCard(previousCard);
                setTimeout(() => {
                    this.canOpen = true;
                    this.changeTurns();
                }, this.turnDuration * 5);
            }
        }
    }

    closeCard(card) {
        setTimeout(() => {
            io.to(this.id).emit("closeCard", {
                cardId: card.id,
                duration: this.turnDuration,
            });
        }, this.turnDuration * 4);
        setTimeout(() => {
            card.state = CARD_STATES.CLOSED;
        }, this.turnDuration * 5);
    }

    handleWin() {
        this.scores[this.turn]++;
        this.showScores();
        this.currentPlayer.emit("message", "You won the round!");
        this.otherPlayer.emit("message", "You lost the round!");
        setTimeout(() => {
            this.restart();
        }, 5 * this.turnDuration);
    }
}

module.exports = { Game };
