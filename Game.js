const fetch = require("node-fetch");
const { io } = require("./socket");

const games = [];

const CARD_STATES = {
    OPEN: 0,
    CLOSED: 1,
    PAIRED: 2,
};

const oneHour = 1000 * 60 * 60;

function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
}

class Game {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.scores = [0, 0];
        this.pairedCards = 0;
        this.previousCard = null;
        this.turnDuration = 250;
        this.cardAmount = 16;
        this.cardWidth = 100;
        this.cardHeight = 140;
        this.cards = [];
        this.canOpen = false;
        this.turn = 0;
        this.round = 1;
        this.lastMoveTime = null;
        games.push(this);
    }

    static findGameById(id) {
        return games.find((game) => game.id === id);
    }

    static findGameByPlayer(socket) {
        return games.find((game) => game.players.includes(socket));
    }

    get currentPlayer() {
        return this.players[this.turn];
    }

    get otherPlayer() {
        return this.players[1 - this.turn];
    }

    remove({ reason }) {
        const index = games.findIndex((game) => game.id === this.id);
        games.splice(index, 1);
        io.to(this.id).emit("redirectHome", { reason });
    }

    start() {
        for (const player of this.players) {
            player.join(this.id);
        }
        io.to(this.id).emit("gameStart", {
            cardAmount: this.cardAmount,
        });
        this.showScores();
        this.showTurn();
        this.lastMoveTime = new Date().getTime();
        setTimeout(() => this.removeWhenIdle(), oneHour);
    }

    async restart() {
        for (const card of this.cards) {
            this.closeCard(card);
        }
        io.to(this.id).emit("loading", true);
        await this.generateCards();
        io.to(this.id).emit("loading", false);
        this.round++;
        this.turn = this.round % 2 === 0 ? 1 : 0;
        this.showTurn();
    }

    showTurn() {
        this.currentPlayer.emit("turn");
        this.otherPlayer.emit("noturn");
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
        this.canOpen = false;
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

        this.canOpen = true;
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
        this.restart();
    }

    removeWhenIdle() {
        const currentTime = new Date().getTime();
        if (currentTime - this.lastMoveTime > oneHour) {
            this.remove({ reason: "This game has been detected as idle." });
        } else {
            setTimeout(() => this.removeWhenIdle(), oneHour);
        }
    }
}

module.exports = { Game };
