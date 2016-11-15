var should = require('should');
var config = require('../config');
var extend = require('util')._extend;

var module;

describe('Testing output Adapter module, it is responsible to generate output headers.', function () {


    beforeEach(function (done) {
        delete require.cache[require.resolve('../models/outputAdapter')];
        module = require('../models/outputAdapter');
        done();
    });


    it('Should clear unwanted keys from given object.', function (done) {

        var wantedKeys = Object.keys(config.headers);
        var objectWithUnwantedKeys = {"unwanted": "", "not": "", "wanted": ""};

        module.clearUnWantedKeys(objectWithUnwantedKeys, wantedKeys);

        (objectWithUnwantedKeys).should.not.have.ownProperty('unwanted');
        (objectWithUnwantedKeys).should.not.have.ownProperty('not');
        (objectWithUnwantedKeys).should.not.have.ownProperty('wanted');
        (Object.keys(objectWithUnwantedKeys).length).should.be.equal(0);
        done();

    });

    it('Should maintain wanted keys from given object.', function (done) {

        var wantedKeys = Object.keys(config.headers);
        var unwantedDict = {"unwanted": "", "not": "", "wanted": ""};
        var mixin = extend(config.headers, unwantedDict);
        module.clearUnWantedKeys(mixin, wantedKeys);

        for (var attr in config.headers) {

            (mixin).should.have.ownProperty(attr);

        }

        (Object.keys(mixin).length).should.be.equal(Object.keys(config.headers).length);
        done();

    });

    it('Should maintain especial wanted key _id from given object.', function (done) {

        var wantedKeys = Object.keys(config.headers);
        var wantedIdDict = {"_id": ""};
        module.clearUnWantedKeys(wantedIdDict, wantedKeys);

        (wantedIdDict).should.have.ownProperty('_id');
        done();

    });

    it('Should get the field data of an object', function (done) {
        var object = {"dat1": "1", "dat2": 22, "payload": "data"};
        var data = module.getData(object);
        (data).should.be.equal(object.payload);
        done();
    });

    it('Should get null if the field data of an object not exists.', function (done) {
        var object = {"dat1": "1", "dat2": 22};
        var data = module.getData(object);
        (data === null).should.be.true;
        done();
    });

    it('Should correctly convert an attribute to a suitable HTTP header', function (done) {

        var prefix = 'Prefix';
        var attr = 'update';
        var result = module.attrToheader(attr, prefix);

        (result).should.be.equal('Prefix-Update');
        done();

    });

    it('Should correctly convert an attribute (with double word _) to a suitable HTTP header', function (done) {

        var prefix = 'Prefix';
        var attr = 'update_time';
        var result = module.attrToheader(attr, prefix);

        (result).should.be.equal('Prefix-Update-Time');
        done();

    });

    it('Should correctly convert an attribute (with erroneus double _) to a suitable HTTP header', function (done) {

        var prefix = 'Prefix';
        var attr = 'update__time';
        var result = module.attrToheader(attr, prefix);
        (result).should.be.equal('Prefix-Update-Time');
        done();
    });

    it('Should NOT populate Content-Type header from scirocco data-type model field.', function (done) {
        var res = {
            calls: [],
            headers: {},
            json: function (data) {
                this.calls.push(data);

            },
            send: function (data) {
                this.calls.push(data);
            },
            set: function (header, value) {
                this.headers[header] = value;
            },
            get: function (header) {
                for (var h in this.headers) {
                    if (header == h) {
                        return this.headers[h];
                    }
                }
                return false;
            }
        };
        var resultsFixture = {
            node_destination: "af123",
            node_source: "af1234",
            payload: "base64data",
            payload_type: "application/pdf"
        };

        resultsFixture.toObject = function () {
            return this;
        };
        module.output(res, resultsFixture);
        console.log(res.headers);
        (res.headers).should.not.have.property('Content-Type');

        done();
    });

});