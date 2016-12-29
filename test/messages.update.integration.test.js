

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing UPDATE operations of messages resource.', function () {

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

    it("Should update previously 'pending' created message and return it modified.",
        function (done) {
            var message = new model.message({
                node_destination: 'af123',
                node_source: 'af123',
                payload: {"name": "tester", "love": true},
                payload_type: "application/json"
            });
            message.save(function (err, res) {

                if (err)  throw err;

                request.patch(config.paths.messages + '/' + res.id)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
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

    it("Should update previously 'scheduled' created message and return it modified.",
        function (done) {
            var message = new model.message({
                node_destination: 'af123',
                node_source: 'af123',
                status: 'scheduled',
                scheduled_time: Date.now() + 100000,
                payload: {"name": "tester", "love": true},
                payload_type: "application/json"
            });
            message.save(function (err, res) {

                if (err)  throw err;

                request.patch(config.paths.messages + '/' + res.id)
                    .set('Authorization', config.master_token)
                    .set(config.headers.node_source, 'af123')
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

    it("Should NOT update a message, in processing state.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var message = {
                _id: toDeleteId,
                node_destination: "af12345",
                node_source: "af123",
                status: "pending",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);

            messageModel.save(function (err, res) {

                if (err)  throw err;

                model.message.findOneAndUpdate(
                    {_id: toDeleteId},
                    {status: 'processing'},
                    function (err, res) {

                        if (err) throw err;

                        request.patch(config.paths.messages + '/' + toDeleteId)
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .expect(404)
                            .expect('Content-Type', /json/)
                            .end(function (err, res) {
                                if (err)  throw err;
                                (res.body.message).should.be.equal('Resource not found.');
                                done();
                            });

                    });
            });
        });

    it("Should NOT update a message, in processed state.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var message = {
                _id: toDeleteId,
                node_destination: "af12345",
                node_source: "af123",
                status: "pending",
                payload: {name: "test"},
                payload_type: "application/json"
            };

            var messageModel = new model.message(message);

            messageModel.save(function (err, res) {

                if (err)  throw err;

                model.message.findOneAndUpdate(
                    {_id: toDeleteId},
                    {status: 'processed'},
                    function (err, res) {

                        if (err) throw err;

                        request.patch(config.paths.messages + '/' + toDeleteId)
                            .set('Authorization', config.master_token)
                            .set(config.headers.node_source, 'af123')
                            .expect(404)
                            .expect('Content-Type', /json/)
                            .end(function (err, res) {
                                if (err)  throw err;
                                (res.body.message).should.be.equal('Resource not found.');
                                done();
                            });

                    });
            });
        });
});