# send middleware for midd

### Usage
```js
const middSend = require('midd-send');
app.use(middSend())
```

### API

#### resp.type(type, charset)
Type will be parsed by [mime](https://www.npmjs.com/package/mime#mimelookuppath)

#### resp.send(body: string|Buffer|any)
If body is not string or buffer, then call `resp.json(body)` instead.

#### resp.json(body: any)

#### resp.sendStatus(code: int, text?:string)

#### resp.sendError(error: Error)
The response status code can be from `error.statusCode`, otherwise it's 500.

#### resp.download(filePath, savedFileName)
Let the client download the specific file. It returns a promise, so you may need `await` or `return` it.

#### resp.sendFile(filePath, options)
Send the file to the client. It returns a promise, so you may need `await` or `return` it. options have:
* setHeaders: (resp, path, stat)=>void.
* headers: object.
* maxAge: number(ms).
* root: root path for the file
Full options see [send](https://www.npmjs.com/package/send#options) and `midd-send-file`

#### resp.redirect(url, query?: object)
Send 302 response. the target url will be `url.resolve(req.url, url)`

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
