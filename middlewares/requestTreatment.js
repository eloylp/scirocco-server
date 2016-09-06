var config = require('../config');

exports.checkContentType = function () {

    return function (req, res, next) {

        if (req.method == 'POST') {

            var contentType = req.header('Content-Type');
            var presentInConfig = (config.contentsAllowed.indexOf(contentType) != -1);

            if (contentType && presentInConfig) {
                next();
            } else {
                var err = new Error("Please, specify a valid Content-Type values. " +
                    "Valid choices are .. " + config.contentsAllowed.join(', '));

                err.status = 400;
                next(err);
            }

        } else {
            next();
        }

    };


};