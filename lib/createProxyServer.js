const httpProxy = require('http-proxy');

module.exports = function createProxyServer({host, specialHeader, secure, agent, proxyTimeout}) {
    const proxy = httpProxy.createProxyServer({
        secure, agent, proxyTimeout
    });

    proxy.on('proxyReq', req => {
        req.setHeader('Host', host);
        req.setHeader('X-Special-Proxy-Header', specialHeader);
        if (agent && agent.keepAlive) {
            req.setHeader('Connection', 'keep-alive');
        }
        delete req._headers['accept-encoding'];
    });

    proxy.on('end', (req, res, proxyRes) => {
        res.emit('proxyed', req, res, proxyRes);
        proxyRes.req.socket.emit('free');
    });

    return proxy;
};