/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

// const assert = require('assert');
const request = require('supertest');
const when = require('after');
const path = require('path');
const fs = require('fs-extra');
const Server = require('midd');
const Router = require('midd-router');
const middStatic = require('..');

describe('static middleware', () => {
  before(() => {
    fs.writeFileSync('f1.html', 'f1');
    fs.mkdirpSync('public/dir1/dir2');
    fs.writeFileSync('public/dir1/f1.html', 'publicdir1f1');
    fs.writeFileSync('public/f1.html', 'publicf1');
  });
  after(() => {
    fs.removeSync('f1.html');
    fs.removeSync('public');
  });
  it('should serve the static files without router', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middStatic());

    const req = request(app.listen());
    const cb = when(7, done);
    req.get('/f1.html').expect('Cache-Control', 'public, max-age=0').expect(200, 'f1', cb);
    req.get('/f1').expect(404, cb);
    req.get('/notexists').expect(404, 'Not Found', cb);
    req.get('/notexists/').expect(404, 'Not Found', cb);
    req.get('/public/dir1').expect(301, cb);
    req.get('/public/dir1/f1.html').expect('publicdir1f1', cb);
    req.post('/public/dir1').expect(405, cb);
  });

  it('should serve the static files with router', (done) => {
    const app = Server();
    app.on('error', done);

    const r = Router();
    r.use('/public', middStatic('./public'));
    app.use(r);

    const req = request(app.listen());
    const cb = when(5, done);
    req.get('/f1.html').expect(404, cb);
    req.get('/f1').expect(404, cb);
    req.get('/public/dir1').expect(301, cb);
    req.get('/public/dir1/f1.html').expect(200, 'publicdir1f1', cb);
    req.post('/public/dir1').expect(405, cb);
  });

  it('should serve the static files with fallthrough if error', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middStatic({ fallthrough: true }));
    app.use((req, resp, next) => {
      resp.end('fallthrough');
    });

    const req = request(app.listen());
    const cb = when(2, done);
    req.get('/f1.html').expect('f1', cb);
    req.get('/f1').expect('fallthrough', cb);
  });

  it('#(root, options)', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middStatic('.'));

    const req = request(app.listen());
    req.get('/f1.html').expect('Cache-Control', 'public, max-age=0').expect(200, 'f1', done);
  });

  it('#(options)', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middStatic({ root: '.' }));

    const req = request(app.listen());
    req.get('/f1.html').expect('Cache-Control', 'public, max-age=0').expect(200, 'f1', done);
  });

  it('support options.setHeaders', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middStatic({ root: '.', setHeaders: (resp, filePath, stat) => {
      if (path.extname(filePath) === '.html') {
        resp.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    } }));

    const req = request(app.listen());
    req.get('/f1.html').expect('Cache-Control', 'public, max-age=0, must-revalidate').expect(200, 'f1', done);
  });
});
