/// Load environment

var env = require('node-env-file');
env(__dirname + '/../.env');

var supertest = require('supertest');
var should = require('should');
var model = require('../models/models');

var request = supertest.agent('http://localhost:'+ process.env.APP_PORT);
var server;
var path = '/messages';


describe('Testing resource messages.', function(){

    beforeEach(function(done){
        delete require.cache[require.resolve('../bin/www')];
        server = require('../bin/www');
        model.message.remove({}, done);
    });

    afterEach(function (done) {
        server.close(done);
        model.message.remove({}, done);
    });

    it("If no messages api will return empty array.", function(done){

        request.get(path)
            .set('Authorization', 'DEFAULT_TOKEN')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if(err){
                    throw err;
                }
                (res.body).should.be.an.instanceOf(Array).and.have.lengthOf(0);
                done();
            });
    });

});