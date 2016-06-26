/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var config = require('../test/config');


describe('Testing messageQueue resource.', function () {

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

        request.get(config.paths.messageQueue)
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

        request.post(config.paths.messageQueue)
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
        request.post(config.paths.messageQueue)
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
                request.get(config.paths.messageQueue)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }
                        /// Ack message
                        request.patch(config.paths.messageQueue + '/' + res.body._id + '/ack')
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

    it("Push a message will be ok and must return created one.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: "09af1",
                status: "pending",
                data: {name: "test"},
                type: "email"
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .expect('Location', /\/messages\/[0-9a-f]/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Object).and.have.property('data');
                (res.body._id).should.be.equal(res.header.location.split("/").pop());
                done();
            });
    });

    it("Push a message without 'from header'. will get bad request.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            //.set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: "09af1",
                status: "pending",
                data: {name: "test"},
                type: "email"
            })
            .expect(400)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Object).and.have.property('errors');
                (res.body.errors).should.be.an.instanceOf(Object).and.have.property('from_node_id');
                done();
            });
    });

    it("Push a max message and recover it. Same data with _id expected. Other data will be null.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    group_id: "09af1",
                    queue_id: "09af1",
                    data: {name: "test"},
                    type: "email",
                    description: "description"
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    var resp = res;

                    request.get(res.header.location)
                        .set('Authorization', config.token)
                        .set(config.fromHeader, config.fromHeaderValue)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body).should.be.an.instanceOf(Object).and.have.property('_id');
                            (res.body._id).should.be.exactly(resp.header.location.split("/").pop());
                            (res.body.status).should.be.exactly("pending");
                            (res.body.from_node_id).should.be.exactly("af123");
                            (res.body.to_node_id).should.be.exactly("09af1");
                            (res.body.type).should.be.exactly("email");
                            (res.body.description).should.be.exactly("description");
                            (res.body.group_id).should.be.exactly("09af1");
                            (res.body.queue_id).should.be.exactly("09af1");
                            (res.body.tries).should.be.exactly(0);
                            (res.body.data).should.be.instanceOf(Object).and.have.property('name');
                            (res.body.data.name).should.be.exactly("test");
                            done();
                        });
                });
        });


    it("Push a message with wrong status, may be always equal to pending.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    status: "processing",
                    data: {name: "test"},
                    type: "email"
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.token)
                        .set(config.fromHeader, config.fromHeaderValue)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Scheduled state is allowed in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    status: "scheduled",
                    data: {name: "test"},
                    type: "email"
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.token)
                        .set(config.fromHeader, config.fromHeaderValue)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("scheduled");
                            done();
                        });
                });
        });

    it("Pending state is allowed in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    status: "pending",
                    data: {name: "test"},
                    type: "email"
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.token)
                        .set(config.fromHeader, config.fromHeaderValue)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Push a message with no valid status is a bad request.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    status: "pendinggggggggggggggggggggggggggggggggggggg",
                    data: {name: "test"},
                    type: "email"
                })
                .expect(400)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    (res.body).should.be.an.instanceOf(Object).and.have.property('errors');
                    (res.body.errors).should.be.an.instanceOf(Object).and.have.property('status');
                    done();
                });
        });

    it("System message fields are rewrited by app.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: "09af1",
                    status: "pending",
                    data: {name: "test"},
                    type: "email",

                    /// This fields are only for system.
                    tries: 23,
                    creation_time: new Date(),
                    update_time: new Date(),
                    scheduled_time: new Date(),
                    processing_time: new Date(),
                    error_time: new Date(),
                    processed_time: new Date()
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.token)
                        .set(config.fromHeader, config.fromHeaderValue)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.tries).should.be.exactly(0);
                            (res.body.creation_time === null).should.be.true;
                            (res.body.update_time === null).should.be.true;
                            (res.body.scheduled_time === null).should.be.true;
                            (res.body.processing_time === null).should.be.true;
                            (res.body.error_time === null).should.be.true;
                            (res.body.processed_time === null).should.be.true;
                            done();
                        });
                });
        });
});