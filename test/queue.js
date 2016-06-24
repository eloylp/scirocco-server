/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var path = '/queue';
var config = require('../test/config');


describe('Testing queue resource.', function () {

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

    it("Should pull a message from queue. Must return it in processing state.", function (done) {

        var messages = [
            {
                to_node_id: config.fromHeaderValue,
                from_node_id: config.fromHeaderValue,
                status: "pending",
                data: {name: "test"},
                type: "email"
            },
            {
                to_node_id: config.fromHeaderValue,
                from_node_id: config.fromHeaderValue,
                status: "pending",
                data: {name: "test"},
                type: "email"
            }
        ];

        model.message.insertMany(messages);

        request.get(path)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                (res.body.to_node_id).should.be.equal(config.fromHeaderValue);
                (res.body.from_node_id).should.be.equal(config.fromHeaderValue);
                (res.body.status).should.be.equal('processing');
                done();
            });
    });

    it("Should push a message to queue, and return it in pending state.", function (done) {

        request.post(path)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: "09af1",
                data: {name: "test"},
                type: "email"
            })
            .expect('Content-Type', /json/)
            .expect('Location', /\/messages\/[0-9a-f]/)
            .expect(201)
            .end(function (err, res) {

                (res.body.status).should.be.equal('pending');
                (res.body.from_node_id).should.be.equal(config.fromHeaderValue);
                (res.body.data).should.be.instanceOf(Object);
                (res.body.type).should.be.equal('email');
                (res.body.to_node_id).should.be.equal('09af1');
                done();
            });
    });

    it("Should ack an existing message as processed.", function (done) {

        /// Post the message.
        request.post(path)
            .set('Authorization', config.token)
            .set('Content-Type', 'application/json')
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: config.fromHeaderValue,
                data: {"name": "tester"}
            })
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                /// Get the message.
                request.get(path)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }
                        /// Ack message
                        request.patch(path + '/' + res.body._id + '/ack')
                            .set('Authorization', config.token)
                            .set(config.fromHeader, config.fromHeaderValue)
                            .end(function (err, res) {
                                if (err) {
                                    throw err;
                                }
                                (res.body.status).should.be.equal('processed');
                                done();

                            });
                    });
            });
    });

});