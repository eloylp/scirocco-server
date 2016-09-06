exports.notFoundRedir = function () {

    return function (req, res, next) {
        // catch 404 and forward to error handler
        var err = new Error('Not Found');
        err.status = 404;
        next(err);

    }
};

exports.develop = function () {
    return function (err, req, res, next) {
        if (err.name == 'ValidationError') {
            res.status(400);
        } else if (err.status) {
            res.status(err.status);
        } else {
            res.status(500);
        }
        res.json({
            message: err.message,
            errors: err.errors
        });
    };
};

exports.production = function () {
    return function (err, req, res, next) {
        if (err.name == 'ValidationError') {
            res.status(400);
        } else if (err.status) {
            res.status(err.status);
        } else {
            res.status(500);
        }
        res.json({
            message: err.message,
            errors: err.errors
        });

    };
};