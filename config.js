
// TODO IMPROVE THIS HEADER PREFIX.

module.exports = {
    header_prefix: "Scirocco",
    from_header: "Scirocco-From",
    to_header: "Scirocco-To",
    topic_header: "Scirocco-Topic",
    master_token: process.env.MASTER_TOKEN || "DEFAULT_TOKEN",
    max_pull_messages_allowed: 100
};