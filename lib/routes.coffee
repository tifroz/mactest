Seq 			= require 'seq'
jade			= require 'jade'
fs				= require 'fs'

templatesPath = "#{__dirname}/templates".replace('dist', 'src')

testsFileName = "#{templatesPath}/tests.jade"
testsFile = fs.readFileSync testsFileName, {encoding: 'utf8'}
testsTemplate = jade.compile testsFile, {filename: testsFileName, pretty: true}

resultFileName = "#{templatesPath}/result.jade"
resultFile = fs.readFileSync resultFileName, {encoding: 'utf8'}
resultTemplate = jade.compile resultFile, {filename: resultFileName, pretty: true}



routes = (app, manager)->
	rootPath = manager._config.rootPath
	app.get "#{rootPath}", (req, res)->
		payload =
			options:
				rootPath: manager._config.rootPath
			tests: manager.list()

		html = testsTemplate(payload)
		#utils.jPrint "html\n", html
		res.send 200, html

	app.get "#{rootPath}/results/:name", (req, res)->
		name = req.params.name
		Seq().seq ->
			manager.execute name, this
		.seq (result)->
			payload = 
				options:
					rootPath: manager._config.rootPath
				result: result
				test: name
			#utils.jPrint "payload\n", payload
			html = resultTemplate(payload)
			#utils.jPrint "html\n", html
			res.send 200, html

module.exports = routes


