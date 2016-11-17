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

    it("Should push a message to queue, and return it in pending state.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .set('Content-Type', 'application/json')
            .set(config.headers.node_source, 'af123')
            .set(config.headers.node_destination, "09af1")
            .send({name: "test"})
            .expect('Content-Type', /json/)
            .expect('Location', /\/messages\/[0-9a-f]/)
            .expect(201)
            .end(function (err, res) {

                (res.headers[config.headers.status.toLowerCase()]).should.be.equal('pending');
                (res.headers[config.headers.node_source.toLowerCase()]).should.be.equal('af123');
                (res.headers[config.headers.node_destination.toLowerCase()]).should.be.equal('09af1');
                (res.body).should.be.instanceOf(Object).and.have.property('name');
                (res.body.name).should.be.equal('test');

                done();
            });
    });

    it("Should push a message and return the created one.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            .set('Content-Type', 'application/json')
            .set(config.headers.node_source, 'af123')
            .set(config.headers.node_destination, '09af1')
            .set(config.headers.status, 'pending')
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
                (res.headers[config.headers.id.toLowerCase()]).should.be.equal(res.header.location.split("/").pop());
                done();
            });
    });

    it("Should get bad request when pushing a message without 'from header'.", function (done) {

        request.post(config.paths.messageQueue)
            .set('Authorization', config.master_token)
            //.set(config.headers.from, 'af123')
            .set(config.headers.node_destination, '09af1')
            .set('Content-Type', 'application/json')
            .set(config.headers.status, 'pending')
            .send({name: "test"})
            .expect(400)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Object).and.have.property('errors');
                (res.body.errors).should.be.an.instanceOf(Object).and.have.property('node_source');
                done();
            });
    });

    it("Should return same data with correct _id when a complete message is pushed. Other data must not exist.",
        function (done) {


            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set('Content-Type', 'application/json')
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
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {

                            (res.headers[config.headers.id.toLowerCase()]).should.be.exactly(resp.header.location.split("/").pop());
                            (res.headers[config.headers.status.toLowerCase()]).should.be.exactly("pending");
                            (res.headers[config.headers.node_source.toLowerCase()]).should.be.exactly('af123');
                            (res.headers[config.headers.node_destination.toLowerCase()]).should.be.exactly('af123');
                            (res.headers[config.headers.tries.toLowerCase()]).should.be.exactly('0');
                            (res.body).should.be.an.instanceOf(Object).and.have.property('name');
                            (res.body.name).should.be.exactly("test");
                            done();
                        });
                });
        });


    it("Should return a pending message status when pushing a message with wrong status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'processing')
                .set('Content-Type', 'application/json')
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.headers[config.headers.status.toLowerCase()]).should.be.exactly("pending");
                            done();
                        });
                });
        });


    it("Should accept pending state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set('Content-Type', 'application/json')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'pending')
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (req, res) {
                            (res.headers[config.headers.status.toLowerCase()]).should.be.exactly("pending");
                            done();
                        });
                });
        });

    it("Should return bad request 400 when pushing a message with no valid status.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set('Content-Type', 'application/json')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'pendinggggggggggggggggggggggggggggggggggggg')
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
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set('Content-Type', 'application/json')
                .set(config.headers.tries, 23)
                .set(config.headers.update_time, new Date())
                .set(config.headers.processing_time, new Date())
                .set(config.headers.processed_time, new Date())
                .set(config.headers.error_time, new Date())
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    request.get(res.header.location)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {

                            if (err) {
                                throw err;
                            }

                            (res.headers).should.have.ownProperty(config.headers.tries.toLowerCase());
                            (res.headers).should.have.ownProperty(config.headers.created_time.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.headers.update_time.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.headers.processed_time.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.headers.error_time.toLowerCase());
                            (res.headers).should.not.have.ownProperty(config.headers.processed_time.toLowerCase());
                            done();
                        });
                });
        });

    it("Should can push an string (text-plain) in body.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set('Content-Type', 'text/plain')
                .send('string')
                .expect('Content-Type', /text/)
                .expect('string', done);
        });


});