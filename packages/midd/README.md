# A light-weight, promise-based and middleware-driven web framework

### Features
* Use promise-based middlewares(support async/await)
* Better error handle(see [Error Handle](#error-handle))
* Easily use express middlewares(see [Migrate From Express](#migrate-from-express))
* The core is light-weight, all functionalities are driven by midd-* middlewares, like `midd-router`, `midd-static`
* Support request forward: `req.forward('/new/url')`

### Example
```js
const middServer = require('midd');
const app = middServer();

app.use(async (req, resp, next)=>{
  console.log('1');
  await next();
  console.log('3');
})
app.use(async (req, resp, next)=>{
  try{
    let user = await User.queryDb();
    resp.end(user.name);
  }catch(e){
    resp.statusCode = 500;
    resp.end(e.message)
  }
  
  console.log('2');
})
app.listen(8080)
```

### API
#### middServer()
create an app server. 

#### app.use(...middlewares)
Attach middlewares. A middleware is a function like `(req, resp, next)=>Promise`.

#### app.listen()
Same as node `server.listen()` function.

#### app.on('error', cb:(err, resp)=>void)
Catch uncaught error in middlewares

#### req.forward(url)
Forward the request to another url.

#### app.listener()
Used at `http.createServer(app.listerner())`

## Middlewares
* [midd-router](/packages/midd-router): Router for midd
* [midd-static](/packages/midd-static): Serve static files
* [midd-session](/packages/midd-session): Session middleware
* [midd-send](/packages/midd-send): Send methods middleware
* [midd-cache](/packages/midd-cache): HTTP cache middleware
* [midd-url](/packages/midd-url): Expose `req.url` object attributes in `req`, like `host`, `port`
* [midd-header](/packages/midd-header): HTTP header middleware
* [midd-ip](/packages/midd-ip): IP middleware

### Error Handle
You can use `app.on('error', cb)` to catch the uncaught error, or `try/catch` with `async/await` in middlewares

### Migrate From Express
Currently only support express middleware operations, like `express.Router` and `express.use|all|get|post|...()`

```js
app.express.get('/a', (req, resp, next)=>{
  console.log(req.url);
  next()//no return here
})
app.express.use(require('compression')())
app.express.use(require('body-parser').json())
```

### Contributing
Checkout our [CONTRIBUTING.md](/CONTRIBUTING.md) if you want to help out!

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)