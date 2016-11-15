var config = require('../config');

exports.output = function (res, results) {

    var headerPrefix = config.header_prefix;

    var object = results.toObject();
    var responseBody = this.getData(object);
    this.clearUnWantedKeys(object, Object.keys(config.headers));

    for (var attr in object) {

        res.set(this.attrToheader(attr, headerPrefix), this.performValue(object[attr]));
    }

    res.send(responseBody);

};

exports.clearUnWantedKeys = function (object, allowedKeys) {

    allowedKeys.push('_id');
    for (var attr in object) {

        if (allowedKeys.indexOf(attr) == -1 || object[attr] === null) {
            delete object[attr];
        }
    }
};

exports.getData = function (object) {

    for (var attr in object) {

        if (attr == 'payload') {
            return object[attr];
        }
    }

    return null;
};


exports.attrToheader = function (attr, headerPrefix) {

    var splitedAttr = attr.split('_');
    var words = [];
    for (var i = 0, l = splitedAttr.length; i < l; i++) {
        words.push(splitedAttr[i].charAt(0).toUpperCase() + splitedAttr[i].slice(1));
    }
    return [headerPrefix, words.join('-')].join('-').replace('--', '-');

};

exports.performValue = function (value) {

    return /^\d+$/.test(value) ? parseInt(value) : value;

};