/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');

var request = supertest.agent('http://localhost:'+ process.env.APP_PORT);
var server;
var config = require('../config');


describe('Testing request treatment.', function(){


    beforeEach(function(){
        delete require.cache[require.resolve('../bin/www')];
        server = require('../bin/www');
    });

    afterEach(function (done) {
        server.close(done);
    });

    it("Should return 400 when no content type in POST. With message showing available options",
        function (done) {

            request.post(config.paths.messageQueue)
                .set('Authorization', config.master_token)
                .set(config.headers.from, 'af123')
                .set(config.headers.to, 'af123')
                .send('string')
                .expect(400)
                .end(function (err, res) {

                    if (err) {
                        throw err;
                    }

                    (res.body).should.be.an.instanceOf(Object);
                    (res.body).should.have.property('message');
                    (res.body.message).should.be.equal("Please, specify a valid Content-Type values. " +
                        "Valid choices are .. " + config.contentsAllowed.join(', '));
                    done();
                });
        });
});