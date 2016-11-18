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


describe('Testing SCHEDULING operation of messageQueue resource.', function () {

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

    it("Should accept scheduled state in message push.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set('Content-Type', 'application/json')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'scheduled')
                .set(config.headers.scheduled_time, Date.now() + 10000)
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
                            (res.headers[config.headers.status.toLowerCase()]).should.be.exactly("scheduled");
                            done();
                        });
                });
        });


    it("Should requires scheduled time header to be in scheduled message.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'scheduled')
                .set('Content-Type', 'application/json')
                .send({name: "test"})
                .expect(400)
                .end(function (err, res) {
                    if (err)  throw err;
                    (res.body.message).should.be.equal('An scheduled message requires the scheduled time header to be set.');
                    done()
                });
        });

    it("Should requires that the time header in scheduled message must be superior to the actual date.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'scheduled')
                .set(config.headers.scheduled_time, new Date(Date.now - 10000))
                .set('Content-Type', 'application/json')
                .send({name: "test"})
                .expect(400)
                .end(function (err, res) {
                    if (err)  throw err;
                    (res.body.errors).should.be.an.instanceOf(Object).and.have.property('scheduled_time');
                    done()
                });
        });

    it("Should requires scheduled time header in strict date format.",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set(config.headers.status, 'scheduled')
                .set(config.headers.scheduled_time, 'no valid format.')
                .set('Content-Type', 'application/json')
                .send({name: "test"})
                .expect(400)
                .end(function (err, res) {
                    if (err)  throw err;
                    (res.body.errors).should.be.an.instanceOf(Object).and.have.property('scheduled_time');
                    done()
                });
        });

    it("Should accept scheduled state in message push and see it correctly in messages endpoint.",
        function (done) {


            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.node_source, 'af123')
                .set(config.headers.node_destination, 'af123')
                .set('Content-Type', 'application/json')
                .set(config.headers.status, 'scheduled')
                .set(config.headers.scheduled_time, new Date(Date.now() + 10000))
                .send({name: "test"})
                .expect(201)
                .expect('Content-Type', /json/)
                .expect('Location', /\/messages\/[0-9a-f]/)
                .end(function (err, res) {
                    if (err)  throw err;

                    request.get(res.header.location)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {
                            if (err)  throw err;
                            (res.headers[config.headers.status.toLowerCase()]).should.be.exactly("scheduled");
                            (res.headers[config.headers.scheduled_time.toLowerCase()]).should.not.be.null;

                            done();
                        });
                });
        });

    it("Should retrieve an scheduled message, that is inside the consuming time frame.",
        function (done) {

            var message = {
                node_destination: "af123",
                node_source: "af123",
                status: "scheduled",
                scheduled_time: new Date(Date.now() + 1),
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);
            messageModel.save(function (err, res) {
                if (err)  throw err;
                setTimeout(function () {
                    request.get(config.paths.messageQueue)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {
                            if (err)  throw err;

                            done();
                        });
                }, 100);
            });
        });

    it("Should NOT retrieve an scheduled message, that is OUTSIDE the consuming time frame.",
        function (done) {

            var message = {
                node_destination: "af123",
                node_source: "af123",
                status: "scheduled",
                scheduled_time: new Date(Date.now() + 1000000),
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);
            messageModel.save(function (err, res) {
                if (err)  throw err;
                request.get(config.paths.messageQueue)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
                    .expect(204)
                    .end(function (err, res) {
                        if (err)  throw err;
                        done();
                    });
            });
        });

    it("Should retrieve an scheduled message in processing state.",
        function (done) {

            var message = {
                node_destination: "af123",
                node_source: "af123",
                status: "scheduled",
                scheduled_time: new Date(Date.now() + 10),
                payload: {name: "test"},
                payload_type: "application/json"
            };
            var messageModel = new model.message(message);
            messageModel.save(function (err, res) {
                if (err)  throw err;

                setTimeout(function () {
                    request.get(config.paths.messageQueue)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .expect(config.headers.status, 'processing')
                        .end(function (err, res) {
                            if (err)  throw err;
                            done();
                        });
                }, 100);
            });
        });

    it("Should retrieve an scheduled message expecting scheduled time header.",
        function (done) {

            var message = {
                node_destination: "af123",
                node_source: "af123",
                status: "scheduled",
                scheduled_time: new Date(Date.now() + 10),
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);
            messageModel.save(function (err, res) {
                if (err)  throw err;

                setTimeout(function () {
                    request.get(config.paths.messageQueue)
                        .set('Authorization', config.master_token)
                        .set(config.headers.node_source, 'af123')
                        .expect(200)
                        .expect('Content-Type', /json/)
                        .end(function (err, res) {
                            if (err)  throw err;
                            (res.headers[config.headers.scheduled_time.toLowerCase()]).should.not.be.null;
                            done();
                        });
                }, 100);
            });
        });
});