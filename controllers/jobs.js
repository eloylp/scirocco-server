var models = require('../models/models');

exports.load = function (req, res, next, jobId) {

    var resultCallback = function (err, results) {

        if (results) {
            req.job = results;
            next();
        } else if (err) {
            next(err);
        } else {
            err = new Error("resource not found");
            err.status = 404;
            next(err);
        }
    };

    models.job.findById(jobId, resultCallback);
};

exports.delete = function (req, res, next) {

    models.job.remove(req.job, function (err, results) {
        if(err){
            next(err);
        }else{
            res.json(results);
        }
    });
};

exports.deleteAll = function (req, res, next) {

    models.job.remove({}, function (err, results) {
        if(err){
            next(err);
        }else{
            res.json(results);
        }
    });
};

exports.update = function (req, res, next) {

    models.job.update({_id: req.job._id}, req.body, {runValidators: true}, function (err, results) {

        if (err) {
            next(err);
        } else {
            res.json(results);
        }
    });
};

exports.show = function (req, res) {
    res.json(req.job);
};

exports.index = function (req, res, next) {

    var resultCallback = function (err, results) {
        if (err) {
            next(err);
        } else {
            res.json(results);
        }
    };

    models.job.find({}, resultCallback);
};

exports.create = function (req, res, next) {

    var admUser = new models.job(req.body);
    admUser.save(function (err, result) {
        if (err) {
            next(err);
        } else {
            res.header('Location', '/jobs/' + result._id);
            res.status(201).json(result);
        }
    });
};
