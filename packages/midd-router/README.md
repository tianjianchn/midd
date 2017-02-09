# Router middleware for midd

### Features
* Support `use()` `all()` `get()` `post()` and other http verbs
* Support url pattern like express router: `use('/:name', ...)`
* Support url rewrite in route
* Support nested routers
* Routes are also promise-based
* Support express middlewares by `router.express.VERB()`

### Usage
```js
const middRouter = require('midd-router');

const router = middRouter();
router.use('/a', async (req, resp, next)=>{
  await next();
})
router.get('/b', (req, resp, next)=>{
  return new Promise((resolve, reject)=>{
    setTimeout(resolve, 1000);
  }).then(next)
})
router.express.use(compression());
app.use(router)
```

### API
#### middRouter(options)
Options have:
* params: object. The default params for `req.params`.

#### router.use|all|get|post|...([pattern], ...middlewares)
Attach routes to the pattern. If no pattern specified, they will be attached at root path('/').

#### router.express.use|all|get|post|...([pattern], ...middlewares)

#### req.params
If the pattern used in router verbs have named part(like '/:name'), `req.params` will contain the named part and its value. 

#### req.routePath
`req.routePath` represents current route's context(or position).
 See there are router A and router B, and their relations are described by
 `routerA.use('/a', routerB)`. So `router B's routePath` = `router A's routePath` + `/a`.

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
