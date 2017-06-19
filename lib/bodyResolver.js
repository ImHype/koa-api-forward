const zlib = require('zlib');

function bodyResolver (buffer, encoding) {
    return new Promise((resolve) => {
        if (encoding == 'gzip') {
            zlib.gunzip(buffer, function (err, decoded) {
                resolve(decoded.toString());
            });
            return;
        }

        if (encoding == 'deflate') {
            zlib.inflate(buffer, function (err, decoded) {
                resolve(decoded.toString());
            });
            return;
        }

        resolve(buffer.toString());
    });
}

module.exports = bodyResolver;