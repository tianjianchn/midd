# file store for midd-session middleware

### Usage
```js
const middSession = require('midd-session');
const SessionFileStore = require('midd-session-file-store');
app.use(middSession({store: new SessionFileStore()}))
```

### API
#### constructor(options)
options have:
* cleanInterval: the interval(ms) for clean the outdated session files, default 1h
* dir: the directory to save the session files, default `sessions`

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
