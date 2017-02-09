/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const assert = require('assert');
const http = require('http');
const request = require('supertest');
const Compose = require('midd-compose');
const express = require('express');
const wrapExpressMiddleware = require('..');

describe('wrap express middleware', function () {
  it('should work when call next', async function () {
    let result;
    const middlewares = [
      (req, resp, next) => {
        result = [];
        result.push(1);
        setTimeout(next, 10);
        result.push(2);
      },
      (req, resp, next) => {
        result.push(3);
        resp.end(JSON.stringify(result));
      },
    ];

    await expressRequest(middlewares, 200, '[1,2,3]');
    assert.deepStrictEqual(result, [1, 2, 3]);
    await wrapExpressRequest(middlewares, () => result.push(4), 200, '[1,2,3]');
    assert.deepStrictEqual(result, [1, 2, 3, 4]);
  });
  it('should work when call next with error', async function () {
    let result;
    const middlewares = [
      (req, resp, next) => {
        result = [];
        result.push(1);
        setTimeout(() => next(new Error('something wrong')), 10);
        result.push(2);
      },
      (req, resp, next) => {
        result.push(3);
        resp.end(JSON.stringify(result));
      },
    ];

    await expressRequest(middlewares, 500, 'something wrong');
    assert.deepStrictEqual(result, [1, 2]);
    await wrapExpressRequest(middlewares, () => result.push(4), 500, 'something wrong');
    assert.deepStrictEqual(result, [1, 2]);
  });

  it('should work when response finished without call next', async function () {
    let result;
    const middlewares = [
      (req, resp, next) => {
        next();
        result.push(2);
      }, (req, resp, next) => {
        result = [];
        result.push(1);
        resp.end('hello');
      },
    ];

    await expressRequest(middlewares, 200, 'hello');
    assert.deepStrictEqual(result, [1, 2]);
    await wrapExpressRequest(middlewares, () => result.push(3), 200, 'hello');
    assert.deepStrictEqual(result, [1, 2, 3]);
  });

  it('should work when response error without call next', async function () {
    let result;
    const middlewares = [(req, resp, next) => {
      result = [];
      result.push(1);
      const e = new Error('bad param');
      e.statusCode = 400;
      resp.emit('error', e);
    }];
    await expressRequest(middlewares, 500, 'bad param');
    assert.deepStrictEqual(result, [1]);
    await wrapExpressRequest(middlewares, () => result.push(2), 400, 'bad param');
    assert.deepStrictEqual(result, [1]);
  });
});

async function expressRequest(middlewares, status, response) {
  const app = express();
  for (const middleware of middlewares) app.use(middleware);
  app.use((err, req, resp, next) => {
    resp.status(500).send(err.message);
  });

  const req = request(app.listen());

  await req.get('/').expect(status, response);
}

async function wrapExpressRequest(middlewares, end, status, response) {
  const wraps = [(req, resp, next) => next().then(end).catch((e) => {
    resp.statusCode = e.statusCode || 500;
    resp.end(e.message);
  })];
  for (const middleware of middlewares) wraps.push(wrapExpressMiddleware(middleware));
  const app = http.createServer(Compose(wraps));

  const req = request(app.listen());
  await req.get('/').expect(status, response);
}
