var mongoose = require('mongoose');
var validators = require('./validators');

var jobSchema = new mongoose.Schema({

    queueId: {type: Number, index: true, validate: validators.integerUnsigned},
    type: {type: String, required: true, index: true},
    status: {type: String, required: true, index: true, validate: validators.jobStatus},
    tries: {type: Number, index: true, validate: validators.integerUnsigned},
    creationTime: {type: Date},
    updateTime: {type: Date},
    scheduledTime: {type: Date},
    candidateTime: {type: Date},
    queuedTime: {type: Date},
    processingTime: {type: Date},
    processedTime: {type: Date},
    description: {type: String, required: false, validate: validators.description},
    data: {type: JSON, required: false}

});

jobSchema.pre('save', function (next) {

    this.status = this.status.match(/pending|scheduled/) ? this.status : 'pending';
    this.tries = 0;
    this.creationTime = new Date();
    this.scheduledTime = null;
    this.candidateTime = null;
    this.queuedTime = null;
    this.processingTime = null;
    this.processedTime = null;

    next();
});

jobSchema.pre('update', function (next) {
    this.update({}, {$set: {updateTime: new Date()}});
    next();
});

var jobModel = mongoose.model('Job', jobSchema);


module.exports = jobModel;
