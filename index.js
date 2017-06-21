const bodyResolver = require('./lib/bodyResolver');
const createProxyServer = require('./lib/createProxyServer');
const createProxyResponse = require('./lib/createProxyResponse');
const {
    defaultTimeoutHook, defaultPreForwardHook, 
    defaultAfterForwardHook, defaultSetHeaderErrorHook, 
    defaultSetProxyResponseHook
} = require('./lib/hooks');

class ApiForward {
    constructor(options = {}) {
        const {host, specialHeader, secure = false} = options;

        this.proxy = createProxyServer({host, specialHeader, secure});
    }

    on(...args) {
        this.proxy.on(...args);
    }

    middleware({
        scheme = 'http', hostname = 'localhost',
        timeout = 10000, 
        
        timeoutHook = defaultTimeoutHook,
        preForwardHook = defaultPreForwardHook,
        afterForwardHook = defaultAfterForwardHook,
        setHeaderErrorHook = defaultSetHeaderErrorHook,
        setProxyResponseHook = defaultSetProxyResponseHook
    }) {
        const proxy = this.proxy;

        return function*(next) {
            const {res, bodyBuffers} = createProxyResponse(this.req);
            
            preForwardHook.call(this);

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

            afterForwardHook.call(this);

            this.status = res.statusCode || 404;

            Object.keys(res._headers || {}).forEach(key => {
                try {
                    this.set(key, res._headers[key]);
                } catch(e) {
                    setHeaderErrorHook.call(this, e);
                }
            });

            this.remove('content-encoding');

            if (Number(String(this.status).charAt(0)) < 4) {
                this._proxyResponse = yield bodyResolver(Buffer.concat(bodyBuffers), res._headers['content-encoding']);
            }

            setProxyResponseHook.call(this);

            yield next;
        };
    }
}

module.exports = ApiForward;