# Wrap express middleware to be used in midd

Express middleware and `midd` middleware have same parameter list(`(req, resp, next)`).  
The difference is `midd` middleware will always return a promise, thus we can make sure 
whether a middleware is finished

### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
