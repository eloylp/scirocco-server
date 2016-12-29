

var supertest = require('supertest');
var should = require('should');
var fs = require('fs');
var path = require('path');
var model = require('../models/models');


var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing server data types support.', function () {


    beforeEach(function (done) {
        delete require.cache[require.resolve('../bin/www')];
        server = require('../bin/www');
        model.message.remove({}, done);

    });

    afterEach(function (done) {
        server.close(function () {
            model.message.remove({}, done);
        });
    });

    it("Should send a pdf file and get it without errors.", function (done) {

        fs.readFile(path.join(__dirname, '/fixtures/tux.pdf'), function (err, file) {
            if (err) throw err;

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set('Content-Type', 'application/octet-stream')
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, "af123")
                .send(file)
                .expect(201)
                .end(function (err, res) {
                    if (err) throw err;

                    request.get(config.paths.messageQueue)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        // .expect('Content-Type', /octet-stream/)
                        .expect(200)
                        .end(function (err, res) {
                            if (err) throw err;

                            (res.body).should.be.equal(file.toString('base64'));
                            done();
                        });
                });
        });
    });

    it("Should can push an string (text-plain) in body.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set('Content-Type', 'text/plain')
                .send('string')
                .expect('Content-Type', /text/)
                .expect('string', done);
        });

});
