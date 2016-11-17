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


describe('Testing messageQueue pull operation.', function () {

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

    it("Should return an empty object and a 204 status code if no messages remaining.", function (done) {

        request.get(config.paths.messageQueue)
            .set(config.headers.node_source, 'af123')
            .set('Authorization', config.master_token)
            .expect(204)
            .end(function (err, res) {
                if (err) throw err;
                done();
            });
    });

    it("Should return an empty object and a 204 status code if no node source setted.", function (done) {

        request.get(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .expect(204)
            .end(function (err, res) {
                if (err) throw err;
                done();
            });
    });

    it("Should pull one message from queue. Must return it in processing state with respective time meatdata.",
        function (done) {

            var messages = [
                {
                    node_destination: "af123",
                    node_source: "af123",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                },
                {
                    node_destination: 'af123',
                    node_source: 'af123',
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err) throw err;

                request.get(config.paths.messageQueue)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {

                        if (err)  throw err;

                        (res.headers[config.headers.status.toLowerCase()]).should.be.equal('processing');
                        var processing_time = res.headers[config.headers.processing_time.toLowerCase()];
                        (Date.parse(processing_time)).should.be.greaterThan(Date.now() - 15000);
                        done();
                    });
            });
        });

    it("Should return tries incremented by one when pull a message.",
        function (done) {

            var message = {

                node_source: "af123",
                node_destination: "af123",
                payload: {name: "test"},
                payload_type: "application/json"

            };

            var modelMessage = new model.message(message);

            modelMessage.save(function (err, res) {

                if (err)throw err;

                request.get(config.paths.messageQueue)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err)throw err;

                        (parseInt(res.headers[config.headers.tries.toLowerCase()])).should.be.exactly(1);
                        done();
                    });

            });
        });
});