(function() {
  var Result, Seq, TestManager, routes, util, _,
    __slice = [].slice;

  _ = require('underscore');

  Seq = require('seq');

  util = require('util');

  routes = require('./routes');

  Result = (function() {
    function Result() {
      this._result = {};
    }

    Result.prototype._add = function() {
      var args, result, status, title;
      args = _.toArray(arguments);
      status = args.shift();
      title = args.shift();
      result = {
        isFailed: null,
        print: ""
      };
      switch (status) {
        case 'failure':
          result.isFailed = true;
          break;
        case 'success':
          result.isFailed = false;
          break;
        default:
          result.isFailed = null;
      }
      if (args.length > 0) {
        result.print = args.shift();
      }
      if (args.length > 0) {
        args.unshift(result.print);
        result.print = util.format.apply(void 0, args);
      }
      return this._result[title] = result;
    };

    Result.prototype.json = function() {
      return this._result;
    };

    Result.prototype.success = function() {
      var args, title;
      title = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      args.unshift(title);
      args.unshift('success');
      return this._add.apply(this, args);
    };

    Result.prototype.failure = function() {
      var args, title;
      title = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      args.unshift(title);
      args.unshift('failure');
      return this._add.apply(this, args);
    };

    Result.prototype.info = function() {
      var args, title;
      title = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      args.unshift(title);
      args.unshift('info');
      return this._add.apply(this, args);
    };

    return Result;

  })();

  TestManager = (function() {
    TestManager.prototype._config = {
      rootPath: "/mactest",
      excludeSampleTests: false
    };

    TestManager.prototype._testCases = {};

    function TestManager() {
      this._addMockTests();
    }

    TestManager.prototype.configure = function(options) {
      _.extend(this._config, options);
      if (this._config.excludeSampleTests) {
        return this._removeMockTests();
      } else {
        return this._addMockTests();
      }
    };

    TestManager.prototype._addMockTests = function() {
      this.add('MacTest Mock > A Mock Test Suite', function(fn) {
        var result;
        result = new Result();
        result.success("A mock step completing succesfully", "success() method called on the Result object");
        result.info("An Informative step", "info() method called on the Result object with a json argument: %j", {
          anAttribute: 'aValue'
        });
        result.failure("A failed mock step (handled failure)", (new Error("A mock error, with stack trace")).stack);
        return typeof fn === "function" ? fn(null, result) : void 0;
      });
      this.add('MacTest Mock > A Mock Test with a Error in the callback (handled error)', function(fn) {
        return typeof fn === "function" ? fn(new Error("This mock error was returned in the callback function")) : void 0;
      });
      return this.add('MacTest Mock > A Mock Test that throws an Error during execution', function(fn) {
        throw new Error("This mock error was thrown during test execution");
      });
    };

    TestManager.prototype._removeMockTests = function() {
      this.remove('MacTest Mock > A Mock Test Suite');
      this.remove('MacTest Mock > A Mock Test with a Error in the callback (handled error)');
      return this.remove('MacTest Mock > A Mock Test that throws an Error during execution');
    };

    TestManager.prototype.routes = function(app) {
      return routes(app, this);
    };

    TestManager.prototype.createResultSet = function() {
      return new Result();
    };

    TestManager.prototype.invokeLayer = function(layer, payload, params, fn) {
      var mockReq, mockRes;
      mockReq = {
        data: {
          payload: payload,
          params: params
        }
      };
      mockRes = {};
      return layer(mockReq, mockRes, function(httpCode, content) {
        var outcome;
        outcome = content || mockRes.payload;
        return typeof fn === "function" ? fn(null, outcome) : void 0;
      });
    };

    TestManager.prototype.add = function(name, fn) {
      name = name.split('/').pop();
      return this._testCases[name] = fn;
    };

    TestManager.prototype.remove = function(name) {
      name = name.split('/').pop();
      return delete this._testCases[name];
    };

    TestManager.prototype.list = function() {
      var list;
      list = _.keys(this._testCases);
      return list.sort();
    };

    TestManager.prototype.execute = function(name, fn) {
      var boo, self, timeout;
      self = this;
      try {
        timeout = null;
        return Seq().seq(function() {
          var boo, onTestReturn, onTimeout, result;
          onTimeout = (function(_this) {
            return function() {
              var result;
              result = new Result();
              result.failure("The tested API timed out", "No reponse received after 30sec");
              _this(null, result);
              return timeout = null;
            };
          })(this);
          timeout = setTimeout(onTimeout, 30000);
          onTestReturn = (function(_this) {
            return function(err, res) {
              var result;
              if (err) {
                result = new Result();
                result.failure("The test returned an error in the callback", err.stack || err.message || err.toString());
              } else {
                result = res;
              }
              return _this(null, result);
            };
          })(this);
          result = new Result();
          try {
            return self._testCases[name](result, onTestReturn);
          } catch (_error) {
            boo = _error;
            result.failure("The test threw an error", boo.stack || boo.message || boo.toString());
            return this(null, result);
          }
        }).seq(function(outcome) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            return typeof fn === "function" ? fn(null, outcome.json()) : void 0;
          }
        })["catch"](function(boo) {
          return typeof fn === "function" ? fn(boo) : void 0;
        });
      } catch (_error) {
        boo = _error;
        return typeof fn === "function" ? fn(boo) : void 0;
      }
    };

    return TestManager;

  })();

  module.exports = new TestManager();

}).call(this);