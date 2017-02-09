# URL middleware for midd

### Usage
```js
const middUrl = require('midd-url');
app.use(middUrl());
```

### API
It will attach attributes to `request` object.  Attributes include `href`, `protocol`, `auth`, `host`, `hostname`, `port`, `path`, `pathname`, `search`, `query`. See [URL Object](https://nodejs.org/dist/latest/docs/api/url.html#url_url_strings_and_url_objects)

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
