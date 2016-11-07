// TODO IMPROVE THIS HEADER PREFIX.

module.exports = (function () {

    var config = new Object();

    config.header_prefix = "Scirocco";

    config.headers = {
        from: [config.header_prefix, 'From'].join('-'),
        to: [config.header_prefix, 'To'].join('-'),
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
        data_type: [config.header_prefix, 'Data', 'Type'].join('-')
    };

    config.paths = {
        messages: "/messages",
        messageQueue: "/messageQueue",
        batches: "/batches",
        batchQueue: "/batchQueue"
    };

    /// Sizes units are controlled by third party lib. see https://www.npmjs.com/package/bytes

    config.sizeLimits = {

        text: [process.env.SCIROCCO_MAX_KB_SIZE_TEXT, 'kb'].join(''),
        raw: [process.env.SCIROCCO_MAX_KB_SIZE_RAW, 'kb'].join(''),
        json: [process.env.SCIROCCO_MAX_KB_SIZE_JSON, 'kb'].join('')
    };

    config.contentsAllowed = ['text/plain', 'application/json', 'application/octet-stream'];

    config.master_token = process.env.SCIROCCO_MASTER_TOKEN || "DEFAULT_TOKEN";
    config.max_pull_messages_allowed = 100;
    return config;

})();