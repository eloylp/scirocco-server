/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var fs = require('fs');
var path = require('path');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing api data types support.', function () {


    beforeEach(function () {
        delete require.cache[require.resolve('../bin/www')];
        server = require('../bin/www');
    });

    afterEach(function (done) {
        server.close(done);
    });

    it("Should send a pdf file and get it without errors.", function (done) {


        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .set('Content-Type', 'application/octet-stream')
            .set(config.headers.from, 'af123')
            .set(config.headers.to, "af123")
            .send(fs.createReadStream(path.join(__dirname, '/fixtures/tux.pdf')))
            .expect(201)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                console.log(res);
                done();
            });

    });

});