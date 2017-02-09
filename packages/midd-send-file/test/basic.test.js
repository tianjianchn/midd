/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const assert = require('assert');
const http = require('http');
const request = require('supertest');
const fs = require('fs-extra');
const sendFile = require('..');

describe('send file', () => {
  let lastMod;
  before(() => {
    fs.writeFileSync('eng.html', 'eng');
    lastMod = new Date();
  });
  after(() => {
    fs.removeSync('eng.html');
  });
  it('should send the file', (done) => {
    const app = http.createServer((req, resp) => {
      sendFile(req, resp, 'eng.html');
    });

    const req = request(app.listen());
    req.get('/').expect('Cache-Control', 'public, max-age=0')
      .expect('Last-Modified', lastMod.toUTCString())
      .expect(200, 'eng', (err, resp) => {
        if (err) return done(err);
        assert.equal(resp.headers.etag.indexOf('W/'), 0);
        done();
      });
  });
  it('should send the file with root', (done) => {
    const app = http.createServer((req, resp) => {
      sendFile(req, resp, 'eng.html', { root: process.cwd() });
    });

    const req = request(app.listen());
    req.get('/').expect('Cache-Control', 'public, max-age=0')
      .expect('Last-Modified', lastMod.toUTCString())
      .expect(200, 'eng', (err, resp) => {
        if (err) return done(err);
        assert.equal(resp.headers.etag.indexOf('W/'), 0);
        done();
      });
  });
  it('should send the file with headers', (done) => {
    const app = http.createServer((req, resp) => {
      sendFile(req, resp, 'eng.html', { maxAge: 999, headers: { a: 1, b: 2 } });
    });

    const req = request(app.listen());
    req.get('/').expect('Cache-Control', 'public, max-age=0')
      .expect('Last-Modified', lastMod.toUTCString())
      .expect('a', '1')
      .expect('b', '2')
      .expect(200, 'eng', (err, resp) => {
        if (err) return done(err);
        assert.equal(resp.headers.etag.indexOf('W/'), 0);
        done();
      });
  });
  it('should send the file with setHeaders', (done) => {
    const app = http.createServer((req, resp) => {
      sendFile(req, resp, 'eng.html', { maxAge: 1001, setHeaders: res => res.setHeader('a', 1) });
    });

    const req = request(app.listen());
    req.get('/').expect('Cache-Control', 'public, max-age=1')
      .expect('Last-Modified', lastMod.toUTCString())
      .expect('a', '1')
      .expect(200, 'eng', (err, resp) => {
        if (err) return done(err);
        assert.equal(resp.headers.etag.indexOf('W/'), 0);
        done();
      });
  });
});
