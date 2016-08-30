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
            .set(config.to_header, config.from_header_value)
            .send({"name": "tester"})
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
                        request.patch([config.paths.messageQueue, res.headers[config.id_header.toLowerCase()], 'ack'].join("/"))
                            .set('Authorization', config.token)
                            .set(config.from_header, config.from_header_value)
                            .end(function (err, res) {
                                if (err) {
                                    throw err;
                                }

                                (res.headers[config.status_header.toLowerCase()]).should.be.equal('processed');
                                done();

                            });
                    });
            });
    });

    it("Should push a message and return the created one.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            .set(config.from_header, config.from_header_value)
            .set(config.to_header, '09af1')
            .set(config.status_header, 'pending')
            .send({
                name: "test"
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .expect('Location', /\/messages\/[0-9a-f]/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Object).and.have.property('name');
                (res.headers[config.id_header.toLowerCase()]).should.be.equal(res.header.location.split("/").pop());
                done();
            });
    });

    it("Should get bad request when pushing a message without 'from header'.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.token)
            //.set(config.from_header, config.from_header_value)
            .set(config.to_header, '09af1')
            .set(config.status_header, 'pending')
            .send({name: "test"})
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

    it("Should return same data with correct _id when a complete message is pushed. Other data must not exist.",
        function (done) {


            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .send({name: "test"})
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

                            (res.headers[config.id_header.toLowerCase()]).should.be.exactly(resp.header.location.split("/").pop());
                            (res.headers[config.status_header.toLowerCase()]).should.be.exactly("pending");
                            (res.headers[config.from_header.toLowerCase()]).should.be.exactly(config.from_header_value);
                            (res.headers[config.to_header.toLowerCase()]).should.be.exactly(config.from_header_value);
                            (res.headers[config.tries_header.toLowerCase()]).should.be.exactly('0');
                            (res.body).should.be.an.instanceOf(Object).and.have.property('name');
                            (res.body.name).should.be.exactly("test");
                            done();
                        });
                });
        });


    it("Should return a pending message status when pushing a message with wrong status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .set(config.status_header, 'processing')
                .send({name: "test"})
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
                            (res.headers[config.status_header.toLowerCase()]).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Should accept scheduled state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .set(config.status_header, 'scheduled')
                .send({name: "test"})
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
                            (res.headers[config.status_header.toLowerCase()]).should.be.exactly("scheduled");
                            done();
                        });
                });
        });

    it("Should accept pending state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .set(config.status_header, 'pending')
                .send({name: "test"})
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
                            (res.headers[config.status_header.toLowerCase()]).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Should return bad request 400 when pushing a message with no valid status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .set(config.status_header, 'pendinggggggggggggggggggggggggggggggggggggg')
                .send({name: "test"})
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

    it("Should ignore system message system headers when a user try to cover them.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .set(config.to_header, config.from_header_value)
                .set(config.tries_header, 23)
                .set(config.update_time_header, new Date())
                .set(config.scheduled_time_header, new Date())
                .set(config.processing_time_header, new Date())
                .set(config.processed_time_header, new Date())
                .set(config.error_time_header, new Date())
                .send({name: "test"})
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
                            (res.headers).should.have.ownProperty(config.tries_header.toLowerCase());
                            (res.headers).should.have.ownProperty(config.created_time_header.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.update_time_header.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.scheduled_time_header.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.processed_time_header.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.error_time_header.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.processed_time_header.toLowerCase());
                            done();
                        });
                });
        });
});