# HTTP cache middleware for midd


### Usage
```js
const middCache = require('midd-cache');
app.use(middCache())
```

#### Manually check cache fresh when request coming
After cache expired in the client(browser), client will send a revalidate request with `If-Modified-Since` or `If-None-Match` headers. 
Use `req.fresh(status)` to check that, and if cache is fresh, it will response 304 and return true, otherwise it will return false.
The `status` is current resource state about `Last-Modified` or `ETag`. 
It could have two keys(keys name is case insensitive):
* `Last-Modified` or `LastModified`: number(ms) or string(utc) or Date. The string format is like `date.toUTCString()`
* `ETag`: the etag string

Example:
```js
app.use((req, resp, next)=>{
  let lastMod = getRecordLastModified(req.params.id);
  if(req.fresh({'Last-Modified': lastMod})) return;
  resp.send(updatedRecord)
})
```

#### Auto check cache fresh when using `resp.send`
This mechanism must be used with `midd-send` middleware and only effective on `resp.send` method. You should attch `midd-send` first.
When you call `resp.send(body)` method, it will generate `ETag` from the body, and get `Last-Modified` from the headers.
Then use them to compare with the request's `If-Modified-Since` or `If-None-Match`. If the cache is fresh, respond 304, otherwise respond the body with `ETag` and `Last-Modified` headers.

#### Set cache headers for response
`resp.setCache(options)`
Options have:
* `maxAge`: number, milliseconds. Used in `Cache-Control` header
* `private`: boolean. Used in `Cache-Control` header
* `Last-Modified` or `LastModified`: number(ms) or string(utc) or Date. The key name is case insensitive.
* `ETag`: the etag string. The key name is case insensitive.

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
