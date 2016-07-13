//  Todo , need to rate limit and much more, i know.

exports.check = function (req, res, next) {

    if (req.app.get('config')['master_token'] === req.header("Authorization")) {
        next()
    } else {
        var err = new Error("Incorrect auth token.");
        err.status = 403;
        next(err);
    }
};