/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var config = require('../test/config');


describe('Testing batchQueue resource.', function () {

    beforeEach(function (done) {
        delete require.cache[require.resolve('../bin/www')];
        server = require('../bin/www');
        model.batch.remove({}, done);
    });

    afterEach(function (done) {
        server.close(function () {
            model.batch.remove({}, done);
        });
    });

    it("Should one message from queue. Must return it in processing state.", function (done) {

        var batches = [
            {
                to_node_id: config.fromHeaderValue,
                from_node_id: config.fromHeaderValue,
                status: "pending",
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            },
            {
                to_node_id: config.fromHeaderValue,
                from_node_id: config.fromHeaderValue,
                status: "pending",
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            }
        ];

        model.batch.insertMany(batches);

        request.get(config.paths.batchQueue)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                (res.body).should.be.instanceOf(Object);
                (res.body.to_node_id).should.be.equal(config.fromHeaderValue);
                (res.body.from_node_id).should.be.equal(config.fromHeaderValue);
                (res.body.status).should.be.equal('processing');
                done();
            });
    });

    it("Should push a batch to queue, and return it in pending state.", function (done) {

        request.post(config.paths.batchQueue)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: config.fromHeaderValue,
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            })
            .expect('Content-Type', /json/)
            .expect('Location', /\/batches\/[0-9a-f]/)
            .expect(201)
            .end(function (err, res) {

                (res.body).should.be.instanceOf(Object);
                (res.body.status).should.be.equal('pending');
                done();
            });
    });

    it("Should ack an existing batch as processed.", function (done) {

        /// Post the message.
        request.post(config.paths.batchQueue)
            .set('Authorization', config.token)
            .set('Content-Type', 'application/json')
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: config.fromHeaderValue,
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            })
            .end(function (err, res) {

                if (err) {
                    throw err;
                }
                /// Get the message.
                request.get(config.paths.batchQueue)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }
                        /// Ack message
                        request.patch(config.paths.batchQueue + '/' + res.body._id + '/ack')
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

    it("Should push a batch and must return created one.", function (done) {

        request.post(config.paths.batchQueue)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: config.fromHeaderValue,
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .expect('Location', /\/batches\/[0-9a-f]/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body.messages[0]).should.be.an.instanceOf(Object).and.have.property('data');
                (res.body.messages[1]).should.be.an.instanceOf(Object).and.have.property('data');
                (res.body._id).should.be.equal(res.header.location.split("/").pop());
                done();
            });
    });

    it("Should get bad request when pushing a batch without 'from header'.", function (done) {

        request.post(config.paths.batchQueue)
            .set('Authorization', config.token)
            //.set(config.fromHeader, config.fromHeaderValue)
            .send({
                to_node_id: config.fromHeaderValue,
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
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

    it("Should push a batch and recover it. Same data for messages expected. Other data will be null.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: config.fromHeaderValue,
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/batches\/[0-9a-f]/)
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
                            (res.body.to_node_id).should.be.exactly("af123");
                            (res.body.tries).should.be.exactly(0);
                            (res.body.messages[0].data).should.be.instanceOf(Object).and.have.property('name');
                            (res.body.messages[0].data).should.be.instanceOf(Object).and.have.property('love');
                            (res.body.messages[1].data).should.be.instanceOf(Object).and.have.property('name');
                            (res.body.messages[1].data).should.be.instanceOf(Object).and.have.property('love');
                            done();
                        });
                });
        });


    it("Should push a batch with wrong status, returning batch status may be always equal to pending.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: config.fromHeaderValue,
                    status: "processing",
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/batches\/[0-9a-f]/)
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

    it("Should allow scheduled state in batch push.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: config.fromHeaderValue,
                    status: "scheduled",
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/batches\/[0-9a-f]/)
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

    it("Should allow pending state in batch push.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: config.fromHeaderValue,
                    status: "pending",
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/batches\/[0-9a-f]/)
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

    it("Should return a bad request when no valid batch status is sent.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({
                    to_node_id: config.fromHeaderValue,
                    status: "pendinggggggggggggggggggg",
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
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

    it("Should rewrite batch fields that are part of system.",
        function (done) {

            request.post(config.paths.batchQueue)
                .set('Authorization', config.token)
                .set(config.fromHeader, config.fromHeaderValue)
                .send({

                    to_node_id: config.fromHeaderValue,

                    /// This fields are only for system.
                    tries: 23,
                    creation_time: new Date(),
                    update_time: new Date(),
                    scheduled_time: new Date(),
                    processing_time: new Date(),
                    error_time: new Date(),
                    processed_time: new Date(),
                    messages: [
                        {
                            data: {"name": "tester", "love": true}
                        },
                        {
                            data: {"name": "tester", "love": false}
                        }
                    ]
                })
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/batches\/[0-9a-f]/)
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