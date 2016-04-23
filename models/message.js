var mongoose = require('mongoose');
var validators = require('./validators');

var messageSchema = new mongoose.Schema({
    
    node_id: {type: String, index: true, validate: validators.identificators},
    queue_id: {type: String, index: true, validate: validators.identificators},
    batch_id: {type: String, index: true, validate: validators.identificators},
    type: {type: String, required: true, index: true},
    status: {type: String, required: true, index: true, validate: validators.messageStatus},
    tries: {type: Number, index: true, validate: validators.integerUnsigned},
    creation_time: {type: Date},
    update_time: {type: Date},
    scheduled_time: {type: Date},
    processing_time: {type: Date},
    error_time: {type: Date},
    processed_time: {type: Date},
    description: {type: String, required: false, validate: validators.description},
    data: {type: JSON, required: false}

});

messageSchema.pre('save', function (next) {

    this.status = this.status.match(/pending|scheduled/) ? this.status : 'pending';
    this.tries = 0;
    this.creation_time = new Date();
    this.scheduled_time = null;
    this.processing_time = null;
    this.error_time = null;
    this.processed_time = null;
    next();

});

messageSchema.pre('update', function (next) {
    this.update({}, {$set: {update_time: new Date()}});
    next();
});

var messageModel = mongoose.model('Message', messageSchema);


module.exports = messageModel;
