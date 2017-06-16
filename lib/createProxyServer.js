const httpProxy = require('http-proxy');

module.exports = function createProxyServer({host, specialHeader, secure}) {
    const proxy = httpProxy.createProxyServer({
        secure
    });

    proxy.on('proxyReq', req => {
        req.setHeader('Host', host);
        req.setHeader('X-Special-Proxy-Header', specialHeader);
        delete req._headers['accept-encoding'];
    });

    proxy.on('end', (req, res, proxyRes) => {
        res.emit('proxyed', req, res, proxyRes);
    });

    return proxy;
};