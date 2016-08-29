var mongoose = require('mongoose');
var validators = require('./validators');

var messageSchema = new mongoose.Schema({
    
    to: {type: String, index: true, required:true, validate: validators.hexadecimal},
    from: {type: String, index: true, required: true, validate: validators.hexadecimal},
    topic: {type: String, required: false, index: true},
    status: {type: String, required: false, index: true, validate: validators.messageStatus},
    tries: {type: Number, index: true, validate: validators.integerUnsigned},
    creation_time: {type: Date},
    update_time: {type: Date},
    scheduled_time: {type: Date},
    processing_time: {type: Date},
    error_time: {type: Date},
    processed_time: {type: Date},
    data: {type: Object, required: true}

});

messageSchema.pre('save', function (next) {

    this.status = (this.status && this.status.match(/pending|scheduled/)) ? this.status : 'pending';
    this.tries = 0;
    this.creation_time = new Date();
    this.scheduled_time = null;
    this.processing_time = null;
    this.error_time = null;
    this.processed_time = null;
    next();

});

messageSchema.pre('findOneAndUpdate', function (next) {
    this.update({}, {$set: {update_time: new Date()}});
    next();
});

var messageModel = mongoose.model('Message', messageSchema);


module.exports = messageModel;
