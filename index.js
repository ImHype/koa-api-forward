const bodyResolver = require('./lib/bodyResolver');
const createProxyServer = require('./lib/createProxyServer');
const createProxyResponse = require('./lib/createProxyResponse');
const {
    defaultPreForwardHook, 
    defaultAfterForwardHook, defaultSetHeaderErrorHook, 
    defaultSetProxyResponseHook
} = require('./lib/hooks');

class ApiForward {
    constructor(options = {}) {
        const {host, specialHeader, secure = false, agent = false, proxyTimeout = 3000} = options;

        this.proxy = createProxyServer({host, specialHeader, secure, agent, proxyTimeout});
    }

    on(...args) {
        this.proxy.on(...args);
    }

    middleware({
        scheme = 'http', hostname = 'localhost',
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
                yield new Promise((resolve) => {
                    res.once('proxyed', () => resolve());
                });
            } catch (e) {
                return;
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