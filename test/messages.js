/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var config = require('../test/config');


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
                .set('Authorization', config.token)
                .set(config.from_header, config.from_header_value)
                .expect(204)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    (res.body).should.be.an.instanceOf(Object);
                    done();
                });
        });

    it("Should update previously created message and return it modified.",

        function (done) {
            var message = new model.message({
                to: config.from_header_value,
                from: config.from_header_value,
                data: {"name": "tester", "love": true}
            });
            message.save(function (err, res) {

                if (err) {
                    throw err;
                }
                request.patch(config.paths.messages + '/' + res.id)
                    .set('Authorization', config.token)
                    .set(config.from_header, config.from_header_value)
                    .send({
                            "name": "tester2",
                            "love": false
                    })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }

                        (res.headers).should.have.ownProperty(config.update_time_header.toLowerCase());
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
                    to: config.from_header_value,
                    from: config.from_header_value,
                    status: "pending",
                    data: {name: "test"},
                },
                {
                    to: config.from_header_value + "23",
                    from: config.from_header_value + "23",
                    status: "pending",
                    data: {name: "test"},
                }
            ];

            model.message.insertMany(messages, function (err, res) {

                if (err) {
                    throw err;
                }

                request.delete(config.paths.messages + '/' + toDeleteId)
                    .set('Authorization', config.token)
                    .set(config.from_header, config.from_header_value)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {

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
                },
                /// This message must not be deleted, because it not belongs or emitted
                /// to testing node.
                {
                    to: config.from_header_value + "23",
                    from: config.from_header_value + "23",
                    status: "pending",
                    data: {name: "test"},
                }
            ];

            model.message.insertMany(messages, function (err, res) {
                if (err) {
                    throw err;
                }

                request.delete(config.paths.messages)
                    .set('Authorization', config.token)
                    .set(config.from_header, config.from_header_value)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        (res.body).should.be.instanceOf(Object);
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(2);
                        done();
                    });
            });
        });
});