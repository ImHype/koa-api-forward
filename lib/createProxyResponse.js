const {ServerResponse} = require('http');

module.exports = function (req) {
    const res = new ServerResponse(req);

    const bodyBuffers = [];

    res.write = function (chunk) {
        bodyBuffers.push(chunk);
        return true;
    };

    return {
        res, bodyBuffers
    };
};