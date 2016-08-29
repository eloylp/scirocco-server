/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var config = require('../test/config');
var uuid = require('node-uuid');


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

    it("Should return an empty object and a 204 status code if no messages remaining.", function (done) {

        request.get(config.paths.messageQueue)
            .set(config.from_header, config.from_header_value)
            .set('Authorization', config.token)
            .expect(204)
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                (res.body).should.be.instanceOf(Object);
                done();
            });
    });

    it("Should pull one message from queue. Must return it in processing state.", function (done) {

        var messages = [
            {
                to: config.from_header_value,
                from: config.from_header_value,
                status: "pending",
                data: {name: "test"}

            },
            {
                to: config.from_header_value,
                from: config.from_header_value,
                status: "pending",
                data: {name: "test"}
            }
        ];

        model.message.insertMany(messages, function (err, res) {

            if (err) {
                throw err;
            }

            request.get(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    (res.headers[config.to_header.toLowerCase()]).should.be.equal(config.from_header_value);
                    (res.headers[config.from_header.toLowerCase()]).should.be.equal(config.from_header_value);
                    (res.headers[config.status_header.toLowerCase()]).should.be.equal('processing');
                    done();
                });
        });
    });

    it("Should push a message to queue, and return it in pending state.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            .set(config.from_header, config.from_header_value)
            .set(config.to_header, "09af1")
            .send({name: "test"})
            .expect('Content-Type', /json/)
            .expect('Location', /\/messages\/[0-9a-f]/)
            .expect(201)
            .end(function (err, res) {

                (res.headers[config.status_header.toLowerCase()]).should.be.equal('pending');
                (res.headers[config.from_header.toLowerCase()]).should.be.equal(config.from_header_value);
                (res.headers[config.to_header.toLowerCase()]).should.be.equal('09af1');
                (res.body).should.be.instanceOf(Object).and.have.property('name');
                (res.body.name).should.be.equal('test');

                done();
            });
    });

    it("Should ack an existing message as processed.", function (done) {
        //TODO continue here ....
        /// Post the message.
        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            .set('Content-Type', 'application/json')
            .set(config.from_header, config.from_header_value)
            .send({
                to: config.from_header_value,
                data: {"name": "tester"}
            })
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                /// Get the message.
                request.get(config.paths.messageQueue)
                    .set('Authorization', config.token)
                    .set(config.from_header, config.from_header_value)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }
                        /// Ack message
                        request.patch(config.paths.messageQueue + '/' + res.body._id + '/ack')
                            .set('Authorization', config.token)
                            .set(config.from_header, config.from_header_value)
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

    it("Should push a message and return the created one.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            .set(config.from_header, config.from_header_value)
            .send({
                to: "09af1",
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

    it("Should get bad request when pushing a message without 'from header'.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            //.set(config.from_header, config.from_header_value)
            .send({
                to: "09af1",
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
                (res.body.errors).should.be.an.instanceOf(Object).and.have.property('from');
                done();
            });
    });

    it("Should return same data with correct _id when a complete message is pushed. Other data must be null.",
        function (done) {

            var group_id = uuid.v4();

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
                    group_id: group_id,
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
                        .set(config.from_header, config.from_header_value)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body).should.be.an.instanceOf(Object).and.have.property('_id');
                            (res.body._id).should.be.exactly(resp.header.location.split("/").pop());
                            (res.body.status).should.be.exactly("pending");
                            (res.body.from).should.be.exactly("af123");
                            (res.body.to).should.be.exactly("09af1");
                            (res.body.type).should.be.exactly("email");
                            (res.body.description).should.be.exactly("description");
                            (res.body.group_id).should.be.exactly(group_id);
                            (res.body.queue_id).should.be.exactly("09af1");
                            (res.body.tries).should.be.exactly(0);
                            (res.body.data).should.be.instanceOf(Object).and.have.property('name');
                            (res.body.data.name).should.be.exactly("test");
                            done();
                        });
                });
        });


    it("Should return a pending message status when pushing a message with wrong status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
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
                        .set(config.from_header, config.from_header_value)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Should accept scheduled state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
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
                        .set(config.from_header, config.from_header_value)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("scheduled");
                            done();
                        });
                });
        });

    it("Should accept pending state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
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
                        .set(config.from_header, config.from_header_value)
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.body.status).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Should return bad request 400 when pushing a message with no valid status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
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

    it("Should rewrite system message fields when a message try to cover them.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .send({
                    to: "09af1",
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
                        .set(config.from_header, config.from_header_value)
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