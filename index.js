const url = require('url');
const {ServerResponse} = require('http');
const createProxyServer = require('./lib/createProxyServer');
const defaultTimeoutHook = require('./lib/defaultTimeoutHook');

function startProxy({
                       host = '127.0.0.1', scheme = 'http',
                       specialHeader = 'specialHeader', hostname,
                       timeout = 1500, timeoutHook = defaultTimeoutHook
                   }) {
    const proxy = createProxyServer({host, specialHeader});

    return function*(next) {
        const res = new ServerResponse(this.req);

        const bodyBuffers = [];

        res.write = function (chunk) {
            bodyBuffers.push(chunk);
            return true;
        };

        proxy.web(this.req, res, {
            target: scheme + '://' + hostname
        });

        try {
            yield new Promise((resolve, reject) => {
                res.once('proxyed', () => resolve());
                setTimeout(reject, timeout);
            });
        } catch (e) {
            timeoutHook.call(this, e);
            return yield next;
        }

        this.status = res.statusCode;

        this.set(res._headers);

        if (this.status === 200) {
            this._proxyResponse = Buffer.concat(bodyBuffers).toString('utf-8');
        }

        yield next;
    }
}

module.exports = startProxy;
