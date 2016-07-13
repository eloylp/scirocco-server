/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var config = require('../test/config');


describe('Testing batches resource.', function () {

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

    it("Should return an empty object and a 204 status code if no batch found.", function(done){

        request.get(config.paths.batches)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .expect(204)
            .end(function (err, res) {
                if (err) {
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Object);
                done();
            });
    });

    it("Should update previously created batch and return it modified.",
        function (done) {
            var batch = new model.batch(
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
                });
            batch.save(function (err, res) {

                if (err) {
                    throw err;
                }
                request.patch(config.paths.batches + '/' + res.id)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .send({
                        status: "scheduled",
                        messages: [
                            {
                                data: {name: "changed1", love: false}
                            },
                            {
                                data: {name: "changed2", love: false}
                            },
                            {
                                data: {name: "changed3", love: false}
                            }
                        ]
                    })
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {

                        if (err) {
                            throw err;
                        }

                        (res.body.status).should.be.equal('scheduled');
                        (res.body.messages.length).should.be.equal(3);
                        (res.body.messages[0].data.name).should.be.equal('changed1');
                        (res.body.messages[0].data.love).should.be.false;
                        (res.body.messages[1].data.name).should.be.equal('changed2');
                        (res.body.messages[1].data.love).should.be.false;
                        (res.body.messages[2].data.name).should.be.equal('changed3');
                        (res.body.messages[2].data.love).should.be.false;
                        done();
                    });
            });
        });

    it("Should delete a batch.",
        function (done) {

            var toDeleteId = require('mongoose').Types.ObjectId();

            var batch = new model.batch({
                _id: toDeleteId,
                to_node_id: config.fromHeaderValue,
                from_node_id: config.fromHeaderValue,
                messages: [
                    {
                        data: {"name": "tester", "love": true}
                    },
                    {
                        data: {"name": "tester", "love": false}
                    }
                ]
            });
            batch.save(function (err, res) {

                if (err) {
                    throw err;
                }

                request.delete(config.paths.batches + '/' + toDeleteId)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (req, res) {

                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(1);
                        done();
                    });
            });
        });

    it("Should remove all the batches only for registered node.",
        function (done) {

            var batches = [
                {
                    to_node_id: config.fromHeaderValue,
                    from_node_id: config.fromHeaderValue,
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
                    from_node_id: config.fromHeaderValue + 23,
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
                    to_node_id: config.fromHeaderValue + 23,
                    from_node_id: config.fromHeaderValue,
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
                    to_node_id: config.fromHeaderValue + 23,
                    from_node_id: config.fromHeaderValue + 23,
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

            model.batch.insertMany(batches, function (err, res) {
                if (err) {
                    throw err;
                }

                request.delete(config.paths.batches)
                    .set('Authorization', config.token)
                    .set(config.fromHeader, config.fromHeaderValue)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        (res.body).should.be.instanceOf(Object);
                        (res.body.ok).should.be.true;
                        (res.body.n).should.be.equal(3);
                        done();
                    });
            });
        });
});