const zlib = require('zlib');
const pify = require('pify');
const pGzip = pify(zlib.gunzip);
const pInflate = pify(zlib.inflate);

function bodyResolver (buffer, encoding) {
    return Promise.resolve(buffer)
        .then((data) => {
            if (encoding === 'gzip') {
                return pGzip(data);
            }
            return data;
        })
        .then((data) => {
            if (encoding === 'deflate') {
                return pInflate(data);
            }
            return data;   
        })
        .then(data => data.toString());
}

module.exports = bodyResolver;