# Router middleware used in both server(midd) and client(stas)

### Features
* Support `use()` `all()` `get()` `post()` and other http verbs
* Support url pattern like express router: `use('/:name', ...)`
* Support url rewrite in route
* Support nested routers
* Routes are also promise-based

### Usage
```js
const Router = require('uni-router');

const router = Router();
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

#### router.use(pattern?: string, middleware1, middleware2, ...)
Attach routes to the pattern and prefix match `req.url` with the pattern. If no pattern specified, they will be attached at root path('/'). 

#### router.use|all|get|post|...(pattern?: string, middleware1, middleware2, ...)
Attach routes to the pattern, and exact match `req.url` with the pattern. If no pattern specified, they will be attached at root path('/').

#### req.params
If the pattern used in router verbs have named part(like '/:name'), `req.params` will contain the named part and its value. 

#### req.routePath
`req.routePath` represents current route's context(or position).
 See there are router A and router B, and their relations are described by
 `routerA.use('/a', routerB)`. So `router B's routePath` = `router A's routePath` + `/a`.

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
