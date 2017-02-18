# Compose use-* middlewares

Compose middlewares like `(req, resp, next)=>Promise` into one.  

## Examples
```js
const compose = require('uni-compose');
const stack = compose([
  async (req, resp, next)=>{
    await sleep(1);
    const result = await next()
    await sleep(1);
    return result;
  },
  (req, resp, next)=>{
    return new Promise((resolve, reject)=>{
      resolve(1)
    })
  }
])

//call the composed one
stack(req, resp).then(result=>assert.equal(result, 1));
```

## API
`compose(middlewares, options)`. options have:  
* `beforeRunMiddleware`: before invoking the specified middleware, check whether it can be run

## License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
