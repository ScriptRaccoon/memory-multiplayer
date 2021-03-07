const shortid = require("shortid");

function showHome(req, res) {
    const id = shortid.generate();
    res.render("home", { id });
}

module.exports = { showHome };
