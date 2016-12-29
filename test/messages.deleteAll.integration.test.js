

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing DELETE_ALL operation of messages resource.', function () {

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

    it("Should remove all the messages only for present node.",
        function (done) {

            var messages = [
                {
                    node_destination: "af1234",
                    node_source: "af123",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                },
                {
                    node_destination: "af1234",
                    node_source: "af123",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                },
                /// This message must not be deleted, because it not belongs or emitted
                /// to testing node.
                {
                    node_destination: "af123" + "23",
                    node_source: "af123" + "23",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {
                if (err)  throw err;

                request.delete(config.paths.messages)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err)  throw err;
                        (res.body).should.be.instanceOf(Object);
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(2);
                        done();
                    });
            });
        });

    it("Should NOT remove any messages since none of them belongs to this node.",
        function (done) {

            var messages = [
                {
                    node_destination: "af123",
                    node_source: "af123234",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                },
                {
                    node_destination: "af1234",
                    node_source: "af1243",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                },

                {
                    node_destination: "af12323",
                    node_source: "af12323",
                    status: "pending",
                    payload: {name: "test"},
                    payload_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {
                if (err)  throw err;

                request.delete(config.paths.messages)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err)  throw err;
                        (res.body).should.be.instanceOf(Object);
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(0);
                        done();
                    });
            });
        });
});