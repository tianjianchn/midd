# HTTP header middleware for midd

### Usage
```js
const middHeader = require('midd-header');
app.use(middHeader)
```

### API
#### req.get(name)
name is case insensitive. like `req.get('content-Type')`

#### resp.set(name, value)
Equal to `resp.setHeader`

#### resp.set(obj)
`obj` is headers key-value pairs.

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
