/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

// const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const middCache = require('..');

describe('check cache on req', () => {
  describe('last-modified', () => {
    it('should be fresh', () => {
      const str = new Date().toUTCString();
      return createMatchTest({ 'last-modified': str, 'if-modified-since': str, fresh: true });
    });

    it('should be fresh with number', () => {
      const now = new Date();
      const num = now.getTime(),
        str = now.toUTCString();
      return createMatchTest({ 'last-modified': num, 'if-modified-since': str, fresh: true });
    });

    it('should be stale with empty', () => createMatchTest({ 'last-modified': null, 'if-modified-since': new Date().toUTCString() }));

    it('should be stale', () => createMatchTest({ 'last-modified': Date.now() + 1000,
      'if-modified-since': new Date().toUTCString() }));

    it('should be stale with post', () => {
      const str = new Date().toUTCString();
      return createMatchTest({ post: true, 'last-modified': str, 'if-modified-since': str });
    });
  });

  describe('etag', () => {
    it('should be fresh', () => createMatchTest({ etag: '1234', 'if-none-match': '1234', fresh: true }));

    it('should be stale', () => createMatchTest({ etag: '12345', 'if-none-match': '1234' }));

    it('should be stale with post', () => createMatchTest({ post: true, etag: '1234', 'if-none-match': '1234' }));
  });
});

function createMatchTest(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const { etag, post, fresh } = options,
        lastMod = options['last-modified'],
        modSince = options['if-modified-since'],
        noneMatch = options['if-none-match'];

      const app = Server();
      app.on('error', reject);
      app.use(middCache());
      app.use((req, resp, next) => {
        if (req.fresh({ 'last-modified': lastMod, etag })) return;
        resp.end('hello');
      });

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
