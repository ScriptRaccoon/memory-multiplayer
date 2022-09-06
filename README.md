# Memory

This is a multiplayer memory game app.

https://playmemory.onrender.com

The app creates links, including a game id, which can be shared with anyone to start the game. You can also adjust the number of rounds as well as the number of cards per round (which has to be even).

Once two players have opened the link, the game starts. If you join the game later, you become a viewer, thus see everything what the players do. There is a score board which shows who has won how many rounds.

The images for the cards are generated randomly using [unsplash](https://unsplash.com/).

Currently the frontend is built with jQuery, which is considered to be obsolete. Maybe it will be replaced by a more modern framework at some point. The backend is built with Node, express, socket.io and ejs templates.
