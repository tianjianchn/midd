
# send file with headers and promise support

### sendFile(req, resp, filePath, options)
Send the file to the client. all `send` package's [options](https://www.npmjs.com/package/send#options) are supported, with the extra options:
* setHeaders: (resp, path, stat)=>void. This is piror to `headers` option.
* headers: object. The append headers you want to send


### License

Licensed under MIT

Copyright (c) 2017 [Tian Jian](https://github.com/tianjianchn)
