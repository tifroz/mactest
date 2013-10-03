mactest
=======

## A NodeJS/Express library for quick'n dirty unit testing

## Install it
`npm install mactest`

## Use it

#### Configure with [Express](https://github.com/visionmedia/express)
Assuming you are running a server with express, this will create a page available at http://yourserver.host/mtest, where your tests will be listed, and can be executed

```javascript
express				= require('express') ;
mactest				= require('mactest') ;
app = express() ;

app
	.use(express.compress())
	.use(express.logger())
	.use(app.router) ;

mactest.configure({rootPath: '/mtests', excludeSampleTests: false})
mactest.routes(app)
```

#### Define your test suites
Say we want to test a module that resolves url redirects

```javascript
mactest				= require('mactest') ;

function resolve(url, callback) {..};
module.exports = resolve ;

mactest.add( 'util functions > url resolve', function(result, fn){
	var short = 'http://bit.ly/19VYAIz' ;
	result.info('Will try to resolve url', short) ;
	resolve(short, function(err, resolved){
		if (resolved==='https://github.com/tifroz/mactest') {
			result.success('succesfully resolved', 'resolved to %s', resolved)  ;
		} else if (resolved) {
			result.failure('resolved but with incorrect value', 'resolved to %s', resolved)  ;
		}
		fn(err, result)
	})
})

```

Now your browser should show a **util functions > url resolve** link when you got to http://my.host/mtests (and you can execute the test & visualize the outcome by clicking the link)

## API

`mactest.configure(options)` to configure mactest
**options** is a hash with 2 keys:
- `rootPath` (string, defaults to `/mtests`) is the path on your server to access the page where all your tests are listed 
- `excludeSampleTests` (boolean, defaults to false) unless you override, you will see some built-in mock tests in addition to the tests you have defined in your code

`mactest.add(name, testFn)` to add a test suite 
- **name** is a string that identifies your test suite
- **testFn** is your test suite. It's a function with a `(result, callback)` signature. Use `result.info(..), result.failure(..), result.success(..)` any (multiple) time to report failure, info, success at different step of execution, then call `callback(error, result)` after the test suite has completed its execution


