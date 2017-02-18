
const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const useCache = require('..');
const format = require('util').format;

describe('set cache', () => {
  describe('fresh on next req', () => {
    it('should work with no maxAge', (done) => {
      createSimpleTest({ done, 'last-modified': new Date().toUTCString() });
    });

    it('should work with specified maxAge', (done) => {
      createSimpleTest({ done, maxAge: 10000, 'last-modified': new Date().toUTCString() });
    });

    it('should work with maxAge=-1', (done) => {
      createSimpleTest({ done, maxAge: -1, 'last-modified': new Date().toUTCString() });
    });

    it('should work with maxAge>one year', (done) => {
      createSimpleTest({ done, maxAge: 31536001000, 'last-modified': new Date().toUTCString() });
    });

    it('should work with specified private', (done) => {
      createSimpleTest({ done, private: true, 'last-modified': new Date().toUTCString() });
    });

    it('should work with specified last-modified', (done) => {
      const lastMod = new Date(Date.now() - 10000).toUTCString();
      createSimpleTest({ done, 'last-modified': lastMod });
    });

    it('should work with specified number-type last-modified', (done) => {
      const lastMod = Date.now() - 10000;
      createSimpleTest({ done, 'last-modified': lastMod });
    });
  });

  it('should work after cache updated', (done) => {
    const snapshot = {};
    const app = Server();
    app.on('error', done);
    app.use(useCache());
    app.use(async (req, resp, next) => {
      if (req.url === '/a') {
        if (req.fresh(snapshot)) return;
        if (!snapshot.value) {
          snapshot['last-modified'] = new Date(Date.now() - 1000);
          snapshot.value = 'hello';
        }

        resp.setCache(snapshot);
        return resp.end(snapshot.value);
      } else if (req.url === '/update') {
        snapshot['last-modified'] = new Date();
        snapshot.value = 'hello2';
        return resp.end('updated');
      }
    });

    const req = request.agent(app.listen());
    req.get('/a').expect('Cache-Control', 'public, max-age=0').expect(200, 'hello', (err, resp) => {
      if (err) return done(err);
      const lastMod = resp.headers['last-modified'];
      assert.equal(lastMod, snapshot['last-modified'].toUTCString());
      req.get('/a').set('If-Modified-Since', lastMod).expect(304, '', (err) => {
        if (err) return done(err);
        req.get('/update').expect(200, 'updated', (err) => {
          if (err) return done(err);
          req.get('/a').set('If-Modified-Since', lastMod).expect(200, 'hello2', done);
        });
      });
    });
  });
});

function createSimpleTest(options) {
  const { done, maxAge, etag, post, private: _private } = options,
    lastMod = options['last-modified'];

  const snapshot = {};
  const app = Server();
  app.on('error', done);
  app.use(useCache());
  app.use(async (req, resp, next) => {
    if (req.fresh(snapshot)) return;
    resp.setCache(options);
    Object.assign(snapshot, { etag, 'last-modified': lastMod });
    resp.end('hello');
  });

  const req = request.agent(app.listen());

  const cacheCtrl = format('%s, max-age=%s', _private ? 'private' : 'public',
    Math.min(maxAge < 0 ? 31536000 : (parseInt(maxAge / 1000, 10) || 0), 31536000));

  let r;
  if (post) r = req.post('/');
  else r = req.get('/');

  return r.expect('Cache-Control', cacheCtrl).expect(200, 'hello', (err, resp) => {
    if (err) return done(err);
    const respLastMod = resp.headers['last-modified'];
    if (!respLastMod) throw new Error('no last-modified');
    if (lastMod) {
      let setLastMod = lastMod;
      if (typeof setLastMod === 'number') setLastMod = new Date(setLastMod).toUTCString();
      assert.equal(respLastMod, setLastMod);
    }
    req.get('/').set('If-Modified-Since', respLastMod).expect(304, '', done);
  });
}
