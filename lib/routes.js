(function() {
  var Seq, fs, pug, resultFile, resultFileName, resultTemplate, routes, templatesPath, testsFile, testsFileName, testsTemplate;

  Seq = require('seq');

  pug = require('pug');

  fs = require('fs');

  templatesPath = ("" + __dirname + "/templates").replace('dist', 'src');

  testsFileName = "" + templatesPath + "/tests.pug";

  testsFile = fs.readFileSync(testsFileName, {
    encoding: 'utf8'
  });

  testsTemplate = pug.compile(testsFile, {
    filename: testsFileName,
    pretty: true
  });

  resultFileName = "" + templatesPath + "/result.pug";

  resultFile = fs.readFileSync(resultFileName, {
    encoding: 'utf8'
  });

  resultTemplate = pug.compile(resultFile, {
    filename: resultFileName,
    pretty: true
  });

  routes = function(app, manager) {
    var rootPath;
    rootPath = manager._config.rootPath;
    app.get("" + rootPath, function(req, res) {
      var html, payload;
      payload = {
        options: {
          rootPath: manager._config.rootPath
        },
        tests: manager.list()
      };
      html = testsTemplate(payload);
      return res.send(200, html);
    });
    return app.get("" + rootPath + "/results/:name", function(req, res) {
      var name;
      name = req.params.name;
      return Seq().seq(function() {
        return manager.execute(name, this);
      }).seq(function(result) {
        var html, payload;
        payload = {
          options: {
            rootPath: manager._config.rootPath
          },
          result: result,
          test: name
        };
        html = resultTemplate(payload);
        return res.send(200, html);
      });
    });
  };

  module.exports = routes;

}).call(this);