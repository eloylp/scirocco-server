exports.output = function (res, results, headerPrefix) {

    var responseBody;
    for (var attr in results.toObject()) {

        if (attr == 'data') {
            responseBody = results[attr];
        } else {

            if (results[attr] !== null && ['__v'].indexOf(attr) == -1) {
                var splitedAttr = attr.split('_');
                var words = [];
                for (var i = 0, l = splitedAttr.length; i < l; i++) {
                    words.push(splitedAttr[i].charAt(0).toUpperCase() + splitedAttr[i].slice(1));
                }
                var headerName = [headerPrefix, words.join('-')].join('-').replace('--', '-');
                res.set(headerName, results[attr])
            }
        }
    }
    res.json(responseBody);

};
