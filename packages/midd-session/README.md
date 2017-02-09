# session middlewares for midd

### Usage
```js
const middSession = require('midd-session')
app.use(middSession())
```

### API
#### middSession(options)
Options have:
* secret: string. key used to encrypt the session id
* store: used to save the session info in server, default is memory store
* ttl: number|string. string will be parsed by `ms` package to milliseconds. 
* name: string. cookie name
* cookie: object
  * path: cookie path
  * maxAge: number. seconds for cookie cache

#### middSession.MemoryStore(options)
Create a memory store with options:
* interval: number. Auto clean expired session with the specified milliseconds

#### req.session.id
Get the session id

#### req.session.destroy()

#### req.session.regenerate()

#### req.session.ATTR
Get or set custom attributes in session

### Available Stores
* `midd-session-file-store`
* `midd-session-mysql-store`

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
