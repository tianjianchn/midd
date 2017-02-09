/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off, no-plusplus:off */


const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const session = require('..');
const helper = require('./helper');

describe('reserved properties in req.session', () => {
  it('should do nothing if req.session exists', (done) => {
    const app = Server();
    app.use((req, res, next) => { req.session = {}; next(); });
    app.use(session({ secret: 'any' }));
    app.use((req, resp) => { req.session.name = 'oh'; });

    request(app.listen()).get('/')
      .expect(helper.shouldNotSetCookies())
      .expect(404, done);
  });

  it('should throw if reassign req.session', (done) => {
    const app = helper.createApp();
    app.use((req, resp) => {
      assert.throws(() => {
        req.session = {};
      }, /Cannot assign to read only property 'session'/);
      delete req.session;
      assert.equal(req.session, undefined);
    });
    request(app.server).get('/').expect(404, done);
  });

  it('should throw error when reset/delete the reserved properties', (done) => {
    const app = helper.createApp();
    app.use((req, resp, next) => {
      assert.throws(() => {
        req.session.destroy = 'noop';
      }, /Cannot assign to read only property 'destroy'/);
      assert.throws(() => {
        req.session.regenerate = 'noop';
      }, /Cannot assign to read only property 'regenerate'/);
      assert.throws(() => {
        req.session.id = 'noop';
      }, /Cannot assign to read only property 'id'/);

      assert.throws(() => {
        delete req.session.destroy;
      }, /Cannot delete property 'destroy'/);
      assert.throws(() => {
        delete req.session.regenerate;
      }, /Cannot delete property 'regenerate'/);
      assert.throws(() => {
        delete req.session.id;
      }, /Cannot delete property 'id'/);

      req.session.hi = 'hello';
      delete req.session.hi;
      req.session.hi = 'hello2';
      resp.end(req.session.hi);
    });
    const req = request(app.server);
    req.get('/').expect(helper.shouldSetCookies()).expect(200, 'hello2', done);
  });

  it('should only enum the non-reserved properties in req.session', (done) => {
    const app = helper.createApp();
    app.use((req, resp, next) => {
      req.session.a = 'a';
      req.session.b = 2;
      resp.end(Object.keys(req.session).sort().join(','));
    });
    const req = request(app.server);
    req.get('/').expect(helper.shouldSetCookies()).expect(200, 'a,b', done);
  });
});
