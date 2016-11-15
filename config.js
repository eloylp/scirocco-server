module.exports = (function () {

    var config = {};

    config.environment = process.env.SCIROCCO_ENV || 'development';
    config.port = parseInt(process.env.SCIROCCO_PORT) || 8000;
    config.mongoUrl = process.env.SCIROCCO_MONGO_URL || 'mongodb://localhost/scirocco-server';
    config.xPoweredBy = false;

    config.header_prefix = "Scirocco";

    config.headers = {
        node_source: [config.header_prefix, 'Node', 'Source'].join('-'),
        node_destination: [config.header_prefix, 'Node', 'Destination'].join('-'),
        id: [config.header_prefix, 'Id'].join('-'),
        tries: [config.header_prefix, 'Tries'].join('-'),
        topic: [config.header_prefix, 'Topic'].join('-'),
        status: [config.header_prefix, 'Status'].join('-'),
        update_time: [config.header_prefix, 'Update', 'Time'].join('-'),
        created_time: [config.header_prefix, 'Created', 'Time'].join('-'),
        scheduled_time: [config.header_prefix, 'Scheduled', 'Time'].join('-'),
        processing_time: [config.header_prefix, 'Processing', 'Time'].join('-'),
        processed_time: [config.header_prefix, 'Processed', 'Time'].join('-'),
        error_time: [config.header_prefix, 'Processing', 'Time'].join('-'),
        payload_type: [config.header_prefix, 'Payload', 'Type'].join('-')
    };

    config.paths = {
        messages: "/messages",
        messageQueue: "/messageQueue",
        batches: "/batches",
        batchQueue: "/batchQueue"
    };

    /// Sizes units are controlled by third party lib. see https://www.npmjs.com/package/bytes

    config.sizeLimits = {
        json: [parseFloat(process.env.SCIROCCO_MAX_KB_SIZE_JSON || 100), 'kb'].join(''),
        text: [parseFloat(process.env.SCIROCCO_MAX_KB_SIZE_TEXT || 100), 'kb'].join(''),
        raw: [parseFloat(process.env.SCIROCCO_MAX_KB_SIZE_RAW || 1000), 'kb'].join('')
    };

    config.jsonSpaces = 40;
    config.contentsAllowed = ['text/plain', 'application/json', 'application/octet-stream'];
    config.master_token = process.env.SCIROCCO_MASTER_TOKEN || "DEFAULT_TOKEN";
    config.max_get_all_messages = parseInt(process.env.SCIROCCO_MAX_GET_ALL_MESSAGES || 100);
    return config;

})();