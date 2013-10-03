_ = require('underscore')
Seq = require('seq')
util = require('util')
routes = require './routes'


class Result
	constructor: ->
		@_result = {}
	_add: ->
		args = _.toArray(arguments)

		status = args.shift()
		title = args.shift()
		result = 
			isFailed: null
			print: ""

		switch status
			when 'failure'
				result.isFailed = true
			when 'success'
				result.isFailed = false
			else
				result.isFailed = null

		if args.length > 0
			result.print = args.shift()
		if args.length > 0
			args.unshift result.print
			result.print = util.format.apply(undefined, args)

		@_result[title] = result

	json: ->
		return @_result
	success: (title, args...)->
		args.unshift(title)
		args.unshift('success')
		@_add.apply this, args
	failure: (title, args...)->
		args.unshift(title)
		args.unshift('failure')
		@_add.apply this, args
	info: (title, args...)->
		args.unshift(title)
		args.unshift('info')
		@_add.apply this, args

class TestManager
	_config:
		rootPath: "/mtests"
		excludeSampleTests: false
	_testCases: {}

	constructor: ->
		@_addMockTests()

	configure: (options)->
		_.extend @_config, options
		if @_config.excludeSampleTests
			@_removeMockTests()
		else
			@_addMockTests()

	_addMockTests: ->
			@add 'MacTest Mock > A Mock Test Suite', (fn) ->
				result = new Result()
				result.success "A mock step completing succesfully", "success() method called on the Result object"
				result.info "An Informative step", "info() method called on the Result object with a json argument: %j", {anAttribute: 'aValue'}
				result.failure "A failed mock step (handled failure)", (new Error("A mock error, with stack trace")).stack
				fn?(null, result)

			@add 'MacTest Mock > A Mock Test with a Error in the callback (handled error)', (fn) ->
				fn?(new Error("This mock error was returned in the callback function"))

			@add 'MacTest Mock > A Mock Test that throws an Error during execution', (fn) ->
				throw new Error("This mock error was thrown during test execution")
	_removeMockTests:->
		@remove('MacTest Mock > A Mock Test Suite')
		@remove('MacTest Mock > A Mock Test with a Error in the callback (handled error)')
		@remove('MacTest Mock > A Mock Test that throws an Error during execution')

	routes: (app)->
		routes(app, @)

	createResultSet: ->
		return new Result()

	#Helper method for testing a stack layer (e.g an API) with mock request and response objects
	invokeLayer: (layer, payload, params, fn)->
		mockReq = 
			data:
				payload: payload
				params: params
		
		mockRes = {}
		layer mockReq, mockRes, (httpCode, content)->
			outcome = content or mockRes.payload
			fn?(null, outcome)
	
	add: (name, fn) ->
		name = name.split('/').pop()
		@_testCases[name] = fn

	remove: (name)->
		name = name.split('/').pop()
		delete _testCases[name]


	list: ->
		list = _.keys(@_testCases)
		return list.sort()

	execute: (name, fn) ->
		self = @
		try
			timeout = null
			Seq().seq ->
				onTimeout = =>
					result = new Result()
					result.failure "The tested API timed out", "No reponse received after 30sec"
					this(null, result)
					timeout = null
				timeout = setTimeout onTimeout, 30000
				onTestReturn = (err, res)=>
					if err
						result = new Result()
						result.failure "The test returned an error in the callback", err.stack or err.message or err.toString()
					else
						result = res
					this(null, result)

				result = new Result()
				try
					self._testCases[name](result, onTestReturn)
				catch boo
					result.failure "The test threw an error", boo.stack or boo.message or boo.toString()
					this(null, result)
			
			.seq (outcome)->
				if (timeout)
					clearTimeout(timeout)
					timeout = null
					fn?(null, outcome.json())
			
			.catch (boo)->
				fn?(boo)
		catch boo
			fn?(boo)

module.exports = new TestManager()


