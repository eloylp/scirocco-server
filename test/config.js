
// TODO JOIN THIS CONFIG with root config . this is duplicated.

module.exports = {
    
    token: "DEFAULT_TOKEN",
    header_prefix: "Scirocco",
    from_header: "Scirocco-From",
    to_header: "Scirocco-To",
    topic_header: "Scirocco-Topic",
    from_header_value: "af123",
    paths: {
        messages: "/messages",
        messageQueue: "/messageQueue",
        batches: "/batches",
        batchQueue: "/batchQueue"
    }
};