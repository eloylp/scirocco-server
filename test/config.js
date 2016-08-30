// TODO JOIN THIS CONFIG with root config . this is duplicated.

module.exports = {

    token: "DEFAULT_TOKEN",
    header_prefix: "Scirocco",
    from_header: "Scirocco-From",
    id_header: "Scirocco-Id",
    tries_header: "Scirocco-Tries",
    to_header: "Scirocco-To",
    topic_header: "Scirocco-Topic",
    update_time_header: "Scirocco-Update-Time",
    created_time_header: "Scirocco-Created-Time",
    scheduled_time_header: "Scirocco-Scheduled-Time",
    processing_time_header: "Scirocco-Processing-Time",
    processed_time_header: "Scirocco-Processed-Time",
    error_time_header: "Scirocco-Processing-Time",
    status_header: "Scirocco-Status",
    from_header_value: "af123",
    paths: {
        messages: "/messages",
        messageQueue: "/messageQueue",
        batches: "/batches",
        batchQueue: "/batchQueue"
    }
};