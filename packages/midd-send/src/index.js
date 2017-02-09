

const http = require('http');
const mime = require('mime');
const contentType = require('content-type');
const contentDisposition = require('content-disposition');
const path = require('path');
const qs = require('querystring');
const { resolve } = require('url');
const sendFile = require('midd-send-file');

function setType(type, charset) {
  type.indexOf('/') >= 0 || (type = mime.lookup(type));
  return this.setHeader('Content-Type', setCharset(type, charset));
}

function setCharset(type, charset) {
  if (!type || !charset) return type;

  const parsed = contentType.parse(type);
  parsed.parameters.charset = charset;
  return contentType.format(parsed);
}

function send(body) {
  if (typeof body === 'string') {
    if (!this.getHeader('Content-Type')) {
      this.type('html', 'utf-8');
    }
    this.end(body, 'utf8');
  } else if (Buffer.isBuffer(body)) {
    if (!this.getHeader('Content-Type')) {
      this.type('bin');
    }
    this.end(body);
  } else this.json(body);
  return this;
}

function json(body) {
  if (!this.getHeader('Content-Type')) {
    this.type('json', 'utf-8');
  }
  this.end(JSON.stringify(body));
  return this;
}

function sendStatus(code, text) {
  this.statusCode = code;

  this.send(text || http.STATUS_CODES[code] || (`${code}`));
  return this;
}

function sendError(err) {
  let statusCode = err.statusCode;
  if (!statusCode || typeof statusCode !== 'number') statusCode = 500;
  return this.sendStatus(statusCode, err.message);
}

function download(filePath, savedFileName) {
  const headers = {
    'Content-Disposition': contentDisposition(savedFileName || path.basename(filePath)),
  };
  return this.sendFile(filePath, { headers });
}

function redirect(url, query) {
  const querystring = qs.stringify(query);
  if (querystring) {
    if (url.slice(-1) === '?') url += querystring;
    else url += `?${querystring}`;
  }

  this.statusCode = 302;
  this.setHeader('Location', url);
  this.end();
  return this;
}

module.exports = function createSendMiddleware(options = {}) {
  return function sendMiddleware(req, resp, next) {
    resp.type = setType;
    resp.send = send;
    resp.json = json;
    resp.sendStatus = sendStatus;
    resp.sendError = sendError;
    resp.sendFile = sendFile.bind(null, req, resp);
    resp.download = download;

    resp.redirect = (url, query) => {
      url = resolve(req.url, url);
      return redirect.call(resp, url, query);
    };

    return next();
  };
};
