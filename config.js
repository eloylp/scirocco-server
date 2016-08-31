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
        error_time: [config.header_prefix, 'Processing', 'Time'].join('-')
    };

    config.paths = {
        messages: "/messages",
        messageQueue: "/messageQueue",
        batches: "/batches",
        batchQueue: "/batchQueue"
    };

    config.master_token = process.env.MASTER_TOKEN || "DEFAULT_TOKEN";
    config.max_pull_messages_allowed = 100;
    return config;

})();