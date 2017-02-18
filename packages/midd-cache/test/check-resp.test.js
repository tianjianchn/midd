
// const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const middCache = require('..');
const middSend = require('midd-send');
const generateETag = require('etag');

describe('check cache on resp', () => {
  describe('last-modified', () => {
    it('should be fresh', () => {
      const str = new Date().toUTCString();
      const middlware = (req, resp) => {
        resp.setHeader('Last-Modified', str);
        resp.send('hello');
      };
      return createMatchTest({ middlware, 'if-modified-since': str, fresh: true });
    });

    it('should be stale', () => {
      const middlware = (req, resp) => {
        const str = new Date(Date.now() + 1000).toUTCString();
        resp.setHeader('Last-Modified', str);
        resp.send('hello');
      };
      return createMatchTest({ middlware, 'if-modified-since': new Date().toUTCString() });
    });

    it('should be stale with post', () => {
      const str = new Date().toUTCString();
      const middlware = (req, resp) => {
        resp.setHeader('Last-Modified', str);
        resp.send('hello');
      };
      return createMatchTest({ post: true, middlware, 'if-modified-since': str });
    });
  });

  describe('etag', () => {
    it('should be fresh', () => {
      const etag = generateETag('hello');
      const middlware = (req, resp) => {
        resp.send('hello');
      };
      return createMatchTest({ middlware, 'if-none-match': etag, fresh: true });
    });

    it('should be stale', () => {
      const etag = generateETag('hello1');
      const middlware = (req, resp) => {
        resp.send('hello2');
      };
      return createMatchTest({ middlware, 'if-none-match': etag });
    });

    it('should be stale with post', () => {
      const etag = generateETag('hello');
      const middlware = (req, resp) => {
        resp.send('hello');
      };
      return createMatchTest({ post: true, middlware, 'if-none-match': etag });
    });
  });
});

function createMatchTest(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const { middlware, post, fresh } = options,
        modSince = options['if-modified-since'],
        noneMatch = options['if-none-match'];

      const app = Server();
      app.on('error', reject);
      app.use(middSend());
      app.use(middCache());
      app.use(middlware);

      let req = request(app.listen());
      if (post) req = req.post('/');
      else req = req.get('/');

      if (modSince) req = req.set('If-Modified-Since', modSince);
      if (noneMatch) req = req.set('If-None-Match', noneMatch);

      if (fresh) req.expect(304, '', resolve);
      else req.expect(200, 'hello', resolve);
    } catch (e) {
      reject(e);
    }
  });
}
