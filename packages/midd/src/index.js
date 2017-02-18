

const Emitter = require('events');
const http = require('http');
const onFinished = require('on-finished');
const compose = require('uni-compose');
const bindExpress = require('./express');

const statuses = http.STATUS_CODES;

class Application extends Emitter {
  _middlewares = [];

  // babel 6 bug on no constructor, see https://github.com/babel/babel/issues/4254
  // after babel fix it, remove this constructor
  constructor() {//eslint-disable-line
    super();
  }

  use = (...middlewares) => {
    for (const middleware of middlewares) {
      if (typeof middleware !== 'function') throw new TypeError('use() only accept function');
      this._middlewares.push(middleware);
    }
    return this;
  }

  // used at `http.createServer(app.listerner())`
  listener = () => {
    const stack = compose(this._middlewares);

    // forward the request to new url
    // usage: return req.forward('/new/path')
    const forward = (req, resp, newUrl) => {
      req.originalUrl = req.url;
      req.url = newUrl;
      return stack.call(this, req, resp);
    };

    return (req, resp) => {
      req.app = this;
      req.routePath = '';// compatible with use-router

      req.forward = forward.bind(this, req, resp);

      const onerror = this._onerror.bind(this, resp);
      onFinished(resp, onerror);

      return stack.call(this, req, resp).then(() => {
        if (resp.headersSent) return resp.end();

        resp.statusCode = 404;
        return resp.end(statuses[404]);
      }).catch(onerror);
    };
  }

  listen = (...args) => {
    const server = http.createServer(this.listener());
    return server.listen(...args);
  }

  _onerror = (resp, err) => {
    if (!err) return;

    if (this.listenerCount('error') <= 0) {
      console.error('Caught an error in use-server: %s', err.stack || err.toString());
    } else {
      this.emit('error', err, resp);
    }

    if (resp.headersSent) return resp.end();

    let statusCode = parseInt(err.statusCode || err.status || err.code, 10);
    if (!statusCode || typeof statusCode !== 'number' || statusCode >= 1000 || statusCode < 400) {
      statusCode = 500;
    }

    resp.statusCode = statusCode;
    resp.end(err.message || statuses[statusCode] || 'Unknown Error');
  }
}

module.exports = () => {
  const app = new Application();
  bindExpress(app);
  return app;
};
