// TODO IMPROVE THIS HEADER PREFIX.

module.exports = {
    header_prefix: "Scirocco",
    from_header: "Scirocco-From",
    to_header: "Scirocco-To",
    id_header: "Scirocco-Id",
    tries_header: "Scirocco-Tries",
    topic_header: "Scirocco-Topic",
    status_header: "Scirocco-Status",
    update_time_header: "Scirocco-Update-Time",
    created_time_header: "Scirocco-Created-Time",
    scheduled_time_header: "Scirocco-Scheduled-Time",
    processing_time_header: "Scirocco-Processing-Time",
    processed_time_header: "Scirocco-Processed-Time",
    error_time_header: "Scirocco-Processing-Time",
    master_token: process.env.MASTER_TOKEN || "DEFAULT_TOKEN",
    max_pull_messages_allowed: 100
};