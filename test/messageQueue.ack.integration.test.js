/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');
var uuid = require('node-uuid');


describe('Testing ACK operation of messageQueue resource.', function () {

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

    it("Should ack an existing message 'inprocessing' and return it as 'processed'.", function (done) {

        /// Post the message.
        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .set('Content-Type', 'application/json')
            .set(config.headers.node_source, 'af123')
            .set(config.headers.node_destination, 'af123')
            .send({"name": "tester"})
            .end(function (err, res) {

                if (err)  throw err;
                /// Get the message. Now in processing status.
                request.get(config.paths.messageQueue)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .end(function (err, res) {

                        if (err)   throw err;
                        /// Ack message, and get it in 'processed'.
                        request.patch([config.paths.messageQueue, res.headers[config.headers.id.toLowerCase()], 'ack'].join("/"))
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .end(function (err, res) {

                                if (err)    throw err;
                                (res.headers[config.headers.status.toLowerCase()]).should.be.equal('processed');
                                done();

                            });
                    });
            });
    });

    it("Should return 404 trying to ack a non previously pulled  message in pending state.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set('Content-Type', 'application/json')
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err)throw err;
                    request.patch([config.paths.messageQueue, res.headers[config.headers.id.toLowerCase()], 'ack'].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(404)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {
                            if (err)throw err;
                            done();
                        });
                });
        });

    it("Should return 404 trying to ack a non previously pulled  message in scheduled state.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set('Content-Type', 'application/json')
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'scheduled')
                .set(config.headers.scheduled_time, Date.now() + 1000000)
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {

                    if (err) throw err;

                    request.patch([config.paths.messageQueue, res.headers[config.headers.id.toLowerCase()], 'ack'].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(404)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {
                            if (err)throw err;
                            done();
                        });
                });
        });

    it("Should get 404 trying to ack an processed message.", function (done) {

        /// Preparing the test .... Post the message.
        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .set('Content-Type', 'application/json')
            .set(config.headers.node_source, 'af123')
            .set(config.headers.node_destination, 'af123')
            .send({"name": "tester"})
            .end(function (err, res) {

                if (err)  throw err;

                /// Preparing the test .... Get the message. Now in processing status.
                request.get(config.paths.messageQueue)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .end(function (err, res) {

                        if (err)   throw err;
                        /// Preparing the test .... Ack message.
                        var ackUrl = [config.paths.messageQueue, res.headers[config.headers.id.toLowerCase()], 'ack'].join("/");

                        request.patch(ackUrl)
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .end(function (err, res) {
                                if (err)    throw err;
                                /// Doing the test.
                                request.patch(ackUrl)
                                    .set('Authorization', config.master_token)
                                    .set(config.headers.node_source, 'af123')
                                    .expect(404)
                                    .end(function (err, res) {

                                        if (err)    throw err;
                                        (res.body.message).should.be.equal('Resource not found.');
                                        done();
                                    });
                            });
                    });
            });
    });
});