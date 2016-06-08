/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var path = '/messages';
var token = 'DEFAULT_TOKEN';
var fromHeader = 'DDS-node-id';


describe('Testing resource messages.', function () {

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

    it("If no messages api will return empty array.", function (done) {

        request.get(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Array).and.have.lengthOf(0);
                done();
            });
    });

    it("Post a message will be ok.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                done();
            });
    });

    it("Post a message without 'from header'. will get bad request.", function (done) {

        request.post(path)
            .set('Authorization', token)
            //.set(fromHeader, 'af123')
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

    it("Post a max message and recover it. Same data with _id expected.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
            .send({
                to_node_id: "09af1",
                batch_id: "09af1",
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
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
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
                        (res.body.batch_id).should.be.exactly("09af1");
                        (res.body.queue_id).should.be.exactly("09af1");
                        (res.body.tries).should.be.exactly(0);
                        (res.body.creation_time !== null).should.be.true;
                        (res.body.processed_time === null).should.be.true;
                        (res.body.error_time === null).should.be.true;
                        (res.body.processing_time === null).should.be.true;
                        (res.body.scheduled_time === null).should.be.true;
                        (res.body.data).should.be.instanceOf(Object).and.have.property('name');
                        (res.body.data.name).should.be.exactly("test");
                        done();
                    });
            });
    });


    it("Post a message with wrong status, may be always equal to pending.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {
                        (res.body.status).should.be.exactly("pending");
                        done();
                    });
            });
    });

    it("Scheduled state is allowed in creation.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {
                        (res.body.status).should.be.exactly("scheduled");
                        done();
                    });
            });
    });

    it("Pending state is allowed in creation.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {
                        (res.body.status).should.be.exactly("pending");
                        done();
                    });
            });
    });

    it("Post a message with no valid status is a bad request.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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

    it("System message fields are over written by app.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
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

    it("Post a message and delete it.", function (done) {

        request.post(path)
            .set('Authorization', token)
            .set(fromHeader, 'af123')
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
                request.delete(res.header.location)
                    .set('Authorization', token)
                    .set(fromHeader, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {
                        (res.body).should.be.instanceOf(Object).and.have.property('ok');
                        (res.body).should.be.instanceOf(Object).and.have.property('n');
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(1);
                        done();
                    });
            });
    });

    it("Should update previously created message and return it modified.", function (done) {
        var message = new model.message({
            to_node_id: "af123",
            from_node_id: "af123",
            data: {"name": "tester", "love": true}
        });
        message.save(function (err, res) {

            if (err) {
                throw err;
            }
            request.patch(path + '/' + res.id)
                .set('Authorization', token)
                .set(fromHeader, 'af123')
                .send({
                    "data": {
                        "name": "tester2",
                        "love": false
                    }
                })
                .expect(200)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    (res.body.data).should.be.an.instanceOf(Object).and.have.property('name');
                    (res.body.data).should.be.an.instanceOf(Object).and.have.property('love');
                    (res.body.data.name).should.be.equal("tester2");
                    (res.body.data.love).should.be.false;
                    done();
                })
        });

    });
});