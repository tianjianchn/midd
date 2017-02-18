
const assert = require('assert');
const request = require('supertest');
const when = require('after');
const fs = require('fs-extra');
const path = require('path');
const Server = require('midd');
const middUrl = require('midd-url');
const middSend = require('..');

describe('send middleware', () => {
  it('should send with specified content-type', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middSend());
    app.use((req, resp, next) => {
      resp.type('text/xml', 'utf-8');
      resp.send('hello world');
    });
    const req = request(app.listen());
    req.get('/').expect('content-type', 'text/xml; charset=utf-8').expect('hello world', done);
  });

  it('should send with ascii chars', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middSend());
    app.use((req, resp, next) => {
      resp.send('hello world');
    });
    const req = request(app.listen());
    req.get('/').expect('content-type', 'text/html; charset=utf-8').expect('hello world', done);
  });

  it('should send with buffer', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middSend());

    const buffer = new Buffer('string');
    app.use((req, resp, next) => {
      resp.send(buffer);
    });
    const req = request(app.listen());
    req.get('/').expect('content-type', 'application/octet-stream').expect(200, done);
  });

  it('should send with chinese chars', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middSend());
    app.use((req, resp, next) => {
      resp.send('你好世界.');
    });
    const req = request(app.listen());
    req.get('/').expect('content-type', 'text/html; charset=utf-8').expect('你好世界.', done);
  });

  it('should send with json object', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middUrl());
    app.use(middSend());

    const str = 'string',
      num = 1.1,
      bool = false,
      obj = { a: 1, b: 2, c: { d: false, e: null, f: undefined } };
    app.use((req, resp, next) => {
      if (req.pathname === '/string') {
        resp.json(str);
      } else if (req.pathname === '/number') {
        resp.send(num);
      } else if (req.pathname === '/boolean') {
        resp.send(bool);
      } else if (req.pathname === '/object') {
        resp.send(obj);
      }
    });
    const req = request(app.listen());
    const cb = when(4, done);
    req.get('/string').expect('content-type', 'application/json; charset=utf-8').expect(JSON.stringify(str), cb);
    req.get('/number').expect('content-type', 'application/json; charset=utf-8').expect(200, `${num}`, cb);
    req.get('/boolean').expect('content-type', 'application/json; charset=utf-8').expect(JSON.stringify(bool), cb);
    req.get('/object').expect('content-type', 'application/json; charset=utf-8').expect(JSON.stringify(obj), cb);
  });

  it('should send status', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middUrl());
    app.use(middSend());

    const statuz = require('http').STATUS_CODES;
    app.use((req, resp, next) => {
      if (req.pathname === '/404') {
        resp.sendStatus(404);
      } else if (req.pathname === '/500') {
        resp.sendStatus(500, 'youarelost');
      } else if (req.pathname === '/886') {
        resp.sendStatus(886);
      }
    });
    const req = request(app.listen());
    const cb = when(3, done);
    req.get('/404').expect('content-type', 'text/html; charset=utf-8').expect(404, statuz[404], cb);
    req.get('/500').expect('content-type', 'text/html; charset=utf-8').expect(500, 'youarelost', cb);
    req.get('/886').expect('content-type', 'text/html; charset=utf-8').expect(886, `${886}`, cb);
  });

  it('should send error', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middUrl());
    app.use(middSend());

    // const statuz = require('http').STATUS_CODES;
    app.use((req, resp, next) => {
      const error = new Error('my error');
      if (req.pathname === '/404') {
        error.statusCode = 404;
      } else if (req.pathname === '/500') {
        error.statusCode = 500;
      } else if (req.pathname === '/886') {
        error.statusCode = '886';
      }
      resp.sendError(error);
    });
    const req = request(app.listen());
    const cb = when(3, done);
    req.get('/404').expect('content-type', 'text/html; charset=utf-8').expect(404, 'my error', cb);
    req.get('/500').expect('content-type', 'text/html; charset=utf-8').expect(500, 'my error', cb);
    req.get('/886').expect('content-type', 'text/html; charset=utf-8').expect(500, 'my error', cb);
  });
  it('should redirect without web root', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middSend());
    app.use((req, resp, next) => {
      if (req.url.indexOf('r1') >= 0) {
        resp.redirect('http://127.0.0.1:8080/na');
      } else if (req.url.indexOf('r2') >= 0) {
        resp.redirect('http://127.0.0.1:8080/nb', { x: '1' });
      } else if (req.url.indexOf('r3') >= 0) {
        resp.redirect('/a', { x: '1' });
      }
    });

    const req = request(app.listen());
    const cb = when(2, done);
    req.get('/r1').expect('Location', 'http://127.0.0.1:8080/na').expect(302, cb);
    req.get('/r2').expect('Location', 'http://127.0.0.1:8080/nb?x=1').expect(302, cb);
    req.get('/r3').expect('Location', '/a?x=1').expect(302, cb);
  });

  describe('file', () => {
    let lastMod;
    before(() => {
      fs.writeFileSync('eng.html', 'eng');
      fs.writeFileSync('中文.html', '中文');
      lastMod = new Date();
    });
    after(() => {
      fs.removeSync('eng.html');
      fs.removeSync('中文.html');
    });
    it('should send the file', (done) => {
      const app = Server();
      app.on('error', done);
      app.use(middSend());
      app.use((req, resp, next) => resp.sendFile('eng.html'));

      const req = request(app.listen());
      req.get('/').expect('Cache-Control', 'public, max-age=0')
        .expect('Last-Modified', lastMod.toUTCString())
        .expect(200, 'eng', (err, resp) => {
          if (err) return done(err);
          assert.equal(resp.headers.etag.indexOf('W/'), 0);
          done();
        });
    });

    it('should send 404 without return', (done) => {
      const app = Server();
      app.on('error', done);
      app.use(middSend());
      app.use((req, resp, next) => {
        // no return here will cause `multi-set headers` error
        resp.sendFile('eng.html').then(() => {
          throw new Error('cant reach here');
        }).catch((e) => {
          assert.equal("Can't set headers after they are sent.", e.message);
        });
      });

      const req = request(app.listen());
      req.get('/').expect(404, done);
    });

    it('should send the file with root', (done) => {
      const app = Server();
      app.on('error', done);
      app.use(middSend());
      app.use((req, resp, next) => resp.sendFile('eng.html', { root: process.cwd() }));

      const req = request(app.listen());
      req.get('/').expect('Cache-Control', 'public, max-age=0')
        .expect('Last-Modified', lastMod.toUTCString())
        .expect(200, 'eng', (err, resp) => {
          if (err) return done(err);
          assert.equal(resp.headers.etag.indexOf('W/'), 0);
          done();
        });
    });

    it('should download the file', (done) => {
      const app = Server();
      app.on('error', (err) => {
        console.log(err.stack);
      });
      app.use(middSend());
      app.use((req, resp, next) => resp.download('eng.html'));
      const req = request(app.listen());
      req.get('/').expect('Content-Disposition', 'attachment; filename="eng.html"')
        .expect(200, 'eng', done);
    });

    it('should download the file with Chinese filename', (done) => {
      const app = Server();
      app.on('error', (err) => {
        console.log(err.stack);
      });
      app.use(middSend());
      app.use((req, resp, next) => {
        let relative = req.relative || req.url;
        relative = decodeURIComponent(relative);
        return resp.download(path.join('.', relative));
      });
      const req = request(app.listen());
      req.get('/%E4%B8%AD%E6%96%87.html').expect('Content-Disposition', 'attachment; filename="??.html"; filename*=UTF-8\'\'%E4%B8%AD%E6%96%87.html')
        .expect(200, '中文', done);
    });

    it('should download the file with specified name', (done) => {
      const app = Server();
      app.on('error', (err) => {
        console.log(err.stack);
      });
      app.use(middSend());
      app.use((req, resp, next) => resp.download('eng.html', 'abcd一二三四'));
      const req = request(app.listen());
      req.get('/').expect('Content-Disposition', `attachment; filename="abcd????"; filename*=UTF-8''${encodeURIComponent('abcd一二三四')}`)
        .expect(200, 'eng', done);
    });
  });
});
