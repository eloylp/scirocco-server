
var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing DELETE operation of messages resource.', function () {

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

    it("Should delete a message, only the one that was sent by this node.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();
            var messages = [
                {
                    _id: toDeleteId,
                    node_destination: "af12345",
                    node_source: "af123",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"
                },
                {
                    node_destination: 'af123',
                    node_source: 'af123' + "23",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err)  throw err;

                request.delete(config.paths.messages + '/' + toDeleteId)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }

                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(1);
                        done();
                    });
            });
        });

    it("Should NOT delete a message that not belongs to it.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var message = {
                _id: toDeleteId,
                node_destination: "af123",
                node_source: "af1234",
                status: "pending",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);

            messageModel.save(function (err, res) {

                if (err)  throw err;

                request.delete(config.paths.messages + '/' + toDeleteId)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(0);
                        done();
                    });


            });
        });

    it("Should NOT delete a message, in processing state.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var message = {
                _id: toDeleteId,
                node_destination: "af12345",
                node_source: "af123",
                status: "pending",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);

            messageModel.save(function (err, res) {

                if (err)  throw err;

                model.message.findOneAndUpdate(
                    {_id: toDeleteId},
                    {status: 'processing'},
                    function (err, res) {

                        if (err) throw err;

                        request.delete(config.paths.messages + '/' + toDeleteId)
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .end(function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                (res.body.ok).should.be.true;
                                (res.body.n).should.be.equal(0);
                                done();
                            });

                    });


            });
        });

    it("Should NOT delete a message, in processed state.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var message = {
                _id: toDeleteId,
                node_destination: "af12345",
                node_source: "af123",
                status: "pending",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);

            messageModel.save(function (err, res) {

                if (err)  throw err;

                model.message.findOneAndUpdate(
                    {_id: toDeleteId},
                    {status: 'processed'},
                    function (err, res) {

                        if (err) throw err;

                        request.delete(config.paths.messages + '/' + toDeleteId)
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .expect(200)
                            .expect('Content-Type', /json/)
                            .end(function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                (res.body.ok).should.be.true;
                                (res.body.n).should.be.equal(0);
                                done();
                            });

                    });


            });
        });
});