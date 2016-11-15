var mongoose = require('mongoose');
var validators = require('./validators');

var messageSchema = new mongoose.Schema({

    node_destination: {type: String, index: true, required: true, validate: validators.hexadecimal},
    node_source: {type: String, index: true, required: true, validate: validators.hexadecimal},
    topic: {type: String, required: false, index: true},
    status: {type: String, required: false, index: true, validate: validators.messageStatus},
    tries: {type: Number, index: true, validate: validators.integerUnsigned},
    created_time: {type: Date, index: true},
    update_time: {type: Date, index: true},
    scheduled_time: {type: Date, index: true, min: Date.now()},
    processing_time: {type: Date, index: true},
    error_time: {type: Date, index:true},
    processed_time: {type: Date, index:true},
    payload_type: {type:String, index:true, required: true, validate: validators.dataTypeField},
    payload: {type: mongoose.Schema.Types.Mixed, required: true}

});

messageSchema.pre('save', function (next) {

    this.status = (this.status && this.status.match(/pending|scheduled/)) ? this.status : 'pending';
    this.tries = 0;
    this.created_time = new Date();
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
