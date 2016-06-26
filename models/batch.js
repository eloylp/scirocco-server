var mongoose = require('mongoose');
var validators = require('./validators');

var batchSchema = new mongoose.Schema({

    to_node_id: {type: String, index: true, required:true, validate: validators.hexadecimal},
    from_node_id: {type: String, index: true, required: true, validate: validators.hexadecimal},
    status: {type: String, required: false, index: true, validate: validators.messageStatus},
    creation_time: {type: Date},
    processing_time: {type: Date},
    processed_time: {type: Date},
    scheduled_time: {type: Date},
    error_time: {type: Date},
    messages: []  /* TODO CALL MESSAGE MODEL.   */
});

batchSchema.pre('save', function (next) {

    this.status = (this.status && this.status.match(/pending|scheduled/)) ? this.status : 'pending';
    this.creation_time = new Date();
    this.scheduled_time = null;
    this.processing_time = null;
    this.error_time = null;
    this.processed_time = null;
    next();

});

batchSchema.pre('update', function (next) {
    this.update({}, {$set: {update_time: new Date()}});
    next();
});

var batchModel = mongoose.model('Batch', batchSchema);


module.exports = batchModel;
