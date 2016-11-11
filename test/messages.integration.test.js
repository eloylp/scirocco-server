/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing messages resource.', function () {

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

    it("Should return an empty object and a 204 status code if no messages found.",
        function (done) {

            request.get(config.paths.messages)
                .set('Authorization', config.master_token)
                .set(config.headers.from, 'af123')
                .expect(204)
                .end(function (err, res) {
                    if (err)  throw err;
                    (res.body).should.be.an.instanceOf(Object);
                    done();
                });
        });

    it("Should bring all messages pushed in creation order desc.",
        function (done) {

            var messages = [
                {
                    to: "af123",
                    from: "af123",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"
                },
                {
                    to: 'af123',
                    from: 'af123',
                    status: "pending",
                    data: {name: "test2"},
                    data_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err)  throw err;

                request.get(config.paths.messages)
                    .set('Authorization', config.master_token)
                    .set(config.headers.from, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err)  throw err;

                        (res.body).should.be.instanceOf(Object);
                        (res.body.length).should.be.equal(2);
                        (res.body[0].data.name).should.be.equal('test');
                        (res.body[1].data.name).should.be.equal('test2');
                        done();
                    });
            });
        });

    it("Should bring all messages pushed, limited results by param.",
        function (done) {

            var messages = [
                {
                    to: "af123",
                    from: "af123",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"
                },
                {
                    to: 'af123',
                    from: 'af123',
                    status: "pending",
                    data: {name: "test2"},
                    data_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err)  throw err;

                request.get([config.paths.messages, '?', 'limit', '=', '1'].join(''))
                    .set('Authorization', config.master_token)
                    .set(config.headers.from, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err)  throw err;

                        (res.body).should.be.instanceOf(Object);
                        (res.body.length).should.be.equal(1);
                        done();
                    });
            });
        });

    it("Should update previously created message and return it modified.",

        function (done) {
            var message = new model.message({
                to: 'af123',
                from: 'af123',
                data: {"name": "tester", "love": true},
                data_type: "application/json"
            });
            message.save(function (err, res) {

                if (err)  throw err;

                request.patch(config.paths.messages + '/' + res.id)
                    .set('Authorization', config.master_token)
                    .set(config.headers.from, 'af123')
                    .set('Content-Type', 'application/json')
                    .send({
                            "name": "tester2",
                            "love": false
                    })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {

                        if (err)  throw err;

                        (res.headers).should.have.ownProperty(config.headers.update_time.toLowerCase());
                        (res.body).should.be.an.instanceOf(Object).and.have.property('name');
                        (res.body).should.be.an.instanceOf(Object).and.have.property('love');
                        (res.body.name).should.be.equal("tester2");
                        (res.body.love).should.be.false;
                        done();
                    })
            });

        });
    it("Should delete a message, only the one belongs/emit.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();
            var messages = [
                {
                    _id: toDeleteId,
                    to: "af123",
                    from: "af123",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"
                },
                {
                    to: 'af123' + "23",
                    from: 'af123' + "23",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err)  throw err;

                request.delete(config.paths.messages + '/' + toDeleteId)
                    .set('Authorization', config.master_token)
                    .set(config.headers.from, 'af123')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }

                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(1);
                        done();
                    });
            });
        });

    it("Should remove all the messages only for present node.",
        function (done) {

            var messages = [
                {
                    to: "af123",
                    from: "af123",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"

                },
                {
                    to: "af123",
                    from: "af123",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"

                },
                /// This message must not be deleted, because it not belongs or emitted
                /// to testing node.
                {
                    to: "af123" + "23",
                    from: "af123" + "23",
                    status: "pending",
                    data: {name: "test"},
                    data_type: "application/json"

                }
            ];

            model.message.insertMany(messages, function (err, res) {
                if (err)  throw err;

                request.delete(config.paths.messages)
                    .set('Authorization', config.master_token)
                    .set(config.headers.from, 'af123')
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
});