/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.SCIROCCO_PORT);
var server;
var config = require('../config');


describe('Testing DELETE_ALL operations of globalDataSpace resource.', function () {

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

    it('Should delete every message in the global dataSpace.', function (done) {

        var messages = [
            {
                node_destination: "af121113",
                node_source: "af12343",
                status: "scheduled",
                scheduled_time: Date.now() + 10000,
                payload: {name: "test"},
                payload_type: "application/json"
            },
            {
                node_destination: 'a454f123',
                node_source: 'af121113',
                status: "pending",
                payload: {name: "test2"},
                payload_type: "application/json"

            },
            {
                node_destination: 'a1111f123',
                node_source: 'af123111',
                status: "pending",
                payload: {name: "test2"},
                payload_type: "application/json"

            },
            {
                node_destination: 'af1223443',
                node_source: 'af123',
                status: "pending",
                payload: {name: "test2"},
                payload_type: "application/json"

            }
        ];

        model.message.insertMany(messages, function (err, res) {
            if (err) throw err;
            model.message.findOneAndUpdate({node_destination: 'af1223443'}, {status: 'processing'}, function (err, res) {
                if (err) throw err;
                model.message.findOneAndUpdate({node_destination: 'a1111f123'}, {status: 'processed'}, function (err, res) {
                    if (err) throw err;
                    request.delete(config.paths.globalDataSpace)
                        .set('Authorization', config.master_token)
                        .end(function (err, res) {
                            if (err) throw err;
                            model.message.count({}).exec(function (err, res) {
                                if (err) throw err;
                                (res).should.be.equal(0);
                                done();
                            });

                        });
                });
            });
        });
    });
});