

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing GET operation of messages resource.', function () {

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

    it("Should return an empty object and a 404 status code if no messages found.",
        function (done) {
            var nonExistant = require('mongoose').Types.ObjectId();

            request.get([config.paths.messages, nonExistant].join('/'))
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .expect(404)
                .end(function (err, res) {
                    if (err)  throw err;
                    (res.body.message).should.be.equal('Resource not found.');
                    done();
                });
        });

    it("Should return a message in pending state and only being sender.",
        function (done) {

            var preId = require('mongoose').Types.ObjectId();


            var message = {
                _id: preId,
                node_source: "af123",
                node_destination: "af1234",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                if (err)throw err;

                request.get([config.paths.messages, preId].join('/'))
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        done();
                    });
            });
        });

    it("Should return a message in pending state and only being receiver.",
        function (done) {

            var preId = require('mongoose').Types.ObjectId();


            var message = {
                _id: preId,
                node_source: "af123454",
                node_destination: "af123",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                if (err)throw err;

                request.get([config.paths.messages, preId].join('/'))
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        done();
                    });
            });
        });

    it("Should return a message in scheduled state and only being sender.",
        function (done) {

            var preId = require('mongoose').Types.ObjectId();


            var message = {
                _id: preId,
                node_source: "af123",
                node_destination: "af1234",
                status: "scheduled",
                schedule_time: Date.now() + 100000,
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                if (err)throw err;

                request.get([config.paths.messages, preId].join('/'))
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        done();
                    });
            });
        });

    it("Should return a message in scheduled state and only being receiver.",
        function (done) {

            var preId = require('mongoose').Types.ObjectId();
            var message = {
                _id: preId,
                node_source: "af123454",
                node_destination: "af123",
                status: "scheduled",
                schedule_time: Date.now() + 100000,
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                if (err)throw err;

                request.get([config.paths.messages, preId].join('/'))
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        done();
                    });
            });
        });

    it("Should return message in 'processed' state being sender.",
        function (done) {
            var preId = require('mongoose').Types.ObjectId();

            var message = {
                _id: preId,
                node_source: "af123",
                node_destination: "af123234234",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                model.message.findOneAndUpdate({_id: res.id}, {status: 'processed'}, function (err, res) {

                    if (err)throw err;

                    request.get([config.paths.messages, preId].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) throw err;
                            done();
                        });
                });
            });
        });

    it("Should return message in 'processed' state being receiver.",
        function (done) {
            var preId = require('mongoose').Types.ObjectId();

            var message = {
                _id: preId,
                node_source: "af12234243",
                node_destination: "af123",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                model.message.findOneAndUpdate({_id: res.id}, {status: 'processed'}, function (err, res) {

                    if (err)throw err;

                    request.get([config.paths.messages, preId].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) throw err;
                            done();
                        });
                });
            });
        });

    it("Should return message in 'processing' state being sender.",
        function (done) {
            var preId = require('mongoose').Types.ObjectId();

            var message = {
                _id: preId,
                node_source: "af123",
                node_destination: "af1232423",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                model.message.findOneAndUpdate({_id: res.id}, {status: 'processing'}, function (err, res) {

                    if (err)throw err;

                    request.get([config.paths.messages, preId].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) throw err;
                            done();
                        });
                });
            });
        });

    it("Should return message in 'processing' state being receiver.",
        function (done) {
            var preId = require('mongoose').Types.ObjectId();

            var message = {
                _id: preId,
                node_source: "af123234",
                node_destination: "af123",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                model.message.findOneAndUpdate({_id: res.id}, {status: 'processing'}, function (err, res) {

                    if (err)throw err;

                    request.get([config.paths.messages, preId].join('/'))
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) throw err;
                            done();
                        });
                });
            });
        });

});