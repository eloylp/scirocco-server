/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:' + process.env.APP_PORT);
var server;
var path = '/batch';
var config = require('../test/config');


describe('Testing batch resource.', function () {

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

    it("Should create a new batch for messages posted. It must return a batch object info.", function (done) {

        var batch1 = [
            {
                to_node_id: "",
                data: {test: "testing"}
            },
            {
                to_node_id: "",
                data: {test: "testing"}
            },
            {
                to_node_id: "",
                data: {test: "testing"}
            }
        ];

        request.post(path)
            .set('Authorization', config.token)
            .set(config.fromHeader, config.fromHeaderValue)
            .set('Content-Type', 'application/json')
            .send(batch1)
            .expect(201)
            .expect('Location',/\/batch\/[0-9a-f]/)
            .end(function(err, res){

                (res.body).should.be.instanceOf(Object);
                (res.body.batch_id).should.be.equal(res.header.location.split("/")[2]);
                (res.body.message_num).should.be.exactly(3)
                (res.body.messages).should.be.instanceOf(Array);
                (res.body.n).sould.be.equal(3);
                done()
            });
    });

    it("Should return all batches pendient for actual node", function(done){

        




    });
});