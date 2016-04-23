
exports.index = function(req, res) {
    res.json({

        "name": "JobQueue Web service",
        "author": "SandBoxWebs (Eloy)",
        "jobModel": {
            "queueId": "Integer unsigned",
            "type": "string, Funtion to be executed",
            "status": "pending or scheduled.",
            "description": "A description of the job.",
            "data": "A json document with necessary data for the job queue."
        },
        "routes":[
            { "/jobs": ['get', 'post', 'delete'] },
            { "/jobs/{id}": ['get', 'put', 'delete'] }

        ]
    });
};
