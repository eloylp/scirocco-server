
exports.index = function(req, res) {
    res.json({

        "name": "JsDDS endpoint.",
        "author": "SandBoxWebs (Eloy)",
        "available_routes":[
            { "/messages": ['get', 'post', 'delete'] },
            { "/messages/{id}": ['get', 'put', 'delete'] }
        ]
    });
};
