const fetch = require("node-fetch");
const shortid = require("shortid");

const { io } = require("./socket.js");

const games = [];

const CARD_STATES = {
    OPEN: 0,
    CLOSED: 1,
    PAIRED: 2,
};

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
}

class Game {
    constructor() {
        this.id = shortid.generate();
        this.players = [];
        this.scores = [0, 0];
        this.pairedCards = 0;
        this.previousCard = null;
        this.turnDuration = 250;
        this.cardAmount = 16;
        this.cardWidth = 100;
        this.cardHeight = 140;
        this.cards = [];
        this.canOpen = true;
        this.generateCards();
        this.turn = 0;
        this.round = 1;
        games.push(this);
    }

    static findGameById(id) {
        return games.find((game) => game.id === id);
    }

    static findGameByPlayer(id) {
        return games.find((game) => game.players.includes(id));
    }

    remove() {
        const index = games.findIndex((game) => game.id === this.id);
        games.splice(index, 1);
        for (const player of this.players) {
            io.to(player).emit("redirectHome");
            io.to(player).emit("redirectHome");
        }
    }

    restart() {
        for (const card of this.cards) {
            this.closeCard(card);
        }
        this.generateCards();
        setTimeout(() => {
            this.round++;
            this.turn = this.round % 2 === 0 ? 1 : 0;
            this.showScores();
            this.showTurn();
        }, 6 * this.turnDuration);
    }

    start() {
        for (let i = 0; i < 2; i++) {
            io.to(this.players[i]).emit("gameStart", {
                index: i,
                cardAmount: this.cardAmount,
            });
        }
        this.showScores();
        this.showTurn();
    }

    showTurn() {
        io.to(this.players[this.turn]).emit("turn");
        io.to(this.players[1 - this.turn]).emit("noturn");
    }

    showScores() {
        for (let i = 0; i < 2; i++) {
            io.to(this.players[i]).emit("scores", {
                round: this.round,
                scores: this.scores,
            });
        }
    }

    changeTurns() {
        this.turn = 1 - this.turn;
        this.showTurn();
    }

    async generateCards() {
        this.pairedCards = 0;
        this.previousCard = null;
        this.cards = [];
        const imageURLs = [];
        for (let i = 0; i < this.cardAmount / 2; i++) {
            try {
                const response = await fetch(
                    `https://unsplash.it/${this.cardWidth}/${this.cardHeight}`
                );
                const { url } = response;
                imageURLs.push(url);
                imageURLs.push(url);
            } catch (err) {
                console.log(err);
                return;
            }
        }

        shuffle(imageURLs);

        for (let i = 0; i < this.cardAmount; i++) {
            this.cards[i] = { id: i, image: imageURLs[i], state: CARD_STATES.CLOSED };
        }
    }

    openCard(cardId) {
        const card = this.cards[cardId];
        if (card.state != CARD_STATES.CLOSED) return;
        if (!this.canOpen) return;
        card.state = CARD_STATES.OPEN;
        for (const player of this.players) {
            io.to(player).emit("openCard", {
                cardId: cardId,
                image: card.image,
                duration: this.turnDuration,
            });
        }
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
            for (const player of this.players) {
                io.to(player).emit("closeCard", {
                    cardId: card.id,
                    duration: this.turnDuration,
                });
            }
        }, this.turnDuration * 4);
        setTimeout(() => {
            card.state = CARD_STATES.CLOSED;
        }, this.turnDuration * 5);
    }

    handleWin() {
        this.scores[this.turn]++;
        const winner = this.players[this.turn];
        const loser = this.players[1 - this.turn];
        io.to(winner).emit("win", "You won the game!");
        io.to(loser).emit("win", "Your opponent won the game!");
        this.restart();
    }
}

module.exports = { Game };
