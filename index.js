const createProxyServer = require('./lib/createProxyServer');
const createProxyResponse = require('./lib/createProxyResponse');
const defaultTimeoutHook = require('./lib/defaultTimeoutHook');

class ApiForward {
    constructor(options = {}) {
        const {host, specialHeader} = options;

        this.proxy = createProxyServer({host, specialHeader});
    }

    on(...args) {
        this.proxy.on(...args);
    }

    middleware({
        scheme = 'http', hostname = 'localhost',
        timeout = 1500, timeoutHook = defaultTimeoutHook
    }) {
        const proxy = this.proxy;

        return function*(next) {
            const {res, bodyBuffers} = createProxyResponse(this.req);
            
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
        };
    }
}

module.exports = ApiForward;