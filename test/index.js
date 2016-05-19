var supertest = require('supertest');
var should = require('should');

var server = supertest.agent('http://localhost:3000');



describe('Testing rest api.', function(){

    it("Should return 403 because there a are not token set.", function(done){

        server.get('/')
            .expect('Content-Type', /json/)
            .expect(403)
            .end(function (err, res) {
                if(err){
                    throw err;
                }
                done();
            });
    });

    it("Should return 200 because is authenticated.", function(done){
      server.get('/')
          .set('Authorization', 'DEFAULT_TOKEN')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res){
              if(err){
                  throw err;
              }
              done();
          });
    });
});