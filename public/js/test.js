(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * assertion-error
 * Copyright(c) 2013 Jake Luer <jake@qualiancy.com>
 * MIT Licensed
 */

/*!
 * Return a function that will copy properties from
 * one object to another excluding any originally
 * listed. Returned function will create a new `{}`.
 *
 * @param {String} excluded properties ...
 * @return {Function}
 */

function exclude () {
  var excludes = [].slice.call(arguments);

  function excludeProps (res, obj) {
    Object.keys(obj).forEach(function (key) {
      if (!~excludes.indexOf(key)) res[key] = obj[key];
    });
  }

  return function extendExclude () {
    var args = [].slice.call(arguments)
      , i = 0
      , res = {};

    for (; i < args.length; i++) {
      excludeProps(res, args[i]);
    }

    return res;
  };
};

/*!
 * Primary Exports
 */

module.exports = AssertionError;

/**
 * ### AssertionError
 *
 * An extension of the JavaScript `Error` constructor for
 * assertion and validation scenarios.
 *
 * @param {String} message
 * @param {Object} properties to include (optional)
 * @param {callee} start stack function (optional)
 */

function AssertionError (message, _props, ssf) {
  var extend = exclude('name', 'message', 'stack', 'constructor', 'toJSON')
    , props = extend(_props || {});

  // default values
  this.message = message || 'Unspecified AssertionError';
  this.showDiff = false;

  // copy from properties
  for (var key in props) {
    this[key] = props[key];
  }

  // capture stack trace
  ssf = ssf || AssertionError;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, ssf);
  } else {
    try {
      throw new Error();
    } catch(e) {
      this.stack = e.stack;
    }
  }
}

/*!
 * Inherit from Error.prototype
 */

AssertionError.prototype = Object.create(Error.prototype);

/*!
 * Statically set name
 */

AssertionError.prototype.name = 'AssertionError';

/*!
 * Ensure correct constructor
 */

AssertionError.prototype.constructor = AssertionError;

/**
 * Allow errors to be converted to JSON for static transfer.
 *
 * @param {Boolean} include stack (default: `true`)
 * @return {Object} object that can be `JSON.stringify`
 */

AssertionError.prototype.toJSON = function (stack) {
  var extend = exclude('constructor', 'toJSON', 'stack')
    , props = extend({ name: this.name }, this);

  // include stack if exists and not turned off
  if (false !== stack && this.stack) {
    props.stack = this.stack;
  }

  return props;
};

},{}],2:[function(require,module,exports){
module.exports = require('./lib/chai');

},{"./lib/chai":3}],3:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var used = [];

/*!
 * Chai version
 */

exports.version = '4.1.2';

/*!
 * Assertion Error
 */

exports.AssertionError = require('assertion-error');

/*!
 * Utils for plugins (not exported)
 */

var util = require('./chai/utils');

/**
 * # .use(function)
 *
 * Provides a way to extend the internals of Chai.
 *
 * @param {Function}
 * @returns {this} for chaining
 * @api public
 */

exports.use = function (fn) {
  if (!~used.indexOf(fn)) {
    fn(exports, util);
    used.push(fn);
  }

  return exports;
};

/*!
 * Utility Functions
 */

exports.util = util;

/*!
 * Configuration
 */

var config = require('./chai/config');
exports.config = config;

/*!
 * Primary `Assertion` prototype
 */

var assertion = require('./chai/assertion');
exports.use(assertion);

/*!
 * Core Assertions
 */

var core = require('./chai/core/assertions');
exports.use(core);

/*!
 * Expect interface
 */

var expect = require('./chai/interface/expect');
exports.use(expect);

/*!
 * Should interface
 */

var should = require('./chai/interface/should');
exports.use(should);

/*!
 * Assert interface
 */

var assert = require('./chai/interface/assert');
exports.use(assert);

},{"./chai/assertion":4,"./chai/config":5,"./chai/core/assertions":6,"./chai/interface/assert":7,"./chai/interface/expect":8,"./chai/interface/should":9,"./chai/utils":23,"assertion-error":1}],4:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var config = require('./config');

module.exports = function (_chai, util) {
  /*!
   * Module dependencies.
   */

  var AssertionError = _chai.AssertionError
    , flag = util.flag;

  /*!
   * Module export.
   */

  _chai.Assertion = Assertion;

  /*!
   * Assertion Constructor
   *
   * Creates object for chaining.
   *
   * `Assertion` objects contain metadata in the form of flags. Three flags can
   * be assigned during instantiation by passing arguments to this constructor:
   *
   * - `object`: This flag contains the target of the assertion. For example, in
   *   the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
   *   contain `numKittens` so that the `equal` assertion can reference it when
   *   needed.
   *
   * - `message`: This flag contains an optional custom error message to be
   *   prepended to the error message that's generated by the assertion when it
   *   fails.
   *
   * - `ssfi`: This flag stands for "start stack function indicator". It
   *   contains a function reference that serves as the starting point for
   *   removing frames from the stack trace of the error that's created by the
   *   assertion when it fails. The goal is to provide a cleaner stack trace to
   *   end users by removing Chai's internal functions. Note that it only works
   *   in environments that support `Error.captureStackTrace`, and only when
   *   `Chai.config.includeStack` hasn't been set to `false`.
   *
   * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
   *   should retain its current value, even as assertions are chained off of
   *   this object. This is usually set to `true` when creating a new assertion
   *   from within another assertion. It's also temporarily set to `true` before
   *   an overwritten assertion gets called by the overwriting assertion.
   *
   * @param {Mixed} obj target of the assertion
   * @param {String} msg (optional) custom error message
   * @param {Function} ssfi (optional) starting point for removing stack frames
   * @param {Boolean} lockSsfi (optional) whether or not the ssfi flag is locked
   * @api private
   */

  function Assertion (obj, msg, ssfi, lockSsfi) {
    flag(this, 'ssfi', ssfi || Assertion);
    flag(this, 'lockSsfi', lockSsfi);
    flag(this, 'object', obj);
    flag(this, 'message', msg);

    return util.proxify(this);
  }

  Object.defineProperty(Assertion, 'includeStack', {
    get: function() {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      return config.includeStack;
    },
    set: function(value) {
      console.warn('Assertion.includeStack is deprecated, use chai.config.includeStack instead.');
      config.includeStack = value;
    }
  });

  Object.defineProperty(Assertion, 'showDiff', {
    get: function() {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      return config.showDiff;
    },
    set: function(value) {
      console.warn('Assertion.showDiff is deprecated, use chai.config.showDiff instead.');
      config.showDiff = value;
    }
  });

  Assertion.addProperty = function (name, fn) {
    util.addProperty(this.prototype, name, fn);
  };

  Assertion.addMethod = function (name, fn) {
    util.addMethod(this.prototype, name, fn);
  };

  Assertion.addChainableMethod = function (name, fn, chainingBehavior) {
    util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  Assertion.overwriteProperty = function (name, fn) {
    util.overwriteProperty(this.prototype, name, fn);
  };

  Assertion.overwriteMethod = function (name, fn) {
    util.overwriteMethod(this.prototype, name, fn);
  };

  Assertion.overwriteChainableMethod = function (name, fn, chainingBehavior) {
    util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
  };

  /**
   * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
   *
   * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
   *
   * @name assert
   * @param {Philosophical} expression to be tested
   * @param {String|Function} message or function that returns message to display if expression fails
   * @param {String|Function} negatedMessage or function that returns negatedMessage to display if negated expression fails
   * @param {Mixed} expected value (remember to check for negation)
   * @param {Mixed} actual (optional) will default to `this.obj`
   * @param {Boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
   * @api private
   */

  Assertion.prototype.assert = function (expr, msg, negateMsg, expected, _actual, showDiff) {
    var ok = util.test(this, arguments);
    if (false !== showDiff) showDiff = true;
    if (undefined === expected && undefined === _actual) showDiff = false;
    if (true !== config.showDiff) showDiff = false;

    if (!ok) {
      msg = util.getMessage(this, arguments);
      var actual = util.getActual(this, arguments);
      throw new AssertionError(msg, {
          actual: actual
        , expected: expected
        , showDiff: showDiff
      }, (config.includeStack) ? this.assert : flag(this, 'ssfi'));
    }
  };

  /*!
   * ### ._obj
   *
   * Quick reference to stored `actual` value for plugin developers.
   *
   * @api private
   */

  Object.defineProperty(Assertion.prototype, '_obj',
    { get: function () {
        return flag(this, 'object');
      }
    , set: function (val) {
        flag(this, 'object', val);
      }
  });
};

},{"./config":5}],5:[function(require,module,exports){
module.exports = {

  /**
   * ### config.includeStack
   *
   * User configurable property, influences whether stack trace
   * is included in Assertion error message. Default of false
   * suppresses stack trace in the error message.
   *
   *     chai.config.includeStack = true;  // enable stack on error
   *
   * @param {Boolean}
   * @api public
   */

  includeStack: false,

  /**
   * ### config.showDiff
   *
   * User configurable property, influences whether or not
   * the `showDiff` flag should be included in the thrown
   * AssertionErrors. `false` will always be `false`; `true`
   * will be true when the assertion has requested a diff
   * be shown.
   *
   * @param {Boolean}
   * @api public
   */

  showDiff: true,

  /**
   * ### config.truncateThreshold
   *
   * User configurable property, sets length threshold for actual and
   * expected values in assertion errors. If this threshold is exceeded, for
   * example for large data structures, the value is replaced with something
   * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
   *
   * Set it to zero if you want to disable truncating altogether.
   *
   * This is especially userful when doing assertions on arrays: having this
   * set to a reasonable large value makes the failure messages readily
   * inspectable.
   *
   *     chai.config.truncateThreshold = 0;  // disable truncating
   *
   * @param {Number}
   * @api public
   */

  truncateThreshold: 40,

  /**
   * ### config.useProxy
   *
   * User configurable property, defines if chai will use a Proxy to throw
   * an error when a non-existent property is read, which protects users
   * from typos when using property-based assertions.
   *
   * Set it to false if you want to disable this feature.
   *
   *     chai.config.useProxy = false;  // disable use of Proxy
   *
   * This feature is automatically disabled regardless of this config value
   * in environments that don't support proxies.
   *
   * @param {Boolean}
   * @api public
   */

  useProxy: true,

  /**
   * ### config.proxyExcludedKeys
   *
   * User configurable property, defines which properties should be ignored
   * instead of throwing an error if they do not exist on the assertion.
   * This is only applied if the environment Chai is running in supports proxies and
   * if the `useProxy` configuration setting is enabled.
   * By default, `then` and `inspect` will not throw an error if they do not exist on the
   * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
   * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
   *
   *     // By default these keys will not throw an error if they do not exist on the assertion object
   *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
   *
   * @param {Array}
   * @api public
   */

  proxyExcludedKeys: ['then', 'inspect', 'toJSON']
};

},{}],6:[function(require,module,exports){
/*!
 * chai
 * http://chaijs.com
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, _) {
  var Assertion = chai.Assertion
    , AssertionError = chai.AssertionError
    , flag = _.flag;

  /**
   * ### Language Chains
   *
   * The following are provided as chainable getters to improve the readability
   * of your assertions.
   *
   * **Chains**
   *
   * - to
   * - be
   * - been
   * - is
   * - that
   * - which
   * - and
   * - has
   * - have
   * - with
   * - at
   * - of
   * - same
   * - but
   * - does
   *
   * @name language chains
   * @namespace BDD
   * @api public
   */

  [ 'to', 'be', 'been'
  , 'is', 'and', 'has', 'have'
  , 'with', 'that', 'which', 'at'
  , 'of', 'same', 'but', 'does' ].forEach(function (chain) {
    Assertion.addProperty(chain);
  });

  /**
   * ### .not
   *
   * Negates all assertions that follow in the chain.
   *
   *     expect(function () {}).to.not.throw();
   *     expect({a: 1}).to.not.have.property('b');
   *     expect([1, 2]).to.be.an('array').that.does.not.include(3);
   *
   * Just because you can negate any assertion with `.not` doesn't mean you
   * should. With great power comes great responsibility. It's often best to
   * assert that the one expected output was produced, rather than asserting
   * that one of countless unexpected outputs wasn't produced. See individual
   * assertions for specific guidance.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.equal(1); // Not recommended
   *
   * @name not
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('not', function () {
    flag(this, 'negate', true);
  });

  /**
   * ### .deep
   *
   * Causes all `.equal`, `.include`, `.members`, `.keys`, and `.property`
   * assertions that follow in the chain to use deep equality instead of strict
   * (`===`) equality. See the `deep-eql` project page for info on the deep
   * equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.keys([{a: 1}]);
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * @name deep
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('deep', function () {
    flag(this, 'deep', true);
  });

  /**
   * ### .nested
   *
   * Enables dot- and bracket-notation in all `.property` and `.include`
   * assertions that follow in the chain.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *     expect({'.a': {'[b]': 'x'}}).to.nested.include({'\\.a.\\[b\\]': 'x'});
   *
   * `.nested` cannot be combined with `.own`.
   *
   * @name nested
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('nested', function () {
    flag(this, 'nested', true);
  });

  /**
   * ### .own
   *
   * Causes all `.property` and `.include` assertions that follow in the chain
   * to ignore inherited properties.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.property('b').but.not.own.property('b'); 
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * `.own` cannot be combined with `.nested`.
   *
   * @name own
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('own', function () {
    flag(this, 'own', true);
  });

  /**
   * ### .ordered
   *
   * Causes all `.members` assertions that follow in the chain to require that
   * members be in the same order.
   *
   *     expect([1, 2]).to.have.ordered.members([1, 2])
   *       .but.not.have.ordered.members([2, 1]);
   *
   * When `.include` and `.ordered` are combined, the ordering begins at the
   * start of both arrays.
   *
   *     expect([1, 2, 3]).to.include.ordered.members([1, 2])
   *       .but.not.include.ordered.members([2, 3]);
   *
   * @name ordered
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ordered', function () {
    flag(this, 'ordered', true);
  });

  /**
   * ### .any
   *
   * Causes all `.keys` assertions that follow in the chain to only require that
   * the target have at least one of the given keys. This is the opposite of
   * `.all`, which requires that the target have all of the given keys.
   *
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name any
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('any', function () {
    flag(this, 'any', true);
    flag(this, 'all', false);
  });


  /**
   * ### .all
   *
   * Causes all `.keys` assertions that follow in the chain to require that the
   * target have all of the given keys. This is the opposite of `.any`, which
   * only requires that the target have at least one of the given keys.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` are
   * added earlier in the chain. However, it's often best to add `.all` anyway
   * because it improves readability.
   *
   * See the `.keys` doc for guidance on when to use `.any` or `.all`.
   *
   * @name all
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('all', function () {
    flag(this, 'all', true);
    flag(this, 'any', false);
  });

  /**
   * ### .a(type[, msg])
   *
   * Asserts that the target's type is equal to the given string `type`. Types
   * are case insensitive. See the `type-detect` project page for info on the
   * type detection algorithm: https://github.com/chaijs/type-detect.
   *
   *     expect('foo').to.be.a('string');
   *     expect({a: 1}).to.be.an('object');
   *     expect(null).to.be.a('null');
   *     expect(undefined).to.be.an('undefined');
   *     expect(new Error).to.be.an('error');
   *     expect(Promise.resolve()).to.be.a('promise');
   *     expect(new Float32Array).to.be.a('float32array');
   *     expect(Symbol()).to.be.a('symbol');
   *
   * `.a` supports objects that have a custom type set via `Symbol.toStringTag`.
   *
   *     var myObj = {
   *       [Symbol.toStringTag]: 'myCustomType'
   *     };
   *
   *     expect(myObj).to.be.a('myCustomType').but.not.an('object');
   *
   * It's often best to use `.a` to check a target's type before making more
   * assertions on the same target. That way, you avoid unexpected behavior from
   * any assertion that does different things based on the target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.a`. However, it's often best to
   * assert that the target is the expected type, rather than asserting that it
   * isn't one of many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.an('array'); // Not recommended
   *
   * `.a` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     expect(1).to.be.a('string', 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.a('string');
   *
   * `.a` can also be used as a language chain to improve the readability of
   * your assertions. 
   *
   *     expect({b: 2}).to.have.a.property('b');
   *
   * The alias `.an` can be used interchangeably with `.a`.
   *
   * @name a
   * @alias an
   * @param {String} type
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function an (type, msg) {
    if (msg) flag(this, 'message', msg);
    type = type.toLowerCase();
    var obj = flag(this, 'object')
      , article = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(type.charAt(0)) ? 'an ' : 'a ';

    this.assert(
        type === _.type(obj).toLowerCase()
      , 'expected #{this} to be ' + article + type
      , 'expected #{this} not to be ' + article + type
    );
  }

  Assertion.addChainableMethod('an', an);
  Assertion.addChainableMethod('a', an);

  /**
   * ### .include(val[, msg])
   *
   * When the target is a string, `.include` asserts that the given string `val`
   * is a substring of the target.
   *
   *     expect('foobar').to.include('foo');
   *
   * When the target is an array, `.include` asserts that the given `val` is a
   * member of the target.
   *
   *     expect([1, 2, 3]).to.include(2);
   *
   * When the target is an object, `.include` asserts that the given object
   * `val`'s properties are a subset of the target's properties.
   *
   *     expect({a: 1, b: 2, c: 3}).to.include({a: 1, b: 2});
   *
   * When the target is a Set or WeakSet, `.include` asserts that the given `val` is a
   * member of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Set([1, 2])).to.include(2);
   *
   * When the target is a Map, `.include` asserts that the given `val` is one of
   * the values of the target. SameValueZero equality algorithm is used.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.include(2);
   *
   * Because `.include` does different things based on the target's type, it's
   * important to check the target's type before using `.include`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([1, 2, 3]).to.be.an('array').that.includes(2);
   *
   * By default, strict (`===`) equality is used to compare array members and
   * object properties. Add `.deep` earlier in the chain to use deep equality
   * instead (WeakSet targets are not supported). See the `deep-eql` project
   * page for info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) includes `{a: 1}`
   *     expect([{a: 1}]).to.deep.include({a: 1});
   *     expect([{a: 1}]).to.not.include({a: 1});
   *
   *     // Target object deeply (but not strictly) includes `x: {a: 1}`
   *     expect({x: {a: 1}}).to.deep.include({x: {a: 1}});
   *     expect({x: {a: 1}}).to.not.include({x: {a: 1}});
   *
   * By default, all of the target's properties are searched when working with
   * objects. This includes properties that are inherited and/or non-enumerable.
   * Add `.own` earlier in the chain to exclude the target's inherited
   * properties from the search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.own.include({a: 1});
   *     expect({a: 1}).to.include({b: 2}).but.not.own.include({b: 2});
   *
   * Note that a target object is always only searched for `val`'s own
   * enumerable properties.
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({a: {b: 2}}).to.deep.own.include({a: {b: 2}});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.nested.include({'a.b[1]': 'y'});
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 2}}).to.nested.include({'\\.a.\\[b\\]': 2});
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}}).to.deep.nested.include({'a.b[0]': {c: 3}});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.include`.
   *
   *     expect('foobar').to.not.include('taco');
   *     expect([1, 2, 3]).to.not.include(4);
   * 
   * However, it's dangerous to negate `.include` when the target is an object.
   * The problem is that it creates uncertain expectations by asserting that the
   * target object doesn't have all of `val`'s key/value pairs but may or may
   * not have some of them. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target object isn't even expected to have `val`'s keys, it's
   * often best to assert exactly that.
   *
   *     expect({c: 3}).to.not.have.any.keys('a', 'b'); // Recommended
   *     expect({c: 3}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * When the target object is expected to have `val`'s keys, it's often best to
   * assert that each of the properties has its expected value, rather than
   * asserting that each property doesn't have one of many unexpected values.
   *
   *     expect({a: 3, b: 4}).to.include({a: 3, b: 4}); // Recommended
   *     expect({a: 3, b: 4}).to.not.include({a: 1, b: 2}); // Not recommended
   *
   * `.include` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.include(4, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.include(4);
   *
   * `.include` can also be used as a language chain, causing all `.members` and
   * `.keys` assertions that follow in the chain to require the target to be a
   * superset of the expected set, rather than an identical set. Note that
   * `.members` ignores duplicates in the subset when `.include` is added.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * Note that adding `.any` earlier in the chain causes the `.keys` assertion
   * to ignore `.include`.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *
   * The aliases `.includes`, `.contain`, and `.contains` can be used
   * interchangeably with `.include`.
   *
   * @name include
   * @alias contain
   * @alias includes
   * @alias contains
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function SameValueZero(a, b) {
    return (_.isNaN(a) && _.isNaN(b)) || a === b;
  }

  function includeChainingBehavior () {
    flag(this, 'contains', true);
  }

  function include (val, msg) {
    if (msg) flag(this, 'message', msg);
    
    var obj = flag(this, 'object')
      , objType = _.type(obj).toLowerCase()
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate')
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , descriptor = isDeep ? 'deep ' : '';

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    var included = false;

    switch (objType) {
      case 'string':
        included = obj.indexOf(val) !== -1;
        break;

      case 'weakset':
        if (isDeep) {
          throw new AssertionError(
            flagMsg + 'unable to use .deep.include with WeakSet',
            undefined,
            ssfi
          );
        }

        included = obj.has(val);
        break;

      case 'map':
        var isEql = isDeep ? _.eql : SameValueZero;
        obj.forEach(function (item) {
          included = included || isEql(item, val);
        });
        break;

      case 'set':
        if (isDeep) {
          obj.forEach(function (item) {
            included = included || _.eql(item, val);
          });
        } else {
          included = obj.has(val);
        }
        break;

      case 'array':
        if (isDeep) {
          included = obj.some(function (item) {
            return _.eql(item, val);
          })
        } else {
          included = obj.indexOf(val) !== -1;
        }
        break;

      default:
        // This block is for asserting a subset of properties in an object.
        // `_.expectTypes` isn't used here because `.include` should work with
        // objects with a custom `@@toStringTag`.
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + 'object tested must be an array, a map, an object,'
              + ' a set, a string, or a weakset, but ' + objType + ' given',
            undefined,
            ssfi
          );
        }

        var props = Object.keys(val)
          , firstErr = null
          , numErrs = 0;
  
        props.forEach(function (prop) {
          var propAssertion = new Assertion(obj);
          _.transferFlags(this, propAssertion, true);
          flag(propAssertion, 'lockSsfi', true);
  
          if (!negate || props.length === 1) {
            propAssertion.property(prop, val[prop]);
            return;
          }
  
          try {
            propAssertion.property(prop, val[prop]);
          } catch (err) {
            if (!_.checkError.compatibleConstructor(err, AssertionError)) {
              throw err;
            }
            if (firstErr === null) firstErr = err;
            numErrs++;
          }
        }, this);
  
        // When validating .not.include with multiple properties, we only want
        // to throw an assertion error if all of the properties are included,
        // in which case we throw the first property assertion error that we
        // encountered.
        if (negate && props.length > 1 && numErrs === props.length) {
          throw firstErr;
        }
        return;
    }

    // Assert inclusion in collection or substring in a string.
    this.assert(
      included
      , 'expected #{this} to ' + descriptor + 'include ' + _.inspect(val)
      , 'expected #{this} to not ' + descriptor + 'include ' + _.inspect(val));
  }

  Assertion.addChainableMethod('include', include, includeChainingBehavior);
  Assertion.addChainableMethod('contain', include, includeChainingBehavior);
  Assertion.addChainableMethod('contains', include, includeChainingBehavior);
  Assertion.addChainableMethod('includes', include, includeChainingBehavior);

  /**
   * ### .ok
   *
   * Asserts that the target is loosely (`==`) equal to `true`. However, it's
   * often best to assert that the target is strictly (`===`) or deeply equal to
   * its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.ok; // Not recommended
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.be.ok; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.ok`.
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.not.be.ok; // Not recommended
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.ok; // Not recommended
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.be.ok; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.be.ok; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.ok;
   *
   * @name ok
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('ok', function () {
    this.assert(
        flag(this, 'object')
      , 'expected #{this} to be truthy'
      , 'expected #{this} to be falsy');
  });

  /**
   * ### .true
   *
   * Asserts that the target is strictly (`===`) equal to `true`.
   *
   *     expect(true).to.be.true;
   *
   * Add `.not` earlier in the chain to negate `.true`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `true`.
   *
   *     expect(false).to.be.false; // Recommended
   *     expect(false).to.not.be.true; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.true; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(false, 'nooo why fail??').to.be.true;
   *
   * @name true
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('true', function () {
    this.assert(
        true === flag(this, 'object')
      , 'expected #{this} to be true'
      , 'expected #{this} to be false'
      , flag(this, 'negate') ? false : true
    );
  });

  /**
   * ### .false
   *
   * Asserts that the target is strictly (`===`) equal to `false`.
   *
   *     expect(false).to.be.false;
   *
   * Add `.not` earlier in the chain to negate `.false`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `false`.
   *
   *     expect(true).to.be.true; // Recommended
   *     expect(true).to.not.be.false; // Not recommended
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.false; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(true, 'nooo why fail??').to.be.false;
   *
   * @name false
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('false', function () {
    this.assert(
        false === flag(this, 'object')
      , 'expected #{this} to be false'
      , 'expected #{this} to be true'
      , flag(this, 'negate') ? true : false
    );
  });

  /**
   * ### .null
   *
   * Asserts that the target is strictly (`===`) equal to `null`.
   *
   *     expect(null).to.be.null;
   *
   * Add `.not` earlier in the chain to negate `.null`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `null`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.null; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.null;
   *
   * @name null
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('null', function () {
    this.assert(
        null === flag(this, 'object')
      , 'expected #{this} to be null'
      , 'expected #{this} not to be null'
    );
  });

  /**
   * ### .undefined
   *
   * Asserts that the target is strictly (`===`) equal to `undefined`.
   *
   *     expect(undefined).to.be.undefined;
   *
   * Add `.not` earlier in the chain to negate `.undefined`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to `undefined`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.undefined; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.undefined;
   *
   * @name undefined
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('undefined', function () {
    this.assert(
        undefined === flag(this, 'object')
      , 'expected #{this} to be undefined'
      , 'expected #{this} not to be undefined'
    );
  });

  /**
   * ### .NaN
   *
   * Asserts that the target is exactly `NaN`.
   *
   *     expect(NaN).to.be.NaN;
   *
   * Add `.not` earlier in the chain to negate `.NaN`. However, it's often best
   * to assert that the target is equal to its expected value, rather than not
   * equal to `NaN`.
   *
   *     expect('foo').to.equal('foo'); // Recommended
   *     expect('foo').to.not.be.NaN; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(42, 'nooo why fail??').to.be.NaN;
   *
   * @name NaN
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('NaN', function () {
    this.assert(
        _.isNaN(flag(this, 'object'))
        , 'expected #{this} to be NaN'
        , 'expected #{this} not to be NaN'
    );
  });

  /**
   * ### .exist
   *
   * Asserts that the target is not strictly (`===`) equal to either `null` or
   * `undefined`. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.exist; // Not recommended
   *
   *     expect(0).to.equal(0); // Recommended
   *     expect(0).to.exist; // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.exist`.
   *
   *     expect(null).to.be.null; // Recommended
   *     expect(null).to.not.exist; // Not recommended
   *
   *     expect(undefined).to.be.undefined; // Recommended
   *     expect(undefined).to.not.exist; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(null, 'nooo why fail??').to.exist;
   *
   * @name exist
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('exist', function () {
    var val = flag(this, 'object');
    this.assert(
        val !== null && val !== undefined
      , 'expected #{this} to exist'
      , 'expected #{this} to not exist'
    );
  });

  /**
   * ### .empty
   *
   * When the target is a string or array, `.empty` asserts that the target's
   * `length` property is strictly (`===`) equal to `0`.
   *
   *     expect([]).to.be.empty;
   *     expect('').to.be.empty;
   *
   * When the target is a map or set, `.empty` asserts that the target's `size`
   * property is strictly equal to `0`.
   *
   *     expect(new Set()).to.be.empty;
   *     expect(new Map()).to.be.empty;
   *
   * When the target is a non-function object, `.empty` asserts that the target
   * doesn't have any own enumerable properties. Properties with Symbol-based
   * keys are excluded from the count.
   *
   *     expect({}).to.be.empty;
   *
   * Because `.empty` does different things based on the target's type, it's
   * important to check the target's type before using `.empty`. See the `.a`
   * doc for info on testing a target's type.
   *
   *     expect([]).to.be.an('array').that.is.empty;
   *
   * Add `.not` earlier in the chain to negate `.empty`. However, it's often
   * best to assert that the target contains its expected number of values,
   * rather than asserting that it's not empty.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.not.be.empty; // Not recommended
   *
   *     expect(new Set([1, 2, 3])).to.have.property('size', 3); // Recommended
   *     expect(new Set([1, 2, 3])).to.not.be.empty; // Not recommended
   *
   *     expect(Object.keys({a: 1})).to.have.lengthOf(1); // Recommended
   *     expect({a: 1}).to.not.be.empty; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect([1, 2, 3], 'nooo why fail??').to.be.empty;
   *
   * @name empty
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('empty', function () {
    var val = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , itemsCount;

    flagMsg = flagMsg ? flagMsg + ': ' : '';

    switch (_.type(val).toLowerCase()) {
      case 'array':
      case 'string':
        itemsCount = val.length;
        break;
      case 'map':
      case 'set':
        itemsCount = val.size;
        break;
      case 'weakmap':
      case 'weakset':
        throw new AssertionError(
          flagMsg + '.empty was passed a weak collection',
          undefined,
          ssfi
        );
      case 'function':
        var msg = flagMsg + '.empty was passed a function ' + _.getName(val);
        throw new AssertionError(msg.trim(), undefined, ssfi);
      default:
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + '.empty was passed non-string primitive ' + _.inspect(val),
            undefined,
            ssfi
          );
        }
        itemsCount = Object.keys(val).length;
    }

    this.assert(
        0 === itemsCount
      , 'expected #{this} to be empty'
      , 'expected #{this} not to be empty'
    );
  });

  /**
   * ### .arguments
   *
   * Asserts that the target is an `arguments` object.
   *
   *     function test () {
   *       expect(arguments).to.be.arguments;
   *     }
   *
   *     test();
   *
   * Add `.not` earlier in the chain to negate `.arguments`. However, it's often
   * best to assert which type the target is expected to be, rather than
   * asserting that its not an `arguments` object.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.arguments; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({}, 'nooo why fail??').to.be.arguments;
   *
   * The alias `.Arguments` can be used interchangeably with `.arguments`.
   *
   * @name arguments
   * @alias Arguments
   * @namespace BDD
   * @api public
   */

  function checkArguments () {
    var obj = flag(this, 'object')
      , type = _.type(obj);
    this.assert(
        'Arguments' === type
      , 'expected #{this} to be arguments but got ' + type
      , 'expected #{this} to not be arguments'
    );
  }

  Assertion.addProperty('arguments', checkArguments);
  Assertion.addProperty('Arguments', checkArguments);

  /**
   * ### .equal(val[, msg])
   *
   * Asserts that the target is strictly (`===`) equal to the given `val`.
   *
   *     expect(1).to.equal(1);
   *     expect('foo').to.equal('foo');
   * 
   * Add `.deep` earlier in the chain to use deep equality instead. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) equals `{a: 1}`
   *     expect({a: 1}).to.deep.equal({a: 1});
   *     expect({a: 1}).to.not.equal({a: 1});
   *
   *     // Target array deeply (but not strictly) equals `[1, 2]`
   *     expect([1, 2]).to.deep.equal([1, 2]);
   *     expect([1, 2]).to.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.equal`. However, it's often
   * best to assert that the target is equal to its expected value, rather than
   * not equal to one of countless unexpected values.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.equal(2); // Not recommended
   *
   * `.equal` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.equal(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.equal(2);
   *
   * The aliases `.equals` and `eq` can be used interchangeably with `.equal`.
   *
   * @name equal
   * @alias equals
   * @alias eq
   * @param {Mixed} val
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEqual (val, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    if (flag(this, 'deep')) {
      return this.eql(val);
    } else {
      this.assert(
          val === obj
        , 'expected #{this} to equal #{exp}'
        , 'expected #{this} to not equal #{exp}'
        , val
        , this._obj
        , true
      );
    }
  }

  Assertion.addMethod('equal', assertEqual);
  Assertion.addMethod('equals', assertEqual);
  Assertion.addMethod('eq', assertEqual);

  /**
   * ### .eql(obj[, msg])
   *
   * Asserts that the target is deeply equal to the given `obj`. See the
   * `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target object is deeply (but not strictly) equal to {a: 1}
   *     expect({a: 1}).to.eql({a: 1}).but.not.equal({a: 1});
   *
   *     // Target array is deeply (but not strictly) equal to [1, 2]
   *     expect([1, 2]).to.eql([1, 2]).but.not.equal([1, 2]);
   *
   * Add `.not` earlier in the chain to negate `.eql`. However, it's often best
   * to assert that the target is deeply equal to its expected value, rather
   * than not deeply equal to one of countless unexpected values.
   *
   *     expect({a: 1}).to.eql({a: 1}); // Recommended
   *     expect({a: 1}).to.not.eql({b: 2}); // Not recommended
   *
   * `.eql` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect({a: 1}).to.eql({b: 2}, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.eql({b: 2});
   *
   * The alias `.eqls` can be used interchangeably with `.eql`.
   *
   * The `.deep.equal` assertion is almost identical to `.eql` but with one
   * difference: `.deep.equal` causes deep equality comparisons to also be used
   * for any other assertions that follow in the chain.
   *
   * @name eql
   * @alias eqls
   * @param {Mixed} obj
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertEql(obj, msg) {
    if (msg) flag(this, 'message', msg);
    this.assert(
        _.eql(obj, flag(this, 'object'))
      , 'expected #{this} to deeply equal #{exp}'
      , 'expected #{this} to not deeply equal #{exp}'
      , obj
      , this._obj
      , true
    );
  }

  Assertion.addMethod('eql', assertEql);
  Assertion.addMethod('eqls', assertEql);

  /**
   * ### .above(n[, msg])
   *
   * Asserts that the target is a number or a date greater than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.above(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the value of the
   * target's `length` property is greater than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.above(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.above`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(1).to.not.be.above(2); // Not recommended
   *
   * `.above` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.above(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.above(2);
   *
   * The aliases `.gt` and `.greaterThan` can be used interchangeably with
   * `.above`.
   *
   * @name above
   * @alias gt
   * @alias greaterThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertAbove (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , shouldThrow = true;

    if (doLength) {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }
    
    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to above must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to above must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var len = obj.length;
      this.assert(
          len > n
        , 'expected #{this} to have a length above #{exp} but got #{act}'
        , 'expected #{this} to not have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj > n
        , 'expected #{this} to be above #{exp}'
        , 'expected #{this} to be at most #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('above', assertAbove);
  Assertion.addMethod('gt', assertAbove);
  Assertion.addMethod('greaterThan', assertAbove);

  /**
   * ### .least(n[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `n` respectively. However, it's often best to assert that the target is equal to
   * its expected value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.at.least(1); // Not recommended
   *     expect(2).to.be.at.least(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the value of the
   * target's `length` property is greater than or equal to the given number
   * `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.least(2); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.least`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.at.least(2); // Not recommended
   *
   * `.least` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.at.least(2, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.at.least(2);
   *
   * The alias `.gte` can be used interchangeably with `.least`.
   *
   * @name least
   * @alias gte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLeast (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , shouldThrow = true;

    if (doLength) {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to least must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to least must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var len = obj.length;
      this.assert(
          len >= n
        , 'expected #{this} to have a length at least #{exp} but got #{act}'
        , 'expected #{this} to have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj >= n
        , 'expected #{this} to be at least #{exp}'
        , 'expected #{this} to be below #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('least', assertLeast);
  Assertion.addMethod('gte', assertLeast);

  /**
   * ### .below(n[, msg])
   *
   * Asserts that the target is a number or a date less than the given number or date `n` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.below(2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the value of the
   * target's `length` property is less than the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.below(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.length(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.below(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.below`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.below(1); // Not recommended
   *
   * `.below` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.below(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.below(1);
   *
   * The aliases `.lt` and `.lessThan` can be used interchangeably with
   * `.below`.
   *
   * @name below
   * @alias lt
   * @alias lessThan
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertBelow (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , shouldThrow = true;

    if (doLength) {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to below must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to below must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var len = obj.length;
      this.assert(
          len < n
        , 'expected #{this} to have a length below #{exp} but got #{act}'
        , 'expected #{this} to not have a length below #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj < n
        , 'expected #{this} to be below #{exp}'
        , 'expected #{this} to be at least #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('below', assertBelow);
  Assertion.addMethod('lt', assertBelow);
  Assertion.addMethod('lessThan', assertBelow);

  /**
   * ### .most(n[, msg])
   *
   * Asserts that the target is a number or a date less than or equal to the given number
   * or date `n` respectively. However, it's often best to assert that the target is equal to its
   * expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.at.most(2); // Not recommended
   *     expect(1).to.be.at.most(1); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the value of the
   * target's `length` property is less than or equal to the given number `n`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.at.most(4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.most`.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.not.be.at.most(1); // Not recommended
   *
   * `.most` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(2).to.be.at.most(1, 'nooo why fail??');
   *     expect(2, 'nooo why fail??').to.be.at.most(1);
   *
   * The alias `.lte` can be used interchangeably with `.most`.
   *
   * @name most
   * @alias lte
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertMost (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , nType = _.type(n).toLowerCase()
      , shouldThrow = true;

    if (doLength) {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }
    
    if (!doLength && (objType === 'date' && nType !== 'date')) {
      errorMessage = msgPrefix + 'the argument to most must be a date';
    } else if (nType !== 'number' && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the argument to most must be a number';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var len = obj.length;
      this.assert(
          len <= n
        , 'expected #{this} to have a length at most #{exp} but got #{act}'
        , 'expected #{this} to have a length above #{exp}'
        , n
        , len
      );
    } else {
      this.assert(
          obj <= n
        , 'expected #{this} to be at most #{exp}'
        , 'expected #{this} to be above #{exp}'
        , n
      );
    }
  }

  Assertion.addMethod('most', assertMost);
  Assertion.addMethod('lte', assertMost);

  /**
   * ### .within(start, finish[, msg])
   *
   * Asserts that the target is a number or a date greater than or equal to the given
   * number or date `start`, and less than or equal to the given number or date `finish` respectively.
   * However, it's often best to assert that the target is equal to its expected
   * value.
   *
   *     expect(2).to.equal(2); // Recommended
   *     expect(2).to.be.within(1, 3); // Not recommended
   *     expect(2).to.be.within(2, 3); // Not recommended
   *     expect(2).to.be.within(1, 2); // Not recommended
   *
   * Add `.lengthOf` earlier in the chain to assert that the value of the
   * target's `length` property is greater than or equal to the given number
   * `start`, and less than or equal to the given number `finish`.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.have.lengthOf.within(2, 4); // Not recommended
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3); // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf.within(2, 4); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.within`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.within(2, 4); // Not recommended
   *
   * `.within` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(4).to.be.within(1, 3, 'nooo why fail??');
   *     expect(4, 'nooo why fail??').to.be.within(1, 3);
   *
   * @name within
   * @param {Number} start lower bound inclusive
   * @param {Number} finish upper bound inclusive
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('within', function (start, finish, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , doLength = flag(this, 'doLength')
      , flagMsg = flag(this, 'message')
      , msgPrefix = ((flagMsg) ? flagMsg + ': ' : '')
      , ssfi = flag(this, 'ssfi')
      , objType = _.type(obj).toLowerCase()
      , startType = _.type(start).toLowerCase()
      , finishType = _.type(finish).toLowerCase()
      , shouldThrow = true
      , range = (startType === 'date' && finishType === 'date')
          ? start.toUTCString() + '..' + finish.toUTCString()
          : start + '..' + finish;

    if (doLength) {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    }

    if (!doLength && (objType === 'date' && (startType !== 'date' || finishType !== 'date'))) {
      errorMessage = msgPrefix + 'the arguments to within must be dates';
    } else if ((startType !== 'number' || finishType !== 'number') && (doLength || objType === 'number')) {
      errorMessage = msgPrefix + 'the arguments to within must be numbers';
    } else if (!doLength && (objType !== 'date' && objType !== 'number')) {
      var printObj = (objType === 'string') ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + 'expected ' + printObj + ' to be a number or a date';
    } else {
      shouldThrow = false;
    }

    if (shouldThrow) {
      throw new AssertionError(errorMessage, undefined, ssfi);
    }

    if (doLength) {
      var len = obj.length;
      this.assert(
          len >= start && len <= finish
        , 'expected #{this} to have a length within ' + range
        , 'expected #{this} to not have a length within ' + range
      );
    } else {
      this.assert(
          obj >= start && obj <= finish
        , 'expected #{this} to be within ' + range
        , 'expected #{this} to not be within ' + range
      );
    }
  });

  /**
   * ### .instanceof(constructor[, msg])
   *
   * Asserts that the target is an instance of the given `constructor`.
   *
   *     function Cat () { }
   *
   *     expect(new Cat()).to.be.an.instanceof(Cat);
   *     expect([1, 2]).to.be.an.instanceof(Array);
   *
   * Add `.not` earlier in the chain to negate `.instanceof`.
   *
   *     expect({a: 1}).to.not.be.an.instanceof(Array);
   *
   * `.instanceof` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.be.an.instanceof(Array, 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.an.instanceof(Array);
   *
   * Due to limitations in ES5, `.instanceof` may not always work as expected
   * when using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing built-in object such as
   * `Array`, `Error`, and `Map`. See your transpiler's docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * The alias `.instanceOf` can be used interchangeably with `.instanceof`.
   *
   * @name instanceof
   * @param {Constructor} constructor
   * @param {String} msg _optional_
   * @alias instanceOf
   * @namespace BDD
   * @api public
   */

  function assertInstanceOf (constructor, msg) {
    if (msg) flag(this, 'message', msg);

    var target = flag(this, 'object')
    var ssfi = flag(this, 'ssfi');
    var flagMsg = flag(this, 'message');

    try {
      var isInstanceOf = target instanceof constructor;
    } catch (err) {
      if (err instanceof TypeError) {
        flagMsg = flagMsg ? flagMsg + ': ' : '';
        throw new AssertionError(
          flagMsg + 'The instanceof assertion needs a constructor but '
            + _.type(constructor) + ' was given.',
          undefined,
          ssfi
        );
      }
      throw err;
    }

    var name = _.getName(constructor);
    if (name === null) {
      name = 'an unnamed constructor';
    }

    this.assert(
        isInstanceOf
      , 'expected #{this} to be an instance of ' + name
      , 'expected #{this} to not be an instance of ' + name
    );
  };

  Assertion.addMethod('instanceof', assertInstanceOf);
  Assertion.addMethod('instanceOf', assertInstanceOf);

  /**
   * ### .property(name[, val[, msg]])
   *
   * Asserts that the target has a property with the given key `name`.
   *
   *     expect({a: 1}).to.have.property('a');
   *
   * When `val` is provided, `.property` also asserts that the property's value
   * is equal to the given `val`.
   *
   *     expect({a: 1}).to.have.property('a', 1);
   *
   * By default, strict (`===`) equality is used. Add `.deep` earlier in the
   * chain to use deep equality instead. See the `deep-eql` project page for
   * info on the deep equality algorithm: https://github.com/chaijs/deep-eql.
   *
   *     // Target object deeply (but not strictly) has property `x: {a: 1}`
   *     expect({x: {a: 1}}).to.have.deep.property('x', {a: 1});
   *     expect({x: {a: 1}}).to.not.have.property('x', {a: 1});
   *
   * The target's enumerable and non-enumerable properties are always included
   * in the search. By default, both own and inherited properties are included.
   * Add `.own` earlier in the chain to exclude inherited properties from the
   * search.
   *
   *     Object.prototype.b = 2;
   *
   *     expect({a: 1}).to.have.own.property('a');
   *     expect({a: 1}).to.have.own.property('a', 1);
   *     expect({a: 1}).to.have.property('b').but.not.own.property('b'); 
   *
   * `.deep` and `.own` can be combined.
   *
   *     expect({x: {a: 1}}).to.have.deep.own.property('x', {a: 1});
   *
   * Add `.nested` earlier in the chain to enable dot- and bracket-notation when
   * referencing nested properties.
   *
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]');
   *     expect({a: {b: ['x', 'y']}}).to.have.nested.property('a.b[1]', 'y');
   *
   * If `.` or `[]` are part of an actual property name, they can be escaped by
   * adding two backslashes before them.
   *
   *     expect({'.a': {'[b]': 'x'}}).to.have.nested.property('\\.a.\\[b\\]');
   *
   * `.deep` and `.nested` can be combined.
   *
   *     expect({a: {b: [{c: 3}]}})
   *       .to.have.deep.nested.property('a.b[0]', {c: 3});
   *
   * `.own` and `.nested` cannot be combined.
   *
   * Add `.not` earlier in the chain to negate `.property`.
   *
   *     expect({a: 1}).to.not.have.property('b');
   * 
   * However, it's dangerous to negate `.property` when providing `val`. The
   * problem is that it creates uncertain expectations by asserting that the
   * target either doesn't have a property with the given key `name`, or that it
   * does have a property with the given key `name` but its value isn't equal to
   * the given `val`. It's often best to identify the exact output that's
   * expected, and then write an assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property with the given key
   * `name`, it's often best to assert exactly that.
   *
   *     expect({b: 2}).to.not.have.property('a'); // Recommended
   *     expect({b: 2}).to.not.have.property('a', 1); // Not recommended
   *
   * When the target is expected to have a property with the given key `name`,
   * it's often best to assert that the property has its expected value, rather
   * than asserting that it doesn't have one of many unexpected values.
   *
   *     expect({a: 3}).to.have.property('a', 3); // Recommended
   *     expect({a: 3}).to.not.have.property('a', 1); // Not recommended
   *
   * `.property` changes the target of any assertions that follow in the chain
   * to be the value of the property from the original target object.
   *
   *     expect({a: 1}).to.have.property('a').that.is.a('number');
   *
   * `.property` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing `val`, only use the
   * second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.property('a', 2, 'nooo why fail??');
   *     expect({a: 1}, 'nooo why fail??').to.have.property('a', 2);
   *     expect({a: 1}, 'nooo why fail??').to.have.property('b');
   *
   *     // Not recommended
   *     expect({a: 1}).to.have.property('b', undefined, 'nooo why fail??');
   * 
   * The above assertion isn't the same thing as not providing `val`. Instead,
   * it's asserting that the target object has a `b` property that's equal to
   * `undefined`.
   *
   * The assertions `.ownProperty` and `.haveOwnProperty` can be used
   * interchangeably with `.own.property`.
   *
   * @name property
   * @param {String} name
   * @param {Mixed} val (optional)
   * @param {String} msg _optional_
   * @returns value of property for chaining
   * @namespace BDD
   * @api public
   */

  function assertProperty (name, val, msg) {
    if (msg) flag(this, 'message', msg);

    var isNested = flag(this, 'nested')
      , isOwn = flag(this, 'own')
      , flagMsg = flag(this, 'message')
      , obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi');

    if (isNested && isOwn) {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      throw new AssertionError(
        flagMsg + 'The "nested" and "own" flags cannot be combined.',
        undefined,
        ssfi
      );
    }

    if (obj === null || obj === undefined) {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      throw new AssertionError(
        flagMsg + 'Target cannot be null or undefined.',
        undefined,
        ssfi
      );
    }

    var isDeep = flag(this, 'deep')
      , negate = flag(this, 'negate')
      , pathInfo = isNested ? _.getPathInfo(obj, name) : null
      , value = isNested ? pathInfo.value : obj[name];

    var descriptor = '';
    if (isDeep) descriptor += 'deep ';
    if (isOwn) descriptor += 'own ';
    if (isNested) descriptor += 'nested ';
    descriptor += 'property ';

    var hasProperty;
    if (isOwn) hasProperty = Object.prototype.hasOwnProperty.call(obj, name);
    else if (isNested) hasProperty = pathInfo.exists;
    else hasProperty = _.hasProperty(obj, name);

    // When performing a negated assertion for both name and val, merely having
    // a property with the given name isn't enough to cause the assertion to
    // fail. It must both have a property with the given name, and the value of
    // that property must equal the given val. Therefore, skip this assertion in
    // favor of the next.
    if (!negate || arguments.length === 1) {
      this.assert(
          hasProperty
        , 'expected #{this} to have ' + descriptor + _.inspect(name)
        , 'expected #{this} to not have ' + descriptor + _.inspect(name));
    }

    if (arguments.length > 1) {
      this.assert(
          hasProperty && (isDeep ? _.eql(val, value) : val === value)
        , 'expected #{this} to have ' + descriptor + _.inspect(name) + ' of #{exp}, but got #{act}'
        , 'expected #{this} to not have ' + descriptor + _.inspect(name) + ' of #{act}'
        , val
        , value
      );
    }

    flag(this, 'object', value);
  }

  Assertion.addMethod('property', assertProperty);

  function assertOwnProperty (name, value, msg) {
    flag(this, 'own', true);
    assertProperty.apply(this, arguments);
  }

  Assertion.addMethod('ownProperty', assertOwnProperty);
  Assertion.addMethod('haveOwnProperty', assertOwnProperty);

  /**
   * ### .ownPropertyDescriptor(name[, descriptor[, msg]])
   *
   * Asserts that the target has its own property descriptor with the given key
   * `name`. Enumerable and non-enumerable properties are included in the
   * search.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a');
   *
   * When `descriptor` is provided, `.ownPropertyDescriptor` also asserts that
   * the property's descriptor is deeply equal to the given `descriptor`. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * Add `.not` earlier in the chain to negate `.ownPropertyDescriptor`.
   *
   *     expect({a: 1}).to.not.have.ownPropertyDescriptor('b');
   * 
   * However, it's dangerous to negate `.ownPropertyDescriptor` when providing
   * a `descriptor`. The problem is that it creates uncertain expectations by
   * asserting that the target either doesn't have a property descriptor with
   * the given key `name`, or that it does have a property descriptor with the
   * given key `name` but its not deeply equal to the given `descriptor`. It's
   * often best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to have a property descriptor with the given
   * key `name`, it's often best to assert exactly that.
   *
   *     // Recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a');
   *
   *     // Not recommended
   *     expect({b: 2}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * When the target is expected to have a property descriptor with the given
   * key `name`, it's often best to assert that the property has its expected
   * descriptor, rather than asserting that it doesn't have one of many
   * unexpected descriptors.
   *
   *     // Recommended
   *     expect({a: 3}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 3,
   *     });
   *
   *     // Not recommended
   *     expect({a: 3}).to.not.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 1,
   *     });
   *
   * `.ownPropertyDescriptor` changes the target of any assertions that follow
   * in the chain to be the value of the property descriptor from the original
   * target object.
   *
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a')
   *       .that.has.property('enumerable', true);
   *
   * `.ownPropertyDescriptor` accepts an optional `msg` argument which is a
   * custom error message to show when the assertion fails. The message can also
   * be given as the second argument to `expect`. When not providing
   * `descriptor`, only use the second form.
   *
   *     // Recommended
   *     expect({a: 1}).to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     }, 'nooo why fail??');
   *
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('a', {
   *       configurable: true,
   *       enumerable: true,
   *       writable: true,
   *       value: 2,
   *     });
   * 
   *     // Recommended
   *     expect({a: 1}, 'nooo why fail??').to.have.ownPropertyDescriptor('b');
   *
   *     // Not recommended
   *     expect({a: 1})
   *       .to.have.ownPropertyDescriptor('b', undefined, 'nooo why fail??');
   *
   * The above assertion isn't the same thing as not providing `descriptor`.
   * Instead, it's asserting that the target object has a `b` property
   * descriptor that's deeply equal to `undefined`.
   *
   * The alias `.haveOwnPropertyDescriptor` can be used interchangeably with
   * `.ownPropertyDescriptor`.
   *
   * @name ownPropertyDescriptor
   * @alias haveOwnPropertyDescriptor
   * @param {String} name
   * @param {Object} descriptor _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertOwnPropertyDescriptor (name, descriptor, msg) {
    if (typeof descriptor === 'string') {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    if (actualDescriptor && descriptor) {
      this.assert(
          _.eql(descriptor, actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to match ' + _.inspect(descriptor) + ', got ' + _.inspect(actualDescriptor)
        , 'expected the own property descriptor for ' + _.inspect(name) + ' on #{this} to not match ' + _.inspect(descriptor)
        , descriptor
        , actualDescriptor
        , true
      );
    } else {
      this.assert(
          actualDescriptor
        , 'expected #{this} to have an own property descriptor for ' + _.inspect(name)
        , 'expected #{this} to not have an own property descriptor for ' + _.inspect(name)
      );
    }
    flag(this, 'object', actualDescriptor);
  }

  Assertion.addMethod('ownPropertyDescriptor', assertOwnPropertyDescriptor);
  Assertion.addMethod('haveOwnPropertyDescriptor', assertOwnPropertyDescriptor);

  /**
   * ### .lengthOf(n[, msg])
   *
   * Asserts that the target's `length` property is equal to the given number
   * `n`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *     expect('foo').to.have.lengthOf(3);
   *
   * Add `.not` earlier in the chain to negate `.lengthOf`. However, it's often
   * best to assert that the target's `length` property is equal to its expected
   * value, rather than not equal to one of many unexpected values.
   *
   *     expect('foo').to.have.lengthOf(3); // Recommended
   *     expect('foo').to.not.have.lengthOf(4); // Not recommended
   *
   * `.lengthOf` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2, 3]).to.have.lengthOf(2, 'nooo why fail??');
   *     expect([1, 2, 3], 'nooo why fail??').to.have.lengthOf(2);
   *
   * `.lengthOf` can also be used as a language chain, causing all `.above`,
   * `.below`, `.least`, `.most`, and `.within` assertions that follow in the
   * chain to use the target's `length` property as the target. However, it's
   * often best to assert that the target's `length` property is equal to its
   * expected length, rather than asserting that its `length` property falls
   * within some range of values.
   *
   *     // Recommended
   *     expect([1, 2, 3]).to.have.lengthOf(3);
   *
   *     // Not recommended
   *     expect([1, 2, 3]).to.have.lengthOf.above(2);
   *     expect([1, 2, 3]).to.have.lengthOf.below(4);
   *     expect([1, 2, 3]).to.have.lengthOf.at.least(3);
   *     expect([1, 2, 3]).to.have.lengthOf.at.most(3);
   *     expect([1, 2, 3]).to.have.lengthOf.within(2,4);
   *
   * Due to a compatibility issue, the alias `.length` can't be chained directly
   * off of an uninvoked method such as `.a`. Therefore, `.length` can't be used
   * interchangeably with `.lengthOf` in every situation. It's recommended to
   * always use `.lengthOf` instead of `.length`.
   *
   *     expect([1, 2, 3]).to.have.a.length(3); // incompatible; throws error
   *     expect([1, 2, 3]).to.have.a.lengthOf(3);  // passes as expected
   *
   * @name lengthOf
   * @alias length
   * @param {Number} n
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertLengthChain () {
    flag(this, 'doLength', true);
  }

  function assertLength (n, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(obj, flagMsg, ssfi, true).to.have.property('length');
    var len = obj.length;

    this.assert(
        len == n
      , 'expected #{this} to have a length of #{exp} but got #{act}'
      , 'expected #{this} to not have a length of #{act}'
      , n
      , len
    );
  }

  Assertion.addChainableMethod('length', assertLength, assertLengthChain);
  Assertion.addChainableMethod('lengthOf', assertLength, assertLengthChain);

  /**
   * ### .match(re[, msg])
   *
   * Asserts that the target matches the given regular expression `re`.
   *
   *     expect('foobar').to.match(/^foo/);
   *
   * Add `.not` earlier in the chain to negate `.match`.
   *
   *     expect('foobar').to.not.match(/taco/);
   *
   * `.match` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect('foobar').to.match(/taco/, 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.match(/taco/);
   *
   * The alias `.matches` can be used interchangeably with `.match`.
   *
   * @name match
   * @alias matches
   * @param {RegExp} re
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */
  function assertMatch(re, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    this.assert(
        re.exec(obj)
      , 'expected #{this} to match ' + re
      , 'expected #{this} not to match ' + re
    );
  }

  Assertion.addMethod('match', assertMatch);
  Assertion.addMethod('matches', assertMatch);

  /**
   * ### .string(str[, msg])
   *
   * Asserts that the target string contains the given substring `str`.
   *
   *     expect('foobar').to.have.string('bar');
   *
   * Add `.not` earlier in the chain to negate `.string`.
   *
   *     expect('foobar').to.not.have.string('taco');
   *
   * `.string` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect('foobar').to.have.string(/taco/, 'nooo why fail??');
   *     expect('foobar', 'nooo why fail??').to.have.string(/taco/);
   *
   * @name string
   * @param {String} str
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('string', function (str, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(obj, flagMsg, ssfi, true).is.a('string');

    this.assert(
        ~obj.indexOf(str)
      , 'expected #{this} to contain ' + _.inspect(str)
      , 'expected #{this} to not contain ' + _.inspect(str)
    );
  });

  /**
   * ### .keys(key1[, key2[, ...]])
   *
   * Asserts that the target object, array, map, or set has the given keys. Only
   * the target's own inherited properties are included in the search. 
   *
   * When the target is an object or array, keys can be provided as one or more
   * string arguments, a single array argument, or a single object argument. In
   * the latter case, only the keys in the given object matter; the values are
   * ignored.
   *
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *     expect(['x', 'y']).to.have.all.keys(0, 1);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys(['a', 'b']);
   *     expect(['x', 'y']).to.have.all.keys([0, 1]);
   *
   *     expect({a: 1, b: 2}).to.have.all.keys({a: 4, b: 5}); // ignore 4 and 5
   *     expect(['x', 'y']).to.have.all.keys({0: 4, 1: 5}); // ignore 4 and 5
   *
   * When the target is a map or set, each key must be provided as a separate
   * argument.
   *
   *     expect(new Map([['a', 1], ['b', 2]])).to.have.all.keys('a', 'b');
   *     expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');
   *
   * Because `.keys` does different things based on the target's type, it's
   * important to check the target's type before using `.keys`. See the `.a` doc
   * for info on testing a target's type.
   *
   *     expect({a: 1, b: 2}).to.be.an('object').that.has.all.keys('a', 'b');
   *
   * By default, strict (`===`) equality is used to compare keys of maps and
   * sets. Add `.deep` earlier in the chain to use deep equality instead. See
   * the `deep-eql` project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target set deeply (but not strictly) has key `{a: 1}`
   *     expect(new Set([{a: 1}])).to.have.all.deep.keys([{a: 1}]);
   *     expect(new Set([{a: 1}])).to.not.have.all.keys([{a: 1}]);
   *
   * By default, the target must have all of the given keys and no more. Add
   * `.any` earlier in the chain to only require that the target have at least
   * one of the given keys. Also, add `.not` earlier in the chain to negate
   * `.keys`. It's often best to add `.any` when negating `.keys`, and to use
   * `.all` when asserting `.keys` without negation.
   *
   * When negating `.keys`, `.any` is preferred because `.not.any.keys` asserts
   * exactly what's expected of the output, whereas `.not.all.keys` creates
   * uncertain expectations.
   *
   *     // Recommended; asserts that target doesn't have any of the given keys
   *     expect({a: 1, b: 2}).to.not.have.any.keys('c', 'd');
   *
   *     // Not recommended; asserts that target doesn't have all of the given
   *     // keys but may or may not have some of them
   *     expect({a: 1, b: 2}).to.not.have.all.keys('c', 'd');
   *
   * When asserting `.keys` without negation, `.all` is preferred because
   * `.all.keys` asserts exactly what's expected of the output, whereas
   * `.any.keys` creates uncertain expectations.
   *
   *     // Recommended; asserts that target has all the given keys
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b');
   *
   *     // Not recommended; asserts that target has at least one of the given
   *     // keys but may or may not have more of them
   *     expect({a: 1, b: 2}).to.have.any.keys('a', 'b');
   *
   * Note that `.all` is used by default when neither `.all` nor `.any` appear
   * earlier in the chain. However, it's often best to add `.all` anyway because
   * it improves readability.
   *
   *     // Both assertions are identical
   *     expect({a: 1, b: 2}).to.have.all.keys('a', 'b'); // Recommended
   *     expect({a: 1, b: 2}).to.have.keys('a', 'b'); // Not recommended
   *
   * Add `.include` earlier in the chain to require that the target's keys be a
   * superset of the expected keys, rather than identical sets.
   *
   *     // Target object's keys are a superset of ['a', 'b'] but not identical
   *     expect({a: 1, b: 2, c: 3}).to.include.all.keys('a', 'b');
   *     expect({a: 1, b: 2, c: 3}).to.not.have.all.keys('a', 'b');
   *
   * However, if `.any` and `.include` are combined, only the `.any` takes
   * effect. The `.include` is ignored in this case.
   *
   *     // Both assertions are identical
   *     expect({a: 1}).to.have.any.keys('a', 'b');
   *     expect({a: 1}).to.include.any.keys('a', 'b');
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.have.key('b');
   *
   * The alias `.key` can be used interchangeably with `.keys`.
   *
   * @name keys
   * @alias key
   * @param {...String|Array|Object} keys
   * @namespace BDD
   * @api public
   */

  function assertKeys (keys) {
    var obj = flag(this, 'object')
      , objType = _.type(obj)
      , keysType = _.type(keys)
      , ssfi = flag(this, 'ssfi')
      , isDeep = flag(this, 'deep')
      , str
      , deepStr = ''
      , ok = true
      , flagMsg = flag(this, 'message');

    flagMsg = flagMsg ? flagMsg + ': ' : '';
    var mixedArgsMsg = flagMsg + 'when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments';

    if (objType === 'Map' || objType === 'Set') {
      deepStr = isDeep ? 'deeply ' : '';
      actual = [];

      // Map and Set '.keys' aren't supported in IE 11. Therefore, use .forEach.
      obj.forEach(function (val, key) { actual.push(key) });

      if (keysType !== 'Array') {
        keys = Array.prototype.slice.call(arguments);
      }

    } else {
      actual = _.getOwnEnumerableProperties(obj);

      switch (keysType) {
        case 'Array':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          break;
        case 'Object':
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, undefined, ssfi);
          }
          keys = Object.keys(keys);
          break;
        default:
          keys = Array.prototype.slice.call(arguments);
      }

      // Only stringify non-Symbols because Symbols would become "Symbol()"
      keys = keys.map(function (val) {
        return typeof val === 'symbol' ? val : String(val);
      });
    }

    if (!keys.length) {
      throw new AssertionError(flagMsg + 'keys required', undefined, ssfi);
    }

    var len = keys.length
      , any = flag(this, 'any')
      , all = flag(this, 'all')
      , expected = keys
      , actual;

    if (!any && !all) {
      all = true;
    }

    // Has any
    if (any) {
      ok = expected.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });
    }

    // Has all
    if (all) {
      ok = expected.every(function(expectedKey) {
        return actual.some(function(actualKey) {
          if (isDeep) {
            return _.eql(expectedKey, actualKey);
          } else {
            return expectedKey === actualKey;
          }
        });
      });

      if (!flag(this, 'contains')) {
        ok = ok && keys.length == actual.length;
      }
    }

    // Key string
    if (len > 1) {
      keys = keys.map(function(key) {
        return _.inspect(key);
      });
      var last = keys.pop();
      if (all) {
        str = keys.join(', ') + ', and ' + last;
      }
      if (any) {
        str = keys.join(', ') + ', or ' + last;
      }
    } else {
      str = _.inspect(keys[0]);
    }

    // Form
    str = (len > 1 ? 'keys ' : 'key ') + str;

    // Have / include
    str = (flag(this, 'contains') ? 'contain ' : 'have ') + str;

    // Assertion
    this.assert(
        ok
      , 'expected #{this} to ' + deepStr + str
      , 'expected #{this} to not ' + deepStr + str
      , expected.slice(0).sort(_.compareByInspect)
      , actual.sort(_.compareByInspect)
      , true
    );
  }

  Assertion.addMethod('keys', assertKeys);
  Assertion.addMethod('key', assertKeys);

  /**
   * ### .throw([errorLike], [errMsgMatcher], [msg])
   *
   * When no arguments are provided, `.throw` invokes the target function and
   * asserts that an error is thrown.
   * 
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw();
   *
   * When one argument is provided, and it's an error constructor, `.throw`
   * invokes the target function and asserts that an error is thrown that's an
   * instance of that error constructor.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError);
   *
   * When one argument is provided, and it's an error instance, `.throw` invokes
   * the target function and asserts that an error is thrown that's strictly
   * (`===`) equal to that error instance.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(err);
   *
   * When one argument is provided, and it's a string, `.throw` invokes the
   * target function and asserts that an error is thrown with a message that
   * contains that string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw('salmon');
   *
   * When one argument is provided, and it's a regular expression, `.throw`
   * invokes the target function and asserts that an error is thrown with a
   * message that matches that regular expression.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(/salmon/);
   *
   * When two arguments are provided, and the first is an error instance or
   * constructor, and the second is a string or regular expression, `.throw`
   * invokes the function and asserts that an error is thrown that fulfills both
   * conditions as described above.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon');
   *     expect(badFn).to.throw(TypeError, /salmon/);
   *     expect(badFn).to.throw(err, 'salmon');
   *     expect(badFn).to.throw(err, /salmon/);
   *
   * Add `.not` earlier in the chain to negate `.throw`.
   *     
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw();
   * 
   * However, it's dangerous to negate `.throw` when providing any arguments.
   * The problem is that it creates uncertain expectations by asserting that the
   * target either doesn't throw an error, or that it throws an error but of a
   * different type than the given type, or that it throws an error of the given
   * type but with a message that doesn't include the given string. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to throw an error, it's often best to assert
   * exactly that.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.not.throw(); // Recommended
   *     expect(goodFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * When the target is expected to throw an error, it's often best to assert
   * that the error is of its expected type, and has a message that includes an
   * expected string, rather than asserting that it doesn't have one of many
   * unexpected types, and doesn't have a message that includes some string.
   *
   *     var badFn = function () { throw new TypeError('Illegal salmon!'); };
   *
   *     expect(badFn).to.throw(TypeError, 'salmon'); // Recommended
   *     expect(badFn).to.not.throw(ReferenceError, 'x'); // Not recommended
   *
   * `.throw` changes the target of any assertions that follow in the chain to
   * be the error object that's thrown.
   *
   *     var err = new TypeError('Illegal salmon!');
   *     err.code = 42;
   *     var badFn = function () { throw err; };
   *
   *     expect(badFn).to.throw(TypeError).with.property('code', 42);
   *
   * `.throw` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`. When not providing two arguments, always use
   * the second form.
   *
   *     var goodFn = function () {};
   *
   *     expect(goodFn).to.throw(TypeError, 'x', 'nooo why fail??');
   *     expect(goodFn, 'nooo why fail??').to.throw();
   *
   * Due to limitations in ES5, `.throw` may not always work as expected when
   * using a transpiler such as Babel or TypeScript. In particular, it may
   * produce unexpected results when subclassing the built-in `Error` object and
   * then passing the subclassed constructor to `.throw`. See your transpiler's
   * docs for details:
   *
   * - ([Babel](https://babeljs.io/docs/usage/caveats/#classes))
   * - ([TypeScript](https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work))
   *
   * Beware of some common mistakes when using the `throw` assertion. One common
   * mistake is to accidentally invoke the function yourself instead of letting
   * the `throw` assertion invoke the function for you. For example, when
   * testing if a function named `fn` throws, provide `fn` instead of `fn()` as
   * the target for the assertion.
   *
   *     expect(fn).to.throw();     // Good! Tests `fn` as desired
   *     expect(fn()).to.throw();   // Bad! Tests result of `fn()`, not `fn`
   *
   * If you need to assert that your function `fn` throws when passed certain
   * arguments, then wrap a call to `fn` inside of another function.
   *
   *     expect(function () { fn(42); }).to.throw();  // Function expression
   *     expect(() => fn(42)).to.throw();             // ES6 arrow function
   *
   * Another common mistake is to provide an object method (or any stand-alone
   * function that relies on `this`) as the target of the assertion. Doing so is
   * problematic because the `this` context will be lost when the function is
   * invoked by `.throw`; there's no way for it to know what `this` is supposed
   * to be. There are two ways around this problem. One solution is to wrap the
   * method or function call inside of another function. Another solution is to
   * use `bind`.
   *
   *     expect(function () { cat.meow(); }).to.throw();  // Function expression
   *     expect(() => cat.meow()).to.throw();             // ES6 arrow function
   *     expect(cat.meow.bind(cat)).to.throw();           // Bind
   *
   * Finally, it's worth mentioning that it's a best practice in JavaScript to
   * only throw `Error` and derivatives of `Error` such as `ReferenceError`,
   * `TypeError`, and user-defined objects that extend `Error`. No other type of
   * value will generate a stack trace when initialized. With that said, the
   * `throw` assertion does technically support any type of value being thrown,
   * not just `Error` and its derivatives.
   *
   * The aliases `.throws` and `.Throw` can be used interchangeably with
   * `.throw`.
   *
   * @name throw
   * @alias throws
   * @alias Throw
   * @param {Error|ErrorConstructor} errorLike
   * @param {String|RegExp} errMsgMatcher error message
   * @param {String} msg _optional_
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @returns error for chaining (null if no error)
   * @namespace BDD
   * @api public
   */

  function assertThrows (errorLike, errMsgMatcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , ssfi = flag(this, 'ssfi')
      , flagMsg = flag(this, 'message')
      , negate = flag(this, 'negate') || false;
    new Assertion(obj, flagMsg, ssfi, true).is.a('function');

    if (errorLike instanceof RegExp || typeof errorLike === 'string') {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var caughtErr;
    try {
      obj();
    } catch (err) {
      caughtErr = err;
    }

    // If we have the negate flag enabled and at least one valid argument it means we do expect an error
    // but we want it to match a given set of criteria
    var everyArgIsUndefined = errorLike === undefined && errMsgMatcher === undefined;

    // If we've got the negate flag enabled and both args, we should only fail if both aren't compatible
    // See Issue #551 and PR #683@GitHub
    var everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
    var errorLikeFail = false;
    var errMsgMatcherFail = false;

    // Checking if error was thrown
    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
      // We need this to display results correctly according to their types
      var errorLikeString = 'an error';
      if (errorLike instanceof Error) {
        errorLikeString = '#{exp}';
      } else if (errorLike) {
        errorLikeString = _.checkError.getConstructorName(errorLike);
      }

      this.assert(
          caughtErr
        , 'expected #{this} to throw ' + errorLikeString
        , 'expected #{this} to not throw an error but #{act} was thrown'
        , errorLike && errorLike.toString()
        , (caughtErr instanceof Error ?
            caughtErr.toString() : (typeof caughtErr === 'string' ? caughtErr : caughtErr &&
                                    _.checkError.getConstructorName(caughtErr)))
      );
    }

    if (errorLike && caughtErr) {
      // We should compare instances only if `errorLike` is an instance of `Error`
      if (errorLike instanceof Error) {
        var isCompatibleInstance = _.checkError.compatibleInstance(caughtErr, errorLike);

        if (isCompatibleInstance === negate) {
          // These checks were created to ensure we won't fail too soon when we've got both args and a negate
          // See Issue #551 and PR #683@GitHub
          if (everyArgIsDefined && negate) {
            errorLikeFail = true;
          } else {
            this.assert(
                negate
              , 'expected #{this} to throw #{exp} but #{act} was thrown'
              , 'expected #{this} to not throw #{exp}' + (caughtErr && !negate ? ' but #{act} was thrown' : '')
              , errorLike.toString()
              , caughtErr.toString()
            );
          }
        }
      }

      var isCompatibleConstructor = _.checkError.compatibleConstructor(caughtErr, errorLike);
      if (isCompatibleConstructor === negate) {
        if (everyArgIsDefined && negate) {
            errorLikeFail = true;
        } else {
          this.assert(
              negate
            , 'expected #{this} to throw #{exp} but #{act} was thrown'
            , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
            , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
            , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
          );
        }
      }
    }

    if (caughtErr && errMsgMatcher !== undefined && errMsgMatcher !== null) {
      // Here we check compatible messages
      var placeholder = 'including';
      if (errMsgMatcher instanceof RegExp) {
        placeholder = 'matching'
      }

      var isCompatibleMessage = _.checkError.compatibleMessage(caughtErr, errMsgMatcher);
      if (isCompatibleMessage === negate) {
        if (everyArgIsDefined && negate) {
            errMsgMatcherFail = true;
        } else {
          this.assert(
            negate
            , 'expected #{this} to throw error ' + placeholder + ' #{exp} but got #{act}'
            , 'expected #{this} to throw error not ' + placeholder + ' #{exp}'
            ,  errMsgMatcher
            ,  _.checkError.getMessage(caughtErr)
          );
        }
      }
    }

    // If both assertions failed and both should've matched we throw an error
    if (errorLikeFail && errMsgMatcherFail) {
      this.assert(
        negate
        , 'expected #{this} to throw #{exp} but #{act} was thrown'
        , 'expected #{this} to not throw #{exp}' + (caughtErr ? ' but #{act} was thrown' : '')
        , (errorLike instanceof Error ? errorLike.toString() : errorLike && _.checkError.getConstructorName(errorLike))
        , (caughtErr instanceof Error ? caughtErr.toString() : caughtErr && _.checkError.getConstructorName(caughtErr))
      );
    }

    flag(this, 'object', caughtErr);
  };

  Assertion.addMethod('throw', assertThrows);
  Assertion.addMethod('throws', assertThrows);
  Assertion.addMethod('Throw', assertThrows);

  /**
   * ### .respondTo(method[, msg])
   *
   * When the target is a non-function object, `.respondTo` asserts that the
   * target has a method with the given name `method`. The method can be own or
   * inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.respondTo('meow');
   *
   * When the target is a function, `.respondTo` asserts that the target's
   * `prototype` property has a method with the given name `method`. Again, the
   * method can be own or inherited, and it can be enumerable or non-enumerable.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(Cat).to.respondTo('meow');
   *
   * Add `.itself` earlier in the chain to force `.respondTo` to treat the
   * target as a non-function object, even if it's a function. Thus, it asserts
   * that the target has a method with the given name `method`, rather than
   * asserting that the target's `prototype` property has a method with the
   * given name `method`.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * When not adding `.itself`, it's important to check the target's type before
   * using `.respondTo`. See the `.a` doc for info on checking a target's type.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *
   *     expect(new Cat()).to.be.an('object').that.respondsTo('meow');
   *
   * Add `.not` earlier in the chain to negate `.respondTo`.
   *
   *     function Dog () {}
   *     Dog.prototype.bark = function () {};
   *
   *     expect(new Dog()).to.not.respondTo('meow');
   *
   * `.respondTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect({}).to.respondTo('meow', 'nooo why fail??');
   *     expect({}, 'nooo why fail??').to.respondTo('meow');
   *
   * The alias `.respondsTo` can be used interchangeably with `.respondTo`.
   *
   * @name respondTo
   * @alias respondsTo
   * @param {String} method
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function respondTo (method, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , itself = flag(this, 'itself')
      , context = ('function' === typeof obj && !itself)
        ? obj.prototype[method]
        : obj[method];

    this.assert(
        'function' === typeof context
      , 'expected #{this} to respond to ' + _.inspect(method)
      , 'expected #{this} to not respond to ' + _.inspect(method)
    );
  }

  Assertion.addMethod('respondTo', respondTo);
  Assertion.addMethod('respondsTo', respondTo);

  /**
   * ### .itself
   *
   * Forces all `.respondTo` assertions that follow in the chain to behave as if
   * the target is a non-function object, even if it's a function. Thus, it
   * causes `.respondTo` to assert that the target has a method with the given
   * name, rather than asserting that the target's `prototype` property has a
   * method with the given name.
   *
   *     function Cat () {}
   *     Cat.prototype.meow = function () {};
   *     Cat.hiss = function () {};
   *
   *     expect(Cat).itself.to.respondTo('hiss').but.not.respondTo('meow');
   *
   * @name itself
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('itself', function () {
    flag(this, 'itself', true);
  });

  /**
   * ### .satisfy(matcher[, msg])
   *
   * Invokes the given `matcher` function with the target being passed as the
   * first argument, and asserts that the value returned is truthy.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 0; 
   *     });
   *
   * Add `.not` earlier in the chain to negate `.satisfy`.
   *
   *     expect(1).to.not.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * `.satisfy` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1).to.satisfy(function(num) {
   *       return num > 2;
   *     }, 'nooo why fail??');
   *
   *     expect(1, 'nooo why fail??').to.satisfy(function(num) {
   *       return num > 2;
   *     });
   *
   * The alias `.satisfies` can be used interchangeably with `.satisfy`.
   *
   * @name satisfy
   * @alias satisfies
   * @param {Function} matcher
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function satisfy (matcher, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object');
    var result = matcher(obj);
    this.assert(
        result
      , 'expected #{this} to satisfy ' + _.objDisplay(matcher)
      , 'expected #{this} to not satisfy' + _.objDisplay(matcher)
      , flag(this, 'negate') ? false : true
      , result
    );
  }

  Assertion.addMethod('satisfy', satisfy);
  Assertion.addMethod('satisfies', satisfy);

  /**
   * ### .closeTo(expected, delta[, msg])
   *
   * Asserts that the target is a number that's within a given +/- `delta` range
   * of the given number `expected`. However, it's often best to assert that the
   * target is equal to its expected value.
   *
   *     // Recommended
   *     expect(1.5).to.equal(1.5);
   *
   *     // Not recommended
   *     expect(1.5).to.be.closeTo(1, 0.5);
   *     expect(1.5).to.be.closeTo(2, 0.5);
   *     expect(1.5).to.be.closeTo(1, 1);
   *
   * Add `.not` earlier in the chain to negate `.closeTo`.
   *
   *     expect(1.5).to.equal(1.5); // Recommended
   *     expect(1.5).to.not.be.closeTo(3, 1); // Not recommended
   *
   * `.closeTo` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect(1.5).to.be.closeTo(3, 1, 'nooo why fail??');
   *     expect(1.5, 'nooo why fail??').to.be.closeTo(3, 1);
   *
   * The alias `.approximately` can be used interchangeably with `.closeTo`.
   *
   * @name closeTo
   * @alias approximately
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function closeTo(expected, delta, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).is.a('number');
    if (typeof expected !== 'number' || typeof delta !== 'number') {
      flagMsg = flagMsg ? flagMsg + ': ' : '';
      throw new AssertionError(
          flagMsg + 'the arguments to closeTo or approximately must be numbers',
          undefined,
          ssfi
      );
    }

    this.assert(
        Math.abs(obj - expected) <= delta
      , 'expected #{this} to be close to ' + expected + ' +/- ' + delta
      , 'expected #{this} not to be close to ' + expected + ' +/- ' + delta
    );
  }

  Assertion.addMethod('closeTo', closeTo);
  Assertion.addMethod('approximately', closeTo);

  // Note: Duplicates are ignored if testing for inclusion instead of sameness.
  function isSubsetOf(subset, superset, cmp, contains, ordered) {
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }

    return subset.every(function(elem, idx) {
      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];

      if (!cmp) {
        var matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }

      return superset.some(function(elem2, matchIdx) {
        if (!cmp(elem, elem2)) return false;

        // Remove match from superset so not counted twice if duplicate in subset.
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      });
    });
  }

  /**
   * ### .members(set[, msg])
   *
   * Asserts that the target array has the same members as the given array
   * `set`.
   *
   *     expect([1, 2, 3]).to.have.members([2, 1, 3]);
   *     expect([1, 2, 2]).to.have.members([2, 1, 2]);
   *
   * By default, members are compared using strict (`===`) equality. Add `.deep`
   * earlier in the chain to use deep equality instead. See the `deep-eql`
   * project page for info on the deep equality algorithm:
   * https://github.com/chaijs/deep-eql.
   *
   *     // Target array deeply (but not strictly) has member `{a: 1}`
   *     expect([{a: 1}]).to.have.deep.members([{a: 1}]);
   *     expect([{a: 1}]).to.not.have.members([{a: 1}]);
   *
   * By default, order doesn't matter. Add `.ordered` earlier in the chain to
   * require that members appear in the same order.
   *
   *     expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
   *     expect([1, 2, 3]).to.have.members([2, 1, 3])
   *       .but.not.ordered.members([2, 1, 3]);
   *
   * By default, both arrays must be the same size. Add `.include` earlier in
   * the chain to require that the target's members be a superset of the
   * expected members. Note that duplicates are ignored in the subset when
   * `.include` is added.
   *
   *     // Target array is a superset of [1, 2] but not identical
   *     expect([1, 2, 3]).to.include.members([1, 2]);
   *     expect([1, 2, 3]).to.not.have.members([1, 2]);
   *
   *     // Duplicates in the subset are ignored
   *     expect([1, 2, 3]).to.include.members([1, 2, 2, 2]);
   *
   * `.deep`, `.ordered`, and `.include` can all be combined. However, if
   * `.include` and `.ordered` are combined, the ordering begins at the start of
   * both arrays.
   *
   *     expect([{a: 1}, {b: 2}, {c: 3}])
   *       .to.include.deep.ordered.members([{a: 1}, {b: 2}])
   *       .but.not.include.deep.ordered.members([{b: 2}, {c: 3}]);
   *
   * Add `.not` earlier in the chain to negate `.members`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the target array doesn't have all of the same members as
   * the given array `set` but may or may not have some of them. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     expect([1, 2]).to.not.include(3).and.not.include(4); // Recommended
   *     expect([1, 2]).to.not.have.members([3, 4]); // Not recommended
   *
   * `.members` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`.
   *
   *     expect([1, 2]).to.have.members([1, 2, 3], 'nooo why fail??');
   *     expect([1, 2], 'nooo why fail??').to.have.members([1, 2, 3]);
   *
   * @name members
   * @param {Array} set
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  Assertion.addMethod('members', function (subset, msg) {
    if (msg) flag(this, 'message', msg);
    var obj = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');

    new Assertion(obj, flagMsg, ssfi, true).to.be.an('array');
    new Assertion(subset, flagMsg, ssfi, true).to.be.an('array');

    var contains = flag(this, 'contains');
    var ordered = flag(this, 'ordered');

    var subject, failMsg, failNegateMsg, lengthCheck;

    if (contains) {
      subject = ordered ? 'an ordered superset' : 'a superset';
      failMsg = 'expected #{this} to be ' + subject + ' of #{exp}';
      failNegateMsg = 'expected #{this} to not be ' + subject + ' of #{exp}';
    } else {
      subject = ordered ? 'ordered members' : 'members';
      failMsg = 'expected #{this} to have the same ' + subject + ' as #{exp}';
      failNegateMsg = 'expected #{this} to not have the same ' + subject + ' as #{exp}';
    }

    var cmp = flag(this, 'deep') ? _.eql : undefined;

    this.assert(
        isSubsetOf(subset, obj, cmp, contains, ordered)
      , failMsg
      , failNegateMsg
      , subset
      , obj
      , true
    );
  });

  /**
   * ### .oneOf(list[, msg])
   *
   * Asserts that the target is a member of the given array `list`. However,
   * it's often best to assert that the target is equal to its expected value.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.be.oneOf([1, 2, 3]); // Not recommended
   *
   * Comparisons are performed using strict (`===`) equality.
   *
   * Add `.not` earlier in the chain to negate `.oneOf`.
   *
   *     expect(1).to.equal(1); // Recommended
   *     expect(1).to.not.be.oneOf([2, 3, 4]); // Not recommended
   *
   * `.oneOf` accepts an optional `msg` argument which is a custom error message
   * to show when the assertion fails. The message can also be given as the
   * second argument to `expect`.
   *
   *     expect(1).to.be.oneOf([2, 3, 4], 'nooo why fail??');
   *     expect(1, 'nooo why fail??').to.be.oneOf([2, 3, 4]);
   *
   * @name oneOf
   * @param {Array<*>} list
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function oneOf (list, msg) {
    if (msg) flag(this, 'message', msg);
    var expected = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(list, flagMsg, ssfi, true).to.be.an('array');

    this.assert(
        list.indexOf(expected) > -1
      , 'expected #{this} to be one of #{exp}'
      , 'expected #{this} to not be one of #{exp}'
      , list
      , expected
    );
  }

  Assertion.addMethod('oneOf', oneOf);


  /**
   * ### .change(subject[, prop[, msg]])
   *
   * When one argument is provided, `.change` asserts that the given function
   * `subject` returns a different value when it's invoked before the target
   * function compared to when it's invoked afterward. However, it's often best
   * to assert that `subject` is equal to its expected value.
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     // Recommended
   *     expect(getDots()).to.equal('');
   *     addDot();
   *     expect(getDots()).to.equal('.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(getDots);
   *
   * When two arguments are provided, `.change` asserts that the value of the
   * given object `subject`'s `prop` property is different before invoking the
   * target function compared to afterward.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     // Recommended
   *     expect(myObj).to.have.property('dots', '');
   *     addDot();
   *     expect(myObj).to.have.property('dots', '.');
   *
   *     // Not recommended
   *     expect(addDot).to.change(myObj, 'dots');
   *
   * Strict (`===`) equality is used to compare before and after values.
   *
   * Add `.not` earlier in the chain to negate `.change`.
   *
   *     var dots = ''
   *       , noop = function () {}
   *       , getDots = function () { return dots; };
   *
   *     expect(noop).to.not.change(getDots);
   *
   *     var myObj = {dots: ''}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'dots');
   *
   * `.change` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {dots: ''}
   *       , addDot = function () { myObj.dots += '.'; };
   *
   *     expect(addDot).to.not.change(myObj, 'dots', 'nooo why fail??');
   *
   *     var dots = ''
   *       , addDot = function () { dots += '.'; }
   *       , getDots = function () { return dots; };
   *
   *     expect(addDot, 'nooo why fail??').to.not.change(getDots);
   *
   * `.change` also causes all `.by` assertions that follow in the chain to
   * assert how much a numeric subject was increased or decreased by. However,
   * it's dangerous to use `.change.by`. The problem is that it creates
   * uncertain expectations by asserting that the subject either increases by
   * the given delta, or that it decreases by the given delta. It's often best
   * to identify the exact output that's expected, and then write an assertion
   * that only accepts that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * The alias `.changes` can be used interchangeably with `.change`.
   *
   * @name change
   * @alias changes
   * @param {String} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertChanges (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    // This gets flagged because of the .by(delta) assertion
    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'change');
    flag(this, 'realDelta', final !== initial);

    this.assert(
      initial !== final
      , 'expected ' + msgObj + ' to change'
      , 'expected ' + msgObj + ' to not change'
    );
  }

  Assertion.addMethod('change', assertChanges);
  Assertion.addMethod('changes', assertChanges);

  /**
   * ### .increase(subject[, prop[, msg]])
   *
   * When one argument is provided, `.increase` asserts that the given function
   * `subject` returns a greater number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.increase` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * greater of a number is returned. It's often best to assert that the return
   * value increased by the expected amount, rather than asserting it increased
   * by any amount.
   *
   *     var val = 1
   *       , addTwo = function () { val += 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(addTwo).to.increase(getVal).by(2); // Recommended
   *     expect(addTwo).to.increase(getVal); // Not recommended
   *
   * When two arguments are provided, `.increase` asserts that the value of the
   * given object `subject`'s `prop` property is greater after invoking the
   * target function compared to beforehand.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.increase(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.increase`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either decreases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to decrease, it's often best to assert that it
   * decreased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.not.increase(myObj, 'val'); // Not recommended
   * 
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.increase(myObj, 'val'); // Not recommended
   *
   * `.increase` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.increase(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.increase(getVal);
   *
   * The alias `.increases` can be used interchangeably with `.increase`.
   *
   * @name increase
   * @alias increases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertIncreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'increase');
    flag(this, 'realDelta', final - initial);

    this.assert(
      final - initial > 0
      , 'expected ' + msgObj + ' to increase'
      , 'expected ' + msgObj + ' to not increase'
    );
  }

  Assertion.addMethod('increase', assertIncreases);
  Assertion.addMethod('increases', assertIncreases);

  /**
   * ### .decrease(subject[, prop[, msg]])
   *
   * When one argument is provided, `.decrease` asserts that the given function
   * `subject` returns a lesser number when it's invoked after invoking the
   * target function compared to when it's invoked beforehand. `.decrease` also
   * causes all `.by` assertions that follow in the chain to assert how much
   * lesser of a number is returned. It's often best to assert that the return
   * value decreased by the expected amount, rather than asserting it decreased
   * by any amount.
   *
   *     var val = 1
   *       , subtractTwo = function () { val -= 2; }
   *       , getVal = function () { return val; };
   *
   *     expect(subtractTwo).to.decrease(getVal).by(2); // Recommended
   *     expect(subtractTwo).to.decrease(getVal); // Not recommended
   *
   * When two arguments are provided, `.decrease` asserts that the value of the
   * given object `subject`'s `prop` property is lesser after invoking the
   * target function compared to beforehand. 
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.decrease(myObj, 'val'); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.decrease`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either increases, or that it stays the same.
   * It's often best to identify the exact output that's expected, and then
   * write an assertion that only accepts that exact output.
   *
   * When the subject is expected to increase, it's often best to assert that it
   * increased by the expected amount.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.not.decrease(myObj, 'val'); // Not recommended
   * 
   * When the subject is expected to stay the same, it's often best to assert
   * exactly that.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.not.change(myObj, 'val'); // Recommended
   *     expect(noop).to.not.decrease(myObj, 'val'); // Not recommended
   *
   * `.decrease` accepts an optional `msg` argument which is a custom error
   * message to show when the assertion fails. The message can also be given as
   * the second argument to `expect`. When not providing two arguments, always
   * use the second form.
   *
   *     var myObj = {val: 1}
   *       , noop = function () {};
   *
   *     expect(noop).to.decrease(myObj, 'val', 'nooo why fail??');
   *
   *     var val = 1
   *       , noop = function () {}
   *       , getVal = function () { return val; };
   *
   *     expect(noop, 'nooo why fail??').to.decrease(getVal);
   *
   * The alias `.decreases` can be used interchangeably with `.decrease`.
   *
   * @name decrease
   * @alias decreases
   * @param {String|Function} subject
   * @param {String} prop name _optional_
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDecreases (subject, prop, msg) {
    if (msg) flag(this, 'message', msg);
    var fn = flag(this, 'object')
      , flagMsg = flag(this, 'message')
      , ssfi = flag(this, 'ssfi');
    new Assertion(fn, flagMsg, ssfi, true).is.a('function');

    var initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a('function');
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }

    // Make sure that the target is a number
    new Assertion(initial, flagMsg, ssfi, true).is.a('number');

    fn();

    var final = prop === undefined || prop === null ? subject() : subject[prop];
    var msgObj = prop === undefined || prop === null ? initial : '.' + prop;

    flag(this, 'deltaMsgObj', msgObj);
    flag(this, 'initialDeltaValue', initial);
    flag(this, 'finalDeltaValue', final);
    flag(this, 'deltaBehavior', 'decrease');
    flag(this, 'realDelta', initial - final);

    this.assert(
      final - initial < 0
      , 'expected ' + msgObj + ' to decrease'
      , 'expected ' + msgObj + ' to not decrease'
    );
  }

  Assertion.addMethod('decrease', assertDecreases);
  Assertion.addMethod('decreases', assertDecreases);

  /**
   * ### .by(delta[, msg])
   *
   * When following an `.increase` assertion in the chain, `.by` asserts that
   * the subject of the `.increase` assertion increased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   * When following a `.decrease` assertion in the chain, `.by` asserts that the
   * subject of the `.decrease` assertion decreased by the given `delta`.
   *
   *     var myObj = {val: 1}
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2);
   *
   * When following a `.change` assertion in the chain, `.by` asserts that the
   * subject of the `.change` assertion either increased or decreased by the
   * given `delta`. However, it's dangerous to use `.change.by`. The problem is
   * that it creates uncertain expectations. It's often best to identify the
   * exact output that's expected, and then write an assertion that only accepts
   * that exact output.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; }
   *       , subtractTwo = function () { myObj.val -= 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(2); // Recommended
   *     expect(addTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   *     expect(subtractTwo).to.decrease(myObj, 'val').by(2); // Recommended
   *     expect(subtractTwo).to.change(myObj, 'val').by(2); // Not recommended
   *
   * Add `.not` earlier in the chain to negate `.by`. However, it's often best
   * to assert that the subject changed by its expected delta, rather than
   * asserting that it didn't change by one of countless unexpected deltas.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     // Recommended
   *     expect(addTwo).to.increase(myObj, 'val').by(2);
   *
   *     // Not recommended
   *     expect(addTwo).to.increase(myObj, 'val').but.not.by(3);
   *
   * `.by` accepts an optional `msg` argument which is a custom error message to
   * show when the assertion fails. The message can also be given as the second
   * argument to `expect`.
   *
   *     var myObj = {val: 1}
   *       , addTwo = function () { myObj.val += 2; };
   *
   *     expect(addTwo).to.increase(myObj, 'val').by(3, 'nooo why fail??');
   *     expect(addTwo, 'nooo why fail??').to.increase(myObj, 'val').by(3);
   *
   * @name by
   * @param {Number} delta
   * @param {String} msg _optional_
   * @namespace BDD
   * @api public
   */

  function assertDelta(delta, msg) {
    if (msg) flag(this, 'message', msg);

    var msgObj = flag(this, 'deltaMsgObj');
    var initial = flag(this, 'initialDeltaValue');
    var final = flag(this, 'finalDeltaValue');
    var behavior = flag(this, 'deltaBehavior');
    var realDelta = flag(this, 'realDelta');

    var expression;
    if (behavior === 'change') {
      expression = Math.abs(final - initial) === Math.abs(delta);
    } else {
      expression = realDelta === Math.abs(delta);
    }

    this.assert(
      expression
      , 'expected ' + msgObj + ' to ' + behavior + ' by ' + delta
      , 'expected ' + msgObj + ' to not ' + behavior + ' by ' + delta
    );
  }

  Assertion.addMethod('by', assertDelta);

  /**
   * ### .extensible
   *
   * Asserts that the target is extensible, which means that new properties can
   * be added to it. Primitives are never extensible.
   *
   *     expect({a: 1}).to.be.extensible;
   *
   * Add `.not` earlier in the chain to negate `.extensible`.
   *
   *     var nonExtensibleObject = Object.preventExtensions({})
   *       , sealedObject = Object.seal({})
   *       , frozenObject = Object.freeze({});
   *
   *     expect(nonExtensibleObject).to.not.be.extensible;
   *     expect(sealedObject).to.not.be.extensible;
   *     expect(frozenObject).to.not.be.extensible;
   *     expect(1).to.not.be.extensible;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect(1, 'nooo why fail??').to.be.extensible;
   *
   * @name extensible
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('extensible', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a non-extensible ordinary object, simply return false.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isExtensible
    // The following provides ES6 behavior for ES5 environments.

    var isExtensible = obj === Object(obj) && Object.isExtensible(obj);

    this.assert(
      isExtensible
      , 'expected #{this} to be extensible'
      , 'expected #{this} to not be extensible'
    );
  });

  /**
   * ### .sealed
   *
   * Asserts that the target is sealed, which means that new properties can't be
   * added to it, and its existing properties can't be reconfigured or deleted.
   * However, it's possible that its existing properties can still be reassigned
   * to different values. Primitives are always sealed.
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     expect(sealedObject).to.be.sealed;
   *     expect(frozenObject).to.be.sealed;
   *     expect(1).to.be.sealed;
   *
   * Add `.not` earlier in the chain to negate `.sealed`.
   *
   *     expect({a: 1}).to.not.be.sealed;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.sealed;
   *
   * @name sealed
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('sealed', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a sealed ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isSealed
    // The following provides ES6 behavior for ES5 environments.

    var isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;

    this.assert(
      isSealed
      , 'expected #{this} to be sealed'
      , 'expected #{this} to not be sealed'
    );
  });

  /**
   * ### .frozen
   *
   * Asserts that the target is frozen, which means that new properties can't be
   * added to it, and its existing properties can't be reassigned to different
   * values, reconfigured, or deleted. Primitives are always frozen.
   *
   *     var frozenObject = Object.freeze({});
   *
   *     expect(frozenObject).to.be.frozen;
   *     expect(1).to.be.frozen;
   *
   * Add `.not` earlier in the chain to negate `.frozen`.
   *
   *     expect({a: 1}).to.not.be.frozen;
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect({a: 1}, 'nooo why fail??').to.be.frozen;
   *
   * @name frozen
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('frozen', function() {
    var obj = flag(this, 'object');

    // In ES5, if the argument to this method is a primitive, then it will cause a TypeError.
    // In ES6, a non-object argument will be treated as if it was a frozen ordinary object, simply return true.
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/isFrozen
    // The following provides ES6 behavior for ES5 environments.

    var isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;

    this.assert(
      isFrozen
      , 'expected #{this} to be frozen'
      , 'expected #{this} to not be frozen'
    );
  });

  /**
   * ### .finite
   *
   * Asserts that the target is a number, and isn't `NaN` or positive/negative
   * `Infinity`.
   *
   *     expect(1).to.be.finite;
   *
   * Add `.not` earlier in the chain to negate `.finite`. However, it's
   * dangerous to do so. The problem is that it creates uncertain expectations
   * by asserting that the subject either isn't a number, or that it's `NaN`, or
   * that it's positive `Infinity`, or that it's negative `Infinity`. It's often
   * best to identify the exact output that's expected, and then write an
   * assertion that only accepts that exact output.
   *
   * When the target isn't expected to be a number, it's often best to assert
   * that it's the expected type, rather than asserting that it isn't one of
   * many unexpected types.
   *
   *     expect('foo').to.be.a('string'); // Recommended
   *     expect('foo').to.not.be.finite; // Not recommended
   *
   * When the target is expected to be `NaN`, it's often best to assert exactly
   * that.
   *
   *     expect(NaN).to.be.NaN; // Recommended
   *     expect(NaN).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be positive infinity, it's often best to
   * assert exactly that.
   *
   *     expect(Infinity).to.equal(Infinity); // Recommended
   *     expect(Infinity).to.not.be.finite; // Not recommended
   *
   * When the target is expected to be negative infinity, it's often best to
   * assert exactly that.
   *
   *     expect(-Infinity).to.equal(-Infinity); // Recommended
   *     expect(-Infinity).to.not.be.finite; // Not recommended
   *
   * A custom error message can be given as the second argument to `expect`.
   *
   *     expect('foo', 'nooo why fail??').to.be.finite;
   *
   * @name finite
   * @namespace BDD
   * @api public
   */

  Assertion.addProperty('finite', function(msg) {
    var obj = flag(this, 'object');

    this.assert(
        typeof obj === "number" && isFinite(obj)
      , 'expected #{this} to be a finite number'
      , 'expected #{this} to not be a finite number'
    );
  });
};

},{}],7:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


module.exports = function (chai, util) {

  /*!
   * Chai dependencies.
   */

  var Assertion = chai.Assertion
    , flag = util.flag;

  /*!
   * Module export.
   */

  /**
   * ### assert(expression, message)
   *
   * Write your own test expressions.
   *
   *     assert('foo' !== 'bar', 'foo is not bar');
   *     assert(Array.isArray([]), 'empty arrays are arrays');
   *
   * @param {Mixed} expression to test for truthiness
   * @param {String} message to display on error
   * @name assert
   * @namespace Assert
   * @api public
   */

  var assert = chai.assert = function (express, errmsg) {
    var test = new Assertion(null, null, chai.assert, true);
    test.assert(
        express
      , errmsg
      , '[ negation message unavailable ]'
    );
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure. Node.js `assert` module-compatible.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace Assert
   * @api public
   */

  assert.fail = function (actual, expected, message, operator) {
    message = message || 'assert.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, assert.fail);
  };

  /**
   * ### .isOk(object, [message])
   *
   * Asserts that `object` is truthy.
   *
   *     assert.isOk('everything', 'everything is ok');
   *     assert.isOk(false, 'this will fail');
   *
   * @name isOk
   * @alias ok
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isOk = function (val, msg) {
    new Assertion(val, msg, assert.isOk, true).is.ok;
  };

  /**
   * ### .isNotOk(object, [message])
   *
   * Asserts that `object` is falsy.
   *
   *     assert.isNotOk('everything', 'this will fail');
   *     assert.isNotOk(false, 'this will pass');
   *
   * @name isNotOk
   * @alias notOk
   * @param {Mixed} object to test
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotOk = function (val, msg) {
    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
  };

  /**
   * ### .equal(actual, expected, [message])
   *
   * Asserts non-strict equality (`==`) of `actual` and `expected`.
   *
   *     assert.equal(3, '3', '== coerces values to strings');
   *
   * @name equal
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.equal = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.equal, true);

    test.assert(
        exp == flag(test, 'object')
      , 'expected #{this} to equal #{exp}'
      , 'expected #{this} to not equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .notEqual(actual, expected, [message])
   *
   * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
   *
   *     assert.notEqual(3, 4, 'these numbers are not equal');
   *
   * @name notEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notEqual = function (act, exp, msg) {
    var test = new Assertion(act, msg, assert.notEqual, true);

    test.assert(
        exp != flag(test, 'object')
      , 'expected #{this} to not equal #{exp}'
      , 'expected #{this} to equal #{act}'
      , exp
      , act
      , true
    );
  };

  /**
   * ### .strictEqual(actual, expected, [message])
   *
   * Asserts strict equality (`===`) of `actual` and `expected`.
   *
   *     assert.strictEqual(true, true, 'these booleans are strictly equal');
   *
   * @name strictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.strictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
  };

  /**
   * ### .notStrictEqual(actual, expected, [message])
   *
   * Asserts strict inequality (`!==`) of `actual` and `expected`.
   *
   *     assert.notStrictEqual(3, '3', 'no coercion for strict equality');
   *
   * @name notStrictEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
  };

  /**
   * ### .deepEqual(actual, expected, [message])
   *
   * Asserts that `actual` is deeply equal to `expected`.
   *
   *     assert.deepEqual({ tea: 'green' }, { tea: 'green' });
   *
   * @name deepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @alias deepStrictEqual
   * @namespace Assert
   * @api public
   */

  assert.deepEqual = assert.deepStrictEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
  };

  /**
   * ### .notDeepEqual(actual, expected, [message])
   *
   * Assert that `actual` is not deeply equal to `expected`.
   *
   *     assert.notDeepEqual({ tea: 'green' }, { tea: 'jasmine' });
   *
   * @name notDeepEqual
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepEqual = function (act, exp, msg) {
    new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
  };

   /**
   * ### .isAbove(valueToCheck, valueToBeAbove, [message])
   *
   * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`.
   *
   *     assert.isAbove(5, 2, '5 is strictly greater than 2');
   *
   * @name isAbove
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAbove
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAbove = function (val, abv, msg) {
    new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
  };

   /**
   * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [message])
   *
   * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`.
   *
   *     assert.isAtLeast(5, 2, '5 is greater or equal to 2');
   *     assert.isAtLeast(3, 3, '3 is greater or equal to 3');
   *
   * @name isAtLeast
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtLeast
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtLeast = function (val, atlst, msg) {
    new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
  };

   /**
   * ### .isBelow(valueToCheck, valueToBeBelow, [message])
   *
   * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`.
   *
   *     assert.isBelow(3, 6, '3 is strictly less than 6');
   *
   * @name isBelow
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeBelow
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBelow = function (val, blw, msg) {
    new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
  };

   /**
   * ### .isAtMost(valueToCheck, valueToBeAtMost, [message])
   *
   * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`.
   *
   *     assert.isAtMost(3, 6, '3 is less than or equal to 6');
   *     assert.isAtMost(4, 4, '4 is less than or equal to 4');
   *
   * @name isAtMost
   * @param {Mixed} valueToCheck
   * @param {Mixed} valueToBeAtMost
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isAtMost = function (val, atmst, msg) {
    new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
  };

  /**
   * ### .isTrue(value, [message])
   *
   * Asserts that `value` is true.
   *
   *     var teaServed = true;
   *     assert.isTrue(teaServed, 'the tea has been served');
   *
   * @name isTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isTrue = function (val, msg) {
    new Assertion(val, msg, assert.isTrue, true).is['true'];
  };

  /**
   * ### .isNotTrue(value, [message])
   *
   * Asserts that `value` is not true.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotTrue(tea, 'great, time for tea!');
   *
   * @name isNotTrue
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotTrue = function (val, msg) {
    new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
  };

  /**
   * ### .isFalse(value, [message])
   *
   * Asserts that `value` is false.
   *
   *     var teaServed = false;
   *     assert.isFalse(teaServed, 'no tea yet? hmm...');
   *
   * @name isFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFalse = function (val, msg) {
    new Assertion(val, msg, assert.isFalse, true).is['false'];
  };

  /**
   * ### .isNotFalse(value, [message])
   *
   * Asserts that `value` is not false.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotFalse(tea, 'great, time for tea!');
   *
   * @name isNotFalse
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFalse = function (val, msg) {
    new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
  };

  /**
   * ### .isNull(value, [message])
   *
   * Asserts that `value` is null.
   *
   *     assert.isNull(err, 'there was no error');
   *
   * @name isNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNull = function (val, msg) {
    new Assertion(val, msg, assert.isNull, true).to.equal(null);
  };

  /**
   * ### .isNotNull(value, [message])
   *
   * Asserts that `value` is not null.
   *
   *     var tea = 'tasty chai';
   *     assert.isNotNull(tea, 'great, time for tea!');
   *
   * @name isNotNull
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNull = function (val, msg) {
    new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
  };

  /**
   * ### .isNaN
   *
   * Asserts that value is NaN.
   *
   *     assert.isNaN(NaN, 'NaN is NaN');
   *
   * @name isNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
  };

  /**
   * ### .isNotNaN
   *
   * Asserts that value is not NaN.
   *
   *     assert.isNotNaN(4, '4 is not NaN');
   *
   * @name isNotNaN
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */
  assert.isNotNaN = function (val, msg) {
    new Assertion(val, msg, assert.isNotNaN, true).not.to.be.NaN;
  };

  /**
   * ### .exists
   *
   * Asserts that the target is neither `null` nor `undefined`.
   *
   *     var foo = 'hi';
   *
   *     assert.exists(foo, 'foo is neither `null` nor `undefined`');
   *
   * @name exists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.exists = function (val, msg) {
    new Assertion(val, msg, assert.exists, true).to.exist;
  };

  /**
   * ### .notExists
   *
   * Asserts that the target is either `null` or `undefined`.
   *
   *     var bar = null
   *       , baz;
   *
   *     assert.notExists(bar);
   *     assert.notExists(baz, 'baz is either null or undefined');
   *
   * @name notExists
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notExists = function (val, msg) {
    new Assertion(val, msg, assert.notExists, true).to.not.exist;
  };

  /**
   * ### .isUndefined(value, [message])
   *
   * Asserts that `value` is `undefined`.
   *
   *     var tea;
   *     assert.isUndefined(tea, 'no tea defined');
   *
   * @name isUndefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isUndefined = function (val, msg) {
    new Assertion(val, msg, assert.isUndefined, true).to.equal(undefined);
  };

  /**
   * ### .isDefined(value, [message])
   *
   * Asserts that `value` is not `undefined`.
   *
   *     var tea = 'cup of chai';
   *     assert.isDefined(tea, 'tea has been defined');
   *
   * @name isDefined
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isDefined = function (val, msg) {
    new Assertion(val, msg, assert.isDefined, true).to.not.equal(undefined);
  };

  /**
   * ### .isFunction(value, [message])
   *
   * Asserts that `value` is a function.
   *
   *     function serveTea() { return 'cup of tea'; };
   *     assert.isFunction(serveTea, 'great, we can have tea now');
   *
   * @name isFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFunction = function (val, msg) {
    new Assertion(val, msg, assert.isFunction, true).to.be.a('function');
  };

  /**
   * ### .isNotFunction(value, [message])
   *
   * Asserts that `value` is _not_ a function.
   *
   *     var serveTea = [ 'heat', 'pour', 'sip' ];
   *     assert.isNotFunction(serveTea, 'great, we have listed the steps');
   *
   * @name isNotFunction
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotFunction = function (val, msg) {
    new Assertion(val, msg, assert.isNotFunction, true).to.not.be.a('function');
  };

  /**
   * ### .isObject(value, [message])
   *
   * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
   * _The assertion does not match subclassed objects._
   *
   *     var selection = { name: 'Chai', serve: 'with spices' };
   *     assert.isObject(selection, 'tea selection is an object');
   *
   * @name isObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isObject = function (val, msg) {
    new Assertion(val, msg, assert.isObject, true).to.be.a('object');
  };

  /**
   * ### .isNotObject(value, [message])
   *
   * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
   *
   *     var selection = 'chai'
   *     assert.isNotObject(selection, 'tea selection is not an object');
   *     assert.isNotObject(null, 'null is not an object');
   *
   * @name isNotObject
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotObject = function (val, msg) {
    new Assertion(val, msg, assert.isNotObject, true).to.not.be.a('object');
  };

  /**
   * ### .isArray(value, [message])
   *
   * Asserts that `value` is an array.
   *
   *     var menu = [ 'green', 'chai', 'oolong' ];
   *     assert.isArray(menu, 'what kind of tea do we want?');
   *
   * @name isArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isArray = function (val, msg) {
    new Assertion(val, msg, assert.isArray, true).to.be.an('array');
  };

  /**
   * ### .isNotArray(value, [message])
   *
   * Asserts that `value` is _not_ an array.
   *
   *     var menu = 'green|chai|oolong';
   *     assert.isNotArray(menu, 'what kind of tea do we want?');
   *
   * @name isNotArray
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotArray = function (val, msg) {
    new Assertion(val, msg, assert.isNotArray, true).to.not.be.an('array');
  };

  /**
   * ### .isString(value, [message])
   *
   * Asserts that `value` is a string.
   *
   *     var teaOrder = 'chai';
   *     assert.isString(teaOrder, 'order placed');
   *
   * @name isString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isString = function (val, msg) {
    new Assertion(val, msg, assert.isString, true).to.be.a('string');
  };

  /**
   * ### .isNotString(value, [message])
   *
   * Asserts that `value` is _not_ a string.
   *
   *     var teaOrder = 4;
   *     assert.isNotString(teaOrder, 'order placed');
   *
   * @name isNotString
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotString = function (val, msg) {
    new Assertion(val, msg, assert.isNotString, true).to.not.be.a('string');
  };

  /**
   * ### .isNumber(value, [message])
   *
   * Asserts that `value` is a number.
   *
   *     var cups = 2;
   *     assert.isNumber(cups, 'how many cups');
   *
   * @name isNumber
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNumber, true).to.be.a('number');
  };

  /**
   * ### .isNotNumber(value, [message])
   *
   * Asserts that `value` is _not_ a number.
   *
   *     var cups = '2 cups please';
   *     assert.isNotNumber(cups, 'how many cups');
   *
   * @name isNotNumber
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotNumber = function (val, msg) {
    new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a('number');
  };

   /**
   * ### .isFinite(value, [message])
   *
   * Asserts that `value` is a finite number. Unlike `.isNumber`, this will fail for `NaN` and `Infinity`.
   *
   *     var cups = 2;
   *     assert.isFinite(cups, 'how many cups');
   *
   *     assert.isFinite(NaN); // throws
   *
   * @name isFinite
   * @param {Number} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isFinite = function (val, msg) {
    new Assertion(val, msg, assert.isFinite, true).to.be.finite;
  };

  /**
   * ### .isBoolean(value, [message])
   *
   * Asserts that `value` is a boolean.
   *
   *     var teaReady = true
   *       , teaServed = false;
   *
   *     assert.isBoolean(teaReady, 'is the tea ready');
   *     assert.isBoolean(teaServed, 'has tea been served');
   *
   * @name isBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isBoolean, true).to.be.a('boolean');
  };

  /**
   * ### .isNotBoolean(value, [message])
   *
   * Asserts that `value` is _not_ a boolean.
   *
   *     var teaReady = 'yep'
   *       , teaServed = 'nope';
   *
   *     assert.isNotBoolean(teaReady, 'is the tea ready');
   *     assert.isNotBoolean(teaServed, 'has tea been served');
   *
   * @name isNotBoolean
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.isNotBoolean = function (val, msg) {
    new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a('boolean');
  };

  /**
   * ### .typeOf(value, name, [message])
   *
   * Asserts that `value`'s type is `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.typeOf({ tea: 'chai' }, 'object', 'we have an object');
   *     assert.typeOf(['chai', 'jasmine'], 'array', 'we have an array');
   *     assert.typeOf('tea', 'string', 'we have a string');
   *     assert.typeOf(/tea/, 'regexp', 'we have a regular expression');
   *     assert.typeOf(null, 'null', 'we have a null');
   *     assert.typeOf(undefined, 'undefined', 'we have an undefined');
   *
   * @name typeOf
   * @param {Mixed} value
   * @param {String} name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.typeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.typeOf, true).to.be.a(type);
  };

  /**
   * ### .notTypeOf(value, name, [message])
   *
   * Asserts that `value`'s type is _not_ `name`, as determined by
   * `Object.prototype.toString`.
   *
   *     assert.notTypeOf('tea', 'number', 'strings are not numbers');
   *
   * @name notTypeOf
   * @param {Mixed} value
   * @param {String} typeof name
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notTypeOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notTypeOf, true).to.not.be.a(type);
  };

  /**
   * ### .instanceOf(object, constructor, [message])
   *
   * Asserts that `value` is an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new Tea('chai');
   *
   *     assert.instanceOf(chai, Tea, 'chai is an instance of tea');
   *
   * @name instanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.instanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type);
  };

  /**
   * ### .notInstanceOf(object, constructor, [message])
   *
   * Asserts `value` is not an instance of `constructor`.
   *
   *     var Tea = function (name) { this.name = name; }
   *       , chai = new String('chai');
   *
   *     assert.notInstanceOf(chai, Tea, 'chai is not an instance of tea');
   *
   * @name notInstanceOf
   * @param {Object} object
   * @param {Constructor} constructor
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInstanceOf = function (val, type, msg) {
    new Assertion(val, msg, assert.notInstanceOf, true)
      .to.not.be.instanceOf(type);
  };

  /**
   * ### .include(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.include([1,2,3], 2, 'array contains value');
   *     assert.include('foobar', 'foo', 'string contains substring');
   *     assert.include({ foo: 'bar', hello: 'universe' }, { foo: 'bar' }, 'object contains property');
   *
   * Strict equality (===) is used. When asserting the inclusion of a value in
   * an array, the array is searched for an element that's strictly equal to the
   * given value. When asserting a subset of properties in an object, the object
   * is searched for the given property keys, checking that each one is present
   * and stricty equal to the given property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.include([obj1, obj2], obj1);
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1});
   *     assert.include({foo: obj1, bar: obj2}, {foo: obj1, bar: obj2});
   *
   * @name include
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.include = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.include, true).include(inc);
  };

  /**
   * ### .notInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array, a substring in a string, or a subset of
   * properties in an object.
   *
   *     assert.notInclude([1,2,3], 4, 'array doesn't contain value');
   *     assert.notInclude('foobar', 'baz', 'string doesn't contain substring');
   *     assert.notInclude({ foo: 'bar', hello: 'universe' }, { foo: 'baz' }, 'object doesn't contain property');
   *
   * Strict equality (===) is used. When asserting the absence of a value in an
   * array, the array is searched to confirm the absence of an element that's
   * strictly equal to the given value. When asserting a subset of properties in
   * an object, the object is searched to confirm that at least one of the given
   * property keys is either not present or not strictly equal to the given
   * property value. For instance:
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notInclude([obj1, obj2], {a: 1});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.notInclude({foo: obj1, bar: obj2}, {foo: obj1, bar: {b: 2}});
   *
   * @name notInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
  };

  /**
   * ### .deepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` includes `needle`. Can be used to assert the
   * inclusion of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.deepInclude([obj1, obj2], {a: 1});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}});
   *     assert.deepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 2}});
   *
   * @name deepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
  };

  /**
   * ### .notDeepInclude(haystack, needle, [message])
   *
   * Asserts that `haystack` does not include `needle`. Can be used to assert
   * the absence of a value in an array or a subset of properties in an object.
   * Deep equality is used.
   *
   *     var obj1 = {a: 1}
   *       , obj2 = {b: 2};
   *     assert.notDeepInclude([obj1, obj2], {a: 9});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 9}});
   *     assert.notDeepInclude({foo: obj1, bar: obj2}, {foo: {a: 1}, bar: {b: 9}});
   *
   * @name notDeepInclude
   * @param {Array|String} haystack
   * @param {Mixed} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
  };

  /**
   * ### .nestedInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'. 
   * Can be used to assert the inclusion of a subset of properties in an 
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested 
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   * 
   *     assert.nestedInclude({'.a': {'b': 'x'}}, {'\\.a.[b]': 'x'});
   *     assert.nestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'x'});
   * 
   * @name nestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public 
   */ 

  assert.nestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
  };

  /**
   * ### .notNestedInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' does not include 'needle'. 
   * Can be used to assert the absence of a subset of properties in an 
   * object.
   * Enables the use of dot- and bracket-notation for referencing nested 
   * properties. 
   * '[]' and '.' in property names can be escaped using double backslashes.
   * 
   *     assert.notNestedInclude({'.a': {'b': 'x'}}, {'\\.a.b': 'y'});
   *     assert.notNestedInclude({'a': {'[b]': 'x'}}, {'a.\\[b\\]': 'y'});
   * 
   * @name notNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public 
   */ 

  assert.notNestedInclude = function (exp, inc, msg) {
    new Assertion(exp, msg, assert.notNestedInclude, true)
      .not.nested.include(inc);
  };

  /**
   * ### .deepNestedInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an 
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested 
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   * 
   *     assert.deepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {x: 1}});
   *     assert.deepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {x: 1}});
   *    
   * @name deepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public 
   */

  assert.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepNestedInclude, true)
      .deep.nested.include(inc);
  };

  /**
   * ### .notDeepNestedInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' does not include 'needle'.
   * Can be used to assert the absence of a subset of properties in an 
   * object while checking for deep equality.
   * Enables the use of dot- and bracket-notation for referencing nested 
   * properties.
   * '[]' and '.' in property names can be escaped using double backslashes.
   * 
   *     assert.notDeepNestedInclude({a: {b: [{x: 1}]}}, {'a.b[0]': {y: 1}})
   *     assert.notDeepNestedInclude({'.a': {'[b]': {x: 1}}}, {'\\.a.\\[b\\]': {y: 2}});
   *    
   * @name notDeepNestedInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public 
   */

  assert.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepNestedInclude, true)
      .not.deep.nested.include(inc);
  };

  /**
   * ### .ownInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an 
   * object while ignoring inherited properties.
   * 
   *     assert.ownInclude({ a: 1 }, { a: 1 });
   * 
   * @name ownInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
  };

  /**
   * ### .notOwnInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an 
   * object while ignoring inherited properties.
   * 
   *     Object.prototype.b = 2;
   * 
   *     assert.notOwnInclude({ a: 1 }, { b: 2 });
   * 
   * @name notOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
  };

  /**
   * ### .deepOwnInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the inclusion of a subset of properties in an 
   * object while ignoring inherited properties and checking for deep equality.
   * 
   *      assert.deepOwnInclude({a: {b: 2}}, {a: {b: 2}});
   *      
   * @name deepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepOwnInclude, true)
      .deep.own.include(inc);
  };

   /**
   * ### .notDeepOwnInclude(haystack, needle, [message])
   * 
   * Asserts that 'haystack' includes 'needle'.
   * Can be used to assert the absence of a subset of properties in an 
   * object while ignoring inherited properties and checking for deep equality.
   * 
   *      assert.notDeepOwnInclude({a: {b: 2}}, {a: {c: 3}});
   *      
   * @name notDeepOwnInclude
   * @param {Object} haystack
   * @param {Object} needle
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepOwnInclude, true)
      .not.deep.own.include(inc);
  };

  /**
   * ### .match(value, regexp, [message])
   *
   * Asserts that `value` matches the regular expression `regexp`.
   *
   *     assert.match('foobar', /^foo/, 'regexp matches');
   *
   * @name match
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.match = function (exp, re, msg) {
    new Assertion(exp, msg, assert.match, true).to.match(re);
  };

  /**
   * ### .notMatch(value, regexp, [message])
   *
   * Asserts that `value` does not match the regular expression `regexp`.
   *
   *     assert.notMatch('foobar', /^foo/, 'regexp does not match');
   *
   * @name notMatch
   * @param {Mixed} value
   * @param {RegExp} regexp
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notMatch = function (exp, re, msg) {
    new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
  };

  /**
   * ### .property(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`.
   *
   *     assert.property({ tea: { green: 'matcha' }}, 'tea');
   *     assert.property({ tea: { green: 'matcha' }}, 'toString');
   *
   * @name property
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.property = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.property, true).to.have.property(prop);
  };

  /**
   * ### .notProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property`.
   *
   *     assert.notProperty({ tea: { green: 'matcha' }}, 'coffee');
   *
   * @name notProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notProperty, true)
      .to.not.have.property(prop);
  };

  /**
   * ### .propertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.propertyVal({ tea: 'is good' }, 'tea', 'is good');
   *
   * @name propertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.propertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.propertyVal, true)
      .to.have.property(prop, val);
  };

  /**
   * ### .notPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a strict equality check
   * (===).
   *
   *     assert.notPropertyVal({ tea: 'is good' }, 'tea', 'is bad');
   *     assert.notPropertyVal({ tea: 'is good' }, 'coffee', 'is good');
   *
   * @name notPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notPropertyVal, true)
      .to.not.have.property(prop, val);
  };

  /**
   * ### .deepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property` with a value given by `value`. Uses a deep equality check.
   *
   *     assert.deepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepPropertyVal, true)
      .to.have.deep.property(prop, val);
  };

  /**
   * ### .notDeepPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct or inherited property named
   * by `property` with value given by `value`. Uses a deep equality check.
   *
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *
   * @name notDeepPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepPropertyVal, true)
      .to.not.have.deep.property(prop, val);
  };

  /**
   * ### .ownProperty(object, property, [message])
   *
   * Asserts that `object` has a direct property named by `property`. Inherited
   * properties aren't checked.
   *
   *     assert.ownProperty({ tea: { green: 'matcha' }}, 'tea');
   *
   * @name ownProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.ownProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.ownProperty, true)
      .to.have.own.property(prop);
  };

  /**
   * ### .notOwnProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by
   * `property`. Inherited properties aren't checked.
   *
   *     assert.notOwnProperty({ tea: { green: 'matcha' }}, 'coffee');
   *     assert.notOwnProperty({}, 'toString');
   *
   * @name notOwnProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @api public
   */

  assert.notOwnProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notOwnProperty, true)
      .to.not.have.own.property(prop);
  };

  /**
   * ### .ownPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a strict equality check (===).
   * Inherited properties aren't checked.
   *
   *     assert.ownPropertyVal({ coffee: 'is good'}, 'coffee', 'is good');
   *
   * @name ownPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.ownPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.ownPropertyVal, true)
      .to.have.own.property(prop, value);
  };

  /**
   * ### .notOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a strict equality check
   * (===). Inherited properties aren't checked.
   *
   *     assert.notOwnPropertyVal({ tea: 'is better'}, 'tea', 'is worse');
   *     assert.notOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notOwnPropertyVal, true)
      .to.not.have.own.property(prop, value);
  };

  /**
   * ### .deepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a direct property named by `property` and a value
   * equal to the provided `value`. Uses a deep equality check. Inherited
   * properties aren't checked.
   *
   *     assert.deepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'matcha' });
   *
   * @name deepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.deepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.deepOwnPropertyVal, true)
      .to.have.deep.own.property(prop, value);
  };

  /**
   * ### .notDeepOwnPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a direct property named by `property`
   * with a value equal to the provided `value`. Uses a deep equality check.
   * Inherited properties aren't checked.
   *
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { black: 'matcha' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'tea', { green: 'oolong' });
   *     assert.notDeepOwnPropertyVal({ tea: { green: 'matcha' } }, 'coffee', { green: 'matcha' });
   *     assert.notDeepOwnPropertyVal({}, 'toString', Object.prototype.toString);
   *
   * @name notDeepOwnPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @api public
   */

  assert.notDeepOwnPropertyVal = function (obj, prop, value, msg) {
    new Assertion(obj, msg, assert.notDeepOwnPropertyVal, true)
      .to.not.have.deep.own.property(prop, value);
  };

  /**
   * ### .nestedProperty(object, property, [message])
   *
   * Asserts that `object` has a direct or inherited property named by
   * `property`, which can be a string using dot- and bracket-notation for
   * nested reference.
   *
   *     assert.nestedProperty({ tea: { green: 'matcha' }}, 'tea.green');
   *
   * @name nestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.nestedProperty, true)
      .to.have.nested.property(prop);
  };

  /**
   * ### .notNestedProperty(object, property, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property`, which
   * can be a string using dot- and bracket-notation for nested reference. The
   * property cannot exist on the object nor anywhere in its prototype chain.
   *
   *     assert.notNestedProperty({ tea: { green: 'matcha' }}, 'tea.oolong');
   *
   * @name notNestedProperty
   * @param {Object} object
   * @param {String} property
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedProperty = function (obj, prop, msg) {
    new Assertion(obj, msg, assert.notNestedProperty, true)
      .to.not.have.nested.property(prop);
  };

  /**
   * ### .nestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a strict equality check (===).
   *
   *     assert.nestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'matcha');
   *
   * @name nestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.nestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.nestedPropertyVal, true)
      .to.have.nested.property(prop, val);
  };

  /**
   * ### .notNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a strict equality check (===).
   *
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'tea.green', 'konacha');
   *     assert.notNestedPropertyVal({ tea: { green: 'matcha' }}, 'coffee.green', 'matcha');
   *
   * @name notNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notNestedPropertyVal, true)
      .to.not.have.nested.property(prop, val);
  };

  /**
   * ### .deepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` has a property named by `property` with a value given
   * by `value`. `property` can use dot- and bracket-notation for nested
   * reference. Uses a deep equality check.
   *
   *     assert.deepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yum' });
   *
   * @name deepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.deepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepNestedPropertyVal, true)
      .to.have.deep.nested.property(prop, val);
  };

  /**
   * ### .notDeepNestedPropertyVal(object, property, value, [message])
   *
   * Asserts that `object` does _not_ have a property named by `property` with
   * value given by `value`. `property` can use dot- and bracket-notation for
   * nested reference. Uses a deep equality check.
   *
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { oolong: 'yum' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.green', { matcha: 'yuck' });
   *     assert.notDeepNestedPropertyVal({ tea: { green: { matcha: 'yum' } } }, 'tea.black', { matcha: 'yum' });
   *
   * @name notDeepNestedPropertyVal
   * @param {Object} object
   * @param {String} property
   * @param {Mixed} value
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notDeepNestedPropertyVal = function (obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notDeepNestedPropertyVal, true)
      .to.not.have.deep.nested.property(prop, val);
  }

  /**
   * ### .lengthOf(object, length, [message])
   *
   * Asserts that `object` has a `length` property with the expected value.
   *
   *     assert.lengthOf([1,2,3], 3, 'array has length of 3');
   *     assert.lengthOf('foobar', 6, 'string has length of 6');
   *
   * @name lengthOf
   * @param {Mixed} object
   * @param {Number} length
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.lengthOf = function (exp, len, msg) {
    new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
  };

  /**
   * ### .hasAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'iDontExist', 'baz']);
   *     assert.hasAnyKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, iDontExist: 99, baz: 1337});
   *     assert.hasAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAnyKeys(new Set([{foo: 'bar'}, 'anotherKey']), [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAnyKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
  }

  /**
   * ### .hasAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.hasAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337]);
   *     assert.hasAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.hasAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name hasAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
  }

  /**
   * ### .containsAllKeys(object, [keys], [message])
   *
   * Asserts that `object` has all of the `keys` provided but may have more keys not listed.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, ['foo', 'bar', 'baz']);
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, baz: 1337});
   *     assert.containsAllKeys({foo: 1, bar: 2, baz: 3}, {foo: 30, bar: 99, baz: 1337});
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}]);
   *     assert.containsAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{foo: 1}, 'key']);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}]);
   *     assert.containsAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{foo: 'bar'}, 'anotherKey']);
   *
   * @name containsAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllKeys, true)
      .to.contain.all.keys(keys);
  }

  /**
   * ### .doesNotHaveAnyKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAnyKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAnyKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAnyKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAnyKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true)
      .to.not.have.any.keys(keys);
  }

  /**
   * ### .doesNotHaveAllKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, ['one', 'two', 'example']);
   *     assert.doesNotHaveAllKeys({foo: 1, bar: 2, baz: 3}, {one: 1, two: 2, example: 'foo'});
   *     assert.doesNotHaveAllKeys(new Map([[{foo: 1}, 'bar'], ['key', 'value']]), [{one: 'two'}, 'example']);
   *     assert.doesNotHaveAllKeys(new Set([{foo: 'bar'}, 'anotherKey'], [{one: 'two'}, 'example']);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {String[]} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllKeys, true)
      .to.not.have.all.keys(keys);
  }

  /**
   * ### .hasAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {three: 'three'}]);
   *     assert.hasAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name doesNotHaveAllKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyDeepKeys, true)
      .to.have.any.deep.keys(keys);
  }

 /**
   * ### .hasAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has all and only all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne']]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}]), {one: 'one'});
   *     assert.hasAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name hasAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.hasAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllDeepKeys, true)
      .to.have.all.deep.keys(keys);
  }

 /**
   * ### .containsAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` contains all of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{one: 'one'}, {two: 'two'}]);
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {one: 'one'});
   *     assert.containsAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {two: 'two'}]);
   *
   * @name containsAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.containsAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllDeepKeys, true)
      .to.contain.all.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAnyDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` has none of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAnyDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAnyDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{twenty: 'twenty'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAnyDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAnyDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyDeepKeys, true)
      .to.not.have.any.deep.keys(keys);
  }

 /**
   * ### .doesNotHaveAllDeepKeys(object, [keys], [message])
   *
   * Asserts that `object` does not have at least one of the `keys` provided.
   * Since Sets and Maps can have objects as keys you can use this assertion to perform
   * a deep comparison.
   * You can also provide a single object instead of a `keys` array and its keys
   * will be used as the expected set of keys.
   *
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [1, 2]]), {thisDoesNot: 'exist'});
   *     assert.doesNotHaveAllDeepKeys(new Map([[{one: 'one'}, 'valueOne'], [{two: 'two'}, 'valueTwo']]), [{twenty: 'twenty'}, {one: 'one'}]);
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), {twenty: 'twenty'});
   *     assert.doesNotHaveAllDeepKeys(new Set([{one: 'one'}, {two: 'two'}]), [{one: 'one'}, {fifty: 'fifty'}]);
   *
   * @name doesNotHaveAllDeepKeys
   * @param {Mixed} object
   * @param {Array|Object} keys
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.doesNotHaveAllDeepKeys = function (obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllDeepKeys, true)
      .to.not.have.all.deep.keys(keys);
  }

 /**
   * ### .throws(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will have a
   * message matching `errMsgMatcher`.
   *
   *     assert.throws(fn, 'function throws a reference error');
   *     assert.throws(fn, /function throws a reference error/);
   *     assert.throws(fn, ReferenceError);
   *     assert.throws(fn, errorInstance);
   *     assert.throws(fn, ReferenceError, 'Error thrown must be a ReferenceError and have this msg');
   *     assert.throws(fn, errorInstance, 'Error thrown must be the same errorInstance and have this msg');
   *     assert.throws(fn, ReferenceError, /Error thrown must be a ReferenceError and match this/);
   *     assert.throws(fn, errorInstance, /Error thrown must be the same errorInstance and match this/);
   *
   * @name throws
   * @alias throw
   * @alias Throw
   * @param {Function} fn
   * @param {ErrorConstructor|Error} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.throws = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    var assertErr = new Assertion(fn, msg, assert.throws, true)
      .to.throw(errorLike, errMsgMatcher);
    return flag(assertErr, 'object');
  };

  /**
   * ### .doesNotThrow(fn, [errorLike/string/regexp], [string/regexp], [message])
   *
   * If `errorLike` is an `Error` constructor, asserts that `fn` will _not_ throw an error that is an
   * instance of `errorLike`.
   * If `errorLike` is an `Error` instance, asserts that the error thrown is _not_ the same
   * instance as `errorLike`.
   * If `errMsgMatcher` is provided, it also asserts that the error thrown will _not_ have a
   * message matching `errMsgMatcher`.
   *
   *     assert.doesNotThrow(fn, 'Any Error thrown must not have this message');
   *     assert.doesNotThrow(fn, /Any Error thrown must not match this/);
   *     assert.doesNotThrow(fn, Error);
   *     assert.doesNotThrow(fn, errorInstance);
   *     assert.doesNotThrow(fn, Error, 'Error must not have this message');
   *     assert.doesNotThrow(fn, errorInstance, 'Error must not have this message');
   *     assert.doesNotThrow(fn, Error, /Error must not match this/);
   *     assert.doesNotThrow(fn, errorInstance, /Error must not match this/);
   *
   * @name doesNotThrow
   * @param {Function} fn
   * @param {ErrorConstructor} errorLike
   * @param {RegExp|String} errMsgMatcher
   * @param {String} message
   * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
   * @namespace Assert
   * @api public
   */

  assert.doesNotThrow = function (fn, errorLike, errMsgMatcher, msg) {
    if ('string' === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }

    new Assertion(fn, msg, assert.doesNotThrow, true)
      .to.not.throw(errorLike, errMsgMatcher);
  };

  /**
   * ### .operator(val1, operator, val2, [message])
   *
   * Compares two values using `operator`.
   *
   *     assert.operator(1, '<', 2, 'everything is ok');
   *     assert.operator(1, '>', 2, 'this will fail');
   *
   * @name operator
   * @param {Mixed} val1
   * @param {String} operator
   * @param {Mixed} val2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.operator = function (val, operator, val2, msg) {
    var ok;
    switch(operator) {
      case '==':
        ok = val == val2;
        break;
      case '===':
        ok = val === val2;
        break;
      case '>':
        ok = val > val2;
        break;
      case '>=':
        ok = val >= val2;
        break;
      case '<':
        ok = val < val2;
        break;
      case '<=':
        ok = val <= val2;
        break;
      case '!=':
        ok = val != val2;
        break;
      case '!==':
        ok = val !== val2;
        break;
      default:
        msg = msg ? msg + ': ' : msg;
        throw new chai.AssertionError(
          msg + 'Invalid operator "' + operator + '"',
          undefined,
          assert.operator
        );
    }
    var test = new Assertion(ok, msg, assert.operator, true);
    test.assert(
        true === flag(test, 'object')
      , 'expected ' + util.inspect(val) + ' to be ' + operator + ' ' + util.inspect(val2)
      , 'expected ' + util.inspect(val) + ' to not be ' + operator + ' ' + util.inspect(val2) );
  };

  /**
   * ### .closeTo(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.closeTo(1.5, 1, 0.5, 'numbers are close');
   *
   * @name closeTo
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.closeTo = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
  };

  /**
   * ### .approximately(actual, expected, delta, [message])
   *
   * Asserts that the target is equal `expected`, to within a +/- `delta` range.
   *
   *     assert.approximately(1.5, 1, 0.5, 'numbers are close');
   *
   * @name approximately
   * @param {Number} actual
   * @param {Number} expected
   * @param {Number} delta
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.approximately = function (act, exp, delta, msg) {
    new Assertion(act, msg, assert.approximately, true)
      .to.be.approximately(exp, delta);
  };

  /**
   * ### .sameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * strict equality check (===).
   *
   *     assert.sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
   *
   * @name sameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameMembers, true)
      .to.have.same.members(set2);
  }

  /**
   * ### .notSameMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a strict equality check (===).
   *
   *     assert.notSameMembers([ 1, 2, 3 ], [ 5, 1, 3 ], 'not same members');
   *
   * @name notSameMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameMembers, true)
      .to.not.have.same.members(set2);
  }

  /**
   * ### .sameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in any order. Uses a
   * deep equality check.
   *
   *     assert.sameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { c: 3 }], 'same deep members');
   *
   * @name sameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepMembers, true)
      .to.have.same.deep.members(set2);
  }

  /**
   * ### .notSameDeepMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in any order.
   * Uses a deep equality check.
   *
   *     assert.notSameDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [{ b: 2 }, { a: 1 }, { f: 5 }], 'not same deep members');
   *
   * @name notSameDeepMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepMembers, true)
      .to.not.have.same.deep.members(set2);
  }

  /**
   * ### .sameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a strict equality check (===).
   *
   *     assert.sameOrderedMembers([ 1, 2, 3 ], [ 1, 2, 3 ], 'same ordered members');
   *
   * @name sameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameOrderedMembers, true)
      .to.have.same.ordered.members(set2);
  }

  /**
   * ### .notSameOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a strict equality check (===).
   *
   *     assert.notSameOrderedMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'not same ordered members');
   *
   * @name notSameOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameOrderedMembers, true)
      .to.not.have.same.ordered.members(set2);
  }

  /**
   * ### .sameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` have the same members in the same order.
   * Uses a deep equality check.
   *
   * assert.sameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { c: 3 } ], 'same deep ordered members');
   *
   * @name sameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.sameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.sameDeepOrderedMembers, true)
      .to.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .notSameDeepOrderedMembers(set1, set2, [message])
   *
   * Asserts that `set1` and `set2` don't have the same members in the same
   * order. Uses a deep equality check.
   *
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 }, { z: 5 } ], 'not same deep ordered members');
   * assert.notSameDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { c: 3 } ], 'not same deep ordered members');
   *
   * @name notSameDeepOrderedMembers
   * @param {Array} set1
   * @param {Array} set2
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notSameDeepOrderedMembers = function (set1, set2, msg) {
    new Assertion(set1, msg, assert.notSameDeepOrderedMembers, true)
      .to.not.have.same.deep.ordered.members(set2);
  }

  /**
   * ### .includeMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.includeMembers([ 1, 2, 3 ], [ 2, 1, 2 ], 'include members');
   *
   * @name includeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeMembers, true)
      .to.include.members(subset);
  }

  /**
   * ### .notIncludeMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * strict equality check (===). Duplicates are ignored.
   *
   *     assert.notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
   *
   * @name notIncludeMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeMembers, true)
      .to.not.include.members(subset);
  }

  /**
   * ### .includeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in any order. Uses a deep
   * equality check. Duplicates are ignored.
   *
   *     assert.includeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 }, { b: 2 } ], 'include deep members');
   *
   * @name includeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepMembers, true)
      .to.include.deep.members(subset);
  }

  /**
   * ### .notIncludeDeepMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in any order. Uses a
   * deep equality check. Duplicates are ignored.
   *
   *     assert.notIncludeDeepMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { f: 5 } ], 'not include deep members');
   *
   * @name notIncludeDeepMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepMembers, true)
      .to.not.include.deep.members(subset);
  }

  /**
   * ### .includeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.includeOrderedMembers([ 1, 2, 3 ], [ 1, 2 ], 'include ordered members');
   *
   * @name includeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeOrderedMembers, true)
      .to.include.ordered.members(subset);
  }

  /**
   * ### .notIncludeOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a strict equality
   * check (===).
   *
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 1 ], 'not include ordered members');
   *     assert.notIncludeOrderedMembers([ 1, 2, 3 ], [ 2, 3 ], 'not include ordered members');
   *
   * @name notIncludeOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeOrderedMembers, true)
      .to.not.include.ordered.members(subset);
  }

  /**
   * ### .includeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` is included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.includeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { b: 2 } ], 'include deep ordered members');
   *
   * @name includeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.includeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.includeDeepOrderedMembers, true)
      .to.include.deep.ordered.members(subset);
  }

  /**
   * ### .notIncludeDeepOrderedMembers(superset, subset, [message])
   *
   * Asserts that `subset` isn't included in `superset` in the same order
   * beginning with the first element in `superset`. Uses a deep equality
   * check.
   *
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { a: 1 }, { f: 5 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { a: 1 } ], 'not include deep ordered members');
   *     assert.notIncludeDeepOrderedMembers([ { a: 1 }, { b: 2 }, { c: 3 } ], [ { b: 2 }, { c: 3 } ], 'not include deep ordered members');
   *
   * @name notIncludeDeepOrderedMembers
   * @param {Array} superset
   * @param {Array} subset
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.notIncludeDeepOrderedMembers = function (superset, subset, msg) {
    new Assertion(superset, msg, assert.notIncludeDeepOrderedMembers, true)
      .to.not.include.deep.ordered.members(subset);
  }

  /**
   * ### .oneOf(inList, list, [message])
   *
   * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
   *
   *     assert.oneOf(1, [ 2, 1 ], 'Not found in list');
   *
   * @name oneOf
   * @param {*} inList
   * @param {Array<*>} list
   * @param {String} message
   * @namespace Assert
   * @api public
   */

  assert.oneOf = function (inList, list, msg) {
    new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
  }

  /**
   * ### .changes(function, object, property, [message])
   *
   * Asserts that a function changes the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 22 };
   *     assert.changes(fn, obj, 'val');
   *
   * @name changes
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changes = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
  }

   /**
   * ### .changesBy(function, object, property, delta, [message])
   *
   * Asserts that a function changes the value of a property by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 2 };
   *     assert.changesBy(fn, obj, 'val', 2);
   *
   * @name changesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesBy, true)
      .to.change(obj, prop).by(delta);
  }

   /**
   * ### .doesNotChange(function, object, property, [message])
   *
   * Asserts that a function does not change the value of a property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { console.log('foo'); };
   *     assert.doesNotChange(fn, obj, 'val');
   *
   * @name doesNotChange
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotChange = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotChange, true)
      .to.not.change(obj, prop);
  }

  /**
   * ### .changesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not change the value of a property or of a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.changesButNotBy(fn, obj, 'val', 5);
   *
   * @name changesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.changesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.changesButNotBy, true)
      .to.change(obj, prop).but.not.by(delta);
  }

  /**
   * ### .increases(function, object, property, [message])
   *
   * Asserts that a function increases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 13 };
   *     assert.increases(fn, obj, 'val');
   *
   * @name increases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.increases, true)
      .to.increase(obj, prop);
  }

  /**
   * ### .increasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function increases a numeric object property or a function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val += 10 };
   *     assert.increasesBy(fn, obj, 'val', 10);
   *
   * @name increasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesBy, true)
      .to.increase(obj, prop).by(delta);
  }

  /**
   * ### .doesNotIncrease(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 8 };
   *     assert.doesNotIncrease(fn, obj, 'val');
   *
   * @name doesNotIncrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotIncrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotIncrease, true)
      .to.not.increase(obj, prop);
  }

  /**
   * ### .increasesButNotBy(function, object, property, [message])
   *
   * Asserts that a function does not increase a numeric object property or function's return value by an amount (delta).
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.increasesButNotBy(fn, obj, 'val', 10);
   *
   * @name increasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.increasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.increasesButNotBy, true)
      .to.increase(obj, prop).but.not.by(delta);
  }

  /**
   * ### .decreases(function, object, property, [message])
   *
   * Asserts that a function decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreases(fn, obj, 'val');
   *
   * @name decreases
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreases = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.decreases, true)
      .to.decrease(obj, prop);
  }

  /**
   * ### .decreasesBy(function, object, property, delta, [message])
   *
   * Asserts that a function decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val -= 5 };
   *     assert.decreasesBy(fn, obj, 'val', 5);
   *
   * @name decreasesBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesBy, true)
      .to.decrease(obj, prop).by(delta);
  }

  /**
   * ### .doesNotDecrease(function, object, property, [message])
   *
   * Asserts that a function does not decreases a numeric object property.
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 15 };
   *     assert.doesNotDecrease(fn, obj, 'val');
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecrease = function (fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === 'function') {
      msg = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecrease, true)
      .to.not.decrease(obj, prop);
  }

  /**
   * ### .doesNotDecreaseBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.doesNotDecreaseBy(fn, obj, 'val', 1);
   *
   * @name doesNotDecrease
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.doesNotDecreaseBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    return new Assertion(fn, msg, assert.doesNotDecreaseBy, true)
      .to.not.decrease(obj, prop).by(delta);
  }

  /**
   * ### .decreasesButNotBy(function, object, property, delta, [message])
   *
   * Asserts that a function does not decreases a numeric object property or a function's return value by an amount (delta)
   *
   *     var obj = { val: 10 };
   *     var fn = function() { obj.val = 5 };
   *     assert.decreasesButNotBy(fn, obj, 'val', 1);
   *
   * @name decreasesButNotBy
   * @param {Function} modifier function
   * @param {Object} object or getter function
   * @param {String} property name _optional_
   * @param {Number} change amount (delta)
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.decreasesButNotBy = function (fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === 'function') {
      var tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }

    new Assertion(fn, msg, assert.decreasesButNotBy, true)
      .to.decrease(obj, prop).but.not.by(delta);
  }

  /*!
   * ### .ifError(object)
   *
   * Asserts if value is not a false value, and throws if it is a true value.
   * This is added to allow for chai to be a drop-in replacement for Node's
   * assert class.
   *
   *     var err = new Error('I am a custom error');
   *     assert.ifError(err); // Rethrows err!
   *
   * @name ifError
   * @param {Object} object
   * @namespace Assert
   * @api public
   */

  assert.ifError = function (val) {
    if (val) {
      throw(val);
    }
  };

  /**
   * ### .isExtensible(object)
   *
   * Asserts that `object` is extensible (can have new properties added to it).
   *
   *     assert.isExtensible({});
   *
   * @name isExtensible
   * @alias extensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
  };

  /**
   * ### .isNotExtensible(object)
   *
   * Asserts that `object` is _not_ extensible.
   *
   *     var nonExtensibleObject = Object.preventExtensions({});
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.freeze({});
   *
   *     assert.isNotExtensible(nonExtensibleObject);
   *     assert.isNotExtensible(sealedObject);
   *     assert.isNotExtensible(frozenObject);
   *
   * @name isNotExtensible
   * @alias notExtensible
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotExtensible = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
  };

  /**
   * ### .isSealed(object)
   *
   * Asserts that `object` is sealed (cannot have new properties added to it
   * and its existing properties cannot be removed).
   *
   *     var sealedObject = Object.seal({});
   *     var frozenObject = Object.seal({});
   *
   *     assert.isSealed(sealedObject);
   *     assert.isSealed(frozenObject);
   *
   * @name isSealed
   * @alias sealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
  };

  /**
   * ### .isNotSealed(object)
   *
   * Asserts that `object` is _not_ sealed.
   *
   *     assert.isNotSealed({});
   *
   * @name isNotSealed
   * @alias notSealed
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotSealed = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
  };

  /**
   * ### .isFrozen(object)
   *
   * Asserts that `object` is frozen (cannot have new properties added to it
   * and its existing properties cannot be modified).
   *
   *     var frozenObject = Object.freeze({});
   *     assert.frozen(frozenObject);
   *
   * @name isFrozen
   * @alias frozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
  };

  /**
   * ### .isNotFrozen(object)
   *
   * Asserts that `object` is _not_ frozen.
   *
   *     assert.isNotFrozen({});
   *
   * @name isNotFrozen
   * @alias notFrozen
   * @param {Object} object
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotFrozen = function (obj, msg) {
    new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
  };

  /**
   * ### .isEmpty(target)
   *
   * Asserts that the target does not contain any values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isEmpty([]);
   *     assert.isEmpty('');
   *     assert.isEmpty(new Map);
   *     assert.isEmpty({});
   *
   * @name isEmpty
   * @alias empty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
  };

  /**
   * ### .isNotEmpty(target)
   *
   * Asserts that the target contains values.
   * For arrays and strings, it checks the `length` property.
   * For `Map` and `Set` instances, it checks the `size` property.
   * For non-function objects, it gets the count of own
   * enumerable string keys.
   *
   *     assert.isNotEmpty([1, 2]);
   *     assert.isNotEmpty('34');
   *     assert.isNotEmpty(new Set([5, 6]));
   *     assert.isNotEmpty({ key: 7 });
   *
   * @name isNotEmpty
   * @alias notEmpty
   * @param {Object|Array|String|Map|Set} target
   * @param {String} message _optional_
   * @namespace Assert
   * @api public
   */

  assert.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
  };

  /*!
   * Aliases.
   */

  (function alias(name, as){
    assert[as] = assert[name];
    return alias;
  })
  ('isOk', 'ok')
  ('isNotOk', 'notOk')
  ('throws', 'throw')
  ('throws', 'Throw')
  ('isExtensible', 'extensible')
  ('isNotExtensible', 'notExtensible')
  ('isSealed', 'sealed')
  ('isNotSealed', 'notSealed')
  ('isFrozen', 'frozen')
  ('isNotFrozen', 'notFrozen')
  ('isEmpty', 'empty')
  ('isNotEmpty', 'notEmpty');
};

},{}],8:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  chai.expect = function (val, message) {
    return new chai.Assertion(val, message);
  };

  /**
   * ### .fail(actual, expected, [message], [operator])
   *
   * Throw a failure.
   *
   * @name fail
   * @param {Mixed} actual
   * @param {Mixed} expected
   * @param {String} message
   * @param {String} operator
   * @namespace BDD
   * @api public
   */

  chai.expect.fail = function (actual, expected, message, operator) {
    message = message || 'expect.fail()';
    throw new chai.AssertionError(message, {
        actual: actual
      , expected: expected
      , operator: operator
    }, chai.expect.fail);
  };
};

},{}],9:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

module.exports = function (chai, util) {
  var Assertion = chai.Assertion;

  function loadShould () {
    // explicitly define this method as function as to have it's name to include as `ssfi`
    function shouldGetter() {
      if (this instanceof String
          || this instanceof Number
          || this instanceof Boolean
          || typeof Symbol === 'function' && this instanceof Symbol) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    function shouldSetter(value) {
      // See https://github.com/chaijs/chai/issues/86: this makes
      // `whatever.should = someValue` actually set `someValue`, which is
      // especially useful for `global.should = require('chai').should()`.
      //
      // Note that we have to use [[DefineProperty]] instead of [[Put]]
      // since otherwise we would trigger this very setter!
      Object.defineProperty(this, 'should', {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    // modify Object.prototype to have `should`
    Object.defineProperty(Object.prototype, 'should', {
      set: shouldSetter
      , get: shouldGetter
      , configurable: true
    });

    var should = {};

    /**
     * ### .fail(actual, expected, [message], [operator])
     *
     * Throw a failure.
     *
     * @name fail
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @param {String} operator
     * @namespace BDD
     * @api public
     */

    should.fail = function (actual, expected, message, operator) {
      message = message || 'should.fail()';
      throw new chai.AssertionError(message, {
          actual: actual
        , expected: expected
        , operator: operator
      }, should.fail);
    };

    /**
     * ### .equal(actual, expected, [message])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     should.equal(3, '3', '== coerces values to strings');
     *
     * @name equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/string/regexp], [string/regexp], [message])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     should.throw(fn, 'function throws a reference error');
     *     should.throw(fn, /function throws a reference error/);
     *     should.throw(fn, ReferenceError);
     *     should.throw(fn, ReferenceError, 'function throws a reference error');
     *     should.throw(fn, ReferenceError, /function throws a reference error/);
     *
     * @name throw
     * @alias Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };

    /**
     * ### .exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var foo = 'hi';
     *
     *     should.exist(foo, 'foo exists');
     *
     * @name exist
     * @namespace Should
     * @api public
     */

    should.exist = function (val, msg) {
      new Assertion(val, msg).to.exist;
    }

    // negation
    should.not = {}

    /**
     * ### .not.equal(actual, expected, [message])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     should.not.equal(3, 4, 'these numbers are not equal');
     *
     * @name not.equal
     * @param {Mixed} actual
     * @param {Mixed} expected
     * @param {String} message
     * @namespace Should
     * @api public
     */

    should.not.equal = function (val1, val2, msg) {
      new Assertion(val1, msg).to.not.equal(val2);
    };

    /**
     * ### .throw(function, [constructor/regexp], [message])
     *
     * Asserts that `function` will _not_ throw an error that is an instance of
     * `constructor`, or alternately that it will not throw an error with message
     * matching `regexp`.
     *
     *     should.not.throw(fn, Error, 'function does not throw');
     *
     * @name not.throw
     * @alias not.Throw
     * @param {Function} function
     * @param {ErrorConstructor} constructor
     * @param {RegExp} regexp
     * @param {String} message
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     * @namespace Should
     * @api public
     */

    should.not.Throw = function (fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };

    /**
     * ### .not.exist
     *
     * Asserts that the target is neither `null` nor `undefined`.
     *
     *     var bar = null;
     *
     *     should.not.exist(bar, 'bar does not exist');
     *
     * @name not.exist
     * @namespace Should
     * @api public
     */

    should.not.exist = function (val, msg) {
      new Assertion(val, msg).to.not.exist;
    }

    should['throw'] = should['Throw'];
    should.not['throw'] = should.not['Throw'];

    return should;
  };

  chai.should = loadShould;
  chai.Should = loadShould;
};

},{}],10:[function(require,module,exports){
/*!
 * Chai - addChainingMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependencies
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/*!
 * Module variables
 */

// Check whether `Object.setPrototypeOf` is supported
var canSetPrototype = typeof Object.setPrototypeOf === 'function';

// Without `Object.setPrototypeOf` support, this module will need to add properties to a function.
// However, some of functions' own props are not configurable and should be skipped.
var testFn = function() {};
var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
  var propDesc = Object.getOwnPropertyDescriptor(testFn, name);

  // Note: PhantomJS 1.x includes `callee` as one of `testFn`'s own properties,
  // but then returns `undefined` as the property descriptor for `callee`. As a
  // workaround, we perform an otherwise unnecessary type-check for `propDesc`,
  // and then filter it out if it's not an object as it should be.
  if (typeof propDesc !== 'object')
    return true;

  return !propDesc.configurable;
});

// Cache `Function` properties
var call  = Function.prototype.call,
    apply = Function.prototype.apply;

/**
 * ### .addChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addChainableMethod('foo', fn, chainingBehavior);
 *
 * The result can then be used as both a method assertion, executing both `method` and
 * `chainingBehavior`, or as a language chain, which only executes `chainingBehavior`.
 *
 *     expect(fooStr).to.be.foo('bar');
 *     expect(fooStr).to.be.foo.equal('foo');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} chainingBehavior function to be called every time the property is accessed
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function addChainableMethod(ctx, name, method, chainingBehavior) {
  if (typeof chainingBehavior !== 'function') {
    chainingBehavior = function () { };
  }

  var chainableBehavior = {
      method: method
    , chainingBehavior: chainingBehavior
  };

  // save the methods so we can overwrite them later, if we need to.
  if (!ctx.__methods) {
    ctx.__methods = {};
  }
  ctx.__methods[name] = chainableBehavior;

  Object.defineProperty(ctx, name,
    { get: function chainableMethodGetter() {
        chainableBehavior.chainingBehavior.call(this);

        var chainableMethodWrapper = function () {
          // Setting the `ssfi` flag to `chainableMethodWrapper` causes this
          // function to be the starting point for removing implementation
          // frames from the stack trace of a failed assertion.
          //
          // However, we only want to use this function as the starting point if
          // the `lockSsfi` flag isn't set.
          //
          // If the `lockSsfi` flag is set, then this assertion is being
          // invoked from inside of another assertion. In this case, the `ssfi`
          // flag has already been set by the outer assertion.
          //
          // Note that overwriting a chainable method merely replaces the saved
          // methods in `ctx.__methods` instead of completely replacing the
          // overwritten assertion. Therefore, an overwriting assertion won't
          // set the `ssfi` or `lockSsfi` flags.
          if (!flag(this, 'lockSsfi')) {
            flag(this, 'ssfi', chainableMethodWrapper);
          }

          var result = chainableBehavior.method.apply(this, arguments);
          if (result !== undefined) {
            return result;
          }

          var newAssertion = new chai.Assertion();
          transferFlags(this, newAssertion);
          return newAssertion;
        };

        addLengthGuard(chainableMethodWrapper, name, true);

        // Use `Object.setPrototypeOf` if available
        if (canSetPrototype) {
          // Inherit all properties from the object by replacing the `Function` prototype
          var prototype = Object.create(this);
          // Restore the `call` and `apply` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          Object.setPrototypeOf(chainableMethodWrapper, prototype);
        }
        // Otherwise, redefine all properties (slow!)
        else {
          var asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function (asserterName) {
            if (excludeNames.indexOf(asserterName) !== -1) {
              return;
            }

            var pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
          });
        }

        transferFlags(this, chainableMethodWrapper);
        return proxify(chainableMethodWrapper);
      }
    , configurable: true
  });
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],11:[function(require,module,exports){
var config = require('../config');

var fnLengthDesc = Object.getOwnPropertyDescriptor(function () {}, 'length');

/*!
 * Chai - addLengthGuard utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .addLengthGuard(fn, assertionName, isChainable)
 *
 * Define `length` as a getter on the given uninvoked method assertion. The
 * getter acts as a guard against chaining `length` directly off of an uninvoked
 * method assertion, which is a problem because it references `function`'s
 * built-in `length` property instead of Chai's `length` assertion. When the
 * getter catches the user making this mistake, it throws an error with a
 * helpful message.
 *
 * There are two ways in which this mistake can be made. The first way is by
 * chaining the `length` assertion directly off of an uninvoked chainable
 * method. In this case, Chai suggests that the user use `lengthOf` instead. The
 * second way is by chaining the `length` assertion directly off of an uninvoked
 * non-chainable method. Non-chainable methods must be invoked prior to
 * chaining. In this case, Chai suggests that the user consult the docs for the
 * given assertion.
 *
 * If the `length` property of functions is unconfigurable, then return `fn`
 * without modification.
 *
 * Note that in ES6, the function's `length` property is configurable, so once
 * support for legacy environments is dropped, Chai's `length` property can
 * replace the built-in function's `length` property, and this length guard will
 * no longer be necessary. In the mean time, maintaining consistency across all
 * environments is the priority.
 *
 * @param {Function} fn
 * @param {String} assertionName
 * @param {Boolean} isChainable
 * @namespace Utils
 * @name addLengthGuard
 */

module.exports = function addLengthGuard (fn, assertionName, isChainable) {
  if (!fnLengthDesc.configurable) return fn;

  Object.defineProperty(fn, 'length', {
    get: function () {
      if (isChainable) {
        throw Error('Invalid Chai property: ' + assertionName + '.length. Due' +
          ' to a compatibility issue, "length" cannot directly follow "' +
          assertionName + '". Use "' + assertionName + '.lengthOf" instead.');
      }

      throw Error('Invalid Chai property: ' + assertionName + '.length. See' +
        ' docs for proper usage of "' + assertionName + '".');
    }
  });

  return fn;
};

},{"../config":5}],12:[function(require,module,exports){
/*!
 * Chai - addMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/**
 * ### .addMethod(ctx, name, method)
 *
 * Adds a method to the prototype of an object.
 *
 *     utils.addMethod(chai.Assertion.prototype, 'foo', function (str) {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.equal(str);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(fooStr).to.be.foo('bar');
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for name
 * @namespace Utils
 * @name addMethod
 * @api public
 */

module.exports = function addMethod(ctx, name, method) {
  var methodWrapper = function () {
    // Setting the `ssfi` flag to `methodWrapper` causes this function to be the
    // starting point for removing implementation frames from the stack trace of
    // a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', methodWrapper);
    }

    var result = method.apply(this, arguments);
    if (result !== undefined)
      return result;

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  addLengthGuard(methodWrapper, name, false);
  ctx[name] = proxify(methodWrapper, name);
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],13:[function(require,module,exports){
/*!
 * Chai - addProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var flag = require('./flag');
var isProxyEnabled = require('./isProxyEnabled');
var transferFlags = require('./transferFlags');

/**
 * ### .addProperty(ctx, name, getter)
 *
 * Adds a property to the prototype of an object.
 *
 *     utils.addProperty(chai.Assertion.prototype, 'foo', function () {
 *       var obj = utils.flag(this, 'object');
 *       new chai.Assertion(obj).to.be.instanceof(Foo);
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.addProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.foo;
 *
 * @param {Object} ctx object to which the property is added
 * @param {String} name of property to add
 * @param {Function} getter function to be used for name
 * @namespace Utils
 * @name addProperty
 * @api public
 */

module.exports = function addProperty(ctx, name, getter) {
  getter = getter === undefined ? function () {} : getter;

  Object.defineProperty(ctx, name,
    { get: function propertyGetter() {
        // Setting the `ssfi` flag to `propertyGetter` causes this function to
        // be the starting point for removing implementation frames from the
        // stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', propertyGetter);
        }

        var result = getter.call(this);
        if (result !== undefined)
          return result;

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

},{"../../chai":3,"./flag":16,"./isProxyEnabled":26,"./transferFlags":33}],14:[function(require,module,exports){
/*!
 * Chai - compareByInspect utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');

/**
 * ### .compareByInspect(mixed, mixed)
 *
 * To be used as a compareFunction with Array.prototype.sort. Compares elements
 * using inspect instead of default behavior of using toString so that Symbols
 * and objects with irregular/missing toString can still be sorted without a
 * TypeError.
 *
 * @param {Mixed} first element to compare
 * @param {Mixed} second element to compare
 * @returns {Number} -1 if 'a' should come before 'b'; otherwise 1 
 * @name compareByInspect
 * @namespace Utils
 * @api public
 */

module.exports = function compareByInspect(a, b) {
  return inspect(a) < inspect(b) ? -1 : 1;
};

},{"./inspect":24}],15:[function(require,module,exports){
/*!
 * Chai - expectTypes utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .expectTypes(obj, types)
 *
 * Ensures that the object being tested against is of a valid type.
 *
 *     utils.expectTypes(this, ['array', 'object', 'string']);
 *
 * @param {Mixed} obj constructed Assertion
 * @param {Array} type A list of allowed types for this assertion
 * @namespace Utils
 * @name expectTypes
 * @api public
 */

var AssertionError = require('assertion-error');
var flag = require('./flag');
var type = require('type-detect');

module.exports = function expectTypes(obj, types) {
  var flagMsg = flag(obj, 'message');
  var ssfi = flag(obj, 'ssfi');

  flagMsg = flagMsg ? flagMsg + ': ' : '';

  obj = flag(obj, 'object');
  types = types.map(function (t) { return t.toLowerCase(); });
  types.sort();

  // Transforms ['lorem', 'ipsum'] into 'a lorem, or an ipsum'
  var str = types.map(function (t, index) {
    var art = ~[ 'a', 'e', 'i', 'o', 'u' ].indexOf(t.charAt(0)) ? 'an' : 'a';
    var or = types.length > 1 && index === types.length - 1 ? 'or ' : '';
    return or + art + ' ' + t;
  }).join(', ');

  var objType = type(obj).toLowerCase();

  if (!types.some(function (expected) { return objType === expected; })) {
    throw new AssertionError(
      flagMsg + 'object tested must be ' + str + ', but ' + objType + ' given',
      undefined,
      ssfi
    );
  }
};

},{"./flag":16,"assertion-error":1,"type-detect":38}],16:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .flag(object, key, [value])
 *
 * Get or set a flag value on an object. If a
 * value is provided it will be set, else it will
 * return the currently set value or `undefined` if
 * the value is not set.
 *
 *     utils.flag(this, 'foo', 'bar'); // setter
 *     utils.flag(this, 'foo'); // getter, returns `bar`
 *
 * @param {Object} object constructed Assertion
 * @param {String} key
 * @param {Mixed} value (optional)
 * @namespace Utils
 * @name flag
 * @api private
 */

module.exports = function flag(obj, key, value) {
  var flags = obj.__flags || (obj.__flags = Object.create(null));
  if (arguments.length === 3) {
    flags[key] = value;
  } else {
    return flags[key];
  }
};

},{}],17:[function(require,module,exports){
/*!
 * Chai - getActual utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getActual(object, [actual])
 *
 * Returns the `actual` value for an Assertion.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getActual
 */

module.exports = function getActual(obj, args) {
  return args.length > 4 ? args[4] : obj._obj;
};

},{}],18:[function(require,module,exports){
/*!
 * Chai - getEnumerableProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getEnumerableProperties(object)
 *
 * This allows the retrieval of enumerable property names of an object,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getEnumerableProperties
 * @api public
 */

module.exports = function getEnumerableProperties(object) {
  var result = [];
  for (var name in object) {
    result.push(name);
  }
  return result;
};

},{}],19:[function(require,module,exports){
/*!
 * Chai - message composition utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag')
  , getActual = require('./getActual')
  , inspect = require('./inspect')
  , objDisplay = require('./objDisplay');

/**
 * ### .getMessage(object, message, negateMessage)
 *
 * Construct the error message based on flags
 * and template tags. Template tags will return
 * a stringified inspection of the object referenced.
 *
 * Message template tags:
 * - `#{this}` current asserted object
 * - `#{act}` actual value
 * - `#{exp}` expected value
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name getMessage
 * @api public
 */

module.exports = function getMessage(obj, args) {
  var negate = flag(obj, 'negate')
    , val = flag(obj, 'object')
    , expected = args[3]
    , actual = getActual(obj, args)
    , msg = negate ? args[2] : args[1]
    , flagMsg = flag(obj, 'message');

  if(typeof msg === "function") msg = msg();
  msg = msg || '';
  msg = msg
    .replace(/#\{this\}/g, function () { return objDisplay(val); })
    .replace(/#\{act\}/g, function () { return objDisplay(actual); })
    .replace(/#\{exp\}/g, function () { return objDisplay(expected); });

  return flagMsg ? flagMsg + ': ' + msg : msg;
};

},{"./flag":16,"./getActual":17,"./inspect":24,"./objDisplay":27}],20:[function(require,module,exports){
/*!
 * Chai - getOwnEnumerableProperties utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var getOwnEnumerablePropertySymbols = require('./getOwnEnumerablePropertySymbols');

/**
 * ### .getOwnEnumerableProperties(object)
 *
 * This allows the retrieval of directly-owned enumerable property names and
 * symbols of an object. This function is necessary because Object.keys only
 * returns enumerable property names, not enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerableProperties
 * @api public
 */

module.exports = function getOwnEnumerableProperties(obj) {
  return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
};

},{"./getOwnEnumerablePropertySymbols":21}],21:[function(require,module,exports){
/*!
 * Chai - getOwnEnumerablePropertySymbols utility
 * Copyright(c) 2011-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getOwnEnumerablePropertySymbols(object)
 *
 * This allows the retrieval of directly-owned enumerable property symbols of an
 * object. This function is necessary because Object.getOwnPropertySymbols
 * returns both enumerable and non-enumerable property symbols.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getOwnEnumerablePropertySymbols
 * @api public
 */

module.exports = function getOwnEnumerablePropertySymbols(obj) {
  if (typeof Object.getOwnPropertySymbols !== 'function') return [];

  return Object.getOwnPropertySymbols(obj).filter(function (sym) {
    return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
  });
};

},{}],22:[function(require,module,exports){
/*!
 * Chai - getProperties utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getProperties(object)
 *
 * This allows the retrieval of property names of an object, enumerable or not,
 * inherited or not.
 *
 * @param {Object} object
 * @returns {Array}
 * @namespace Utils
 * @name getProperties
 * @api public
 */

module.exports = function getProperties(object) {
  var result = Object.getOwnPropertyNames(object);

  function addProperty(property) {
    if (result.indexOf(property) === -1) {
      result.push(property);
    }
  }

  var proto = Object.getPrototypeOf(object);
  while (proto !== null) {
    Object.getOwnPropertyNames(proto).forEach(addProperty);
    proto = Object.getPrototypeOf(proto);
  }

  return result;
};

},{}],23:[function(require,module,exports){
/*!
 * chai
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Dependencies that are used for multiple exports are required here only once
 */

var pathval = require('pathval');

/*!
 * test utility
 */

exports.test = require('./test');

/*!
 * type utility
 */

exports.type = require('type-detect');

/*!
 * expectTypes utility
 */
exports.expectTypes = require('./expectTypes');

/*!
 * message utility
 */

exports.getMessage = require('./getMessage');

/*!
 * actual utility
 */

exports.getActual = require('./getActual');

/*!
 * Inspect util
 */

exports.inspect = require('./inspect');

/*!
 * Object Display util
 */

exports.objDisplay = require('./objDisplay');

/*!
 * Flag utility
 */

exports.flag = require('./flag');

/*!
 * Flag transferring utility
 */

exports.transferFlags = require('./transferFlags');

/*!
 * Deep equal utility
 */

exports.eql = require('deep-eql');

/*!
 * Deep path info
 */

exports.getPathInfo = pathval.getPathInfo;

/*!
 * Check if a property exists
 */

exports.hasProperty = pathval.hasProperty;

/*!
 * Function name
 */

exports.getName = require('get-func-name');

/*!
 * add Property
 */

exports.addProperty = require('./addProperty');

/*!
 * add Method
 */

exports.addMethod = require('./addMethod');

/*!
 * overwrite Property
 */

exports.overwriteProperty = require('./overwriteProperty');

/*!
 * overwrite Method
 */

exports.overwriteMethod = require('./overwriteMethod');

/*!
 * Add a chainable method
 */

exports.addChainableMethod = require('./addChainableMethod');

/*!
 * Overwrite chainable method
 */

exports.overwriteChainableMethod = require('./overwriteChainableMethod');

/*!
 * Compare by inspect method
 */

exports.compareByInspect = require('./compareByInspect');

/*!
 * Get own enumerable property symbols method
 */

exports.getOwnEnumerablePropertySymbols = require('./getOwnEnumerablePropertySymbols');

/*!
 * Get own enumerable properties method
 */

exports.getOwnEnumerableProperties = require('./getOwnEnumerableProperties');

/*!
 * Checks error against a given set of criteria
 */

exports.checkError = require('check-error');

/*!
 * Proxify util
 */

exports.proxify = require('./proxify');

/*!
 * addLengthGuard util
 */

exports.addLengthGuard = require('./addLengthGuard');

/*!
 * isProxyEnabled helper
 */

exports.isProxyEnabled = require('./isProxyEnabled');

/*!
 * isNaN method
 */

exports.isNaN = require('./isNaN');

},{"./addChainableMethod":10,"./addLengthGuard":11,"./addMethod":12,"./addProperty":13,"./compareByInspect":14,"./expectTypes":15,"./flag":16,"./getActual":17,"./getMessage":19,"./getOwnEnumerableProperties":20,"./getOwnEnumerablePropertySymbols":21,"./inspect":24,"./isNaN":25,"./isProxyEnabled":26,"./objDisplay":27,"./overwriteChainableMethod":28,"./overwriteMethod":29,"./overwriteProperty":30,"./proxify":31,"./test":32,"./transferFlags":33,"check-error":34,"deep-eql":35,"get-func-name":36,"pathval":37,"type-detect":38}],24:[function(require,module,exports){
// This is (almost) directly from Node.js utils
// https://github.com/joyent/node/blob/f8c335d0caf47f16d31413f89aa28eda3878e3aa/lib/util.js

var getName = require('get-func-name');
var getProperties = require('./getProperties');
var getEnumerableProperties = require('./getEnumerableProperties');
var config = require('../config');

module.exports = inspect;

/**
 * ### .inspect(obj, [showHidden], [depth], [colors])
 *
 * Echoes the value of a value. Tries to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Boolean} showHidden Flag that shows hidden (not enumerable)
 *    properties of objects. Default is false.
 * @param {Number} depth Depth in which to descend in object. Default is 2.
 * @param {Boolean} colors Flag to turn on ANSI escape codes to color the
 *    output. Default is false (no coloring).
 * @namespace Utils
 * @name inspect
 */
function inspect(obj, showHidden, depth, colors) {
  var ctx = {
    showHidden: showHidden,
    seen: [],
    stylize: function (str) { return str; }
  };
  return formatValue(ctx, obj, (typeof depth === 'undefined' ? 2 : depth));
}

// Returns true if object is a DOM element.
var isDOMElement = function (object) {
  if (typeof HTMLElement === 'object') {
    return object instanceof HTMLElement;
  } else {
    return object &&
      typeof object === 'object' &&
      'nodeType' in object &&
      object.nodeType === 1 &&
      typeof object.nodeName === 'string';
  }
};

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (typeof ret !== 'string') {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // If this is a DOM element, try to get the outer HTML.
  if (isDOMElement(value)) {
    if ('outerHTML' in value) {
      return value.outerHTML;
      // This value does not have an outerHTML attribute,
      //   it could still be an XML element
    } else {
      // Attempt to serialize it
      try {
        if (document.xmlVersion) {
          var xmlSerializer = new XMLSerializer();
          return xmlSerializer.serializeToString(value);
        } else {
          // Firefox 11- do not support outerHTML
          //   It does, however, support innerHTML
          //   Use the following to render the element
          var ns = "http://www.w3.org/1999/xhtml";
          var container = document.createElementNS(ns, '_');

          container.appendChild(value.cloneNode(false));
          var html = container.innerHTML
            .replace('><', '>' + value.innerHTML + '<');
          container.innerHTML = '';
          return html;
        }
      } catch (err) {
        // This could be a non-native DOM implementation,
        //   continue with the normal flow:
        //   printing the element as if it is an object.
      }
    }
  }

  // Look up the keys of the object.
  var visibleKeys = getEnumerableProperties(value);
  var keys = ctx.showHidden ? getProperties(value) : visibleKeys;

  var name, nameSuffix;

  // Some type of object without properties can be shortcutted.
  // In IE, errors have a single `stack` property, or if they are vanilla `Error`,
  // a `stack` plus `description` property; ignore those for consistency.
  if (keys.length === 0 || (isError(value) && (
      (keys.length === 1 && keys[0] === 'stack') ||
      (keys.length === 2 && keys[0] === 'description' && keys[1] === 'stack')
     ))) {
    if (typeof value === 'function') {
      name = getName(value);
      nameSuffix = name ? ': ' + name : '';
      return ctx.stylize('[Function' + nameSuffix + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toUTCString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = ''
    , array = false
    , typedArray = false
    , braces = ['{', '}'];

  if (isTypedArray(value)) {
    typedArray = true;
    braces = ['[', ']'];
  }

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    name = getName(value);
    nameSuffix = name ? ': ' + name : '';
    base = ' [Function' + nameSuffix + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    return formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else if (typedArray) {
    return formatTypedArray(value);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      if (value === 0 && (1/value) === -Infinity) {
        return ctx.stylize('-0', 'number');
      }
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');

    case 'symbol':
      return ctx.stylize(value.toString(), 'symbol');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (Object.prototype.hasOwnProperty.call(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatTypedArray(value) {
  var str = '[ ';

  for (var i = 0; i < value.length; ++i) {
    if (str.length >= config.truncateThreshold - 7) {
      str += '...';
      break;
    }
    str += value[i] + ', ';
  }
  str += ' ]';

  // Removing trailing `, ` if the array was not truncated
  if (str.indexOf(',  ]') !== -1) {
    str = str.replace(',  ]', ' ]');
  }

  return str;
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name;
  var propDescriptor = Object.getOwnPropertyDescriptor(value, key);
  var str;

  if (propDescriptor) {
    if (propDescriptor.get) {
      if (propDescriptor.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (propDescriptor.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
  }
  if (visibleKeys.indexOf(key) < 0) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(value[key]) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, value[key], null);
      } else {
        str = formatValue(ctx, value[key], recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function isTypedArray(ar) {
  // Unfortunately there's no way to check if an object is a TypedArray
  // We have to check if it's one of these types
  return (typeof ar === 'object' && /\w+Array]$/.test(objectToString(ar)));
}

function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"../config":5,"./getEnumerableProperties":18,"./getProperties":22,"get-func-name":36}],25:[function(require,module,exports){
/*!
 * Chai - isNaN utility
 * Copyright(c) 2012-2015 Sakthipriyan Vairamani <thechargingvolcano@gmail.com>
 * MIT Licensed
 */

/**
 * ### .isNaN(value)
 *
 * Checks if the given value is NaN or not.
 *
 *     utils.isNaN(NaN); // true
 *
 * @param {Value} The value which has to be checked if it is NaN
 * @name isNaN
 * @api private
 */

function isNaN(value) {
  // Refer http://www.ecma-international.org/ecma-262/6.0/#sec-isnan-number
  // section's NOTE.
  return value !== value;
}

// If ECMAScript 6's Number.isNaN is present, prefer that.
module.exports = Number.isNaN || isNaN;

},{}],26:[function(require,module,exports){
var config = require('../config');

/*!
 * Chai - isProxyEnabled helper
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .isProxyEnabled()
 *
 * Helper function to check if Chai's proxy protection feature is enabled. If
 * proxies are unsupported or disabled via the user's Chai config, then return
 * false. Otherwise, return true.
 *
 * @namespace Utils
 * @name isProxyEnabled
 */

module.exports = function isProxyEnabled() {
  return config.useProxy && 
    typeof Proxy !== 'undefined' &&
    typeof Reflect !== 'undefined';
};

},{"../config":5}],27:[function(require,module,exports){
/*!
 * Chai - flag utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var inspect = require('./inspect');
var config = require('../config');

/**
 * ### .objDisplay(object)
 *
 * Determines if an object or an array matches
 * criteria to be inspected in-line for error
 * messages or should be truncated.
 *
 * @param {Mixed} javascript object to inspect
 * @name objDisplay
 * @namespace Utils
 * @api public
 */

module.exports = function objDisplay(obj) {
  var str = inspect(obj)
    , type = Object.prototype.toString.call(obj);

  if (config.truncateThreshold && str.length >= config.truncateThreshold) {
    if (type === '[object Function]') {
      return !obj.name || obj.name === ''
        ? '[Function]'
        : '[Function: ' + obj.name + ']';
    } else if (type === '[object Array]') {
      return '[ Array(' + obj.length + ') ]';
    } else if (type === '[object Object]') {
      var keys = Object.keys(obj)
        , kstr = keys.length > 2
          ? keys.splice(0, 2).join(', ') + ', ...'
          : keys.join(', ');
      return '{ Object (' + kstr + ') }';
    } else {
      return str;
    }
  } else {
    return str;
  }
};

},{"../config":5,"./inspect":24}],28:[function(require,module,exports){
/*!
 * Chai - overwriteChainableMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteChainableMethod(ctx, name, method, chainingBehavior)
 *
 * Overwites an already existing chainable method
 * and provides access to the previous function or
 * property.  Must return functions to be used for
 * name.
 *
 *     utils.overwriteChainableMethod(chai.Assertion.prototype, 'lengthOf',
 *       function (_super) {
 *       }
 *     , function (_super) {
 *       }
 *     );
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteChainableMethod('foo', fn, fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.have.lengthOf(3);
 *     expect(myFoo).to.have.lengthOf.above(3);
 *
 * @param {Object} ctx object whose method / property is to be overwritten
 * @param {String} name of method / property to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @param {Function} chainingBehavior function that returns a function to be used for property
 * @namespace Utils
 * @name overwriteChainableMethod
 * @api public
 */

module.exports = function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
  var chainableBehavior = ctx.__methods[name];

  var _chainingBehavior = chainableBehavior.chainingBehavior;
  chainableBehavior.chainingBehavior = function overwritingChainableMethodGetter() {
    var result = chainingBehavior(_chainingBehavior).call(this);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };

  var _method = chainableBehavior.method;
  chainableBehavior.method = function overwritingChainableMethodWrapper() {
    var result = method(_method).apply(this, arguments);
    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  };
};

},{"../../chai":3,"./transferFlags":33}],29:[function(require,module,exports){
/*!
 * Chai - overwriteMethod utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var addLengthGuard = require('./addLengthGuard');
var chai = require('../../chai');
var flag = require('./flag');
var proxify = require('./proxify');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteMethod(ctx, name, fn)
 *
 * Overwites an already existing method and provides
 * access to previous function. Must return function
 * to be used for name.
 *
 *     utils.overwriteMethod(chai.Assertion.prototype, 'equal', function (_super) {
 *       return function (str) {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.value).to.equal(str);
 *         } else {
 *           _super.apply(this, arguments);
 *         }
 *       }
 *     });
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteMethod('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.equal('bar');
 *
 * @param {Object} ctx object whose method is to be overwritten
 * @param {String} name of method to overwrite
 * @param {Function} method function that returns a function to be used for name
 * @namespace Utils
 * @name overwriteMethod
 * @api public
 */

module.exports = function overwriteMethod(ctx, name, method) {
  var _method = ctx[name]
    , _super = function () {
      throw new Error(name + ' is not a function');
    };

  if (_method && 'function' === typeof _method)
    _super = _method;

  var overwritingMethodWrapper = function () {
    // Setting the `ssfi` flag to `overwritingMethodWrapper` causes this
    // function to be the starting point for removing implementation frames from
    // the stack trace of a failed assertion.
    //
    // However, we only want to use this function as the starting point if the
    // `lockSsfi` flag isn't set.
    //
    // If the `lockSsfi` flag is set, then either this assertion has been
    // overwritten by another assertion, or this assertion is being invoked from
    // inside of another assertion. In the first case, the `ssfi` flag has
    // already been set by the overwriting assertion. In the second case, the
    // `ssfi` flag has already been set by the outer assertion.
    if (!flag(this, 'lockSsfi')) {
      flag(this, 'ssfi', overwritingMethodWrapper);
    }

    // Setting the `lockSsfi` flag to `true` prevents the overwritten assertion
    // from changing the `ssfi` flag. By this point, the `ssfi` flag is already
    // set to the correct starting point for this assertion.
    var origLockSsfi = flag(this, 'lockSsfi');
    flag(this, 'lockSsfi', true);
    var result = method(_super).apply(this, arguments);
    flag(this, 'lockSsfi', origLockSsfi);

    if (result !== undefined) {
      return result;
    }

    var newAssertion = new chai.Assertion();
    transferFlags(this, newAssertion);
    return newAssertion;
  }

  addLengthGuard(overwritingMethodWrapper, name, false);
  ctx[name] = proxify(overwritingMethodWrapper, name);
};

},{"../../chai":3,"./addLengthGuard":11,"./flag":16,"./proxify":31,"./transferFlags":33}],30:[function(require,module,exports){
/*!
 * Chai - overwriteProperty utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var chai = require('../../chai');
var flag = require('./flag');
var isProxyEnabled = require('./isProxyEnabled');
var transferFlags = require('./transferFlags');

/**
 * ### .overwriteProperty(ctx, name, fn)
 *
 * Overwites an already existing property getter and provides
 * access to previous value. Must return function to use as getter.
 *
 *     utils.overwriteProperty(chai.Assertion.prototype, 'ok', function (_super) {
 *       return function () {
 *         var obj = utils.flag(this, 'object');
 *         if (obj instanceof Foo) {
 *           new chai.Assertion(obj.name).to.equal('bar');
 *         } else {
 *           _super.call(this);
 *         }
 *       }
 *     });
 *
 *
 * Can also be accessed directly from `chai.Assertion`.
 *
 *     chai.Assertion.overwriteProperty('foo', fn);
 *
 * Then can be used as any other assertion.
 *
 *     expect(myFoo).to.be.ok;
 *
 * @param {Object} ctx object whose property is to be overwritten
 * @param {String} name of property to overwrite
 * @param {Function} getter function that returns a getter function to be used for name
 * @namespace Utils
 * @name overwriteProperty
 * @api public
 */

module.exports = function overwriteProperty(ctx, name, getter) {
  var _get = Object.getOwnPropertyDescriptor(ctx, name)
    , _super = function () {};

  if (_get && 'function' === typeof _get.get)
    _super = _get.get

  Object.defineProperty(ctx, name,
    { get: function overwritingPropertyGetter() {
        // Setting the `ssfi` flag to `overwritingPropertyGetter` causes this
        // function to be the starting point for removing implementation frames
        // from the stack trace of a failed assertion.
        //
        // However, we only want to use this function as the starting point if
        // the `lockSsfi` flag isn't set and proxy protection is disabled.
        //
        // If the `lockSsfi` flag is set, then either this assertion has been
        // overwritten by another assertion, or this assertion is being invoked
        // from inside of another assertion. In the first case, the `ssfi` flag
        // has already been set by the overwriting assertion. In the second
        // case, the `ssfi` flag has already been set by the outer assertion.
        //
        // If proxy protection is enabled, then the `ssfi` flag has already been
        // set by the proxy getter.
        if (!isProxyEnabled() && !flag(this, 'lockSsfi')) {
          flag(this, 'ssfi', overwritingPropertyGetter);
        }

        // Setting the `lockSsfi` flag to `true` prevents the overwritten
        // assertion from changing the `ssfi` flag. By this point, the `ssfi`
        // flag is already set to the correct starting point for this assertion.
        var origLockSsfi = flag(this, 'lockSsfi');
        flag(this, 'lockSsfi', true);
        var result = getter(_super).call(this);
        flag(this, 'lockSsfi', origLockSsfi);

        if (result !== undefined) {
          return result;
        }

        var newAssertion = new chai.Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }
    , configurable: true
  });
};

},{"../../chai":3,"./flag":16,"./isProxyEnabled":26,"./transferFlags":33}],31:[function(require,module,exports){
var config = require('../config');
var flag = require('./flag');
var getProperties = require('./getProperties');
var isProxyEnabled = require('./isProxyEnabled');

/*!
 * Chai - proxify utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .proxify(object)
 *
 * Return a proxy of given object that throws an error when a non-existent
 * property is read. By default, the root cause is assumed to be a misspelled
 * property, and thus an attempt is made to offer a reasonable suggestion from
 * the list of existing properties. However, if a nonChainableMethodName is
 * provided, then the root cause is instead a failure to invoke a non-chainable
 * method prior to reading the non-existent property.
 * 
 * If proxies are unsupported or disabled via the user's Chai config, then
 * return object without modification.
 *
 * @param {Object} obj
 * @param {String} nonChainableMethodName
 * @namespace Utils
 * @name proxify
 */

var builtins = ['__flags', '__methods', '_obj', 'assert'];

module.exports = function proxify(obj, nonChainableMethodName) {
  if (!isProxyEnabled()) return obj;

  return new Proxy(obj, {
    get: function proxyGetter(target, property) {
      // This check is here because we should not throw errors on Symbol properties
      // such as `Symbol.toStringTag`.
      // The values for which an error should be thrown can be configured using
      // the `config.proxyExcludedKeys` setting.
      if (typeof property === 'string' &&
          config.proxyExcludedKeys.indexOf(property) === -1 &&
          !Reflect.has(target, property)) {
        // Special message for invalid property access of non-chainable methods.
        if (nonChainableMethodName) {
          throw Error('Invalid Chai property: ' + nonChainableMethodName + '.' +
            property + '. See docs for proper usage of "' +
            nonChainableMethodName + '".');
        }

        var orderedProperties = getProperties(target).filter(function(property) {
          return !Object.prototype.hasOwnProperty(property) &&
            builtins.indexOf(property) === -1;
        }).sort(function(a, b) {
          return stringDistance(property, a) - stringDistance(property, b);
        });

        if (orderedProperties.length &&
            stringDistance(orderedProperties[0], property) < 4) {
          // If the property is reasonably close to an existing Chai property,
          // suggest that property to the user.
          throw Error('Invalid Chai property: ' + property +
            '. Did you mean "' + orderedProperties[0] + '"?');
        } else {
          throw Error('Invalid Chai property: ' + property);
        }
      }

      // Use this proxy getter as the starting point for removing implementation
      // frames from the stack trace of a failed assertion. For property
      // assertions, this prevents the proxy getter from showing up in the stack
      // trace since it's invoked before the property getter. For method and
      // chainable method assertions, this flag will end up getting changed to
      // the method wrapper, which is good since this frame will no longer be in
      // the stack once the method is invoked. Note that Chai builtin assertion
      // properties such as `__flags` are skipped since this is only meant to
      // capture the starting point of an assertion. This step is also skipped
      // if the `lockSsfi` flag is set, thus indicating that this assertion is
      // being called from within another assertion. In that case, the `ssfi`
      // flag is already set to the outer assertion's starting point.
      if (builtins.indexOf(property) === -1 && !flag(target, 'lockSsfi')) {
        flag(target, 'ssfi', proxyGetter);
      }

      return Reflect.get(target, property);
    }
  });
};

/**
 * # stringDistance(strA, strB)
 * Return the Levenshtein distance between two strings.
 * @param {string} strA
 * @param {string} strB
 * @return {number} the string distance between strA and strB
 * @api private
 */

function stringDistance(strA, strB, memo) {
  if (!memo) {
    // `memo` is a two-dimensional array containing a cache of distances
    // memo[i][j] is the distance between strA.slice(0, i) and
    // strB.slice(0, j).
    memo = [];
    for (var i = 0; i <= strA.length; i++) {
      memo[i] = [];
    }
  }

  if (!memo[strA.length] || !memo[strA.length][strB.length]) {
    if (strA.length === 0 || strB.length === 0) {
      memo[strA.length][strB.length] = Math.max(strA.length, strB.length);
    } else {
      memo[strA.length][strB.length] = Math.min(
        stringDistance(strA.slice(0, -1), strB, memo) + 1,
        stringDistance(strA, strB.slice(0, -1), memo) + 1,
        stringDistance(strA.slice(0, -1), strB.slice(0, -1), memo) +
          (strA.slice(-1) === strB.slice(-1) ? 0 : 1)
      );
    }
  }

  return memo[strA.length][strB.length];
}

},{"../config":5,"./flag":16,"./getProperties":22,"./isProxyEnabled":26}],32:[function(require,module,exports){
/*!
 * Chai - test utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var flag = require('./flag');

/**
 * ### .test(object, expression)
 *
 * Test and object for expression.
 *
 * @param {Object} object (constructed Assertion)
 * @param {Arguments} chai.Assertion.prototype.assert arguments
 * @namespace Utils
 * @name test
 */

module.exports = function test(obj, args) {
  var negate = flag(obj, 'negate')
    , expr = args[0];
  return negate ? !expr : expr;
};

},{"./flag":16}],33:[function(require,module,exports){
/*!
 * Chai - transferFlags utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .transferFlags(assertion, object, includeAll = true)
 *
 * Transfer all the flags for `assertion` to `object`. If
 * `includeAll` is set to `false`, then the base Chai
 * assertion flags (namely `object`, `ssfi`, `lockSsfi`,
 * and `message`) will not be transferred.
 *
 *
 *     var newAssertion = new Assertion();
 *     utils.transferFlags(assertion, newAssertion);
 *
 *     var anotherAsseriton = new Assertion(myObj);
 *     utils.transferFlags(assertion, anotherAssertion, false);
 *
 * @param {Assertion} assertion the assertion to transfer the flags from
 * @param {Object} object the object to transfer the flags to; usually a new assertion
 * @param {Boolean} includeAll
 * @namespace Utils
 * @name transferFlags
 * @api private
 */

module.exports = function transferFlags(assertion, object, includeAll) {
  var flags = assertion.__flags || (assertion.__flags = Object.create(null));

  if (!object.__flags) {
    object.__flags = Object.create(null);
  }

  includeAll = arguments.length === 3 ? includeAll : true;

  for (var flag in flags) {
    if (includeAll ||
        (flag !== 'object' && flag !== 'ssfi' && flag !== 'lockSsfi' && flag != 'message')) {
      object.__flags[flag] = flags[flag];
    }
  }
};

},{}],34:[function(require,module,exports){
'use strict';

/* !
 * Chai - checkError utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .checkError
 *
 * Checks that an error conforms to a given set of criteria and/or retrieves information about it.
 *
 * @api public
 */

/**
 * ### .compatibleInstance(thrown, errorLike)
 *
 * Checks if two instances are compatible (strict equal).
 * Returns false if errorLike is not an instance of Error, because instances
 * can only be compatible if they're both error instances.
 *
 * @name compatibleInstance
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleInstance(thrown, errorLike) {
  return errorLike instanceof Error && thrown === errorLike;
}

/**
 * ### .compatibleConstructor(thrown, errorLike)
 *
 * Checks if two constructors are compatible.
 * This function can receive either an error constructor or
 * an error instance as the `errorLike` argument.
 * Constructors are compatible if they're the same or if one is
 * an instance of another.
 *
 * @name compatibleConstructor
 * @param {Error} thrown error
 * @param {Error|ErrorConstructor} errorLike object to compare against
 * @namespace Utils
 * @api public
 */

function compatibleConstructor(thrown, errorLike) {
  if (errorLike instanceof Error) {
    // If `errorLike` is an instance of any error we compare their constructors
    return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
  } else if (errorLike.prototype instanceof Error || errorLike === Error) {
    // If `errorLike` is a constructor that inherits from Error, we compare `thrown` to `errorLike` directly
    return thrown.constructor === errorLike || thrown instanceof errorLike;
  }

  return false;
}

/**
 * ### .compatibleMessage(thrown, errMatcher)
 *
 * Checks if an error's message is compatible with a matcher (String or RegExp).
 * If the message contains the String or passes the RegExp test,
 * it is considered compatible.
 *
 * @name compatibleMessage
 * @param {Error} thrown error
 * @param {String|RegExp} errMatcher to look for into the message
 * @namespace Utils
 * @api public
 */

function compatibleMessage(thrown, errMatcher) {
  var comparisonString = typeof thrown === 'string' ? thrown : thrown.message;
  if (errMatcher instanceof RegExp) {
    return errMatcher.test(comparisonString);
  } else if (typeof errMatcher === 'string') {
    return comparisonString.indexOf(errMatcher) !== -1; // eslint-disable-line no-magic-numbers
  }

  return false;
}

/**
 * ### .getFunctionName(constructorFn)
 *
 * Returns the name of a function.
 * This also includes a polyfill function if `constructorFn.name` is not defined.
 *
 * @name getFunctionName
 * @param {Function} constructorFn
 * @namespace Utils
 * @api private
 */

var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\(\/]+)/;
function getFunctionName(constructorFn) {
  var name = '';
  if (typeof constructorFn.name === 'undefined') {
    // Here we run a polyfill if constructorFn.name is not defined
    var match = String(constructorFn).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    name = constructorFn.name;
  }

  return name;
}

/**
 * ### .getConstructorName(errorLike)
 *
 * Gets the constructor name for an Error instance or constructor itself.
 *
 * @name getConstructorName
 * @param {Error|ErrorConstructor} errorLike
 * @namespace Utils
 * @api public
 */

function getConstructorName(errorLike) {
  var constructorName = errorLike;
  if (errorLike instanceof Error) {
    constructorName = getFunctionName(errorLike.constructor);
  } else if (typeof errorLike === 'function') {
    // If `err` is not an instance of Error it is an error constructor itself or another function.
    // If we've got a common function we get its name, otherwise we may need to create a new instance
    // of the error just in case it's a poorly-constructed error. Please see chaijs/chai/issues/45 to know more.
    constructorName = getFunctionName(errorLike).trim() ||
        getFunctionName(new errorLike()); // eslint-disable-line new-cap
  }

  return constructorName;
}

/**
 * ### .getMessage(errorLike)
 *
 * Gets the error message from an error.
 * If `err` is a String itself, we return it.
 * If the error has no message, we return an empty string.
 *
 * @name getMessage
 * @param {Error|String} errorLike
 * @namespace Utils
 * @api public
 */

function getMessage(errorLike) {
  var msg = '';
  if (errorLike && errorLike.message) {
    msg = errorLike.message;
  } else if (typeof errorLike === 'string') {
    msg = errorLike;
  }

  return msg;
}

module.exports = {
  compatibleInstance: compatibleInstance,
  compatibleConstructor: compatibleConstructor,
  compatibleMessage: compatibleMessage,
  getMessage: getMessage,
  getConstructorName: getConstructorName,
};

},{}],35:[function(require,module,exports){
'use strict';
/* globals Symbol: false, Uint8Array: false, WeakMap: false */
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

var type = require('type-detect');
function FakeMap() {
  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
}

FakeMap.prototype = {
  get: function getMap(key) {
    return key[this._key];
  },
  set: function setMap(key, value) {
    if (Object.isExtensible(key)) {
      Object.defineProperty(key, this._key, {
        value: value,
        configurable: true,
      });
    }
  },
};

var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
/*!
 * Check to see if the MemoizeMap has recorded a result of the two operands
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @returns {Boolean|null} result
*/
function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return null;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    var result = leftHandMap.get(rightHandOperand);
    if (typeof result === 'boolean') {
      return result;
    }
  }
  return null;
}

/*!
 * Set the result of the equality into the MemoizeMap
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @param {Boolean} result
*/
function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    leftHandMap.set(rightHandOperand, result);
  } else {
    leftHandMap = new MemoizeMap();
    leftHandMap.set(rightHandOperand, result);
    memoizeMap.set(leftHandOperand, leftHandMap);
  }
}

/*!
 * Primary Export
 */

module.exports = deepEqual;
module.exports.MemoizeMap = MemoizeMap;

/**
 * Assert deeply nested sameValue equality between two objects of any type.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
 */
function deepEqual(leftHandOperand, rightHandOperand, options) {
  // If we have a comparator, we can't assume anything; so bail to its check first.
  if (options && options.comparator) {
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }

  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
  if (simpleResult !== null) {
    return simpleResult;
  }

  // Deeper comparisons are pushed through to a larger function
  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
}

/**
 * Many comparisons can be canceled out early via simple equality or primitive checks.
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @return {Boolean|null} equal match
 */
function simpleEqual(leftHandOperand, rightHandOperand) {
  // Equal references (except for Numbers) can be returned early
  if (leftHandOperand === rightHandOperand) {
    // Handle +-0 cases
    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
  }

  // handle NaN cases
  if (
    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
  ) {
    return true;
  }

  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
  // strings, and undefined, can be compared by reference.
  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    // Easy out b/c it would have passed the first equality check
    return false;
  }
  return null;
}

/*!
 * The main logic of the `deepEqual` function.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
*/
function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
  options = options || {};
  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
  var comparator = options && options.comparator;

  // Check if a memoized result exists.
  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
  if (memoizeResultLeft !== null) {
    return memoizeResultLeft;
  }
  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
  if (memoizeResultRight !== null) {
    return memoizeResultRight;
  }

  // If a comparator is present, use it.
  if (comparator) {
    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
    // Comparators may return null, in which case we want to go back to default behavior.
    if (comparatorResult === false || comparatorResult === true) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
      return comparatorResult;
    }
    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
    // what to do, we need to make sure to return the basic tests first before we move on.
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      // Don't memoize this, it takes longer to set/retrieve than to just compare.
      return simpleResult;
    }
  }

  var leftHandType = type(leftHandOperand);
  if (leftHandType !== type(rightHandOperand)) {
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
    return false;
  }

  // Temporarily set the operands in the memoize object to prevent blowing the stack
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
  return result;
}

function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
  switch (leftHandType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
    case 'Promise':
    case 'Symbol':
    case 'function':
    case 'WeakMap':
    case 'WeakSet':
    case 'Error':
      return leftHandOperand === rightHandOperand;
    case 'Arguments':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Array':
      return iterableEqual(leftHandOperand, rightHandOperand, options);
    case 'RegExp':
      return regexpEqual(leftHandOperand, rightHandOperand);
    case 'Generator':
      return generatorEqual(leftHandOperand, rightHandOperand, options);
    case 'DataView':
      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
    case 'ArrayBuffer':
      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
    case 'Set':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    case 'Map':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    default:
      return objectEqual(leftHandOperand, rightHandOperand, options);
  }
}

/*!
 * Compare two Regular Expressions for equality.
 *
 * @param {RegExp} leftHandOperand
 * @param {RegExp} rightHandOperand
 * @return {Boolean} result
 */

function regexpEqual(leftHandOperand, rightHandOperand) {
  return leftHandOperand.toString() === rightHandOperand.toString();
}

/*!
 * Compare two Sets/Maps for equality. Faster than other equality functions.
 *
 * @param {Set} leftHandOperand
 * @param {Set} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function entriesEqual(leftHandOperand, rightHandOperand, options) {
  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
  if (leftHandOperand.size !== rightHandOperand.size) {
    return false;
  }
  if (leftHandOperand.size === 0) {
    return true;
  }
  var leftHandItems = [];
  var rightHandItems = [];
  leftHandOperand.forEach(function gatherEntries(key, value) {
    leftHandItems.push([ key, value ]);
  });
  rightHandOperand.forEach(function gatherEntries(key, value) {
    rightHandItems.push([ key, value ]);
  });
  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
}

/*!
 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function iterableEqual(leftHandOperand, rightHandOperand, options) {
  var length = leftHandOperand.length;
  if (length !== rightHandOperand.length) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  var index = -1;
  while (++index < length) {
    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Simple equality for generator objects such as those returned by generator functions.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function generatorEqual(leftHandOperand, rightHandOperand, options) {
  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
}

/*!
 * Determine if the given object has an @@iterator function.
 *
 * @param {Object} target
 * @return {Boolean} `true` if the object has an @@iterator function.
 */
function hasIteratorFunction(target) {
  return typeof Symbol !== 'undefined' &&
    typeof target === 'object' &&
    typeof Symbol.iterator !== 'undefined' &&
    typeof target[Symbol.iterator] === 'function';
}

/*!
 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
 *
 * @param {Object} target
 * @returns {Array} an array of entries from the @@iterator function
 */
function getIteratorEntries(target) {
  if (hasIteratorFunction(target)) {
    try {
      return getGeneratorEntries(target[Symbol.iterator]());
    } catch (iteratorError) {
      return [];
    }
  }
  return [];
}

/*!
 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
 *
 * @param {Generator} target
 * @returns {Array} an array of entries from the Generator.
 */
function getGeneratorEntries(generator) {
  var generatorResult = generator.next();
  var accumulator = [ generatorResult.value ];
  while (generatorResult.done === false) {
    generatorResult = generator.next();
    accumulator.push(generatorResult.value);
  }
  return accumulator;
}

/*!
 * Gets all own and inherited enumerable keys from a target.
 *
 * @param {Object} target
 * @returns {Array} an array of own and inherited enumerable keys from the target.
 */
function getEnumerableKeys(target) {
  var keys = [];
  for (var key in target) {
    keys.push(key);
  }
  return keys;
}

/*!
 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
 * each key. If any value of the given key is not equal, the function will return false (early).
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
  var length = keys.length;
  if (length === 0) {
    return true;
  }
  for (var i = 0; i < length; i += 1) {
    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
 * for each enumerable key in the object.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function objectEqual(leftHandOperand, rightHandOperand, options) {
  var leftHandKeys = getEnumerableKeys(leftHandOperand);
  var rightHandKeys = getEnumerableKeys(rightHandOperand);
  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
    leftHandKeys.sort();
    rightHandKeys.sort();
    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
      return false;
    }
    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
  }

  var leftHandEntries = getIteratorEntries(leftHandOperand);
  var rightHandEntries = getIteratorEntries(rightHandOperand);
  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
    leftHandEntries.sort();
    rightHandEntries.sort();
    return iterableEqual(leftHandEntries, rightHandEntries, options);
  }

  if (leftHandKeys.length === 0 &&
      leftHandEntries.length === 0 &&
      rightHandKeys.length === 0 &&
      rightHandEntries.length === 0) {
    return true;
  }

  return false;
}

/*!
 * Returns true if the argument is a primitive.
 *
 * This intentionally returns true for all objects that can be compared by reference,
 * including functions and symbols.
 *
 * @param {Mixed} value
 * @return {Boolean} result
 */
function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}

},{"type-detect":38}],36:[function(require,module,exports){
'use strict';

/* !
 * Chai - getFuncName utility
 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/**
 * ### .getFuncName(constructorFn)
 *
 * Returns the name of a function.
 * When a non-function instance is passed, returns `null`.
 * This also includes a polyfill function if `aFunc.name` is not defined.
 *
 * @name getFuncName
 * @param {Function} funct
 * @namespace Utils
 * @api public
 */

var toString = Function.prototype.toString;
var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
function getFuncName(aFunc) {
  if (typeof aFunc !== 'function') {
    return null;
  }

  var name = '';
  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
    var match = toString.call(aFunc).match(functionNameMatch);
    if (match) {
      name = match[1];
    }
  } else {
    // If we've got a `name` property we just use it
    name = aFunc.name;
  }

  return name;
}

module.exports = getFuncName;

},{}],37:[function(require,module,exports){
'use strict';

/* !
 * Chai - pathval utility
 * Copyright(c) 2012-2014 Jake Luer <jake@alogicalparadox.com>
 * @see https://github.com/logicalparadox/filtr
 * MIT Licensed
 */

/**
 * ### .hasProperty(object, name)
 *
 * This allows checking whether an object has own
 * or inherited from prototype chain named property.
 *
 * Basically does the same thing as the `in`
 * operator but works properly with null/undefined values
 * and other primitives.
 *
 *     var obj = {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *
 * The following would be the results.
 *
 *     hasProperty(obj, 'str');  // true
 *     hasProperty(obj, 'constructor');  // true
 *     hasProperty(obj, 'bar');  // false
 *
 *     hasProperty(obj.str, 'length'); // true
 *     hasProperty(obj.str, 1);  // true
 *     hasProperty(obj.str, 5);  // false
 *
 *     hasProperty(obj.arr, 'length');  // true
 *     hasProperty(obj.arr, 2);  // true
 *     hasProperty(obj.arr, 3);  // false
 *
 * @param {Object} object
 * @param {String|Symbol} name
 * @returns {Boolean} whether it exists
 * @namespace Utils
 * @name hasProperty
 * @api public
 */

function hasProperty(obj, name) {
  if (typeof obj === 'undefined' || obj === null) {
    return false;
  }

  // The `in` operator does not work with primitives.
  return name in Object(obj);
}

/* !
 * ## parsePath(path)
 *
 * Helper function used to parse string object
 * paths. Use in conjunction with `internalGetPathValue`.
 *
 *      var parsed = parsePath('myobject.property.subprop');
 *
 * ### Paths:
 *
 * * Can be infinitely deep and nested.
 * * Arrays are also valid using the formal `myobject.document[3].property`.
 * * Literal dots and brackets (not delimiter) must be backslash-escaped.
 *
 * @param {String} path
 * @returns {Object} parsed
 * @api private
 */

function parsePath(path) {
  var str = path.replace(/([^\\])\[/g, '$1.[');
  var parts = str.match(/(\\\.|[^.]+?)+/g);
  return parts.map(function mapMatches(value) {
    var regexp = /^\[(\d+)\]$/;
    var mArr = regexp.exec(value);
    var parsed = null;
    if (mArr) {
      parsed = { i: parseFloat(mArr[1]) };
    } else {
      parsed = { p: value.replace(/\\([.\[\]])/g, '$1') };
    }

    return parsed;
  });
}

/* !
 * ## internalGetPathValue(obj, parsed[, pathDepth])
 *
 * Helper companion function for `.parsePath` that returns
 * the value located at the parsed address.
 *
 *      var value = getPathValue(obj, parsed);
 *
 * @param {Object} object to search against
 * @param {Object} parsed definition from `parsePath`.
 * @param {Number} depth (nesting level) of the property we want to retrieve
 * @returns {Object|Undefined} value
 * @api private
 */

function internalGetPathValue(obj, parsed, pathDepth) {
  var temporaryValue = obj;
  var res = null;
  pathDepth = (typeof pathDepth === 'undefined' ? parsed.length : pathDepth);

  for (var i = 0; i < pathDepth; i++) {
    var part = parsed[i];
    if (temporaryValue) {
      if (typeof part.p === 'undefined') {
        temporaryValue = temporaryValue[part.i];
      } else {
        temporaryValue = temporaryValue[part.p];
      }

      if (i === (pathDepth - 1)) {
        res = temporaryValue;
      }
    }
  }

  return res;
}

/* !
 * ## internalSetPathValue(obj, value, parsed)
 *
 * Companion function for `parsePath` that sets
 * the value located at a parsed address.
 *
 *  internalSetPathValue(obj, 'value', parsed);
 *
 * @param {Object} object to search and define on
 * @param {*} value to use upon set
 * @param {Object} parsed definition from `parsePath`
 * @api private
 */

function internalSetPathValue(obj, val, parsed) {
  var tempObj = obj;
  var pathDepth = parsed.length;
  var part = null;
  // Here we iterate through every part of the path
  for (var i = 0; i < pathDepth; i++) {
    var propName = null;
    var propVal = null;
    part = parsed[i];

    // If it's the last part of the path, we set the 'propName' value with the property name
    if (i === (pathDepth - 1)) {
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Now we set the property with the name held by 'propName' on object with the desired val
      tempObj[propName] = val;
    } else if (typeof part.p !== 'undefined' && tempObj[part.p]) {
      tempObj = tempObj[part.p];
    } else if (typeof part.i !== 'undefined' && tempObj[part.i]) {
      tempObj = tempObj[part.i];
    } else {
      // If the obj doesn't have the property we create one with that name to define it
      var next = parsed[i + 1];
      // Here we set the name of the property which will be defined
      propName = typeof part.p === 'undefined' ? part.i : part.p;
      // Here we decide if this property will be an array or a new object
      propVal = typeof next.p === 'undefined' ? [] : {};
      tempObj[propName] = propVal;
      tempObj = tempObj[propName];
    }
  }
}

/**
 * ### .getPathInfo(object, path)
 *
 * This allows the retrieval of property info in an
 * object given a string path.
 *
 * The path info consists of an object with the
 * following properties:
 *
 * * parent - The parent object of the property referenced by `path`
 * * name - The name of the final property, a number if it was an array indexer
 * * value - The value of the property, if it exists, otherwise `undefined`
 * * exists - Whether the property exists or not
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} info
 * @namespace Utils
 * @name getPathInfo
 * @api public
 */

function getPathInfo(obj, path) {
  var parsed = parsePath(path);
  var last = parsed[parsed.length - 1];
  var info = {
    parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
    name: last.p || last.i,
    value: internalGetPathValue(obj, parsed),
  };
  info.exists = hasProperty(info.parent, info.name);

  return info;
}

/**
 * ### .getPathValue(object, path)
 *
 * This allows the retrieval of values in an
 * object given a string path.
 *
 *     var obj = {
 *         prop1: {
 *             arr: ['a', 'b', 'c']
 *           , str: 'Hello'
 *         }
 *       , prop2: {
 *             arr: [ { nested: 'Universe' } ]
 *           , str: 'Hello again!'
 *         }
 *     }
 *
 * The following would be the results.
 *
 *     getPathValue(obj, 'prop1.str'); // Hello
 *     getPathValue(obj, 'prop1.att[2]'); // b
 *     getPathValue(obj, 'prop2.arr[0].nested'); // Universe
 *
 * @param {Object} object
 * @param {String} path
 * @returns {Object} value or `undefined`
 * @namespace Utils
 * @name getPathValue
 * @api public
 */

function getPathValue(obj, path) {
  var info = getPathInfo(obj, path);
  return info.value;
}

/**
 * ### .setPathValue(object, path, value)
 *
 * Define the value in an object at a given string path.
 *
 * ```js
 * var obj = {
 *     prop1: {
 *         arr: ['a', 'b', 'c']
 *       , str: 'Hello'
 *     }
 *   , prop2: {
 *         arr: [ { nested: 'Universe' } ]
 *       , str: 'Hello again!'
 *     }
 * };
 * ```
 *
 * The following would be acceptable.
 *
 * ```js
 * var properties = require('tea-properties');
 * properties.set(obj, 'prop1.str', 'Hello Universe!');
 * properties.set(obj, 'prop1.arr[2]', 'B');
 * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });
 * ```
 *
 * @param {Object} object
 * @param {String} path
 * @param {Mixed} value
 * @api private
 */

function setPathValue(obj, path, val) {
  var parsed = parsePath(path);
  internalSetPathValue(obj, val, parsed);
  return obj;
}

module.exports = {
  hasProperty: hasProperty,
  getPathInfo: getPathInfo,
  getPathValue: getPathValue,
  setPathValue: setPathValue,
};

},{}],38:[function(require,module,exports){
(function (global){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.typeDetect = factory());
}(this, (function () { 'use strict';

/* !
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var promiseExists = typeof Promise === 'function';

/* eslint-disable no-undef */
var globalObject = typeof self === 'object' ? self : global; // eslint-disable-line id-blacklist

var symbolExists = typeof Symbol !== 'undefined';
var mapExists = typeof Map !== 'undefined';
var setExists = typeof Set !== 'undefined';
var weakMapExists = typeof WeakMap !== 'undefined';
var weakSetExists = typeof WeakSet !== 'undefined';
var dataViewExists = typeof DataView !== 'undefined';
var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
var toStringLeftSliceLength = 8;
var toStringRightSliceLength = -1;
/**
 * ### typeOf (obj)
 *
 * Uses `Object.prototype.toString` to determine the type of an object,
 * normalising behaviour across engine versions & well optimised.
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
function typeDetect(obj) {
  /* ! Speed optimisation
   * Pre:
   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
   * Post:
   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
   */
  var typeofObj = typeof obj;
  if (typeofObj !== 'object') {
    return typeofObj;
  }

  /* ! Speed optimisation
   * Pre:
   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
   * Post:
   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
   */
  if (obj === null) {
    return 'null';
  }

  /* ! Spec Conformance
   * Test: `Object.prototype.toString.call(window)``
   *  - Node === "[object global]"
   *  - Chrome === "[object global]"
   *  - Firefox === "[object Window]"
   *  - PhantomJS === "[object Window]"
   *  - Safari === "[object Window]"
   *  - IE 11 === "[object Window]"
   *  - IE Edge === "[object Window]"
   * Test: `Object.prototype.toString.call(this)``
   *  - Chrome Worker === "[object global]"
   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
   *  - IE 11 Worker === "[object WorkerGlobalScope]"
   *  - IE Edge Worker === "[object WorkerGlobalScope]"
   */
  if (obj === globalObject) {
    return 'global';
  }

  /* ! Speed optimisation
   * Pre:
   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
   * Post:
   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
   */
  if (
    Array.isArray(obj) &&
    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
  ) {
    return 'Array';
  }

  // Not caching existence of `window` and related properties due to potential
  // for `window` to be unset before tests in quasi-browser environments.
  if (typeof window === 'object' && window !== null) {
    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
     * WhatWG HTML$7.7.3 - The `Location` interface
     * Test: `Object.prototype.toString.call(window.location)``
     *  - IE <=11 === "[object Object]"
     *  - IE Edge <=13 === "[object Object]"
     */
    if (typeof window.location === 'object' && obj === window.location) {
      return 'Location';
    }

    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/#document)
     * WhatWG HTML$3.1.1 - The `Document` object
     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
     *       which suggests that browsers should use HTMLTableCellElement for
     *       both TD and TH elements. WhatWG separates these.
     *       WhatWG HTML states:
     *         > For historical reasons, Window objects must also have a
     *         > writable, configurable, non-enumerable property named
     *         > HTMLDocument whose value is the Document interface object.
     * Test: `Object.prototype.toString.call(document)``
     *  - Chrome === "[object HTMLDocument]"
     *  - Firefox === "[object HTMLDocument]"
     *  - Safari === "[object HTMLDocument]"
     *  - IE <=10 === "[object Document]"
     *  - IE 11 === "[object HTMLDocument]"
     *  - IE Edge <=13 === "[object HTMLDocument]"
     */
    if (typeof window.document === 'object' && obj === window.document) {
      return 'Document';
    }

    if (typeof window.navigator === 'object') {
      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
       *  - IE <=10 === "[object MSMimeTypesCollection]"
       */
      if (typeof window.navigator.mimeTypes === 'object' &&
          obj === window.navigator.mimeTypes) {
        return 'MimeTypeArray';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
       * Test: `Object.prototype.toString.call(navigator.plugins)``
       *  - IE <=10 === "[object MSPluginsCollection]"
       */
      if (typeof window.navigator.plugins === 'object' &&
          obj === window.navigator.plugins) {
        return 'PluginArray';
      }
    }

    if ((typeof window.HTMLElement === 'function' ||
        typeof window.HTMLElement === 'object') &&
        obj instanceof window.HTMLElement) {
      /* ! Spec Conformance
      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
      *  - IE <=10 === "[object HTMLBlockElement]"
      */
      if (obj.tagName === 'BLOCKQUOTE') {
        return 'HTMLQuoteElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('td'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TD') {
        return 'HTMLTableDataCellElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('th'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TH') {
        return 'HTMLTableHeaderCellElement';
      }
    }
  }

  /* ! Speed optimisation
  * Pre:
  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
  * Post:
  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
  */
  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
  if (typeof stringTag === 'string') {
    return stringTag;
  }

  var objPrototype = Object.getPrototypeOf(obj);
  /* ! Speed optimisation
  * Pre:
  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
  * Post:
  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
  */
  if (objPrototype === RegExp.prototype) {
    return 'RegExp';
  }

  /* ! Speed optimisation
  * Pre:
  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
  * Post:
  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
  */
  if (objPrototype === Date.prototype) {
    return 'Date';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
   * Test: `Object.prototype.toString.call(Promise.resolve())``
   *  - Chrome <=47 === "[object Object]"
   *  - Edge <=20 === "[object Object]"
   *  - Firefox 29-Latest === "[object Promise]"
   *  - Safari 7.1-Latest === "[object Promise]"
   */
  if (promiseExists && objPrototype === Promise.prototype) {
    return 'Promise';
  }

  /* ! Speed optimisation
  * Pre:
  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
  * Post:
  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
  */
  if (setExists && objPrototype === Set.prototype) {
    return 'Set';
  }

  /* ! Speed optimisation
  * Pre:
  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
  * Post:
  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
  */
  if (mapExists && objPrototype === Map.prototype) {
    return 'Map';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
  * Post:
  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
  */
  if (weakSetExists && objPrototype === WeakSet.prototype) {
    return 'WeakSet';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
  * Post:
  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
  */
  if (weakMapExists && objPrototype === WeakMap.prototype) {
    return 'WeakMap';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
   *  - Edge <=13 === "[object Object]"
   */
  if (dataViewExists && objPrototype === DataView.prototype) {
    return 'DataView';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
   * Test: `Object.prototype.toString.call(new Map().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (mapExists && objPrototype === mapIteratorPrototype) {
    return 'Map Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
   * Test: `Object.prototype.toString.call(new Set().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (setExists && objPrototype === setIteratorPrototype) {
    return 'Set Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
    return 'Array Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
    return 'String Iterator';
  }

  /* ! Speed optimisation
  * Pre:
  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
  * Post:
  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
  */
  if (objPrototype === null) {
    return 'Object';
  }

  return Object
    .prototype
    .toString
    .call(obj)
    .slice(toStringLeftSliceLength, toStringRightSliceLength);
}

return typeDetect;

})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],39:[function(require,module,exports){
var assert = require('chai').assert;
mocha.setup('bdd');

var stage = new dala.SVG('#stage');

describe('shapes', function() {
    it('test rect dimensions', function () {
        var r1 = stage.rect().height(30).width(50).translate(10,10);
        assert.ok(r1);
        assert.equal(30, r1.height(), 'rect height without stroke');
        assert.equal(50, r1.width(), 'rect width without stroke');
        assert.deepEqual({x:35, y:25}, r1.getCenter(), 'rect center no scale');
        assert.equal(60, r1.getRightX());
        assert.equal(40, r1.getBottomY());
        r1.stroke('green', 2);
        assert.equal(32, r1.height(true), 'rect height with stroke');
        assert.equal(52, r1.width(true), 'rect width with stroke');
        assert.deepEqual({x:35, y:25}, r1.getCenter(), 'rect center with stroke no scale');
        assert.equal(61, r1.getRightX(true), 'rect right x with stroke no scale');
        assert.equal(41, r1.getBottomY(true), 'rect buttom y with stroke no scale');
        r1.scale(2);
        assert.equal(60, r1.height(), 'rect height with stroke');
        assert.equal(64, r1.height(true), 'rect height with stroke');
        assert.equal(100, r1.width(), 'rect width with stroke');
        assert.equal(104, r1.width(true), 'rect width with stroke');
        assert.deepEqual({x:60, y:40}, r1.getCenter(), 'rect center with stroke scale');
        assert.equal(110, r1.getRightX(), 'rect right x with stroke scale');
        assert.equal(112, r1.getRightX(true), 'rect right x with stroke scale');

        stage.helper().point('rcenter', r1.getCenter(), 'red',true);
        stage.helper().point('rleftTopNoStr', r1.position(), 'red',true);
        stage.helper().point('rleftTopStr', r1.position(true), 'yellow',true);
        stage.helper().point('rrightTopNoStr', r1.topRight(), 'red',true);
        stage.helper().point('rrightTopStr', r1.topRight(true), 'yellow',true);
        stage.helper().point('rrightBotNoStr', r1.bottomRight(), 'red',true);
        stage.helper().point('rrightBotStr', r1.bottomRight(true), 'yellow',true);
        stage.helper().point('rleftBotNoStr', r1.bottomLeft(), 'red',true);
        stage.helper().point('rleftBotStr', r1.bottomLeft(true), 'yellow',true);

        //assert.equal(42, r1.getBottomY(true), 'rect buttom y with stroke no scale');
    });

    it('test circle dimensions', function () {
        var c1 = stage.circle().r(25);
        assert.ok(c1);
        assert.equal(50, c1.height(), 'circle height without stroke');
        assert.equal(50, c1.width(), 'circle width without stroke');
        assert.equal(25, c1.r(), 'circle r without stroke');
        assert.equal(25, c1.r(true), 'circle r without stroke');
        c1.stroke('green', 2);
        c1.move(200,35);
        assert.equal(25, c1.r(), 'circle r with stroke');
        assert.equal(26, c1.r(true), 'circle r with stroke');
        assert.equal(50, c1.height(), 'circle height with');
        assert.equal(52, c1.height(true), 'circle height with stroke');
        assert.equal(50, c1.width(), 'circle width');
        assert.equal(52, c1.width(true), 'circle width with stroke');
        assert.deepEqual({x:200,y:35}, c1.getCenter(), 'circle center no scale');
        c1.scale(2);
        assert.deepEqual({x:200,y:35}, c1.getCenter(), 'circle center no scale');
        assert.equal(50, c1.r(), 'circle r with strokeand scale');
        assert.equal(52, c1.r(true), 'circle r with stroke and scale');
        assert.equal(100, c1.height(), 'circle height stroke and scale');
        assert.equal(104, c1.height(true), 'circle height and scale');
        assert.equal(100, c1.width(), 'circle width and scale');
        assert.equal(104, c1.width(true), 'circle width and scale');
        c1.move(0,20);

        //TODO: position with and without stroke
        stage.helper().point('ccenter', c1.getCenter(), 'red',true);
    });

    it('test scale', function () {
        var r2 = stage.rect().height(2).width(10);
        r2.scale(1.2, 1);
        assert.equal(12, r2.width());
        var ratio = 1 / 10;
        var newScale = 1.2 + ratio;
        r2.scale(newScale, 1);
        assert.equal(13, r2.width());
        r2.remove();
    });

    it('test append element', function () {
        var g = stage.g();
        var rect = g.append(stage.rect({id:'innerRect'}).height(500).width(500));
        assert.equal(1, g.$().children('#innerRect').length);
        assert.ok(rect);
        g.remove();
    });

});

mocha.run();

},{"chai":2}]},{},[39])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0aW9uLWVycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL2Fzc2VydGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL2NvbmZpZy5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL2NvcmUvYXNzZXJ0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL2ludGVyZmFjZS9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS9pbnRlcmZhY2UvZXhwZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvaW50ZXJmYWNlL3Nob3VsZC5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL3V0aWxzL2FkZENoYWluYWJsZU1ldGhvZC5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL3V0aWxzL2FkZExlbmd0aEd1YXJkLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvYWRkTWV0aG9kLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvYWRkUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9jb21wYXJlQnlJbnNwZWN0LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvZXhwZWN0VHlwZXMuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9mbGFnLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvZ2V0QWN0dWFsLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvZ2V0RW51bWVyYWJsZVByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9nZXRNZXNzYWdlLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvZ2V0T3duRW51bWVyYWJsZVByb3BlcnRpZXMuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9nZXRPd25FbnVtZXJhYmxlUHJvcGVydHlTeW1ib2xzLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvZ2V0UHJvcGVydGllcy5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL3V0aWxzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvaW5zcGVjdC5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL3V0aWxzL2lzTmFOLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvaXNQcm94eUVuYWJsZWQuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9vYmpEaXNwbGF5LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvb3ZlcndyaXRlQ2hhaW5hYmxlTWV0aG9kLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvb3ZlcndyaXRlTWV0aG9kLmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvb3ZlcndyaXRlUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvY2hhaS9saWIvY2hhaS91dGlscy9wcm94aWZ5LmpzIiwibm9kZV9tb2R1bGVzL2NoYWkvbGliL2NoYWkvdXRpbHMvdGVzdC5qcyIsIm5vZGVfbW9kdWxlcy9jaGFpL2xpYi9jaGFpL3V0aWxzL3RyYW5zZmVyRmxhZ3MuanMiLCJub2RlX21vZHVsZXMvY2hlY2stZXJyb3IvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVlcC1lcWwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2V0LWZ1bmMtbmFtZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXRodmFsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R5cGUtZGV0ZWN0L3R5cGUtZGV0ZWN0LmpzIiwidGVzdC90ZXN0LnN2Zy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25TQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKiFcbiAqIGFzc2VydGlvbi1lcnJvclxuICogQ29weXJpZ2h0KGMpIDIwMTMgSmFrZSBMdWVyIDxqYWtlQHF1YWxpYW5jeS5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKiFcbiAqIFJldHVybiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBjb3B5IHByb3BlcnRpZXMgZnJvbVxuICogb25lIG9iamVjdCB0byBhbm90aGVyIGV4Y2x1ZGluZyBhbnkgb3JpZ2luYWxseVxuICogbGlzdGVkLiBSZXR1cm5lZCBmdW5jdGlvbiB3aWxsIGNyZWF0ZSBhIG5ldyBge31gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBleGNsdWRlZCBwcm9wZXJ0aWVzIC4uLlxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cblxuZnVuY3Rpb24gZXhjbHVkZSAoKSB7XG4gIHZhciBleGNsdWRlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICBmdW5jdGlvbiBleGNsdWRlUHJvcHMgKHJlcywgb2JqKSB7XG4gICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGlmICghfmV4Y2x1ZGVzLmluZGV4T2Yoa2V5KSkgcmVzW2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBleHRlbmRFeGNsdWRlICgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICAgLCBpID0gMFxuICAgICAgLCByZXMgPSB7fTtcblxuICAgIGZvciAoOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgZXhjbHVkZVByb3BzKHJlcywgYXJnc1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbiAgfTtcbn07XG5cbi8qIVxuICogUHJpbWFyeSBFeHBvcnRzXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBBc3NlcnRpb25FcnJvcjtcblxuLyoqXG4gKiAjIyMgQXNzZXJ0aW9uRXJyb3JcbiAqXG4gKiBBbiBleHRlbnNpb24gb2YgdGhlIEphdmFTY3JpcHQgYEVycm9yYCBjb25zdHJ1Y3RvciBmb3JcbiAqIGFzc2VydGlvbiBhbmQgdmFsaWRhdGlvbiBzY2VuYXJpb3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7T2JqZWN0fSBwcm9wZXJ0aWVzIHRvIGluY2x1ZGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtjYWxsZWV9IHN0YXJ0IHN0YWNrIGZ1bmN0aW9uIChvcHRpb25hbClcbiAqL1xuXG5mdW5jdGlvbiBBc3NlcnRpb25FcnJvciAobWVzc2FnZSwgX3Byb3BzLCBzc2YpIHtcbiAgdmFyIGV4dGVuZCA9IGV4Y2x1ZGUoJ25hbWUnLCAnbWVzc2FnZScsICdzdGFjaycsICdjb25zdHJ1Y3RvcicsICd0b0pTT04nKVxuICAgICwgcHJvcHMgPSBleHRlbmQoX3Byb3BzIHx8IHt9KTtcblxuICAvLyBkZWZhdWx0IHZhbHVlc1xuICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8ICdVbnNwZWNpZmllZCBBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuc2hvd0RpZmYgPSBmYWxzZTtcblxuICAvLyBjb3B5IGZyb20gcHJvcGVydGllc1xuICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICB0aGlzW2tleV0gPSBwcm9wc1trZXldO1xuICB9XG5cbiAgLy8gY2FwdHVyZSBzdGFjayB0cmFjZVxuICBzc2YgPSBzc2YgfHwgQXNzZXJ0aW9uRXJyb3I7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHNzZik7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgdGhpcy5zdGFjayA9IGUuc3RhY2s7XG4gICAgfVxuICB9XG59XG5cbi8qIVxuICogSW5oZXJpdCBmcm9tIEVycm9yLnByb3RvdHlwZVxuICovXG5cbkFzc2VydGlvbkVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcblxuLyohXG4gKiBTdGF0aWNhbGx5IHNldCBuYW1lXG4gKi9cblxuQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuXG4vKiFcbiAqIEVuc3VyZSBjb3JyZWN0IGNvbnN0cnVjdG9yXG4gKi9cblxuQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQXNzZXJ0aW9uRXJyb3I7XG5cbi8qKlxuICogQWxsb3cgZXJyb3JzIHRvIGJlIGNvbnZlcnRlZCB0byBKU09OIGZvciBzdGF0aWMgdHJhbnNmZXIuXG4gKlxuICogQHBhcmFtIHtCb29sZWFufSBpbmNsdWRlIHN0YWNrIChkZWZhdWx0OiBgdHJ1ZWApXG4gKiBAcmV0dXJuIHtPYmplY3R9IG9iamVjdCB0aGF0IGNhbiBiZSBgSlNPTi5zdHJpbmdpZnlgXG4gKi9cblxuQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChzdGFjaykge1xuICB2YXIgZXh0ZW5kID0gZXhjbHVkZSgnY29uc3RydWN0b3InLCAndG9KU09OJywgJ3N0YWNrJylcbiAgICAsIHByb3BzID0gZXh0ZW5kKHsgbmFtZTogdGhpcy5uYW1lIH0sIHRoaXMpO1xuXG4gIC8vIGluY2x1ZGUgc3RhY2sgaWYgZXhpc3RzIGFuZCBub3QgdHVybmVkIG9mZlxuICBpZiAoZmFsc2UgIT09IHN0YWNrICYmIHRoaXMuc3RhY2spIHtcbiAgICBwcm9wcy5zdGFjayA9IHRoaXMuc3RhY2s7XG4gIH1cblxuICByZXR1cm4gcHJvcHM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9jaGFpJyk7XG4iLCIvKiFcbiAqIGNoYWlcbiAqIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG52YXIgdXNlZCA9IFtdO1xuXG4vKiFcbiAqIENoYWkgdmVyc2lvblxuICovXG5cbmV4cG9ydHMudmVyc2lvbiA9ICc0LjEuMic7XG5cbi8qIVxuICogQXNzZXJ0aW9uIEVycm9yXG4gKi9cblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IHJlcXVpcmUoJ2Fzc2VydGlvbi1lcnJvcicpO1xuXG4vKiFcbiAqIFV0aWxzIGZvciBwbHVnaW5zIChub3QgZXhwb3J0ZWQpXG4gKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL2NoYWkvdXRpbHMnKTtcblxuLyoqXG4gKiAjIC51c2UoZnVuY3Rpb24pXG4gKlxuICogUHJvdmlkZXMgYSB3YXkgdG8gZXh0ZW5kIHRoZSBpbnRlcm5hbHMgb2YgQ2hhaS5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufVxuICogQHJldHVybnMge3RoaXN9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnRzLnVzZSA9IGZ1bmN0aW9uIChmbikge1xuICBpZiAoIX51c2VkLmluZGV4T2YoZm4pKSB7XG4gICAgZm4oZXhwb3J0cywgdXRpbCk7XG4gICAgdXNlZC5wdXNoKGZuKTtcbiAgfVxuXG4gIHJldHVybiBleHBvcnRzO1xufTtcblxuLyohXG4gKiBVdGlsaXR5IEZ1bmN0aW9uc1xuICovXG5cbmV4cG9ydHMudXRpbCA9IHV0aWw7XG5cbi8qIVxuICogQ29uZmlndXJhdGlvblxuICovXG5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NoYWkvY29uZmlnJyk7XG5leHBvcnRzLmNvbmZpZyA9IGNvbmZpZztcblxuLyohXG4gKiBQcmltYXJ5IGBBc3NlcnRpb25gIHByb3RvdHlwZVxuICovXG5cbnZhciBhc3NlcnRpb24gPSByZXF1aXJlKCcuL2NoYWkvYXNzZXJ0aW9uJyk7XG5leHBvcnRzLnVzZShhc3NlcnRpb24pO1xuXG4vKiFcbiAqIENvcmUgQXNzZXJ0aW9uc1xuICovXG5cbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jaGFpL2NvcmUvYXNzZXJ0aW9ucycpO1xuZXhwb3J0cy51c2UoY29yZSk7XG5cbi8qIVxuICogRXhwZWN0IGludGVyZmFjZVxuICovXG5cbnZhciBleHBlY3QgPSByZXF1aXJlKCcuL2NoYWkvaW50ZXJmYWNlL2V4cGVjdCcpO1xuZXhwb3J0cy51c2UoZXhwZWN0KTtcblxuLyohXG4gKiBTaG91bGQgaW50ZXJmYWNlXG4gKi9cblxudmFyIHNob3VsZCA9IHJlcXVpcmUoJy4vY2hhaS9pbnRlcmZhY2Uvc2hvdWxkJyk7XG5leHBvcnRzLnVzZShzaG91bGQpO1xuXG4vKiFcbiAqIEFzc2VydCBpbnRlcmZhY2VcbiAqL1xuXG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnLi9jaGFpL2ludGVyZmFjZS9hc3NlcnQnKTtcbmV4cG9ydHMudXNlKGFzc2VydCk7XG4iLCIvKiFcbiAqIGNoYWlcbiAqIGh0dHA6Ly9jaGFpanMuY29tXG4gKiBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKF9jaGFpLCB1dGlsKSB7XG4gIC8qIVxuICAgKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICAgKi9cblxuICB2YXIgQXNzZXJ0aW9uRXJyb3IgPSBfY2hhaS5Bc3NlcnRpb25FcnJvclxuICAgICwgZmxhZyA9IHV0aWwuZmxhZztcblxuICAvKiFcbiAgICogTW9kdWxlIGV4cG9ydC5cbiAgICovXG5cbiAgX2NoYWkuQXNzZXJ0aW9uID0gQXNzZXJ0aW9uO1xuXG4gIC8qIVxuICAgKiBBc3NlcnRpb24gQ29uc3RydWN0b3JcbiAgICpcbiAgICogQ3JlYXRlcyBvYmplY3QgZm9yIGNoYWluaW5nLlxuICAgKlxuICAgKiBgQXNzZXJ0aW9uYCBvYmplY3RzIGNvbnRhaW4gbWV0YWRhdGEgaW4gdGhlIGZvcm0gb2YgZmxhZ3MuIFRocmVlIGZsYWdzIGNhblxuICAgKiBiZSBhc3NpZ25lZCBkdXJpbmcgaW5zdGFudGlhdGlvbiBieSBwYXNzaW5nIGFyZ3VtZW50cyB0byB0aGlzIGNvbnN0cnVjdG9yOlxuICAgKlxuICAgKiAtIGBvYmplY3RgOiBUaGlzIGZsYWcgY29udGFpbnMgdGhlIHRhcmdldCBvZiB0aGUgYXNzZXJ0aW9uLiBGb3IgZXhhbXBsZSwgaW5cbiAgICogICB0aGUgYXNzZXJ0aW9uIGBleHBlY3QobnVtS2l0dGVucykudG8uZXF1YWwoNyk7YCwgdGhlIGBvYmplY3RgIGZsYWcgd2lsbFxuICAgKiAgIGNvbnRhaW4gYG51bUtpdHRlbnNgIHNvIHRoYXQgdGhlIGBlcXVhbGAgYXNzZXJ0aW9uIGNhbiByZWZlcmVuY2UgaXQgd2hlblxuICAgKiAgIG5lZWRlZC5cbiAgICpcbiAgICogLSBgbWVzc2FnZWA6IFRoaXMgZmxhZyBjb250YWlucyBhbiBvcHRpb25hbCBjdXN0b20gZXJyb3IgbWVzc2FnZSB0byBiZVxuICAgKiAgIHByZXBlbmRlZCB0byB0aGUgZXJyb3IgbWVzc2FnZSB0aGF0J3MgZ2VuZXJhdGVkIGJ5IHRoZSBhc3NlcnRpb24gd2hlbiBpdFxuICAgKiAgIGZhaWxzLlxuICAgKlxuICAgKiAtIGBzc2ZpYDogVGhpcyBmbGFnIHN0YW5kcyBmb3IgXCJzdGFydCBzdGFjayBmdW5jdGlvbiBpbmRpY2F0b3JcIi4gSXRcbiAgICogICBjb250YWlucyBhIGZ1bmN0aW9uIHJlZmVyZW5jZSB0aGF0IHNlcnZlcyBhcyB0aGUgc3RhcnRpbmcgcG9pbnQgZm9yXG4gICAqICAgcmVtb3ZpbmcgZnJhbWVzIGZyb20gdGhlIHN0YWNrIHRyYWNlIG9mIHRoZSBlcnJvciB0aGF0J3MgY3JlYXRlZCBieSB0aGVcbiAgICogICBhc3NlcnRpb24gd2hlbiBpdCBmYWlscy4gVGhlIGdvYWwgaXMgdG8gcHJvdmlkZSBhIGNsZWFuZXIgc3RhY2sgdHJhY2UgdG9cbiAgICogICBlbmQgdXNlcnMgYnkgcmVtb3ZpbmcgQ2hhaSdzIGludGVybmFsIGZ1bmN0aW9ucy4gTm90ZSB0aGF0IGl0IG9ubHkgd29ya3NcbiAgICogICBpbiBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAsIGFuZCBvbmx5IHdoZW5cbiAgICogICBgQ2hhaS5jb25maWcuaW5jbHVkZVN0YWNrYCBoYXNuJ3QgYmVlbiBzZXQgdG8gYGZhbHNlYC5cbiAgICpcbiAgICogLSBgbG9ja1NzZmlgOiBUaGlzIGZsYWcgY29udHJvbHMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIGBzc2ZpYCBmbGFnXG4gICAqICAgc2hvdWxkIHJldGFpbiBpdHMgY3VycmVudCB2YWx1ZSwgZXZlbiBhcyBhc3NlcnRpb25zIGFyZSBjaGFpbmVkIG9mZiBvZlxuICAgKiAgIHRoaXMgb2JqZWN0LiBUaGlzIGlzIHVzdWFsbHkgc2V0IHRvIGB0cnVlYCB3aGVuIGNyZWF0aW5nIGEgbmV3IGFzc2VydGlvblxuICAgKiAgIGZyb20gd2l0aGluIGFub3RoZXIgYXNzZXJ0aW9uLiBJdCdzIGFsc28gdGVtcG9yYXJpbHkgc2V0IHRvIGB0cnVlYCBiZWZvcmVcbiAgICogICBhbiBvdmVyd3JpdHRlbiBhc3NlcnRpb24gZ2V0cyBjYWxsZWQgYnkgdGhlIG92ZXJ3cml0aW5nIGFzc2VydGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqIHRhcmdldCBvZiB0aGUgYXNzZXJ0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgKG9wdGlvbmFsKSBjdXN0b20gZXJyb3IgbWVzc2FnZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzc2ZpIChvcHRpb25hbCkgc3RhcnRpbmcgcG9pbnQgZm9yIHJlbW92aW5nIHN0YWNrIGZyYW1lc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGxvY2tTc2ZpIChvcHRpb25hbCkgd2hldGhlciBvciBub3QgdGhlIHNzZmkgZmxhZyBpcyBsb2NrZWRcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIEFzc2VydGlvbiAob2JqLCBtc2csIHNzZmksIGxvY2tTc2ZpKSB7XG4gICAgZmxhZyh0aGlzLCAnc3NmaScsIHNzZmkgfHwgQXNzZXJ0aW9uKTtcbiAgICBmbGFnKHRoaXMsICdsb2NrU3NmaScsIGxvY2tTc2ZpKTtcbiAgICBmbGFnKHRoaXMsICdvYmplY3QnLCBvYmopO1xuICAgIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuXG4gICAgcmV0dXJuIHV0aWwucHJveGlmeSh0aGlzKTtcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb24sICdpbmNsdWRlU3RhY2snLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXNzZXJ0aW9uLmluY2x1ZGVTdGFjayBpcyBkZXByZWNhdGVkLCB1c2UgY2hhaS5jb25maWcuaW5jbHVkZVN0YWNrIGluc3RlYWQuJyk7XG4gICAgICByZXR1cm4gY29uZmlnLmluY2x1ZGVTdGFjaztcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXNzZXJ0aW9uLmluY2x1ZGVTdGFjayBpcyBkZXByZWNhdGVkLCB1c2UgY2hhaS5jb25maWcuaW5jbHVkZVN0YWNrIGluc3RlYWQuJyk7XG4gICAgICBjb25maWcuaW5jbHVkZVN0YWNrID0gdmFsdWU7XG4gICAgfVxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uLCAnc2hvd0RpZmYnLCB7XG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXNzZXJ0aW9uLnNob3dEaWZmIGlzIGRlcHJlY2F0ZWQsIHVzZSBjaGFpLmNvbmZpZy5zaG93RGlmZiBpbnN0ZWFkLicpO1xuICAgICAgcmV0dXJuIGNvbmZpZy5zaG93RGlmZjtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGNvbnNvbGUud2FybignQXNzZXJ0aW9uLnNob3dEaWZmIGlzIGRlcHJlY2F0ZWQsIHVzZSBjaGFpLmNvbmZpZy5zaG93RGlmZiBpbnN0ZWFkLicpO1xuICAgICAgY29uZmlnLnNob3dEaWZmID0gdmFsdWU7XG4gICAgfVxuICB9KTtcblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkgPSBmdW5jdGlvbiAobmFtZSwgZm4pIHtcbiAgICB1dGlsLmFkZFByb3BlcnR5KHRoaXMucHJvdG90eXBlLCBuYW1lLCBmbik7XG4gIH07XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBmbikge1xuICAgIHV0aWwuYWRkTWV0aG9kKHRoaXMucHJvdG90eXBlLCBuYW1lLCBmbik7XG4gIH07XG5cbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCA9IGZ1bmN0aW9uIChuYW1lLCBmbiwgY2hhaW5pbmdCZWhhdmlvcikge1xuICAgIHV0aWwuYWRkQ2hhaW5hYmxlTWV0aG9kKHRoaXMucHJvdG90eXBlLCBuYW1lLCBmbiwgY2hhaW5pbmdCZWhhdmlvcik7XG4gIH07XG5cbiAgQXNzZXJ0aW9uLm92ZXJ3cml0ZVByb3BlcnR5ID0gZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgdXRpbC5vdmVyd3JpdGVQcm9wZXJ0eSh0aGlzLnByb3RvdHlwZSwgbmFtZSwgZm4pO1xuICB9O1xuXG4gIEFzc2VydGlvbi5vdmVyd3JpdGVNZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgZm4pIHtcbiAgICB1dGlsLm92ZXJ3cml0ZU1ldGhvZCh0aGlzLnByb3RvdHlwZSwgbmFtZSwgZm4pO1xuICB9O1xuXG4gIEFzc2VydGlvbi5vdmVyd3JpdGVDaGFpbmFibGVNZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgZm4sIGNoYWluaW5nQmVoYXZpb3IpIHtcbiAgICB1dGlsLm92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZCh0aGlzLnByb3RvdHlwZSwgbmFtZSwgZm4sIGNoYWluaW5nQmVoYXZpb3IpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmFzc2VydChleHByZXNzaW9uLCBtZXNzYWdlLCBuZWdhdGVNZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsLCBzaG93RGlmZilcbiAgICpcbiAgICogRXhlY3V0ZXMgYW4gZXhwcmVzc2lvbiBhbmQgY2hlY2sgZXhwZWN0YXRpb25zLiBUaHJvd3MgQXNzZXJ0aW9uRXJyb3IgZm9yIHJlcG9ydGluZyBpZiB0ZXN0IGRvZXNuJ3QgcGFzcy5cbiAgICpcbiAgICogQG5hbWUgYXNzZXJ0XG4gICAqIEBwYXJhbSB7UGhpbG9zb3BoaWNhbH0gZXhwcmVzc2lvbiB0byBiZSB0ZXN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IG1lc3NhZ2Ugb3IgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG1lc3NhZ2UgdG8gZGlzcGxheSBpZiBleHByZXNzaW9uIGZhaWxzXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBuZWdhdGVkTWVzc2FnZSBvciBmdW5jdGlvbiB0aGF0IHJldHVybnMgbmVnYXRlZE1lc3NhZ2UgdG8gZGlzcGxheSBpZiBuZWdhdGVkIGV4cHJlc3Npb24gZmFpbHNcbiAgICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWQgdmFsdWUgKHJlbWVtYmVyIHRvIGNoZWNrIGZvciBuZWdhdGlvbilcbiAgICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsIChvcHRpb25hbCkgd2lsbCBkZWZhdWx0IHRvIGB0aGlzLm9iamBcbiAgICogQHBhcmFtIHtCb29sZWFufSBzaG93RGlmZiAob3B0aW9uYWwpIHdoZW4gc2V0IHRvIGB0cnVlYCwgYXNzZXJ0IHdpbGwgZGlzcGxheSBhIGRpZmYgaW4gYWRkaXRpb24gdG8gdGhlIG1lc3NhZ2UgaWYgZXhwcmVzc2lvbiBmYWlsc1xuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgQXNzZXJ0aW9uLnByb3RvdHlwZS5hc3NlcnQgPSBmdW5jdGlvbiAoZXhwciwgbXNnLCBuZWdhdGVNc2csIGV4cGVjdGVkLCBfYWN0dWFsLCBzaG93RGlmZikge1xuICAgIHZhciBvayA9IHV0aWwudGVzdCh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChmYWxzZSAhPT0gc2hvd0RpZmYpIHNob3dEaWZmID0gdHJ1ZTtcbiAgICBpZiAodW5kZWZpbmVkID09PSBleHBlY3RlZCAmJiB1bmRlZmluZWQgPT09IF9hY3R1YWwpIHNob3dEaWZmID0gZmFsc2U7XG4gICAgaWYgKHRydWUgIT09IGNvbmZpZy5zaG93RGlmZikgc2hvd0RpZmYgPSBmYWxzZTtcblxuICAgIGlmICghb2spIHtcbiAgICAgIG1zZyA9IHV0aWwuZ2V0TWVzc2FnZSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgdmFyIGFjdHVhbCA9IHV0aWwuZ2V0QWN0dWFsKHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnLCB7XG4gICAgICAgICAgYWN0dWFsOiBhY3R1YWxcbiAgICAgICAgLCBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgLCBzaG93RGlmZjogc2hvd0RpZmZcbiAgICAgIH0sIChjb25maWcuaW5jbHVkZVN0YWNrKSA/IHRoaXMuYXNzZXJ0IDogZmxhZyh0aGlzLCAnc3NmaScpKTtcbiAgICB9XG4gIH07XG5cbiAgLyohXG4gICAqICMjIyAuX29ialxuICAgKlxuICAgKiBRdWljayByZWZlcmVuY2UgdG8gc3RvcmVkIGBhY3R1YWxgIHZhbHVlIGZvciBwbHVnaW4gZGV2ZWxvcGVycy5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb24ucHJvdG90eXBlLCAnX29iaicsXG4gICAgeyBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZsYWcodGhpcywgJ29iamVjdCcpO1xuICAgICAgfVxuICAgICwgc2V0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIGZsYWcodGhpcywgJ29iamVjdCcsIHZhbCk7XG4gICAgICB9XG4gIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIC8qKlxuICAgKiAjIyMgY29uZmlnLmluY2x1ZGVTdGFja1xuICAgKlxuICAgKiBVc2VyIGNvbmZpZ3VyYWJsZSBwcm9wZXJ0eSwgaW5mbHVlbmNlcyB3aGV0aGVyIHN0YWNrIHRyYWNlXG4gICAqIGlzIGluY2x1ZGVkIGluIEFzc2VydGlvbiBlcnJvciBtZXNzYWdlLiBEZWZhdWx0IG9mIGZhbHNlXG4gICAqIHN1cHByZXNzZXMgc3RhY2sgdHJhY2UgaW4gdGhlIGVycm9yIG1lc3NhZ2UuXG4gICAqXG4gICAqICAgICBjaGFpLmNvbmZpZy5pbmNsdWRlU3RhY2sgPSB0cnVlOyAgLy8gZW5hYmxlIHN0YWNrIG9uIGVycm9yXG4gICAqXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgaW5jbHVkZVN0YWNrOiBmYWxzZSxcblxuICAvKipcbiAgICogIyMjIGNvbmZpZy5zaG93RGlmZlxuICAgKlxuICAgKiBVc2VyIGNvbmZpZ3VyYWJsZSBwcm9wZXJ0eSwgaW5mbHVlbmNlcyB3aGV0aGVyIG9yIG5vdFxuICAgKiB0aGUgYHNob3dEaWZmYCBmbGFnIHNob3VsZCBiZSBpbmNsdWRlZCBpbiB0aGUgdGhyb3duXG4gICAqIEFzc2VydGlvbkVycm9ycy4gYGZhbHNlYCB3aWxsIGFsd2F5cyBiZSBgZmFsc2VgOyBgdHJ1ZWBcbiAgICogd2lsbCBiZSB0cnVlIHdoZW4gdGhlIGFzc2VydGlvbiBoYXMgcmVxdWVzdGVkIGEgZGlmZlxuICAgKiBiZSBzaG93bi5cbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBzaG93RGlmZjogdHJ1ZSxcblxuICAvKipcbiAgICogIyMjIGNvbmZpZy50cnVuY2F0ZVRocmVzaG9sZFxuICAgKlxuICAgKiBVc2VyIGNvbmZpZ3VyYWJsZSBwcm9wZXJ0eSwgc2V0cyBsZW5ndGggdGhyZXNob2xkIGZvciBhY3R1YWwgYW5kXG4gICAqIGV4cGVjdGVkIHZhbHVlcyBpbiBhc3NlcnRpb24gZXJyb3JzLiBJZiB0aGlzIHRocmVzaG9sZCBpcyBleGNlZWRlZCwgZm9yXG4gICAqIGV4YW1wbGUgZm9yIGxhcmdlIGRhdGEgc3RydWN0dXJlcywgdGhlIHZhbHVlIGlzIHJlcGxhY2VkIHdpdGggc29tZXRoaW5nXG4gICAqIGxpa2UgYFsgQXJyYXkoMykgXWAgb3IgYHsgT2JqZWN0IChwcm9wMSwgcHJvcDIpIH1gLlxuICAgKlxuICAgKiBTZXQgaXQgdG8gemVybyBpZiB5b3Ugd2FudCB0byBkaXNhYmxlIHRydW5jYXRpbmcgYWx0b2dldGhlci5cbiAgICpcbiAgICogVGhpcyBpcyBlc3BlY2lhbGx5IHVzZXJmdWwgd2hlbiBkb2luZyBhc3NlcnRpb25zIG9uIGFycmF5czogaGF2aW5nIHRoaXNcbiAgICogc2V0IHRvIGEgcmVhc29uYWJsZSBsYXJnZSB2YWx1ZSBtYWtlcyB0aGUgZmFpbHVyZSBtZXNzYWdlcyByZWFkaWx5XG4gICAqIGluc3BlY3RhYmxlLlxuICAgKlxuICAgKiAgICAgY2hhaS5jb25maWcudHJ1bmNhdGVUaHJlc2hvbGQgPSAwOyAgLy8gZGlzYWJsZSB0cnVuY2F0aW5nXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICB0cnVuY2F0ZVRocmVzaG9sZDogNDAsXG5cbiAgLyoqXG4gICAqICMjIyBjb25maWcudXNlUHJveHlcbiAgICpcbiAgICogVXNlciBjb25maWd1cmFibGUgcHJvcGVydHksIGRlZmluZXMgaWYgY2hhaSB3aWxsIHVzZSBhIFByb3h5IHRvIHRocm93XG4gICAqIGFuIGVycm9yIHdoZW4gYSBub24tZXhpc3RlbnQgcHJvcGVydHkgaXMgcmVhZCwgd2hpY2ggcHJvdGVjdHMgdXNlcnNcbiAgICogZnJvbSB0eXBvcyB3aGVuIHVzaW5nIHByb3BlcnR5LWJhc2VkIGFzc2VydGlvbnMuXG4gICAqXG4gICAqIFNldCBpdCB0byBmYWxzZSBpZiB5b3Ugd2FudCB0byBkaXNhYmxlIHRoaXMgZmVhdHVyZS5cbiAgICpcbiAgICogICAgIGNoYWkuY29uZmlnLnVzZVByb3h5ID0gZmFsc2U7ICAvLyBkaXNhYmxlIHVzZSBvZiBQcm94eVxuICAgKlxuICAgKiBUaGlzIGZlYXR1cmUgaXMgYXV0b21hdGljYWxseSBkaXNhYmxlZCByZWdhcmRsZXNzIG9mIHRoaXMgY29uZmlnIHZhbHVlXG4gICAqIGluIGVudmlyb25tZW50cyB0aGF0IGRvbid0IHN1cHBvcnQgcHJveGllcy5cbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICB1c2VQcm94eTogdHJ1ZSxcblxuICAvKipcbiAgICogIyMjIGNvbmZpZy5wcm94eUV4Y2x1ZGVkS2V5c1xuICAgKlxuICAgKiBVc2VyIGNvbmZpZ3VyYWJsZSBwcm9wZXJ0eSwgZGVmaW5lcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBpZ25vcmVkXG4gICAqIGluc3RlYWQgb2YgdGhyb3dpbmcgYW4gZXJyb3IgaWYgdGhleSBkbyBub3QgZXhpc3Qgb24gdGhlIGFzc2VydGlvbi5cbiAgICogVGhpcyBpcyBvbmx5IGFwcGxpZWQgaWYgdGhlIGVudmlyb25tZW50IENoYWkgaXMgcnVubmluZyBpbiBzdXBwb3J0cyBwcm94aWVzIGFuZFxuICAgKiBpZiB0aGUgYHVzZVByb3h5YCBjb25maWd1cmF0aW9uIHNldHRpbmcgaXMgZW5hYmxlZC5cbiAgICogQnkgZGVmYXVsdCwgYHRoZW5gIGFuZCBgaW5zcGVjdGAgd2lsbCBub3QgdGhyb3cgYW4gZXJyb3IgaWYgdGhleSBkbyBub3QgZXhpc3Qgb24gdGhlXG4gICAqIGFzc2VydGlvbiBvYmplY3QgYmVjYXVzZSB0aGUgYC5pbnNwZWN0YCBwcm9wZXJ0eSBpcyByZWFkIGJ5IGB1dGlsLmluc3BlY3RgIChmb3IgZXhhbXBsZSwgd2hlblxuICAgKiB1c2luZyBgY29uc29sZS5sb2dgIG9uIHRoZSBhc3NlcnRpb24gb2JqZWN0KSBhbmQgYC50aGVuYCBpcyBuZWNlc3NhcnkgZm9yIHByb21pc2UgdHlwZS1jaGVja2luZy5cbiAgICpcbiAgICogICAgIC8vIEJ5IGRlZmF1bHQgdGhlc2Uga2V5cyB3aWxsIG5vdCB0aHJvdyBhbiBlcnJvciBpZiB0aGV5IGRvIG5vdCBleGlzdCBvbiB0aGUgYXNzZXJ0aW9uIG9iamVjdFxuICAgKiAgICAgY2hhaS5jb25maWcucHJveHlFeGNsdWRlZEtleXMgPSBbJ3RoZW4nLCAnaW5zcGVjdCddO1xuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwcm94eUV4Y2x1ZGVkS2V5czogWyd0aGVuJywgJ2luc3BlY3QnLCAndG9KU09OJ11cbn07XG4iLCIvKiFcbiAqIGNoYWlcbiAqIGh0dHA6Ly9jaGFpanMuY29tXG4gKiBDb3B5cmlnaHQoYykgMjAxMS0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY2hhaSwgXykge1xuICB2YXIgQXNzZXJ0aW9uID0gY2hhaS5Bc3NlcnRpb25cbiAgICAsIEFzc2VydGlvbkVycm9yID0gY2hhaS5Bc3NlcnRpb25FcnJvclxuICAgICwgZmxhZyA9IF8uZmxhZztcblxuICAvKipcbiAgICogIyMjIExhbmd1YWdlIENoYWluc1xuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGFyZSBwcm92aWRlZCBhcyBjaGFpbmFibGUgZ2V0dGVycyB0byBpbXByb3ZlIHRoZSByZWFkYWJpbGl0eVxuICAgKiBvZiB5b3VyIGFzc2VydGlvbnMuXG4gICAqXG4gICAqICoqQ2hhaW5zKipcbiAgICpcbiAgICogLSB0b1xuICAgKiAtIGJlXG4gICAqIC0gYmVlblxuICAgKiAtIGlzXG4gICAqIC0gdGhhdFxuICAgKiAtIHdoaWNoXG4gICAqIC0gYW5kXG4gICAqIC0gaGFzXG4gICAqIC0gaGF2ZVxuICAgKiAtIHdpdGhcbiAgICogLSBhdFxuICAgKiAtIG9mXG4gICAqIC0gc2FtZVxuICAgKiAtIGJ1dFxuICAgKiAtIGRvZXNcbiAgICpcbiAgICogQG5hbWUgbGFuZ3VhZ2UgY2hhaW5zXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFsgJ3RvJywgJ2JlJywgJ2JlZW4nXG4gICwgJ2lzJywgJ2FuZCcsICdoYXMnLCAnaGF2ZSdcbiAgLCAnd2l0aCcsICd0aGF0JywgJ3doaWNoJywgJ2F0J1xuICAsICdvZicsICdzYW1lJywgJ2J1dCcsICdkb2VzJyBdLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KGNoYWluKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAubm90XG4gICAqXG4gICAqIE5lZ2F0ZXMgYWxsIGFzc2VydGlvbnMgdGhhdCBmb2xsb3cgaW4gdGhlIGNoYWluLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KGZ1bmN0aW9uICgpIHt9KS50by5ub3QudGhyb3coKTtcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLm5vdC5oYXZlLnByb3BlcnR5KCdiJyk7XG4gICAqICAgICBleHBlY3QoWzEsIDJdKS50by5iZS5hbignYXJyYXknKS50aGF0LmRvZXMubm90LmluY2x1ZGUoMyk7XG4gICAqXG4gICAqIEp1c3QgYmVjYXVzZSB5b3UgY2FuIG5lZ2F0ZSBhbnkgYXNzZXJ0aW9uIHdpdGggYC5ub3RgIGRvZXNuJ3QgbWVhbiB5b3VcbiAgICogc2hvdWxkLiBXaXRoIGdyZWF0IHBvd2VyIGNvbWVzIGdyZWF0IHJlc3BvbnNpYmlsaXR5LiBJdCdzIG9mdGVuIGJlc3QgdG9cbiAgICogYXNzZXJ0IHRoYXQgdGhlIG9uZSBleHBlY3RlZCBvdXRwdXQgd2FzIHByb2R1Y2VkLCByYXRoZXIgdGhhbiBhc3NlcnRpbmdcbiAgICogdGhhdCBvbmUgb2YgY291bnRsZXNzIHVuZXhwZWN0ZWQgb3V0cHV0cyB3YXNuJ3QgcHJvZHVjZWQuIFNlZSBpbmRpdmlkdWFsXG4gICAqIGFzc2VydGlvbnMgZm9yIHNwZWNpZmljIGd1aWRhbmNlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmVxdWFsKDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDIpLnRvLm5vdC5lcXVhbCgxKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEBuYW1lIG5vdFxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ25vdCcsIGZ1bmN0aW9uICgpIHtcbiAgICBmbGFnKHRoaXMsICduZWdhdGUnLCB0cnVlKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAuZGVlcFxuICAgKlxuICAgKiBDYXVzZXMgYWxsIGAuZXF1YWxgLCBgLmluY2x1ZGVgLCBgLm1lbWJlcnNgLCBgLmtleXNgLCBhbmQgYC5wcm9wZXJ0eWBcbiAgICogYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW4gdG8gdXNlIGRlZXAgZXF1YWxpdHkgaW5zdGVhZCBvZiBzdHJpY3RcbiAgICogKGA9PT1gKSBlcXVhbGl0eS4gU2VlIHRoZSBgZGVlcC1lcWxgIHByb2plY3QgcGFnZSBmb3IgaW5mbyBvbiB0aGUgZGVlcFxuICAgKiBlcXVhbGl0eSBhbGdvcml0aG06IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvZGVlcC1lcWwuXG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgb2JqZWN0IGRlZXBseSAoYnV0IG5vdCBzdHJpY3RseSkgZXF1YWxzIGB7YTogMX1gXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5kZWVwLmVxdWFsKHthOiAxfSk7XG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5ub3QuZXF1YWwoe2E6IDF9KTtcbiAgICpcbiAgICogICAgIC8vIFRhcmdldCBhcnJheSBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGluY2x1ZGVzIGB7YTogMX1gXG4gICAqICAgICBleHBlY3QoW3thOiAxfV0pLnRvLmRlZXAuaW5jbHVkZSh7YTogMX0pO1xuICAgKiAgICAgZXhwZWN0KFt7YTogMX1dKS50by5ub3QuaW5jbHVkZSh7YTogMX0pO1xuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IG9iamVjdCBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGluY2x1ZGVzIGB4OiB7YTogMX1gXG4gICAqICAgICBleHBlY3Qoe3g6IHthOiAxfX0pLnRvLmRlZXAuaW5jbHVkZSh7eDoge2E6IDF9fSk7XG4gICAqICAgICBleHBlY3Qoe3g6IHthOiAxfX0pLnRvLm5vdC5pbmNsdWRlKHt4OiB7YTogMX19KTtcbiAgICpcbiAgICogICAgIC8vIFRhcmdldCBhcnJheSBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGhhcyBtZW1iZXIgYHthOiAxfWBcbiAgICogICAgIGV4cGVjdChbe2E6IDF9XSkudG8uaGF2ZS5kZWVwLm1lbWJlcnMoW3thOiAxfV0pO1xuICAgKiAgICAgZXhwZWN0KFt7YTogMX1dKS50by5ub3QuaGF2ZS5tZW1iZXJzKFt7YTogMX1dKTtcbiAgICpcbiAgICogICAgIC8vIFRhcmdldCBzZXQgZGVlcGx5IChidXQgbm90IHN0cmljdGx5KSBoYXMga2V5IGB7YTogMX1gXG4gICAqICAgICBleHBlY3QobmV3IFNldChbe2E6IDF9XSkpLnRvLmhhdmUuZGVlcC5rZXlzKFt7YTogMX1dKTtcbiAgICogICAgIGV4cGVjdChuZXcgU2V0KFt7YTogMX1dKSkudG8ubm90LmhhdmUua2V5cyhbe2E6IDF9XSk7XG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgb2JqZWN0IGRlZXBseSAoYnV0IG5vdCBzdHJpY3RseSkgaGFzIHByb3BlcnR5IGB4OiB7YTogMX1gXG4gICAqICAgICBleHBlY3Qoe3g6IHthOiAxfX0pLnRvLmhhdmUuZGVlcC5wcm9wZXJ0eSgneCcsIHthOiAxfSk7XG4gICAqICAgICBleHBlY3Qoe3g6IHthOiAxfX0pLnRvLm5vdC5oYXZlLnByb3BlcnR5KCd4Jywge2E6IDF9KTtcbiAgICpcbiAgICogQG5hbWUgZGVlcFxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ2RlZXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgZmxhZyh0aGlzLCAnZGVlcCcsIHRydWUpO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5uZXN0ZWRcbiAgICpcbiAgICogRW5hYmxlcyBkb3QtIGFuZCBicmFja2V0LW5vdGF0aW9uIGluIGFsbCBgLnByb3BlcnR5YCBhbmQgYC5pbmNsdWRlYFxuICAgKiBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbi5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YToge2I6IFsneCcsICd5J119fSkudG8uaGF2ZS5uZXN0ZWQucHJvcGVydHkoJ2EuYlsxXScpO1xuICAgKiAgICAgZXhwZWN0KHthOiB7YjogWyd4JywgJ3knXX19KS50by5uZXN0ZWQuaW5jbHVkZSh7J2EuYlsxXSc6ICd5J30pO1xuICAgKlxuICAgKiBJZiBgLmAgb3IgYFtdYCBhcmUgcGFydCBvZiBhbiBhY3R1YWwgcHJvcGVydHkgbmFtZSwgdGhleSBjYW4gYmUgZXNjYXBlZCBieVxuICAgKiBhZGRpbmcgdHdvIGJhY2tzbGFzaGVzIGJlZm9yZSB0aGVtLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHsnLmEnOiB7J1tiXSc6ICd4J319KS50by5oYXZlLm5lc3RlZC5wcm9wZXJ0eSgnXFxcXC5hLlxcXFxbYlxcXFxdJyk7XG4gICAqICAgICBleHBlY3QoeycuYSc6IHsnW2JdJzogJ3gnfX0pLnRvLm5lc3RlZC5pbmNsdWRlKHsnXFxcXC5hLlxcXFxbYlxcXFxdJzogJ3gnfSk7XG4gICAqXG4gICAqIGAubmVzdGVkYCBjYW5ub3QgYmUgY29tYmluZWQgd2l0aCBgLm93bmAuXG4gICAqXG4gICAqIEBuYW1lIG5lc3RlZFxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ25lc3RlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBmbGFnKHRoaXMsICduZXN0ZWQnLCB0cnVlKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAub3duXG4gICAqXG4gICAqIENhdXNlcyBhbGwgYC5wcm9wZXJ0eWAgYW5kIGAuaW5jbHVkZWAgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW5cbiAgICogdG8gaWdub3JlIGluaGVyaXRlZCBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiAgICAgT2JqZWN0LnByb3RvdHlwZS5iID0gMjtcbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmhhdmUub3duLnByb3BlcnR5KCdhJyk7XG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLnByb3BlcnR5KCdiJykuYnV0Lm5vdC5vd24ucHJvcGVydHkoJ2InKTsgXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5vd24uaW5jbHVkZSh7YTogMX0pO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaW5jbHVkZSh7YjogMn0pLmJ1dC5ub3Qub3duLmluY2x1ZGUoe2I6IDJ9KTtcbiAgICpcbiAgICogYC5vd25gIGNhbm5vdCBiZSBjb21iaW5lZCB3aXRoIGAubmVzdGVkYC5cbiAgICpcbiAgICogQG5hbWUgb3duXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnb3duJywgZnVuY3Rpb24gKCkge1xuICAgIGZsYWcodGhpcywgJ293bicsIHRydWUpO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5vcmRlcmVkXG4gICAqXG4gICAqIENhdXNlcyBhbGwgYC5tZW1iZXJzYCBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbiB0byByZXF1aXJlIHRoYXRcbiAgICogbWVtYmVycyBiZSBpbiB0aGUgc2FtZSBvcmRlci5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMl0pLnRvLmhhdmUub3JkZXJlZC5tZW1iZXJzKFsxLCAyXSlcbiAgICogICAgICAgLmJ1dC5ub3QuaGF2ZS5vcmRlcmVkLm1lbWJlcnMoWzIsIDFdKTtcbiAgICpcbiAgICogV2hlbiBgLmluY2x1ZGVgIGFuZCBgLm9yZGVyZWRgIGFyZSBjb21iaW5lZCwgdGhlIG9yZGVyaW5nIGJlZ2lucyBhdCB0aGVcbiAgICogc3RhcnQgb2YgYm90aCBhcnJheXMuXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5pbmNsdWRlLm9yZGVyZWQubWVtYmVycyhbMSwgMl0pXG4gICAqICAgICAgIC5idXQubm90LmluY2x1ZGUub3JkZXJlZC5tZW1iZXJzKFsyLCAzXSk7XG4gICAqXG4gICAqIEBuYW1lIG9yZGVyZWRcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdvcmRlcmVkJywgZnVuY3Rpb24gKCkge1xuICAgIGZsYWcodGhpcywgJ29yZGVyZWQnLCB0cnVlKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAuYW55XG4gICAqXG4gICAqIENhdXNlcyBhbGwgYC5rZXlzYCBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbiB0byBvbmx5IHJlcXVpcmUgdGhhdFxuICAgKiB0aGUgdGFyZ2V0IGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSBnaXZlbiBrZXlzLiBUaGlzIGlzIHRoZSBvcHBvc2l0ZSBvZlxuICAgKiBgLmFsbGAsIHdoaWNoIHJlcXVpcmVzIHRoYXQgdGhlIHRhcmdldCBoYXZlIGFsbCBvZiB0aGUgZ2l2ZW4ga2V5cy5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMSwgYjogMn0pLnRvLm5vdC5oYXZlLmFueS5rZXlzKCdjJywgJ2QnKTtcbiAgICpcbiAgICogU2VlIHRoZSBgLmtleXNgIGRvYyBmb3IgZ3VpZGFuY2Ugb24gd2hlbiB0byB1c2UgYC5hbnlgIG9yIGAuYWxsYC5cbiAgICpcbiAgICogQG5hbWUgYW55XG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnYW55JywgZnVuY3Rpb24gKCkge1xuICAgIGZsYWcodGhpcywgJ2FueScsIHRydWUpO1xuICAgIGZsYWcodGhpcywgJ2FsbCcsIGZhbHNlKTtcbiAgfSk7XG5cblxuICAvKipcbiAgICogIyMjIC5hbGxcbiAgICpcbiAgICogQ2F1c2VzIGFsbCBgLmtleXNgIGFzc2VydGlvbnMgdGhhdCBmb2xsb3cgaW4gdGhlIGNoYWluIHRvIHJlcXVpcmUgdGhhdCB0aGVcbiAgICogdGFyZ2V0IGhhdmUgYWxsIG9mIHRoZSBnaXZlbiBrZXlzLiBUaGlzIGlzIHRoZSBvcHBvc2l0ZSBvZiBgLmFueWAsIHdoaWNoXG4gICAqIG9ubHkgcmVxdWlyZXMgdGhhdCB0aGUgdGFyZ2V0IGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSBnaXZlbiBrZXlzLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8uaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqIE5vdGUgdGhhdCBgLmFsbGAgaXMgdXNlZCBieSBkZWZhdWx0IHdoZW4gbmVpdGhlciBgLmFsbGAgbm9yIGAuYW55YCBhcmVcbiAgICogYWRkZWQgZWFybGllciBpbiB0aGUgY2hhaW4uIEhvd2V2ZXIsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhZGQgYC5hbGxgIGFueXdheVxuICAgKiBiZWNhdXNlIGl0IGltcHJvdmVzIHJlYWRhYmlsaXR5LlxuICAgKlxuICAgKiBTZWUgdGhlIGAua2V5c2AgZG9jIGZvciBndWlkYW5jZSBvbiB3aGVuIHRvIHVzZSBgLmFueWAgb3IgYC5hbGxgLlxuICAgKlxuICAgKiBAbmFtZSBhbGxcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdhbGwnLCBmdW5jdGlvbiAoKSB7XG4gICAgZmxhZyh0aGlzLCAnYWxsJywgdHJ1ZSk7XG4gICAgZmxhZyh0aGlzLCAnYW55JywgZmFsc2UpO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5hKHR5cGVbLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCdzIHR5cGUgaXMgZXF1YWwgdG8gdGhlIGdpdmVuIHN0cmluZyBgdHlwZWAuIFR5cGVzXG4gICAqIGFyZSBjYXNlIGluc2Vuc2l0aXZlLiBTZWUgdGhlIGB0eXBlLWRldGVjdGAgcHJvamVjdCBwYWdlIGZvciBpbmZvIG9uIHRoZVxuICAgKiB0eXBlIGRldGVjdGlvbiBhbGdvcml0aG06IGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvdHlwZS1kZXRlY3QuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmJlLmEoJ3N0cmluZycpO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uYmUuYW4oJ29iamVjdCcpO1xuICAgKiAgICAgZXhwZWN0KG51bGwpLnRvLmJlLmEoJ251bGwnKTtcbiAgICogICAgIGV4cGVjdCh1bmRlZmluZWQpLnRvLmJlLmFuKCd1bmRlZmluZWQnKTtcbiAgICogICAgIGV4cGVjdChuZXcgRXJyb3IpLnRvLmJlLmFuKCdlcnJvcicpO1xuICAgKiAgICAgZXhwZWN0KFByb21pc2UucmVzb2x2ZSgpKS50by5iZS5hKCdwcm9taXNlJyk7XG4gICAqICAgICBleHBlY3QobmV3IEZsb2F0MzJBcnJheSkudG8uYmUuYSgnZmxvYXQzMmFycmF5Jyk7XG4gICAqICAgICBleHBlY3QoU3ltYm9sKCkpLnRvLmJlLmEoJ3N5bWJvbCcpO1xuICAgKlxuICAgKiBgLmFgIHN1cHBvcnRzIG9iamVjdHMgdGhhdCBoYXZlIGEgY3VzdG9tIHR5cGUgc2V0IHZpYSBgU3ltYm9sLnRvU3RyaW5nVGFnYC5cbiAgICpcbiAgICogICAgIHZhciBteU9iaiA9IHtcbiAgICogICAgICAgW1N5bWJvbC50b1N0cmluZ1RhZ106ICdteUN1c3RvbVR5cGUnXG4gICAqICAgICB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KG15T2JqKS50by5iZS5hKCdteUN1c3RvbVR5cGUnKS5idXQubm90LmFuKCdvYmplY3QnKTtcbiAgICpcbiAgICogSXQncyBvZnRlbiBiZXN0IHRvIHVzZSBgLmFgIHRvIGNoZWNrIGEgdGFyZ2V0J3MgdHlwZSBiZWZvcmUgbWFraW5nIG1vcmVcbiAgICogYXNzZXJ0aW9ucyBvbiB0aGUgc2FtZSB0YXJnZXQuIFRoYXQgd2F5LCB5b3UgYXZvaWQgdW5leHBlY3RlZCBiZWhhdmlvciBmcm9tXG4gICAqIGFueSBhc3NlcnRpb24gdGhhdCBkb2VzIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIHRhcmdldCdzIHR5cGUuXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5iZS5hbignYXJyYXknKS50aGF0LmluY2x1ZGVzKDIpO1xuICAgKiAgICAgZXhwZWN0KFtdKS50by5iZS5hbignYXJyYXknKS50aGF0LmlzLmVtcHR5O1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmFgLiBIb3dldmVyLCBpdCdzIG9mdGVuIGJlc3QgdG9cbiAgICogYXNzZXJ0IHRoYXQgdGhlIHRhcmdldCBpcyB0aGUgZXhwZWN0ZWQgdHlwZSwgcmF0aGVyIHRoYW4gYXNzZXJ0aW5nIHRoYXQgaXRcbiAgICogaXNuJ3Qgb25lIG9mIG1hbnkgdW5leHBlY3RlZCB0eXBlcy5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uYmUuYSgnc3RyaW5nJyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLm5vdC5iZS5hbignYXJyYXknKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAuYWAgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvXG4gICAqIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhcyB0aGUgc2Vjb25kXG4gICAqIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmJlLmEoJ3N0cmluZycsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCgxLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUuYSgnc3RyaW5nJyk7XG4gICAqXG4gICAqIGAuYWAgY2FuIGFsc28gYmUgdXNlZCBhcyBhIGxhbmd1YWdlIGNoYWluIHRvIGltcHJvdmUgdGhlIHJlYWRhYmlsaXR5IG9mXG4gICAqIHlvdXIgYXNzZXJ0aW9ucy4gXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2I6IDJ9KS50by5oYXZlLmEucHJvcGVydHkoJ2InKTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAuYW5gIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAuYWAuXG4gICAqXG4gICAqIEBuYW1lIGFcbiAgICogQGFsaWFzIGFuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhbiAodHlwZSwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgYXJ0aWNsZSA9IH5bICdhJywgJ2UnLCAnaScsICdvJywgJ3UnIF0uaW5kZXhPZih0eXBlLmNoYXJBdCgwKSkgPyAnYW4gJyA6ICdhICc7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgdHlwZSA9PT0gXy50eXBlKG9iaikudG9Mb3dlckNhc2UoKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSAnICsgYXJ0aWNsZSArIHR5cGVcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gbm90IHRvIGJlICcgKyBhcnRpY2xlICsgdHlwZVxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkQ2hhaW5hYmxlTWV0aG9kKCdhbicsIGFuKTtcbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnYScsIGFuKTtcblxuICAvKipcbiAgICogIyMjIC5pbmNsdWRlKHZhbFssIG1zZ10pXG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpcyBhIHN0cmluZywgYC5pbmNsdWRlYCBhc3NlcnRzIHRoYXQgdGhlIGdpdmVuIHN0cmluZyBgdmFsYFxuICAgKiBpcyBhIHN1YnN0cmluZyBvZiB0aGUgdGFyZ2V0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KCdmb29iYXInKS50by5pbmNsdWRlKCdmb28nKTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGFuIGFycmF5LCBgLmluY2x1ZGVgIGFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYHZhbGAgaXMgYVxuICAgKiBtZW1iZXIgb2YgdGhlIHRhcmdldC5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmluY2x1ZGUoMik7XG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpcyBhbiBvYmplY3QsIGAuaW5jbHVkZWAgYXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBvYmplY3RcbiAgICogYHZhbGAncyBwcm9wZXJ0aWVzIGFyZSBhIHN1YnNldCBvZiB0aGUgdGFyZ2V0J3MgcHJvcGVydGllcy5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMSwgYjogMiwgYzogM30pLnRvLmluY2x1ZGUoe2E6IDEsIGI6IDJ9KTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGEgU2V0IG9yIFdlYWtTZXQsIGAuaW5jbHVkZWAgYXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBgdmFsYCBpcyBhXG4gICAqIG1lbWJlciBvZiB0aGUgdGFyZ2V0LiBTYW1lVmFsdWVaZXJvIGVxdWFsaXR5IGFsZ29yaXRobSBpcyB1c2VkLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoWzEsIDJdKSkudG8uaW5jbHVkZSgyKTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGEgTWFwLCBgLmluY2x1ZGVgIGFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYHZhbGAgaXMgb25lIG9mXG4gICAqIHRoZSB2YWx1ZXMgb2YgdGhlIHRhcmdldC4gU2FtZVZhbHVlWmVybyBlcXVhbGl0eSBhbGdvcml0aG0gaXMgdXNlZC5cbiAgICpcbiAgICogICAgIGV4cGVjdChuZXcgTWFwKFtbJ2EnLCAxXSwgWydiJywgMl1dKSkudG8uaW5jbHVkZSgyKTtcbiAgICpcbiAgICogQmVjYXVzZSBgLmluY2x1ZGVgIGRvZXMgZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgdGFyZ2V0J3MgdHlwZSwgaXQnc1xuICAgKiBpbXBvcnRhbnQgdG8gY2hlY2sgdGhlIHRhcmdldCdzIHR5cGUgYmVmb3JlIHVzaW5nIGAuaW5jbHVkZWAuIFNlZSB0aGUgYC5hYFxuICAgKiBkb2MgZm9yIGluZm8gb24gdGVzdGluZyBhIHRhcmdldCdzIHR5cGUuXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5iZS5hbignYXJyYXknKS50aGF0LmluY2x1ZGVzKDIpO1xuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBzdHJpY3QgKGA9PT1gKSBlcXVhbGl0eSBpcyB1c2VkIHRvIGNvbXBhcmUgYXJyYXkgbWVtYmVycyBhbmRcbiAgICogb2JqZWN0IHByb3BlcnRpZXMuIEFkZCBgLmRlZXBgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIHVzZSBkZWVwIGVxdWFsaXR5XG4gICAqIGluc3RlYWQgKFdlYWtTZXQgdGFyZ2V0cyBhcmUgbm90IHN1cHBvcnRlZCkuIFNlZSB0aGUgYGRlZXAtZXFsYCBwcm9qZWN0XG4gICAqIHBhZ2UgZm9yIGluZm8gb24gdGhlIGRlZXAgZXF1YWxpdHkgYWxnb3JpdGhtOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2RlZXAtZXFsLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IGFycmF5IGRlZXBseSAoYnV0IG5vdCBzdHJpY3RseSkgaW5jbHVkZXMgYHthOiAxfWBcbiAgICogICAgIGV4cGVjdChbe2E6IDF9XSkudG8uZGVlcC5pbmNsdWRlKHthOiAxfSk7XG4gICAqICAgICBleHBlY3QoW3thOiAxfV0pLnRvLm5vdC5pbmNsdWRlKHthOiAxfSk7XG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgb2JqZWN0IGRlZXBseSAoYnV0IG5vdCBzdHJpY3RseSkgaW5jbHVkZXMgYHg6IHthOiAxfWBcbiAgICogICAgIGV4cGVjdCh7eDoge2E6IDF9fSkudG8uZGVlcC5pbmNsdWRlKHt4OiB7YTogMX19KTtcbiAgICogICAgIGV4cGVjdCh7eDoge2E6IDF9fSkudG8ubm90LmluY2x1ZGUoe3g6IHthOiAxfX0pO1xuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBhbGwgb2YgdGhlIHRhcmdldCdzIHByb3BlcnRpZXMgYXJlIHNlYXJjaGVkIHdoZW4gd29ya2luZyB3aXRoXG4gICAqIG9iamVjdHMuIFRoaXMgaW5jbHVkZXMgcHJvcGVydGllcyB0aGF0IGFyZSBpbmhlcml0ZWQgYW5kL29yIG5vbi1lbnVtZXJhYmxlLlxuICAgKiBBZGQgYC5vd25gIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIGV4Y2x1ZGUgdGhlIHRhcmdldCdzIGluaGVyaXRlZFxuICAgKiBwcm9wZXJ0aWVzIGZyb20gdGhlIHNlYXJjaC5cbiAgICpcbiAgICogICAgIE9iamVjdC5wcm90b3R5cGUuYiA9IDI7XG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5vd24uaW5jbHVkZSh7YTogMX0pO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaW5jbHVkZSh7YjogMn0pLmJ1dC5ub3Qub3duLmluY2x1ZGUoe2I6IDJ9KTtcbiAgICpcbiAgICogTm90ZSB0aGF0IGEgdGFyZ2V0IG9iamVjdCBpcyBhbHdheXMgb25seSBzZWFyY2hlZCBmb3IgYHZhbGAncyBvd25cbiAgICogZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBgLmRlZXBgIGFuZCBgLm93bmAgY2FuIGJlIGNvbWJpbmVkLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiB7YjogMn19KS50by5kZWVwLm93bi5pbmNsdWRlKHthOiB7YjogMn19KTtcbiAgICpcbiAgICogQWRkIGAubmVzdGVkYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBlbmFibGUgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiB3aGVuXG4gICAqIHJlZmVyZW5jaW5nIG5lc3RlZCBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiB7YjogWyd4JywgJ3knXX19KS50by5uZXN0ZWQuaW5jbHVkZSh7J2EuYlsxXSc6ICd5J30pO1xuICAgKlxuICAgKiBJZiBgLmAgb3IgYFtdYCBhcmUgcGFydCBvZiBhbiBhY3R1YWwgcHJvcGVydHkgbmFtZSwgdGhleSBjYW4gYmUgZXNjYXBlZCBieVxuICAgKiBhZGRpbmcgdHdvIGJhY2tzbGFzaGVzIGJlZm9yZSB0aGVtLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHsnLmEnOiB7J1tiXSc6IDJ9fSkudG8ubmVzdGVkLmluY2x1ZGUoeydcXFxcLmEuXFxcXFtiXFxcXF0nOiAyfSk7XG4gICAqXG4gICAqIGAuZGVlcGAgYW5kIGAubmVzdGVkYCBjYW4gYmUgY29tYmluZWQuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IHtiOiBbe2M6IDN9XX19KS50by5kZWVwLm5lc3RlZC5pbmNsdWRlKHsnYS5iWzBdJzoge2M6IDN9fSk7XG4gICAqXG4gICAqIGAub3duYCBhbmQgYC5uZXN0ZWRgIGNhbm5vdCBiZSBjb21iaW5lZC5cbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5pbmNsdWRlYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vYmFyJykudG8ubm90LmluY2x1ZGUoJ3RhY28nKTtcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLm5vdC5pbmNsdWRlKDQpO1xuICAgKiBcbiAgICogSG93ZXZlciwgaXQncyBkYW5nZXJvdXMgdG8gbmVnYXRlIGAuaW5jbHVkZWAgd2hlbiB0aGUgdGFyZ2V0IGlzIGFuIG9iamVjdC5cbiAgICogVGhlIHByb2JsZW0gaXMgdGhhdCBpdCBjcmVhdGVzIHVuY2VydGFpbiBleHBlY3RhdGlvbnMgYnkgYXNzZXJ0aW5nIHRoYXQgdGhlXG4gICAqIHRhcmdldCBvYmplY3QgZG9lc24ndCBoYXZlIGFsbCBvZiBgdmFsYCdzIGtleS92YWx1ZSBwYWlycyBidXQgbWF5IG9yIG1heVxuICAgKiBub3QgaGF2ZSBzb21lIG9mIHRoZW0uIEl0J3Mgb2Z0ZW4gYmVzdCB0byBpZGVudGlmeSB0aGUgZXhhY3Qgb3V0cHV0IHRoYXQnc1xuICAgKiBleHBlY3RlZCwgYW5kIHRoZW4gd3JpdGUgYW4gYXNzZXJ0aW9uIHRoYXQgb25seSBhY2NlcHRzIHRoYXQgZXhhY3Qgb3V0cHV0LlxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgb2JqZWN0IGlzbid0IGV2ZW4gZXhwZWN0ZWQgdG8gaGF2ZSBgdmFsYCdzIGtleXMsIGl0J3NcbiAgICogb2Z0ZW4gYmVzdCB0byBhc3NlcnQgZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHtjOiAzfSkudG8ubm90LmhhdmUuYW55LmtleXMoJ2EnLCAnYicpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHtjOiAzfSkudG8ubm90LmluY2x1ZGUoe2E6IDEsIGI6IDJ9KTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBvYmplY3QgaXMgZXhwZWN0ZWQgdG8gaGF2ZSBgdmFsYCdzIGtleXMsIGl0J3Mgb2Z0ZW4gYmVzdCB0b1xuICAgKiBhc3NlcnQgdGhhdCBlYWNoIG9mIHRoZSBwcm9wZXJ0aWVzIGhhcyBpdHMgZXhwZWN0ZWQgdmFsdWUsIHJhdGhlciB0aGFuXG4gICAqIGFzc2VydGluZyB0aGF0IGVhY2ggcHJvcGVydHkgZG9lc24ndCBoYXZlIG9uZSBvZiBtYW55IHVuZXhwZWN0ZWQgdmFsdWVzLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAzLCBiOiA0fSkudG8uaW5jbHVkZSh7YTogMywgYjogNH0pOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAzLCBiOiA0fSkudG8ubm90LmluY2x1ZGUoe2E6IDEsIGI6IDJ9KTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAuaW5jbHVkZWAgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvclxuICAgKiBtZXNzYWdlIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhc1xuICAgKiB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaW5jbHVkZSg0LCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uaW5jbHVkZSg0KTtcbiAgICpcbiAgICogYC5pbmNsdWRlYCBjYW4gYWxzbyBiZSB1c2VkIGFzIGEgbGFuZ3VhZ2UgY2hhaW4sIGNhdXNpbmcgYWxsIGAubWVtYmVyc2AgYW5kXG4gICAqIGAua2V5c2AgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW4gdG8gcmVxdWlyZSB0aGUgdGFyZ2V0IHRvIGJlIGFcbiAgICogc3VwZXJzZXQgb2YgdGhlIGV4cGVjdGVkIHNldCwgcmF0aGVyIHRoYW4gYW4gaWRlbnRpY2FsIHNldC4gTm90ZSB0aGF0XG4gICAqIGAubWVtYmVyc2AgaWdub3JlcyBkdXBsaWNhdGVzIGluIHRoZSBzdWJzZXQgd2hlbiBgLmluY2x1ZGVgIGlzIGFkZGVkLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IG9iamVjdCdzIGtleXMgYXJlIGEgc3VwZXJzZXQgb2YgWydhJywgJ2InXSBidXQgbm90IGlkZW50aWNhbFxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyLCBjOiAzfSkudG8uaW5jbHVkZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqICAgICBleHBlY3Qoe2E6IDEsIGI6IDIsIGM6IDN9KS50by5ub3QuaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgYXJyYXkgaXMgYSBzdXBlcnNldCBvZiBbMSwgMl0gYnV0IG5vdCBpZGVudGljYWxcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmluY2x1ZGUubWVtYmVycyhbMSwgMl0pO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8ubm90LmhhdmUubWVtYmVycyhbMSwgMl0pO1xuICAgKlxuICAgKiAgICAgLy8gRHVwbGljYXRlcyBpbiB0aGUgc3Vic2V0IGFyZSBpZ25vcmVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5pbmNsdWRlLm1lbWJlcnMoWzEsIDIsIDIsIDJdKTtcbiAgICpcbiAgICogTm90ZSB0aGF0IGFkZGluZyBgLmFueWAgZWFybGllciBpbiB0aGUgY2hhaW4gY2F1c2VzIHRoZSBgLmtleXNgIGFzc2VydGlvblxuICAgKiB0byBpZ25vcmUgYC5pbmNsdWRlYC5cbiAgICpcbiAgICogICAgIC8vIEJvdGggYXNzZXJ0aW9ucyBhcmUgaWRlbnRpY2FsXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5pbmNsdWRlLmFueS5rZXlzKCdhJywgJ2InKTtcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmhhdmUuYW55LmtleXMoJ2EnLCAnYicpO1xuICAgKlxuICAgKiBUaGUgYWxpYXNlcyBgLmluY2x1ZGVzYCwgYC5jb250YWluYCwgYW5kIGAuY29udGFpbnNgIGNhbiBiZSB1c2VkXG4gICAqIGludGVyY2hhbmdlYWJseSB3aXRoIGAuaW5jbHVkZWAuXG4gICAqXG4gICAqIEBuYW1lIGluY2x1ZGVcbiAgICogQGFsaWFzIGNvbnRhaW5cbiAgICogQGFsaWFzIGluY2x1ZGVzXG4gICAqIEBhbGlhcyBjb250YWluc1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWxcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIFNhbWVWYWx1ZVplcm8oYSwgYikge1xuICAgIHJldHVybiAoXy5pc05hTihhKSAmJiBfLmlzTmFOKGIpKSB8fCBhID09PSBiO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5jbHVkZUNoYWluaW5nQmVoYXZpb3IgKCkge1xuICAgIGZsYWcodGhpcywgJ2NvbnRhaW5zJywgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpbmNsdWRlICh2YWwsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIFxuICAgIHZhciBvYmogPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCBvYmpUeXBlID0gXy50eXBlKG9iaikudG9Mb3dlckNhc2UoKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIG5lZ2F0ZSA9IGZsYWcodGhpcywgJ25lZ2F0ZScpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJylcbiAgICAgICwgaXNEZWVwID0gZmxhZyh0aGlzLCAnZGVlcCcpXG4gICAgICAsIGRlc2NyaXB0b3IgPSBpc0RlZXAgPyAnZGVlcCAnIDogJyc7XG5cbiAgICBmbGFnTXNnID0gZmxhZ01zZyA/IGZsYWdNc2cgKyAnOiAnIDogJyc7XG5cbiAgICB2YXIgaW5jbHVkZWQgPSBmYWxzZTtcblxuICAgIHN3aXRjaCAob2JqVHlwZSkge1xuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgaW5jbHVkZWQgPSBvYmouaW5kZXhPZih2YWwpICE9PSAtMTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3dlYWtzZXQnOlxuICAgICAgICBpZiAoaXNEZWVwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgICAgZmxhZ01zZyArICd1bmFibGUgdG8gdXNlIC5kZWVwLmluY2x1ZGUgd2l0aCBXZWFrU2V0JyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHNzZmlcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5jbHVkZWQgPSBvYmouaGFzKHZhbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdtYXAnOlxuICAgICAgICB2YXIgaXNFcWwgPSBpc0RlZXAgPyBfLmVxbCA6IFNhbWVWYWx1ZVplcm87XG4gICAgICAgIG9iai5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgaW5jbHVkZWQgPSBpbmNsdWRlZCB8fCBpc0VxbChpdGVtLCB2YWwpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3NldCc6XG4gICAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgICBvYmouZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgaW5jbHVkZWQgPSBpbmNsdWRlZCB8fCBfLmVxbChpdGVtLCB2YWwpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluY2x1ZGVkID0gb2JqLmhhcyh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhcnJheSc6XG4gICAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgICBpbmNsdWRlZCA9IG9iai5zb21lKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5lcWwoaXRlbSwgdmFsKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluY2x1ZGVkID0gb2JqLmluZGV4T2YodmFsKSAhPT0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIC8vIFRoaXMgYmxvY2sgaXMgZm9yIGFzc2VydGluZyBhIHN1YnNldCBvZiBwcm9wZXJ0aWVzIGluIGFuIG9iamVjdC5cbiAgICAgICAgLy8gYF8uZXhwZWN0VHlwZXNgIGlzbid0IHVzZWQgaGVyZSBiZWNhdXNlIGAuaW5jbHVkZWAgc2hvdWxkIHdvcmsgd2l0aFxuICAgICAgICAvLyBvYmplY3RzIHdpdGggYSBjdXN0b20gYEBAdG9TdHJpbmdUYWdgLlxuICAgICAgICBpZiAodmFsICE9PSBPYmplY3QodmFsKSkge1xuICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcbiAgICAgICAgICAgIGZsYWdNc2cgKyAnb2JqZWN0IHRlc3RlZCBtdXN0IGJlIGFuIGFycmF5LCBhIG1hcCwgYW4gb2JqZWN0LCdcbiAgICAgICAgICAgICAgKyAnIGEgc2V0LCBhIHN0cmluZywgb3IgYSB3ZWFrc2V0LCBidXQgJyArIG9ialR5cGUgKyAnIGdpdmVuJyxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHNzZmlcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHByb3BzID0gT2JqZWN0LmtleXModmFsKVxuICAgICAgICAgICwgZmlyc3RFcnIgPSBudWxsXG4gICAgICAgICAgLCBudW1FcnJzID0gMDtcbiAgXG4gICAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgICB2YXIgcHJvcEFzc2VydGlvbiA9IG5ldyBBc3NlcnRpb24ob2JqKTtcbiAgICAgICAgICBfLnRyYW5zZmVyRmxhZ3ModGhpcywgcHJvcEFzc2VydGlvbiwgdHJ1ZSk7XG4gICAgICAgICAgZmxhZyhwcm9wQXNzZXJ0aW9uLCAnbG9ja1NzZmknLCB0cnVlKTtcbiAgXG4gICAgICAgICAgaWYgKCFuZWdhdGUgfHwgcHJvcHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBwcm9wQXNzZXJ0aW9uLnByb3BlcnR5KHByb3AsIHZhbFtwcm9wXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvcEFzc2VydGlvbi5wcm9wZXJ0eShwcm9wLCB2YWxbcHJvcF0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKCFfLmNoZWNrRXJyb3IuY29tcGF0aWJsZUNvbnN0cnVjdG9yKGVyciwgQXNzZXJ0aW9uRXJyb3IpKSB7XG4gICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaXJzdEVyciA9PT0gbnVsbCkgZmlyc3RFcnIgPSBlcnI7XG4gICAgICAgICAgICBudW1FcnJzKys7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgXG4gICAgICAgIC8vIFdoZW4gdmFsaWRhdGluZyAubm90LmluY2x1ZGUgd2l0aCBtdWx0aXBsZSBwcm9wZXJ0aWVzLCB3ZSBvbmx5IHdhbnRcbiAgICAgICAgLy8gdG8gdGhyb3cgYW4gYXNzZXJ0aW9uIGVycm9yIGlmIGFsbCBvZiB0aGUgcHJvcGVydGllcyBhcmUgaW5jbHVkZWQsXG4gICAgICAgIC8vIGluIHdoaWNoIGNhc2Ugd2UgdGhyb3cgdGhlIGZpcnN0IHByb3BlcnR5IGFzc2VydGlvbiBlcnJvciB0aGF0IHdlXG4gICAgICAgIC8vIGVuY291bnRlcmVkLlxuICAgICAgICBpZiAobmVnYXRlICYmIHByb3BzLmxlbmd0aCA+IDEgJiYgbnVtRXJycyA9PT0gcHJvcHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgZmlyc3RFcnI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFzc2VydCBpbmNsdXNpb24gaW4gY29sbGVjdGlvbiBvciBzdWJzdHJpbmcgaW4gYSBzdHJpbmcuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICBpbmNsdWRlZFxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byAnICsgZGVzY3JpcHRvciArICdpbmNsdWRlICcgKyBfLmluc3BlY3QodmFsKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgJyArIGRlc2NyaXB0b3IgKyAnaW5jbHVkZSAnICsgXy5pbnNwZWN0KHZhbCkpO1xuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnaW5jbHVkZScsIGluY2x1ZGUsIGluY2x1ZGVDaGFpbmluZ0JlaGF2aW9yKTtcbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnY29udGFpbicsIGluY2x1ZGUsIGluY2x1ZGVDaGFpbmluZ0JlaGF2aW9yKTtcbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnY29udGFpbnMnLCBpbmNsdWRlLCBpbmNsdWRlQ2hhaW5pbmdCZWhhdmlvcik7XG4gIEFzc2VydGlvbi5hZGRDaGFpbmFibGVNZXRob2QoJ2luY2x1ZGVzJywgaW5jbHVkZSwgaW5jbHVkZUNoYWluaW5nQmVoYXZpb3IpO1xuXG4gIC8qKlxuICAgKiAjIyMgLm9rXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGxvb3NlbHkgKGA9PWApIGVxdWFsIHRvIGB0cnVlYC4gSG93ZXZlciwgaXQnc1xuICAgKiBvZnRlbiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgc3RyaWN0bHkgKGA9PT1gKSBvciBkZWVwbHkgZXF1YWwgdG9cbiAgICogaXRzIGV4cGVjdGVkIHZhbHVlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmVxdWFsKDEpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmJlLm9rOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdCh0cnVlKS50by5iZS50cnVlOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHRydWUpLnRvLmJlLm9rOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5va2AuXG4gICAqXG4gICAqICAgICBleHBlY3QoMCkudG8uZXF1YWwoMCk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMCkudG8ubm90LmJlLm9rOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChmYWxzZSkudG8uYmUuZmFsc2U7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoZmFsc2UpLnRvLm5vdC5iZS5vazsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqICAgICBleHBlY3QobnVsbCkudG8uYmUubnVsbDsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChudWxsKS50by5ub3QuYmUub2s7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KHVuZGVmaW5lZCkudG8uYmUudW5kZWZpbmVkOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHVuZGVmaW5lZCkudG8ubm90LmJlLm9rOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdChmYWxzZSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLm9rO1xuICAgKlxuICAgKiBAbmFtZSBva1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ29rJywgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSB0cnV0aHknXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGZhbHN5Jyk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiAjIyMgLnRydWVcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgc3RyaWN0bHkgKGA9PT1gKSBlcXVhbCB0byBgdHJ1ZWAuXG4gICAqXG4gICAqICAgICBleHBlY3QodHJ1ZSkudG8uYmUudHJ1ZTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC50cnVlYC4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0XG4gICAqIHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLCByYXRoZXIgdGhhbiBub3RcbiAgICogZXF1YWwgdG8gYHRydWVgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KGZhbHNlKS50by5iZS5mYWxzZTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChmYWxzZSkudG8ubm90LmJlLnRydWU7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmVxdWFsKDEpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDEpLnRvLm5vdC5iZS50cnVlOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdChmYWxzZSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLnRydWU7XG4gICAqXG4gICAqIEBuYW1lIHRydWVcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCd0cnVlJywgZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICB0cnVlID09PSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSB0cnVlJ1xuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBmYWxzZSdcbiAgICAgICwgZmxhZyh0aGlzLCAnbmVnYXRlJykgPyBmYWxzZSA6IHRydWVcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5mYWxzZVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBzdHJpY3RseSAoYD09PWApIGVxdWFsIHRvIGBmYWxzZWAuXG4gICAqXG4gICAqICAgICBleHBlY3QoZmFsc2UpLnRvLmJlLmZhbHNlO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmZhbHNlYC4gSG93ZXZlciwgaXQncyBvZnRlblxuICAgKiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLCByYXRoZXIgdGhhblxuICAgKiBub3QgZXF1YWwgdG8gYGZhbHNlYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh0cnVlKS50by5iZS50cnVlOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHRydWUpLnRvLm5vdC5iZS5mYWxzZTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMSk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMSkudG8ubm90LmJlLmZhbHNlOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh0cnVlLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUuZmFsc2U7XG4gICAqXG4gICAqIEBuYW1lIGZhbHNlXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnZmFsc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIGZhbHNlID09PSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBmYWxzZSdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgdHJ1ZSdcbiAgICAgICwgZmxhZyh0aGlzLCAnbmVnYXRlJykgPyB0cnVlIDogZmFsc2VcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5udWxsXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIHN0cmljdGx5IChgPT09YCkgZXF1YWwgdG8gYG51bGxgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KG51bGwpLnRvLmJlLm51bGw7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAubnVsbGAuIEhvd2V2ZXIsIGl0J3Mgb2Z0ZW4gYmVzdFxuICAgKiB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0IGlzIGVxdWFsIHRvIGl0cyBleHBlY3RlZCB2YWx1ZSwgcmF0aGVyIHRoYW4gbm90XG4gICAqIGVxdWFsIHRvIGBudWxsYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5lcXVhbCgxKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuYmUubnVsbDsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgY2FuIGJlIGdpdmVuIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoNDIsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS5udWxsO1xuICAgKlxuICAgKiBAbmFtZSBudWxsXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnbnVsbCcsIGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgbnVsbCA9PT0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgbnVsbCdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gbm90IHRvIGJlIG51bGwnXG4gICAgKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAudW5kZWZpbmVkXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIHN0cmljdGx5IChgPT09YCkgZXF1YWwgdG8gYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqICAgICBleHBlY3QodW5kZWZpbmVkKS50by5iZS51bmRlZmluZWQ7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAudW5kZWZpbmVkYC4gSG93ZXZlciwgaXQncyBvZnRlblxuICAgKiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLCByYXRoZXIgdGhhblxuICAgKiBub3QgZXF1YWwgdG8gYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMSk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMSkudG8ubm90LmJlLnVuZGVmaW5lZDsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgY2FuIGJlIGdpdmVuIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoNDIsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS51bmRlZmluZWQ7XG4gICAqXG4gICAqIEBuYW1lIHVuZGVmaW5lZFxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ3VuZGVmaW5lZCcsIGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgdW5kZWZpbmVkID09PSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSB1bmRlZmluZWQnXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IG5vdCB0byBiZSB1bmRlZmluZWQnXG4gICAgKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAuTmFOXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGV4YWN0bHkgYE5hTmAuXG4gICAqXG4gICAqICAgICBleHBlY3QoTmFOKS50by5iZS5OYU47XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAuTmFOYC4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0XG4gICAqIHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLCByYXRoZXIgdGhhbiBub3RcbiAgICogZXF1YWwgdG8gYE5hTmAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmVxdWFsKCdmb28nKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8ubm90LmJlLk5hTjsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgY2FuIGJlIGdpdmVuIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoNDIsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS5OYU47XG4gICAqXG4gICAqIEBuYW1lIE5hTlxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ05hTicsIGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgXy5pc05hTihmbGFnKHRoaXMsICdvYmplY3QnKSlcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBOYU4nXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gbm90IHRvIGJlIE5hTidcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5leGlzdFxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBub3Qgc3RyaWN0bHkgKGA9PT1gKSBlcXVhbCB0byBlaXRoZXIgYG51bGxgIG9yXG4gICAqIGB1bmRlZmluZWRgLiBIb3dldmVyLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHRhcmdldCBpcyBlcXVhbCB0b1xuICAgKiBpdHMgZXhwZWN0ZWQgdmFsdWUuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMSk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMSkudG8uZXhpc3Q7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KDApLnRvLmVxdWFsKDApOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDApLnRvLmV4aXN0OyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5leGlzdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QobnVsbCkudG8uYmUubnVsbDsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChudWxsKS50by5ub3QuZXhpc3Q7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KHVuZGVmaW5lZCkudG8uYmUudW5kZWZpbmVkOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHVuZGVmaW5lZCkudG8ubm90LmV4aXN0OyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdChudWxsLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uZXhpc3Q7XG4gICAqXG4gICAqIEBuYW1lIGV4aXN0XG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnZXhpc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHZhbCA9IGZsYWcodGhpcywgJ29iamVjdCcpO1xuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICB2YWwgIT09IG51bGwgJiYgdmFsICE9PSB1bmRlZmluZWRcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gZXhpc3QnXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBleGlzdCdcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5lbXB0eVxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXMgYSBzdHJpbmcgb3IgYXJyYXksIGAuZW1wdHlgIGFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0J3NcbiAgICogYGxlbmd0aGAgcHJvcGVydHkgaXMgc3RyaWN0bHkgKGA9PT1gKSBlcXVhbCB0byBgMGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoW10pLnRvLmJlLmVtcHR5O1xuICAgKiAgICAgZXhwZWN0KCcnKS50by5iZS5lbXB0eTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGEgbWFwIG9yIHNldCwgYC5lbXB0eWAgYXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQncyBgc2l6ZWBcbiAgICogcHJvcGVydHkgaXMgc3RyaWN0bHkgZXF1YWwgdG8gYDBgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoKSkudG8uYmUuZW1wdHk7XG4gICAqICAgICBleHBlY3QobmV3IE1hcCgpKS50by5iZS5lbXB0eTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGEgbm9uLWZ1bmN0aW9uIG9iamVjdCwgYC5lbXB0eWAgYXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXRcbiAgICogZG9lc24ndCBoYXZlIGFueSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLiBQcm9wZXJ0aWVzIHdpdGggU3ltYm9sLWJhc2VkXG4gICAqIGtleXMgYXJlIGV4Y2x1ZGVkIGZyb20gdGhlIGNvdW50LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHt9KS50by5iZS5lbXB0eTtcbiAgICpcbiAgICogQmVjYXVzZSBgLmVtcHR5YCBkb2VzIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIHRhcmdldCdzIHR5cGUsIGl0J3NcbiAgICogaW1wb3J0YW50IHRvIGNoZWNrIHRoZSB0YXJnZXQncyB0eXBlIGJlZm9yZSB1c2luZyBgLmVtcHR5YC4gU2VlIHRoZSBgLmFgXG4gICAqIGRvYyBmb3IgaW5mbyBvbiB0ZXN0aW5nIGEgdGFyZ2V0J3MgdHlwZS5cbiAgICpcbiAgICogICAgIGV4cGVjdChbXSkudG8uYmUuYW4oJ2FycmF5JykudGhhdC5pcy5lbXB0eTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5lbXB0eWAuIEhvd2V2ZXIsIGl0J3Mgb2Z0ZW5cbiAgICogYmVzdCB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0IGNvbnRhaW5zIGl0cyBleHBlY3RlZCBudW1iZXIgb2YgdmFsdWVzLFxuICAgKiByYXRoZXIgdGhhbiBhc3NlcnRpbmcgdGhhdCBpdCdzIG5vdCBlbXB0eS5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YoMyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5ub3QuYmUuZW1wdHk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoWzEsIDIsIDNdKSkudG8uaGF2ZS5wcm9wZXJ0eSgnc2l6ZScsIDMpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoWzEsIDIsIDNdKSkudG8ubm90LmJlLmVtcHR5OyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChPYmplY3Qua2V5cyh7YTogMX0pKS50by5oYXZlLmxlbmd0aE9mKDEpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8ubm90LmJlLmVtcHR5OyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10sICdub29vIHdoeSBmYWlsPz8nKS50by5iZS5lbXB0eTtcbiAgICpcbiAgICogQG5hbWUgZW1wdHlcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdlbXB0eScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdmFsID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIGl0ZW1zQ291bnQ7XG5cbiAgICBmbGFnTXNnID0gZmxhZ01zZyA/IGZsYWdNc2cgKyAnOiAnIDogJyc7XG5cbiAgICBzd2l0Y2ggKF8udHlwZSh2YWwpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgIGNhc2UgJ2FycmF5JzpcbiAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgIGl0ZW1zQ291bnQgPSB2YWwubGVuZ3RoO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21hcCc6XG4gICAgICBjYXNlICdzZXQnOlxuICAgICAgICBpdGVtc0NvdW50ID0gdmFsLnNpemU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnd2Vha21hcCc6XG4gICAgICBjYXNlICd3ZWFrc2V0JzpcbiAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGZsYWdNc2cgKyAnLmVtcHR5IHdhcyBwYXNzZWQgYSB3ZWFrIGNvbGxlY3Rpb24nLFxuICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICBzc2ZpXG4gICAgICAgICk7XG4gICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgIHZhciBtc2cgPSBmbGFnTXNnICsgJy5lbXB0eSB3YXMgcGFzc2VkIGEgZnVuY3Rpb24gJyArIF8uZ2V0TmFtZSh2YWwpO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnLnRyaW0oKSwgdW5kZWZpbmVkLCBzc2ZpKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICh2YWwgIT09IE9iamVjdCh2YWwpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgICAgZmxhZ01zZyArICcuZW1wdHkgd2FzIHBhc3NlZCBub24tc3RyaW5nIHByaW1pdGl2ZSAnICsgXy5pbnNwZWN0KHZhbCksXG4gICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICBzc2ZpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBpdGVtc0NvdW50ID0gT2JqZWN0LmtleXModmFsKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIDAgPT09IGl0ZW1zQ291bnRcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgZW1wdHknXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IG5vdCB0byBiZSBlbXB0eSdcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5hcmd1bWVudHNcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICAgKlxuICAgKiAgICAgZnVuY3Rpb24gdGVzdCAoKSB7XG4gICAqICAgICAgIGV4cGVjdChhcmd1bWVudHMpLnRvLmJlLmFyZ3VtZW50cztcbiAgICogICAgIH1cbiAgICpcbiAgICogICAgIHRlc3QoKTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5hcmd1bWVudHNgLiBIb3dldmVyLCBpdCdzIG9mdGVuXG4gICAqIGJlc3QgdG8gYXNzZXJ0IHdoaWNoIHR5cGUgdGhlIHRhcmdldCBpcyBleHBlY3RlZCB0byBiZSwgcmF0aGVyIHRoYW5cbiAgICogYXNzZXJ0aW5nIHRoYXQgaXRzIG5vdCBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmJlLmEoJ3N0cmluZycpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KCdmb28nKS50by5ub3QuYmUuYXJndW1lbnRzOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7fSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLmFyZ3VtZW50cztcbiAgICpcbiAgICogVGhlIGFsaWFzIGAuQXJndW1lbnRzYCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLmFyZ3VtZW50c2AuXG4gICAqXG4gICAqIEBuYW1lIGFyZ3VtZW50c1xuICAgKiBAYWxpYXMgQXJndW1lbnRzXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGNoZWNrQXJndW1lbnRzICgpIHtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgdHlwZSA9IF8udHlwZShvYmopO1xuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAnQXJndW1lbnRzJyA9PT0gdHlwZVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBhcmd1bWVudHMgYnV0IGdvdCAnICsgdHlwZVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgYmUgYXJndW1lbnRzJ1xuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ2FyZ3VtZW50cycsIGNoZWNrQXJndW1lbnRzKTtcbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdBcmd1bWVudHMnLCBjaGVja0FyZ3VtZW50cyk7XG5cbiAgLyoqXG4gICAqICMjIyAuZXF1YWwodmFsWywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgc3RyaWN0bHkgKGA9PT1gKSBlcXVhbCB0byB0aGUgZ2l2ZW4gYHZhbGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMSk7XG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmVxdWFsKCdmb28nKTtcbiAgICogXG4gICAqIEFkZCBgLmRlZXBgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIHVzZSBkZWVwIGVxdWFsaXR5IGluc3RlYWQuIFNlZSB0aGVcbiAgICogYGRlZXAtZXFsYCBwcm9qZWN0IHBhZ2UgZm9yIGluZm8gb24gdGhlIGRlZXAgZXF1YWxpdHkgYWxnb3JpdGhtOlxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2RlZXAtZXFsLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IG9iamVjdCBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGVxdWFscyBge2E6IDF9YFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uZGVlcC5lcXVhbCh7YTogMX0pO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8ubm90LmVxdWFsKHthOiAxfSk7XG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgYXJyYXkgZGVlcGx5IChidXQgbm90IHN0cmljdGx5KSBlcXVhbHMgYFsxLCAyXWBcbiAgICogICAgIGV4cGVjdChbMSwgMl0pLnRvLmRlZXAuZXF1YWwoWzEsIDJdKTtcbiAgICogICAgIGV4cGVjdChbMSwgMl0pLnRvLm5vdC5lcXVhbChbMSwgMl0pO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmVxdWFsYC4gSG93ZXZlciwgaXQncyBvZnRlblxuICAgKiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLCByYXRoZXIgdGhhblxuICAgKiBub3QgZXF1YWwgdG8gb25lIG9mIGNvdW50bGVzcyB1bmV4cGVjdGVkIHZhbHVlcy5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5lcXVhbCgxKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuZXF1YWwoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBgLmVxdWFsYCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZVxuICAgKiBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMiwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KDEsICdub29vIHdoeSBmYWlsPz8nKS50by5lcXVhbCgyKTtcbiAgICpcbiAgICogVGhlIGFsaWFzZXMgYC5lcXVhbHNgIGFuZCBgZXFgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAuZXF1YWxgLlxuICAgKlxuICAgKiBAbmFtZSBlcXVhbFxuICAgKiBAYWxpYXMgZXF1YWxzXG4gICAqIEBhbGlhcyBlcVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWxcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydEVxdWFsICh2YWwsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBvYmogPSBmbGFnKHRoaXMsICdvYmplY3QnKTtcbiAgICBpZiAoZmxhZyh0aGlzLCAnZGVlcCcpKSB7XG4gICAgICByZXR1cm4gdGhpcy5lcWwodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgdmFsID09PSBvYmpcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBlcXVhbCAje2V4cH0nXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGVxdWFsICN7ZXhwfSdcbiAgICAgICAgLCB2YWxcbiAgICAgICAgLCB0aGlzLl9vYmpcbiAgICAgICAgLCB0cnVlXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2VxdWFsJywgYXNzZXJ0RXF1YWwpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdlcXVhbHMnLCBhc3NlcnRFcXVhbCk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2VxJywgYXNzZXJ0RXF1YWwpO1xuXG4gIC8qKlxuICAgKiAjIyMgLmVxbChvYmpbLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBkZWVwbHkgZXF1YWwgdG8gdGhlIGdpdmVuIGBvYmpgLiBTZWUgdGhlXG4gICAqIGBkZWVwLWVxbGAgcHJvamVjdCBwYWdlIGZvciBpbmZvIG9uIHRoZSBkZWVwIGVxdWFsaXR5IGFsZ29yaXRobTpcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9kZWVwLWVxbC5cbiAgICpcbiAgICogICAgIC8vIFRhcmdldCBvYmplY3QgaXMgZGVlcGx5IChidXQgbm90IHN0cmljdGx5KSBlcXVhbCB0byB7YTogMX1cbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmVxbCh7YTogMX0pLmJ1dC5ub3QuZXF1YWwoe2E6IDF9KTtcbiAgICpcbiAgICogICAgIC8vIFRhcmdldCBhcnJheSBpcyBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGVxdWFsIHRvIFsxLCAyXVxuICAgKiAgICAgZXhwZWN0KFsxLCAyXSkudG8uZXFsKFsxLCAyXSkuYnV0Lm5vdC5lcXVhbChbMSwgMl0pO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmVxbGAuIEhvd2V2ZXIsIGl0J3Mgb2Z0ZW4gYmVzdFxuICAgKiB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0IGlzIGRlZXBseSBlcXVhbCB0byBpdHMgZXhwZWN0ZWQgdmFsdWUsIHJhdGhlclxuICAgKiB0aGFuIG5vdCBkZWVwbHkgZXF1YWwgdG8gb25lIG9mIGNvdW50bGVzcyB1bmV4cGVjdGVkIHZhbHVlcy5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmVxbCh7YTogMX0pOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8ubm90LmVxbCh7YjogMn0pOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogYC5lcWxgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3IgbWVzc2FnZVxuICAgKiB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXMgdGhlXG4gICAqIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmVxbCh7YjogMn0sICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCh7YTogMX0sICdub29vIHdoeSBmYWlsPz8nKS50by5lcWwoe2I6IDJ9KTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAuZXFsc2AgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5IHdpdGggYC5lcWxgLlxuICAgKlxuICAgKiBUaGUgYC5kZWVwLmVxdWFsYCBhc3NlcnRpb24gaXMgYWxtb3N0IGlkZW50aWNhbCB0byBgLmVxbGAgYnV0IHdpdGggb25lXG4gICAqIGRpZmZlcmVuY2U6IGAuZGVlcC5lcXVhbGAgY2F1c2VzIGRlZXAgZXF1YWxpdHkgY29tcGFyaXNvbnMgdG8gYWxzbyBiZSB1c2VkXG4gICAqIGZvciBhbnkgb3RoZXIgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW4uXG4gICAqXG4gICAqIEBuYW1lIGVxbFxuICAgKiBAYWxpYXMgZXFsc1xuICAgKiBAcGFyYW0ge01peGVkfSBvYmpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydEVxbChvYmosIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICBfLmVxbChvYmosIGZsYWcodGhpcywgJ29iamVjdCcpKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBkZWVwbHkgZXF1YWwgI3tleHB9J1xuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgZGVlcGx5IGVxdWFsICN7ZXhwfSdcbiAgICAgICwgb2JqXG4gICAgICAsIHRoaXMuX29ialxuICAgICAgLCB0cnVlXG4gICAgKTtcbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2VxbCcsIGFzc2VydEVxbCk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2VxbHMnLCBhc3NlcnRFcWwpO1xuXG4gIC8qKlxuICAgKiAjIyMgLmFib3ZlKG5bLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBhIG51bWJlciBvciBhIGRhdGUgZ3JlYXRlciB0aGFuIHRoZSBnaXZlbiBudW1iZXIgb3IgZGF0ZSBgbmAgcmVzcGVjdGl2ZWx5LlxuICAgKiBIb3dldmVyLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHRhcmdldCBpcyBlcXVhbCB0byBpdHMgZXhwZWN0ZWRcbiAgICogdmFsdWUuXG4gICAqXG4gICAqICAgICBleHBlY3QoMikudG8uZXF1YWwoMik7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMikudG8uYmUuYWJvdmUoMSk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5sZW5ndGhPZmAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gYXNzZXJ0IHRoYXQgdGhlIHZhbHVlIG9mIHRoZVxuICAgKiB0YXJnZXQncyBgbGVuZ3RoYCBwcm9wZXJ0eSBpcyBncmVhdGVyIHRoYW4gdGhlIGdpdmVuIG51bWJlciBgbmAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmhhdmUubGVuZ3RoT2YoMyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmhhdmUubGVuZ3RoT2YuYWJvdmUoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaGF2ZS5sZW5ndGhPZigzKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YuYWJvdmUoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmFib3ZlYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgyKS50by5lcXVhbCgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuYmUuYWJvdmUoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBgLmFib3ZlYCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZVxuICAgKiBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uYmUuYWJvdmUoMiwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KDEsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS5hYm92ZSgyKTtcbiAgICpcbiAgICogVGhlIGFsaWFzZXMgYC5ndGAgYW5kIGAuZ3JlYXRlclRoYW5gIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoXG4gICAqIGAuYWJvdmVgLlxuICAgKlxuICAgKiBAbmFtZSBhYm92ZVxuICAgKiBAYWxpYXMgZ3RcbiAgICogQGFsaWFzIGdyZWF0ZXJUaGFuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhc3NlcnRBYm92ZSAobiwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGRvTGVuZ3RoID0gZmxhZyh0aGlzLCAnZG9MZW5ndGgnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIG1zZ1ByZWZpeCA9ICgoZmxhZ01zZykgPyBmbGFnTXNnICsgJzogJyA6ICcnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpXG4gICAgICAsIG9ialR5cGUgPSBfLnR5cGUob2JqKS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG5UeXBlID0gXy50eXBlKG4pLnRvTG93ZXJDYXNlKClcbiAgICAgICwgc2hvdWxkVGhyb3cgPSB0cnVlO1xuXG4gICAgaWYgKGRvTGVuZ3RoKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghZG9MZW5ndGggJiYgKG9ialR5cGUgPT09ICdkYXRlJyAmJiBuVHlwZSAhPT0gJ2RhdGUnKSkge1xuICAgICAgZXJyb3JNZXNzYWdlID0gbXNnUHJlZml4ICsgJ3RoZSBhcmd1bWVudCB0byBhYm92ZSBtdXN0IGJlIGEgZGF0ZSc7XG4gICAgfSBlbHNlIGlmIChuVHlwZSAhPT0gJ251bWJlcicgJiYgKGRvTGVuZ3RoIHx8IG9ialR5cGUgPT09ICdudW1iZXInKSkge1xuICAgICAgZXJyb3JNZXNzYWdlID0gbXNnUHJlZml4ICsgJ3RoZSBhcmd1bWVudCB0byBhYm92ZSBtdXN0IGJlIGEgbnVtYmVyJztcbiAgICB9IGVsc2UgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSAhPT0gJ2RhdGUnICYmIG9ialR5cGUgIT09ICdudW1iZXInKSkge1xuICAgICAgdmFyIHByaW50T2JqID0gKG9ialR5cGUgPT09ICdzdHJpbmcnKSA/IFwiJ1wiICsgb2JqICsgXCInXCIgOiBvYmo7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAnZXhwZWN0ZWQgJyArIHByaW50T2JqICsgJyB0byBiZSBhIG51bWJlciBvciBhIGRhdGUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaG91bGRUaHJvdyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRUaHJvdykge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKGVycm9yTWVzc2FnZSwgdW5kZWZpbmVkLCBzc2ZpKTtcbiAgICB9XG5cbiAgICBpZiAoZG9MZW5ndGgpIHtcbiAgICAgIHZhciBsZW4gPSBvYmoubGVuZ3RoO1xuICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgbGVuID4gblxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYSBsZW5ndGggYWJvdmUgI3tleHB9IGJ1dCBnb3QgI3thY3R9J1xuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBoYXZlIGEgbGVuZ3RoIGFib3ZlICN7ZXhwfSdcbiAgICAgICAgLCBuXG4gICAgICAgICwgbGVuXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICBvYmogPiBuXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgYWJvdmUgI3tleHB9J1xuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGF0IG1vc3QgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnYWJvdmUnLCBhc3NlcnRBYm92ZSk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2d0JywgYXNzZXJ0QWJvdmUpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdncmVhdGVyVGhhbicsIGFzc2VydEFib3ZlKTtcblxuICAvKipcbiAgICogIyMjIC5sZWFzdChuWywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgYSBudW1iZXIgb3IgYSBkYXRlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgZ2l2ZW5cbiAgICogbnVtYmVyIG9yIGRhdGUgYG5gIHJlc3BlY3RpdmVseS4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG9cbiAgICogaXRzIGV4cGVjdGVkIHZhbHVlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmVxdWFsKDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmJlLmF0LmxlYXN0KDEpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgyKS50by5iZS5hdC5sZWFzdCgyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLmxlbmd0aE9mYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBhc3NlcnQgdGhhdCB0aGUgdmFsdWUgb2YgdGhlXG4gICAqIHRhcmdldCdzIGBsZW5ndGhgIHByb3BlcnR5IGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byB0aGUgZ2l2ZW4gbnVtYmVyXG4gICAqIGBuYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZigzKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZi5hdC5sZWFzdCgyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mKDMpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaGF2ZS5sZW5ndGhPZi5hdC5sZWFzdCgyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAubGVhc3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmVxdWFsKDEpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDEpLnRvLm5vdC5iZS5hdC5sZWFzdCgyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAubGVhc3RgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3IgbWVzc2FnZVxuICAgKiB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXMgdGhlXG4gICAqIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5iZS5hdC5sZWFzdCgyLCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqICAgICBleHBlY3QoMSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLmF0LmxlYXN0KDIpO1xuICAgKlxuICAgKiBUaGUgYWxpYXMgYC5ndGVgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAubGVhc3RgLlxuICAgKlxuICAgKiBAbmFtZSBsZWFzdFxuICAgKiBAYWxpYXMgZ3RlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhc3NlcnRMZWFzdCAobiwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGRvTGVuZ3RoID0gZmxhZyh0aGlzLCAnZG9MZW5ndGgnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIG1zZ1ByZWZpeCA9ICgoZmxhZ01zZykgPyBmbGFnTXNnICsgJzogJyA6ICcnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpXG4gICAgICAsIG9ialR5cGUgPSBfLnR5cGUob2JqKS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG5UeXBlID0gXy50eXBlKG4pLnRvTG93ZXJDYXNlKClcbiAgICAgICwgc2hvdWxkVGhyb3cgPSB0cnVlO1xuXG4gICAgaWYgKGRvTGVuZ3RoKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gICAgfVxuXG4gICAgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSA9PT0gJ2RhdGUnICYmIG5UeXBlICE9PSAnZGF0ZScpKSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAndGhlIGFyZ3VtZW50IHRvIGxlYXN0IG11c3QgYmUgYSBkYXRlJztcbiAgICB9IGVsc2UgaWYgKG5UeXBlICE9PSAnbnVtYmVyJyAmJiAoZG9MZW5ndGggfHwgb2JqVHlwZSA9PT0gJ251bWJlcicpKSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAndGhlIGFyZ3VtZW50IHRvIGxlYXN0IG11c3QgYmUgYSBudW1iZXInO1xuICAgIH0gZWxzZSBpZiAoIWRvTGVuZ3RoICYmIChvYmpUeXBlICE9PSAnZGF0ZScgJiYgb2JqVHlwZSAhPT0gJ251bWJlcicpKSB7XG4gICAgICB2YXIgcHJpbnRPYmogPSAob2JqVHlwZSA9PT0gJ3N0cmluZycpID8gXCInXCIgKyBvYmogKyBcIidcIiA6IG9iajtcbiAgICAgIGVycm9yTWVzc2FnZSA9IG1zZ1ByZWZpeCArICdleHBlY3RlZCAnICsgcHJpbnRPYmogKyAnIHRvIGJlIGEgbnVtYmVyIG9yIGEgZGF0ZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3VsZFRocm93ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFRocm93KSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoZXJyb3JNZXNzYWdlLCB1bmRlZmluZWQsIHNzZmkpO1xuICAgIH1cblxuICAgIGlmIChkb0xlbmd0aCkge1xuICAgICAgdmFyIGxlbiA9IG9iai5sZW5ndGg7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICBsZW4gPj0gblxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYSBsZW5ndGggYXQgbGVhc3QgI3tleHB9IGJ1dCBnb3QgI3thY3R9J1xuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYSBsZW5ndGggYmVsb3cgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICAgLCBsZW5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIG9iaiA+PSBuXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgYXQgbGVhc3QgI3tleHB9J1xuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGJlbG93ICN7ZXhwfSdcbiAgICAgICAgLCBuXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2xlYXN0JywgYXNzZXJ0TGVhc3QpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdndGUnLCBhc3NlcnRMZWFzdCk7XG5cbiAgLyoqXG4gICAqICMjIyAuYmVsb3coblssIG1zZ10pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGEgbnVtYmVyIG9yIGEgZGF0ZSBsZXNzIHRoYW4gdGhlIGdpdmVuIG51bWJlciBvciBkYXRlIGBuYCByZXNwZWN0aXZlbHkuXG4gICAqIEhvd2V2ZXIsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0IGlzIGVxdWFsIHRvIGl0cyBleHBlY3RlZFxuICAgKiB2YWx1ZS5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5lcXVhbCgxKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5iZS5iZWxvdygyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLmxlbmd0aE9mYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBhc3NlcnQgdGhhdCB0aGUgdmFsdWUgb2YgdGhlXG4gICAqIHRhcmdldCdzIGBsZW5ndGhgIHByb3BlcnR5IGlzIGxlc3MgdGhhbiB0aGUgZ2l2ZW4gbnVtYmVyIGBuYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZigzKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZi5iZWxvdyg0KTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aCgzKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YuYmVsb3coNCk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmJlbG93YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgyKS50by5lcXVhbCgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgyKS50by5ub3QuYmUuYmVsb3coMSk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBgLmJlbG93YCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZVxuICAgKiBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMikudG8uYmUuYmVsb3coMSwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KDIsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS5iZWxvdygxKTtcbiAgICpcbiAgICogVGhlIGFsaWFzZXMgYC5sdGAgYW5kIGAubGVzc1RoYW5gIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoXG4gICAqIGAuYmVsb3dgLlxuICAgKlxuICAgKiBAbmFtZSBiZWxvd1xuICAgKiBAYWxpYXMgbHRcbiAgICogQGFsaWFzIGxlc3NUaGFuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhc3NlcnRCZWxvdyAobiwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGRvTGVuZ3RoID0gZmxhZyh0aGlzLCAnZG9MZW5ndGgnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIG1zZ1ByZWZpeCA9ICgoZmxhZ01zZykgPyBmbGFnTXNnICsgJzogJyA6ICcnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpXG4gICAgICAsIG9ialR5cGUgPSBfLnR5cGUob2JqKS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG5UeXBlID0gXy50eXBlKG4pLnRvTG93ZXJDYXNlKClcbiAgICAgICwgc2hvdWxkVGhyb3cgPSB0cnVlO1xuXG4gICAgaWYgKGRvTGVuZ3RoKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gICAgfVxuXG4gICAgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSA9PT0gJ2RhdGUnICYmIG5UeXBlICE9PSAnZGF0ZScpKSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAndGhlIGFyZ3VtZW50IHRvIGJlbG93IG11c3QgYmUgYSBkYXRlJztcbiAgICB9IGVsc2UgaWYgKG5UeXBlICE9PSAnbnVtYmVyJyAmJiAoZG9MZW5ndGggfHwgb2JqVHlwZSA9PT0gJ251bWJlcicpKSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAndGhlIGFyZ3VtZW50IHRvIGJlbG93IG11c3QgYmUgYSBudW1iZXInO1xuICAgIH0gZWxzZSBpZiAoIWRvTGVuZ3RoICYmIChvYmpUeXBlICE9PSAnZGF0ZScgJiYgb2JqVHlwZSAhPT0gJ251bWJlcicpKSB7XG4gICAgICB2YXIgcHJpbnRPYmogPSAob2JqVHlwZSA9PT0gJ3N0cmluZycpID8gXCInXCIgKyBvYmogKyBcIidcIiA6IG9iajtcbiAgICAgIGVycm9yTWVzc2FnZSA9IG1zZ1ByZWZpeCArICdleHBlY3RlZCAnICsgcHJpbnRPYmogKyAnIHRvIGJlIGEgbnVtYmVyIG9yIGEgZGF0ZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3VsZFRocm93ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFRocm93KSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoZXJyb3JNZXNzYWdlLCB1bmRlZmluZWQsIHNzZmkpO1xuICAgIH1cblxuICAgIGlmIChkb0xlbmd0aCkge1xuICAgICAgdmFyIGxlbiA9IG9iai5sZW5ndGg7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICBsZW4gPCBuXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gaGF2ZSBhIGxlbmd0aCBiZWxvdyAje2V4cH0gYnV0IGdvdCAje2FjdH0nXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGhhdmUgYSBsZW5ndGggYmVsb3cgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICAgLCBsZW5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIG9iaiA8IG5cbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBiZWxvdyAje2V4cH0nXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgYXQgbGVhc3QgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnYmVsb3cnLCBhc3NlcnRCZWxvdyk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2x0JywgYXNzZXJ0QmVsb3cpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdsZXNzVGhhbicsIGFzc2VydEJlbG93KTtcblxuICAvKipcbiAgICogIyMjIC5tb3N0KG5bLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBhIG51bWJlciBvciBhIGRhdGUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBnaXZlbiBudW1iZXJcbiAgICogb3IgZGF0ZSBgbmAgcmVzcGVjdGl2ZWx5LiBIb3dldmVyLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHRhcmdldCBpcyBlcXVhbCB0byBpdHNcbiAgICogZXhwZWN0ZWQgdmFsdWUuXG4gICAqXG4gICAqICAgICBleHBlY3QoMSkudG8uZXF1YWwoMSk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMSkudG8uYmUuYXQubW9zdCgyKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMSkudG8uYmUuYXQubW9zdCgxKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLmxlbmd0aE9mYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBhc3NlcnQgdGhhdCB0aGUgdmFsdWUgb2YgdGhlXG4gICAqIHRhcmdldCdzIGBsZW5ndGhgIHByb3BlcnR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byB0aGUgZ2l2ZW4gbnVtYmVyIGBuYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZigzKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgnZm9vJykudG8uaGF2ZS5sZW5ndGhPZi5hdC5tb3N0KDQpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YoMyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mLmF0Lm1vc3QoNCk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLm1vc3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmVxdWFsKDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDIpLnRvLm5vdC5iZS5hdC5tb3N0KDEpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogYC5tb3N0YCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZVxuICAgKiBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoMikudG8uYmUuYXQubW9zdCgxLCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqICAgICBleHBlY3QoMiwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLmF0Lm1vc3QoMSk7XG4gICAqXG4gICAqIFRoZSBhbGlhcyBgLmx0ZWAgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5IHdpdGggYC5tb3N0YC5cbiAgICpcbiAgICogQG5hbWUgbW9zdFxuICAgKiBAYWxpYXMgbHRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhc3NlcnRNb3N0IChuLCBtc2cpIHtcbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgZG9MZW5ndGggPSBmbGFnKHRoaXMsICdkb0xlbmd0aCcpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgbXNnUHJlZml4ID0gKChmbGFnTXNnKSA/IGZsYWdNc2cgKyAnOiAnIDogJycpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJylcbiAgICAgICwgb2JqVHlwZSA9IF8udHlwZShvYmopLnRvTG93ZXJDYXNlKClcbiAgICAgICwgblR5cGUgPSBfLnR5cGUobikudG9Mb3dlckNhc2UoKVxuICAgICAgLCBzaG91bGRUaHJvdyA9IHRydWU7XG5cbiAgICBpZiAoZG9MZW5ndGgpIHtcbiAgICAgIG5ldyBBc3NlcnRpb24ob2JqLCBmbGFnTXNnLCBzc2ZpLCB0cnVlKS50by5oYXZlLnByb3BlcnR5KCdsZW5ndGgnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSA9PT0gJ2RhdGUnICYmIG5UeXBlICE9PSAnZGF0ZScpKSB7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAndGhlIGFyZ3VtZW50IHRvIG1vc3QgbXVzdCBiZSBhIGRhdGUnO1xuICAgIH0gZWxzZSBpZiAoblR5cGUgIT09ICdudW1iZXInICYmIChkb0xlbmd0aCB8fCBvYmpUeXBlID09PSAnbnVtYmVyJykpIHtcbiAgICAgIGVycm9yTWVzc2FnZSA9IG1zZ1ByZWZpeCArICd0aGUgYXJndW1lbnQgdG8gbW9zdCBtdXN0IGJlIGEgbnVtYmVyJztcbiAgICB9IGVsc2UgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSAhPT0gJ2RhdGUnICYmIG9ialR5cGUgIT09ICdudW1iZXInKSkge1xuICAgICAgdmFyIHByaW50T2JqID0gKG9ialR5cGUgPT09ICdzdHJpbmcnKSA/IFwiJ1wiICsgb2JqICsgXCInXCIgOiBvYmo7XG4gICAgICBlcnJvck1lc3NhZ2UgPSBtc2dQcmVmaXggKyAnZXhwZWN0ZWQgJyArIHByaW50T2JqICsgJyB0byBiZSBhIG51bWJlciBvciBhIGRhdGUnO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaG91bGRUaHJvdyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChzaG91bGRUaHJvdykge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKGVycm9yTWVzc2FnZSwgdW5kZWZpbmVkLCBzc2ZpKTtcbiAgICB9XG5cbiAgICBpZiAoZG9MZW5ndGgpIHtcbiAgICAgIHZhciBsZW4gPSBvYmoubGVuZ3RoO1xuICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgbGVuIDw9IG5cbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBoYXZlIGEgbGVuZ3RoIGF0IG1vc3QgI3tleHB9IGJ1dCBnb3QgI3thY3R9J1xuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYSBsZW5ndGggYWJvdmUgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICAgLCBsZW5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIG9iaiA8PSBuXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgYXQgbW9zdCAje2V4cH0nXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgYWJvdmUgI3tleHB9J1xuICAgICAgICAsIG5cbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnbW9zdCcsIGFzc2VydE1vc3QpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdsdGUnLCBhc3NlcnRNb3N0KTtcblxuICAvKipcbiAgICogIyMjIC53aXRoaW4oc3RhcnQsIGZpbmlzaFssIG1zZ10pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGEgbnVtYmVyIG9yIGEgZGF0ZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIGdpdmVuXG4gICAqIG51bWJlciBvciBkYXRlIGBzdGFydGAsIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIGdpdmVuIG51bWJlciBvciBkYXRlIGBmaW5pc2hgIHJlc3BlY3RpdmVseS5cbiAgICogSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkXG4gICAqIHZhbHVlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmVxdWFsKDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDIpLnRvLmJlLndpdGhpbigxLCAzKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoMikudG8uYmUud2l0aGluKDIsIDMpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgyKS50by5iZS53aXRoaW4oMSwgMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5sZW5ndGhPZmAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gYXNzZXJ0IHRoYXQgdGhlIHZhbHVlIG9mIHRoZVxuICAgKiB0YXJnZXQncyBgbGVuZ3RoYCBwcm9wZXJ0eSBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlIGdpdmVuIG51bWJlclxuICAgKiBgc3RhcnRgLCBhbmQgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIHRoZSBnaXZlbiBudW1iZXIgYGZpbmlzaGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmhhdmUubGVuZ3RoT2YoMyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmhhdmUubGVuZ3RoT2Yud2l0aGluKDIsIDQpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YoMyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mLndpdGhpbigyLCA0KTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAud2l0aGluYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5lcXVhbCgxKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuYmUud2l0aGluKDIsIDQpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogYC53aXRoaW5gIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCg0KS50by5iZS53aXRoaW4oMSwgMywgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KDQsICdub29vIHdoeSBmYWlsPz8nKS50by5iZS53aXRoaW4oMSwgMyk7XG4gICAqXG4gICAqIEBuYW1lIHdpdGhpblxuICAgKiBAcGFyYW0ge051bWJlcn0gc3RhcnQgbG93ZXIgYm91bmQgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBmaW5pc2ggdXBwZXIgYm91bmQgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCd3aXRoaW4nLCBmdW5jdGlvbiAoc3RhcnQsIGZpbmlzaCwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGRvTGVuZ3RoID0gZmxhZyh0aGlzLCAnZG9MZW5ndGgnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIG1zZ1ByZWZpeCA9ICgoZmxhZ01zZykgPyBmbGFnTXNnICsgJzogJyA6ICcnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpXG4gICAgICAsIG9ialR5cGUgPSBfLnR5cGUob2JqKS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIHN0YXJ0VHlwZSA9IF8udHlwZShzdGFydCkudG9Mb3dlckNhc2UoKVxuICAgICAgLCBmaW5pc2hUeXBlID0gXy50eXBlKGZpbmlzaCkudG9Mb3dlckNhc2UoKVxuICAgICAgLCBzaG91bGRUaHJvdyA9IHRydWVcbiAgICAgICwgcmFuZ2UgPSAoc3RhcnRUeXBlID09PSAnZGF0ZScgJiYgZmluaXNoVHlwZSA9PT0gJ2RhdGUnKVxuICAgICAgICAgID8gc3RhcnQudG9VVENTdHJpbmcoKSArICcuLicgKyBmaW5pc2gudG9VVENTdHJpbmcoKVxuICAgICAgICAgIDogc3RhcnQgKyAnLi4nICsgZmluaXNoO1xuXG4gICAgaWYgKGRvTGVuZ3RoKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gICAgfVxuXG4gICAgaWYgKCFkb0xlbmd0aCAmJiAob2JqVHlwZSA9PT0gJ2RhdGUnICYmIChzdGFydFR5cGUgIT09ICdkYXRlJyB8fCBmaW5pc2hUeXBlICE9PSAnZGF0ZScpKSkge1xuICAgICAgZXJyb3JNZXNzYWdlID0gbXNnUHJlZml4ICsgJ3RoZSBhcmd1bWVudHMgdG8gd2l0aGluIG11c3QgYmUgZGF0ZXMnO1xuICAgIH0gZWxzZSBpZiAoKHN0YXJ0VHlwZSAhPT0gJ251bWJlcicgfHwgZmluaXNoVHlwZSAhPT0gJ251bWJlcicpICYmIChkb0xlbmd0aCB8fCBvYmpUeXBlID09PSAnbnVtYmVyJykpIHtcbiAgICAgIGVycm9yTWVzc2FnZSA9IG1zZ1ByZWZpeCArICd0aGUgYXJndW1lbnRzIHRvIHdpdGhpbiBtdXN0IGJlIG51bWJlcnMnO1xuICAgIH0gZWxzZSBpZiAoIWRvTGVuZ3RoICYmIChvYmpUeXBlICE9PSAnZGF0ZScgJiYgb2JqVHlwZSAhPT0gJ251bWJlcicpKSB7XG4gICAgICB2YXIgcHJpbnRPYmogPSAob2JqVHlwZSA9PT0gJ3N0cmluZycpID8gXCInXCIgKyBvYmogKyBcIidcIiA6IG9iajtcbiAgICAgIGVycm9yTWVzc2FnZSA9IG1zZ1ByZWZpeCArICdleHBlY3RlZCAnICsgcHJpbnRPYmogKyAnIHRvIGJlIGEgbnVtYmVyIG9yIGEgZGF0ZSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNob3VsZFRocm93ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZFRocm93KSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoZXJyb3JNZXNzYWdlLCB1bmRlZmluZWQsIHNzZmkpO1xuICAgIH1cblxuICAgIGlmIChkb0xlbmd0aCkge1xuICAgICAgdmFyIGxlbiA9IG9iai5sZW5ndGg7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICBsZW4gPj0gc3RhcnQgJiYgbGVuIDw9IGZpbmlzaFxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYSBsZW5ndGggd2l0aGluICcgKyByYW5nZVxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBoYXZlIGEgbGVuZ3RoIHdpdGhpbiAnICsgcmFuZ2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIG9iaiA+PSBzdGFydCAmJiBvYmogPD0gZmluaXNoXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgd2l0aGluICcgKyByYW5nZVxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBiZSB3aXRoaW4gJyArIHJhbmdlXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAuaW5zdGFuY2VvZihjb25zdHJ1Y3RvclssIG1zZ10pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBgY29uc3RydWN0b3JgLlxuICAgKlxuICAgKiAgICAgZnVuY3Rpb24gQ2F0ICgpIHsgfVxuICAgKlxuICAgKiAgICAgZXhwZWN0KG5ldyBDYXQoKSkudG8uYmUuYW4uaW5zdGFuY2VvZihDYXQpO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyXSkudG8uYmUuYW4uaW5zdGFuY2VvZihBcnJheSk7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAuaW5zdGFuY2VvZmAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5ub3QuYmUuYW4uaW5zdGFuY2VvZihBcnJheSk7XG4gICAqXG4gICAqIGAuaW5zdGFuY2VvZmAgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvclxuICAgKiBtZXNzYWdlIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhc1xuICAgKiB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmJlLmFuLmluc3RhbmNlb2YoQXJyYXksICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCgxLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUuYW4uaW5zdGFuY2VvZihBcnJheSk7XG4gICAqXG4gICAqIER1ZSB0byBsaW1pdGF0aW9ucyBpbiBFUzUsIGAuaW5zdGFuY2VvZmAgbWF5IG5vdCBhbHdheXMgd29yayBhcyBleHBlY3RlZFxuICAgKiB3aGVuIHVzaW5nIGEgdHJhbnNwaWxlciBzdWNoIGFzIEJhYmVsIG9yIFR5cGVTY3JpcHQuIEluIHBhcnRpY3VsYXIsIGl0IG1heVxuICAgKiBwcm9kdWNlIHVuZXhwZWN0ZWQgcmVzdWx0cyB3aGVuIHN1YmNsYXNzaW5nIGJ1aWx0LWluIG9iamVjdCBzdWNoIGFzXG4gICAqIGBBcnJheWAsIGBFcnJvcmAsIGFuZCBgTWFwYC4gU2VlIHlvdXIgdHJhbnNwaWxlcidzIGRvY3MgZm9yIGRldGFpbHM6XG4gICAqXG4gICAqIC0gKFtCYWJlbF0oaHR0cHM6Ly9iYWJlbGpzLmlvL2RvY3MvdXNhZ2UvY2F2ZWF0cy8jY2xhc3NlcykpXG4gICAqIC0gKFtUeXBlU2NyaXB0XShodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvd2lraS9CcmVha2luZy1DaGFuZ2VzI2V4dGVuZGluZy1idWlsdC1pbnMtbGlrZS1lcnJvci1hcnJheS1hbmQtbWFwLW1heS1uby1sb25nZXItd29yaykpXG4gICAqXG4gICAqIFRoZSBhbGlhcyBgLmluc3RhbmNlT2ZgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAuaW5zdGFuY2VvZmAuXG4gICAqXG4gICAqIEBuYW1lIGluc3RhbmNlb2ZcbiAgICogQHBhcmFtIHtDb25zdHJ1Y3Rvcn0gY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBhbGlhcyBpbnN0YW5jZU9mXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydEluc3RhbmNlT2YgKGNvbnN0cnVjdG9yLCBtc2cpIHtcbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcblxuICAgIHZhciB0YXJnZXQgPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgIHZhciBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpO1xuICAgIHZhciBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBpc0luc3RhbmNlT2YgPSB0YXJnZXQgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvcjtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBUeXBlRXJyb3IpIHtcbiAgICAgICAgZmxhZ01zZyA9IGZsYWdNc2cgPyBmbGFnTXNnICsgJzogJyA6ICcnO1xuICAgICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgICAgZmxhZ01zZyArICdUaGUgaW5zdGFuY2VvZiBhc3NlcnRpb24gbmVlZHMgYSBjb25zdHJ1Y3RvciBidXQgJ1xuICAgICAgICAgICAgKyBfLnR5cGUoY29uc3RydWN0b3IpICsgJyB3YXMgZ2l2ZW4uJyxcbiAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgc3NmaVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIHZhciBuYW1lID0gXy5nZXROYW1lKGNvbnN0cnVjdG9yKTtcbiAgICBpZiAobmFtZSA9PT0gbnVsbCkge1xuICAgICAgbmFtZSA9ICdhbiB1bm5hbWVkIGNvbnN0cnVjdG9yJztcbiAgICB9XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgaXNJbnN0YW5jZU9mXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGFuIGluc3RhbmNlIG9mICcgKyBuYW1lXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBiZSBhbiBpbnN0YW5jZSBvZiAnICsgbmFtZVxuICAgICk7XG4gIH07XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnaW5zdGFuY2VvZicsIGFzc2VydEluc3RhbmNlT2YpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdpbnN0YW5jZU9mJywgYXNzZXJ0SW5zdGFuY2VPZik7XG5cbiAgLyoqXG4gICAqICMjIyAucHJvcGVydHkobmFtZVssIHZhbFssIG1zZ11dKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBoYXMgYSBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiBrZXkgYG5hbWVgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaGF2ZS5wcm9wZXJ0eSgnYScpO1xuICAgKlxuICAgKiBXaGVuIGB2YWxgIGlzIHByb3ZpZGVkLCBgLnByb3BlcnR5YCBhbHNvIGFzc2VydHMgdGhhdCB0aGUgcHJvcGVydHkncyB2YWx1ZVxuICAgKiBpcyBlcXVhbCB0byB0aGUgZ2l2ZW4gYHZhbGAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLnByb3BlcnR5KCdhJywgMSk7XG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHN0cmljdCAoYD09PWApIGVxdWFsaXR5IGlzIHVzZWQuIEFkZCBgLmRlZXBgIGVhcmxpZXIgaW4gdGhlXG4gICAqIGNoYWluIHRvIHVzZSBkZWVwIGVxdWFsaXR5IGluc3RlYWQuIFNlZSB0aGUgYGRlZXAtZXFsYCBwcm9qZWN0IHBhZ2UgZm9yXG4gICAqIGluZm8gb24gdGhlIGRlZXAgZXF1YWxpdHkgYWxnb3JpdGhtOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWpzL2RlZXAtZXFsLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IG9iamVjdCBkZWVwbHkgKGJ1dCBub3Qgc3RyaWN0bHkpIGhhcyBwcm9wZXJ0eSBgeDoge2E6IDF9YFxuICAgKiAgICAgZXhwZWN0KHt4OiB7YTogMX19KS50by5oYXZlLmRlZXAucHJvcGVydHkoJ3gnLCB7YTogMX0pO1xuICAgKiAgICAgZXhwZWN0KHt4OiB7YTogMX19KS50by5ub3QuaGF2ZS5wcm9wZXJ0eSgneCcsIHthOiAxfSk7XG4gICAqXG4gICAqIFRoZSB0YXJnZXQncyBlbnVtZXJhYmxlIGFuZCBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFyZSBhbHdheXMgaW5jbHVkZWRcbiAgICogaW4gdGhlIHNlYXJjaC4gQnkgZGVmYXVsdCwgYm90aCBvd24gYW5kIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGFyZSBpbmNsdWRlZC5cbiAgICogQWRkIGAub3duYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBleGNsdWRlIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGZyb20gdGhlXG4gICAqIHNlYXJjaC5cbiAgICpcbiAgICogICAgIE9iamVjdC5wcm90b3R5cGUuYiA9IDI7XG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLm93bi5wcm9wZXJ0eSgnYScpO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaGF2ZS5vd24ucHJvcGVydHkoJ2EnLCAxKTtcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmhhdmUucHJvcGVydHkoJ2InKS5idXQubm90Lm93bi5wcm9wZXJ0eSgnYicpOyBcbiAgICpcbiAgICogYC5kZWVwYCBhbmQgYC5vd25gIGNhbiBiZSBjb21iaW5lZC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7eDoge2E6IDF9fSkudG8uaGF2ZS5kZWVwLm93bi5wcm9wZXJ0eSgneCcsIHthOiAxfSk7XG4gICAqXG4gICAqIEFkZCBgLm5lc3RlZGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gZW5hYmxlIGRvdC0gYW5kIGJyYWNrZXQtbm90YXRpb24gd2hlblxuICAgKiByZWZlcmVuY2luZyBuZXN0ZWQgcHJvcGVydGllcy5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YToge2I6IFsneCcsICd5J119fSkudG8uaGF2ZS5uZXN0ZWQucHJvcGVydHkoJ2EuYlsxXScpO1xuICAgKiAgICAgZXhwZWN0KHthOiB7YjogWyd4JywgJ3knXX19KS50by5oYXZlLm5lc3RlZC5wcm9wZXJ0eSgnYS5iWzFdJywgJ3knKTtcbiAgICpcbiAgICogSWYgYC5gIG9yIGBbXWAgYXJlIHBhcnQgb2YgYW4gYWN0dWFsIHByb3BlcnR5IG5hbWUsIHRoZXkgY2FuIGJlIGVzY2FwZWQgYnlcbiAgICogYWRkaW5nIHR3byBiYWNrc2xhc2hlcyBiZWZvcmUgdGhlbS5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7Jy5hJzogeydbYl0nOiAneCd9fSkudG8uaGF2ZS5uZXN0ZWQucHJvcGVydHkoJ1xcXFwuYS5cXFxcW2JcXFxcXScpO1xuICAgKlxuICAgKiBgLmRlZXBgIGFuZCBgLm5lc3RlZGAgY2FuIGJlIGNvbWJpbmVkLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiB7YjogW3tjOiAzfV19fSlcbiAgICogICAgICAgLnRvLmhhdmUuZGVlcC5uZXN0ZWQucHJvcGVydHkoJ2EuYlswXScsIHtjOiAzfSk7XG4gICAqXG4gICAqIGAub3duYCBhbmQgYC5uZXN0ZWRgIGNhbm5vdCBiZSBjb21iaW5lZC5cbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5wcm9wZXJ0eWAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5ub3QuaGF2ZS5wcm9wZXJ0eSgnYicpO1xuICAgKiBcbiAgICogSG93ZXZlciwgaXQncyBkYW5nZXJvdXMgdG8gbmVnYXRlIGAucHJvcGVydHlgIHdoZW4gcHJvdmlkaW5nIGB2YWxgLiBUaGVcbiAgICogcHJvYmxlbSBpcyB0aGF0IGl0IGNyZWF0ZXMgdW5jZXJ0YWluIGV4cGVjdGF0aW9ucyBieSBhc3NlcnRpbmcgdGhhdCB0aGVcbiAgICogdGFyZ2V0IGVpdGhlciBkb2Vzbid0IGhhdmUgYSBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiBrZXkgYG5hbWVgLCBvciB0aGF0IGl0XG4gICAqIGRvZXMgaGF2ZSBhIHByb3BlcnR5IHdpdGggdGhlIGdpdmVuIGtleSBgbmFtZWAgYnV0IGl0cyB2YWx1ZSBpc24ndCBlcXVhbCB0b1xuICAgKiB0aGUgZ2l2ZW4gYHZhbGAuIEl0J3Mgb2Z0ZW4gYmVzdCB0byBpZGVudGlmeSB0aGUgZXhhY3Qgb3V0cHV0IHRoYXQnc1xuICAgKiBleHBlY3RlZCwgYW5kIHRoZW4gd3JpdGUgYW4gYXNzZXJ0aW9uIHRoYXQgb25seSBhY2NlcHRzIHRoYXQgZXhhY3Qgb3V0cHV0LlxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXNuJ3QgZXhwZWN0ZWQgdG8gaGF2ZSBhIHByb3BlcnR5IHdpdGggdGhlIGdpdmVuIGtleVxuICAgKiBgbmFtZWAsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHtiOiAyfSkudG8ubm90LmhhdmUucHJvcGVydHkoJ2EnKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCh7YjogMn0pLnRvLm5vdC5oYXZlLnByb3BlcnR5KCdhJywgMSk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXMgZXhwZWN0ZWQgdG8gaGF2ZSBhIHByb3BlcnR5IHdpdGggdGhlIGdpdmVuIGtleSBgbmFtZWAsXG4gICAqIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgdGhhdCB0aGUgcHJvcGVydHkgaGFzIGl0cyBleHBlY3RlZCB2YWx1ZSwgcmF0aGVyXG4gICAqIHRoYW4gYXNzZXJ0aW5nIHRoYXQgaXQgZG9lc24ndCBoYXZlIG9uZSBvZiBtYW55IHVuZXhwZWN0ZWQgdmFsdWVzLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAzfSkudG8uaGF2ZS5wcm9wZXJ0eSgnYScsIDMpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAzfSkudG8ubm90LmhhdmUucHJvcGVydHkoJ2EnLCAxKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAucHJvcGVydHlgIGNoYW5nZXMgdGhlIHRhcmdldCBvZiBhbnkgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW5cbiAgICogdG8gYmUgdGhlIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBvcmlnaW5hbCB0YXJnZXQgb2JqZWN0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaGF2ZS5wcm9wZXJ0eSgnYScpLnRoYXQuaXMuYSgnbnVtYmVyJyk7XG4gICAqXG4gICAqIGAucHJvcGVydHlgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC4gV2hlbiBub3QgcHJvdmlkaW5nIGB2YWxgLCBvbmx5IHVzZSB0aGVcbiAgICogc2Vjb25kIGZvcm0uXG4gICAqXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaGF2ZS5wcm9wZXJ0eSgnYScsIDIsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCh7YTogMX0sICdub29vIHdoeSBmYWlsPz8nKS50by5oYXZlLnByb3BlcnR5KCdhJywgMik7XG4gICAqICAgICBleHBlY3Qoe2E6IDF9LCAnbm9vbyB3aHkgZmFpbD8/JykudG8uaGF2ZS5wcm9wZXJ0eSgnYicpO1xuICAgKlxuICAgKiAgICAgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLnByb3BlcnR5KCdiJywgdW5kZWZpbmVkLCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqIFxuICAgKiBUaGUgYWJvdmUgYXNzZXJ0aW9uIGlzbid0IHRoZSBzYW1lIHRoaW5nIGFzIG5vdCBwcm92aWRpbmcgYHZhbGAuIEluc3RlYWQsXG4gICAqIGl0J3MgYXNzZXJ0aW5nIHRoYXQgdGhlIHRhcmdldCBvYmplY3QgaGFzIGEgYGJgIHByb3BlcnR5IHRoYXQncyBlcXVhbCB0b1xuICAgKiBgdW5kZWZpbmVkYC5cbiAgICpcbiAgICogVGhlIGFzc2VydGlvbnMgYC5vd25Qcm9wZXJ0eWAgYW5kIGAuaGF2ZU93blByb3BlcnR5YCBjYW4gYmUgdXNlZFxuICAgKiBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLm93bi5wcm9wZXJ0eWAuXG4gICAqXG4gICAqIEBuYW1lIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAcmV0dXJucyB2YWx1ZSBvZiBwcm9wZXJ0eSBmb3IgY2hhaW5pbmdcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gYXNzZXJ0UHJvcGVydHkgKG5hbWUsIHZhbCwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG5cbiAgICB2YXIgaXNOZXN0ZWQgPSBmbGFnKHRoaXMsICduZXN0ZWQnKVxuICAgICAgLCBpc093biA9IGZsYWcodGhpcywgJ293bicpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKTtcblxuICAgIGlmIChpc05lc3RlZCAmJiBpc093bikge1xuICAgICAgZmxhZ01zZyA9IGZsYWdNc2cgPyBmbGFnTXNnICsgJzogJyA6ICcnO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBmbGFnTXNnICsgJ1RoZSBcIm5lc3RlZFwiIGFuZCBcIm93blwiIGZsYWdzIGNhbm5vdCBiZSBjb21iaW5lZC4nLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIHNzZmlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKG9iaiA9PT0gbnVsbCB8fCBvYmogPT09IHVuZGVmaW5lZCkge1xuICAgICAgZmxhZ01zZyA9IGZsYWdNc2cgPyBmbGFnTXNnICsgJzogJyA6ICcnO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBmbGFnTXNnICsgJ1RhcmdldCBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWQuJyxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBzc2ZpXG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBpc0RlZXAgPSBmbGFnKHRoaXMsICdkZWVwJylcbiAgICAgICwgbmVnYXRlID0gZmxhZyh0aGlzLCAnbmVnYXRlJylcbiAgICAgICwgcGF0aEluZm8gPSBpc05lc3RlZCA/IF8uZ2V0UGF0aEluZm8ob2JqLCBuYW1lKSA6IG51bGxcbiAgICAgICwgdmFsdWUgPSBpc05lc3RlZCA/IHBhdGhJbmZvLnZhbHVlIDogb2JqW25hbWVdO1xuXG4gICAgdmFyIGRlc2NyaXB0b3IgPSAnJztcbiAgICBpZiAoaXNEZWVwKSBkZXNjcmlwdG9yICs9ICdkZWVwICc7XG4gICAgaWYgKGlzT3duKSBkZXNjcmlwdG9yICs9ICdvd24gJztcbiAgICBpZiAoaXNOZXN0ZWQpIGRlc2NyaXB0b3IgKz0gJ25lc3RlZCAnO1xuICAgIGRlc2NyaXB0b3IgKz0gJ3Byb3BlcnR5ICc7XG5cbiAgICB2YXIgaGFzUHJvcGVydHk7XG4gICAgaWYgKGlzT3duKSBoYXNQcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIG5hbWUpO1xuICAgIGVsc2UgaWYgKGlzTmVzdGVkKSBoYXNQcm9wZXJ0eSA9IHBhdGhJbmZvLmV4aXN0cztcbiAgICBlbHNlIGhhc1Byb3BlcnR5ID0gXy5oYXNQcm9wZXJ0eShvYmosIG5hbWUpO1xuXG4gICAgLy8gV2hlbiBwZXJmb3JtaW5nIGEgbmVnYXRlZCBhc3NlcnRpb24gZm9yIGJvdGggbmFtZSBhbmQgdmFsLCBtZXJlbHkgaGF2aW5nXG4gICAgLy8gYSBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiBuYW1lIGlzbid0IGVub3VnaCB0byBjYXVzZSB0aGUgYXNzZXJ0aW9uIHRvXG4gICAgLy8gZmFpbC4gSXQgbXVzdCBib3RoIGhhdmUgYSBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiBuYW1lLCBhbmQgdGhlIHZhbHVlIG9mXG4gICAgLy8gdGhhdCBwcm9wZXJ0eSBtdXN0IGVxdWFsIHRoZSBnaXZlbiB2YWwuIFRoZXJlZm9yZSwgc2tpcCB0aGlzIGFzc2VydGlvbiBpblxuICAgIC8vIGZhdm9yIG9mIHRoZSBuZXh0LlxuICAgIGlmICghbmVnYXRlIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIGhhc1Byb3BlcnR5XG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gaGF2ZSAnICsgZGVzY3JpcHRvciArIF8uaW5zcGVjdChuYW1lKVxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBoYXZlICcgKyBkZXNjcmlwdG9yICsgXy5pbnNwZWN0KG5hbWUpKTtcbiAgICB9XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIGhhc1Byb3BlcnR5ICYmIChpc0RlZXAgPyBfLmVxbCh2YWwsIHZhbHVlKSA6IHZhbCA9PT0gdmFsdWUpXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gaGF2ZSAnICsgZGVzY3JpcHRvciArIF8uaW5zcGVjdChuYW1lKSArICcgb2YgI3tleHB9LCBidXQgZ290ICN7YWN0fSdcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgaGF2ZSAnICsgZGVzY3JpcHRvciArIF8uaW5zcGVjdChuYW1lKSArICcgb2YgI3thY3R9J1xuICAgICAgICAsIHZhbFxuICAgICAgICAsIHZhbHVlXG4gICAgICApO1xuICAgIH1cblxuICAgIGZsYWcodGhpcywgJ29iamVjdCcsIHZhbHVlKTtcbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ3Byb3BlcnR5JywgYXNzZXJ0UHJvcGVydHkpO1xuXG4gIGZ1bmN0aW9uIGFzc2VydE93blByb3BlcnR5IChuYW1lLCB2YWx1ZSwgbXNnKSB7XG4gICAgZmxhZyh0aGlzLCAnb3duJywgdHJ1ZSk7XG4gICAgYXNzZXJ0UHJvcGVydHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ293blByb3BlcnR5JywgYXNzZXJ0T3duUHJvcGVydHkpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdoYXZlT3duUHJvcGVydHknLCBhc3NlcnRPd25Qcm9wZXJ0eSk7XG5cbiAgLyoqXG4gICAqICMjIyAub3duUHJvcGVydHlEZXNjcmlwdG9yKG5hbWVbLCBkZXNjcmlwdG9yWywgbXNnXV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGhhcyBpdHMgb3duIHByb3BlcnR5IGRlc2NyaXB0b3Igd2l0aCB0aGUgZ2l2ZW4ga2V5XG4gICAqIGBuYW1lYC4gRW51bWVyYWJsZSBhbmQgbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyBhcmUgaW5jbHVkZWQgaW4gdGhlXG4gICAqIHNlYXJjaC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmhhdmUub3duUHJvcGVydHlEZXNjcmlwdG9yKCdhJyk7XG4gICAqXG4gICAqIFdoZW4gYGRlc2NyaXB0b3JgIGlzIHByb3ZpZGVkLCBgLm93blByb3BlcnR5RGVzY3JpcHRvcmAgYWxzbyBhc3NlcnRzIHRoYXRcbiAgICogdGhlIHByb3BlcnR5J3MgZGVzY3JpcHRvciBpcyBkZWVwbHkgZXF1YWwgdG8gdGhlIGdpdmVuIGBkZXNjcmlwdG9yYC4gU2VlXG4gICAqIHRoZSBgZGVlcC1lcWxgIHByb2plY3QgcGFnZSBmb3IgaW5mbyBvbiB0aGUgZGVlcCBlcXVhbGl0eSBhbGdvcml0aG06XG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvZGVlcC1lcWwuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYScsIHtcbiAgICogICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICogICAgICAgdmFsdWU6IDEsXG4gICAqICAgICB9KTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5vd25Qcm9wZXJ0eURlc2NyaXB0b3JgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8ubm90LmhhdmUub3duUHJvcGVydHlEZXNjcmlwdG9yKCdiJyk7XG4gICAqIFxuICAgKiBIb3dldmVyLCBpdCdzIGRhbmdlcm91cyB0byBuZWdhdGUgYC5vd25Qcm9wZXJ0eURlc2NyaXB0b3JgIHdoZW4gcHJvdmlkaW5nXG4gICAqIGEgYGRlc2NyaXB0b3JgLiBUaGUgcHJvYmxlbSBpcyB0aGF0IGl0IGNyZWF0ZXMgdW5jZXJ0YWluIGV4cGVjdGF0aW9ucyBieVxuICAgKiBhc3NlcnRpbmcgdGhhdCB0aGUgdGFyZ2V0IGVpdGhlciBkb2Vzbid0IGhhdmUgYSBwcm9wZXJ0eSBkZXNjcmlwdG9yIHdpdGhcbiAgICogdGhlIGdpdmVuIGtleSBgbmFtZWAsIG9yIHRoYXQgaXQgZG9lcyBoYXZlIGEgcHJvcGVydHkgZGVzY3JpcHRvciB3aXRoIHRoZVxuICAgKiBnaXZlbiBrZXkgYG5hbWVgIGJ1dCBpdHMgbm90IGRlZXBseSBlcXVhbCB0byB0aGUgZ2l2ZW4gYGRlc2NyaXB0b3JgLiBJdCdzXG4gICAqIG9mdGVuIGJlc3QgdG8gaWRlbnRpZnkgdGhlIGV4YWN0IG91dHB1dCB0aGF0J3MgZXhwZWN0ZWQsIGFuZCB0aGVuIHdyaXRlIGFuXG4gICAqIGFzc2VydGlvbiB0aGF0IG9ubHkgYWNjZXB0cyB0aGF0IGV4YWN0IG91dHB1dC5cbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzbid0IGV4cGVjdGVkIHRvIGhhdmUgYSBwcm9wZXJ0eSBkZXNjcmlwdG9yIHdpdGggdGhlIGdpdmVuXG4gICAqIGtleSBgbmFtZWAsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCh7YjogMn0pLnRvLm5vdC5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYScpO1xuICAgKlxuICAgKiAgICAgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3Qoe2I6IDJ9KS50by5ub3QuaGF2ZS5vd25Qcm9wZXJ0eURlc2NyaXB0b3IoJ2EnLCB7XG4gICAqICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAqICAgICAgIHZhbHVlOiAxLFxuICAgKiAgICAgfSk7XG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpcyBleHBlY3RlZCB0byBoYXZlIGEgcHJvcGVydHkgZGVzY3JpcHRvciB3aXRoIHRoZSBnaXZlblxuICAgKiBrZXkgYG5hbWVgLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHByb3BlcnR5IGhhcyBpdHMgZXhwZWN0ZWRcbiAgICogZGVzY3JpcHRvciwgcmF0aGVyIHRoYW4gYXNzZXJ0aW5nIHRoYXQgaXQgZG9lc24ndCBoYXZlIG9uZSBvZiBtYW55XG4gICAqIHVuZXhwZWN0ZWQgZGVzY3JpcHRvcnMuXG4gICAqXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAzfSkudG8uaGF2ZS5vd25Qcm9wZXJ0eURlc2NyaXB0b3IoJ2EnLCB7XG4gICAqICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAqICAgICAgIHZhbHVlOiAzLFxuICAgKiAgICAgfSk7XG4gICAqXG4gICAqICAgICAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCh7YTogM30pLnRvLm5vdC5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYScsIHtcbiAgICogICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICogICAgICAgdmFsdWU6IDEsXG4gICAqICAgICB9KTtcbiAgICpcbiAgICogYC5vd25Qcm9wZXJ0eURlc2NyaXB0b3JgIGNoYW5nZXMgdGhlIHRhcmdldCBvZiBhbnkgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvd1xuICAgKiBpbiB0aGUgY2hhaW4gdG8gYmUgdGhlIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSBkZXNjcmlwdG9yIGZyb20gdGhlIG9yaWdpbmFsXG4gICAqIHRhcmdldCBvYmplY3QuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYScpXG4gICAqICAgICAgIC50aGF0Lmhhcy5wcm9wZXJ0eSgnZW51bWVyYWJsZScsIHRydWUpO1xuICAgKlxuICAgKiBgLm93blByb3BlcnR5RGVzY3JpcHRvcmAgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhXG4gICAqIGN1c3RvbSBlcnJvciBtZXNzYWdlIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzb1xuICAgKiBiZSBnaXZlbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLiBXaGVuIG5vdCBwcm92aWRpbmdcbiAgICogYGRlc2NyaXB0b3JgLCBvbmx5IHVzZSB0aGUgc2Vjb25kIGZvcm0uXG4gICAqXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaGF2ZS5vd25Qcm9wZXJ0eURlc2NyaXB0b3IoJ2EnLCB7XG4gICAqICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICogICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAqICAgICAgIHZhbHVlOiAyLFxuICAgKiAgICAgfSwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKlxuICAgKiAgICAgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCh7YTogMX0sICdub29vIHdoeSBmYWlsPz8nKS50by5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYScsIHtcbiAgICogICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgKiAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICogICAgICAgdmFsdWU6IDIsXG4gICAqICAgICB9KTtcbiAgICogXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHthOiAxfSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmhhdmUub3duUHJvcGVydHlEZXNjcmlwdG9yKCdiJyk7XG4gICAqXG4gICAqICAgICAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCh7YTogMX0pXG4gICAqICAgICAgIC50by5oYXZlLm93blByb3BlcnR5RGVzY3JpcHRvcignYicsIHVuZGVmaW5lZCwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKlxuICAgKiBUaGUgYWJvdmUgYXNzZXJ0aW9uIGlzbid0IHRoZSBzYW1lIHRoaW5nIGFzIG5vdCBwcm92aWRpbmcgYGRlc2NyaXB0b3JgLlxuICAgKiBJbnN0ZWFkLCBpdCdzIGFzc2VydGluZyB0aGF0IHRoZSB0YXJnZXQgb2JqZWN0IGhhcyBhIGBiYCBwcm9wZXJ0eVxuICAgKiBkZXNjcmlwdG9yIHRoYXQncyBkZWVwbHkgZXF1YWwgdG8gYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqIFRoZSBhbGlhcyBgLmhhdmVPd25Qcm9wZXJ0eURlc2NyaXB0b3JgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoXG4gICAqIGAub3duUHJvcGVydHlEZXNjcmlwdG9yYC5cbiAgICpcbiAgICogQG5hbWUgb3duUHJvcGVydHlEZXNjcmlwdG9yXG4gICAqIEBhbGlhcyBoYXZlT3duUHJvcGVydHlEZXNjcmlwdG9yXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydE93blByb3BlcnR5RGVzY3JpcHRvciAobmFtZSwgZGVzY3JpcHRvciwgbXNnKSB7XG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgbXNnID0gZGVzY3JpcHRvcjtcbiAgICAgIGRlc2NyaXB0b3IgPSBudWxsO1xuICAgIH1cbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0Jyk7XG4gICAgdmFyIGFjdHVhbERlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE9iamVjdChvYmopLCBuYW1lKTtcbiAgICBpZiAoYWN0dWFsRGVzY3JpcHRvciAmJiBkZXNjcmlwdG9yKSB7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICBfLmVxbChkZXNjcmlwdG9yLCBhY3R1YWxEZXNjcmlwdG9yKVxuICAgICAgICAsICdleHBlY3RlZCB0aGUgb3duIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yICcgKyBfLmluc3BlY3QobmFtZSkgKyAnIG9uICN7dGhpc30gdG8gbWF0Y2ggJyArIF8uaW5zcGVjdChkZXNjcmlwdG9yKSArICcsIGdvdCAnICsgXy5pbnNwZWN0KGFjdHVhbERlc2NyaXB0b3IpXG4gICAgICAgICwgJ2V4cGVjdGVkIHRoZSBvd24gcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgJyArIF8uaW5zcGVjdChuYW1lKSArICcgb24gI3t0aGlzfSB0byBub3QgbWF0Y2ggJyArIF8uaW5zcGVjdChkZXNjcmlwdG9yKVxuICAgICAgICAsIGRlc2NyaXB0b3JcbiAgICAgICAgLCBhY3R1YWxEZXNjcmlwdG9yXG4gICAgICAgICwgdHJ1ZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgYWN0dWFsRGVzY3JpcHRvclxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgYW4gb3duIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yICcgKyBfLmluc3BlY3QobmFtZSlcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgaGF2ZSBhbiBvd24gcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgJyArIF8uaW5zcGVjdChuYW1lKVxuICAgICAgKTtcbiAgICB9XG4gICAgZmxhZyh0aGlzLCAnb2JqZWN0JywgYWN0dWFsRGVzY3JpcHRvcik7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdvd25Qcm9wZXJ0eURlc2NyaXB0b3InLCBhc3NlcnRPd25Qcm9wZXJ0eURlc2NyaXB0b3IpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdoYXZlT3duUHJvcGVydHlEZXNjcmlwdG9yJywgYXNzZXJ0T3duUHJvcGVydHlEZXNjcmlwdG9yKTtcblxuICAvKipcbiAgICogIyMjIC5sZW5ndGhPZihuWywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQncyBgbGVuZ3RoYCBwcm9wZXJ0eSBpcyBlcXVhbCB0byB0aGUgZ2l2ZW4gbnVtYmVyXG4gICAqIGBuYC5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YoMyk7XG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmhhdmUubGVuZ3RoT2YoMyk7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAubGVuZ3RoT2ZgLiBIb3dldmVyLCBpdCdzIG9mdGVuXG4gICAqIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHRhcmdldCdzIGBsZW5ndGhgIHByb3BlcnR5IGlzIGVxdWFsIHRvIGl0cyBleHBlY3RlZFxuICAgKiB2YWx1ZSwgcmF0aGVyIHRoYW4gbm90IGVxdWFsIHRvIG9uZSBvZiBtYW55IHVuZXhwZWN0ZWQgdmFsdWVzLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KCdmb28nKS50by5oYXZlLmxlbmd0aE9mKDMpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KCdmb28nKS50by5ub3QuaGF2ZS5sZW5ndGhPZig0KTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAubGVuZ3RoT2ZgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YoMiwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmhhdmUubGVuZ3RoT2YoMik7XG4gICAqXG4gICAqIGAubGVuZ3RoT2ZgIGNhbiBhbHNvIGJlIHVzZWQgYXMgYSBsYW5ndWFnZSBjaGFpbiwgY2F1c2luZyBhbGwgYC5hYm92ZWAsXG4gICAqIGAuYmVsb3dgLCBgLmxlYXN0YCwgYC5tb3N0YCwgYW5kIGAud2l0aGluYCBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZVxuICAgKiBjaGFpbiB0byB1c2UgdGhlIHRhcmdldCdzIGBsZW5ndGhgIHByb3BlcnR5IGFzIHRoZSB0YXJnZXQuIEhvd2V2ZXIsIGl0J3NcbiAgICogb2Z0ZW4gYmVzdCB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0J3MgYGxlbmd0aGAgcHJvcGVydHkgaXMgZXF1YWwgdG8gaXRzXG4gICAqIGV4cGVjdGVkIGxlbmd0aCwgcmF0aGVyIHRoYW4gYXNzZXJ0aW5nIHRoYXQgaXRzIGBsZW5ndGhgIHByb3BlcnR5IGZhbGxzXG4gICAqIHdpdGhpbiBzb21lIHJhbmdlIG9mIHZhbHVlcy5cbiAgICpcbiAgICogICAgIC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mKDMpO1xuICAgKlxuICAgKiAgICAgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mLmFib3ZlKDIpO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaGF2ZS5sZW5ndGhPZi5iZWxvdyg0KTtcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUubGVuZ3RoT2YuYXQubGVhc3QoMyk7XG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mLmF0Lm1vc3QoMyk7XG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLmxlbmd0aE9mLndpdGhpbigyLDQpO1xuICAgKlxuICAgKiBEdWUgdG8gYSBjb21wYXRpYmlsaXR5IGlzc3VlLCB0aGUgYWxpYXMgYC5sZW5ndGhgIGNhbid0IGJlIGNoYWluZWQgZGlyZWN0bHlcbiAgICogb2ZmIG9mIGFuIHVuaW52b2tlZCBtZXRob2Qgc3VjaCBhcyBgLmFgLiBUaGVyZWZvcmUsIGAubGVuZ3RoYCBjYW4ndCBiZSB1c2VkXG4gICAqIGludGVyY2hhbmdlYWJseSB3aXRoIGAubGVuZ3RoT2ZgIGluIGV2ZXJ5IHNpdHVhdGlvbi4gSXQncyByZWNvbW1lbmRlZCB0b1xuICAgKiBhbHdheXMgdXNlIGAubGVuZ3RoT2ZgIGluc3RlYWQgb2YgYC5sZW5ndGhgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaGF2ZS5hLmxlbmd0aCgzKTsgLy8gaW5jb21wYXRpYmxlOyB0aHJvd3MgZXJyb3JcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLmhhdmUuYS5sZW5ndGhPZigzKTsgIC8vIHBhc3NlcyBhcyBleHBlY3RlZFxuICAgKlxuICAgKiBAbmFtZSBsZW5ndGhPZlxuICAgKiBAYWxpYXMgbGVuZ3RoXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBhc3NlcnRMZW5ndGhDaGFpbiAoKSB7XG4gICAgZmxhZyh0aGlzLCAnZG9MZW5ndGgnLCB0cnVlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFzc2VydExlbmd0aCAobiwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKTtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gICAgdmFyIGxlbiA9IG9iai5sZW5ndGg7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgbGVuID09IG5cbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gaGF2ZSBhIGxlbmd0aCBvZiAje2V4cH0gYnV0IGdvdCAje2FjdH0nXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCBoYXZlIGEgbGVuZ3RoIG9mICN7YWN0fSdcbiAgICAgICwgblxuICAgICAgLCBsZW5cbiAgICApO1xuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnbGVuZ3RoJywgYXNzZXJ0TGVuZ3RoLCBhc3NlcnRMZW5ndGhDaGFpbik7XG4gIEFzc2VydGlvbi5hZGRDaGFpbmFibGVNZXRob2QoJ2xlbmd0aE9mJywgYXNzZXJ0TGVuZ3RoLCBhc3NlcnRMZW5ndGhDaGFpbik7XG5cbiAgLyoqXG4gICAqICMjIyAubWF0Y2gocmVbLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24gYHJlYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vYmFyJykudG8ubWF0Y2goL15mb28vKTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5tYXRjaGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2Zvb2JhcicpLnRvLm5vdC5tYXRjaCgvdGFjby8pO1xuICAgKlxuICAgKiBgLm1hdGNoYCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZVxuICAgKiBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2Zvb2JhcicpLnRvLm1hdGNoKC90YWNvLywgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KCdmb29iYXInLCAnbm9vbyB3aHkgZmFpbD8/JykudG8ubWF0Y2goL3RhY28vKTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAubWF0Y2hlc2AgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5IHdpdGggYC5tYXRjaGAuXG4gICAqXG4gICAqIEBuYW1lIG1hdGNoXG4gICAqIEBhbGlhcyBtYXRjaGVzXG4gICAqIEBwYXJhbSB7UmVnRXhwfSByZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIGZ1bmN0aW9uIGFzc2VydE1hdGNoKHJlLCBtc2cpIHtcbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0Jyk7XG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIHJlLmV4ZWMob2JqKVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBtYXRjaCAnICsgcmVcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gbm90IHRvIG1hdGNoICcgKyByZVxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdtYXRjaCcsIGFzc2VydE1hdGNoKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnbWF0Y2hlcycsIGFzc2VydE1hdGNoKTtcblxuICAvKipcbiAgICogIyMjIC5zdHJpbmcoc3RyWywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgc3RyaW5nIGNvbnRhaW5zIHRoZSBnaXZlbiBzdWJzdHJpbmcgYHN0cmAuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2Zvb2JhcicpLnRvLmhhdmUuc3RyaW5nKCdiYXInKTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5zdHJpbmdgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KCdmb29iYXInKS50by5ub3QuaGF2ZS5zdHJpbmcoJ3RhY28nKTtcbiAgICpcbiAgICogYC5zdHJpbmdgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgnZm9vYmFyJykudG8uaGF2ZS5zdHJpbmcoL3RhY28vLCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqICAgICBleHBlY3QoJ2Zvb2JhcicsICdub29vIHdoeSBmYWlsPz8nKS50by5oYXZlLnN0cmluZygvdGFjby8pO1xuICAgKlxuICAgKiBAbmFtZSBzdHJpbmdcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnc3RyaW5nJywgZnVuY3Rpb24gKHN0ciwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKTtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkuaXMuYSgnc3RyaW5nJyk7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgfm9iai5pbmRleE9mKHN0cilcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gY29udGFpbiAnICsgXy5pbnNwZWN0KHN0cilcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGNvbnRhaW4gJyArIF8uaW5zcGVjdChzdHIpXG4gICAgKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAua2V5cyhrZXkxWywga2V5MlssIC4uLl1dKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBvYmplY3QsIGFycmF5LCBtYXAsIG9yIHNldCBoYXMgdGhlIGdpdmVuIGtleXMuIE9ubHlcbiAgICogdGhlIHRhcmdldCdzIG93biBpbmhlcml0ZWQgcHJvcGVydGllcyBhcmUgaW5jbHVkZWQgaW4gdGhlIHNlYXJjaC4gXG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpcyBhbiBvYmplY3Qgb3IgYXJyYXksIGtleXMgY2FuIGJlIHByb3ZpZGVkIGFzIG9uZSBvciBtb3JlXG4gICAqIHN0cmluZyBhcmd1bWVudHMsIGEgc2luZ2xlIGFycmF5IGFyZ3VtZW50LCBvciBhIHNpbmdsZSBvYmplY3QgYXJndW1lbnQuIEluXG4gICAqIHRoZSBsYXR0ZXIgY2FzZSwgb25seSB0aGUga2V5cyBpbiB0aGUgZ2l2ZW4gb2JqZWN0IG1hdHRlcjsgdGhlIHZhbHVlcyBhcmVcbiAgICogaWdub3JlZC5cbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMSwgYjogMn0pLnRvLmhhdmUuYWxsLmtleXMoJ2EnLCAnYicpO1xuICAgKiAgICAgZXhwZWN0KFsneCcsICd5J10pLnRvLmhhdmUuYWxsLmtleXMoMCwgMSk7XG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDEsIGI6IDJ9KS50by5oYXZlLmFsbC5rZXlzKFsnYScsICdiJ10pO1xuICAgKiAgICAgZXhwZWN0KFsneCcsICd5J10pLnRvLmhhdmUuYWxsLmtleXMoWzAsIDFdKTtcbiAgICpcbiAgICogICAgIGV4cGVjdCh7YTogMSwgYjogMn0pLnRvLmhhdmUuYWxsLmtleXMoe2E6IDQsIGI6IDV9KTsgLy8gaWdub3JlIDQgYW5kIDVcbiAgICogICAgIGV4cGVjdChbJ3gnLCAneSddKS50by5oYXZlLmFsbC5rZXlzKHswOiA0LCAxOiA1fSk7IC8vIGlnbm9yZSA0IGFuZCA1XG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpcyBhIG1hcCBvciBzZXQsIGVhY2gga2V5IG11c3QgYmUgcHJvdmlkZWQgYXMgYSBzZXBhcmF0ZVxuICAgKiBhcmd1bWVudC5cbiAgICpcbiAgICogICAgIGV4cGVjdChuZXcgTWFwKFtbJ2EnLCAxXSwgWydiJywgMl1dKSkudG8uaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqICAgICBleHBlY3QobmV3IFNldChbJ2EnLCAnYiddKSkudG8uaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqIEJlY2F1c2UgYC5rZXlzYCBkb2VzIGRpZmZlcmVudCB0aGluZ3MgYmFzZWQgb24gdGhlIHRhcmdldCdzIHR5cGUsIGl0J3NcbiAgICogaW1wb3J0YW50IHRvIGNoZWNrIHRoZSB0YXJnZXQncyB0eXBlIGJlZm9yZSB1c2luZyBgLmtleXNgLiBTZWUgdGhlIGAuYWAgZG9jXG4gICAqIGZvciBpbmZvIG9uIHRlc3RpbmcgYSB0YXJnZXQncyB0eXBlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8uYmUuYW4oJ29iamVjdCcpLnRoYXQuaGFzLmFsbC5rZXlzKCdhJywgJ2InKTtcbiAgICpcbiAgICogQnkgZGVmYXVsdCwgc3RyaWN0IChgPT09YCkgZXF1YWxpdHkgaXMgdXNlZCB0byBjb21wYXJlIGtleXMgb2YgbWFwcyBhbmRcbiAgICogc2V0cy4gQWRkIGAuZGVlcGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gdXNlIGRlZXAgZXF1YWxpdHkgaW5zdGVhZC4gU2VlXG4gICAqIHRoZSBgZGVlcC1lcWxgIHByb2plY3QgcGFnZSBmb3IgaW5mbyBvbiB0aGUgZGVlcCBlcXVhbGl0eSBhbGdvcml0aG06XG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvZGVlcC1lcWwuXG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgc2V0IGRlZXBseSAoYnV0IG5vdCBzdHJpY3RseSkgaGFzIGtleSBge2E6IDF9YFxuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoW3thOiAxfV0pKS50by5oYXZlLmFsbC5kZWVwLmtleXMoW3thOiAxfV0pO1xuICAgKiAgICAgZXhwZWN0KG5ldyBTZXQoW3thOiAxfV0pKS50by5ub3QuaGF2ZS5hbGwua2V5cyhbe2E6IDF9XSk7XG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoZSB0YXJnZXQgbXVzdCBoYXZlIGFsbCBvZiB0aGUgZ2l2ZW4ga2V5cyBhbmQgbm8gbW9yZS4gQWRkXG4gICAqIGAuYW55YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBvbmx5IHJlcXVpcmUgdGhhdCB0aGUgdGFyZ2V0IGhhdmUgYXQgbGVhc3RcbiAgICogb25lIG9mIHRoZSBnaXZlbiBrZXlzLiBBbHNvLCBhZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZVxuICAgKiBgLmtleXNgLiBJdCdzIG9mdGVuIGJlc3QgdG8gYWRkIGAuYW55YCB3aGVuIG5lZ2F0aW5nIGAua2V5c2AsIGFuZCB0byB1c2VcbiAgICogYC5hbGxgIHdoZW4gYXNzZXJ0aW5nIGAua2V5c2Agd2l0aG91dCBuZWdhdGlvbi5cbiAgICpcbiAgICogV2hlbiBuZWdhdGluZyBgLmtleXNgLCBgLmFueWAgaXMgcHJlZmVycmVkIGJlY2F1c2UgYC5ub3QuYW55LmtleXNgIGFzc2VydHNcbiAgICogZXhhY3RseSB3aGF0J3MgZXhwZWN0ZWQgb2YgdGhlIG91dHB1dCwgd2hlcmVhcyBgLm5vdC5hbGwua2V5c2AgY3JlYXRlc1xuICAgKiB1bmNlcnRhaW4gZXhwZWN0YXRpb25zLlxuICAgKlxuICAgKiAgICAgLy8gUmVjb21tZW5kZWQ7IGFzc2VydHMgdGhhdCB0YXJnZXQgZG9lc24ndCBoYXZlIGFueSBvZiB0aGUgZ2l2ZW4ga2V5c1xuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8ubm90LmhhdmUuYW55LmtleXMoJ2MnLCAnZCcpO1xuICAgKlxuICAgKiAgICAgLy8gTm90IHJlY29tbWVuZGVkOyBhc3NlcnRzIHRoYXQgdGFyZ2V0IGRvZXNuJ3QgaGF2ZSBhbGwgb2YgdGhlIGdpdmVuXG4gICAqICAgICAvLyBrZXlzIGJ1dCBtYXkgb3IgbWF5IG5vdCBoYXZlIHNvbWUgb2YgdGhlbVxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8ubm90LmhhdmUuYWxsLmtleXMoJ2MnLCAnZCcpO1xuICAgKlxuICAgKiBXaGVuIGFzc2VydGluZyBgLmtleXNgIHdpdGhvdXQgbmVnYXRpb24sIGAuYWxsYCBpcyBwcmVmZXJyZWQgYmVjYXVzZVxuICAgKiBgLmFsbC5rZXlzYCBhc3NlcnRzIGV4YWN0bHkgd2hhdCdzIGV4cGVjdGVkIG9mIHRoZSBvdXRwdXQsIHdoZXJlYXNcbiAgICogYC5hbnkua2V5c2AgY3JlYXRlcyB1bmNlcnRhaW4gZXhwZWN0YXRpb25zLlxuICAgKlxuICAgKiAgICAgLy8gUmVjb21tZW5kZWQ7IGFzc2VydHMgdGhhdCB0YXJnZXQgaGFzIGFsbCB0aGUgZ2l2ZW4ga2V5c1xuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8uaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqICAgICAvLyBOb3QgcmVjb21tZW5kZWQ7IGFzc2VydHMgdGhhdCB0YXJnZXQgaGFzIGF0IGxlYXN0IG9uZSBvZiB0aGUgZ2l2ZW5cbiAgICogICAgIC8vIGtleXMgYnV0IG1heSBvciBtYXkgbm90IGhhdmUgbW9yZSBvZiB0aGVtXG4gICAqICAgICBleHBlY3Qoe2E6IDEsIGI6IDJ9KS50by5oYXZlLmFueS5rZXlzKCdhJywgJ2InKTtcbiAgICpcbiAgICogTm90ZSB0aGF0IGAuYWxsYCBpcyB1c2VkIGJ5IGRlZmF1bHQgd2hlbiBuZWl0aGVyIGAuYWxsYCBub3IgYC5hbnlgIGFwcGVhclxuICAgKiBlYXJsaWVyIGluIHRoZSBjaGFpbi4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0IHRvIGFkZCBgLmFsbGAgYW55d2F5IGJlY2F1c2VcbiAgICogaXQgaW1wcm92ZXMgcmVhZGFiaWxpdHkuXG4gICAqXG4gICAqICAgICAvLyBCb3RoIGFzc2VydGlvbnMgYXJlIGlkZW50aWNhbFxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyfSkudG8uaGF2ZS5hbGwua2V5cygnYScsICdiJyk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3Qoe2E6IDEsIGI6IDJ9KS50by5oYXZlLmtleXMoJ2EnLCAnYicpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogQWRkIGAuaW5jbHVkZWAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gcmVxdWlyZSB0aGF0IHRoZSB0YXJnZXQncyBrZXlzIGJlIGFcbiAgICogc3VwZXJzZXQgb2YgdGhlIGV4cGVjdGVkIGtleXMsIHJhdGhlciB0aGFuIGlkZW50aWNhbCBzZXRzLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IG9iamVjdCdzIGtleXMgYXJlIGEgc3VwZXJzZXQgb2YgWydhJywgJ2InXSBidXQgbm90IGlkZW50aWNhbFxuICAgKiAgICAgZXhwZWN0KHthOiAxLCBiOiAyLCBjOiAzfSkudG8uaW5jbHVkZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqICAgICBleHBlY3Qoe2E6IDEsIGI6IDIsIGM6IDN9KS50by5ub3QuaGF2ZS5hbGwua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqIEhvd2V2ZXIsIGlmIGAuYW55YCBhbmQgYC5pbmNsdWRlYCBhcmUgY29tYmluZWQsIG9ubHkgdGhlIGAuYW55YCB0YWtlc1xuICAgKiBlZmZlY3QuIFRoZSBgLmluY2x1ZGVgIGlzIGlnbm9yZWQgaW4gdGhpcyBjYXNlLlxuICAgKlxuICAgKiAgICAgLy8gQm90aCBhc3NlcnRpb25zIGFyZSBpZGVudGljYWxcbiAgICogICAgIGV4cGVjdCh7YTogMX0pLnRvLmhhdmUuYW55LmtleXMoJ2EnLCAnYicpO1xuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uaW5jbHVkZS5hbnkua2V5cygnYScsICdiJyk7XG4gICAqXG4gICAqIEEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgY2FuIGJlIGdpdmVuIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9LCAnbm9vbyB3aHkgZmFpbD8/JykudG8uaGF2ZS5rZXkoJ2InKTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAua2V5YCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLmtleXNgLlxuICAgKlxuICAgKiBAbmFtZSBrZXlzXG4gICAqIEBhbGlhcyBrZXlcbiAgICogQHBhcmFtIHsuLi5TdHJpbmd8QXJyYXl8T2JqZWN0fSBrZXlzXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydEtleXMgKGtleXMpIHtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgb2JqVHlwZSA9IF8udHlwZShvYmopXG4gICAgICAsIGtleXNUeXBlID0gXy50eXBlKGtleXMpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJylcbiAgICAgICwgaXNEZWVwID0gZmxhZyh0aGlzLCAnZGVlcCcpXG4gICAgICAsIHN0clxuICAgICAgLCBkZWVwU3RyID0gJydcbiAgICAgICwgb2sgPSB0cnVlXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJyk7XG5cbiAgICBmbGFnTXNnID0gZmxhZ01zZyA/IGZsYWdNc2cgKyAnOiAnIDogJyc7XG4gICAgdmFyIG1peGVkQXJnc01zZyA9IGZsYWdNc2cgKyAnd2hlbiB0ZXN0aW5nIGtleXMgYWdhaW5zdCBhbiBvYmplY3Qgb3IgYW4gYXJyYXkgeW91IG11c3QgZ2l2ZSBhIHNpbmdsZSBBcnJheXxPYmplY3R8U3RyaW5nIGFyZ3VtZW50IG9yIG11bHRpcGxlIFN0cmluZyBhcmd1bWVudHMnO1xuXG4gICAgaWYgKG9ialR5cGUgPT09ICdNYXAnIHx8IG9ialR5cGUgPT09ICdTZXQnKSB7XG4gICAgICBkZWVwU3RyID0gaXNEZWVwID8gJ2RlZXBseSAnIDogJyc7XG4gICAgICBhY3R1YWwgPSBbXTtcblxuICAgICAgLy8gTWFwIGFuZCBTZXQgJy5rZXlzJyBhcmVuJ3Qgc3VwcG9ydGVkIGluIElFIDExLiBUaGVyZWZvcmUsIHVzZSAuZm9yRWFjaC5cbiAgICAgIG9iai5mb3JFYWNoKGZ1bmN0aW9uICh2YWwsIGtleSkgeyBhY3R1YWwucHVzaChrZXkpIH0pO1xuXG4gICAgICBpZiAoa2V5c1R5cGUgIT09ICdBcnJheScpIHtcbiAgICAgICAga2V5cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgYWN0dWFsID0gXy5nZXRPd25FbnVtZXJhYmxlUHJvcGVydGllcyhvYmopO1xuXG4gICAgICBzd2l0Y2ggKGtleXNUeXBlKSB7XG4gICAgICAgIGNhc2UgJ0FycmF5JzpcbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtaXhlZEFyZ3NNc2csIHVuZGVmaW5lZCwgc3NmaSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdPYmplY3QnOlxuICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1peGVkQXJnc01zZywgdW5kZWZpbmVkLCBzc2ZpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKGtleXMpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGtleXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgfVxuXG4gICAgICAvLyBPbmx5IHN0cmluZ2lmeSBub24tU3ltYm9scyBiZWNhdXNlIFN5bWJvbHMgd291bGQgYmVjb21lIFwiU3ltYm9sKClcIlxuICAgICAga2V5cyA9IGtleXMubWFwKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWwgPT09ICdzeW1ib2wnID8gdmFsIDogU3RyaW5nKHZhbCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIWtleXMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoZmxhZ01zZyArICdrZXlzIHJlcXVpcmVkJywgdW5kZWZpbmVkLCBzc2ZpKTtcbiAgICB9XG5cbiAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGhcbiAgICAgICwgYW55ID0gZmxhZyh0aGlzLCAnYW55JylcbiAgICAgICwgYWxsID0gZmxhZyh0aGlzLCAnYWxsJylcbiAgICAgICwgZXhwZWN0ZWQgPSBrZXlzXG4gICAgICAsIGFjdHVhbDtcblxuICAgIGlmICghYW55ICYmICFhbGwpIHtcbiAgICAgIGFsbCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gSGFzIGFueVxuICAgIGlmIChhbnkpIHtcbiAgICAgIG9rID0gZXhwZWN0ZWQuc29tZShmdW5jdGlvbihleHBlY3RlZEtleSkge1xuICAgICAgICByZXR1cm4gYWN0dWFsLnNvbWUoZnVuY3Rpb24oYWN0dWFsS2V5KSB7XG4gICAgICAgICAgaWYgKGlzRGVlcCkge1xuICAgICAgICAgICAgcmV0dXJuIF8uZXFsKGV4cGVjdGVkS2V5LCBhY3R1YWxLZXkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0ZWRLZXkgPT09IGFjdHVhbEtleTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gSGFzIGFsbFxuICAgIGlmIChhbGwpIHtcbiAgICAgIG9rID0gZXhwZWN0ZWQuZXZlcnkoZnVuY3Rpb24oZXhwZWN0ZWRLZXkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbC5zb21lKGZ1bmN0aW9uKGFjdHVhbEtleSkge1xuICAgICAgICAgIGlmIChpc0RlZXApIHtcbiAgICAgICAgICAgIHJldHVybiBfLmVxbChleHBlY3RlZEtleSwgYWN0dWFsS2V5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGVkS2V5ID09PSBhY3R1YWxLZXk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoIWZsYWcodGhpcywgJ2NvbnRhaW5zJykpIHtcbiAgICAgICAgb2sgPSBvayAmJiBrZXlzLmxlbmd0aCA9PSBhY3R1YWwubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEtleSBzdHJpbmdcbiAgICBpZiAobGVuID4gMSkge1xuICAgICAga2V5cyA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICByZXR1cm4gXy5pbnNwZWN0KGtleSk7XG4gICAgICB9KTtcbiAgICAgIHZhciBsYXN0ID0ga2V5cy5wb3AoKTtcbiAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgc3RyID0ga2V5cy5qb2luKCcsICcpICsgJywgYW5kICcgKyBsYXN0O1xuICAgICAgfVxuICAgICAgaWYgKGFueSkge1xuICAgICAgICBzdHIgPSBrZXlzLmpvaW4oJywgJykgKyAnLCBvciAnICsgbGFzdDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gXy5pbnNwZWN0KGtleXNbMF0pO1xuICAgIH1cblxuICAgIC8vIEZvcm1cbiAgICBzdHIgPSAobGVuID4gMSA/ICdrZXlzICcgOiAna2V5ICcpICsgc3RyO1xuXG4gICAgLy8gSGF2ZSAvIGluY2x1ZGVcbiAgICBzdHIgPSAoZmxhZyh0aGlzLCAnY29udGFpbnMnKSA/ICdjb250YWluICcgOiAnaGF2ZSAnKSArIHN0cjtcblxuICAgIC8vIEFzc2VydGlvblxuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICBva1xuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byAnICsgZGVlcFN0ciArIHN0clxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgJyArIGRlZXBTdHIgKyBzdHJcbiAgICAgICwgZXhwZWN0ZWQuc2xpY2UoMCkuc29ydChfLmNvbXBhcmVCeUluc3BlY3QpXG4gICAgICAsIGFjdHVhbC5zb3J0KF8uY29tcGFyZUJ5SW5zcGVjdClcbiAgICAgICwgdHJ1ZVxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdrZXlzJywgYXNzZXJ0S2V5cyk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2tleScsIGFzc2VydEtleXMpO1xuXG4gIC8qKlxuICAgKiAjIyMgLnRocm93KFtlcnJvckxpa2VdLCBbZXJyTXNnTWF0Y2hlcl0sIFttc2ddKVxuICAgKlxuICAgKiBXaGVuIG5vIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQsIGAudGhyb3dgIGludm9rZXMgdGhlIHRhcmdldCBmdW5jdGlvbiBhbmRcbiAgICogYXNzZXJ0cyB0aGF0IGFuIGVycm9yIGlzIHRocm93bi5cbiAgICogXG4gICAqICAgICB2YXIgYmFkRm4gPSBmdW5jdGlvbiAoKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0lsbGVnYWwgc2FsbW9uIScpOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KGJhZEZuKS50by50aHJvdygpO1xuICAgKlxuICAgKiBXaGVuIG9uZSBhcmd1bWVudCBpcyBwcm92aWRlZCwgYW5kIGl0J3MgYW4gZXJyb3IgY29uc3RydWN0b3IsIGAudGhyb3dgXG4gICAqIGludm9rZXMgdGhlIHRhcmdldCBmdW5jdGlvbiBhbmQgYXNzZXJ0cyB0aGF0IGFuIGVycm9yIGlzIHRocm93biB0aGF0J3MgYW5cbiAgICogaW5zdGFuY2Ugb2YgdGhhdCBlcnJvciBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogICAgIHZhciBiYWRGbiA9IGZ1bmN0aW9uICgpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSWxsZWdhbCBzYWxtb24hJyk7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYmFkRm4pLnRvLnRocm93KFR5cGVFcnJvcik7XG4gICAqXG4gICAqIFdoZW4gb25lIGFyZ3VtZW50IGlzIHByb3ZpZGVkLCBhbmQgaXQncyBhbiBlcnJvciBpbnN0YW5jZSwgYC50aHJvd2AgaW52b2tlc1xuICAgKiB0aGUgdGFyZ2V0IGZ1bmN0aW9uIGFuZCBhc3NlcnRzIHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duIHRoYXQncyBzdHJpY3RseVxuICAgKiAoYD09PWApIGVxdWFsIHRvIHRoYXQgZXJyb3IgaW5zdGFuY2UuXG4gICAqXG4gICAqICAgICB2YXIgZXJyID0gbmV3IFR5cGVFcnJvcignSWxsZWdhbCBzYWxtb24hJyk7XG4gICAqICAgICB2YXIgYmFkRm4gPSBmdW5jdGlvbiAoKSB7IHRocm93IGVycjsgfTtcbiAgICpcbiAgICogICAgIGV4cGVjdChiYWRGbikudG8udGhyb3coZXJyKTtcbiAgICpcbiAgICogV2hlbiBvbmUgYXJndW1lbnQgaXMgcHJvdmlkZWQsIGFuZCBpdCdzIGEgc3RyaW5nLCBgLnRocm93YCBpbnZva2VzIHRoZVxuICAgKiB0YXJnZXQgZnVuY3Rpb24gYW5kIGFzc2VydHMgdGhhdCBhbiBlcnJvciBpcyB0aHJvd24gd2l0aCBhIG1lc3NhZ2UgdGhhdFxuICAgKiBjb250YWlucyB0aGF0IHN0cmluZy5cbiAgICpcbiAgICogICAgIHZhciBiYWRGbiA9IGZ1bmN0aW9uICgpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSWxsZWdhbCBzYWxtb24hJyk7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYmFkRm4pLnRvLnRocm93KCdzYWxtb24nKTtcbiAgICpcbiAgICogV2hlbiBvbmUgYXJndW1lbnQgaXMgcHJvdmlkZWQsIGFuZCBpdCdzIGEgcmVndWxhciBleHByZXNzaW9uLCBgLnRocm93YFxuICAgKiBpbnZva2VzIHRoZSB0YXJnZXQgZnVuY3Rpb24gYW5kIGFzc2VydHMgdGhhdCBhbiBlcnJvciBpcyB0aHJvd24gd2l0aCBhXG4gICAqIG1lc3NhZ2UgdGhhdCBtYXRjaGVzIHRoYXQgcmVndWxhciBleHByZXNzaW9uLlxuICAgKlxuICAgKiAgICAgdmFyIGJhZEZuID0gZnVuY3Rpb24gKCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbGxlZ2FsIHNhbG1vbiEnKTsgfTtcbiAgICpcbiAgICogICAgIGV4cGVjdChiYWRGbikudG8udGhyb3coL3NhbG1vbi8pO1xuICAgKlxuICAgKiBXaGVuIHR3byBhcmd1bWVudHMgYXJlIHByb3ZpZGVkLCBhbmQgdGhlIGZpcnN0IGlzIGFuIGVycm9yIGluc3RhbmNlIG9yXG4gICAqIGNvbnN0cnVjdG9yLCBhbmQgdGhlIHNlY29uZCBpcyBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24sIGAudGhyb3dgXG4gICAqIGludm9rZXMgdGhlIGZ1bmN0aW9uIGFuZCBhc3NlcnRzIHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duIHRoYXQgZnVsZmlsbHMgYm90aFxuICAgKiBjb25kaXRpb25zIGFzIGRlc2NyaWJlZCBhYm92ZS5cbiAgICpcbiAgICogICAgIHZhciBlcnIgPSBuZXcgVHlwZUVycm9yKCdJbGxlZ2FsIHNhbG1vbiEnKTtcbiAgICogICAgIHZhciBiYWRGbiA9IGZ1bmN0aW9uICgpIHsgdGhyb3cgZXJyOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KGJhZEZuKS50by50aHJvdyhUeXBlRXJyb3IsICdzYWxtb24nKTtcbiAgICogICAgIGV4cGVjdChiYWRGbikudG8udGhyb3coVHlwZUVycm9yLCAvc2FsbW9uLyk7XG4gICAqICAgICBleHBlY3QoYmFkRm4pLnRvLnRocm93KGVyciwgJ3NhbG1vbicpO1xuICAgKiAgICAgZXhwZWN0KGJhZEZuKS50by50aHJvdyhlcnIsIC9zYWxtb24vKTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC50aHJvd2AuXG4gICAqICAgICBcbiAgICogICAgIHZhciBnb29kRm4gPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChnb29kRm4pLnRvLm5vdC50aHJvdygpO1xuICAgKiBcbiAgICogSG93ZXZlciwgaXQncyBkYW5nZXJvdXMgdG8gbmVnYXRlIGAudGhyb3dgIHdoZW4gcHJvdmlkaW5nIGFueSBhcmd1bWVudHMuXG4gICAqIFRoZSBwcm9ibGVtIGlzIHRoYXQgaXQgY3JlYXRlcyB1bmNlcnRhaW4gZXhwZWN0YXRpb25zIGJ5IGFzc2VydGluZyB0aGF0IHRoZVxuICAgKiB0YXJnZXQgZWl0aGVyIGRvZXNuJ3QgdGhyb3cgYW4gZXJyb3IsIG9yIHRoYXQgaXQgdGhyb3dzIGFuIGVycm9yIGJ1dCBvZiBhXG4gICAqIGRpZmZlcmVudCB0eXBlIHRoYW4gdGhlIGdpdmVuIHR5cGUsIG9yIHRoYXQgaXQgdGhyb3dzIGFuIGVycm9yIG9mIHRoZSBnaXZlblxuICAgKiB0eXBlIGJ1dCB3aXRoIGEgbWVzc2FnZSB0aGF0IGRvZXNuJ3QgaW5jbHVkZSB0aGUgZ2l2ZW4gc3RyaW5nLiBJdCdzIG9mdGVuXG4gICAqIGJlc3QgdG8gaWRlbnRpZnkgdGhlIGV4YWN0IG91dHB1dCB0aGF0J3MgZXhwZWN0ZWQsIGFuZCB0aGVuIHdyaXRlIGFuXG4gICAqIGFzc2VydGlvbiB0aGF0IG9ubHkgYWNjZXB0cyB0aGF0IGV4YWN0IG91dHB1dC5cbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzbid0IGV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0XG4gICAqIGV4YWN0bHkgdGhhdC5cbiAgICpcbiAgICogICAgIHZhciBnb29kRm4gPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChnb29kRm4pLnRvLm5vdC50aHJvdygpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGdvb2RGbikudG8ubm90LnRocm93KFJlZmVyZW5jZUVycm9yLCAneCcpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0XG4gICAqIHRoYXQgdGhlIGVycm9yIGlzIG9mIGl0cyBleHBlY3RlZCB0eXBlLCBhbmQgaGFzIGEgbWVzc2FnZSB0aGF0IGluY2x1ZGVzIGFuXG4gICAqIGV4cGVjdGVkIHN0cmluZywgcmF0aGVyIHRoYW4gYXNzZXJ0aW5nIHRoYXQgaXQgZG9lc24ndCBoYXZlIG9uZSBvZiBtYW55XG4gICAqIHVuZXhwZWN0ZWQgdHlwZXMsIGFuZCBkb2Vzbid0IGhhdmUgYSBtZXNzYWdlIHRoYXQgaW5jbHVkZXMgc29tZSBzdHJpbmcuXG4gICAqXG4gICAqICAgICB2YXIgYmFkRm4gPSBmdW5jdGlvbiAoKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0lsbGVnYWwgc2FsbW9uIScpOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KGJhZEZuKS50by50aHJvdyhUeXBlRXJyb3IsICdzYWxtb24nKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChiYWRGbikudG8ubm90LnRocm93KFJlZmVyZW5jZUVycm9yLCAneCcpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogYC50aHJvd2AgY2hhbmdlcyB0aGUgdGFyZ2V0IG9mIGFueSBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbiB0b1xuICAgKiBiZSB0aGUgZXJyb3Igb2JqZWN0IHRoYXQncyB0aHJvd24uXG4gICAqXG4gICAqICAgICB2YXIgZXJyID0gbmV3IFR5cGVFcnJvcignSWxsZWdhbCBzYWxtb24hJyk7XG4gICAqICAgICBlcnIuY29kZSA9IDQyO1xuICAgKiAgICAgdmFyIGJhZEZuID0gZnVuY3Rpb24gKCkgeyB0aHJvdyBlcnI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYmFkRm4pLnRvLnRocm93KFR5cGVFcnJvcikud2l0aC5wcm9wZXJ0eSgnY29kZScsIDQyKTtcbiAgICpcbiAgICogYC50aHJvd2AgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvciBtZXNzYWdlXG4gICAqIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhcyB0aGVcbiAgICogc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLiBXaGVuIG5vdCBwcm92aWRpbmcgdHdvIGFyZ3VtZW50cywgYWx3YXlzIHVzZVxuICAgKiB0aGUgc2Vjb25kIGZvcm0uXG4gICAqXG4gICAqICAgICB2YXIgZ29vZEZuID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3QoZ29vZEZuKS50by50aHJvdyhUeXBlRXJyb3IsICd4JywgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KGdvb2RGbiwgJ25vb28gd2h5IGZhaWw/PycpLnRvLnRocm93KCk7XG4gICAqXG4gICAqIER1ZSB0byBsaW1pdGF0aW9ucyBpbiBFUzUsIGAudGhyb3dgIG1heSBub3QgYWx3YXlzIHdvcmsgYXMgZXhwZWN0ZWQgd2hlblxuICAgKiB1c2luZyBhIHRyYW5zcGlsZXIgc3VjaCBhcyBCYWJlbCBvciBUeXBlU2NyaXB0LiBJbiBwYXJ0aWN1bGFyLCBpdCBtYXlcbiAgICogcHJvZHVjZSB1bmV4cGVjdGVkIHJlc3VsdHMgd2hlbiBzdWJjbGFzc2luZyB0aGUgYnVpbHQtaW4gYEVycm9yYCBvYmplY3QgYW5kXG4gICAqIHRoZW4gcGFzc2luZyB0aGUgc3ViY2xhc3NlZCBjb25zdHJ1Y3RvciB0byBgLnRocm93YC4gU2VlIHlvdXIgdHJhbnNwaWxlcidzXG4gICAqIGRvY3MgZm9yIGRldGFpbHM6XG4gICAqXG4gICAqIC0gKFtCYWJlbF0oaHR0cHM6Ly9iYWJlbGpzLmlvL2RvY3MvdXNhZ2UvY2F2ZWF0cy8jY2xhc3NlcykpXG4gICAqIC0gKFtUeXBlU2NyaXB0XShodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvd2lraS9CcmVha2luZy1DaGFuZ2VzI2V4dGVuZGluZy1idWlsdC1pbnMtbGlrZS1lcnJvci1hcnJheS1hbmQtbWFwLW1heS1uby1sb25nZXItd29yaykpXG4gICAqXG4gICAqIEJld2FyZSBvZiBzb21lIGNvbW1vbiBtaXN0YWtlcyB3aGVuIHVzaW5nIHRoZSBgdGhyb3dgIGFzc2VydGlvbi4gT25lIGNvbW1vblxuICAgKiBtaXN0YWtlIGlzIHRvIGFjY2lkZW50YWxseSBpbnZva2UgdGhlIGZ1bmN0aW9uIHlvdXJzZWxmIGluc3RlYWQgb2YgbGV0dGluZ1xuICAgKiB0aGUgYHRocm93YCBhc3NlcnRpb24gaW52b2tlIHRoZSBmdW5jdGlvbiBmb3IgeW91LiBGb3IgZXhhbXBsZSwgd2hlblxuICAgKiB0ZXN0aW5nIGlmIGEgZnVuY3Rpb24gbmFtZWQgYGZuYCB0aHJvd3MsIHByb3ZpZGUgYGZuYCBpbnN0ZWFkIG9mIGBmbigpYCBhc1xuICAgKiB0aGUgdGFyZ2V0IGZvciB0aGUgYXNzZXJ0aW9uLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KGZuKS50by50aHJvdygpOyAgICAgLy8gR29vZCEgVGVzdHMgYGZuYCBhcyBkZXNpcmVkXG4gICAqICAgICBleHBlY3QoZm4oKSkudG8udGhyb3coKTsgICAvLyBCYWQhIFRlc3RzIHJlc3VsdCBvZiBgZm4oKWAsIG5vdCBgZm5gXG4gICAqXG4gICAqIElmIHlvdSBuZWVkIHRvIGFzc2VydCB0aGF0IHlvdXIgZnVuY3Rpb24gYGZuYCB0aHJvd3Mgd2hlbiBwYXNzZWQgY2VydGFpblxuICAgKiBhcmd1bWVudHMsIHRoZW4gd3JhcCBhIGNhbGwgdG8gYGZuYCBpbnNpZGUgb2YgYW5vdGhlciBmdW5jdGlvbi5cbiAgICpcbiAgICogICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7IGZuKDQyKTsgfSkudG8udGhyb3coKTsgIC8vIEZ1bmN0aW9uIGV4cHJlc3Npb25cbiAgICogICAgIGV4cGVjdCgoKSA9PiBmbig0MikpLnRvLnRocm93KCk7ICAgICAgICAgICAgIC8vIEVTNiBhcnJvdyBmdW5jdGlvblxuICAgKlxuICAgKiBBbm90aGVyIGNvbW1vbiBtaXN0YWtlIGlzIHRvIHByb3ZpZGUgYW4gb2JqZWN0IG1ldGhvZCAob3IgYW55IHN0YW5kLWFsb25lXG4gICAqIGZ1bmN0aW9uIHRoYXQgcmVsaWVzIG9uIGB0aGlzYCkgYXMgdGhlIHRhcmdldCBvZiB0aGUgYXNzZXJ0aW9uLiBEb2luZyBzbyBpc1xuICAgKiBwcm9ibGVtYXRpYyBiZWNhdXNlIHRoZSBgdGhpc2AgY29udGV4dCB3aWxsIGJlIGxvc3Qgd2hlbiB0aGUgZnVuY3Rpb24gaXNcbiAgICogaW52b2tlZCBieSBgLnRocm93YDsgdGhlcmUncyBubyB3YXkgZm9yIGl0IHRvIGtub3cgd2hhdCBgdGhpc2AgaXMgc3VwcG9zZWRcbiAgICogdG8gYmUuIFRoZXJlIGFyZSB0d28gd2F5cyBhcm91bmQgdGhpcyBwcm9ibGVtLiBPbmUgc29sdXRpb24gaXMgdG8gd3JhcCB0aGVcbiAgICogbWV0aG9kIG9yIGZ1bmN0aW9uIGNhbGwgaW5zaWRlIG9mIGFub3RoZXIgZnVuY3Rpb24uIEFub3RoZXIgc29sdXRpb24gaXMgdG9cbiAgICogdXNlIGBiaW5kYC5cbiAgICpcbiAgICogICAgIGV4cGVjdChmdW5jdGlvbiAoKSB7IGNhdC5tZW93KCk7IH0pLnRvLnRocm93KCk7ICAvLyBGdW5jdGlvbiBleHByZXNzaW9uXG4gICAqICAgICBleHBlY3QoKCkgPT4gY2F0Lm1lb3coKSkudG8udGhyb3coKTsgICAgICAgICAgICAgLy8gRVM2IGFycm93IGZ1bmN0aW9uXG4gICAqICAgICBleHBlY3QoY2F0Lm1lb3cuYmluZChjYXQpKS50by50aHJvdygpOyAgICAgICAgICAgLy8gQmluZFxuICAgKlxuICAgKiBGaW5hbGx5LCBpdCdzIHdvcnRoIG1lbnRpb25pbmcgdGhhdCBpdCdzIGEgYmVzdCBwcmFjdGljZSBpbiBKYXZhU2NyaXB0IHRvXG4gICAqIG9ubHkgdGhyb3cgYEVycm9yYCBhbmQgZGVyaXZhdGl2ZXMgb2YgYEVycm9yYCBzdWNoIGFzIGBSZWZlcmVuY2VFcnJvcmAsXG4gICAqIGBUeXBlRXJyb3JgLCBhbmQgdXNlci1kZWZpbmVkIG9iamVjdHMgdGhhdCBleHRlbmQgYEVycm9yYC4gTm8gb3RoZXIgdHlwZSBvZlxuICAgKiB2YWx1ZSB3aWxsIGdlbmVyYXRlIGEgc3RhY2sgdHJhY2Ugd2hlbiBpbml0aWFsaXplZC4gV2l0aCB0aGF0IHNhaWQsIHRoZVxuICAgKiBgdGhyb3dgIGFzc2VydGlvbiBkb2VzIHRlY2huaWNhbGx5IHN1cHBvcnQgYW55IHR5cGUgb2YgdmFsdWUgYmVpbmcgdGhyb3duLFxuICAgKiBub3QganVzdCBgRXJyb3JgIGFuZCBpdHMgZGVyaXZhdGl2ZXMuXG4gICAqXG4gICAqIFRoZSBhbGlhc2VzIGAudGhyb3dzYCBhbmQgYC5UaHJvd2AgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5IHdpdGhcbiAgICogYC50aHJvd2AuXG4gICAqXG4gICAqIEBuYW1lIHRocm93XG4gICAqIEBhbGlhcyB0aHJvd3NcbiAgICogQGFsaWFzIFRocm93XG4gICAqIEBwYXJhbSB7RXJyb3J8RXJyb3JDb25zdHJ1Y3Rvcn0gZXJyb3JMaWtlXG4gICAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXJyTXNnTWF0Y2hlciBlcnJvciBtZXNzYWdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Vycm9yI0Vycm9yX3R5cGVzXG4gICAqIEByZXR1cm5zIGVycm9yIGZvciBjaGFpbmluZyAobnVsbCBpZiBubyBlcnJvcilcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzIChlcnJvckxpa2UsIGVyck1zZ01hdGNoZXIsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBvYmogPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgbmVnYXRlID0gZmxhZyh0aGlzLCAnbmVnYXRlJykgfHwgZmFsc2U7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIGZsYWdNc2csIHNzZmksIHRydWUpLmlzLmEoJ2Z1bmN0aW9uJyk7XG5cbiAgICBpZiAoZXJyb3JMaWtlIGluc3RhbmNlb2YgUmVnRXhwIHx8IHR5cGVvZiBlcnJvckxpa2UgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlcnJNc2dNYXRjaGVyID0gZXJyb3JMaWtlO1xuICAgICAgZXJyb3JMaWtlID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgY2F1Z2h0RXJyO1xuICAgIHRyeSB7XG4gICAgICBvYmooKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNhdWdodEVyciA9IGVycjtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIHRoZSBuZWdhdGUgZmxhZyBlbmFibGVkIGFuZCBhdCBsZWFzdCBvbmUgdmFsaWQgYXJndW1lbnQgaXQgbWVhbnMgd2UgZG8gZXhwZWN0IGFuIGVycm9yXG4gICAgLy8gYnV0IHdlIHdhbnQgaXQgdG8gbWF0Y2ggYSBnaXZlbiBzZXQgb2YgY3JpdGVyaWFcbiAgICB2YXIgZXZlcnlBcmdJc1VuZGVmaW5lZCA9IGVycm9yTGlrZSA9PT0gdW5kZWZpbmVkICYmIGVyck1zZ01hdGNoZXIgPT09IHVuZGVmaW5lZDtcblxuICAgIC8vIElmIHdlJ3ZlIGdvdCB0aGUgbmVnYXRlIGZsYWcgZW5hYmxlZCBhbmQgYm90aCBhcmdzLCB3ZSBzaG91bGQgb25seSBmYWlsIGlmIGJvdGggYXJlbid0IGNvbXBhdGlibGVcbiAgICAvLyBTZWUgSXNzdWUgIzU1MSBhbmQgUFIgIzY4M0BHaXRIdWJcbiAgICB2YXIgZXZlcnlBcmdJc0RlZmluZWQgPSBCb29sZWFuKGVycm9yTGlrZSAmJiBlcnJNc2dNYXRjaGVyKTtcbiAgICB2YXIgZXJyb3JMaWtlRmFpbCA9IGZhbHNlO1xuICAgIHZhciBlcnJNc2dNYXRjaGVyRmFpbCA9IGZhbHNlO1xuXG4gICAgLy8gQ2hlY2tpbmcgaWYgZXJyb3Igd2FzIHRocm93blxuICAgIGlmIChldmVyeUFyZ0lzVW5kZWZpbmVkIHx8ICFldmVyeUFyZ0lzVW5kZWZpbmVkICYmICFuZWdhdGUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdGhpcyB0byBkaXNwbGF5IHJlc3VsdHMgY29ycmVjdGx5IGFjY29yZGluZyB0byB0aGVpciB0eXBlc1xuICAgICAgdmFyIGVycm9yTGlrZVN0cmluZyA9ICdhbiBlcnJvcic7XG4gICAgICBpZiAoZXJyb3JMaWtlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgZXJyb3JMaWtlU3RyaW5nID0gJyN7ZXhwfSc7XG4gICAgICB9IGVsc2UgaWYgKGVycm9yTGlrZSkge1xuICAgICAgICBlcnJvckxpa2VTdHJpbmcgPSBfLmNoZWNrRXJyb3IuZ2V0Q29uc3RydWN0b3JOYW1lKGVycm9yTGlrZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgICAgIGNhdWdodEVyclxuICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIHRocm93ICcgKyBlcnJvckxpa2VTdHJpbmdcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgdGhyb3cgYW4gZXJyb3IgYnV0ICN7YWN0fSB3YXMgdGhyb3duJ1xuICAgICAgICAsIGVycm9yTGlrZSAmJiBlcnJvckxpa2UudG9TdHJpbmcoKVxuICAgICAgICAsIChjYXVnaHRFcnIgaW5zdGFuY2VvZiBFcnJvciA/XG4gICAgICAgICAgICBjYXVnaHRFcnIudG9TdHJpbmcoKSA6ICh0eXBlb2YgY2F1Z2h0RXJyID09PSAnc3RyaW5nJyA/IGNhdWdodEVyciA6IGNhdWdodEVyciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5jaGVja0Vycm9yLmdldENvbnN0cnVjdG9yTmFtZShjYXVnaHRFcnIpKSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGVycm9yTGlrZSAmJiBjYXVnaHRFcnIpIHtcbiAgICAgIC8vIFdlIHNob3VsZCBjb21wYXJlIGluc3RhbmNlcyBvbmx5IGlmIGBlcnJvckxpa2VgIGlzIGFuIGluc3RhbmNlIG9mIGBFcnJvcmBcbiAgICAgIGlmIChlcnJvckxpa2UgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB2YXIgaXNDb21wYXRpYmxlSW5zdGFuY2UgPSBfLmNoZWNrRXJyb3IuY29tcGF0aWJsZUluc3RhbmNlKGNhdWdodEVyciwgZXJyb3JMaWtlKTtcblxuICAgICAgICBpZiAoaXNDb21wYXRpYmxlSW5zdGFuY2UgPT09IG5lZ2F0ZSkge1xuICAgICAgICAgIC8vIFRoZXNlIGNoZWNrcyB3ZXJlIGNyZWF0ZWQgdG8gZW5zdXJlIHdlIHdvbid0IGZhaWwgdG9vIHNvb24gd2hlbiB3ZSd2ZSBnb3QgYm90aCBhcmdzIGFuZCBhIG5lZ2F0ZVxuICAgICAgICAgIC8vIFNlZSBJc3N1ZSAjNTUxIGFuZCBQUiAjNjgzQEdpdEh1YlxuICAgICAgICAgIGlmIChldmVyeUFyZ0lzRGVmaW5lZCAmJiBuZWdhdGUpIHtcbiAgICAgICAgICAgIGVycm9yTGlrZUZhaWwgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICAgICAgICBuZWdhdGVcbiAgICAgICAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byB0aHJvdyAje2V4cH0gYnV0ICN7YWN0fSB3YXMgdGhyb3duJ1xuICAgICAgICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCB0aHJvdyAje2V4cH0nICsgKGNhdWdodEVyciAmJiAhbmVnYXRlID8gJyBidXQgI3thY3R9IHdhcyB0aHJvd24nIDogJycpXG4gICAgICAgICAgICAgICwgZXJyb3JMaWtlLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgLCBjYXVnaHRFcnIudG9TdHJpbmcoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGlzQ29tcGF0aWJsZUNvbnN0cnVjdG9yID0gXy5jaGVja0Vycm9yLmNvbXBhdGlibGVDb25zdHJ1Y3RvcihjYXVnaHRFcnIsIGVycm9yTGlrZSk7XG4gICAgICBpZiAoaXNDb21wYXRpYmxlQ29uc3RydWN0b3IgPT09IG5lZ2F0ZSkge1xuICAgICAgICBpZiAoZXZlcnlBcmdJc0RlZmluZWQgJiYgbmVnYXRlKSB7XG4gICAgICAgICAgICBlcnJvckxpa2VGYWlsID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgICAgICAgbmVnYXRlXG4gICAgICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIHRocm93ICN7ZXhwfSBidXQgI3thY3R9IHdhcyB0aHJvd24nXG4gICAgICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCB0aHJvdyAje2V4cH0nICsgKGNhdWdodEVyciA/ICcgYnV0ICN7YWN0fSB3YXMgdGhyb3duJyA6ICcnKVxuICAgICAgICAgICAgLCAoZXJyb3JMaWtlIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvckxpa2UudG9TdHJpbmcoKSA6IGVycm9yTGlrZSAmJiBfLmNoZWNrRXJyb3IuZ2V0Q29uc3RydWN0b3JOYW1lKGVycm9yTGlrZSkpXG4gICAgICAgICAgICAsIChjYXVnaHRFcnIgaW5zdGFuY2VvZiBFcnJvciA/IGNhdWdodEVyci50b1N0cmluZygpIDogY2F1Z2h0RXJyICYmIF8uY2hlY2tFcnJvci5nZXRDb25zdHJ1Y3Rvck5hbWUoY2F1Z2h0RXJyKSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhdWdodEVyciAmJiBlcnJNc2dNYXRjaGVyICE9PSB1bmRlZmluZWQgJiYgZXJyTXNnTWF0Y2hlciAhPT0gbnVsbCkge1xuICAgICAgLy8gSGVyZSB3ZSBjaGVjayBjb21wYXRpYmxlIG1lc3NhZ2VzXG4gICAgICB2YXIgcGxhY2Vob2xkZXIgPSAnaW5jbHVkaW5nJztcbiAgICAgIGlmIChlcnJNc2dNYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHBsYWNlaG9sZGVyID0gJ21hdGNoaW5nJ1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNDb21wYXRpYmxlTWVzc2FnZSA9IF8uY2hlY2tFcnJvci5jb21wYXRpYmxlTWVzc2FnZShjYXVnaHRFcnIsIGVyck1zZ01hdGNoZXIpO1xuICAgICAgaWYgKGlzQ29tcGF0aWJsZU1lc3NhZ2UgPT09IG5lZ2F0ZSkge1xuICAgICAgICBpZiAoZXZlcnlBcmdJc0RlZmluZWQgJiYgbmVnYXRlKSB7XG4gICAgICAgICAgICBlcnJNc2dNYXRjaGVyRmFpbCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICAgICBuZWdhdGVcbiAgICAgICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gdGhyb3cgZXJyb3IgJyArIHBsYWNlaG9sZGVyICsgJyAje2V4cH0gYnV0IGdvdCAje2FjdH0nXG4gICAgICAgICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIHRocm93IGVycm9yIG5vdCAnICsgcGxhY2Vob2xkZXIgKyAnICN7ZXhwfSdcbiAgICAgICAgICAgICwgIGVyck1zZ01hdGNoZXJcbiAgICAgICAgICAgICwgIF8uY2hlY2tFcnJvci5nZXRNZXNzYWdlKGNhdWdodEVycilcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgYm90aCBhc3NlcnRpb25zIGZhaWxlZCBhbmQgYm90aCBzaG91bGQndmUgbWF0Y2hlZCB3ZSB0aHJvdyBhbiBlcnJvclxuICAgIGlmIChlcnJvckxpa2VGYWlsICYmIGVyck1zZ01hdGNoZXJGYWlsKSB7XG4gICAgICB0aGlzLmFzc2VydChcbiAgICAgICAgbmVnYXRlXG4gICAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gdGhyb3cgI3tleHB9IGJ1dCAje2FjdH0gd2FzIHRocm93bidcbiAgICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgdGhyb3cgI3tleHB9JyArIChjYXVnaHRFcnIgPyAnIGJ1dCAje2FjdH0gd2FzIHRocm93bicgOiAnJylcbiAgICAgICAgLCAoZXJyb3JMaWtlIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvckxpa2UudG9TdHJpbmcoKSA6IGVycm9yTGlrZSAmJiBfLmNoZWNrRXJyb3IuZ2V0Q29uc3RydWN0b3JOYW1lKGVycm9yTGlrZSkpXG4gICAgICAgICwgKGNhdWdodEVyciBpbnN0YW5jZW9mIEVycm9yID8gY2F1Z2h0RXJyLnRvU3RyaW5nKCkgOiBjYXVnaHRFcnIgJiYgXy5jaGVja0Vycm9yLmdldENvbnN0cnVjdG9yTmFtZShjYXVnaHRFcnIpKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmbGFnKHRoaXMsICdvYmplY3QnLCBjYXVnaHRFcnIpO1xuICB9O1xuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ3Rocm93JywgYXNzZXJ0VGhyb3dzKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgndGhyb3dzJywgYXNzZXJ0VGhyb3dzKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnVGhyb3cnLCBhc3NlcnRUaHJvd3MpO1xuXG4gIC8qKlxuICAgKiAjIyMgLnJlc3BvbmRUbyhtZXRob2RbLCBtc2ddKVxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXMgYSBub24tZnVuY3Rpb24gb2JqZWN0LCBgLnJlc3BvbmRUb2AgYXNzZXJ0cyB0aGF0IHRoZVxuICAgKiB0YXJnZXQgaGFzIGEgbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUgYG1ldGhvZGAuIFRoZSBtZXRob2QgY2FuIGJlIG93biBvclxuICAgKiBpbmhlcml0ZWQsIGFuZCBpdCBjYW4gYmUgZW51bWVyYWJsZSBvciBub24tZW51bWVyYWJsZS5cbiAgICpcbiAgICogICAgIGZ1bmN0aW9uIENhdCAoKSB7fVxuICAgKiAgICAgQ2F0LnByb3RvdHlwZS5tZW93ID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3QobmV3IENhdCgpKS50by5yZXNwb25kVG8oJ21lb3cnKTtcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGEgZnVuY3Rpb24sIGAucmVzcG9uZFRvYCBhc3NlcnRzIHRoYXQgdGhlIHRhcmdldCdzXG4gICAqIGBwcm90b3R5cGVgIHByb3BlcnR5IGhhcyBhIG1ldGhvZCB3aXRoIHRoZSBnaXZlbiBuYW1lIGBtZXRob2RgLiBBZ2FpbiwgdGhlXG4gICAqIG1ldGhvZCBjYW4gYmUgb3duIG9yIGluaGVyaXRlZCwgYW5kIGl0IGNhbiBiZSBlbnVtZXJhYmxlIG9yIG5vbi1lbnVtZXJhYmxlLlxuICAgKlxuICAgKiAgICAgZnVuY3Rpb24gQ2F0ICgpIHt9XG4gICAqICAgICBDYXQucHJvdG90eXBlLm1lb3cgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChDYXQpLnRvLnJlc3BvbmRUbygnbWVvdycpO1xuICAgKlxuICAgKiBBZGQgYC5pdHNlbGZgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIGZvcmNlIGAucmVzcG9uZFRvYCB0byB0cmVhdCB0aGVcbiAgICogdGFyZ2V0IGFzIGEgbm9uLWZ1bmN0aW9uIG9iamVjdCwgZXZlbiBpZiBpdCdzIGEgZnVuY3Rpb24uIFRodXMsIGl0IGFzc2VydHNcbiAgICogdGhhdCB0aGUgdGFyZ2V0IGhhcyBhIG1ldGhvZCB3aXRoIHRoZSBnaXZlbiBuYW1lIGBtZXRob2RgLCByYXRoZXIgdGhhblxuICAgKiBhc3NlcnRpbmcgdGhhdCB0aGUgdGFyZ2V0J3MgYHByb3RvdHlwZWAgcHJvcGVydHkgaGFzIGEgbWV0aG9kIHdpdGggdGhlXG4gICAqIGdpdmVuIG5hbWUgYG1ldGhvZGAuXG4gICAqXG4gICAqICAgICBmdW5jdGlvbiBDYXQgKCkge31cbiAgICogICAgIENhdC5wcm90b3R5cGUubWVvdyA9IGZ1bmN0aW9uICgpIHt9O1xuICAgKiAgICAgQ2F0Lmhpc3MgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChDYXQpLml0c2VsZi50by5yZXNwb25kVG8oJ2hpc3MnKS5idXQubm90LnJlc3BvbmRUbygnbWVvdycpO1xuICAgKlxuICAgKiBXaGVuIG5vdCBhZGRpbmcgYC5pdHNlbGZgLCBpdCdzIGltcG9ydGFudCB0byBjaGVjayB0aGUgdGFyZ2V0J3MgdHlwZSBiZWZvcmVcbiAgICogdXNpbmcgYC5yZXNwb25kVG9gLiBTZWUgdGhlIGAuYWAgZG9jIGZvciBpbmZvIG9uIGNoZWNraW5nIGEgdGFyZ2V0J3MgdHlwZS5cbiAgICpcbiAgICogICAgIGZ1bmN0aW9uIENhdCAoKSB7fVxuICAgKiAgICAgQ2F0LnByb3RvdHlwZS5tZW93ID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3QobmV3IENhdCgpKS50by5iZS5hbignb2JqZWN0JykudGhhdC5yZXNwb25kc1RvKCdtZW93Jyk7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAucmVzcG9uZFRvYC5cbiAgICpcbiAgICogICAgIGZ1bmN0aW9uIERvZyAoKSB7fVxuICAgKiAgICAgRG9nLnByb3RvdHlwZS5iYXJrID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3QobmV3IERvZygpKS50by5ub3QucmVzcG9uZFRvKCdtZW93Jyk7XG4gICAqXG4gICAqIGAucmVzcG9uZFRvYCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yXG4gICAqIG1lc3NhZ2UgdG8gc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzXG4gICAqIHRoZSBzZWNvbmQgYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe30pLnRvLnJlc3BvbmRUbygnbWVvdycsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCh7fSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLnJlc3BvbmRUbygnbWVvdycpO1xuICAgKlxuICAgKiBUaGUgYWxpYXMgYC5yZXNwb25kc1RvYCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLnJlc3BvbmRUb2AuXG4gICAqXG4gICAqIEBuYW1lIHJlc3BvbmRUb1xuICAgKiBAYWxpYXMgcmVzcG9uZHNUb1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiByZXNwb25kVG8gKG1ldGhvZCwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGl0c2VsZiA9IGZsYWcodGhpcywgJ2l0c2VsZicpXG4gICAgICAsIGNvbnRleHQgPSAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIG9iaiAmJiAhaXRzZWxmKVxuICAgICAgICA/IG9iai5wcm90b3R5cGVbbWV0aG9kXVxuICAgICAgICA6IG9ialttZXRob2RdO1xuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgICdmdW5jdGlvbicgPT09IHR5cGVvZiBjb250ZXh0XG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIHJlc3BvbmQgdG8gJyArIF8uaW5zcGVjdChtZXRob2QpXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIG5vdCByZXNwb25kIHRvICcgKyBfLmluc3BlY3QobWV0aG9kKVxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdyZXNwb25kVG8nLCByZXNwb25kVG8pO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdyZXNwb25kc1RvJywgcmVzcG9uZFRvKTtcblxuICAvKipcbiAgICogIyMjIC5pdHNlbGZcbiAgICpcbiAgICogRm9yY2VzIGFsbCBgLnJlc3BvbmRUb2AgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW4gdG8gYmVoYXZlIGFzIGlmXG4gICAqIHRoZSB0YXJnZXQgaXMgYSBub24tZnVuY3Rpb24gb2JqZWN0LCBldmVuIGlmIGl0J3MgYSBmdW5jdGlvbi4gVGh1cywgaXRcbiAgICogY2F1c2VzIGAucmVzcG9uZFRvYCB0byBhc3NlcnQgdGhhdCB0aGUgdGFyZ2V0IGhhcyBhIG1ldGhvZCB3aXRoIHRoZSBnaXZlblxuICAgKiBuYW1lLCByYXRoZXIgdGhhbiBhc3NlcnRpbmcgdGhhdCB0aGUgdGFyZ2V0J3MgYHByb3RvdHlwZWAgcHJvcGVydHkgaGFzIGFcbiAgICogbWV0aG9kIHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICAqXG4gICAqICAgICBmdW5jdGlvbiBDYXQgKCkge31cbiAgICogICAgIENhdC5wcm90b3R5cGUubWVvdyA9IGZ1bmN0aW9uICgpIHt9O1xuICAgKiAgICAgQ2F0Lmhpc3MgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChDYXQpLml0c2VsZi50by5yZXNwb25kVG8oJ2hpc3MnKS5idXQubm90LnJlc3BvbmRUbygnbWVvdycpO1xuICAgKlxuICAgKiBAbmFtZSBpdHNlbGZcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdpdHNlbGYnLCBmdW5jdGlvbiAoKSB7XG4gICAgZmxhZyh0aGlzLCAnaXRzZWxmJywgdHJ1ZSk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiAjIyMgLnNhdGlzZnkobWF0Y2hlclssIG1zZ10pXG4gICAqXG4gICAqIEludm9rZXMgdGhlIGdpdmVuIGBtYXRjaGVyYCBmdW5jdGlvbiB3aXRoIHRoZSB0YXJnZXQgYmVpbmcgcGFzc2VkIGFzIHRoZVxuICAgKiBmaXJzdCBhcmd1bWVudCwgYW5kIGFzc2VydHMgdGhhdCB0aGUgdmFsdWUgcmV0dXJuZWQgaXMgdHJ1dGh5LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLnNhdGlzZnkoZnVuY3Rpb24obnVtKSB7XG4gICAqICAgICAgIHJldHVybiBudW0gPiAwOyBcbiAgICogICAgIH0pO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLnNhdGlzZnlgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLm5vdC5zYXRpc2Z5KGZ1bmN0aW9uKG51bSkge1xuICAgKiAgICAgICByZXR1cm4gbnVtID4gMjtcbiAgICogICAgIH0pO1xuICAgKlxuICAgKiBgLnNhdGlzZnlgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5zYXRpc2Z5KGZ1bmN0aW9uKG51bSkge1xuICAgKiAgICAgICByZXR1cm4gbnVtID4gMjtcbiAgICogICAgIH0sICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICpcbiAgICogICAgIGV4cGVjdCgxLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uc2F0aXNmeShmdW5jdGlvbihudW0pIHtcbiAgICogICAgICAgcmV0dXJuIG51bSA+IDI7XG4gICAqICAgICB9KTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAuc2F0aXNmaWVzYCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLnNhdGlzZnlgLlxuICAgKlxuICAgKiBAbmFtZSBzYXRpc2Z5XG4gICAqIEBhbGlhcyBzYXRpc2ZpZXNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbWF0Y2hlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gc2F0aXNmeSAobWF0Y2hlciwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpO1xuICAgIHZhciByZXN1bHQgPSBtYXRjaGVyKG9iaik7XG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIHJlc3VsdFxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBzYXRpc2Z5ICcgKyBfLm9iakRpc3BsYXkobWF0Y2hlcilcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IHNhdGlzZnknICsgXy5vYmpEaXNwbGF5KG1hdGNoZXIpXG4gICAgICAsIGZsYWcodGhpcywgJ25lZ2F0ZScpID8gZmFsc2UgOiB0cnVlXG4gICAgICAsIHJlc3VsdFxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdzYXRpc2Z5Jywgc2F0aXNmeSk7XG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ3NhdGlzZmllcycsIHNhdGlzZnkpO1xuXG4gIC8qKlxuICAgKiAjIyMgLmNsb3NlVG8oZXhwZWN0ZWQsIGRlbHRhWywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgYSBudW1iZXIgdGhhdCdzIHdpdGhpbiBhIGdpdmVuICsvLSBgZGVsdGFgIHJhbmdlXG4gICAqIG9mIHRoZSBnaXZlbiBudW1iZXIgYGV4cGVjdGVkYC4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZVxuICAgKiB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLlxuICAgKlxuICAgKiAgICAgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxLjUpLnRvLmVxdWFsKDEuNSk7XG4gICAqXG4gICAqICAgICAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxLjUpLnRvLmJlLmNsb3NlVG8oMSwgMC41KTtcbiAgICogICAgIGV4cGVjdCgxLjUpLnRvLmJlLmNsb3NlVG8oMiwgMC41KTtcbiAgICogICAgIGV4cGVjdCgxLjUpLnRvLmJlLmNsb3NlVG8oMSwgMSk7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAuY2xvc2VUb2AuXG4gICAqXG4gICAqICAgICBleHBlY3QoMS41KS50by5lcXVhbCgxLjUpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDEuNSkudG8ubm90LmJlLmNsb3NlVG8oMywgMSk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBgLmNsb3NlVG9gIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxLjUpLnRvLmJlLmNsb3NlVG8oMywgMSwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KDEuNSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLmNsb3NlVG8oMywgMSk7XG4gICAqXG4gICAqIFRoZSBhbGlhcyBgLmFwcHJveGltYXRlbHlgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAuY2xvc2VUb2AuXG4gICAqXG4gICAqIEBuYW1lIGNsb3NlVG9cbiAgICogQGFsaWFzIGFwcHJveGltYXRlbHlcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGV4cGVjdGVkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gY2xvc2VUbyhleHBlY3RlZCwgZGVsdGEsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBvYmogPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJyk7XG5cbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkuaXMuYSgnbnVtYmVyJyk7XG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gJ251bWJlcicgfHwgdHlwZW9mIGRlbHRhICE9PSAnbnVtYmVyJykge1xuICAgICAgZmxhZ01zZyA9IGZsYWdNc2cgPyBmbGFnTXNnICsgJzogJyA6ICcnO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICAgIGZsYWdNc2cgKyAndGhlIGFyZ3VtZW50cyB0byBjbG9zZVRvIG9yIGFwcHJveGltYXRlbHkgbXVzdCBiZSBudW1iZXJzJyxcbiAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgc3NmaVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgTWF0aC5hYnMob2JqIC0gZXhwZWN0ZWQpIDw9IGRlbHRhXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGNsb3NlIHRvICcgKyBleHBlY3RlZCArICcgKy8tICcgKyBkZWx0YVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSBub3QgdG8gYmUgY2xvc2UgdG8gJyArIGV4cGVjdGVkICsgJyArLy0gJyArIGRlbHRhXG4gICAgKTtcbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2Nsb3NlVG8nLCBjbG9zZVRvKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnYXBwcm94aW1hdGVseScsIGNsb3NlVG8pO1xuXG4gIC8vIE5vdGU6IER1cGxpY2F0ZXMgYXJlIGlnbm9yZWQgaWYgdGVzdGluZyBmb3IgaW5jbHVzaW9uIGluc3RlYWQgb2Ygc2FtZW5lc3MuXG4gIGZ1bmN0aW9uIGlzU3Vic2V0T2Yoc3Vic2V0LCBzdXBlcnNldCwgY21wLCBjb250YWlucywgb3JkZXJlZCkge1xuICAgIGlmICghY29udGFpbnMpIHtcbiAgICAgIGlmIChzdWJzZXQubGVuZ3RoICE9PSBzdXBlcnNldC5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIHN1cGVyc2V0ID0gc3VwZXJzZXQuc2xpY2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3Vic2V0LmV2ZXJ5KGZ1bmN0aW9uKGVsZW0sIGlkeCkge1xuICAgICAgaWYgKG9yZGVyZWQpIHJldHVybiBjbXAgPyBjbXAoZWxlbSwgc3VwZXJzZXRbaWR4XSkgOiBlbGVtID09PSBzdXBlcnNldFtpZHhdO1xuXG4gICAgICBpZiAoIWNtcCkge1xuICAgICAgICB2YXIgbWF0Y2hJZHggPSBzdXBlcnNldC5pbmRleE9mKGVsZW0pO1xuICAgICAgICBpZiAobWF0Y2hJZHggPT09IC0xKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgLy8gUmVtb3ZlIG1hdGNoIGZyb20gc3VwZXJzZXQgc28gbm90IGNvdW50ZWQgdHdpY2UgaWYgZHVwbGljYXRlIGluIHN1YnNldC5cbiAgICAgICAgaWYgKCFjb250YWlucykgc3VwZXJzZXQuc3BsaWNlKG1hdGNoSWR4LCAxKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdXBlcnNldC5zb21lKGZ1bmN0aW9uKGVsZW0yLCBtYXRjaElkeCkge1xuICAgICAgICBpZiAoIWNtcChlbGVtLCBlbGVtMikpIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyBSZW1vdmUgbWF0Y2ggZnJvbSBzdXBlcnNldCBzbyBub3QgY291bnRlZCB0d2ljZSBpZiBkdXBsaWNhdGUgaW4gc3Vic2V0LlxuICAgICAgICBpZiAoIWNvbnRhaW5zKSBzdXBlcnNldC5zcGxpY2UobWF0Y2hJZHgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubWVtYmVycyhzZXRbLCBtc2ddKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBhcnJheSBoYXMgdGhlIHNhbWUgbWVtYmVycyBhcyB0aGUgZ2l2ZW4gYXJyYXlcbiAgICogYHNldGAuXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLm1lbWJlcnMoWzIsIDEsIDNdKTtcbiAgICogICAgIGV4cGVjdChbMSwgMiwgMl0pLnRvLmhhdmUubWVtYmVycyhbMiwgMSwgMl0pO1xuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBtZW1iZXJzIGFyZSBjb21wYXJlZCB1c2luZyBzdHJpY3QgKGA9PT1gKSBlcXVhbGl0eS4gQWRkIGAuZGVlcGBcbiAgICogZWFybGllciBpbiB0aGUgY2hhaW4gdG8gdXNlIGRlZXAgZXF1YWxpdHkgaW5zdGVhZC4gU2VlIHRoZSBgZGVlcC1lcWxgXG4gICAqIHByb2plY3QgcGFnZSBmb3IgaW5mbyBvbiB0aGUgZGVlcCBlcXVhbGl0eSBhbGdvcml0aG06XG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jaGFpanMvZGVlcC1lcWwuXG4gICAqXG4gICAqICAgICAvLyBUYXJnZXQgYXJyYXkgZGVlcGx5IChidXQgbm90IHN0cmljdGx5KSBoYXMgbWVtYmVyIGB7YTogMX1gXG4gICAqICAgICBleHBlY3QoW3thOiAxfV0pLnRvLmhhdmUuZGVlcC5tZW1iZXJzKFt7YTogMX1dKTtcbiAgICogICAgIGV4cGVjdChbe2E6IDF9XSkudG8ubm90LmhhdmUubWVtYmVycyhbe2E6IDF9XSk7XG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIG9yZGVyIGRvZXNuJ3QgbWF0dGVyLiBBZGQgYC5vcmRlcmVkYCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0b1xuICAgKiByZXF1aXJlIHRoYXQgbWVtYmVycyBhcHBlYXIgaW4gdGhlIHNhbWUgb3JkZXIuXG4gICAqXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5oYXZlLm9yZGVyZWQubWVtYmVycyhbMSwgMiwgM10pO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaGF2ZS5tZW1iZXJzKFsyLCAxLCAzXSlcbiAgICogICAgICAgLmJ1dC5ub3Qub3JkZXJlZC5tZW1iZXJzKFsyLCAxLCAzXSk7XG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIGJvdGggYXJyYXlzIG11c3QgYmUgdGhlIHNhbWUgc2l6ZS4gQWRkIGAuaW5jbHVkZWAgZWFybGllciBpblxuICAgKiB0aGUgY2hhaW4gdG8gcmVxdWlyZSB0aGF0IHRoZSB0YXJnZXQncyBtZW1iZXJzIGJlIGEgc3VwZXJzZXQgb2YgdGhlXG4gICAqIGV4cGVjdGVkIG1lbWJlcnMuIE5vdGUgdGhhdCBkdXBsaWNhdGVzIGFyZSBpZ25vcmVkIGluIHRoZSBzdWJzZXQgd2hlblxuICAgKiBgLmluY2x1ZGVgIGlzIGFkZGVkLlxuICAgKlxuICAgKiAgICAgLy8gVGFyZ2V0IGFycmF5IGlzIGEgc3VwZXJzZXQgb2YgWzEsIDJdIGJ1dCBub3QgaWRlbnRpY2FsXG4gICAqICAgICBleHBlY3QoWzEsIDIsIDNdKS50by5pbmNsdWRlLm1lbWJlcnMoWzEsIDJdKTtcbiAgICogICAgIGV4cGVjdChbMSwgMiwgM10pLnRvLm5vdC5oYXZlLm1lbWJlcnMoWzEsIDJdKTtcbiAgICpcbiAgICogICAgIC8vIER1cGxpY2F0ZXMgaW4gdGhlIHN1YnNldCBhcmUgaWdub3JlZFxuICAgKiAgICAgZXhwZWN0KFsxLCAyLCAzXSkudG8uaW5jbHVkZS5tZW1iZXJzKFsxLCAyLCAyLCAyXSk7XG4gICAqXG4gICAqIGAuZGVlcGAsIGAub3JkZXJlZGAsIGFuZCBgLmluY2x1ZGVgIGNhbiBhbGwgYmUgY29tYmluZWQuIEhvd2V2ZXIsIGlmXG4gICAqIGAuaW5jbHVkZWAgYW5kIGAub3JkZXJlZGAgYXJlIGNvbWJpbmVkLCB0aGUgb3JkZXJpbmcgYmVnaW5zIGF0IHRoZSBzdGFydCBvZlxuICAgKiBib3RoIGFycmF5cy5cbiAgICpcbiAgICogICAgIGV4cGVjdChbe2E6IDF9LCB7YjogMn0sIHtjOiAzfV0pXG4gICAqICAgICAgIC50by5pbmNsdWRlLmRlZXAub3JkZXJlZC5tZW1iZXJzKFt7YTogMX0sIHtiOiAyfV0pXG4gICAqICAgICAgIC5idXQubm90LmluY2x1ZGUuZGVlcC5vcmRlcmVkLm1lbWJlcnMoW3tiOiAyfSwge2M6IDN9XSk7XG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAubWVtYmVyc2AuIEhvd2V2ZXIsIGl0J3NcbiAgICogZGFuZ2Vyb3VzIHRvIGRvIHNvLiBUaGUgcHJvYmxlbSBpcyB0aGF0IGl0IGNyZWF0ZXMgdW5jZXJ0YWluIGV4cGVjdGF0aW9uc1xuICAgKiBieSBhc3NlcnRpbmcgdGhhdCB0aGUgdGFyZ2V0IGFycmF5IGRvZXNuJ3QgaGF2ZSBhbGwgb2YgdGhlIHNhbWUgbWVtYmVycyBhc1xuICAgKiB0aGUgZ2l2ZW4gYXJyYXkgYHNldGAgYnV0IG1heSBvciBtYXkgbm90IGhhdmUgc29tZSBvZiB0aGVtLiBJdCdzIG9mdGVuIGJlc3RcbiAgICogdG8gaWRlbnRpZnkgdGhlIGV4YWN0IG91dHB1dCB0aGF0J3MgZXhwZWN0ZWQsIGFuZCB0aGVuIHdyaXRlIGFuIGFzc2VydGlvblxuICAgKiB0aGF0IG9ubHkgYWNjZXB0cyB0aGF0IGV4YWN0IG91dHB1dC5cbiAgICpcbiAgICogICAgIGV4cGVjdChbMSwgMl0pLnRvLm5vdC5pbmNsdWRlKDMpLmFuZC5ub3QuaW5jbHVkZSg0KTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChbMSwgMl0pLnRvLm5vdC5oYXZlLm1lbWJlcnMoWzMsIDRdKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAubWVtYmVyc2AgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvclxuICAgKiBtZXNzYWdlIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhc1xuICAgKiB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KFsxLCAyXSkudG8uaGF2ZS5tZW1iZXJzKFsxLCAyLCAzXSwgJ25vb28gd2h5IGZhaWw/PycpO1xuICAgKiAgICAgZXhwZWN0KFsxLCAyXSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmhhdmUubWVtYmVycyhbMSwgMiwgM10pO1xuICAgKlxuICAgKiBAbmFtZSBtZW1iZXJzXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnbWVtYmVycycsIGZ1bmN0aW9uIChzdWJzZXQsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBvYmogPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJyk7XG5cbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uYmUuYW4oJ2FycmF5Jyk7XG4gICAgbmV3IEFzc2VydGlvbihzdWJzZXQsIGZsYWdNc2csIHNzZmksIHRydWUpLnRvLmJlLmFuKCdhcnJheScpO1xuXG4gICAgdmFyIGNvbnRhaW5zID0gZmxhZyh0aGlzLCAnY29udGFpbnMnKTtcbiAgICB2YXIgb3JkZXJlZCA9IGZsYWcodGhpcywgJ29yZGVyZWQnKTtcblxuICAgIHZhciBzdWJqZWN0LCBmYWlsTXNnLCBmYWlsTmVnYXRlTXNnLCBsZW5ndGhDaGVjaztcblxuICAgIGlmIChjb250YWlucykge1xuICAgICAgc3ViamVjdCA9IG9yZGVyZWQgPyAnYW4gb3JkZXJlZCBzdXBlcnNldCcgOiAnYSBzdXBlcnNldCc7XG4gICAgICBmYWlsTXNnID0gJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgJyArIHN1YmplY3QgKyAnIG9mICN7ZXhwfSc7XG4gICAgICBmYWlsTmVnYXRlTXNnID0gJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGJlICcgKyBzdWJqZWN0ICsgJyBvZiAje2V4cH0nO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWJqZWN0ID0gb3JkZXJlZCA/ICdvcmRlcmVkIG1lbWJlcnMnIDogJ21lbWJlcnMnO1xuICAgICAgZmFpbE1zZyA9ICdleHBlY3RlZCAje3RoaXN9IHRvIGhhdmUgdGhlIHNhbWUgJyArIHN1YmplY3QgKyAnIGFzICN7ZXhwfSc7XG4gICAgICBmYWlsTmVnYXRlTXNnID0gJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGhhdmUgdGhlIHNhbWUgJyArIHN1YmplY3QgKyAnIGFzICN7ZXhwfSc7XG4gICAgfVxuXG4gICAgdmFyIGNtcCA9IGZsYWcodGhpcywgJ2RlZXAnKSA/IF8uZXFsIDogdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIGlzU3Vic2V0T2Yoc3Vic2V0LCBvYmosIGNtcCwgY29udGFpbnMsIG9yZGVyZWQpXG4gICAgICAsIGZhaWxNc2dcbiAgICAgICwgZmFpbE5lZ2F0ZU1zZ1xuICAgICAgLCBzdWJzZXRcbiAgICAgICwgb2JqXG4gICAgICAsIHRydWVcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5vbmVPZihsaXN0WywgbXNnXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgYSBtZW1iZXIgb2YgdGhlIGdpdmVuIGFycmF5IGBsaXN0YC4gSG93ZXZlcixcbiAgICogaXQncyBvZnRlbiBiZXN0IHRvIGFzc2VydCB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgdG8gaXRzIGV4cGVjdGVkIHZhbHVlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmVxdWFsKDEpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmJlLm9uZU9mKFsxLCAyLCAzXSk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBDb21wYXJpc29ucyBhcmUgcGVyZm9ybWVkIHVzaW5nIHN0cmljdCAoYD09PWApIGVxdWFsaXR5LlxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLm9uZU9mYC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5lcXVhbCgxKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuYmUub25lT2YoWzIsIDMsIDRdKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAub25lT2ZgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3IgbWVzc2FnZVxuICAgKiB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXMgdGhlXG4gICAqIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxKS50by5iZS5vbmVPZihbMiwgMywgNF0sICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdCgxLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUub25lT2YoWzIsIDMsIDRdKTtcbiAgICpcbiAgICogQG5hbWUgb25lT2ZcbiAgICogQHBhcmFtIHtBcnJheTwqPn0gbGlzdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gb25lT2YgKGxpc3QsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBleHBlY3RlZCA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKTtcbiAgICBuZXcgQXNzZXJ0aW9uKGxpc3QsIGZsYWdNc2csIHNzZmksIHRydWUpLnRvLmJlLmFuKCdhcnJheScpO1xuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICAgIGxpc3QuaW5kZXhPZihleHBlY3RlZCkgPiAtMVxuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBiZSBvbmUgb2YgI3tleHB9J1xuICAgICAgLCAnZXhwZWN0ZWQgI3t0aGlzfSB0byBub3QgYmUgb25lIG9mICN7ZXhwfSdcbiAgICAgICwgbGlzdFxuICAgICAgLCBleHBlY3RlZFxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdvbmVPZicsIG9uZU9mKTtcblxuXG4gIC8qKlxuICAgKiAjIyMgLmNoYW5nZShzdWJqZWN0WywgcHJvcFssIG1zZ11dKVxuICAgKlxuICAgKiBXaGVuIG9uZSBhcmd1bWVudCBpcyBwcm92aWRlZCwgYC5jaGFuZ2VgIGFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gZnVuY3Rpb25cbiAgICogYHN1YmplY3RgIHJldHVybnMgYSBkaWZmZXJlbnQgdmFsdWUgd2hlbiBpdCdzIGludm9rZWQgYmVmb3JlIHRoZSB0YXJnZXRcbiAgICogZnVuY3Rpb24gY29tcGFyZWQgdG8gd2hlbiBpdCdzIGludm9rZWQgYWZ0ZXJ3YXJkLiBIb3dldmVyLCBpdCdzIG9mdGVuIGJlc3RcbiAgICogdG8gYXNzZXJ0IHRoYXQgYHN1YmplY3RgIGlzIGVxdWFsIHRvIGl0cyBleHBlY3RlZCB2YWx1ZS5cbiAgICpcbiAgICogICAgIHZhciBkb3RzID0gJydcbiAgICogICAgICAgLCBhZGREb3QgPSBmdW5jdGlvbiAoKSB7IGRvdHMgKz0gJy4nOyB9XG4gICAqICAgICAgICwgZ2V0RG90cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRvdHM7IH07XG4gICAqXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGdldERvdHMoKSkudG8uZXF1YWwoJycpO1xuICAgKiAgICAgYWRkRG90KCk7XG4gICAqICAgICBleHBlY3QoZ2V0RG90cygpKS50by5lcXVhbCgnLicpO1xuICAgKlxuICAgKiAgICAgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoYWRkRG90KS50by5jaGFuZ2UoZ2V0RG90cyk7XG4gICAqXG4gICAqIFdoZW4gdHdvIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQsIGAuY2hhbmdlYCBhc3NlcnRzIHRoYXQgdGhlIHZhbHVlIG9mIHRoZVxuICAgKiBnaXZlbiBvYmplY3QgYHN1YmplY3RgJ3MgYHByb3BgIHByb3BlcnR5IGlzIGRpZmZlcmVudCBiZWZvcmUgaW52b2tpbmcgdGhlXG4gICAqIHRhcmdldCBmdW5jdGlvbiBjb21wYXJlZCB0byBhZnRlcndhcmQuXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7ZG90czogJyd9XG4gICAqICAgICAgICwgYWRkRG90ID0gZnVuY3Rpb24gKCkgeyBteU9iai5kb3RzICs9ICcuJzsgfTtcbiAgICpcbiAgICogICAgIC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QobXlPYmopLnRvLmhhdmUucHJvcGVydHkoJ2RvdHMnLCAnJyk7XG4gICAqICAgICBhZGREb3QoKTtcbiAgICogICAgIGV4cGVjdChteU9iaikudG8uaGF2ZS5wcm9wZXJ0eSgnZG90cycsICcuJyk7XG4gICAqXG4gICAqICAgICAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChhZGREb3QpLnRvLmNoYW5nZShteU9iaiwgJ2RvdHMnKTtcbiAgICpcbiAgICogU3RyaWN0IChgPT09YCkgZXF1YWxpdHkgaXMgdXNlZCB0byBjb21wYXJlIGJlZm9yZSBhbmQgYWZ0ZXIgdmFsdWVzLlxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmNoYW5nZWAuXG4gICAqXG4gICAqICAgICB2YXIgZG90cyA9ICcnXG4gICAqICAgICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG4gICAqICAgICAgICwgZ2V0RG90cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRvdHM7IH07XG4gICAqXG4gICAqICAgICBleHBlY3Qobm9vcCkudG8ubm90LmNoYW5nZShnZXREb3RzKTtcbiAgICpcbiAgICogICAgIHZhciBteU9iaiA9IHtkb3RzOiAnJ31cbiAgICogICAgICAgLCBub29wID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3Qobm9vcCkudG8ubm90LmNoYW5nZShteU9iaiwgJ2RvdHMnKTtcbiAgICpcbiAgICogYC5jaGFuZ2VgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC4gV2hlbiBub3QgcHJvdmlkaW5nIHR3byBhcmd1bWVudHMsIGFsd2F5c1xuICAgKiB1c2UgdGhlIHNlY29uZCBmb3JtLlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge2RvdHM6ICcnfVxuICAgKiAgICAgICAsIGFkZERvdCA9IGZ1bmN0aW9uICgpIHsgbXlPYmouZG90cyArPSAnLic7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkRG90KS50by5ub3QuY2hhbmdlKG15T2JqLCAnZG90cycsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICpcbiAgICogICAgIHZhciBkb3RzID0gJydcbiAgICogICAgICAgLCBhZGREb3QgPSBmdW5jdGlvbiAoKSB7IGRvdHMgKz0gJy4nOyB9XG4gICAqICAgICAgICwgZ2V0RG90cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGRvdHM7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkRG90LCAnbm9vbyB3aHkgZmFpbD8/JykudG8ubm90LmNoYW5nZShnZXREb3RzKTtcbiAgICpcbiAgICogYC5jaGFuZ2VgIGFsc28gY2F1c2VzIGFsbCBgLmJ5YCBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbiB0b1xuICAgKiBhc3NlcnQgaG93IG11Y2ggYSBudW1lcmljIHN1YmplY3Qgd2FzIGluY3JlYXNlZCBvciBkZWNyZWFzZWQgYnkuIEhvd2V2ZXIsXG4gICAqIGl0J3MgZGFuZ2Vyb3VzIHRvIHVzZSBgLmNoYW5nZS5ieWAuIFRoZSBwcm9ibGVtIGlzIHRoYXQgaXQgY3JlYXRlc1xuICAgKiB1bmNlcnRhaW4gZXhwZWN0YXRpb25zIGJ5IGFzc2VydGluZyB0aGF0IHRoZSBzdWJqZWN0IGVpdGhlciBpbmNyZWFzZXMgYnlcbiAgICogdGhlIGdpdmVuIGRlbHRhLCBvciB0aGF0IGl0IGRlY3JlYXNlcyBieSB0aGUgZ2l2ZW4gZGVsdGEuIEl0J3Mgb2Z0ZW4gYmVzdFxuICAgKiB0byBpZGVudGlmeSB0aGUgZXhhY3Qgb3V0cHV0IHRoYXQncyBleHBlY3RlZCwgYW5kIHRoZW4gd3JpdGUgYW4gYXNzZXJ0aW9uXG4gICAqIHRoYXQgb25seSBhY2NlcHRzIHRoYXQgZXhhY3Qgb3V0cHV0LlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBhZGRUd28gPSBmdW5jdGlvbiAoKSB7IG15T2JqLnZhbCArPSAyOyB9XG4gICAqICAgICAgICwgc3VidHJhY3RUd28gPSBmdW5jdGlvbiAoKSB7IG15T2JqLnZhbCAtPSAyOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UobXlPYmosICd2YWwnKS5ieSgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChhZGRUd28pLnRvLmNoYW5nZShteU9iaiwgJ3ZhbCcpLmJ5KDIpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChzdWJ0cmFjdFR3bykudG8uZGVjcmVhc2UobXlPYmosICd2YWwnKS5ieSgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChzdWJ0cmFjdFR3bykudG8uY2hhbmdlKG15T2JqLCAndmFsJykuYnkoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBUaGUgYWxpYXMgYC5jaGFuZ2VzYCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLmNoYW5nZWAuXG4gICAqXG4gICAqIEBuYW1lIGNoYW5nZVxuICAgKiBAYWxpYXMgY2hhbmdlc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gc3ViamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcCBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydENoYW5nZXMgKHN1YmplY3QsIHByb3AsIG1zZykge1xuICAgIGlmIChtc2cpIGZsYWcodGhpcywgJ21lc3NhZ2UnLCBtc2cpO1xuICAgIHZhciBmbiA9IGZsYWcodGhpcywgJ29iamVjdCcpXG4gICAgICAsIGZsYWdNc2cgPSBmbGFnKHRoaXMsICdtZXNzYWdlJylcbiAgICAgICwgc3NmaSA9IGZsYWcodGhpcywgJ3NzZmknKTtcbiAgICBuZXcgQXNzZXJ0aW9uKGZuLCBmbGFnTXNnLCBzc2ZpLCB0cnVlKS5pcy5hKCdmdW5jdGlvbicpO1xuXG4gICAgdmFyIGluaXRpYWw7XG4gICAgaWYgKCFwcm9wKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKHN1YmplY3QsIGZsYWdNc2csIHNzZmksIHRydWUpLmlzLmEoJ2Z1bmN0aW9uJyk7XG4gICAgICBpbml0aWFsID0gc3ViamVjdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKHN1YmplY3QsIGZsYWdNc2csIHNzZmksIHRydWUpLnRvLmhhdmUucHJvcGVydHkocHJvcCk7XG4gICAgICBpbml0aWFsID0gc3ViamVjdFtwcm9wXTtcbiAgICB9XG5cbiAgICBmbigpO1xuXG4gICAgdmFyIGZpbmFsID0gcHJvcCA9PT0gdW5kZWZpbmVkIHx8IHByb3AgPT09IG51bGwgPyBzdWJqZWN0KCkgOiBzdWJqZWN0W3Byb3BdO1xuICAgIHZhciBtc2dPYmogPSBwcm9wID09PSB1bmRlZmluZWQgfHwgcHJvcCA9PT0gbnVsbCA/IGluaXRpYWwgOiAnLicgKyBwcm9wO1xuXG4gICAgLy8gVGhpcyBnZXRzIGZsYWdnZWQgYmVjYXVzZSBvZiB0aGUgLmJ5KGRlbHRhKSBhc3NlcnRpb25cbiAgICBmbGFnKHRoaXMsICdkZWx0YU1zZ09iaicsIG1zZ09iaik7XG4gICAgZmxhZyh0aGlzLCAnaW5pdGlhbERlbHRhVmFsdWUnLCBpbml0aWFsKTtcbiAgICBmbGFnKHRoaXMsICdmaW5hbERlbHRhVmFsdWUnLCBmaW5hbCk7XG4gICAgZmxhZyh0aGlzLCAnZGVsdGFCZWhhdmlvcicsICdjaGFuZ2UnKTtcbiAgICBmbGFnKHRoaXMsICdyZWFsRGVsdGEnLCBmaW5hbCAhPT0gaW5pdGlhbCk7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgIGluaXRpYWwgIT09IGZpbmFsXG4gICAgICAsICdleHBlY3RlZCAnICsgbXNnT2JqICsgJyB0byBjaGFuZ2UnXG4gICAgICAsICdleHBlY3RlZCAnICsgbXNnT2JqICsgJyB0byBub3QgY2hhbmdlJ1xuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdjaGFuZ2UnLCBhc3NlcnRDaGFuZ2VzKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnY2hhbmdlcycsIGFzc2VydENoYW5nZXMpO1xuXG4gIC8qKlxuICAgKiAjIyMgLmluY3JlYXNlKHN1YmplY3RbLCBwcm9wWywgbXNnXV0pXG4gICAqXG4gICAqIFdoZW4gb25lIGFyZ3VtZW50IGlzIHByb3ZpZGVkLCBgLmluY3JlYXNlYCBhc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGZ1bmN0aW9uXG4gICAqIGBzdWJqZWN0YCByZXR1cm5zIGEgZ3JlYXRlciBudW1iZXIgd2hlbiBpdCdzIGludm9rZWQgYWZ0ZXIgaW52b2tpbmcgdGhlXG4gICAqIHRhcmdldCBmdW5jdGlvbiBjb21wYXJlZCB0byB3aGVuIGl0J3MgaW52b2tlZCBiZWZvcmVoYW5kLiBgLmluY3JlYXNlYCBhbHNvXG4gICAqIGNhdXNlcyBhbGwgYC5ieWAgYXNzZXJ0aW9ucyB0aGF0IGZvbGxvdyBpbiB0aGUgY2hhaW4gdG8gYXNzZXJ0IGhvdyBtdWNoXG4gICAqIGdyZWF0ZXIgb2YgYSBudW1iZXIgaXMgcmV0dXJuZWQuIEl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgdGhhdCB0aGUgcmV0dXJuXG4gICAqIHZhbHVlIGluY3JlYXNlZCBieSB0aGUgZXhwZWN0ZWQgYW1vdW50LCByYXRoZXIgdGhhbiBhc3NlcnRpbmcgaXQgaW5jcmVhc2VkXG4gICAqIGJ5IGFueSBhbW91bnQuXG4gICAqXG4gICAqICAgICB2YXIgdmFsID0gMVxuICAgKiAgICAgICAsIGFkZFR3byA9IGZ1bmN0aW9uICgpIHsgdmFsICs9IDI7IH1cbiAgICogICAgICAgLCBnZXRWYWwgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB2YWw7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkVHdvKS50by5pbmNyZWFzZShnZXRWYWwpLmJ5KDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UoZ2V0VmFsKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIFdoZW4gdHdvIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQsIGAuaW5jcmVhc2VgIGFzc2VydHMgdGhhdCB0aGUgdmFsdWUgb2YgdGhlXG4gICAqIGdpdmVuIG9iamVjdCBgc3ViamVjdGAncyBgcHJvcGAgcHJvcGVydHkgaXMgZ3JlYXRlciBhZnRlciBpbnZva2luZyB0aGVcbiAgICogdGFyZ2V0IGZ1bmN0aW9uIGNvbXBhcmVkIHRvIGJlZm9yZWhhbmQuXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7dmFsOiAxfVxuICAgKiAgICAgICAsIGFkZFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsICs9IDI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkVHdvKS50by5pbmNyZWFzZShteU9iaiwgJ3ZhbCcpLmJ5KDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UobXlPYmosICd2YWwnKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIEFkZCBgLm5vdGAgZWFybGllciBpbiB0aGUgY2hhaW4gdG8gbmVnYXRlIGAuaW5jcmVhc2VgLiBIb3dldmVyLCBpdCdzXG4gICAqIGRhbmdlcm91cyB0byBkbyBzby4gVGhlIHByb2JsZW0gaXMgdGhhdCBpdCBjcmVhdGVzIHVuY2VydGFpbiBleHBlY3RhdGlvbnNcbiAgICogYnkgYXNzZXJ0aW5nIHRoYXQgdGhlIHN1YmplY3QgZWl0aGVyIGRlY3JlYXNlcywgb3IgdGhhdCBpdCBzdGF5cyB0aGUgc2FtZS5cbiAgICogSXQncyBvZnRlbiBiZXN0IHRvIGlkZW50aWZ5IHRoZSBleGFjdCBvdXRwdXQgdGhhdCdzIGV4cGVjdGVkLCBhbmQgdGhlblxuICAgKiB3cml0ZSBhbiBhc3NlcnRpb24gdGhhdCBvbmx5IGFjY2VwdHMgdGhhdCBleGFjdCBvdXRwdXQuXG4gICAqXG4gICAqIFdoZW4gdGhlIHN1YmplY3QgaXMgZXhwZWN0ZWQgdG8gZGVjcmVhc2UsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnQgdGhhdCBpdFxuICAgKiBkZWNyZWFzZWQgYnkgdGhlIGV4cGVjdGVkIGFtb3VudC5cbiAgICpcbiAgICogICAgIHZhciBteU9iaiA9IHt2YWw6IDF9XG4gICAqICAgICAgICwgc3VidHJhY3RUd28gPSBmdW5jdGlvbiAoKSB7IG15T2JqLnZhbCAtPSAyOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KHN1YnRyYWN0VHdvKS50by5kZWNyZWFzZShteU9iaiwgJ3ZhbCcpLmJ5KDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KHN1YnRyYWN0VHdvKS50by5ub3QuaW5jcmVhc2UobXlPYmosICd2YWwnKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqIFxuICAgKiBXaGVuIHRoZSBzdWJqZWN0IGlzIGV4cGVjdGVkIHRvIHN0YXkgdGhlIHNhbWUsIGl0J3Mgb2Z0ZW4gYmVzdCB0byBhc3NlcnRcbiAgICogZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBub29wID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3Qobm9vcCkudG8ubm90LmNoYW5nZShteU9iaiwgJ3ZhbCcpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KG5vb3ApLnRvLm5vdC5pbmNyZWFzZShteU9iaiwgJ3ZhbCcpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogYC5pbmNyZWFzZWAgYWNjZXB0cyBhbiBvcHRpb25hbCBgbXNnYCBhcmd1bWVudCB3aGljaCBpcyBhIGN1c3RvbSBlcnJvclxuICAgKiBtZXNzYWdlIHRvIHNob3cgd2hlbiB0aGUgYXNzZXJ0aW9uIGZhaWxzLiBUaGUgbWVzc2FnZSBjYW4gYWxzbyBiZSBnaXZlbiBhc1xuICAgKiB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLiBXaGVuIG5vdCBwcm92aWRpbmcgdHdvIGFyZ3VtZW50cywgYWx3YXlzXG4gICAqIHVzZSB0aGUgc2Vjb25kIGZvcm0uXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7dmFsOiAxfVxuICAgKiAgICAgICAsIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICpcbiAgICogICAgIGV4cGVjdChub29wKS50by5pbmNyZWFzZShteU9iaiwgJ3ZhbCcsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICpcbiAgICogICAgIHZhciB2YWwgPSAxXG4gICAqICAgICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG4gICAqICAgICAgICwgZ2V0VmFsID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KG5vb3AsICdub29vIHdoeSBmYWlsPz8nKS50by5pbmNyZWFzZShnZXRWYWwpO1xuICAgKlxuICAgKiBUaGUgYWxpYXMgYC5pbmNyZWFzZXNgIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSB3aXRoIGAuaW5jcmVhc2VgLlxuICAgKlxuICAgKiBAbmFtZSBpbmNyZWFzZVxuICAgKiBAYWxpYXMgaW5jcmVhc2VzXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBzdWJqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wIG5hbWUgX29wdGlvbmFsX1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gYXNzZXJ0SW5jcmVhc2VzIChzdWJqZWN0LCBwcm9wLCBtc2cpIHtcbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcbiAgICB2YXIgZm4gPSBmbGFnKHRoaXMsICdvYmplY3QnKVxuICAgICAgLCBmbGFnTXNnID0gZmxhZyh0aGlzLCAnbWVzc2FnZScpXG4gICAgICAsIHNzZmkgPSBmbGFnKHRoaXMsICdzc2ZpJyk7XG4gICAgbmV3IEFzc2VydGlvbihmbiwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkuaXMuYSgnZnVuY3Rpb24nKTtcblxuICAgIHZhciBpbml0aWFsO1xuICAgIGlmICghcHJvcCkge1xuICAgICAgbmV3IEFzc2VydGlvbihzdWJqZWN0LCBmbGFnTXNnLCBzc2ZpLCB0cnVlKS5pcy5hKCdmdW5jdGlvbicpO1xuICAgICAgaW5pdGlhbCA9IHN1YmplY3QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3IEFzc2VydGlvbihzdWJqZWN0LCBmbGFnTXNnLCBzc2ZpLCB0cnVlKS50by5oYXZlLnByb3BlcnR5KHByb3ApO1xuICAgICAgaW5pdGlhbCA9IHN1YmplY3RbcHJvcF07XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIHRhcmdldCBpcyBhIG51bWJlclxuICAgIG5ldyBBc3NlcnRpb24oaW5pdGlhbCwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkuaXMuYSgnbnVtYmVyJyk7XG5cbiAgICBmbigpO1xuXG4gICAgdmFyIGZpbmFsID0gcHJvcCA9PT0gdW5kZWZpbmVkIHx8IHByb3AgPT09IG51bGwgPyBzdWJqZWN0KCkgOiBzdWJqZWN0W3Byb3BdO1xuICAgIHZhciBtc2dPYmogPSBwcm9wID09PSB1bmRlZmluZWQgfHwgcHJvcCA9PT0gbnVsbCA/IGluaXRpYWwgOiAnLicgKyBwcm9wO1xuXG4gICAgZmxhZyh0aGlzLCAnZGVsdGFNc2dPYmonLCBtc2dPYmopO1xuICAgIGZsYWcodGhpcywgJ2luaXRpYWxEZWx0YVZhbHVlJywgaW5pdGlhbCk7XG4gICAgZmxhZyh0aGlzLCAnZmluYWxEZWx0YVZhbHVlJywgZmluYWwpO1xuICAgIGZsYWcodGhpcywgJ2RlbHRhQmVoYXZpb3InLCAnaW5jcmVhc2UnKTtcbiAgICBmbGFnKHRoaXMsICdyZWFsRGVsdGEnLCBmaW5hbCAtIGluaXRpYWwpO1xuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICBmaW5hbCAtIGluaXRpYWwgPiAwXG4gICAgICAsICdleHBlY3RlZCAnICsgbXNnT2JqICsgJyB0byBpbmNyZWFzZSdcbiAgICAgICwgJ2V4cGVjdGVkICcgKyBtc2dPYmogKyAnIHRvIG5vdCBpbmNyZWFzZSdcbiAgICApO1xuICB9XG5cbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnaW5jcmVhc2UnLCBhc3NlcnRJbmNyZWFzZXMpO1xuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdpbmNyZWFzZXMnLCBhc3NlcnRJbmNyZWFzZXMpO1xuXG4gIC8qKlxuICAgKiAjIyMgLmRlY3JlYXNlKHN1YmplY3RbLCBwcm9wWywgbXNnXV0pXG4gICAqXG4gICAqIFdoZW4gb25lIGFyZ3VtZW50IGlzIHByb3ZpZGVkLCBgLmRlY3JlYXNlYCBhc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGZ1bmN0aW9uXG4gICAqIGBzdWJqZWN0YCByZXR1cm5zIGEgbGVzc2VyIG51bWJlciB3aGVuIGl0J3MgaW52b2tlZCBhZnRlciBpbnZva2luZyB0aGVcbiAgICogdGFyZ2V0IGZ1bmN0aW9uIGNvbXBhcmVkIHRvIHdoZW4gaXQncyBpbnZva2VkIGJlZm9yZWhhbmQuIGAuZGVjcmVhc2VgIGFsc29cbiAgICogY2F1c2VzIGFsbCBgLmJ5YCBhc3NlcnRpb25zIHRoYXQgZm9sbG93IGluIHRoZSBjaGFpbiB0byBhc3NlcnQgaG93IG11Y2hcbiAgICogbGVzc2VyIG9mIGEgbnVtYmVyIGlzIHJldHVybmVkLiBJdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgdGhlIHJldHVyblxuICAgKiB2YWx1ZSBkZWNyZWFzZWQgYnkgdGhlIGV4cGVjdGVkIGFtb3VudCwgcmF0aGVyIHRoYW4gYXNzZXJ0aW5nIGl0IGRlY3JlYXNlZFxuICAgKiBieSBhbnkgYW1vdW50LlxuICAgKlxuICAgKiAgICAgdmFyIHZhbCA9IDFcbiAgICogICAgICAgLCBzdWJ0cmFjdFR3byA9IGZ1bmN0aW9uICgpIHsgdmFsIC09IDI7IH1cbiAgICogICAgICAgLCBnZXRWYWwgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB2YWw7IH07XG4gICAqXG4gICAqICAgICBleHBlY3Qoc3VidHJhY3RUd28pLnRvLmRlY3JlYXNlKGdldFZhbCkuYnkoMik7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3Qoc3VidHJhY3RUd28pLnRvLmRlY3JlYXNlKGdldFZhbCk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBXaGVuIHR3byBhcmd1bWVudHMgYXJlIHByb3ZpZGVkLCBgLmRlY3JlYXNlYCBhc3NlcnRzIHRoYXQgdGhlIHZhbHVlIG9mIHRoZVxuICAgKiBnaXZlbiBvYmplY3QgYHN1YmplY3RgJ3MgYHByb3BgIHByb3BlcnR5IGlzIGxlc3NlciBhZnRlciBpbnZva2luZyB0aGVcbiAgICogdGFyZ2V0IGZ1bmN0aW9uIGNvbXBhcmVkIHRvIGJlZm9yZWhhbmQuIFxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBzdWJ0cmFjdFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsIC09IDI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3Qoc3VidHJhY3RUd28pLnRvLmRlY3JlYXNlKG15T2JqLCAndmFsJykuYnkoMik7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3Qoc3VidHJhY3RUd28pLnRvLmRlY3JlYXNlKG15T2JqLCAndmFsJyk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmRlY3JlYXNlYC4gSG93ZXZlciwgaXQnc1xuICAgKiBkYW5nZXJvdXMgdG8gZG8gc28uIFRoZSBwcm9ibGVtIGlzIHRoYXQgaXQgY3JlYXRlcyB1bmNlcnRhaW4gZXhwZWN0YXRpb25zXG4gICAqIGJ5IGFzc2VydGluZyB0aGF0IHRoZSBzdWJqZWN0IGVpdGhlciBpbmNyZWFzZXMsIG9yIHRoYXQgaXQgc3RheXMgdGhlIHNhbWUuXG4gICAqIEl0J3Mgb2Z0ZW4gYmVzdCB0byBpZGVudGlmeSB0aGUgZXhhY3Qgb3V0cHV0IHRoYXQncyBleHBlY3RlZCwgYW5kIHRoZW5cbiAgICogd3JpdGUgYW4gYXNzZXJ0aW9uIHRoYXQgb25seSBhY2NlcHRzIHRoYXQgZXhhY3Qgb3V0cHV0LlxuICAgKlxuICAgKiBXaGVuIHRoZSBzdWJqZWN0IGlzIGV4cGVjdGVkIHRvIGluY3JlYXNlLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IHRoYXQgaXRcbiAgICogaW5jcmVhc2VkIGJ5IHRoZSBleHBlY3RlZCBhbW91bnQuXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7dmFsOiAxfVxuICAgKiAgICAgICAsIGFkZFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsICs9IDI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkVHdvKS50by5pbmNyZWFzZShteU9iaiwgJ3ZhbCcpLmJ5KDIpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8ubm90LmRlY3JlYXNlKG15T2JqLCAndmFsJyk7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKiBcbiAgICogV2hlbiB0aGUgc3ViamVjdCBpcyBleHBlY3RlZCB0byBzdGF5IHRoZSBzYW1lLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0XG4gICAqIGV4YWN0bHkgdGhhdC5cbiAgICpcbiAgICogICAgIHZhciBteU9iaiA9IHt2YWw6IDF9XG4gICAqICAgICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KG5vb3ApLnRvLm5vdC5jaGFuZ2UobXlPYmosICd2YWwnKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChub29wKS50by5ub3QuZGVjcmVhc2UobXlPYmosICd2YWwnKTsgLy8gTm90IHJlY29tbWVuZGVkXG4gICAqXG4gICAqIGAuZGVjcmVhc2VgIGFjY2VwdHMgYW4gb3B0aW9uYWwgYG1zZ2AgYXJndW1lbnQgd2hpY2ggaXMgYSBjdXN0b20gZXJyb3JcbiAgICogbWVzc2FnZSB0byBzaG93IHdoZW4gdGhlIGFzc2VydGlvbiBmYWlscy4gVGhlIG1lc3NhZ2UgY2FuIGFsc28gYmUgZ2l2ZW4gYXNcbiAgICogdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC4gV2hlbiBub3QgcHJvdmlkaW5nIHR3byBhcmd1bWVudHMsIGFsd2F5c1xuICAgKiB1c2UgdGhlIHNlY29uZCBmb3JtLlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBub29wID0gZnVuY3Rpb24gKCkge307XG4gICAqXG4gICAqICAgICBleHBlY3Qobm9vcCkudG8uZGVjcmVhc2UobXlPYmosICd2YWwnLCAnbm9vbyB3aHkgZmFpbD8/Jyk7XG4gICAqXG4gICAqICAgICB2YXIgdmFsID0gMVxuICAgKiAgICAgICAsIG5vb3AgPSBmdW5jdGlvbiAoKSB7fVxuICAgKiAgICAgICAsIGdldFZhbCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbDsgfTtcbiAgICpcbiAgICogICAgIGV4cGVjdChub29wLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uZGVjcmVhc2UoZ2V0VmFsKTtcbiAgICpcbiAgICogVGhlIGFsaWFzIGAuZGVjcmVhc2VzYCBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHkgd2l0aCBgLmRlY3JlYXNlYC5cbiAgICpcbiAgICogQG5hbWUgZGVjcmVhc2VcbiAgICogQGFsaWFzIGRlY3JlYXNlc1xuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gc3ViamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcCBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydERlY3JlYXNlcyAoc3ViamVjdCwgcHJvcCwgbXNnKSB7XG4gICAgaWYgKG1zZykgZmxhZyh0aGlzLCAnbWVzc2FnZScsIG1zZyk7XG4gICAgdmFyIGZuID0gZmxhZyh0aGlzLCAnb2JqZWN0JylcbiAgICAgICwgZmxhZ01zZyA9IGZsYWcodGhpcywgJ21lc3NhZ2UnKVxuICAgICAgLCBzc2ZpID0gZmxhZyh0aGlzLCAnc3NmaScpO1xuICAgIG5ldyBBc3NlcnRpb24oZm4sIGZsYWdNc2csIHNzZmksIHRydWUpLmlzLmEoJ2Z1bmN0aW9uJyk7XG5cbiAgICB2YXIgaW5pdGlhbDtcbiAgICBpZiAoIXByb3ApIHtcbiAgICAgIG5ldyBBc3NlcnRpb24oc3ViamVjdCwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkuaXMuYSgnZnVuY3Rpb24nKTtcbiAgICAgIGluaXRpYWwgPSBzdWJqZWN0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBBc3NlcnRpb24oc3ViamVjdCwgZmxhZ01zZywgc3NmaSwgdHJ1ZSkudG8uaGF2ZS5wcm9wZXJ0eShwcm9wKTtcbiAgICAgIGluaXRpYWwgPSBzdWJqZWN0W3Byb3BdO1xuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHRoZSB0YXJnZXQgaXMgYSBudW1iZXJcbiAgICBuZXcgQXNzZXJ0aW9uKGluaXRpYWwsIGZsYWdNc2csIHNzZmksIHRydWUpLmlzLmEoJ251bWJlcicpO1xuXG4gICAgZm4oKTtcblxuICAgIHZhciBmaW5hbCA9IHByb3AgPT09IHVuZGVmaW5lZCB8fCBwcm9wID09PSBudWxsID8gc3ViamVjdCgpIDogc3ViamVjdFtwcm9wXTtcbiAgICB2YXIgbXNnT2JqID0gcHJvcCA9PT0gdW5kZWZpbmVkIHx8IHByb3AgPT09IG51bGwgPyBpbml0aWFsIDogJy4nICsgcHJvcDtcblxuICAgIGZsYWcodGhpcywgJ2RlbHRhTXNnT2JqJywgbXNnT2JqKTtcbiAgICBmbGFnKHRoaXMsICdpbml0aWFsRGVsdGFWYWx1ZScsIGluaXRpYWwpO1xuICAgIGZsYWcodGhpcywgJ2ZpbmFsRGVsdGFWYWx1ZScsIGZpbmFsKTtcbiAgICBmbGFnKHRoaXMsICdkZWx0YUJlaGF2aW9yJywgJ2RlY3JlYXNlJyk7XG4gICAgZmxhZyh0aGlzLCAncmVhbERlbHRhJywgaW5pdGlhbCAtIGZpbmFsKTtcblxuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgZmluYWwgLSBpbml0aWFsIDwgMFxuICAgICAgLCAnZXhwZWN0ZWQgJyArIG1zZ09iaiArICcgdG8gZGVjcmVhc2UnXG4gICAgICAsICdleHBlY3RlZCAnICsgbXNnT2JqICsgJyB0byBub3QgZGVjcmVhc2UnXG4gICAgKTtcbiAgfVxuXG4gIEFzc2VydGlvbi5hZGRNZXRob2QoJ2RlY3JlYXNlJywgYXNzZXJ0RGVjcmVhc2VzKTtcbiAgQXNzZXJ0aW9uLmFkZE1ldGhvZCgnZGVjcmVhc2VzJywgYXNzZXJ0RGVjcmVhc2VzKTtcblxuICAvKipcbiAgICogIyMjIC5ieShkZWx0YVssIG1zZ10pXG4gICAqXG4gICAqIFdoZW4gZm9sbG93aW5nIGFuIGAuaW5jcmVhc2VgIGFzc2VydGlvbiBpbiB0aGUgY2hhaW4sIGAuYnlgIGFzc2VydHMgdGhhdFxuICAgKiB0aGUgc3ViamVjdCBvZiB0aGUgYC5pbmNyZWFzZWAgYXNzZXJ0aW9uIGluY3JlYXNlZCBieSB0aGUgZ2l2ZW4gYGRlbHRhYC5cbiAgICpcbiAgICogICAgIHZhciBteU9iaiA9IHt2YWw6IDF9XG4gICAqICAgICAgICwgYWRkVHdvID0gZnVuY3Rpb24gKCkgeyBteU9iai52YWwgKz0gMjsgfTtcbiAgICpcbiAgICogICAgIGV4cGVjdChhZGRUd28pLnRvLmluY3JlYXNlKG15T2JqLCAndmFsJykuYnkoMik7XG4gICAqXG4gICAqIFdoZW4gZm9sbG93aW5nIGEgYC5kZWNyZWFzZWAgYXNzZXJ0aW9uIGluIHRoZSBjaGFpbiwgYC5ieWAgYXNzZXJ0cyB0aGF0IHRoZVxuICAgKiBzdWJqZWN0IG9mIHRoZSBgLmRlY3JlYXNlYCBhc3NlcnRpb24gZGVjcmVhc2VkIGJ5IHRoZSBnaXZlbiBgZGVsdGFgLlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBzdWJ0cmFjdFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsIC09IDI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3Qoc3VidHJhY3RUd28pLnRvLmRlY3JlYXNlKG15T2JqLCAndmFsJykuYnkoMik7XG4gICAqXG4gICAqIFdoZW4gZm9sbG93aW5nIGEgYC5jaGFuZ2VgIGFzc2VydGlvbiBpbiB0aGUgY2hhaW4sIGAuYnlgIGFzc2VydHMgdGhhdCB0aGVcbiAgICogc3ViamVjdCBvZiB0aGUgYC5jaGFuZ2VgIGFzc2VydGlvbiBlaXRoZXIgaW5jcmVhc2VkIG9yIGRlY3JlYXNlZCBieSB0aGVcbiAgICogZ2l2ZW4gYGRlbHRhYC4gSG93ZXZlciwgaXQncyBkYW5nZXJvdXMgdG8gdXNlIGAuY2hhbmdlLmJ5YC4gVGhlIHByb2JsZW0gaXNcbiAgICogdGhhdCBpdCBjcmVhdGVzIHVuY2VydGFpbiBleHBlY3RhdGlvbnMuIEl0J3Mgb2Z0ZW4gYmVzdCB0byBpZGVudGlmeSB0aGVcbiAgICogZXhhY3Qgb3V0cHV0IHRoYXQncyBleHBlY3RlZCwgYW5kIHRoZW4gd3JpdGUgYW4gYXNzZXJ0aW9uIHRoYXQgb25seSBhY2NlcHRzXG4gICAqIHRoYXQgZXhhY3Qgb3V0cHV0LlxuICAgKlxuICAgKiAgICAgdmFyIG15T2JqID0ge3ZhbDogMX1cbiAgICogICAgICAgLCBhZGRUd28gPSBmdW5jdGlvbiAoKSB7IG15T2JqLnZhbCArPSAyOyB9XG4gICAqICAgICAgICwgc3VidHJhY3RUd28gPSBmdW5jdGlvbiAoKSB7IG15T2JqLnZhbCAtPSAyOyB9O1xuICAgKlxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UobXlPYmosICd2YWwnKS5ieSgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChhZGRUd28pLnRvLmNoYW5nZShteU9iaiwgJ3ZhbCcpLmJ5KDIpOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogICAgIGV4cGVjdChzdWJ0cmFjdFR3bykudG8uZGVjcmVhc2UobXlPYmosICd2YWwnKS5ieSgyKTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChzdWJ0cmFjdFR3bykudG8uY2hhbmdlKG15T2JqLCAndmFsJykuYnkoMik7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmJ5YC4gSG93ZXZlciwgaXQncyBvZnRlbiBiZXN0XG4gICAqIHRvIGFzc2VydCB0aGF0IHRoZSBzdWJqZWN0IGNoYW5nZWQgYnkgaXRzIGV4cGVjdGVkIGRlbHRhLCByYXRoZXIgdGhhblxuICAgKiBhc3NlcnRpbmcgdGhhdCBpdCBkaWRuJ3QgY2hhbmdlIGJ5IG9uZSBvZiBjb3VudGxlc3MgdW5leHBlY3RlZCBkZWx0YXMuXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7dmFsOiAxfVxuICAgKiAgICAgICAsIGFkZFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsICs9IDI7IH07XG4gICAqXG4gICAqICAgICAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UobXlPYmosICd2YWwnKS5ieSgyKTtcbiAgICpcbiAgICogICAgIC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KGFkZFR3bykudG8uaW5jcmVhc2UobXlPYmosICd2YWwnKS5idXQubm90LmJ5KDMpO1xuICAgKlxuICAgKiBgLmJ5YCBhY2NlcHRzIGFuIG9wdGlvbmFsIGBtc2dgIGFyZ3VtZW50IHdoaWNoIGlzIGEgY3VzdG9tIGVycm9yIG1lc3NhZ2UgdG9cbiAgICogc2hvdyB3aGVuIHRoZSBhc3NlcnRpb24gZmFpbHMuIFRoZSBtZXNzYWdlIGNhbiBhbHNvIGJlIGdpdmVuIGFzIHRoZSBzZWNvbmRcbiAgICogYXJndW1lbnQgdG8gYGV4cGVjdGAuXG4gICAqXG4gICAqICAgICB2YXIgbXlPYmogPSB7dmFsOiAxfVxuICAgKiAgICAgICAsIGFkZFR3byA9IGZ1bmN0aW9uICgpIHsgbXlPYmoudmFsICs9IDI7IH07XG4gICAqXG4gICAqICAgICBleHBlY3QoYWRkVHdvKS50by5pbmNyZWFzZShteU9iaiwgJ3ZhbCcpLmJ5KDMsICdub29vIHdoeSBmYWlsPz8nKTtcbiAgICogICAgIGV4cGVjdChhZGRUd28sICdub29vIHdoeSBmYWlsPz8nKS50by5pbmNyZWFzZShteU9iaiwgJ3ZhbCcpLmJ5KDMpO1xuICAgKlxuICAgKiBAbmFtZSBieVxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1zZyBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFzc2VydERlbHRhKGRlbHRhLCBtc2cpIHtcbiAgICBpZiAobXNnKSBmbGFnKHRoaXMsICdtZXNzYWdlJywgbXNnKTtcblxuICAgIHZhciBtc2dPYmogPSBmbGFnKHRoaXMsICdkZWx0YU1zZ09iaicpO1xuICAgIHZhciBpbml0aWFsID0gZmxhZyh0aGlzLCAnaW5pdGlhbERlbHRhVmFsdWUnKTtcbiAgICB2YXIgZmluYWwgPSBmbGFnKHRoaXMsICdmaW5hbERlbHRhVmFsdWUnKTtcbiAgICB2YXIgYmVoYXZpb3IgPSBmbGFnKHRoaXMsICdkZWx0YUJlaGF2aW9yJyk7XG4gICAgdmFyIHJlYWxEZWx0YSA9IGZsYWcodGhpcywgJ3JlYWxEZWx0YScpO1xuXG4gICAgdmFyIGV4cHJlc3Npb247XG4gICAgaWYgKGJlaGF2aW9yID09PSAnY2hhbmdlJykge1xuICAgICAgZXhwcmVzc2lvbiA9IE1hdGguYWJzKGZpbmFsIC0gaW5pdGlhbCkgPT09IE1hdGguYWJzKGRlbHRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwcmVzc2lvbiA9IHJlYWxEZWx0YSA9PT0gTWF0aC5hYnMoZGVsdGEpO1xuICAgIH1cblxuICAgIHRoaXMuYXNzZXJ0KFxuICAgICAgZXhwcmVzc2lvblxuICAgICAgLCAnZXhwZWN0ZWQgJyArIG1zZ09iaiArICcgdG8gJyArIGJlaGF2aW9yICsgJyBieSAnICsgZGVsdGFcbiAgICAgICwgJ2V4cGVjdGVkICcgKyBtc2dPYmogKyAnIHRvIG5vdCAnICsgYmVoYXZpb3IgKyAnIGJ5ICcgKyBkZWx0YVxuICAgICk7XG4gIH1cblxuICBBc3NlcnRpb24uYWRkTWV0aG9kKCdieScsIGFzc2VydERlbHRhKTtcblxuICAvKipcbiAgICogIyMjIC5leHRlbnNpYmxlXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGV4dGVuc2libGUsIHdoaWNoIG1lYW5zIHRoYXQgbmV3IHByb3BlcnRpZXMgY2FuXG4gICAqIGJlIGFkZGVkIHRvIGl0LiBQcmltaXRpdmVzIGFyZSBuZXZlciBleHRlbnNpYmxlLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSkudG8uYmUuZXh0ZW5zaWJsZTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5leHRlbnNpYmxlYC5cbiAgICpcbiAgICogICAgIHZhciBub25FeHRlbnNpYmxlT2JqZWN0ID0gT2JqZWN0LnByZXZlbnRFeHRlbnNpb25zKHt9KVxuICAgKiAgICAgICAsIHNlYWxlZE9iamVjdCA9IE9iamVjdC5zZWFsKHt9KVxuICAgKiAgICAgICAsIGZyb3plbk9iamVjdCA9IE9iamVjdC5mcmVlemUoe30pO1xuICAgKlxuICAgKiAgICAgZXhwZWN0KG5vbkV4dGVuc2libGVPYmplY3QpLnRvLm5vdC5iZS5leHRlbnNpYmxlO1xuICAgKiAgICAgZXhwZWN0KHNlYWxlZE9iamVjdCkudG8ubm90LmJlLmV4dGVuc2libGU7XG4gICAqICAgICBleHBlY3QoZnJvemVuT2JqZWN0KS50by5ub3QuYmUuZXh0ZW5zaWJsZTtcbiAgICogICAgIGV4cGVjdCgxKS50by5ub3QuYmUuZXh0ZW5zaWJsZTtcbiAgICpcbiAgICogQSBjdXN0b20gZXJyb3IgbWVzc2FnZSBjYW4gYmUgZ2l2ZW4gYXMgdGhlIHNlY29uZCBhcmd1bWVudCB0byBgZXhwZWN0YC5cbiAgICpcbiAgICogICAgIGV4cGVjdCgxLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUuZXh0ZW5zaWJsZTtcbiAgICpcbiAgICogQG5hbWUgZXh0ZW5zaWJsZVxuICAgKiBAbmFtZXNwYWNlIEJERFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBBc3NlcnRpb24uYWRkUHJvcGVydHkoJ2V4dGVuc2libGUnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0Jyk7XG5cbiAgICAvLyBJbiBFUzUsIGlmIHRoZSBhcmd1bWVudCB0byB0aGlzIG1ldGhvZCBpcyBhIHByaW1pdGl2ZSwgdGhlbiBpdCB3aWxsIGNhdXNlIGEgVHlwZUVycm9yLlxuICAgIC8vIEluIEVTNiwgYSBub24tb2JqZWN0IGFyZ3VtZW50IHdpbGwgYmUgdHJlYXRlZCBhcyBpZiBpdCB3YXMgYSBub24tZXh0ZW5zaWJsZSBvcmRpbmFyeSBvYmplY3QsIHNpbXBseSByZXR1cm4gZmFsc2UuXG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2lzRXh0ZW5zaWJsZVxuICAgIC8vIFRoZSBmb2xsb3dpbmcgcHJvdmlkZXMgRVM2IGJlaGF2aW9yIGZvciBFUzUgZW52aXJvbm1lbnRzLlxuXG4gICAgdmFyIGlzRXh0ZW5zaWJsZSA9IG9iaiA9PT0gT2JqZWN0KG9iaikgJiYgT2JqZWN0LmlzRXh0ZW5zaWJsZShvYmopO1xuXG4gICAgdGhpcy5hc3NlcnQoXG4gICAgICBpc0V4dGVuc2libGVcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gYmUgZXh0ZW5zaWJsZSdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGJlIGV4dGVuc2libGUnXG4gICAgKTtcbiAgfSk7XG5cbiAgLyoqXG4gICAqICMjIyAuc2VhbGVkXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIHNlYWxlZCwgd2hpY2ggbWVhbnMgdGhhdCBuZXcgcHJvcGVydGllcyBjYW4ndCBiZVxuICAgKiBhZGRlZCB0byBpdCwgYW5kIGl0cyBleGlzdGluZyBwcm9wZXJ0aWVzIGNhbid0IGJlIHJlY29uZmlndXJlZCBvciBkZWxldGVkLlxuICAgKiBIb3dldmVyLCBpdCdzIHBvc3NpYmxlIHRoYXQgaXRzIGV4aXN0aW5nIHByb3BlcnRpZXMgY2FuIHN0aWxsIGJlIHJlYXNzaWduZWRcbiAgICogdG8gZGlmZmVyZW50IHZhbHVlcy4gUHJpbWl0aXZlcyBhcmUgYWx3YXlzIHNlYWxlZC5cbiAgICpcbiAgICogICAgIHZhciBzZWFsZWRPYmplY3QgPSBPYmplY3Quc2VhbCh7fSk7XG4gICAqICAgICB2YXIgZnJvemVuT2JqZWN0ID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG4gICAqXG4gICAqICAgICBleHBlY3Qoc2VhbGVkT2JqZWN0KS50by5iZS5zZWFsZWQ7XG4gICAqICAgICBleHBlY3QoZnJvemVuT2JqZWN0KS50by5iZS5zZWFsZWQ7XG4gICAqICAgICBleHBlY3QoMSkudG8uYmUuc2VhbGVkO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLnNlYWxlZGAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5ub3QuYmUuc2VhbGVkO1xuICAgKlxuICAgKiBBIGN1c3RvbSBlcnJvciBtZXNzYWdlIGNhbiBiZSBnaXZlbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLnNlYWxlZDtcbiAgICpcbiAgICogQG5hbWUgc2VhbGVkXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnc2VhbGVkJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpO1xuXG4gICAgLy8gSW4gRVM1LCBpZiB0aGUgYXJndW1lbnQgdG8gdGhpcyBtZXRob2QgaXMgYSBwcmltaXRpdmUsIHRoZW4gaXQgd2lsbCBjYXVzZSBhIFR5cGVFcnJvci5cbiAgICAvLyBJbiBFUzYsIGEgbm9uLW9iamVjdCBhcmd1bWVudCB3aWxsIGJlIHRyZWF0ZWQgYXMgaWYgaXQgd2FzIGEgc2VhbGVkIG9yZGluYXJ5IG9iamVjdCwgc2ltcGx5IHJldHVybiB0cnVlLlxuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvaXNTZWFsZWRcbiAgICAvLyBUaGUgZm9sbG93aW5nIHByb3ZpZGVzIEVTNiBiZWhhdmlvciBmb3IgRVM1IGVudmlyb25tZW50cy5cblxuICAgIHZhciBpc1NlYWxlZCA9IG9iaiA9PT0gT2JqZWN0KG9iaikgPyBPYmplY3QuaXNTZWFsZWQob2JqKSA6IHRydWU7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgIGlzU2VhbGVkXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIHNlYWxlZCdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGJlIHNlYWxlZCdcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5mcm96ZW5cbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgZnJvemVuLCB3aGljaCBtZWFucyB0aGF0IG5ldyBwcm9wZXJ0aWVzIGNhbid0IGJlXG4gICAqIGFkZGVkIHRvIGl0LCBhbmQgaXRzIGV4aXN0aW5nIHByb3BlcnRpZXMgY2FuJ3QgYmUgcmVhc3NpZ25lZCB0byBkaWZmZXJlbnRcbiAgICogdmFsdWVzLCByZWNvbmZpZ3VyZWQsIG9yIGRlbGV0ZWQuIFByaW1pdGl2ZXMgYXJlIGFsd2F5cyBmcm96ZW4uXG4gICAqXG4gICAqICAgICB2YXIgZnJvemVuT2JqZWN0ID0gT2JqZWN0LmZyZWV6ZSh7fSk7XG4gICAqXG4gICAqICAgICBleHBlY3QoZnJvemVuT2JqZWN0KS50by5iZS5mcm96ZW47XG4gICAqICAgICBleHBlY3QoMSkudG8uYmUuZnJvemVuO1xuICAgKlxuICAgKiBBZGQgYC5ub3RgIGVhcmxpZXIgaW4gdGhlIGNoYWluIHRvIG5lZ2F0ZSBgLmZyb3plbmAuXG4gICAqXG4gICAqICAgICBleHBlY3Qoe2E6IDF9KS50by5ub3QuYmUuZnJvemVuO1xuICAgKlxuICAgKiBBIGN1c3RvbSBlcnJvciBtZXNzYWdlIGNhbiBiZSBnaXZlbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KHthOiAxfSwgJ25vb28gd2h5IGZhaWw/PycpLnRvLmJlLmZyb3plbjtcbiAgICpcbiAgICogQG5hbWUgZnJvemVuXG4gICAqIEBuYW1lc3BhY2UgQkREXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIEFzc2VydGlvbi5hZGRQcm9wZXJ0eSgnZnJvemVuJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIG9iaiA9IGZsYWcodGhpcywgJ29iamVjdCcpO1xuXG4gICAgLy8gSW4gRVM1LCBpZiB0aGUgYXJndW1lbnQgdG8gdGhpcyBtZXRob2QgaXMgYSBwcmltaXRpdmUsIHRoZW4gaXQgd2lsbCBjYXVzZSBhIFR5cGVFcnJvci5cbiAgICAvLyBJbiBFUzYsIGEgbm9uLW9iamVjdCBhcmd1bWVudCB3aWxsIGJlIHRyZWF0ZWQgYXMgaWYgaXQgd2FzIGEgZnJvemVuIG9yZGluYXJ5IG9iamVjdCwgc2ltcGx5IHJldHVybiB0cnVlLlxuICAgIC8vIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvaXNGcm96ZW5cbiAgICAvLyBUaGUgZm9sbG93aW5nIHByb3ZpZGVzIEVTNiBiZWhhdmlvciBmb3IgRVM1IGVudmlyb25tZW50cy5cblxuICAgIHZhciBpc0Zyb3plbiA9IG9iaiA9PT0gT2JqZWN0KG9iaikgPyBPYmplY3QuaXNGcm96ZW4ob2JqKSA6IHRydWU7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgIGlzRnJvemVuXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGZyb3plbidcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGJlIGZyb3plbidcbiAgICApO1xuICB9KTtcblxuICAvKipcbiAgICogIyMjIC5maW5pdGVcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgYSBudW1iZXIsIGFuZCBpc24ndCBgTmFOYCBvciBwb3NpdGl2ZS9uZWdhdGl2ZVxuICAgKiBgSW5maW5pdHlgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KDEpLnRvLmJlLmZpbml0ZTtcbiAgICpcbiAgICogQWRkIGAubm90YCBlYXJsaWVyIGluIHRoZSBjaGFpbiB0byBuZWdhdGUgYC5maW5pdGVgLiBIb3dldmVyLCBpdCdzXG4gICAqIGRhbmdlcm91cyB0byBkbyBzby4gVGhlIHByb2JsZW0gaXMgdGhhdCBpdCBjcmVhdGVzIHVuY2VydGFpbiBleHBlY3RhdGlvbnNcbiAgICogYnkgYXNzZXJ0aW5nIHRoYXQgdGhlIHN1YmplY3QgZWl0aGVyIGlzbid0IGEgbnVtYmVyLCBvciB0aGF0IGl0J3MgYE5hTmAsIG9yXG4gICAqIHRoYXQgaXQncyBwb3NpdGl2ZSBgSW5maW5pdHlgLCBvciB0aGF0IGl0J3MgbmVnYXRpdmUgYEluZmluaXR5YC4gSXQncyBvZnRlblxuICAgKiBiZXN0IHRvIGlkZW50aWZ5IHRoZSBleGFjdCBvdXRwdXQgdGhhdCdzIGV4cGVjdGVkLCBhbmQgdGhlbiB3cml0ZSBhblxuICAgKiBhc3NlcnRpb24gdGhhdCBvbmx5IGFjY2VwdHMgdGhhdCBleGFjdCBvdXRwdXQuXG4gICAqXG4gICAqIFdoZW4gdGhlIHRhcmdldCBpc24ndCBleHBlY3RlZCB0byBiZSBhIG51bWJlciwgaXQncyBvZnRlbiBiZXN0IHRvIGFzc2VydFxuICAgKiB0aGF0IGl0J3MgdGhlIGV4cGVjdGVkIHR5cGUsIHJhdGhlciB0aGFuIGFzc2VydGluZyB0aGF0IGl0IGlzbid0IG9uZSBvZlxuICAgKiBtYW55IHVuZXhwZWN0ZWQgdHlwZXMuXG4gICAqXG4gICAqICAgICBleHBlY3QoJ2ZvbycpLnRvLmJlLmEoJ3N0cmluZycpOyAvLyBSZWNvbW1lbmRlZFxuICAgKiAgICAgZXhwZWN0KCdmb28nKS50by5ub3QuYmUuZmluaXRlOyAvLyBOb3QgcmVjb21tZW5kZWRcbiAgICpcbiAgICogV2hlbiB0aGUgdGFyZ2V0IGlzIGV4cGVjdGVkIHRvIGJlIGBOYU5gLCBpdCdzIG9mdGVuIGJlc3QgdG8gYXNzZXJ0IGV4YWN0bHlcbiAgICogdGhhdC5cbiAgICpcbiAgICogICAgIGV4cGVjdChOYU4pLnRvLmJlLk5hTjsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdChOYU4pLnRvLm5vdC5iZS5maW5pdGU7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXMgZXhwZWN0ZWQgdG8gYmUgcG9zaXRpdmUgaW5maW5pdHksIGl0J3Mgb2Z0ZW4gYmVzdCB0b1xuICAgKiBhc3NlcnQgZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KEluZmluaXR5KS50by5lcXVhbChJbmZpbml0eSk7IC8vIFJlY29tbWVuZGVkXG4gICAqICAgICBleHBlY3QoSW5maW5pdHkpLnRvLm5vdC5iZS5maW5pdGU7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBXaGVuIHRoZSB0YXJnZXQgaXMgZXhwZWN0ZWQgdG8gYmUgbmVnYXRpdmUgaW5maW5pdHksIGl0J3Mgb2Z0ZW4gYmVzdCB0b1xuICAgKiBhc3NlcnQgZXhhY3RseSB0aGF0LlxuICAgKlxuICAgKiAgICAgZXhwZWN0KC1JbmZpbml0eSkudG8uZXF1YWwoLUluZmluaXR5KTsgLy8gUmVjb21tZW5kZWRcbiAgICogICAgIGV4cGVjdCgtSW5maW5pdHkpLnRvLm5vdC5iZS5maW5pdGU7IC8vIE5vdCByZWNvbW1lbmRlZFxuICAgKlxuICAgKiBBIGN1c3RvbSBlcnJvciBtZXNzYWdlIGNhbiBiZSBnaXZlbiBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHRvIGBleHBlY3RgLlxuICAgKlxuICAgKiAgICAgZXhwZWN0KCdmb28nLCAnbm9vbyB3aHkgZmFpbD8/JykudG8uYmUuZmluaXRlO1xuICAgKlxuICAgKiBAbmFtZSBmaW5pdGVcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQXNzZXJ0aW9uLmFkZFByb3BlcnR5KCdmaW5pdGUnLCBmdW5jdGlvbihtc2cpIHtcbiAgICB2YXIgb2JqID0gZmxhZyh0aGlzLCAnb2JqZWN0Jyk7XG5cbiAgICB0aGlzLmFzc2VydChcbiAgICAgICAgdHlwZW9mIG9iaiA9PT0gXCJudW1iZXJcIiAmJiBpc0Zpbml0ZShvYmopXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGJlIGEgZmluaXRlIG51bWJlcidcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGJlIGEgZmluaXRlIG51bWJlcidcbiAgICApO1xuICB9KTtcbn07XG4iLCIvKiFcbiAqIGNoYWlcbiAqIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNoYWksIHV0aWwpIHtcblxuICAvKiFcbiAgICogQ2hhaSBkZXBlbmRlbmNpZXMuXG4gICAqL1xuXG4gIHZhciBBc3NlcnRpb24gPSBjaGFpLkFzc2VydGlvblxuICAgICwgZmxhZyA9IHV0aWwuZmxhZztcblxuICAvKiFcbiAgICogTW9kdWxlIGV4cG9ydC5cbiAgICovXG5cbiAgLyoqXG4gICAqICMjIyBhc3NlcnQoZXhwcmVzc2lvbiwgbWVzc2FnZSlcbiAgICpcbiAgICogV3JpdGUgeW91ciBvd24gdGVzdCBleHByZXNzaW9ucy5cbiAgICpcbiAgICogICAgIGFzc2VydCgnZm9vJyAhPT0gJ2JhcicsICdmb28gaXMgbm90IGJhcicpO1xuICAgKiAgICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoW10pLCAnZW1wdHkgYXJyYXlzIGFyZSBhcnJheXMnKTtcbiAgICpcbiAgICogQHBhcmFtIHtNaXhlZH0gZXhwcmVzc2lvbiB0byB0ZXN0IGZvciB0cnV0aGluZXNzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIHRvIGRpc3BsYXkgb24gZXJyb3JcbiAgICogQG5hbWUgYXNzZXJ0XG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHZhciBhc3NlcnQgPSBjaGFpLmFzc2VydCA9IGZ1bmN0aW9uIChleHByZXNzLCBlcnJtc2cpIHtcbiAgICB2YXIgdGVzdCA9IG5ldyBBc3NlcnRpb24obnVsbCwgbnVsbCwgY2hhaS5hc3NlcnQsIHRydWUpO1xuICAgIHRlc3QuYXNzZXJ0KFxuICAgICAgICBleHByZXNzXG4gICAgICAsIGVycm1zZ1xuICAgICAgLCAnWyBuZWdhdGlvbiBtZXNzYWdlIHVuYXZhaWxhYmxlIF0nXG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5mYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIFttZXNzYWdlXSwgW29wZXJhdG9yXSlcbiAgICpcbiAgICogVGhyb3cgYSBmYWlsdXJlLiBOb2RlLmpzIGBhc3NlcnRgIG1vZHVsZS1jb21wYXRpYmxlLlxuICAgKlxuICAgKiBAbmFtZSBmYWlsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3BlcmF0b3JcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmZhaWwgPSBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IpIHtcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCAnYXNzZXJ0LmZhaWwoKSc7XG4gICAgdGhyb3cgbmV3IGNoYWkuQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSwge1xuICAgICAgICBhY3R1YWw6IGFjdHVhbFxuICAgICAgLCBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICwgb3BlcmF0b3I6IG9wZXJhdG9yXG4gICAgfSwgYXNzZXJ0LmZhaWwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzT2sob2JqZWN0LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBpcyB0cnV0aHkuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNPaygnZXZlcnl0aGluZycsICdldmVyeXRoaW5nIGlzIG9rJyk7XG4gICAqICAgICBhc3NlcnQuaXNPayhmYWxzZSwgJ3RoaXMgd2lsbCBmYWlsJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzT2tcbiAgICogQGFsaWFzIG9rXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdCB0byB0ZXN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc09rID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzT2ssIHRydWUpLmlzLm9rO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzTm90T2sob2JqZWN0LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBpcyBmYWxzeS5cbiAgICpcbiAgICogICAgIGFzc2VydC5pc05vdE9rKCdldmVyeXRoaW5nJywgJ3RoaXMgd2lsbCBmYWlsJyk7XG4gICAqICAgICBhc3NlcnQuaXNOb3RPayhmYWxzZSwgJ3RoaXMgd2lsbCBwYXNzJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzTm90T2tcbiAgICogQGFsaWFzIG5vdE9rXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdCB0byB0ZXN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc05vdE9rID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzTm90T2ssIHRydWUpLmlzLm5vdC5vaztcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgbm9uLXN0cmljdCBlcXVhbGl0eSAoYD09YCkgb2YgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAuXG4gICAqXG4gICAqICAgICBhc3NlcnQuZXF1YWwoMywgJzMnLCAnPT0gY29lcmNlcyB2YWx1ZXMgdG8gc3RyaW5ncycpO1xuICAgKlxuICAgKiBAbmFtZSBlcXVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAgICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gKGFjdCwgZXhwLCBtc2cpIHtcbiAgICB2YXIgdGVzdCA9IG5ldyBBc3NlcnRpb24oYWN0LCBtc2csIGFzc2VydC5lcXVhbCwgdHJ1ZSk7XG5cbiAgICB0ZXN0LmFzc2VydChcbiAgICAgICAgZXhwID09IGZsYWcodGVzdCwgJ29iamVjdCcpXG4gICAgICAsICdleHBlY3RlZCAje3RoaXN9IHRvIGVxdWFsICN7ZXhwfSdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGVxdWFsICN7YWN0fSdcbiAgICAgICwgZXhwXG4gICAgICAsIGFjdFxuICAgICAgLCB0cnVlXG4gICAgKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgbm9uLXN0cmljdCBpbmVxdWFsaXR5IChgIT1gKSBvZiBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYC5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3RFcXVhbCgzLCA0LCAndGhlc2UgbnVtYmVycyBhcmUgbm90IGVxdWFsJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdEVxdWFsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiAoYWN0LCBleHAsIG1zZykge1xuICAgIHZhciB0ZXN0ID0gbmV3IEFzc2VydGlvbihhY3QsIG1zZywgYXNzZXJ0Lm5vdEVxdWFsLCB0cnVlKTtcblxuICAgIHRlc3QuYXNzZXJ0KFxuICAgICAgICBleHAgIT0gZmxhZyh0ZXN0LCAnb2JqZWN0JylcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gbm90IGVxdWFsICN7ZXhwfSdcbiAgICAgICwgJ2V4cGVjdGVkICN7dGhpc30gdG8gZXF1YWwgI3thY3R9J1xuICAgICAgLCBleHBcbiAgICAgICwgYWN0XG4gICAgICAsIHRydWVcbiAgICApO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyBzdHJpY3QgZXF1YWxpdHkgKGA9PT1gKSBvZiBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYC5cbiAgICpcbiAgICogICAgIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCB0cnVlLCAndGhlc2UgYm9vbGVhbnMgYXJlIHN0cmljdGx5IGVxdWFsJyk7XG4gICAqXG4gICAqIEBuYW1lIHN0cmljdEVxdWFsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiAoYWN0LCBleHAsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oYWN0LCBtc2csIGFzc2VydC5zdHJpY3RFcXVhbCwgdHJ1ZSkudG8uZXF1YWwoZXhwKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgc3RyaWN0IGluZXF1YWxpdHkgKGAhPT1gKSBvZiBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYC5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3RTdHJpY3RFcXVhbCgzLCAnMycsICdubyBjb2VyY2lvbiBmb3Igc3RyaWN0IGVxdWFsaXR5Jyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdFN0cmljdEVxdWFsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiAoYWN0LCBleHAsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oYWN0LCBtc2csIGFzc2VydC5ub3RTdHJpY3RFcXVhbCwgdHJ1ZSkudG8ubm90LmVxdWFsKGV4cCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBhY3R1YWxgIGlzIGRlZXBseSBlcXVhbCB0byBgZXhwZWN0ZWRgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmRlZXBFcXVhbCh7IHRlYTogJ2dyZWVuJyB9LCB7IHRlYTogJ2dyZWVuJyB9KTtcbiAgICpcbiAgICogQG5hbWUgZGVlcEVxdWFsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAYWxpYXMgZGVlcFN0cmljdEVxdWFsXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kZWVwRXF1YWwgPSBhc3NlcnQuZGVlcFN0cmljdEVxdWFsID0gZnVuY3Rpb24gKGFjdCwgZXhwLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGFjdCwgbXNnLCBhc3NlcnQuZGVlcEVxdWFsLCB0cnVlKS50by5lcWwoZXhwKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnQgdGhhdCBgYWN0dWFsYCBpcyBub3QgZGVlcGx5IGVxdWFsIHRvIGBleHBlY3RlZGAuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90RGVlcEVxdWFsKHsgdGVhOiAnZ3JlZW4nIH0sIHsgdGVhOiAnamFzbWluZScgfSk7XG4gICAqXG4gICAqIEBuYW1lIG5vdERlZXBFcXVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBhY3R1YWxcbiAgICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIChhY3QsIGV4cCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihhY3QsIG1zZywgYXNzZXJ0Lm5vdERlZXBFcXVhbCwgdHJ1ZSkudG8ubm90LmVxbChleHApO1xuICB9O1xuXG4gICAvKipcbiAgICogIyMjIC5pc0Fib3ZlKHZhbHVlVG9DaGVjaywgdmFsdWVUb0JlQWJvdmUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyBgdmFsdWVUb0NoZWNrYCBpcyBzdHJpY3RseSBncmVhdGVyIHRoYW4gKD4pIGB2YWx1ZVRvQmVBYm92ZWAuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNBYm92ZSg1LCAyLCAnNSBpcyBzdHJpY3RseSBncmVhdGVyIHRoYW4gMicpO1xuICAgKlxuICAgKiBAbmFtZSBpc0Fib3ZlXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlVG9DaGVja1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVRvQmVBYm92ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNBYm92ZSA9IGZ1bmN0aW9uICh2YWwsIGFidiwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzQWJvdmUsIHRydWUpLnRvLmJlLmFib3ZlKGFidik7XG4gIH07XG5cbiAgIC8qKlxuICAgKiAjIyMgLmlzQXRMZWFzdCh2YWx1ZVRvQ2hlY2ssIHZhbHVlVG9CZUF0TGVhc3QsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyBgdmFsdWVUb0NoZWNrYCBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gKD49KSBgdmFsdWVUb0JlQXRMZWFzdGAuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNBdExlYXN0KDUsIDIsICc1IGlzIGdyZWF0ZXIgb3IgZXF1YWwgdG8gMicpO1xuICAgKiAgICAgYXNzZXJ0LmlzQXRMZWFzdCgzLCAzLCAnMyBpcyBncmVhdGVyIG9yIGVxdWFsIHRvIDMnKTtcbiAgICpcbiAgICogQG5hbWUgaXNBdExlYXN0XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlVG9DaGVja1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVRvQmVBdExlYXN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc0F0TGVhc3QgPSBmdW5jdGlvbiAodmFsLCBhdGxzdCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzQXRMZWFzdCwgdHJ1ZSkudG8uYmUubGVhc3QoYXRsc3QpO1xuICB9O1xuXG4gICAvKipcbiAgICogIyMjIC5pc0JlbG93KHZhbHVlVG9DaGVjaywgdmFsdWVUb0JlQmVsb3csIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyBgdmFsdWVUb0NoZWNrYCBpcyBzdHJpY3RseSBsZXNzIHRoYW4gKDwpIGB2YWx1ZVRvQmVCZWxvd2AuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNCZWxvdygzLCA2LCAnMyBpcyBzdHJpY3RseSBsZXNzIHRoYW4gNicpO1xuICAgKlxuICAgKiBAbmFtZSBpc0JlbG93XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlVG9DaGVja1xuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVRvQmVCZWxvd1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNCZWxvdyA9IGZ1bmN0aW9uICh2YWwsIGJsdywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzQmVsb3csIHRydWUpLnRvLmJlLmJlbG93KGJsdyk7XG4gIH07XG5cbiAgIC8qKlxuICAgKiAjIyMgLmlzQXRNb3N0KHZhbHVlVG9DaGVjaywgdmFsdWVUb0JlQXRNb3N0LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgYHZhbHVlVG9DaGVja2AgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICg8PSkgYHZhbHVlVG9CZUF0TW9zdGAuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNBdE1vc3QoMywgNiwgJzMgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIDYnKTtcbiAgICogICAgIGFzc2VydC5pc0F0TW9zdCg0LCA0LCAnNCBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gNCcpO1xuICAgKlxuICAgKiBAbmFtZSBpc0F0TW9zdFxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVRvQ2hlY2tcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVUb0JlQXRNb3N0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc0F0TW9zdCA9IGZ1bmN0aW9uICh2YWwsIGF0bXN0LCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNBdE1vc3QsIHRydWUpLnRvLmJlLm1vc3QoYXRtc3QpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzVHJ1ZSh2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyB0cnVlLlxuICAgKlxuICAgKiAgICAgdmFyIHRlYVNlcnZlZCA9IHRydWU7XG4gICAqICAgICBhc3NlcnQuaXNUcnVlKHRlYVNlcnZlZCwgJ3RoZSB0ZWEgaGFzIGJlZW4gc2VydmVkJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzVHJ1ZVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNUcnVlID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzVHJ1ZSwgdHJ1ZSkuaXNbJ3RydWUnXTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdFRydWUodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgbm90IHRydWUuXG4gICAqXG4gICAqICAgICB2YXIgdGVhID0gJ3Rhc3R5IGNoYWknO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90VHJ1ZSh0ZWEsICdncmVhdCwgdGltZSBmb3IgdGVhIScpO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdFRydWVcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90VHJ1ZSA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdFRydWUsIHRydWUpLnRvLm5vdC5lcXVhbCh0cnVlKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc0ZhbHNlKHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIGlzIGZhbHNlLlxuICAgKlxuICAgKiAgICAgdmFyIHRlYVNlcnZlZCA9IGZhbHNlO1xuICAgKiAgICAgYXNzZXJ0LmlzRmFsc2UodGVhU2VydmVkLCAnbm8gdGVhIHlldD8gaG1tLi4uJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzRmFsc2VcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRmFsc2UgPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNGYWxzZSwgdHJ1ZSkuaXNbJ2ZhbHNlJ107XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3RGYWxzZSh2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyBub3QgZmFsc2UuXG4gICAqXG4gICAqICAgICB2YXIgdGVhID0gJ3Rhc3R5IGNoYWknO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90RmFsc2UodGVhLCAnZ3JlYXQsIHRpbWUgZm9yIHRlYSEnKTtcbiAgICpcbiAgICogQG5hbWUgaXNOb3RGYWxzZVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3RGYWxzZSA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdEZhbHNlLCB0cnVlKS50by5ub3QuZXF1YWwoZmFsc2UpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzTnVsbCh2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyBudWxsLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzTnVsbChlcnIsICd0aGVyZSB3YXMgbm8gZXJyb3InKTtcbiAgICpcbiAgICogQG5hbWUgaXNOdWxsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc051bGwgPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNOdWxsLCB0cnVlKS50by5lcXVhbChudWxsKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdE51bGwodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgbm90IG51bGwuXG4gICAqXG4gICAqICAgICB2YXIgdGVhID0gJ3Rhc3R5IGNoYWknO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90TnVsbCh0ZWEsICdncmVhdCwgdGltZSBmb3IgdGVhIScpO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdE51bGxcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90TnVsbCA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdE51bGwsIHRydWUpLnRvLm5vdC5lcXVhbChudWxsKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05hTlxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdmFsdWUgaXMgTmFOLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzTmFOKE5hTiwgJ05hTiBpcyBOYU4nKTtcbiAgICpcbiAgICogQG5hbWUgaXNOYU5cbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTmFOID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzTmFOLCB0cnVlKS50by5iZS5OYU47XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3ROYU5cbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHZhbHVlIGlzIG5vdCBOYU4uXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNOb3ROYU4oNCwgJzQgaXMgbm90IE5hTicpO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdE5hTlxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgYXNzZXJ0LmlzTm90TmFOID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzTm90TmFOLCB0cnVlKS5ub3QudG8uYmUuTmFOO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmV4aXN0c1xuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBuZWl0aGVyIGBudWxsYCBub3IgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqICAgICB2YXIgZm9vID0gJ2hpJztcbiAgICpcbiAgICogICAgIGFzc2VydC5leGlzdHMoZm9vLCAnZm9vIGlzIG5laXRoZXIgYG51bGxgIG5vciBgdW5kZWZpbmVkYCcpO1xuICAgKlxuICAgKiBAbmFtZSBleGlzdHNcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmV4aXN0cyA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5leGlzdHMsIHRydWUpLnRvLmV4aXN0O1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm5vdEV4aXN0c1xuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBpcyBlaXRoZXIgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiAgICAgdmFyIGJhciA9IG51bGxcbiAgICogICAgICAgLCBiYXo7XG4gICAqXG4gICAqICAgICBhc3NlcnQubm90RXhpc3RzKGJhcik7XG4gICAqICAgICBhc3NlcnQubm90RXhpc3RzKGJheiwgJ2JheiBpcyBlaXRoZXIgbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgICpcbiAgICogQG5hbWUgbm90RXhpc3RzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RFeGlzdHMgPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQubm90RXhpc3RzLCB0cnVlKS50by5ub3QuZXhpc3Q7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNVbmRlZmluZWQodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqICAgICB2YXIgdGVhO1xuICAgKiAgICAgYXNzZXJ0LmlzVW5kZWZpbmVkKHRlYSwgJ25vIHRlYSBkZWZpbmVkJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzVW5kZWZpbmVkXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc1VuZGVmaW5lZCwgdHJ1ZSkudG8uZXF1YWwodW5kZWZpbmVkKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc0RlZmluZWQodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgbm90IGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiAgICAgdmFyIHRlYSA9ICdjdXAgb2YgY2hhaSc7XG4gICAqICAgICBhc3NlcnQuaXNEZWZpbmVkKHRlYSwgJ3RlYSBoYXMgYmVlbiBkZWZpbmVkJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzRGVmaW5lZFxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNEZWZpbmVkID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzRGVmaW5lZCwgdHJ1ZSkudG8ubm90LmVxdWFsKHVuZGVmaW5lZCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNGdW5jdGlvbih2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICAgKlxuICAgKiAgICAgZnVuY3Rpb24gc2VydmVUZWEoKSB7IHJldHVybiAnY3VwIG9mIHRlYSc7IH07XG4gICAqICAgICBhc3NlcnQuaXNGdW5jdGlvbihzZXJ2ZVRlYSwgJ2dyZWF0LCB3ZSBjYW4gaGF2ZSB0ZWEgbm93Jyk7XG4gICAqXG4gICAqIEBuYW1lIGlzRnVuY3Rpb25cbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRnVuY3Rpb24gPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNGdW5jdGlvbiwgdHJ1ZSkudG8uYmUuYSgnZnVuY3Rpb24nKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdEZ1bmN0aW9uKHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIGlzIF9ub3RfIGEgZnVuY3Rpb24uXG4gICAqXG4gICAqICAgICB2YXIgc2VydmVUZWEgPSBbICdoZWF0JywgJ3BvdXInLCAnc2lwJyBdO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90RnVuY3Rpb24oc2VydmVUZWEsICdncmVhdCwgd2UgaGF2ZSBsaXN0ZWQgdGhlIHN0ZXBzJyk7XG4gICAqXG4gICAqIEBuYW1lIGlzTm90RnVuY3Rpb25cbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90RnVuY3Rpb24gPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNOb3RGdW5jdGlvbiwgdHJ1ZSkudG8ubm90LmJlLmEoJ2Z1bmN0aW9uJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNPYmplY3QodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYW4gb2JqZWN0IG9mIHR5cGUgJ09iamVjdCcgKGFzIHJldmVhbGVkIGJ5IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCkuXG4gICAqIF9UaGUgYXNzZXJ0aW9uIGRvZXMgbm90IG1hdGNoIHN1YmNsYXNzZWQgb2JqZWN0cy5fXG4gICAqXG4gICAqICAgICB2YXIgc2VsZWN0aW9uID0geyBuYW1lOiAnQ2hhaScsIHNlcnZlOiAnd2l0aCBzcGljZXMnIH07XG4gICAqICAgICBhc3NlcnQuaXNPYmplY3Qoc2VsZWN0aW9uLCAndGVhIHNlbGVjdGlvbiBpcyBhbiBvYmplY3QnKTtcbiAgICpcbiAgICogQG5hbWUgaXNPYmplY3RcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzT2JqZWN0ID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzT2JqZWN0LCB0cnVlKS50by5iZS5hKCdvYmplY3QnKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdE9iamVjdCh2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyBfbm90XyBhbiBvYmplY3Qgb2YgdHlwZSAnT2JqZWN0JyAoYXMgcmV2ZWFsZWQgYnkgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgKS5cbiAgICpcbiAgICogICAgIHZhciBzZWxlY3Rpb24gPSAnY2hhaSdcbiAgICogICAgIGFzc2VydC5pc05vdE9iamVjdChzZWxlY3Rpb24sICd0ZWEgc2VsZWN0aW9uIGlzIG5vdCBhbiBvYmplY3QnKTtcbiAgICogICAgIGFzc2VydC5pc05vdE9iamVjdChudWxsLCAnbnVsbCBpcyBub3QgYW4gb2JqZWN0Jyk7XG4gICAqXG4gICAqIEBuYW1lIGlzTm90T2JqZWN0XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc05vdE9iamVjdCA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdE9iamVjdCwgdHJ1ZSkudG8ubm90LmJlLmEoJ29iamVjdCcpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzQXJyYXkodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYW4gYXJyYXkuXG4gICAqXG4gICAqICAgICB2YXIgbWVudSA9IFsgJ2dyZWVuJywgJ2NoYWknLCAnb29sb25nJyBdO1xuICAgKiAgICAgYXNzZXJ0LmlzQXJyYXkobWVudSwgJ3doYXQga2luZCBvZiB0ZWEgZG8gd2Ugd2FudD8nKTtcbiAgICpcbiAgICogQG5hbWUgaXNBcnJheVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNBcnJheSA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc0FycmF5LCB0cnVlKS50by5iZS5hbignYXJyYXknKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdEFycmF5KHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIGlzIF9ub3RfIGFuIGFycmF5LlxuICAgKlxuICAgKiAgICAgdmFyIG1lbnUgPSAnZ3JlZW58Y2hhaXxvb2xvbmcnO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90QXJyYXkobWVudSwgJ3doYXQga2luZCBvZiB0ZWEgZG8gd2Ugd2FudD8nKTtcbiAgICpcbiAgICogQG5hbWUgaXNOb3RBcnJheVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3RBcnJheSA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdEFycmF5LCB0cnVlKS50by5ub3QuYmUuYW4oJ2FycmF5Jyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNTdHJpbmcodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYSBzdHJpbmcuXG4gICAqXG4gICAqICAgICB2YXIgdGVhT3JkZXIgPSAnY2hhaSc7XG4gICAqICAgICBhc3NlcnQuaXNTdHJpbmcodGVhT3JkZXIsICdvcmRlciBwbGFjZWQnKTtcbiAgICpcbiAgICogQG5hbWUgaXNTdHJpbmdcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzU3RyaW5nID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzU3RyaW5nLCB0cnVlKS50by5iZS5hKCdzdHJpbmcnKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdFN0cmluZyh2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBpcyBfbm90XyBhIHN0cmluZy5cbiAgICpcbiAgICogICAgIHZhciB0ZWFPcmRlciA9IDQ7XG4gICAqICAgICBhc3NlcnQuaXNOb3RTdHJpbmcodGVhT3JkZXIsICdvcmRlciBwbGFjZWQnKTtcbiAgICpcbiAgICogQG5hbWUgaXNOb3RTdHJpbmdcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90U3RyaW5nID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzTm90U3RyaW5nLCB0cnVlKS50by5ub3QuYmUuYSgnc3RyaW5nJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOdW1iZXIodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYSBudW1iZXIuXG4gICAqXG4gICAqICAgICB2YXIgY3VwcyA9IDI7XG4gICAqICAgICBhc3NlcnQuaXNOdW1iZXIoY3VwcywgJ2hvdyBtYW55IGN1cHMnKTtcbiAgICpcbiAgICogQG5hbWUgaXNOdW1iZXJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc051bWJlciA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc051bWJlciwgdHJ1ZSkudG8uYmUuYSgnbnVtYmVyJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3ROdW1iZXIodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgX25vdF8gYSBudW1iZXIuXG4gICAqXG4gICAqICAgICB2YXIgY3VwcyA9ICcyIGN1cHMgcGxlYXNlJztcbiAgICogICAgIGFzc2VydC5pc05vdE51bWJlcihjdXBzLCAnaG93IG1hbnkgY3VwcycpO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdE51bWJlclxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3ROdW1iZXIgPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNOb3ROdW1iZXIsIHRydWUpLnRvLm5vdC5iZS5hKCdudW1iZXInKTtcbiAgfTtcblxuICAgLyoqXG4gICAqICMjIyAuaXNGaW5pdGUodmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYSBmaW5pdGUgbnVtYmVyLiBVbmxpa2UgYC5pc051bWJlcmAsIHRoaXMgd2lsbCBmYWlsIGZvciBgTmFOYCBhbmQgYEluZmluaXR5YC5cbiAgICpcbiAgICogICAgIHZhciBjdXBzID0gMjtcbiAgICogICAgIGFzc2VydC5pc0Zpbml0ZShjdXBzLCAnaG93IG1hbnkgY3VwcycpO1xuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzRmluaXRlKE5hTik7IC8vIHRocm93c1xuICAgKlxuICAgKiBAbmFtZSBpc0Zpbml0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRmluaXRlID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzRmluaXRlLCB0cnVlKS50by5iZS5maW5pdGU7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNCb29sZWFuKHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIGlzIGEgYm9vbGVhbi5cbiAgICpcbiAgICogICAgIHZhciB0ZWFSZWFkeSA9IHRydWVcbiAgICogICAgICAgLCB0ZWFTZXJ2ZWQgPSBmYWxzZTtcbiAgICpcbiAgICogICAgIGFzc2VydC5pc0Jvb2xlYW4odGVhUmVhZHksICdpcyB0aGUgdGVhIHJlYWR5Jyk7XG4gICAqICAgICBhc3NlcnQuaXNCb29sZWFuKHRlYVNlcnZlZCwgJ2hhcyB0ZWEgYmVlbiBzZXJ2ZWQnKTtcbiAgICpcbiAgICogQG5hbWUgaXNCb29sZWFuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pc0Jvb2xlYW4gPSBmdW5jdGlvbiAodmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQuaXNCb29sZWFuLCB0cnVlKS50by5iZS5hKCdib29sZWFuJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3RCb29sZWFuKHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIGlzIF9ub3RfIGEgYm9vbGVhbi5cbiAgICpcbiAgICogICAgIHZhciB0ZWFSZWFkeSA9ICd5ZXAnXG4gICAqICAgICAgICwgdGVhU2VydmVkID0gJ25vcGUnO1xuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzTm90Qm9vbGVhbih0ZWFSZWFkeSwgJ2lzIHRoZSB0ZWEgcmVhZHknKTtcbiAgICogICAgIGFzc2VydC5pc05vdEJvb2xlYW4odGVhU2VydmVkLCAnaGFzIHRlYSBiZWVuIHNlcnZlZCcpO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdEJvb2xlYW5cbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90Qm9vbGVhbiA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc05vdEJvb2xlYW4sIHRydWUpLnRvLm5vdC5iZS5hKCdib29sZWFuJyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAudHlwZU9mKHZhbHVlLCBuYW1lLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgJ3MgdHlwZSBpcyBgbmFtZWAsIGFzIGRldGVybWluZWQgYnlcbiAgICogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LnR5cGVPZih7IHRlYTogJ2NoYWknIH0sICdvYmplY3QnLCAnd2UgaGF2ZSBhbiBvYmplY3QnKTtcbiAgICogICAgIGFzc2VydC50eXBlT2YoWydjaGFpJywgJ2phc21pbmUnXSwgJ2FycmF5JywgJ3dlIGhhdmUgYW4gYXJyYXknKTtcbiAgICogICAgIGFzc2VydC50eXBlT2YoJ3RlYScsICdzdHJpbmcnLCAnd2UgaGF2ZSBhIHN0cmluZycpO1xuICAgKiAgICAgYXNzZXJ0LnR5cGVPZigvdGVhLywgJ3JlZ2V4cCcsICd3ZSBoYXZlIGEgcmVndWxhciBleHByZXNzaW9uJyk7XG4gICAqICAgICBhc3NlcnQudHlwZU9mKG51bGwsICdudWxsJywgJ3dlIGhhdmUgYSBudWxsJyk7XG4gICAqICAgICBhc3NlcnQudHlwZU9mKHVuZGVmaW5lZCwgJ3VuZGVmaW5lZCcsICd3ZSBoYXZlIGFuIHVuZGVmaW5lZCcpO1xuICAgKlxuICAgKiBAbmFtZSB0eXBlT2ZcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LnR5cGVPZiA9IGZ1bmN0aW9uICh2YWwsIHR5cGUsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC50eXBlT2YsIHRydWUpLnRvLmJlLmEodHlwZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90VHlwZU9mKHZhbHVlLCBuYW1lLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgJ3MgdHlwZSBpcyBfbm90XyBgbmFtZWAsIGFzIGRldGVybWluZWQgYnlcbiAgICogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdFR5cGVPZigndGVhJywgJ251bWJlcicsICdzdHJpbmdzIGFyZSBub3QgbnVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBub3RUeXBlT2ZcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGVvZiBuYW1lXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RUeXBlT2YgPSBmdW5jdGlvbiAodmFsLCB0eXBlLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnLCBhc3NlcnQubm90VHlwZU9mLCB0cnVlKS50by5ub3QuYmUuYSh0eXBlKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pbnN0YW5jZU9mKG9iamVjdCwgY29uc3RydWN0b3IsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGB2YWx1ZWAgaXMgYW4gaW5zdGFuY2Ugb2YgYGNvbnN0cnVjdG9yYC5cbiAgICpcbiAgICogICAgIHZhciBUZWEgPSBmdW5jdGlvbiAobmFtZSkgeyB0aGlzLm5hbWUgPSBuYW1lOyB9XG4gICAqICAgICAgICwgY2hhaSA9IG5ldyBUZWEoJ2NoYWknKTtcbiAgICpcbiAgICogICAgIGFzc2VydC5pbnN0YW5jZU9mKGNoYWksIFRlYSwgJ2NoYWkgaXMgYW4gaW5zdGFuY2Ugb2YgdGVhJyk7XG4gICAqXG4gICAqIEBuYW1lIGluc3RhbmNlT2ZcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge0NvbnN0cnVjdG9yfSBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaW5zdGFuY2VPZiA9IGZ1bmN0aW9uICh2YWwsIHR5cGUsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pbnN0YW5jZU9mLCB0cnVlKS50by5iZS5pbnN0YW5jZU9mKHR5cGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm5vdEluc3RhbmNlT2Yob2JqZWN0LCBjb25zdHJ1Y3RvciwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIGB2YWx1ZWAgaXMgbm90IGFuIGluc3RhbmNlIG9mIGBjb25zdHJ1Y3RvcmAuXG4gICAqXG4gICAqICAgICB2YXIgVGVhID0gZnVuY3Rpb24gKG5hbWUpIHsgdGhpcy5uYW1lID0gbmFtZTsgfVxuICAgKiAgICAgICAsIGNoYWkgPSBuZXcgU3RyaW5nKCdjaGFpJyk7XG4gICAqXG4gICAqICAgICBhc3NlcnQubm90SW5zdGFuY2VPZihjaGFpLCBUZWEsICdjaGFpIGlzIG5vdCBhbiBpbnN0YW5jZSBvZiB0ZWEnKTtcbiAgICpcbiAgICogQG5hbWUgbm90SW5zdGFuY2VPZlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7Q29uc3RydWN0b3J9IGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RJbnN0YW5jZU9mID0gZnVuY3Rpb24gKHZhbCwgdHlwZSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0Lm5vdEluc3RhbmNlT2YsIHRydWUpXG4gICAgICAudG8ubm90LmJlLmluc3RhbmNlT2YodHlwZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaW5jbHVkZShoYXlzdGFjaywgbmVlZGxlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgaGF5c3RhY2tgIGluY2x1ZGVzIGBuZWVkbGVgLiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlXG4gICAqIGluY2x1c2lvbiBvZiBhIHZhbHVlIGluIGFuIGFycmF5LCBhIHN1YnN0cmluZyBpbiBhIHN0cmluZywgb3IgYSBzdWJzZXQgb2ZcbiAgICogcHJvcGVydGllcyBpbiBhbiBvYmplY3QuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaW5jbHVkZShbMSwyLDNdLCAyLCAnYXJyYXkgY29udGFpbnMgdmFsdWUnKTtcbiAgICogICAgIGFzc2VydC5pbmNsdWRlKCdmb29iYXInLCAnZm9vJywgJ3N0cmluZyBjb250YWlucyBzdWJzdHJpbmcnKTtcbiAgICogICAgIGFzc2VydC5pbmNsdWRlKHsgZm9vOiAnYmFyJywgaGVsbG86ICd1bml2ZXJzZScgfSwgeyBmb286ICdiYXInIH0sICdvYmplY3QgY29udGFpbnMgcHJvcGVydHknKTtcbiAgICpcbiAgICogU3RyaWN0IGVxdWFsaXR5ICg9PT0pIGlzIHVzZWQuIFdoZW4gYXNzZXJ0aW5nIHRoZSBpbmNsdXNpb24gb2YgYSB2YWx1ZSBpblxuICAgKiBhbiBhcnJheSwgdGhlIGFycmF5IGlzIHNlYXJjaGVkIGZvciBhbiBlbGVtZW50IHRoYXQncyBzdHJpY3RseSBlcXVhbCB0byB0aGVcbiAgICogZ2l2ZW4gdmFsdWUuIFdoZW4gYXNzZXJ0aW5nIGEgc3Vic2V0IG9mIHByb3BlcnRpZXMgaW4gYW4gb2JqZWN0LCB0aGUgb2JqZWN0XG4gICAqIGlzIHNlYXJjaGVkIGZvciB0aGUgZ2l2ZW4gcHJvcGVydHkga2V5cywgY2hlY2tpbmcgdGhhdCBlYWNoIG9uZSBpcyBwcmVzZW50XG4gICAqIGFuZCBzdHJpY3R5IGVxdWFsIHRvIHRoZSBnaXZlbiBwcm9wZXJ0eSB2YWx1ZS4gRm9yIGluc3RhbmNlOlxuICAgKlxuICAgKiAgICAgdmFyIG9iajEgPSB7YTogMX1cbiAgICogICAgICAgLCBvYmoyID0ge2I6IDJ9O1xuICAgKiAgICAgYXNzZXJ0LmluY2x1ZGUoW29iajEsIG9iajJdLCBvYmoxKTtcbiAgICogICAgIGFzc2VydC5pbmNsdWRlKHtmb286IG9iajEsIGJhcjogb2JqMn0sIHtmb286IG9iajF9KTtcbiAgICogICAgIGFzc2VydC5pbmNsdWRlKHtmb286IG9iajEsIGJhcjogb2JqMn0sIHtmb286IG9iajEsIGJhcjogb2JqMn0pO1xuICAgKlxuICAgKiBAbmFtZSBpbmNsdWRlXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBoYXlzdGFja1xuICAgKiBAcGFyYW0ge01peGVkfSBuZWVkbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmluY2x1ZGUgPSBmdW5jdGlvbiAoZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5pbmNsdWRlLCB0cnVlKS5pbmNsdWRlKGluYyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90SW5jbHVkZShoYXlzdGFjaywgbmVlZGxlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgaGF5c3RhY2tgIGRvZXMgbm90IGluY2x1ZGUgYG5lZWRsZWAuIENhbiBiZSB1c2VkIHRvIGFzc2VydFxuICAgKiB0aGUgYWJzZW5jZSBvZiBhIHZhbHVlIGluIGFuIGFycmF5LCBhIHN1YnN0cmluZyBpbiBhIHN0cmluZywgb3IgYSBzdWJzZXQgb2ZcbiAgICogcHJvcGVydGllcyBpbiBhbiBvYmplY3QuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZShbMSwyLDNdLCA0LCAnYXJyYXkgZG9lc24ndCBjb250YWluIHZhbHVlJyk7XG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZSgnZm9vYmFyJywgJ2JheicsICdzdHJpbmcgZG9lc24ndCBjb250YWluIHN1YnN0cmluZycpO1xuICAgKiAgICAgYXNzZXJ0Lm5vdEluY2x1ZGUoeyBmb286ICdiYXInLCBoZWxsbzogJ3VuaXZlcnNlJyB9LCB7IGZvbzogJ2JheicgfSwgJ29iamVjdCBkb2Vzbid0IGNvbnRhaW4gcHJvcGVydHknKTtcbiAgICpcbiAgICogU3RyaWN0IGVxdWFsaXR5ICg9PT0pIGlzIHVzZWQuIFdoZW4gYXNzZXJ0aW5nIHRoZSBhYnNlbmNlIG9mIGEgdmFsdWUgaW4gYW5cbiAgICogYXJyYXksIHRoZSBhcnJheSBpcyBzZWFyY2hlZCB0byBjb25maXJtIHRoZSBhYnNlbmNlIG9mIGFuIGVsZW1lbnQgdGhhdCdzXG4gICAqIHN0cmljdGx5IGVxdWFsIHRvIHRoZSBnaXZlbiB2YWx1ZS4gV2hlbiBhc3NlcnRpbmcgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpblxuICAgKiBhbiBvYmplY3QsIHRoZSBvYmplY3QgaXMgc2VhcmNoZWQgdG8gY29uZmlybSB0aGF0IGF0IGxlYXN0IG9uZSBvZiB0aGUgZ2l2ZW5cbiAgICogcHJvcGVydHkga2V5cyBpcyBlaXRoZXIgbm90IHByZXNlbnQgb3Igbm90IHN0cmljdGx5IGVxdWFsIHRvIHRoZSBnaXZlblxuICAgKiBwcm9wZXJ0eSB2YWx1ZS4gRm9yIGluc3RhbmNlOlxuICAgKlxuICAgKiAgICAgdmFyIG9iajEgPSB7YTogMX1cbiAgICogICAgICAgLCBvYmoyID0ge2I6IDJ9O1xuICAgKiAgICAgYXNzZXJ0Lm5vdEluY2x1ZGUoW29iajEsIG9iajJdLCB7YTogMX0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdEluY2x1ZGUoe2Zvbzogb2JqMSwgYmFyOiBvYmoyfSwge2Zvbzoge2E6IDF9fSk7XG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZSh7Zm9vOiBvYmoxLCBiYXI6IG9iajJ9LCB7Zm9vOiBvYmoxLCBiYXI6IHtiOiAyfX0pO1xuICAgKlxuICAgKiBAbmFtZSBub3RJbmNsdWRlXG4gICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBoYXlzdGFja1xuICAgKiBAcGFyYW0ge01peGVkfSBuZWVkbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdEluY2x1ZGUgPSBmdW5jdGlvbiAoZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5ub3RJbmNsdWRlLCB0cnVlKS5ub3QuaW5jbHVkZShpbmMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmRlZXBJbmNsdWRlKGhheXN0YWNrLCBuZWVkbGUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBoYXlzdGFja2AgaW5jbHVkZXMgYG5lZWRsZWAuIENhbiBiZSB1c2VkIHRvIGFzc2VydCB0aGVcbiAgICogaW5jbHVzaW9uIG9mIGEgdmFsdWUgaW4gYW4gYXJyYXkgb3IgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpbiBhbiBvYmplY3QuXG4gICAqIERlZXAgZXF1YWxpdHkgaXMgdXNlZC5cbiAgICpcbiAgICogICAgIHZhciBvYmoxID0ge2E6IDF9XG4gICAqICAgICAgICwgb2JqMiA9IHtiOiAyfTtcbiAgICogICAgIGFzc2VydC5kZWVwSW5jbHVkZShbb2JqMSwgb2JqMl0sIHthOiAxfSk7XG4gICAqICAgICBhc3NlcnQuZGVlcEluY2x1ZGUoe2Zvbzogb2JqMSwgYmFyOiBvYmoyfSwge2Zvbzoge2E6IDF9fSk7XG4gICAqICAgICBhc3NlcnQuZGVlcEluY2x1ZGUoe2Zvbzogb2JqMSwgYmFyOiBvYmoyfSwge2Zvbzoge2E6IDF9LCBiYXI6IHtiOiAyfX0pO1xuICAgKlxuICAgKiBAbmFtZSBkZWVwSW5jbHVkZVxuICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtNaXhlZH0gbmVlZGxlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kZWVwSW5jbHVkZSA9IGZ1bmN0aW9uIChleHAsIGluYywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihleHAsIG1zZywgYXNzZXJ0LmRlZXBJbmNsdWRlLCB0cnVlKS5kZWVwLmluY2x1ZGUoaW5jKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3REZWVwSW5jbHVkZShoYXlzdGFjaywgbmVlZGxlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgaGF5c3RhY2tgIGRvZXMgbm90IGluY2x1ZGUgYG5lZWRsZWAuIENhbiBiZSB1c2VkIHRvIGFzc2VydFxuICAgKiB0aGUgYWJzZW5jZSBvZiBhIHZhbHVlIGluIGFuIGFycmF5IG9yIGEgc3Vic2V0IG9mIHByb3BlcnRpZXMgaW4gYW4gb2JqZWN0LlxuICAgKiBEZWVwIGVxdWFsaXR5IGlzIHVzZWQuXG4gICAqXG4gICAqICAgICB2YXIgb2JqMSA9IHthOiAxfVxuICAgKiAgICAgICAsIG9iajIgPSB7YjogMn07XG4gICAqICAgICBhc3NlcnQubm90RGVlcEluY2x1ZGUoW29iajEsIG9iajJdLCB7YTogOX0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdERlZXBJbmNsdWRlKHtmb286IG9iajEsIGJhcjogb2JqMn0sIHtmb286IHthOiA5fX0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdERlZXBJbmNsdWRlKHtmb286IG9iajEsIGJhcjogb2JqMn0sIHtmb286IHthOiAxfSwgYmFyOiB7YjogOX19KTtcbiAgICpcbiAgICogQG5hbWUgbm90RGVlcEluY2x1ZGVcbiAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IGhheXN0YWNrXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90RGVlcEluY2x1ZGUgPSBmdW5jdGlvbiAoZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5ub3REZWVwSW5jbHVkZSwgdHJ1ZSkubm90LmRlZXAuaW5jbHVkZShpbmMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm5lc3RlZEluY2x1ZGUoaGF5c3RhY2ssIG5lZWRsZSwgW21lc3NhZ2VdKVxuICAgKiBcbiAgICogQXNzZXJ0cyB0aGF0ICdoYXlzdGFjaycgaW5jbHVkZXMgJ25lZWRsZScuIFxuICAgKiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlIGluY2x1c2lvbiBvZiBhIHN1YnNldCBvZiBwcm9wZXJ0aWVzIGluIGFuIFxuICAgKiBvYmplY3QuXG4gICAqIEVuYWJsZXMgdGhlIHVzZSBvZiBkb3QtIGFuZCBicmFja2V0LW5vdGF0aW9uIGZvciByZWZlcmVuY2luZyBuZXN0ZWQgXG4gICAqIHByb3BlcnRpZXMuXG4gICAqICdbXScgYW5kICcuJyBpbiBwcm9wZXJ0eSBuYW1lcyBjYW4gYmUgZXNjYXBlZCB1c2luZyBkb3VibGUgYmFja3NsYXNoZXMuXG4gICAqIFxuICAgKiAgICAgYXNzZXJ0Lm5lc3RlZEluY2x1ZGUoeycuYSc6IHsnYic6ICd4J319LCB7J1xcXFwuYS5bYl0nOiAneCd9KTtcbiAgICogICAgIGFzc2VydC5uZXN0ZWRJbmNsdWRlKHsnYSc6IHsnW2JdJzogJ3gnfX0sIHsnYS5cXFxcW2JcXFxcXSc6ICd4J30pO1xuICAgKiBcbiAgICogQG5hbWUgbmVzdGVkSW5jbHVkZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtPYmplY3R9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpYyBcbiAgICovIFxuXG4gIGFzc2VydC5uZXN0ZWRJbmNsdWRlID0gZnVuY3Rpb24gKGV4cCwgaW5jLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGV4cCwgbXNnLCBhc3NlcnQubmVzdGVkSW5jbHVkZSwgdHJ1ZSkubmVzdGVkLmluY2x1ZGUoaW5jKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3ROZXN0ZWRJbmNsdWRlKGhheXN0YWNrLCBuZWVkbGUsIFttZXNzYWdlXSlcbiAgICogXG4gICAqIEFzc2VydHMgdGhhdCAnaGF5c3RhY2snIGRvZXMgbm90IGluY2x1ZGUgJ25lZWRsZScuIFxuICAgKiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlIGFic2VuY2Ugb2YgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpbiBhbiBcbiAgICogb2JqZWN0LlxuICAgKiBFbmFibGVzIHRoZSB1c2Ugb2YgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3IgcmVmZXJlbmNpbmcgbmVzdGVkIFxuICAgKiBwcm9wZXJ0aWVzLiBcbiAgICogJ1tdJyBhbmQgJy4nIGluIHByb3BlcnR5IG5hbWVzIGNhbiBiZSBlc2NhcGVkIHVzaW5nIGRvdWJsZSBiYWNrc2xhc2hlcy5cbiAgICogXG4gICAqICAgICBhc3NlcnQubm90TmVzdGVkSW5jbHVkZSh7Jy5hJzogeydiJzogJ3gnfX0sIHsnXFxcXC5hLmInOiAneSd9KTtcbiAgICogICAgIGFzc2VydC5ub3ROZXN0ZWRJbmNsdWRlKHsnYSc6IHsnW2JdJzogJ3gnfX0sIHsnYS5cXFxcW2JcXFxcXSc6ICd5J30pO1xuICAgKiBcbiAgICogQG5hbWUgbm90TmVzdGVkSW5jbHVkZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtPYmplY3R9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpYyBcbiAgICovIFxuXG4gIGFzc2VydC5ub3ROZXN0ZWRJbmNsdWRlID0gZnVuY3Rpb24gKGV4cCwgaW5jLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGV4cCwgbXNnLCBhc3NlcnQubm90TmVzdGVkSW5jbHVkZSwgdHJ1ZSlcbiAgICAgIC5ub3QubmVzdGVkLmluY2x1ZGUoaW5jKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5kZWVwTmVzdGVkSW5jbHVkZShoYXlzdGFjaywgbmVlZGxlLCBbbWVzc2FnZV0pXG4gICAqIFxuICAgKiBBc3NlcnRzIHRoYXQgJ2hheXN0YWNrJyBpbmNsdWRlcyAnbmVlZGxlJy5cbiAgICogQ2FuIGJlIHVzZWQgdG8gYXNzZXJ0IHRoZSBpbmNsdXNpb24gb2YgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpbiBhbiBcbiAgICogb2JqZWN0IHdoaWxlIGNoZWNraW5nIGZvciBkZWVwIGVxdWFsaXR5LlxuICAgKiBFbmFibGVzIHRoZSB1c2Ugb2YgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3IgcmVmZXJlbmNpbmcgbmVzdGVkIFxuICAgKiBwcm9wZXJ0aWVzLlxuICAgKiAnW10nIGFuZCAnLicgaW4gcHJvcGVydHkgbmFtZXMgY2FuIGJlIGVzY2FwZWQgdXNpbmcgZG91YmxlIGJhY2tzbGFzaGVzLlxuICAgKiBcbiAgICogICAgIGFzc2VydC5kZWVwTmVzdGVkSW5jbHVkZSh7YToge2I6IFt7eDogMX1dfX0sIHsnYS5iWzBdJzoge3g6IDF9fSk7XG4gICAqICAgICBhc3NlcnQuZGVlcE5lc3RlZEluY2x1ZGUoeycuYSc6IHsnW2JdJzoge3g6IDF9fX0sIHsnXFxcXC5hLlxcXFxbYlxcXFxdJzoge3g6IDF9fSk7XG4gICAqICAgIFxuICAgKiBAbmFtZSBkZWVwTmVzdGVkSW5jbHVkZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtPYmplY3R9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpYyBcbiAgICovXG5cbiAgYXNzZXJ0LmRlZXBOZXN0ZWRJbmNsdWRlID0gZnVuY3Rpb24oZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5kZWVwTmVzdGVkSW5jbHVkZSwgdHJ1ZSlcbiAgICAgIC5kZWVwLm5lc3RlZC5pbmNsdWRlKGluYyk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90RGVlcE5lc3RlZEluY2x1ZGUoaGF5c3RhY2ssIG5lZWRsZSwgW21lc3NhZ2VdKVxuICAgKiBcbiAgICogQXNzZXJ0cyB0aGF0ICdoYXlzdGFjaycgZG9lcyBub3QgaW5jbHVkZSAnbmVlZGxlJy5cbiAgICogQ2FuIGJlIHVzZWQgdG8gYXNzZXJ0IHRoZSBhYnNlbmNlIG9mIGEgc3Vic2V0IG9mIHByb3BlcnRpZXMgaW4gYW4gXG4gICAqIG9iamVjdCB3aGlsZSBjaGVja2luZyBmb3IgZGVlcCBlcXVhbGl0eS5cbiAgICogRW5hYmxlcyB0aGUgdXNlIG9mIGRvdC0gYW5kIGJyYWNrZXQtbm90YXRpb24gZm9yIHJlZmVyZW5jaW5nIG5lc3RlZCBcbiAgICogcHJvcGVydGllcy5cbiAgICogJ1tdJyBhbmQgJy4nIGluIHByb3BlcnR5IG5hbWVzIGNhbiBiZSBlc2NhcGVkIHVzaW5nIGRvdWJsZSBiYWNrc2xhc2hlcy5cbiAgICogXG4gICAqICAgICBhc3NlcnQubm90RGVlcE5lc3RlZEluY2x1ZGUoe2E6IHtiOiBbe3g6IDF9XX19LCB7J2EuYlswXSc6IHt5OiAxfX0pXG4gICAqICAgICBhc3NlcnQubm90RGVlcE5lc3RlZEluY2x1ZGUoeycuYSc6IHsnW2JdJzoge3g6IDF9fX0sIHsnXFxcXC5hLlxcXFxbYlxcXFxdJzoge3k6IDJ9fSk7XG4gICAqICAgIFxuICAgKiBAbmFtZSBub3REZWVwTmVzdGVkSW5jbHVkZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtPYmplY3R9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpYyBcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdERlZXBOZXN0ZWRJbmNsdWRlID0gZnVuY3Rpb24oZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5ub3REZWVwTmVzdGVkSW5jbHVkZSwgdHJ1ZSlcbiAgICAgIC5ub3QuZGVlcC5uZXN0ZWQuaW5jbHVkZShpbmMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm93bkluY2x1ZGUoaGF5c3RhY2ssIG5lZWRsZSwgW21lc3NhZ2VdKVxuICAgKiBcbiAgICogQXNzZXJ0cyB0aGF0ICdoYXlzdGFjaycgaW5jbHVkZXMgJ25lZWRsZScuXG4gICAqIENhbiBiZSB1c2VkIHRvIGFzc2VydCB0aGUgaW5jbHVzaW9uIG9mIGEgc3Vic2V0IG9mIHByb3BlcnRpZXMgaW4gYW4gXG4gICAqIG9iamVjdCB3aGlsZSBpZ25vcmluZyBpbmhlcml0ZWQgcHJvcGVydGllcy5cbiAgICogXG4gICAqICAgICBhc3NlcnQub3duSW5jbHVkZSh7IGE6IDEgfSwgeyBhOiAxIH0pO1xuICAgKiBcbiAgICogQG5hbWUgb3duSW5jbHVkZVxuICAgKiBAcGFyYW0ge09iamVjdH0gaGF5c3RhY2tcbiAgICogQHBhcmFtIHtPYmplY3R9IG5lZWRsZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQub3duSW5jbHVkZSA9IGZ1bmN0aW9uKGV4cCwgaW5jLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGV4cCwgbXNnLCBhc3NlcnQub3duSW5jbHVkZSwgdHJ1ZSkub3duLmluY2x1ZGUoaW5jKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3RPd25JbmNsdWRlKGhheXN0YWNrLCBuZWVkbGUsIFttZXNzYWdlXSlcbiAgICogXG4gICAqIEFzc2VydHMgdGhhdCAnaGF5c3RhY2snIGluY2x1ZGVzICduZWVkbGUnLlxuICAgKiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlIGFic2VuY2Ugb2YgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpbiBhbiBcbiAgICogb2JqZWN0IHdoaWxlIGlnbm9yaW5nIGluaGVyaXRlZCBwcm9wZXJ0aWVzLlxuICAgKiBcbiAgICogICAgIE9iamVjdC5wcm90b3R5cGUuYiA9IDI7XG4gICAqIFxuICAgKiAgICAgYXNzZXJ0Lm5vdE93bkluY2x1ZGUoeyBhOiAxIH0sIHsgYjogMiB9KTtcbiAgICogXG4gICAqIEBuYW1lIG5vdE93bkluY2x1ZGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGhheXN0YWNrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBuZWVkbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdE93bkluY2x1ZGUgPSBmdW5jdGlvbihleHAsIGluYywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihleHAsIG1zZywgYXNzZXJ0Lm5vdE93bkluY2x1ZGUsIHRydWUpLm5vdC5vd24uaW5jbHVkZShpbmMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmRlZXBPd25JbmNsdWRlKGhheXN0YWNrLCBuZWVkbGUsIFttZXNzYWdlXSlcbiAgICogXG4gICAqIEFzc2VydHMgdGhhdCAnaGF5c3RhY2snIGluY2x1ZGVzICduZWVkbGUnLlxuICAgKiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlIGluY2x1c2lvbiBvZiBhIHN1YnNldCBvZiBwcm9wZXJ0aWVzIGluIGFuIFxuICAgKiBvYmplY3Qgd2hpbGUgaWdub3JpbmcgaW5oZXJpdGVkIHByb3BlcnRpZXMgYW5kIGNoZWNraW5nIGZvciBkZWVwIGVxdWFsaXR5LlxuICAgKiBcbiAgICogICAgICBhc3NlcnQuZGVlcE93bkluY2x1ZGUoe2E6IHtiOiAyfX0sIHthOiB7YjogMn19KTtcbiAgICogICAgICBcbiAgICogQG5hbWUgZGVlcE93bkluY2x1ZGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGhheXN0YWNrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBuZWVkbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmRlZXBPd25JbmNsdWRlID0gZnVuY3Rpb24oZXhwLCBpbmMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oZXhwLCBtc2csIGFzc2VydC5kZWVwT3duSW5jbHVkZSwgdHJ1ZSlcbiAgICAgIC5kZWVwLm93bi5pbmNsdWRlKGluYyk7XG4gIH07XG5cbiAgIC8qKlxuICAgKiAjIyMgLm5vdERlZXBPd25JbmNsdWRlKGhheXN0YWNrLCBuZWVkbGUsIFttZXNzYWdlXSlcbiAgICogXG4gICAqIEFzc2VydHMgdGhhdCAnaGF5c3RhY2snIGluY2x1ZGVzICduZWVkbGUnLlxuICAgKiBDYW4gYmUgdXNlZCB0byBhc3NlcnQgdGhlIGFic2VuY2Ugb2YgYSBzdWJzZXQgb2YgcHJvcGVydGllcyBpbiBhbiBcbiAgICogb2JqZWN0IHdoaWxlIGlnbm9yaW5nIGluaGVyaXRlZCBwcm9wZXJ0aWVzIGFuZCBjaGVja2luZyBmb3IgZGVlcCBlcXVhbGl0eS5cbiAgICogXG4gICAqICAgICAgYXNzZXJ0Lm5vdERlZXBPd25JbmNsdWRlKHthOiB7YjogMn19LCB7YToge2M6IDN9fSk7XG4gICAqICAgICAgXG4gICAqIEBuYW1lIG5vdERlZXBPd25JbmNsdWRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBoYXlzdGFja1xuICAgKiBAcGFyYW0ge09iamVjdH0gbmVlZGxlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3REZWVwT3duSW5jbHVkZSA9IGZ1bmN0aW9uKGV4cCwgaW5jLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGV4cCwgbXNnLCBhc3NlcnQubm90RGVlcE93bkluY2x1ZGUsIHRydWUpXG4gICAgICAubm90LmRlZXAub3duLmluY2x1ZGUoaW5jKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5tYXRjaCh2YWx1ZSwgcmVnZXhwLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgdmFsdWVgIG1hdGNoZXMgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBgcmVnZXhwYC5cbiAgICpcbiAgICogICAgIGFzc2VydC5tYXRjaCgnZm9vYmFyJywgL15mb28vLCAncmVnZXhwIG1hdGNoZXMnKTtcbiAgICpcbiAgICogQG5hbWUgbWF0Y2hcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4cFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubWF0Y2ggPSBmdW5jdGlvbiAoZXhwLCByZSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihleHAsIG1zZywgYXNzZXJ0Lm1hdGNoLCB0cnVlKS50by5tYXRjaChyZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90TWF0Y2godmFsdWUsIHJlZ2V4cCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHZhbHVlYCBkb2VzIG5vdCBtYXRjaCB0aGUgcmVndWxhciBleHByZXNzaW9uIGByZWdleHBgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdE1hdGNoKCdmb29iYXInLCAvXmZvby8sICdyZWdleHAgZG9lcyBub3QgbWF0Y2gnKTtcbiAgICpcbiAgICogQG5hbWUgbm90TWF0Y2hcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtSZWdFeHB9IHJlZ2V4cFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90TWF0Y2ggPSBmdW5jdGlvbiAoZXhwLCByZSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihleHAsIG1zZywgYXNzZXJ0Lm5vdE1hdGNoLCB0cnVlKS50by5ub3QubWF0Y2gocmUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLnByb3BlcnR5KG9iamVjdCwgcHJvcGVydHksIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGhhcyBhIGRpcmVjdCBvciBpbmhlcml0ZWQgcHJvcGVydHkgbmFtZWQgYnlcbiAgICogYHByb3BlcnR5YC5cbiAgICpcbiAgICogICAgIGFzc2VydC5wcm9wZXJ0eSh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfX0sICd0ZWEnKTtcbiAgICogICAgIGFzc2VydC5wcm9wZXJ0eSh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfX0sICd0b1N0cmluZycpO1xuICAgKlxuICAgKiBAbmFtZSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQucHJvcGVydHkgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQucHJvcGVydHksIHRydWUpLnRvLmhhdmUucHJvcGVydHkocHJvcCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90UHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgZG9lcyBfbm90XyBoYXZlIGEgZGlyZWN0IG9yIGluaGVyaXRlZCBwcm9wZXJ0eSBuYW1lZFxuICAgKiBieSBgcHJvcGVydHlgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdFByb3BlcnR5KHsgdGVhOiB7IGdyZWVuOiAnbWF0Y2hhJyB9fSwgJ2NvZmZlZScpO1xuICAgKlxuICAgKiBAbmFtZSBub3RQcm9wZXJ0eVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90UHJvcGVydHkgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubm90UHJvcGVydHksIHRydWUpXG4gICAgICAudG8ubm90LmhhdmUucHJvcGVydHkocHJvcCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAucHJvcGVydHlWYWwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGhhcyBhIGRpcmVjdCBvciBpbmhlcml0ZWQgcHJvcGVydHkgbmFtZWQgYnlcbiAgICogYHByb3BlcnR5YCB3aXRoIGEgdmFsdWUgZ2l2ZW4gYnkgYHZhbHVlYC4gVXNlcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVja1xuICAgKiAoPT09KS5cbiAgICpcbiAgICogICAgIGFzc2VydC5wcm9wZXJ0eVZhbCh7IHRlYTogJ2lzIGdvb2QnIH0sICd0ZWEnLCAnaXMgZ29vZCcpO1xuICAgKlxuICAgKiBAbmFtZSBwcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQucHJvcGVydHlWYWwgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCB2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5wcm9wZXJ0eVZhbCwgdHJ1ZSlcbiAgICAgIC50by5oYXZlLnByb3BlcnR5KHByb3AsIHZhbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90UHJvcGVydHlWYWwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGRvZXMgX25vdF8gaGF2ZSBhIGRpcmVjdCBvciBpbmhlcml0ZWQgcHJvcGVydHkgbmFtZWRcbiAgICogYnkgYHByb3BlcnR5YCB3aXRoIHZhbHVlIGdpdmVuIGJ5IGB2YWx1ZWAuIFVzZXMgYSBzdHJpY3QgZXF1YWxpdHkgY2hlY2tcbiAgICogKD09PSkuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90UHJvcGVydHlWYWwoeyB0ZWE6ICdpcyBnb29kJyB9LCAndGVhJywgJ2lzIGJhZCcpO1xuICAgKiAgICAgYXNzZXJ0Lm5vdFByb3BlcnR5VmFsKHsgdGVhOiAnaXMgZ29vZCcgfSwgJ2NvZmZlZScsICdpcyBnb29kJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdFByb3BlcnR5VmFsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RQcm9wZXJ0eVZhbCA9IGZ1bmN0aW9uIChvYmosIHByb3AsIHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0Lm5vdFByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLnByb3BlcnR5KHByb3AsIHZhbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuZGVlcFByb3BlcnR5VmFsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBkaXJlY3Qgb3IgaW5oZXJpdGVkIHByb3BlcnR5IG5hbWVkIGJ5XG4gICAqIGBwcm9wZXJ0eWAgd2l0aCBhIHZhbHVlIGdpdmVuIGJ5IGB2YWx1ZWAuIFVzZXMgYSBkZWVwIGVxdWFsaXR5IGNoZWNrLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmRlZXBQcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfSB9LCAndGVhJywgeyBncmVlbjogJ21hdGNoYScgfSk7XG4gICAqXG4gICAqIEBuYW1lIGRlZXBQcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZGVlcFByb3BlcnR5VmFsID0gZnVuY3Rpb24gKG9iaiwgcHJvcCwgdmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuZGVlcFByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLmhhdmUuZGVlcC5wcm9wZXJ0eShwcm9wLCB2YWwpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm5vdERlZXBQcm9wZXJ0eVZhbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgZG9lcyBfbm90XyBoYXZlIGEgZGlyZWN0IG9yIGluaGVyaXRlZCBwcm9wZXJ0eSBuYW1lZFxuICAgKiBieSBgcHJvcGVydHlgIHdpdGggdmFsdWUgZ2l2ZW4gYnkgYHZhbHVlYC4gVXNlcyBhIGRlZXAgZXF1YWxpdHkgY2hlY2suXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90RGVlcFByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiAnbWF0Y2hhJyB9IH0sICd0ZWEnLCB7IGJsYWNrOiAnbWF0Y2hhJyB9KTtcbiAgICogICAgIGFzc2VydC5ub3REZWVwUHJvcGVydHlWYWwoeyB0ZWE6IHsgZ3JlZW46ICdtYXRjaGEnIH0gfSwgJ3RlYScsIHsgZ3JlZW46ICdvb2xvbmcnIH0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdERlZXBQcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfSB9LCAnY29mZmVlJywgeyBncmVlbjogJ21hdGNoYScgfSk7XG4gICAqXG4gICAqIEBuYW1lIG5vdERlZXBQcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90RGVlcFByb3BlcnR5VmFsID0gZnVuY3Rpb24gKG9iaiwgcHJvcCwgdmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubm90RGVlcFByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLmRlZXAucHJvcGVydHkocHJvcCwgdmFsKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5vd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBkaXJlY3QgcHJvcGVydHkgbmFtZWQgYnkgYHByb3BlcnR5YC4gSW5oZXJpdGVkXG4gICAqIHByb3BlcnRpZXMgYXJlbid0IGNoZWNrZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQub3duUHJvcGVydHkoeyB0ZWE6IHsgZ3JlZW46ICdtYXRjaGEnIH19LCAndGVhJyk7XG4gICAqXG4gICAqIEBuYW1lIG93blByb3BlcnR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5vd25Qcm9wZXJ0eSA9IGZ1bmN0aW9uIChvYmosIHByb3AsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5vd25Qcm9wZXJ0eSwgdHJ1ZSlcbiAgICAgIC50by5oYXZlLm93bi5wcm9wZXJ0eShwcm9wKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3RPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBkb2VzIF9ub3RfIGhhdmUgYSBkaXJlY3QgcHJvcGVydHkgbmFtZWQgYnlcbiAgICogYHByb3BlcnR5YC4gSW5oZXJpdGVkIHByb3BlcnRpZXMgYXJlbid0IGNoZWNrZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90T3duUHJvcGVydHkoeyB0ZWE6IHsgZ3JlZW46ICdtYXRjaGEnIH19LCAnY29mZmVlJyk7XG4gICAqICAgICBhc3NlcnQubm90T3duUHJvcGVydHkoe30sICd0b1N0cmluZycpO1xuICAgKlxuICAgKiBAbmFtZSBub3RPd25Qcm9wZXJ0eVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90T3duUHJvcGVydHkgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubm90T3duUHJvcGVydHksIHRydWUpXG4gICAgICAudG8ubm90LmhhdmUub3duLnByb3BlcnR5KHByb3ApO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm93blByb3BlcnR5VmFsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBkaXJlY3QgcHJvcGVydHkgbmFtZWQgYnkgYHByb3BlcnR5YCBhbmQgYSB2YWx1ZVxuICAgKiBlcXVhbCB0byB0aGUgcHJvdmlkZWQgYHZhbHVlYC4gVXNlcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVjayAoPT09KS5cbiAgICogSW5oZXJpdGVkIHByb3BlcnRpZXMgYXJlbid0IGNoZWNrZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQub3duUHJvcGVydHlWYWwoeyBjb2ZmZWU6ICdpcyBnb29kJ30sICdjb2ZmZWUnLCAnaXMgZ29vZCcpO1xuICAgKlxuICAgKiBAbmFtZSBvd25Qcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQub3duUHJvcGVydHlWYWwgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCB2YWx1ZSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0Lm93blByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLmhhdmUub3duLnByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3RPd25Qcm9wZXJ0eVZhbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgZG9lcyBfbm90XyBoYXZlIGEgZGlyZWN0IHByb3BlcnR5IG5hbWVkIGJ5IGBwcm9wZXJ0eWBcbiAgICogd2l0aCBhIHZhbHVlIGVxdWFsIHRvIHRoZSBwcm92aWRlZCBgdmFsdWVgLiBVc2VzIGEgc3RyaWN0IGVxdWFsaXR5IGNoZWNrXG4gICAqICg9PT0pLiBJbmhlcml0ZWQgcHJvcGVydGllcyBhcmVuJ3QgY2hlY2tlZC5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3RPd25Qcm9wZXJ0eVZhbCh7IHRlYTogJ2lzIGJldHRlcid9LCAndGVhJywgJ2lzIHdvcnNlJyk7XG4gICAqICAgICBhc3NlcnQubm90T3duUHJvcGVydHlWYWwoe30sICd0b1N0cmluZycsIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuICAgKlxuICAgKiBAbmFtZSBub3RPd25Qcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90T3duUHJvcGVydHlWYWwgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCB2YWx1ZSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0Lm5vdE93blByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLm93bi5wcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuZGVlcE93blByb3BlcnR5VmFsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBkaXJlY3QgcHJvcGVydHkgbmFtZWQgYnkgYHByb3BlcnR5YCBhbmQgYSB2YWx1ZVxuICAgKiBlcXVhbCB0byB0aGUgcHJvdmlkZWQgYHZhbHVlYC4gVXNlcyBhIGRlZXAgZXF1YWxpdHkgY2hlY2suIEluaGVyaXRlZFxuICAgKiBwcm9wZXJ0aWVzIGFyZW4ndCBjaGVja2VkLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmRlZXBPd25Qcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfSB9LCAndGVhJywgeyBncmVlbjogJ21hdGNoYScgfSk7XG4gICAqXG4gICAqIEBuYW1lIGRlZXBPd25Qcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZGVlcE93blByb3BlcnR5VmFsID0gZnVuY3Rpb24gKG9iaiwgcHJvcCwgdmFsdWUsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5kZWVwT3duUHJvcGVydHlWYWwsIHRydWUpXG4gICAgICAudG8uaGF2ZS5kZWVwLm93bi5wcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90RGVlcE93blByb3BlcnR5VmFsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBkb2VzIF9ub3RfIGhhdmUgYSBkaXJlY3QgcHJvcGVydHkgbmFtZWQgYnkgYHByb3BlcnR5YFxuICAgKiB3aXRoIGEgdmFsdWUgZXF1YWwgdG8gdGhlIHByb3ZpZGVkIGB2YWx1ZWAuIFVzZXMgYSBkZWVwIGVxdWFsaXR5IGNoZWNrLlxuICAgKiBJbmhlcml0ZWQgcHJvcGVydGllcyBhcmVuJ3QgY2hlY2tlZC5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3REZWVwT3duUHJvcGVydHlWYWwoeyB0ZWE6IHsgZ3JlZW46ICdtYXRjaGEnIH0gfSwgJ3RlYScsIHsgYmxhY2s6ICdtYXRjaGEnIH0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdERlZXBPd25Qcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfSB9LCAndGVhJywgeyBncmVlbjogJ29vbG9uZycgfSk7XG4gICAqICAgICBhc3NlcnQubm90RGVlcE93blByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiAnbWF0Y2hhJyB9IH0sICdjb2ZmZWUnLCB7IGdyZWVuOiAnbWF0Y2hhJyB9KTtcbiAgICogICAgIGFzc2VydC5ub3REZWVwT3duUHJvcGVydHlWYWwoe30sICd0b1N0cmluZycsIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuICAgKlxuICAgKiBAbmFtZSBub3REZWVwT3duUHJvcGVydHlWYWxcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdERlZXBPd25Qcm9wZXJ0eVZhbCA9IGZ1bmN0aW9uIChvYmosIHByb3AsIHZhbHVlLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubm90RGVlcE93blByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLmRlZXAub3duLnByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5uZXN0ZWRQcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBkaXJlY3Qgb3IgaW5oZXJpdGVkIHByb3BlcnR5IG5hbWVkIGJ5XG4gICAqIGBwcm9wZXJ0eWAsIHdoaWNoIGNhbiBiZSBhIHN0cmluZyB1c2luZyBkb3QtIGFuZCBicmFja2V0LW5vdGF0aW9uIGZvclxuICAgKiBuZXN0ZWQgcmVmZXJlbmNlLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5lc3RlZFByb3BlcnR5KHsgdGVhOiB7IGdyZWVuOiAnbWF0Y2hhJyB9fSwgJ3RlYS5ncmVlbicpO1xuICAgKlxuICAgKiBAbmFtZSBuZXN0ZWRQcm9wZXJ0eVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubmVzdGVkUHJvcGVydHkgPSBmdW5jdGlvbiAob2JqLCBwcm9wLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubmVzdGVkUHJvcGVydHksIHRydWUpXG4gICAgICAudG8uaGF2ZS5uZXN0ZWQucHJvcGVydHkocHJvcCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90TmVzdGVkUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgZG9lcyBfbm90XyBoYXZlIGEgcHJvcGVydHkgbmFtZWQgYnkgYHByb3BlcnR5YCwgd2hpY2hcbiAgICogY2FuIGJlIGEgc3RyaW5nIHVzaW5nIGRvdC0gYW5kIGJyYWNrZXQtbm90YXRpb24gZm9yIG5lc3RlZCByZWZlcmVuY2UuIFRoZVxuICAgKiBwcm9wZXJ0eSBjYW5ub3QgZXhpc3Qgb24gdGhlIG9iamVjdCBub3IgYW55d2hlcmUgaW4gaXRzIHByb3RvdHlwZSBjaGFpbi5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3ROZXN0ZWRQcm9wZXJ0eSh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfX0sICd0ZWEub29sb25nJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdE5lc3RlZFByb3BlcnR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3ROZXN0ZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uIChvYmosIHByb3AsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5ub3ROZXN0ZWRQcm9wZXJ0eSwgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5uZXN0ZWQucHJvcGVydHkocHJvcCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubmVzdGVkUHJvcGVydHlWYWwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGhhcyBhIHByb3BlcnR5IG5hbWVkIGJ5IGBwcm9wZXJ0eWAgd2l0aCB2YWx1ZSBnaXZlblxuICAgKiBieSBgdmFsdWVgLiBgcHJvcGVydHlgIGNhbiB1c2UgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3IgbmVzdGVkXG4gICAqIHJlZmVyZW5jZS4gVXNlcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVjayAoPT09KS5cbiAgICpcbiAgICogICAgIGFzc2VydC5uZXN0ZWRQcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfX0sICd0ZWEuZ3JlZW4nLCAnbWF0Y2hhJyk7XG4gICAqXG4gICAqIEBuYW1lIG5lc3RlZFByb3BlcnR5VmFsXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5uZXN0ZWRQcm9wZXJ0eVZhbCA9IGZ1bmN0aW9uIChvYmosIHByb3AsIHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0Lm5lc3RlZFByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLmhhdmUubmVzdGVkLnByb3BlcnR5KHByb3AsIHZhbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAubm90TmVzdGVkUHJvcGVydHlWYWwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGRvZXMgX25vdF8gaGF2ZSBhIHByb3BlcnR5IG5hbWVkIGJ5IGBwcm9wZXJ0eWAgd2l0aFxuICAgKiB2YWx1ZSBnaXZlbiBieSBgdmFsdWVgLiBgcHJvcGVydHlgIGNhbiB1c2UgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3JcbiAgICogbmVzdGVkIHJlZmVyZW5jZS4gVXNlcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVjayAoPT09KS5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3ROZXN0ZWRQcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogJ21hdGNoYScgfX0sICd0ZWEuZ3JlZW4nLCAna29uYWNoYScpO1xuICAgKiAgICAgYXNzZXJ0Lm5vdE5lc3RlZFByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiAnbWF0Y2hhJyB9fSwgJ2NvZmZlZS5ncmVlbicsICdtYXRjaGEnKTtcbiAgICpcbiAgICogQG5hbWUgbm90TmVzdGVkUHJvcGVydHlWYWxcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdE5lc3RlZFByb3BlcnR5VmFsID0gZnVuY3Rpb24gKG9iaiwgcHJvcCwgdmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQubm90TmVzdGVkUHJvcGVydHlWYWwsIHRydWUpXG4gICAgICAudG8ubm90LmhhdmUubmVzdGVkLnByb3BlcnR5KHByb3AsIHZhbCk7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuZGVlcE5lc3RlZFByb3BlcnR5VmFsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYSBwcm9wZXJ0eSBuYW1lZCBieSBgcHJvcGVydHlgIHdpdGggYSB2YWx1ZSBnaXZlblxuICAgKiBieSBgdmFsdWVgLiBgcHJvcGVydHlgIGNhbiB1c2UgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3IgbmVzdGVkXG4gICAqIHJlZmVyZW5jZS4gVXNlcyBhIGRlZXAgZXF1YWxpdHkgY2hlY2suXG4gICAqXG4gICAqICAgICBhc3NlcnQuZGVlcE5lc3RlZFByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiB7IG1hdGNoYTogJ3l1bScgfSB9IH0sICd0ZWEuZ3JlZW4nLCB7IG1hdGNoYTogJ3l1bScgfSk7XG4gICAqXG4gICAqIEBuYW1lIGRlZXBOZXN0ZWRQcm9wZXJ0eVZhbFxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZGVlcE5lc3RlZFByb3BlcnR5VmFsID0gZnVuY3Rpb24gKG9iaiwgcHJvcCwgdmFsLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuZGVlcE5lc3RlZFByb3BlcnR5VmFsLCB0cnVlKVxuICAgICAgLnRvLmhhdmUuZGVlcC5uZXN0ZWQucHJvcGVydHkocHJvcCwgdmFsKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5ub3REZWVwTmVzdGVkUHJvcGVydHlWYWwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGRvZXMgX25vdF8gaGF2ZSBhIHByb3BlcnR5IG5hbWVkIGJ5IGBwcm9wZXJ0eWAgd2l0aFxuICAgKiB2YWx1ZSBnaXZlbiBieSBgdmFsdWVgLiBgcHJvcGVydHlgIGNhbiB1c2UgZG90LSBhbmQgYnJhY2tldC1ub3RhdGlvbiBmb3JcbiAgICogbmVzdGVkIHJlZmVyZW5jZS4gVXNlcyBhIGRlZXAgZXF1YWxpdHkgY2hlY2suXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90RGVlcE5lc3RlZFByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiB7IG1hdGNoYTogJ3l1bScgfSB9IH0sICd0ZWEuZ3JlZW4nLCB7IG9vbG9uZzogJ3l1bScgfSk7XG4gICAqICAgICBhc3NlcnQubm90RGVlcE5lc3RlZFByb3BlcnR5VmFsKHsgdGVhOiB7IGdyZWVuOiB7IG1hdGNoYTogJ3l1bScgfSB9IH0sICd0ZWEuZ3JlZW4nLCB7IG1hdGNoYTogJ3l1Y2snIH0pO1xuICAgKiAgICAgYXNzZXJ0Lm5vdERlZXBOZXN0ZWRQcm9wZXJ0eVZhbCh7IHRlYTogeyBncmVlbjogeyBtYXRjaGE6ICd5dW0nIH0gfSB9LCAndGVhLmJsYWNrJywgeyBtYXRjaGE6ICd5dW0nIH0pO1xuICAgKlxuICAgKiBAbmFtZSBub3REZWVwTmVzdGVkUHJvcGVydHlWYWxcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdERlZXBOZXN0ZWRQcm9wZXJ0eVZhbCA9IGZ1bmN0aW9uIChvYmosIHByb3AsIHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0Lm5vdERlZXBOZXN0ZWRQcm9wZXJ0eVZhbCwgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5kZWVwLm5lc3RlZC5wcm9wZXJ0eShwcm9wLCB2YWwpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubGVuZ3RoT2Yob2JqZWN0LCBsZW5ndGgsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGhhcyBhIGBsZW5ndGhgIHByb3BlcnR5IHdpdGggdGhlIGV4cGVjdGVkIHZhbHVlLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lmxlbmd0aE9mKFsxLDIsM10sIDMsICdhcnJheSBoYXMgbGVuZ3RoIG9mIDMnKTtcbiAgICogICAgIGFzc2VydC5sZW5ndGhPZignZm9vYmFyJywgNiwgJ3N0cmluZyBoYXMgbGVuZ3RoIG9mIDYnKTtcbiAgICpcbiAgICogQG5hbWUgbGVuZ3RoT2ZcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGhcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lmxlbmd0aE9mID0gZnVuY3Rpb24gKGV4cCwgbGVuLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGV4cCwgbXNnLCBhc3NlcnQubGVuZ3RoT2YsIHRydWUpLnRvLmhhdmUubGVuZ3RoT2YobGVuKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5oYXNBbnlLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYXQgbGVhc3Qgb25lIG9mIHRoZSBga2V5c2AgcHJvdmlkZWQuXG4gICAqIFlvdSBjYW4gYWxzbyBwcm92aWRlIGEgc2luZ2xlIG9iamVjdCBpbnN0ZWFkIG9mIGEgYGtleXNgIGFycmF5IGFuZCBpdHMga2V5c1xuICAgKiB3aWxsIGJlIHVzZWQgYXMgdGhlIGV4cGVjdGVkIHNldCBvZiBrZXlzLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lmhhc0FueUtleXMoe2ZvbzogMSwgYmFyOiAyLCBiYXo6IDN9LCBbJ2ZvbycsICdpRG9udEV4aXN0JywgJ2JheiddKTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlLZXlzKHtmb286IDEsIGJhcjogMiwgYmF6OiAzfSwge2ZvbzogMzAsIGlEb250RXhpc3Q6IDk5LCBiYXo6IDEzMzd9KTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlLZXlzKG5ldyBNYXAoW1t7Zm9vOiAxfSwgJ2JhciddLCBbJ2tleScsICd2YWx1ZSddXSksIFt7Zm9vOiAxfSwgJ2tleSddKTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlLZXlzKG5ldyBTZXQoW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSksIFt7Zm9vOiAnYmFyJ30sICdhbm90aGVyS2V5J10pO1xuICAgKlxuICAgKiBAbmFtZSBoYXNBbnlLZXlzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaGFzQW55S2V5cyA9IGZ1bmN0aW9uIChvYmosIGtleXMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5oYXNBbnlLZXlzLCB0cnVlKS50by5oYXZlLmFueS5rZXlzKGtleXMpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuaGFzQWxsS2V5cyhvYmplY3QsIFtrZXlzXSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaGFzIGFsbCBhbmQgb25seSBhbGwgb2YgdGhlIGBrZXlzYCBwcm92aWRlZC5cbiAgICogWW91IGNhbiBhbHNvIHByb3ZpZGUgYSBzaW5nbGUgb2JqZWN0IGluc3RlYWQgb2YgYSBga2V5c2AgYXJyYXkgYW5kIGl0cyBrZXlzXG4gICAqIHdpbGwgYmUgdXNlZCBhcyB0aGUgZXhwZWN0ZWQgc2V0IG9mIGtleXMuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaGFzQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIFsnZm9vJywgJ2JhcicsICdiYXonXSk7XG4gICAqICAgICBhc3NlcnQuaGFzQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIHtmb286IDMwLCBiYXI6IDk5LCBiYXo6IDEzMzddKTtcbiAgICogICAgIGFzc2VydC5oYXNBbGxLZXlzKG5ldyBNYXAoW1t7Zm9vOiAxfSwgJ2JhciddLCBbJ2tleScsICd2YWx1ZSddXSksIFt7Zm9vOiAxfSwgJ2tleSddKTtcbiAgICogICAgIGFzc2VydC5oYXNBbGxLZXlzKG5ldyBTZXQoW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSwgW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSk7XG4gICAqXG4gICAqIEBuYW1lIGhhc0FsbEtleXNcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nW119IGtleXNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lmhhc0FsbEtleXMgPSBmdW5jdGlvbiAob2JqLCBrZXlzLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuaGFzQWxsS2V5cywgdHJ1ZSkudG8uaGF2ZS5hbGwua2V5cyhrZXlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmNvbnRhaW5zQWxsS2V5cyhvYmplY3QsIFtrZXlzXSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaGFzIGFsbCBvZiB0aGUgYGtleXNgIHByb3ZpZGVkIGJ1dCBtYXkgaGF2ZSBtb3JlIGtleXMgbm90IGxpc3RlZC5cbiAgICogWW91IGNhbiBhbHNvIHByb3ZpZGUgYSBzaW5nbGUgb2JqZWN0IGluc3RlYWQgb2YgYSBga2V5c2AgYXJyYXkgYW5kIGl0cyBrZXlzXG4gICAqIHdpbGwgYmUgdXNlZCBhcyB0aGUgZXhwZWN0ZWQgc2V0IG9mIGtleXMuXG4gICAqXG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxLZXlzKHtmb286IDEsIGJhcjogMiwgYmF6OiAzfSwgWydmb28nLCAnYmF6J10pO1xuICAgKiAgICAgYXNzZXJ0LmNvbnRhaW5zQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIFsnZm9vJywgJ2JhcicsICdiYXonXSk7XG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxLZXlzKHtmb286IDEsIGJhcjogMiwgYmF6OiAzfSwge2ZvbzogMzAsIGJhejogMTMzN30pO1xuICAgKiAgICAgYXNzZXJ0LmNvbnRhaW5zQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIHtmb286IDMwLCBiYXI6IDk5LCBiYXo6IDEzMzd9KTtcbiAgICogICAgIGFzc2VydC5jb250YWluc0FsbEtleXMobmV3IE1hcChbW3tmb286IDF9LCAnYmFyJ10sIFsna2V5JywgJ3ZhbHVlJ11dKSwgW3tmb286IDF9XSk7XG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxLZXlzKG5ldyBNYXAoW1t7Zm9vOiAxfSwgJ2JhciddLCBbJ2tleScsICd2YWx1ZSddXSksIFt7Zm9vOiAxfSwgJ2tleSddKTtcbiAgICogICAgIGFzc2VydC5jb250YWluc0FsbEtleXMobmV3IFNldChbe2ZvbzogJ2Jhcid9LCAnYW5vdGhlcktleSddLCBbe2ZvbzogJ2Jhcid9XSk7XG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxLZXlzKG5ldyBTZXQoW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSwgW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSk7XG4gICAqXG4gICAqIEBuYW1lIGNvbnRhaW5zQWxsS2V5c1xuICAgKiBAcGFyYW0ge01peGVkfSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmdbXX0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuY29udGFpbnNBbGxLZXlzID0gZnVuY3Rpb24gKG9iaiwga2V5cywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmNvbnRhaW5zQWxsS2V5cywgdHJ1ZSlcbiAgICAgIC50by5jb250YWluLmFsbC5rZXlzKGtleXMpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuZG9lc05vdEhhdmVBbnlLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgbm9uZSBvZiB0aGUgYGtleXNgIHByb3ZpZGVkLlxuICAgKiBZb3UgY2FuIGFsc28gcHJvdmlkZSBhIHNpbmdsZSBvYmplY3QgaW5zdGVhZCBvZiBhIGBrZXlzYCBhcnJheSBhbmQgaXRzIGtleXNcbiAgICogd2lsbCBiZSB1c2VkIGFzIHRoZSBleHBlY3RlZCBzZXQgb2Yga2V5cy5cbiAgICpcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFueUtleXMoe2ZvbzogMSwgYmFyOiAyLCBiYXo6IDN9LCBbJ29uZScsICd0d28nLCAnZXhhbXBsZSddKTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFueUtleXMoe2ZvbzogMSwgYmFyOiAyLCBiYXo6IDN9LCB7b25lOiAxLCB0d286IDIsIGV4YW1wbGU6ICdmb28nfSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdEhhdmVBbnlLZXlzKG5ldyBNYXAoW1t7Zm9vOiAxfSwgJ2JhciddLCBbJ2tleScsICd2YWx1ZSddXSksIFt7b25lOiAndHdvJ30sICdleGFtcGxlJ10pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RIYXZlQW55S2V5cyhuZXcgU2V0KFt7Zm9vOiAnYmFyJ30sICdhbm90aGVyS2V5J10sIFt7b25lOiAndHdvJ30sICdleGFtcGxlJ10pO1xuICAgKlxuICAgKiBAbmFtZSBkb2VzTm90SGF2ZUFueUtleXNcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nW119IGtleXNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmRvZXNOb3RIYXZlQW55S2V5cyA9IGZ1bmN0aW9uIChvYmosIGtleXMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5kb2VzTm90SGF2ZUFueUtleXMsIHRydWUpXG4gICAgICAudG8ubm90LmhhdmUuYW55LmtleXMoa2V5cyk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5kb2VzTm90SGF2ZUFsbEtleXMob2JqZWN0LCBba2V5c10sIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGRvZXMgbm90IGhhdmUgYXQgbGVhc3Qgb25lIG9mIHRoZSBga2V5c2AgcHJvdmlkZWQuXG4gICAqIFlvdSBjYW4gYWxzbyBwcm92aWRlIGEgc2luZ2xlIG9iamVjdCBpbnN0ZWFkIG9mIGEgYGtleXNgIGFycmF5IGFuZCBpdHMga2V5c1xuICAgKiB3aWxsIGJlIHVzZWQgYXMgdGhlIGV4cGVjdGVkIHNldCBvZiBrZXlzLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RIYXZlQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIFsnb25lJywgJ3R3bycsICdleGFtcGxlJ10pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RIYXZlQWxsS2V5cyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30sIHtvbmU6IDEsIHR3bzogMiwgZXhhbXBsZTogJ2Zvbyd9KTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFsbEtleXMobmV3IE1hcChbW3tmb286IDF9LCAnYmFyJ10sIFsna2V5JywgJ3ZhbHVlJ11dKSwgW3tvbmU6ICd0d28nfSwgJ2V4YW1wbGUnXSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdEhhdmVBbGxLZXlzKG5ldyBTZXQoW3tmb286ICdiYXInfSwgJ2Fub3RoZXJLZXknXSwgW3tvbmU6ICd0d28nfSwgJ2V4YW1wbGUnXSk7XG4gICAqXG4gICAqIEBuYW1lIGRvZXNOb3RIYXZlQWxsS2V5c1xuICAgKiBAcGFyYW0ge01peGVkfSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmdbXX0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZG9lc05vdEhhdmVBbGxLZXlzID0gZnVuY3Rpb24gKG9iaiwga2V5cywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmRvZXNOb3RIYXZlQWxsS2V5cywgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5hbGwua2V5cyhrZXlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmhhc0FueURlZXBLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgYXQgbGVhc3Qgb25lIG9mIHRoZSBga2V5c2AgcHJvdmlkZWQuXG4gICAqIFNpbmNlIFNldHMgYW5kIE1hcHMgY2FuIGhhdmUgb2JqZWN0cyBhcyBrZXlzIHlvdSBjYW4gdXNlIHRoaXMgYXNzZXJ0aW9uIHRvIHBlcmZvcm1cbiAgICogYSBkZWVwIGNvbXBhcmlzb24uXG4gICAqIFlvdSBjYW4gYWxzbyBwcm92aWRlIGEgc2luZ2xlIG9iamVjdCBpbnN0ZWFkIG9mIGEgYGtleXNgIGFycmF5IGFuZCBpdHMga2V5c1xuICAgKiB3aWxsIGJlIHVzZWQgYXMgdGhlIGV4cGVjdGVkIHNldCBvZiBrZXlzLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lmhhc0FueURlZXBLZXlzKG5ldyBNYXAoW1t7b25lOiAnb25lJ30sICd2YWx1ZU9uZSddLCBbMSwgMl1dKSwge29uZTogJ29uZSd9KTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgWzEsIDJdXSksIFt7b25lOiAnb25lJ30sIHt0d286ICd0d28nfV0pO1xuICAgKiAgICAgYXNzZXJ0Lmhhc0FueURlZXBLZXlzKG5ldyBNYXAoW1t7b25lOiAnb25lJ30sICd2YWx1ZU9uZSddLCBbe3R3bzogJ3R3byd9LCAndmFsdWVUd28nXV0pLCBbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlEZWVwS2V5cyhuZXcgU2V0KFt7b25lOiAnb25lJ30sIHt0d286ICd0d28nfV0pLCB7b25lOiAnb25lJ30pO1xuICAgKiAgICAgYXNzZXJ0Lmhhc0FueURlZXBLZXlzKG5ldyBTZXQoW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSksIFt7b25lOiAnb25lJ30sIHt0aHJlZTogJ3RocmVlJ31dKTtcbiAgICogICAgIGFzc2VydC5oYXNBbnlEZWVwS2V5cyhuZXcgU2V0KFt7b25lOiAnb25lJ30sIHt0d286ICd0d28nfV0pLCBbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdEhhdmVBbGxLZXlzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaGFzQW55RGVlcEtleXMgPSBmdW5jdGlvbiAob2JqLCBrZXlzLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuaGFzQW55RGVlcEtleXMsIHRydWUpXG4gICAgICAudG8uaGF2ZS5hbnkuZGVlcC5rZXlzKGtleXMpO1xuICB9XG5cbiAvKipcbiAgICogIyMjIC5oYXNBbGxEZWVwS2V5cyhvYmplY3QsIFtrZXlzXSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaGFzIGFsbCBhbmQgb25seSBhbGwgb2YgdGhlIGBrZXlzYCBwcm92aWRlZC5cbiAgICogU2luY2UgU2V0cyBhbmQgTWFwcyBjYW4gaGF2ZSBvYmplY3RzIGFzIGtleXMgeW91IGNhbiB1c2UgdGhpcyBhc3NlcnRpb24gdG8gcGVyZm9ybVxuICAgKiBhIGRlZXAgY29tcGFyaXNvbi5cbiAgICogWW91IGNhbiBhbHNvIHByb3ZpZGUgYSBzaW5nbGUgb2JqZWN0IGluc3RlYWQgb2YgYSBga2V5c2AgYXJyYXkgYW5kIGl0cyBrZXlzXG4gICAqIHdpbGwgYmUgdXNlZCBhcyB0aGUgZXhwZWN0ZWQgc2V0IG9mIGtleXMuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaGFzQWxsRGVlcEtleXMobmV3IE1hcChbW3tvbmU6ICdvbmUnfSwgJ3ZhbHVlT25lJ11dKSwge29uZTogJ29uZSd9KTtcbiAgICogICAgIGFzc2VydC5oYXNBbGxEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgW3t0d286ICd0d28nfSwgJ3ZhbHVlVHdvJ11dKSwgW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSk7XG4gICAqICAgICBhc3NlcnQuaGFzQWxsRGVlcEtleXMobmV3IFNldChbe29uZTogJ29uZSd9XSksIHtvbmU6ICdvbmUnfSk7XG4gICAqICAgICBhc3NlcnQuaGFzQWxsRGVlcEtleXMobmV3IFNldChbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKSwgW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSk7XG4gICAqXG4gICAqIEBuYW1lIGhhc0FsbERlZXBLZXlzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaGFzQWxsRGVlcEtleXMgPSBmdW5jdGlvbiAob2JqLCBrZXlzLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuaGFzQWxsRGVlcEtleXMsIHRydWUpXG4gICAgICAudG8uaGF2ZS5hbGwuZGVlcC5rZXlzKGtleXMpO1xuICB9XG5cbiAvKipcbiAgICogIyMjIC5jb250YWluc0FsbERlZXBLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBjb250YWlucyBhbGwgb2YgdGhlIGBrZXlzYCBwcm92aWRlZC5cbiAgICogU2luY2UgU2V0cyBhbmQgTWFwcyBjYW4gaGF2ZSBvYmplY3RzIGFzIGtleXMgeW91IGNhbiB1c2UgdGhpcyBhc3NlcnRpb24gdG8gcGVyZm9ybVxuICAgKiBhIGRlZXAgY29tcGFyaXNvbi5cbiAgICogWW91IGNhbiBhbHNvIHByb3ZpZGUgYSBzaW5nbGUgb2JqZWN0IGluc3RlYWQgb2YgYSBga2V5c2AgYXJyYXkgYW5kIGl0cyBrZXlzXG4gICAqIHdpbGwgYmUgdXNlZCBhcyB0aGUgZXhwZWN0ZWQgc2V0IG9mIGtleXMuXG4gICAqXG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgWzEsIDJdXSksIHtvbmU6ICdvbmUnfSk7XG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgW3t0d286ICd0d28nfSwgJ3ZhbHVlVHdvJ11dKSwgW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSk7XG4gICAqICAgICBhc3NlcnQuY29udGFpbnNBbGxEZWVwS2V5cyhuZXcgU2V0KFt7b25lOiAnb25lJ30sIHt0d286ICd0d28nfV0pLCB7b25lOiAnb25lJ30pO1xuICAgKiAgICAgYXNzZXJ0LmNvbnRhaW5zQWxsRGVlcEtleXMobmV3IFNldChbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKSwgW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSk7XG4gICAqXG4gICAqIEBuYW1lIGNvbnRhaW5zQWxsRGVlcEtleXNcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fSBrZXlzXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5jb250YWluc0FsbERlZXBLZXlzID0gZnVuY3Rpb24gKG9iaiwga2V5cywgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmNvbnRhaW5zQWxsRGVlcEtleXMsIHRydWUpXG4gICAgICAudG8uY29udGFpbi5hbGwuZGVlcC5rZXlzKGtleXMpO1xuICB9XG5cbiAvKipcbiAgICogIyMjIC5kb2VzTm90SGF2ZUFueURlZXBLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBoYXMgbm9uZSBvZiB0aGUgYGtleXNgIHByb3ZpZGVkLlxuICAgKiBTaW5jZSBTZXRzIGFuZCBNYXBzIGNhbiBoYXZlIG9iamVjdHMgYXMga2V5cyB5b3UgY2FuIHVzZSB0aGlzIGFzc2VydGlvbiB0byBwZXJmb3JtXG4gICAqIGEgZGVlcCBjb21wYXJpc29uLlxuICAgKiBZb3UgY2FuIGFsc28gcHJvdmlkZSBhIHNpbmdsZSBvYmplY3QgaW5zdGVhZCBvZiBhIGBrZXlzYCBhcnJheSBhbmQgaXRzIGtleXNcbiAgICogd2lsbCBiZSB1c2VkIGFzIHRoZSBleHBlY3RlZCBzZXQgb2Yga2V5cy5cbiAgICpcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFueURlZXBLZXlzKG5ldyBNYXAoW1t7b25lOiAnb25lJ30sICd2YWx1ZU9uZSddLCBbMSwgMl1dKSwge3RoaXNEb2VzTm90OiAnZXhpc3QnfSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdEhhdmVBbnlEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgW3t0d286ICd0d28nfSwgJ3ZhbHVlVHdvJ11dKSwgW3t0d2VudHk6ICd0d2VudHknfSwge2ZpZnR5OiAnZmlmdHknfV0pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RIYXZlQW55RGVlcEtleXMobmV3IFNldChbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKSwge3R3ZW50eTogJ3R3ZW50eSd9KTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFueURlZXBLZXlzKG5ldyBTZXQoW3tvbmU6ICdvbmUnfSwge3R3bzogJ3R3byd9XSksIFt7dHdlbnR5OiAndHdlbnR5J30sIHtmaWZ0eTogJ2ZpZnR5J31dKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdEhhdmVBbnlEZWVwS2V5c1xuICAgKiBAcGFyYW0ge01peGVkfSBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGtleXNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmRvZXNOb3RIYXZlQW55RGVlcEtleXMgPSBmdW5jdGlvbiAob2JqLCBrZXlzLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuZG9lc05vdEhhdmVBbnlEZWVwS2V5cywgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5hbnkuZGVlcC5rZXlzKGtleXMpO1xuICB9XG5cbiAvKipcbiAgICogIyMjIC5kb2VzTm90SGF2ZUFsbERlZXBLZXlzKG9iamVjdCwgW2tleXNdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBkb2VzIG5vdCBoYXZlIGF0IGxlYXN0IG9uZSBvZiB0aGUgYGtleXNgIHByb3ZpZGVkLlxuICAgKiBTaW5jZSBTZXRzIGFuZCBNYXBzIGNhbiBoYXZlIG9iamVjdHMgYXMga2V5cyB5b3UgY2FuIHVzZSB0aGlzIGFzc2VydGlvbiB0byBwZXJmb3JtXG4gICAqIGEgZGVlcCBjb21wYXJpc29uLlxuICAgKiBZb3UgY2FuIGFsc28gcHJvdmlkZSBhIHNpbmdsZSBvYmplY3QgaW5zdGVhZCBvZiBhIGBrZXlzYCBhcnJheSBhbmQgaXRzIGtleXNcbiAgICogd2lsbCBiZSB1c2VkIGFzIHRoZSBleHBlY3RlZCBzZXQgb2Yga2V5cy5cbiAgICpcbiAgICogICAgIGFzc2VydC5kb2VzTm90SGF2ZUFsbERlZXBLZXlzKG5ldyBNYXAoW1t7b25lOiAnb25lJ30sICd2YWx1ZU9uZSddLCBbMSwgMl1dKSwge3RoaXNEb2VzTm90OiAnZXhpc3QnfSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdEhhdmVBbGxEZWVwS2V5cyhuZXcgTWFwKFtbe29uZTogJ29uZSd9LCAndmFsdWVPbmUnXSwgW3t0d286ICd0d28nfSwgJ3ZhbHVlVHdvJ11dKSwgW3t0d2VudHk6ICd0d2VudHknfSwge29uZTogJ29uZSd9XSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdEhhdmVBbGxEZWVwS2V5cyhuZXcgU2V0KFt7b25lOiAnb25lJ30sIHt0d286ICd0d28nfV0pLCB7dHdlbnR5OiAndHdlbnR5J30pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RIYXZlQWxsRGVlcEtleXMobmV3IFNldChbe29uZTogJ29uZSd9LCB7dHdvOiAndHdvJ31dKSwgW3tvbmU6ICdvbmUnfSwge2ZpZnR5OiAnZmlmdHknfV0pO1xuICAgKlxuICAgKiBAbmFtZSBkb2VzTm90SGF2ZUFsbERlZXBLZXlzXG4gICAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0ga2V5c1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZG9lc05vdEhhdmVBbGxEZWVwS2V5cyA9IGZ1bmN0aW9uIChvYmosIGtleXMsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5kb2VzTm90SGF2ZUFsbERlZXBLZXlzLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLmFsbC5kZWVwLmtleXMoa2V5cyk7XG4gIH1cblxuIC8qKlxuICAgKiAjIyMgLnRocm93cyhmbiwgW2Vycm9yTGlrZS9zdHJpbmcvcmVnZXhwXSwgW3N0cmluZy9yZWdleHBdLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIElmIGBlcnJvckxpa2VgIGlzIGFuIGBFcnJvcmAgY29uc3RydWN0b3IsIGFzc2VydHMgdGhhdCBgZm5gIHdpbGwgdGhyb3cgYW4gZXJyb3IgdGhhdCBpcyBhblxuICAgKiBpbnN0YW5jZSBvZiBgZXJyb3JMaWtlYC5cbiAgICogSWYgYGVycm9yTGlrZWAgaXMgYW4gYEVycm9yYCBpbnN0YW5jZSwgYXNzZXJ0cyB0aGF0IHRoZSBlcnJvciB0aHJvd24gaXMgdGhlIHNhbWVcbiAgICogaW5zdGFuY2UgYXMgYGVycm9yTGlrZWAuXG4gICAqIElmIGBlcnJNc2dNYXRjaGVyYCBpcyBwcm92aWRlZCwgaXQgYWxzbyBhc3NlcnRzIHRoYXQgdGhlIGVycm9yIHRocm93biB3aWxsIGhhdmUgYVxuICAgKiBtZXNzYWdlIG1hdGNoaW5nIGBlcnJNc2dNYXRjaGVyYC5cbiAgICpcbiAgICogICAgIGFzc2VydC50aHJvd3MoZm4sICdmdW5jdGlvbiB0aHJvd3MgYSByZWZlcmVuY2UgZXJyb3InKTtcbiAgICogICAgIGFzc2VydC50aHJvd3MoZm4sIC9mdW5jdGlvbiB0aHJvd3MgYSByZWZlcmVuY2UgZXJyb3IvKTtcbiAgICogICAgIGFzc2VydC50aHJvd3MoZm4sIFJlZmVyZW5jZUVycm9yKTtcbiAgICogICAgIGFzc2VydC50aHJvd3MoZm4sIGVycm9ySW5zdGFuY2UpO1xuICAgKiAgICAgYXNzZXJ0LnRocm93cyhmbiwgUmVmZXJlbmNlRXJyb3IsICdFcnJvciB0aHJvd24gbXVzdCBiZSBhIFJlZmVyZW5jZUVycm9yIGFuZCBoYXZlIHRoaXMgbXNnJyk7XG4gICAqICAgICBhc3NlcnQudGhyb3dzKGZuLCBlcnJvckluc3RhbmNlLCAnRXJyb3IgdGhyb3duIG11c3QgYmUgdGhlIHNhbWUgZXJyb3JJbnN0YW5jZSBhbmQgaGF2ZSB0aGlzIG1zZycpO1xuICAgKiAgICAgYXNzZXJ0LnRocm93cyhmbiwgUmVmZXJlbmNlRXJyb3IsIC9FcnJvciB0aHJvd24gbXVzdCBiZSBhIFJlZmVyZW5jZUVycm9yIGFuZCBtYXRjaCB0aGlzLyk7XG4gICAqICAgICBhc3NlcnQudGhyb3dzKGZuLCBlcnJvckluc3RhbmNlLCAvRXJyb3IgdGhyb3duIG11c3QgYmUgdGhlIHNhbWUgZXJyb3JJbnN0YW5jZSBhbmQgbWF0Y2ggdGhpcy8pO1xuICAgKlxuICAgKiBAbmFtZSB0aHJvd3NcbiAgICogQGFsaWFzIHRocm93XG4gICAqIEBhbGlhcyBUaHJvd1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcGFyYW0ge0Vycm9yQ29uc3RydWN0b3J8RXJyb3J9IGVycm9yTGlrZVxuICAgKiBAcGFyYW0ge1JlZ0V4cHxTdHJpbmd9IGVyck1zZ01hdGNoZXJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9FcnJvciNFcnJvcl90eXBlc1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQudGhyb3dzID0gZnVuY3Rpb24gKGZuLCBlcnJvckxpa2UsIGVyck1zZ01hdGNoZXIsIG1zZykge1xuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGVycm9yTGlrZSB8fCBlcnJvckxpa2UgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgIGVyck1zZ01hdGNoZXIgPSBlcnJvckxpa2U7XG4gICAgICBlcnJvckxpa2UgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBhc3NlcnRFcnIgPSBuZXcgQXNzZXJ0aW9uKGZuLCBtc2csIGFzc2VydC50aHJvd3MsIHRydWUpXG4gICAgICAudG8udGhyb3coZXJyb3JMaWtlLCBlcnJNc2dNYXRjaGVyKTtcbiAgICByZXR1cm4gZmxhZyhhc3NlcnRFcnIsICdvYmplY3QnKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5kb2VzTm90VGhyb3coZm4sIFtlcnJvckxpa2Uvc3RyaW5nL3JlZ2V4cF0sIFtzdHJpbmcvcmVnZXhwXSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBJZiBgZXJyb3JMaWtlYCBpcyBhbiBgRXJyb3JgIGNvbnN0cnVjdG9yLCBhc3NlcnRzIHRoYXQgYGZuYCB3aWxsIF9ub3RfIHRocm93IGFuIGVycm9yIHRoYXQgaXMgYW5cbiAgICogaW5zdGFuY2Ugb2YgYGVycm9yTGlrZWAuXG4gICAqIElmIGBlcnJvckxpa2VgIGlzIGFuIGBFcnJvcmAgaW5zdGFuY2UsIGFzc2VydHMgdGhhdCB0aGUgZXJyb3IgdGhyb3duIGlzIF9ub3RfIHRoZSBzYW1lXG4gICAqIGluc3RhbmNlIGFzIGBlcnJvckxpa2VgLlxuICAgKiBJZiBgZXJyTXNnTWF0Y2hlcmAgaXMgcHJvdmlkZWQsIGl0IGFsc28gYXNzZXJ0cyB0aGF0IHRoZSBlcnJvciB0aHJvd24gd2lsbCBfbm90XyBoYXZlIGFcbiAgICogbWVzc2FnZSBtYXRjaGluZyBgZXJyTXNnTWF0Y2hlcmAuXG4gICAqXG4gICAqICAgICBhc3NlcnQuZG9lc05vdFRocm93KGZuLCAnQW55IEVycm9yIHRocm93biBtdXN0IG5vdCBoYXZlIHRoaXMgbWVzc2FnZScpO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RUaHJvdyhmbiwgL0FueSBFcnJvciB0aHJvd24gbXVzdCBub3QgbWF0Y2ggdGhpcy8pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RUaHJvdyhmbiwgRXJyb3IpO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RUaHJvdyhmbiwgZXJyb3JJbnN0YW5jZSk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdFRocm93KGZuLCBFcnJvciwgJ0Vycm9yIG11c3Qgbm90IGhhdmUgdGhpcyBtZXNzYWdlJyk7XG4gICAqICAgICBhc3NlcnQuZG9lc05vdFRocm93KGZuLCBlcnJvckluc3RhbmNlLCAnRXJyb3IgbXVzdCBub3QgaGF2ZSB0aGlzIG1lc3NhZ2UnKTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90VGhyb3coZm4sIEVycm9yLCAvRXJyb3IgbXVzdCBub3QgbWF0Y2ggdGhpcy8pO1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3RUaHJvdyhmbiwgZXJyb3JJbnN0YW5jZSwgL0Vycm9yIG11c3Qgbm90IG1hdGNoIHRoaXMvKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdFRocm93XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEBwYXJhbSB7RXJyb3JDb25zdHJ1Y3Rvcn0gZXJyb3JMaWtlXG4gICAqIEBwYXJhbSB7UmVnRXhwfFN0cmluZ30gZXJyTXNnTWF0Y2hlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0Vycm9yI0Vycm9yX3R5cGVzXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbiAoZm4sIGVycm9yTGlrZSwgZXJyTXNnTWF0Y2hlciwgbXNnKSB7XG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZXJyb3JMaWtlIHx8IGVycm9yTGlrZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgZXJyTXNnTWF0Y2hlciA9IGVycm9yTGlrZTtcbiAgICAgIGVycm9yTGlrZSA9IG51bGw7XG4gICAgfVxuXG4gICAgbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuZG9lc05vdFRocm93LCB0cnVlKVxuICAgICAgLnRvLm5vdC50aHJvdyhlcnJvckxpa2UsIGVyck1zZ01hdGNoZXIpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLm9wZXJhdG9yKHZhbDEsIG9wZXJhdG9yLCB2YWwyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIENvbXBhcmVzIHR3byB2YWx1ZXMgdXNpbmcgYG9wZXJhdG9yYC5cbiAgICpcbiAgICogICAgIGFzc2VydC5vcGVyYXRvcigxLCAnPCcsIDIsICdldmVyeXRoaW5nIGlzIG9rJyk7XG4gICAqICAgICBhc3NlcnQub3BlcmF0b3IoMSwgJz4nLCAyLCAndGhpcyB3aWxsIGZhaWwnKTtcbiAgICpcbiAgICogQG5hbWUgb3BlcmF0b3JcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsMVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3BlcmF0b3JcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsMlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQub3BlcmF0b3IgPSBmdW5jdGlvbiAodmFsLCBvcGVyYXRvciwgdmFsMiwgbXNnKSB7XG4gICAgdmFyIG9rO1xuICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgICAgY2FzZSAnPT0nOlxuICAgICAgICBvayA9IHZhbCA9PSB2YWwyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz09PSc6XG4gICAgICAgIG9rID0gdmFsID09PSB2YWwyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJz4nOlxuICAgICAgICBvayA9IHZhbCA+IHZhbDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnPj0nOlxuICAgICAgICBvayA9IHZhbCA+PSB2YWwyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJzwnOlxuICAgICAgICBvayA9IHZhbCA8IHZhbDI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnPD0nOlxuICAgICAgICBvayA9IHZhbCA8PSB2YWwyO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyE9JzpcbiAgICAgICAgb2sgPSB2YWwgIT0gdmFsMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICchPT0nOlxuICAgICAgICBvayA9IHZhbCAhPT0gdmFsMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBtc2cgPSBtc2cgPyBtc2cgKyAnOiAnIDogbXNnO1xuICAgICAgICB0aHJvdyBuZXcgY2hhaS5Bc3NlcnRpb25FcnJvcihcbiAgICAgICAgICBtc2cgKyAnSW52YWxpZCBvcGVyYXRvciBcIicgKyBvcGVyYXRvciArICdcIicsXG4gICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgIGFzc2VydC5vcGVyYXRvclxuICAgICAgICApO1xuICAgIH1cbiAgICB2YXIgdGVzdCA9IG5ldyBBc3NlcnRpb24ob2ssIG1zZywgYXNzZXJ0Lm9wZXJhdG9yLCB0cnVlKTtcbiAgICB0ZXN0LmFzc2VydChcbiAgICAgICAgdHJ1ZSA9PT0gZmxhZyh0ZXN0LCAnb2JqZWN0JylcbiAgICAgICwgJ2V4cGVjdGVkICcgKyB1dGlsLmluc3BlY3QodmFsKSArICcgdG8gYmUgJyArIG9wZXJhdG9yICsgJyAnICsgdXRpbC5pbnNwZWN0KHZhbDIpXG4gICAgICAsICdleHBlY3RlZCAnICsgdXRpbC5pbnNwZWN0KHZhbCkgKyAnIHRvIG5vdCBiZSAnICsgb3BlcmF0b3IgKyAnICcgKyB1dGlsLmluc3BlY3QodmFsMikgKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5jbG9zZVRvKGFjdHVhbCwgZXhwZWN0ZWQsIGRlbHRhLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgdGFyZ2V0IGlzIGVxdWFsIGBleHBlY3RlZGAsIHRvIHdpdGhpbiBhICsvLSBgZGVsdGFgIHJhbmdlLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmNsb3NlVG8oMS41LCAxLCAwLjUsICdudW1iZXJzIGFyZSBjbG9zZScpO1xuICAgKlxuICAgKiBAbmFtZSBjbG9zZVRvXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBhY3R1YWxcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGV4cGVjdGVkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuY2xvc2VUbyA9IGZ1bmN0aW9uIChhY3QsIGV4cCwgZGVsdGEsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oYWN0LCBtc2csIGFzc2VydC5jbG9zZVRvLCB0cnVlKS50by5iZS5jbG9zZVRvKGV4cCwgZGVsdGEpO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmFwcHJveGltYXRlbHkoYWN0dWFsLCBleHBlY3RlZCwgZGVsdGEsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgZXF1YWwgYGV4cGVjdGVkYCwgdG8gd2l0aGluIGEgKy8tIGBkZWx0YWAgcmFuZ2UuXG4gICAqXG4gICAqICAgICBhc3NlcnQuYXBwcm94aW1hdGVseSgxLjUsIDEsIDAuNSwgJ251bWJlcnMgYXJlIGNsb3NlJyk7XG4gICAqXG4gICAqIEBuYW1lIGFwcHJveGltYXRlbHlcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGFjdHVhbFxuICAgKiBAcGFyYW0ge051bWJlcn0gZXhwZWN0ZWRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5hcHByb3hpbWF0ZWx5ID0gZnVuY3Rpb24gKGFjdCwgZXhwLCBkZWx0YSwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihhY3QsIG1zZywgYXNzZXJ0LmFwcHJveGltYXRlbHksIHRydWUpXG4gICAgICAudG8uYmUuYXBwcm94aW1hdGVseShleHAsIGRlbHRhKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5zYW1lTWVtYmVycyhzZXQxLCBzZXQyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc2V0MWAgYW5kIGBzZXQyYCBoYXZlIHRoZSBzYW1lIG1lbWJlcnMgaW4gYW55IG9yZGVyLiBVc2VzIGFcbiAgICogc3RyaWN0IGVxdWFsaXR5IGNoZWNrICg9PT0pLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LnNhbWVNZW1iZXJzKFsgMSwgMiwgMyBdLCBbIDIsIDEsIDMgXSwgJ3NhbWUgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBzYW1lTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQxXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LnNhbWVNZW1iZXJzID0gZnVuY3Rpb24gKHNldDEsIHNldDIsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oc2V0MSwgbXNnLCBhc3NlcnQuc2FtZU1lbWJlcnMsIHRydWUpXG4gICAgICAudG8uaGF2ZS5zYW1lLm1lbWJlcnMoc2V0Mik7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5ub3RTYW1lTWVtYmVycyhzZXQxLCBzZXQyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc2V0MWAgYW5kIGBzZXQyYCBkb24ndCBoYXZlIHRoZSBzYW1lIG1lbWJlcnMgaW4gYW55IG9yZGVyLlxuICAgKiBVc2VzIGEgc3RyaWN0IGVxdWFsaXR5IGNoZWNrICg9PT0pLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdFNhbWVNZW1iZXJzKFsgMSwgMiwgMyBdLCBbIDUsIDEsIDMgXSwgJ25vdCBzYW1lIG1lbWJlcnMnKTtcbiAgICpcbiAgICogQG5hbWUgbm90U2FtZU1lbWJlcnNcbiAgICogQHBhcmFtIHtBcnJheX0gc2V0MVxuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RTYW1lTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0Lm5vdFNhbWVNZW1iZXJzLCB0cnVlKVxuICAgICAgLnRvLm5vdC5oYXZlLnNhbWUubWVtYmVycyhzZXQyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLnNhbWVEZWVwTWVtYmVycyhzZXQxLCBzZXQyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc2V0MWAgYW5kIGBzZXQyYCBoYXZlIHRoZSBzYW1lIG1lbWJlcnMgaW4gYW55IG9yZGVyLiBVc2VzIGFcbiAgICogZGVlcCBlcXVhbGl0eSBjaGVjay5cbiAgICpcbiAgICogICAgIGFzc2VydC5zYW1lRGVlcE1lbWJlcnMoWyB7IGE6IDEgfSwgeyBiOiAyIH0sIHsgYzogMyB9IF0sIFt7IGI6IDIgfSwgeyBhOiAxIH0sIHsgYzogMyB9XSwgJ3NhbWUgZGVlcCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIHNhbWVEZWVwTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQxXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LnNhbWVEZWVwTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0LnNhbWVEZWVwTWVtYmVycywgdHJ1ZSlcbiAgICAgIC50by5oYXZlLnNhbWUuZGVlcC5tZW1iZXJzKHNldDIpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubm90U2FtZURlZXBNZW1iZXJzKHNldDEsIHNldDIsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBzZXQxYCBhbmQgYHNldDJgIGRvbid0IGhhdmUgdGhlIHNhbWUgbWVtYmVycyBpbiBhbnkgb3JkZXIuXG4gICAqIFVzZXMgYSBkZWVwIGVxdWFsaXR5IGNoZWNrLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdFNhbWVEZWVwTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgW3sgYjogMiB9LCB7IGE6IDEgfSwgeyBmOiA1IH1dLCAnbm90IHNhbWUgZGVlcCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdFNhbWVEZWVwTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQxXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdFNhbWVEZWVwTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0Lm5vdFNhbWVEZWVwTWVtYmVycywgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5zYW1lLmRlZXAubWVtYmVycyhzZXQyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLnNhbWVPcmRlcmVkTWVtYmVycyhzZXQxLCBzZXQyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc2V0MWAgYW5kIGBzZXQyYCBoYXZlIHRoZSBzYW1lIG1lbWJlcnMgaW4gdGhlIHNhbWUgb3JkZXIuXG4gICAqIFVzZXMgYSBzdHJpY3QgZXF1YWxpdHkgY2hlY2sgKD09PSkuXG4gICAqXG4gICAqICAgICBhc3NlcnQuc2FtZU9yZGVyZWRNZW1iZXJzKFsgMSwgMiwgMyBdLCBbIDEsIDIsIDMgXSwgJ3NhbWUgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIHNhbWVPcmRlcmVkTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQxXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LnNhbWVPcmRlcmVkTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0LnNhbWVPcmRlcmVkTWVtYmVycywgdHJ1ZSlcbiAgICAgIC50by5oYXZlLnNhbWUub3JkZXJlZC5tZW1iZXJzKHNldDIpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubm90U2FtZU9yZGVyZWRNZW1iZXJzKHNldDEsIHNldDIsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBzZXQxYCBhbmQgYHNldDJgIGRvbid0IGhhdmUgdGhlIHNhbWUgbWVtYmVycyBpbiB0aGUgc2FtZVxuICAgKiBvcmRlci4gVXNlcyBhIHN0cmljdCBlcXVhbGl0eSBjaGVjayAoPT09KS5cbiAgICpcbiAgICogICAgIGFzc2VydC5ub3RTYW1lT3JkZXJlZE1lbWJlcnMoWyAxLCAyLCAzIF0sIFsgMiwgMSwgMyBdLCAnbm90IHNhbWUgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdFNhbWVPcmRlcmVkTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzZXQxXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDJcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdFNhbWVPcmRlcmVkTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0Lm5vdFNhbWVPcmRlcmVkTWVtYmVycywgdHJ1ZSlcbiAgICAgIC50by5ub3QuaGF2ZS5zYW1lLm9yZGVyZWQubWVtYmVycyhzZXQyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLnNhbWVEZWVwT3JkZXJlZE1lbWJlcnMoc2V0MSwgc2V0MiwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHNldDFgIGFuZCBgc2V0MmAgaGF2ZSB0aGUgc2FtZSBtZW1iZXJzIGluIHRoZSBzYW1lIG9yZGVyLlxuICAgKiBVc2VzIGEgZGVlcCBlcXVhbGl0eSBjaGVjay5cbiAgICpcbiAgICogYXNzZXJ0LnNhbWVEZWVwT3JkZXJlZE1lbWJlcnMoWyB7IGE6IDEgfSwgeyBiOiAyIH0sIHsgYzogMyB9IF0sIFsgeyBhOiAxIH0sIHsgYjogMiB9LCB7IGM6IDMgfSBdLCAnc2FtZSBkZWVwIG9yZGVyZWQgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBzYW1lRGVlcE9yZGVyZWRNZW1iZXJzXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDFcbiAgICogQHBhcmFtIHtBcnJheX0gc2V0MlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuc2FtZURlZXBPcmRlcmVkTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0LnNhbWVEZWVwT3JkZXJlZE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8uaGF2ZS5zYW1lLmRlZXAub3JkZXJlZC5tZW1iZXJzKHNldDIpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubm90U2FtZURlZXBPcmRlcmVkTWVtYmVycyhzZXQxLCBzZXQyLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc2V0MWAgYW5kIGBzZXQyYCBkb24ndCBoYXZlIHRoZSBzYW1lIG1lbWJlcnMgaW4gdGhlIHNhbWVcbiAgICogb3JkZXIuIFVzZXMgYSBkZWVwIGVxdWFsaXR5IGNoZWNrLlxuICAgKlxuICAgKiBhc3NlcnQubm90U2FtZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGE6IDEgfSwgeyBiOiAyIH0sIHsgejogNSB9IF0sICdub3Qgc2FtZSBkZWVwIG9yZGVyZWQgbWVtYmVycycpO1xuICAgKiBhc3NlcnQubm90U2FtZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGI6IDIgfSwgeyBhOiAxIH0sIHsgYzogMyB9IF0sICdub3Qgc2FtZSBkZWVwIG9yZGVyZWQgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBub3RTYW1lRGVlcE9yZGVyZWRNZW1iZXJzXG4gICAqIEBwYXJhbSB7QXJyYXl9IHNldDFcbiAgICogQHBhcmFtIHtBcnJheX0gc2V0MlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQubm90U2FtZURlZXBPcmRlcmVkTWVtYmVycyA9IGZ1bmN0aW9uIChzZXQxLCBzZXQyLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHNldDEsIG1zZywgYXNzZXJ0Lm5vdFNhbWVEZWVwT3JkZXJlZE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8ubm90LmhhdmUuc2FtZS5kZWVwLm9yZGVyZWQubWVtYmVycyhzZXQyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmluY2x1ZGVNZW1iZXJzKHN1cGVyc2V0LCBzdWJzZXQsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBzdWJzZXRgIGlzIGluY2x1ZGVkIGluIGBzdXBlcnNldGAgaW4gYW55IG9yZGVyLiBVc2VzIGFcbiAgICogc3RyaWN0IGVxdWFsaXR5IGNoZWNrICg9PT0pLiBEdXBsaWNhdGVzIGFyZSBpZ25vcmVkLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmluY2x1ZGVNZW1iZXJzKFsgMSwgMiwgMyBdLCBbIDIsIDEsIDIgXSwgJ2luY2x1ZGUgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBpbmNsdWRlTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmluY2x1ZGVNZW1iZXJzID0gZnVuY3Rpb24gKHN1cGVyc2V0LCBzdWJzZXQsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oc3VwZXJzZXQsIG1zZywgYXNzZXJ0LmluY2x1ZGVNZW1iZXJzLCB0cnVlKVxuICAgICAgLnRvLmluY2x1ZGUubWVtYmVycyhzdWJzZXQpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAubm90SW5jbHVkZU1lbWJlcnMoc3VwZXJzZXQsIHN1YnNldCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHN1YnNldGAgaXNuJ3QgaW5jbHVkZWQgaW4gYHN1cGVyc2V0YCBpbiBhbnkgb3JkZXIuIFVzZXMgYVxuICAgKiBzdHJpY3QgZXF1YWxpdHkgY2hlY2sgKD09PSkuIER1cGxpY2F0ZXMgYXJlIGlnbm9yZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZU1lbWJlcnMoWyAxLCAyLCAzIF0sIFsgNSwgMSBdLCAnbm90IGluY2x1ZGUgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBub3RJbmNsdWRlTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdEluY2x1ZGVNZW1iZXJzID0gZnVuY3Rpb24gKHN1cGVyc2V0LCBzdWJzZXQsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oc3VwZXJzZXQsIG1zZywgYXNzZXJ0Lm5vdEluY2x1ZGVNZW1iZXJzLCB0cnVlKVxuICAgICAgLnRvLm5vdC5pbmNsdWRlLm1lbWJlcnMoc3Vic2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmluY2x1ZGVEZWVwTWVtYmVycyhzdXBlcnNldCwgc3Vic2V0LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc3Vic2V0YCBpcyBpbmNsdWRlZCBpbiBgc3VwZXJzZXRgIGluIGFueSBvcmRlci4gVXNlcyBhIGRlZXBcbiAgICogZXF1YWxpdHkgY2hlY2suIER1cGxpY2F0ZXMgYXJlIGlnbm9yZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaW5jbHVkZURlZXBNZW1iZXJzKFsgeyBhOiAxIH0sIHsgYjogMiB9LCB7IGM6IDMgfSBdLCBbIHsgYjogMiB9LCB7IGE6IDEgfSwgeyBiOiAyIH0gXSwgJ2luY2x1ZGUgZGVlcCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIGluY2x1ZGVEZWVwTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmluY2x1ZGVEZWVwTWVtYmVycyA9IGZ1bmN0aW9uIChzdXBlcnNldCwgc3Vic2V0LCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHN1cGVyc2V0LCBtc2csIGFzc2VydC5pbmNsdWRlRGVlcE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8uaW5jbHVkZS5kZWVwLm1lbWJlcnMoc3Vic2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLm5vdEluY2x1ZGVEZWVwTWVtYmVycyhzdXBlcnNldCwgc3Vic2V0LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgc3Vic2V0YCBpc24ndCBpbmNsdWRlZCBpbiBgc3VwZXJzZXRgIGluIGFueSBvcmRlci4gVXNlcyBhXG4gICAqIGRlZXAgZXF1YWxpdHkgY2hlY2suIER1cGxpY2F0ZXMgYXJlIGlnbm9yZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZURlZXBNZW1iZXJzKFsgeyBhOiAxIH0sIHsgYjogMiB9LCB7IGM6IDMgfSBdLCBbIHsgYjogMiB9LCB7IGY6IDUgfSBdLCAnbm90IGluY2x1ZGUgZGVlcCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdEluY2x1ZGVEZWVwTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdEluY2x1ZGVEZWVwTWVtYmVycyA9IGZ1bmN0aW9uIChzdXBlcnNldCwgc3Vic2V0LCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHN1cGVyc2V0LCBtc2csIGFzc2VydC5ub3RJbmNsdWRlRGVlcE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8ubm90LmluY2x1ZGUuZGVlcC5tZW1iZXJzKHN1YnNldCk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5pbmNsdWRlT3JkZXJlZE1lbWJlcnMoc3VwZXJzZXQsIHN1YnNldCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHN1YnNldGAgaXMgaW5jbHVkZWQgaW4gYHN1cGVyc2V0YCBpbiB0aGUgc2FtZSBvcmRlclxuICAgKiBiZWdpbm5pbmcgd2l0aCB0aGUgZmlyc3QgZWxlbWVudCBpbiBgc3VwZXJzZXRgLiBVc2VzIGEgc3RyaWN0IGVxdWFsaXR5XG4gICAqIGNoZWNrICg9PT0pLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmluY2x1ZGVPcmRlcmVkTWVtYmVycyhbIDEsIDIsIDMgXSwgWyAxLCAyIF0sICdpbmNsdWRlIG9yZGVyZWQgbWVtYmVycycpO1xuICAgKlxuICAgKiBAbmFtZSBpbmNsdWRlT3JkZXJlZE1lbWJlcnNcbiAgICogQHBhcmFtIHtBcnJheX0gc3VwZXJzZXRcbiAgICogQHBhcmFtIHtBcnJheX0gc3Vic2V0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pbmNsdWRlT3JkZXJlZE1lbWJlcnMgPSBmdW5jdGlvbiAoc3VwZXJzZXQsIHN1YnNldCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihzdXBlcnNldCwgbXNnLCBhc3NlcnQuaW5jbHVkZU9yZGVyZWRNZW1iZXJzLCB0cnVlKVxuICAgICAgLnRvLmluY2x1ZGUub3JkZXJlZC5tZW1iZXJzKHN1YnNldCk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5ub3RJbmNsdWRlT3JkZXJlZE1lbWJlcnMoc3VwZXJzZXQsIHN1YnNldCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYHN1YnNldGAgaXNuJ3QgaW5jbHVkZWQgaW4gYHN1cGVyc2V0YCBpbiB0aGUgc2FtZSBvcmRlclxuICAgKiBiZWdpbm5pbmcgd2l0aCB0aGUgZmlyc3QgZWxlbWVudCBpbiBgc3VwZXJzZXRgLiBVc2VzIGEgc3RyaWN0IGVxdWFsaXR5XG4gICAqIGNoZWNrICg9PT0pLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm5vdEluY2x1ZGVPcmRlcmVkTWVtYmVycyhbIDEsIDIsIDMgXSwgWyAyLCAxIF0sICdub3QgaW5jbHVkZSBvcmRlcmVkIG1lbWJlcnMnKTtcbiAgICogICAgIGFzc2VydC5ub3RJbmNsdWRlT3JkZXJlZE1lbWJlcnMoWyAxLCAyLCAzIF0sIFsgMiwgMyBdLCAnbm90IGluY2x1ZGUgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdEluY2x1ZGVPcmRlcmVkTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0Lm5vdEluY2x1ZGVPcmRlcmVkTWVtYmVycyA9IGZ1bmN0aW9uIChzdXBlcnNldCwgc3Vic2V0LCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKHN1cGVyc2V0LCBtc2csIGFzc2VydC5ub3RJbmNsdWRlT3JkZXJlZE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8ubm90LmluY2x1ZGUub3JkZXJlZC5tZW1iZXJzKHN1YnNldCk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5pbmNsdWRlRGVlcE9yZGVyZWRNZW1iZXJzKHN1cGVyc2V0LCBzdWJzZXQsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBzdWJzZXRgIGlzIGluY2x1ZGVkIGluIGBzdXBlcnNldGAgaW4gdGhlIHNhbWUgb3JkZXJcbiAgICogYmVnaW5uaW5nIHdpdGggdGhlIGZpcnN0IGVsZW1lbnQgaW4gYHN1cGVyc2V0YC4gVXNlcyBhIGRlZXAgZXF1YWxpdHlcbiAgICogY2hlY2suXG4gICAqXG4gICAqICAgICBhc3NlcnQuaW5jbHVkZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGE6IDEgfSwgeyBiOiAyIH0gXSwgJ2luY2x1ZGUgZGVlcCBvcmRlcmVkIG1lbWJlcnMnKTtcbiAgICpcbiAgICogQG5hbWUgaW5jbHVkZURlZXBPcmRlcmVkTWVtYmVyc1xuICAgKiBAcGFyYW0ge0FycmF5fSBzdXBlcnNldFxuICAgKiBAcGFyYW0ge0FycmF5fSBzdWJzZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmluY2x1ZGVEZWVwT3JkZXJlZE1lbWJlcnMgPSBmdW5jdGlvbiAoc3VwZXJzZXQsIHN1YnNldCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihzdXBlcnNldCwgbXNnLCBhc3NlcnQuaW5jbHVkZURlZXBPcmRlcmVkTWVtYmVycywgdHJ1ZSlcbiAgICAgIC50by5pbmNsdWRlLmRlZXAub3JkZXJlZC5tZW1iZXJzKHN1YnNldCk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5ub3RJbmNsdWRlRGVlcE9yZGVyZWRNZW1iZXJzKHN1cGVyc2V0LCBzdWJzZXQsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBzdWJzZXRgIGlzbid0IGluY2x1ZGVkIGluIGBzdXBlcnNldGAgaW4gdGhlIHNhbWUgb3JkZXJcbiAgICogYmVnaW5uaW5nIHdpdGggdGhlIGZpcnN0IGVsZW1lbnQgaW4gYHN1cGVyc2V0YC4gVXNlcyBhIGRlZXAgZXF1YWxpdHlcbiAgICogY2hlY2suXG4gICAqXG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGE6IDEgfSwgeyBmOiA1IH0gXSwgJ25vdCBpbmNsdWRlIGRlZXAgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGI6IDIgfSwgeyBhOiAxIH0gXSwgJ25vdCBpbmNsdWRlIGRlZXAgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqICAgICBhc3NlcnQubm90SW5jbHVkZURlZXBPcmRlcmVkTWVtYmVycyhbIHsgYTogMSB9LCB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgWyB7IGI6IDIgfSwgeyBjOiAzIH0gXSwgJ25vdCBpbmNsdWRlIGRlZXAgb3JkZXJlZCBtZW1iZXJzJyk7XG4gICAqXG4gICAqIEBuYW1lIG5vdEluY2x1ZGVEZWVwT3JkZXJlZE1lbWJlcnNcbiAgICogQHBhcmFtIHtBcnJheX0gc3VwZXJzZXRcbiAgICogQHBhcmFtIHtBcnJheX0gc3Vic2V0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5ub3RJbmNsdWRlRGVlcE9yZGVyZWRNZW1iZXJzID0gZnVuY3Rpb24gKHN1cGVyc2V0LCBzdWJzZXQsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24oc3VwZXJzZXQsIG1zZywgYXNzZXJ0Lm5vdEluY2x1ZGVEZWVwT3JkZXJlZE1lbWJlcnMsIHRydWUpXG4gICAgICAudG8ubm90LmluY2x1ZGUuZGVlcC5vcmRlcmVkLm1lbWJlcnMoc3Vic2V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLm9uZU9mKGluTGlzdCwgbGlzdCwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgbm9uLW9iamVjdCwgbm9uLWFycmF5IHZhbHVlIGBpbkxpc3RgIGFwcGVhcnMgaW4gdGhlIGZsYXQgYXJyYXkgYGxpc3RgLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0Lm9uZU9mKDEsIFsgMiwgMSBdLCAnTm90IGZvdW5kIGluIGxpc3QnKTtcbiAgICpcbiAgICogQG5hbWUgb25lT2ZcbiAgICogQHBhcmFtIHsqfSBpbkxpc3RcbiAgICogQHBhcmFtIHtBcnJheTwqPn0gbGlzdFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQub25lT2YgPSBmdW5jdGlvbiAoaW5MaXN0LCBsaXN0LCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKGluTGlzdCwgbXNnLCBhc3NlcnQub25lT2YsIHRydWUpLnRvLmJlLm9uZU9mKGxpc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuY2hhbmdlcyhmdW5jdGlvbiwgb2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBjaGFuZ2VzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5LlxuICAgKlxuICAgKiAgICAgdmFyIG9iaiA9IHsgdmFsOiAxMCB9O1xuICAgKiAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7IG9iai52YWwgPSAyMiB9O1xuICAgKiAgICAgYXNzZXJ0LmNoYW5nZXMoZm4sIG9iaiwgJ3ZhbCcpO1xuICAgKlxuICAgKiBAbmFtZSBjaGFuZ2VzXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuY2hhbmdlcyA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBtc2cpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtc2cgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuY2hhbmdlcywgdHJ1ZSkudG8uY2hhbmdlKG9iaiwgcHJvcCk7XG4gIH1cblxuICAgLyoqXG4gICAqICMjIyAuY2hhbmdlc0J5KGZ1bmN0aW9uLCBvYmplY3QsIHByb3BlcnR5LCBkZWx0YSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBjaGFuZ2VzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGJ5IGFuIGFtb3VudCAoZGVsdGEpLlxuICAgKlxuICAgKiAgICAgdmFyIG9iaiA9IHsgdmFsOiAxMCB9O1xuICAgKiAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7IG9iai52YWwgKz0gMiB9O1xuICAgKiAgICAgYXNzZXJ0LmNoYW5nZXNCeShmbiwgb2JqLCAndmFsJywgMik7XG4gICAqXG4gICAqIEBuYW1lIGNoYW5nZXNCeVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtb2RpZmllciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9yIGdldHRlciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgbmFtZSBfb3B0aW9uYWxfXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjaGFuZ2UgYW1vdW50IChkZWx0YSlcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuY2hhbmdlc0J5ID0gZnVuY3Rpb24gKGZuLCBvYmosIHByb3AsIGRlbHRhLCBtc2cpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCAmJiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgdG1wTXNnID0gZGVsdGE7XG4gICAgICBkZWx0YSA9IHByb3A7XG4gICAgICBtc2cgPSB0bXBNc2c7XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICBkZWx0YSA9IHByb3A7XG4gICAgICBwcm9wID0gbnVsbDtcbiAgICB9XG5cbiAgICBuZXcgQXNzZXJ0aW9uKGZuLCBtc2csIGFzc2VydC5jaGFuZ2VzQnksIHRydWUpXG4gICAgICAudG8uY2hhbmdlKG9iaiwgcHJvcCkuYnkoZGVsdGEpO1xuICB9XG5cbiAgIC8qKlxuICAgKiAjIyMgLmRvZXNOb3RDaGFuZ2UoZnVuY3Rpb24sIG9iamVjdCwgcHJvcGVydHksIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGEgZnVuY3Rpb24gZG9lcyBub3QgY2hhbmdlIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5LlxuICAgKlxuICAgKiAgICAgdmFyIG9iaiA9IHsgdmFsOiAxMCB9O1xuICAgKiAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKCdmb28nKTsgfTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90Q2hhbmdlKGZuLCBvYmosICd2YWwnKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdENoYW5nZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtb2RpZmllciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9yIGdldHRlciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgbmFtZSBfb3B0aW9uYWxfXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmRvZXNOb3RDaGFuZ2UgPSBmdW5jdGlvbiAoZm4sIG9iaiwgcHJvcCwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbXNnID0gcHJvcDtcbiAgICAgIHByb3AgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQXNzZXJ0aW9uKGZuLCBtc2csIGFzc2VydC5kb2VzTm90Q2hhbmdlLCB0cnVlKVxuICAgICAgLnRvLm5vdC5jaGFuZ2Uob2JqLCBwcm9wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmNoYW5nZXNCdXROb3RCeShmdW5jdGlvbiwgb2JqZWN0LCBwcm9wZXJ0eSwgZGVsdGEsIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGEgZnVuY3Rpb24gZG9lcyBub3QgY2hhbmdlIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IG9yIG9mIGEgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgYnkgYW4gYW1vdW50IChkZWx0YSlcbiAgICpcbiAgICogICAgIHZhciBvYmogPSB7IHZhbDogMTAgfTtcbiAgICogICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkgeyBvYmoudmFsICs9IDEwIH07XG4gICAqICAgICBhc3NlcnQuY2hhbmdlc0J1dE5vdEJ5KGZuLCBvYmosICd2YWwnLCA1KTtcbiAgICpcbiAgICogQG5hbWUgY2hhbmdlc0J1dE5vdEJ5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNoYW5nZSBhbW91bnQgKGRlbHRhKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5jaGFuZ2VzQnV0Tm90QnkgPSBmdW5jdGlvbiAoZm4sIG9iaiwgcHJvcCwgZGVsdGEsIG1zZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0ICYmIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciB0bXBNc2cgPSBkZWx0YTtcbiAgICAgIGRlbHRhID0gcHJvcDtcbiAgICAgIG1zZyA9IHRtcE1zZztcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgIGRlbHRhID0gcHJvcDtcbiAgICAgIHByb3AgPSBudWxsO1xuICAgIH1cblxuICAgIG5ldyBBc3NlcnRpb24oZm4sIG1zZywgYXNzZXJ0LmNoYW5nZXNCdXROb3RCeSwgdHJ1ZSlcbiAgICAgIC50by5jaGFuZ2Uob2JqLCBwcm9wKS5idXQubm90LmJ5KGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmluY3JlYXNlcyhmdW5jdGlvbiwgb2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBpbmNyZWFzZXMgYSBudW1lcmljIG9iamVjdCBwcm9wZXJ0eS5cbiAgICpcbiAgICogICAgIHZhciBvYmogPSB7IHZhbDogMTAgfTtcbiAgICogICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkgeyBvYmoudmFsID0gMTMgfTtcbiAgICogICAgIGFzc2VydC5pbmNyZWFzZXMoZm4sIG9iaiwgJ3ZhbCcpO1xuICAgKlxuICAgKiBAbmFtZSBpbmNyZWFzZXNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbW9kaWZpZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvciBnZXR0ZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5IG5hbWUgX29wdGlvbmFsX1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pbmNyZWFzZXMgPSBmdW5jdGlvbiAoZm4sIG9iaiwgcHJvcCwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbXNnID0gcHJvcDtcbiAgICAgIHByb3AgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQXNzZXJ0aW9uKGZuLCBtc2csIGFzc2VydC5pbmNyZWFzZXMsIHRydWUpXG4gICAgICAudG8uaW5jcmVhc2Uob2JqLCBwcm9wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmluY3JlYXNlc0J5KGZ1bmN0aW9uLCBvYmplY3QsIHByb3BlcnR5LCBkZWx0YSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBpbmNyZWFzZXMgYSBudW1lcmljIG9iamVjdCBwcm9wZXJ0eSBvciBhIGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGJ5IGFuIGFtb3VudCAoZGVsdGEpLlxuICAgKlxuICAgKiAgICAgdmFyIG9iaiA9IHsgdmFsOiAxMCB9O1xuICAgKiAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7IG9iai52YWwgKz0gMTAgfTtcbiAgICogICAgIGFzc2VydC5pbmNyZWFzZXNCeShmbiwgb2JqLCAndmFsJywgMTApO1xuICAgKlxuICAgKiBAbmFtZSBpbmNyZWFzZXNCeVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtb2RpZmllciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9yIGdldHRlciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgbmFtZSBfb3B0aW9uYWxfXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjaGFuZ2UgYW1vdW50IChkZWx0YSlcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaW5jcmVhc2VzQnkgPSBmdW5jdGlvbiAoZm4sIG9iaiwgcHJvcCwgZGVsdGEsIG1zZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0ICYmIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZhciB0bXBNc2cgPSBkZWx0YTtcbiAgICAgIGRlbHRhID0gcHJvcDtcbiAgICAgIG1zZyA9IHRtcE1zZztcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICAgIGRlbHRhID0gcHJvcDtcbiAgICAgIHByb3AgPSBudWxsO1xuICAgIH1cblxuICAgIG5ldyBBc3NlcnRpb24oZm4sIG1zZywgYXNzZXJ0LmluY3JlYXNlc0J5LCB0cnVlKVxuICAgICAgLnRvLmluY3JlYXNlKG9iaiwgcHJvcCkuYnkoZGVsdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuZG9lc05vdEluY3JlYXNlKGZ1bmN0aW9uLCBvYmplY3QsIHByb3BlcnR5LCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBhIGZ1bmN0aW9uIGRvZXMgbm90IGluY3JlYXNlIGEgbnVtZXJpYyBvYmplY3QgcHJvcGVydHkuXG4gICAqXG4gICAqICAgICB2YXIgb2JqID0geyB2YWw6IDEwIH07XG4gICAqICAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHsgb2JqLnZhbCA9IDggfTtcbiAgICogICAgIGFzc2VydC5kb2VzTm90SW5jcmVhc2UoZm4sIG9iaiwgJ3ZhbCcpO1xuICAgKlxuICAgKiBAbmFtZSBkb2VzTm90SW5jcmVhc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbW9kaWZpZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBvciBnZXR0ZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5IG5hbWUgX29wdGlvbmFsX1xuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kb2VzTm90SW5jcmVhc2UgPSBmdW5jdGlvbiAoZm4sIG9iaiwgcHJvcCwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbXNnID0gcHJvcDtcbiAgICAgIHByb3AgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQXNzZXJ0aW9uKGZuLCBtc2csIGFzc2VydC5kb2VzTm90SW5jcmVhc2UsIHRydWUpXG4gICAgICAudG8ubm90LmluY3JlYXNlKG9iaiwgcHJvcCk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5pbmNyZWFzZXNCdXROb3RCeShmdW5jdGlvbiwgb2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBkb2VzIG5vdCBpbmNyZWFzZSBhIG51bWVyaWMgb2JqZWN0IHByb3BlcnR5IG9yIGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGJ5IGFuIGFtb3VudCAoZGVsdGEpLlxuICAgKlxuICAgKiAgICAgdmFyIG9iaiA9IHsgdmFsOiAxMCB9O1xuICAgKiAgICAgdmFyIGZuID0gZnVuY3Rpb24oKSB7IG9iai52YWwgPSAxNSB9O1xuICAgKiAgICAgYXNzZXJ0LmluY3JlYXNlc0J1dE5vdEJ5KGZuLCBvYmosICd2YWwnLCAxMCk7XG4gICAqXG4gICAqIEBuYW1lIGluY3JlYXNlc0J1dE5vdEJ5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNoYW5nZSBhbW91bnQgKGRlbHRhKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5pbmNyZWFzZXNCdXROb3RCeSA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBkZWx0YSwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIHRtcE1zZyA9IGRlbHRhO1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgbXNnID0gdG1wTXNnO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuaW5jcmVhc2VzQnV0Tm90QnksIHRydWUpXG4gICAgICAudG8uaW5jcmVhc2Uob2JqLCBwcm9wKS5idXQubm90LmJ5KGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmRlY3JlYXNlcyhmdW5jdGlvbiwgb2JqZWN0LCBwcm9wZXJ0eSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBkZWNyZWFzZXMgYSBudW1lcmljIG9iamVjdCBwcm9wZXJ0eS5cbiAgICpcbiAgICogICAgIHZhciBvYmogPSB7IHZhbDogMTAgfTtcbiAgICogICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkgeyBvYmoudmFsID0gNSB9O1xuICAgKiAgICAgYXNzZXJ0LmRlY3JlYXNlcyhmbiwgb2JqLCAndmFsJyk7XG4gICAqXG4gICAqIEBuYW1lIGRlY3JlYXNlc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBtb2RpZmllciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IG9yIGdldHRlciBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHkgbmFtZSBfb3B0aW9uYWxfXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmRlY3JlYXNlcyA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBtc2cpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtc2cgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBBc3NlcnRpb24oZm4sIG1zZywgYXNzZXJ0LmRlY3JlYXNlcywgdHJ1ZSlcbiAgICAgIC50by5kZWNyZWFzZShvYmosIHByb3ApO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuZGVjcmVhc2VzQnkoZnVuY3Rpb24sIG9iamVjdCwgcHJvcGVydHksIGRlbHRhLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBhIGZ1bmN0aW9uIGRlY3JlYXNlcyBhIG51bWVyaWMgb2JqZWN0IHByb3BlcnR5IG9yIGEgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgYnkgYW4gYW1vdW50IChkZWx0YSlcbiAgICpcbiAgICogICAgIHZhciBvYmogPSB7IHZhbDogMTAgfTtcbiAgICogICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkgeyBvYmoudmFsIC09IDUgfTtcbiAgICogICAgIGFzc2VydC5kZWNyZWFzZXNCeShmbiwgb2JqLCAndmFsJywgNSk7XG4gICAqXG4gICAqIEBuYW1lIGRlY3JlYXNlc0J5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNoYW5nZSBhbW91bnQgKGRlbHRhKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kZWNyZWFzZXNCeSA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBkZWx0YSwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIHRtcE1zZyA9IGRlbHRhO1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgbXNnID0gdG1wTXNnO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuZGVjcmVhc2VzQnksIHRydWUpXG4gICAgICAudG8uZGVjcmVhc2Uob2JqLCBwcm9wKS5ieShkZWx0YSk7XG4gIH1cblxuICAvKipcbiAgICogIyMjIC5kb2VzTm90RGVjcmVhc2UoZnVuY3Rpb24sIG9iamVjdCwgcHJvcGVydHksIFttZXNzYWdlXSlcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGEgZnVuY3Rpb24gZG9lcyBub3QgZGVjcmVhc2VzIGEgbnVtZXJpYyBvYmplY3QgcHJvcGVydHkuXG4gICAqXG4gICAqICAgICB2YXIgb2JqID0geyB2YWw6IDEwIH07XG4gICAqICAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHsgb2JqLnZhbCA9IDE1IH07XG4gICAqICAgICBhc3NlcnQuZG9lc05vdERlY3JlYXNlKGZuLCBvYmosICd2YWwnKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdERlY3JlYXNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuZG9lc05vdERlY3JlYXNlID0gZnVuY3Rpb24gKGZuLCBvYmosIHByb3AsIG1zZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG1zZyA9IHByb3A7XG4gICAgICBwcm9wID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuZG9lc05vdERlY3JlYXNlLCB0cnVlKVxuICAgICAgLnRvLm5vdC5kZWNyZWFzZShvYmosIHByb3ApO1xuICB9XG5cbiAgLyoqXG4gICAqICMjIyAuZG9lc05vdERlY3JlYXNlQnkoZnVuY3Rpb24sIG9iamVjdCwgcHJvcGVydHksIGRlbHRhLCBbbWVzc2FnZV0pXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBhIGZ1bmN0aW9uIGRvZXMgbm90IGRlY3JlYXNlcyBhIG51bWVyaWMgb2JqZWN0IHByb3BlcnR5IG9yIGEgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgYnkgYW4gYW1vdW50IChkZWx0YSlcbiAgICpcbiAgICogICAgIHZhciBvYmogPSB7IHZhbDogMTAgfTtcbiAgICogICAgIHZhciBmbiA9IGZ1bmN0aW9uKCkgeyBvYmoudmFsID0gNSB9O1xuICAgKiAgICAgYXNzZXJ0LmRvZXNOb3REZWNyZWFzZUJ5KGZuLCBvYmosICd2YWwnLCAxKTtcbiAgICpcbiAgICogQG5hbWUgZG9lc05vdERlY3JlYXNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNoYW5nZSBhbW91bnQgKGRlbHRhKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kb2VzTm90RGVjcmVhc2VCeSA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBkZWx0YSwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIHRtcE1zZyA9IGRlbHRhO1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgbXNnID0gdG1wTXNnO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBBc3NlcnRpb24oZm4sIG1zZywgYXNzZXJ0LmRvZXNOb3REZWNyZWFzZUJ5LCB0cnVlKVxuICAgICAgLnRvLm5vdC5kZWNyZWFzZShvYmosIHByb3ApLmJ5KGRlbHRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAjIyMgLmRlY3JlYXNlc0J1dE5vdEJ5KGZ1bmN0aW9uLCBvYmplY3QsIHByb3BlcnR5LCBkZWx0YSwgW21lc3NhZ2VdKVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYSBmdW5jdGlvbiBkb2VzIG5vdCBkZWNyZWFzZXMgYSBudW1lcmljIG9iamVjdCBwcm9wZXJ0eSBvciBhIGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGJ5IGFuIGFtb3VudCAoZGVsdGEpXG4gICAqXG4gICAqICAgICB2YXIgb2JqID0geyB2YWw6IDEwIH07XG4gICAqICAgICB2YXIgZm4gPSBmdW5jdGlvbigpIHsgb2JqLnZhbCA9IDUgfTtcbiAgICogICAgIGFzc2VydC5kZWNyZWFzZXNCdXROb3RCeShmbiwgb2JqLCAndmFsJywgMSk7XG4gICAqXG4gICAqIEBuYW1lIGRlY3JlYXNlc0J1dE5vdEJ5XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG1vZGlmaWVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3Qgb3IgZ2V0dGVyIGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBuYW1lIF9vcHRpb25hbF9cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNoYW5nZSBhbW91bnQgKGRlbHRhKVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSBfb3B0aW9uYWxfXG4gICAqIEBuYW1lc3BhY2UgQXNzZXJ0XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGFzc2VydC5kZWNyZWFzZXNCdXROb3RCeSA9IGZ1bmN0aW9uIChmbiwgb2JqLCBwcm9wLCBkZWx0YSwgbXNnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDQgJiYgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIHRtcE1zZyA9IGRlbHRhO1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgbXNnID0gdG1wTXNnO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgZGVsdGEgPSBwcm9wO1xuICAgICAgcHJvcCA9IG51bGw7XG4gICAgfVxuXG4gICAgbmV3IEFzc2VydGlvbihmbiwgbXNnLCBhc3NlcnQuZGVjcmVhc2VzQnV0Tm90QnksIHRydWUpXG4gICAgICAudG8uZGVjcmVhc2Uob2JqLCBwcm9wKS5idXQubm90LmJ5KGRlbHRhKTtcbiAgfVxuXG4gIC8qIVxuICAgKiAjIyMgLmlmRXJyb3Iob2JqZWN0KVxuICAgKlxuICAgKiBBc3NlcnRzIGlmIHZhbHVlIGlzIG5vdCBhIGZhbHNlIHZhbHVlLCBhbmQgdGhyb3dzIGlmIGl0IGlzIGEgdHJ1ZSB2YWx1ZS5cbiAgICogVGhpcyBpcyBhZGRlZCB0byBhbGxvdyBmb3IgY2hhaSB0byBiZSBhIGRyb3AtaW4gcmVwbGFjZW1lbnQgZm9yIE5vZGUnc1xuICAgKiBhc3NlcnQgY2xhc3MuXG4gICAqXG4gICAqICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdJIGFtIGEgY3VzdG9tIGVycm9yJyk7XG4gICAqICAgICBhc3NlcnQuaWZFcnJvcihlcnIpOyAvLyBSZXRocm93cyBlcnIhXG4gICAqXG4gICAqIEBuYW1lIGlmRXJyb3JcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAodmFsKSB7XG4gICAgICB0aHJvdyh2YWwpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc0V4dGVuc2libGUob2JqZWN0KVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaXMgZXh0ZW5zaWJsZSAoY2FuIGhhdmUgbmV3IHByb3BlcnRpZXMgYWRkZWQgdG8gaXQpLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzRXh0ZW5zaWJsZSh7fSk7XG4gICAqXG4gICAqIEBuYW1lIGlzRXh0ZW5zaWJsZVxuICAgKiBAYWxpYXMgZXh0ZW5zaWJsZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRXh0ZW5zaWJsZSA9IGZ1bmN0aW9uIChvYmosIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24ob2JqLCBtc2csIGFzc2VydC5pc0V4dGVuc2libGUsIHRydWUpLnRvLmJlLmV4dGVuc2libGU7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3RFeHRlbnNpYmxlKG9iamVjdClcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IGBvYmplY3RgIGlzIF9ub3RfIGV4dGVuc2libGUuXG4gICAqXG4gICAqICAgICB2YXIgbm9uRXh0ZW5zaWJsZU9iamVjdCA9IE9iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucyh7fSk7XG4gICAqICAgICB2YXIgc2VhbGVkT2JqZWN0ID0gT2JqZWN0LnNlYWwoe30pO1xuICAgKiAgICAgdmFyIGZyb3plbk9iamVjdCA9IE9iamVjdC5mcmVlemUoe30pO1xuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzTm90RXh0ZW5zaWJsZShub25FeHRlbnNpYmxlT2JqZWN0KTtcbiAgICogICAgIGFzc2VydC5pc05vdEV4dGVuc2libGUoc2VhbGVkT2JqZWN0KTtcbiAgICogICAgIGFzc2VydC5pc05vdEV4dGVuc2libGUoZnJvemVuT2JqZWN0KTtcbiAgICpcbiAgICogQG5hbWUgaXNOb3RFeHRlbnNpYmxlXG4gICAqIEBhbGlhcyBub3RFeHRlbnNpYmxlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3RFeHRlbnNpYmxlID0gZnVuY3Rpb24gKG9iaiwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmlzTm90RXh0ZW5zaWJsZSwgdHJ1ZSkudG8ubm90LmJlLmV4dGVuc2libGU7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNTZWFsZWQob2JqZWN0KVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaXMgc2VhbGVkIChjYW5ub3QgaGF2ZSBuZXcgcHJvcGVydGllcyBhZGRlZCB0byBpdFxuICAgKiBhbmQgaXRzIGV4aXN0aW5nIHByb3BlcnRpZXMgY2Fubm90IGJlIHJlbW92ZWQpLlxuICAgKlxuICAgKiAgICAgdmFyIHNlYWxlZE9iamVjdCA9IE9iamVjdC5zZWFsKHt9KTtcbiAgICogICAgIHZhciBmcm96ZW5PYmplY3QgPSBPYmplY3Quc2VhbCh7fSk7XG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNTZWFsZWQoc2VhbGVkT2JqZWN0KTtcbiAgICogICAgIGFzc2VydC5pc1NlYWxlZChmcm96ZW5PYmplY3QpO1xuICAgKlxuICAgKiBAbmFtZSBpc1NlYWxlZFxuICAgKiBAYWxpYXMgc2VhbGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNTZWFsZWQgPSBmdW5jdGlvbiAob2JqLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuaXNTZWFsZWQsIHRydWUpLnRvLmJlLnNlYWxlZDtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdFNlYWxlZChvYmplY3QpXG4gICAqXG4gICAqIEFzc2VydHMgdGhhdCBgb2JqZWN0YCBpcyBfbm90XyBzZWFsZWQuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNOb3RTZWFsZWQoe30pO1xuICAgKlxuICAgKiBAbmFtZSBpc05vdFNlYWxlZFxuICAgKiBAYWxpYXMgbm90U2VhbGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3RTZWFsZWQgPSBmdW5jdGlvbiAob2JqLCBtc2cpIHtcbiAgICBuZXcgQXNzZXJ0aW9uKG9iaiwgbXNnLCBhc3NlcnQuaXNOb3RTZWFsZWQsIHRydWUpLnRvLm5vdC5iZS5zZWFsZWQ7XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNGcm96ZW4ob2JqZWN0KVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaXMgZnJvemVuIChjYW5ub3QgaGF2ZSBuZXcgcHJvcGVydGllcyBhZGRlZCB0byBpdFxuICAgKiBhbmQgaXRzIGV4aXN0aW5nIHByb3BlcnRpZXMgY2Fubm90IGJlIG1vZGlmaWVkKS5cbiAgICpcbiAgICogICAgIHZhciBmcm96ZW5PYmplY3QgPSBPYmplY3QuZnJlZXplKHt9KTtcbiAgICogICAgIGFzc2VydC5mcm96ZW4oZnJvemVuT2JqZWN0KTtcbiAgICpcbiAgICogQG5hbWUgaXNGcm96ZW5cbiAgICogQGFsaWFzIGZyb3plblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRnJvemVuID0gZnVuY3Rpb24gKG9iaiwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmlzRnJvemVuLCB0cnVlKS50by5iZS5mcm96ZW47XG4gIH07XG5cbiAgLyoqXG4gICAqICMjIyAuaXNOb3RGcm96ZW4ob2JqZWN0KVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgYG9iamVjdGAgaXMgX25vdF8gZnJvemVuLlxuICAgKlxuICAgKiAgICAgYXNzZXJ0LmlzTm90RnJvemVuKHt9KTtcbiAgICpcbiAgICogQG5hbWUgaXNOb3RGcm96ZW5cbiAgICogQGFsaWFzIG5vdEZyb3plblxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzTm90RnJvemVuID0gZnVuY3Rpb24gKG9iaiwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbihvYmosIG1zZywgYXNzZXJ0LmlzTm90RnJvemVuLCB0cnVlKS50by5ub3QuYmUuZnJvemVuO1xuICB9O1xuXG4gIC8qKlxuICAgKiAjIyMgLmlzRW1wdHkodGFyZ2V0KVxuICAgKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIHRhcmdldCBkb2VzIG5vdCBjb250YWluIGFueSB2YWx1ZXMuXG4gICAqIEZvciBhcnJheXMgYW5kIHN0cmluZ3MsIGl0IGNoZWNrcyB0aGUgYGxlbmd0aGAgcHJvcGVydHkuXG4gICAqIEZvciBgTWFwYCBhbmQgYFNldGAgaW5zdGFuY2VzLCBpdCBjaGVja3MgdGhlIGBzaXplYCBwcm9wZXJ0eS5cbiAgICogRm9yIG5vbi1mdW5jdGlvbiBvYmplY3RzLCBpdCBnZXRzIHRoZSBjb3VudCBvZiBvd25cbiAgICogZW51bWVyYWJsZSBzdHJpbmcga2V5cy5cbiAgICpcbiAgICogICAgIGFzc2VydC5pc0VtcHR5KFtdKTtcbiAgICogICAgIGFzc2VydC5pc0VtcHR5KCcnKTtcbiAgICogICAgIGFzc2VydC5pc0VtcHR5KG5ldyBNYXApO1xuICAgKiAgICAgYXNzZXJ0LmlzRW1wdHkoe30pO1xuICAgKlxuICAgKiBAbmFtZSBpc0VtcHR5XG4gICAqIEBhbGlhcyBlbXB0eVxuICAgKiBAcGFyYW0ge09iamVjdHxBcnJheXxTdHJpbmd8TWFwfFNldH0gdGFyZ2V0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIF9vcHRpb25hbF9cbiAgICogQG5hbWVzcGFjZSBBc3NlcnRcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgYXNzZXJ0LmlzRW1wdHkgPSBmdW5jdGlvbih2YWwsIG1zZykge1xuICAgIG5ldyBBc3NlcnRpb24odmFsLCBtc2csIGFzc2VydC5pc0VtcHR5LCB0cnVlKS50by5iZS5lbXB0eTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5pc05vdEVtcHR5KHRhcmdldClcbiAgICpcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgY29udGFpbnMgdmFsdWVzLlxuICAgKiBGb3IgYXJyYXlzIGFuZCBzdHJpbmdzLCBpdCBjaGVja3MgdGhlIGBsZW5ndGhgIHByb3BlcnR5LlxuICAgKiBGb3IgYE1hcGAgYW5kIGBTZXRgIGluc3RhbmNlcywgaXQgY2hlY2tzIHRoZSBgc2l6ZWAgcHJvcGVydHkuXG4gICAqIEZvciBub24tZnVuY3Rpb24gb2JqZWN0cywgaXQgZ2V0cyB0aGUgY291bnQgb2Ygb3duXG4gICAqIGVudW1lcmFibGUgc3RyaW5nIGtleXMuXG4gICAqXG4gICAqICAgICBhc3NlcnQuaXNOb3RFbXB0eShbMSwgMl0pO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90RW1wdHkoJzM0Jyk7XG4gICAqICAgICBhc3NlcnQuaXNOb3RFbXB0eShuZXcgU2V0KFs1LCA2XSkpO1xuICAgKiAgICAgYXNzZXJ0LmlzTm90RW1wdHkoeyBrZXk6IDcgfSk7XG4gICAqXG4gICAqIEBuYW1lIGlzTm90RW1wdHlcbiAgICogQGFsaWFzIG5vdEVtcHR5XG4gICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fFN0cmluZ3xNYXB8U2V0fSB0YXJnZXRcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgX29wdGlvbmFsX1xuICAgKiBAbmFtZXNwYWNlIEFzc2VydFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBhc3NlcnQuaXNOb3RFbXB0eSA9IGZ1bmN0aW9uKHZhbCwgbXNnKSB7XG4gICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZywgYXNzZXJ0LmlzTm90RW1wdHksIHRydWUpLnRvLm5vdC5iZS5lbXB0eTtcbiAgfTtcblxuICAvKiFcbiAgICogQWxpYXNlcy5cbiAgICovXG5cbiAgKGZ1bmN0aW9uIGFsaWFzKG5hbWUsIGFzKXtcbiAgICBhc3NlcnRbYXNdID0gYXNzZXJ0W25hbWVdO1xuICAgIHJldHVybiBhbGlhcztcbiAgfSlcbiAgKCdpc09rJywgJ29rJylcbiAgKCdpc05vdE9rJywgJ25vdE9rJylcbiAgKCd0aHJvd3MnLCAndGhyb3cnKVxuICAoJ3Rocm93cycsICdUaHJvdycpXG4gICgnaXNFeHRlbnNpYmxlJywgJ2V4dGVuc2libGUnKVxuICAoJ2lzTm90RXh0ZW5zaWJsZScsICdub3RFeHRlbnNpYmxlJylcbiAgKCdpc1NlYWxlZCcsICdzZWFsZWQnKVxuICAoJ2lzTm90U2VhbGVkJywgJ25vdFNlYWxlZCcpXG4gICgnaXNGcm96ZW4nLCAnZnJvemVuJylcbiAgKCdpc05vdEZyb3plbicsICdub3RGcm96ZW4nKVxuICAoJ2lzRW1wdHknLCAnZW1wdHknKVxuICAoJ2lzTm90RW1wdHknLCAnbm90RW1wdHknKTtcbn07XG4iLCIvKiFcbiAqIGNoYWlcbiAqIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjaGFpLCB1dGlsKSB7XG4gIGNoYWkuZXhwZWN0ID0gZnVuY3Rpb24gKHZhbCwgbWVzc2FnZSkge1xuICAgIHJldHVybiBuZXcgY2hhaS5Bc3NlcnRpb24odmFsLCBtZXNzYWdlKTtcbiAgfTtcblxuICAvKipcbiAgICogIyMjIC5mYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIFttZXNzYWdlXSwgW29wZXJhdG9yXSlcbiAgICpcbiAgICogVGhyb3cgYSBmYWlsdXJlLlxuICAgKlxuICAgKiBAbmFtZSBmYWlsXG4gICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgKiBAcGFyYW0ge01peGVkfSBleHBlY3RlZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3BlcmF0b3JcbiAgICogQG5hbWVzcGFjZSBCRERcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgY2hhaS5leHBlY3QuZmFpbCA9IGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvcikge1xuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8ICdleHBlY3QuZmFpbCgpJztcbiAgICB0aHJvdyBuZXcgY2hhaS5Bc3NlcnRpb25FcnJvcihtZXNzYWdlLCB7XG4gICAgICAgIGFjdHVhbDogYWN0dWFsXG4gICAgICAsIGV4cGVjdGVkOiBleHBlY3RlZFxuICAgICAgLCBvcGVyYXRvcjogb3BlcmF0b3JcbiAgICB9LCBjaGFpLmV4cGVjdC5mYWlsKTtcbiAgfTtcbn07XG4iLCIvKiFcbiAqIGNoYWlcbiAqIENvcHlyaWdodChjKSAyMDExLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjaGFpLCB1dGlsKSB7XG4gIHZhciBBc3NlcnRpb24gPSBjaGFpLkFzc2VydGlvbjtcblxuICBmdW5jdGlvbiBsb2FkU2hvdWxkICgpIHtcbiAgICAvLyBleHBsaWNpdGx5IGRlZmluZSB0aGlzIG1ldGhvZCBhcyBmdW5jdGlvbiBhcyB0byBoYXZlIGl0J3MgbmFtZSB0byBpbmNsdWRlIGFzIGBzc2ZpYFxuICAgIGZ1bmN0aW9uIHNob3VsZEdldHRlcigpIHtcbiAgICAgIGlmICh0aGlzIGluc3RhbmNlb2YgU3RyaW5nXG4gICAgICAgICAgfHwgdGhpcyBpbnN0YW5jZW9mIE51bWJlclxuICAgICAgICAgIHx8IHRoaXMgaW5zdGFuY2VvZiBCb29sZWFuXG4gICAgICAgICAgfHwgdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGlzIGluc3RhbmNlb2YgU3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBuZXcgQXNzZXJ0aW9uKHRoaXMudmFsdWVPZigpLCBudWxsLCBzaG91bGRHZXR0ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBBc3NlcnRpb24odGhpcywgbnVsbCwgc2hvdWxkR2V0dGVyKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2hvdWxkU2V0dGVyKHZhbHVlKSB7XG4gICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2NoYWlqcy9jaGFpL2lzc3Vlcy84NjogdGhpcyBtYWtlc1xuICAgICAgLy8gYHdoYXRldmVyLnNob3VsZCA9IHNvbWVWYWx1ZWAgYWN0dWFsbHkgc2V0IGBzb21lVmFsdWVgLCB3aGljaCBpc1xuICAgICAgLy8gZXNwZWNpYWxseSB1c2VmdWwgZm9yIGBnbG9iYWwuc2hvdWxkID0gcmVxdWlyZSgnY2hhaScpLnNob3VsZCgpYC5cbiAgICAgIC8vXG4gICAgICAvLyBOb3RlIHRoYXQgd2UgaGF2ZSB0byB1c2UgW1tEZWZpbmVQcm9wZXJ0eV1dIGluc3RlYWQgb2YgW1tQdXRdXVxuICAgICAgLy8gc2luY2Ugb3RoZXJ3aXNlIHdlIHdvdWxkIHRyaWdnZXIgdGhpcyB2ZXJ5IHNldHRlciFcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnc2hvdWxkJywge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBtb2RpZnkgT2JqZWN0LnByb3RvdHlwZSB0byBoYXZlIGBzaG91bGRgXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdzaG91bGQnLCB7XG4gICAgICBzZXQ6IHNob3VsZFNldHRlclxuICAgICAgLCBnZXQ6IHNob3VsZEdldHRlclxuICAgICAgLCBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcblxuICAgIHZhciBzaG91bGQgPSB7fTtcblxuICAgIC8qKlxuICAgICAqICMjIyAuZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBbbWVzc2FnZV0sIFtvcGVyYXRvcl0pXG4gICAgICpcbiAgICAgKiBUaHJvdyBhIGZhaWx1cmUuXG4gICAgICpcbiAgICAgKiBAbmFtZSBmYWlsXG4gICAgICogQHBhcmFtIHtNaXhlZH0gYWN0dWFsXG4gICAgICogQHBhcmFtIHtNaXhlZH0gZXhwZWN0ZWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcGVyYXRvclxuICAgICAqIEBuYW1lc3BhY2UgQkREXG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cblxuICAgIHNob3VsZC5mYWlsID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yKSB7XG4gICAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCAnc2hvdWxkLmZhaWwoKSc7XG4gICAgICB0aHJvdyBuZXcgY2hhaS5Bc3NlcnRpb25FcnJvcihtZXNzYWdlLCB7XG4gICAgICAgICAgYWN0dWFsOiBhY3R1YWxcbiAgICAgICAgLCBleHBlY3RlZDogZXhwZWN0ZWRcbiAgICAgICAgLCBvcGVyYXRvcjogb3BlcmF0b3JcbiAgICAgIH0sIHNob3VsZC5mYWlsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIyMjIC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBbbWVzc2FnZV0pXG4gICAgICpcbiAgICAgKiBBc3NlcnRzIG5vbi1zdHJpY3QgZXF1YWxpdHkgKGA9PWApIG9mIGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgLlxuICAgICAqXG4gICAgICogICAgIHNob3VsZC5lcXVhbCgzLCAnMycsICc9PSBjb2VyY2VzIHZhbHVlcyB0byBzdHJpbmdzJyk7XG4gICAgICpcbiAgICAgKiBAbmFtZSBlcXVhbFxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICAgKiBAbmFtZXNwYWNlIFNob3VsZFxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG5cbiAgICBzaG91bGQuZXF1YWwgPSBmdW5jdGlvbiAodmFsMSwgdmFsMiwgbXNnKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKHZhbDEsIG1zZykudG8uZXF1YWwodmFsMik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqICMjIyAudGhyb3coZnVuY3Rpb24sIFtjb25zdHJ1Y3Rvci9zdHJpbmcvcmVnZXhwXSwgW3N0cmluZy9yZWdleHBdLCBbbWVzc2FnZV0pXG4gICAgICpcbiAgICAgKiBBc3NlcnRzIHRoYXQgYGZ1bmN0aW9uYCB3aWxsIHRocm93IGFuIGVycm9yIHRoYXQgaXMgYW4gaW5zdGFuY2Ugb2ZcbiAgICAgKiBgY29uc3RydWN0b3JgLCBvciBhbHRlcm5hdGVseSB0aGF0IGl0IHdpbGwgdGhyb3cgYW4gZXJyb3Igd2l0aCBtZXNzYWdlXG4gICAgICogbWF0Y2hpbmcgYHJlZ2V4cGAuXG4gICAgICpcbiAgICAgKiAgICAgc2hvdWxkLnRocm93KGZuLCAnZnVuY3Rpb24gdGhyb3dzIGEgcmVmZXJlbmNlIGVycm9yJyk7XG4gICAgICogICAgIHNob3VsZC50aHJvdyhmbiwgL2Z1bmN0aW9uIHRocm93cyBhIHJlZmVyZW5jZSBlcnJvci8pO1xuICAgICAqICAgICBzaG91bGQudGhyb3coZm4sIFJlZmVyZW5jZUVycm9yKTtcbiAgICAgKiAgICAgc2hvdWxkLnRocm93KGZuLCBSZWZlcmVuY2VFcnJvciwgJ2Z1bmN0aW9uIHRocm93cyBhIHJlZmVyZW5jZSBlcnJvcicpO1xuICAgICAqICAgICBzaG91bGQudGhyb3coZm4sIFJlZmVyZW5jZUVycm9yLCAvZnVuY3Rpb24gdGhyb3dzIGEgcmVmZXJlbmNlIGVycm9yLyk7XG4gICAgICpcbiAgICAgKiBAbmFtZSB0aHJvd1xuICAgICAqIEBhbGlhcyBUaHJvd1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtFcnJvckNvbnN0cnVjdG9yfSBjb25zdHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSByZWdleHBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRXJyb3IjRXJyb3JfdHlwZXNcbiAgICAgKiBAbmFtZXNwYWNlIFNob3VsZFxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG5cbiAgICBzaG91bGQuVGhyb3cgPSBmdW5jdGlvbiAoZm4sIGVycnQsIGVycnMsIG1zZykge1xuICAgICAgbmV3IEFzc2VydGlvbihmbiwgbXNnKS50by5UaHJvdyhlcnJ0LCBlcnJzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIyMjIC5leGlzdFxuICAgICAqXG4gICAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgbmVpdGhlciBgbnVsbGAgbm9yIGB1bmRlZmluZWRgLlxuICAgICAqXG4gICAgICogICAgIHZhciBmb28gPSAnaGknO1xuICAgICAqXG4gICAgICogICAgIHNob3VsZC5leGlzdChmb28sICdmb28gZXhpc3RzJyk7XG4gICAgICpcbiAgICAgKiBAbmFtZSBleGlzdFxuICAgICAqIEBuYW1lc3BhY2UgU2hvdWxkXG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cblxuICAgIHNob3VsZC5leGlzdCA9IGZ1bmN0aW9uICh2YWwsIG1zZykge1xuICAgICAgbmV3IEFzc2VydGlvbih2YWwsIG1zZykudG8uZXhpc3Q7XG4gICAgfVxuXG4gICAgLy8gbmVnYXRpb25cbiAgICBzaG91bGQubm90ID0ge31cblxuICAgIC8qKlxuICAgICAqICMjIyAubm90LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIFttZXNzYWdlXSlcbiAgICAgKlxuICAgICAqIEFzc2VydHMgbm9uLXN0cmljdCBpbmVxdWFsaXR5IChgIT1gKSBvZiBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYC5cbiAgICAgKlxuICAgICAqICAgICBzaG91bGQubm90LmVxdWFsKDMsIDQsICd0aGVzZSBudW1iZXJzIGFyZSBub3QgZXF1YWwnKTtcbiAgICAgKlxuICAgICAqIEBuYW1lIG5vdC5lcXVhbFxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGFjdHVhbFxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGV4cGVjdGVkXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAgICAgKiBAbmFtZXNwYWNlIFNob3VsZFxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG5cbiAgICBzaG91bGQubm90LmVxdWFsID0gZnVuY3Rpb24gKHZhbDEsIHZhbDIsIG1zZykge1xuICAgICAgbmV3IEFzc2VydGlvbih2YWwxLCBtc2cpLnRvLm5vdC5lcXVhbCh2YWwyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIyMjIC50aHJvdyhmdW5jdGlvbiwgW2NvbnN0cnVjdG9yL3JlZ2V4cF0sIFttZXNzYWdlXSlcbiAgICAgKlxuICAgICAqIEFzc2VydHMgdGhhdCBgZnVuY3Rpb25gIHdpbGwgX25vdF8gdGhyb3cgYW4gZXJyb3IgdGhhdCBpcyBhbiBpbnN0YW5jZSBvZlxuICAgICAqIGBjb25zdHJ1Y3RvcmAsIG9yIGFsdGVybmF0ZWx5IHRoYXQgaXQgd2lsbCBub3QgdGhyb3cgYW4gZXJyb3Igd2l0aCBtZXNzYWdlXG4gICAgICogbWF0Y2hpbmcgYHJlZ2V4cGAuXG4gICAgICpcbiAgICAgKiAgICAgc2hvdWxkLm5vdC50aHJvdyhmbiwgRXJyb3IsICdmdW5jdGlvbiBkb2VzIG5vdCB0aHJvdycpO1xuICAgICAqXG4gICAgICogQG5hbWUgbm90LnRocm93XG4gICAgICogQGFsaWFzIG5vdC5UaHJvd1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtFcnJvckNvbnN0cnVjdG9yfSBjb25zdHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSByZWdleHBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRXJyb3IjRXJyb3JfdHlwZXNcbiAgICAgKiBAbmFtZXNwYWNlIFNob3VsZFxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG5cbiAgICBzaG91bGQubm90LlRocm93ID0gZnVuY3Rpb24gKGZuLCBlcnJ0LCBlcnJzLCBtc2cpIHtcbiAgICAgIG5ldyBBc3NlcnRpb24oZm4sIG1zZykudG8ubm90LlRocm93KGVycnQsIGVycnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAjIyMgLm5vdC5leGlzdFxuICAgICAqXG4gICAgICogQXNzZXJ0cyB0aGF0IHRoZSB0YXJnZXQgaXMgbmVpdGhlciBgbnVsbGAgbm9yIGB1bmRlZmluZWRgLlxuICAgICAqXG4gICAgICogICAgIHZhciBiYXIgPSBudWxsO1xuICAgICAqXG4gICAgICogICAgIHNob3VsZC5ub3QuZXhpc3QoYmFyLCAnYmFyIGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICpcbiAgICAgKiBAbmFtZSBub3QuZXhpc3RcbiAgICAgKiBAbmFtZXNwYWNlIFNob3VsZFxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG5cbiAgICBzaG91bGQubm90LmV4aXN0ID0gZnVuY3Rpb24gKHZhbCwgbXNnKSB7XG4gICAgICBuZXcgQXNzZXJ0aW9uKHZhbCwgbXNnKS50by5ub3QuZXhpc3Q7XG4gICAgfVxuXG4gICAgc2hvdWxkWyd0aHJvdyddID0gc2hvdWxkWydUaHJvdyddO1xuICAgIHNob3VsZC5ub3RbJ3Rocm93J10gPSBzaG91bGQubm90WydUaHJvdyddO1xuXG4gICAgcmV0dXJuIHNob3VsZDtcbiAgfTtcblxuICBjaGFpLnNob3VsZCA9IGxvYWRTaG91bGQ7XG4gIGNoYWkuU2hvdWxkID0gbG9hZFNob3VsZDtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBhZGRDaGFpbmluZ01ldGhvZCB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyohXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzXG4gKi9cblxudmFyIGFkZExlbmd0aEd1YXJkID0gcmVxdWlyZSgnLi9hZGRMZW5ndGhHdWFyZCcpO1xudmFyIGNoYWkgPSByZXF1aXJlKCcuLi8uLi9jaGFpJyk7XG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xudmFyIHByb3hpZnkgPSByZXF1aXJlKCcuL3Byb3hpZnknKTtcbnZhciB0cmFuc2ZlckZsYWdzID0gcmVxdWlyZSgnLi90cmFuc2ZlckZsYWdzJyk7XG5cbi8qIVxuICogTW9kdWxlIHZhcmlhYmxlc1xuICovXG5cbi8vIENoZWNrIHdoZXRoZXIgYE9iamVjdC5zZXRQcm90b3R5cGVPZmAgaXMgc3VwcG9ydGVkXG52YXIgY2FuU2V0UHJvdG90eXBlID0gdHlwZW9mIE9iamVjdC5zZXRQcm90b3R5cGVPZiA9PT0gJ2Z1bmN0aW9uJztcblxuLy8gV2l0aG91dCBgT2JqZWN0LnNldFByb3RvdHlwZU9mYCBzdXBwb3J0LCB0aGlzIG1vZHVsZSB3aWxsIG5lZWQgdG8gYWRkIHByb3BlcnRpZXMgdG8gYSBmdW5jdGlvbi5cbi8vIEhvd2V2ZXIsIHNvbWUgb2YgZnVuY3Rpb25zJyBvd24gcHJvcHMgYXJlIG5vdCBjb25maWd1cmFibGUgYW5kIHNob3VsZCBiZSBza2lwcGVkLlxudmFyIHRlc3RGbiA9IGZ1bmN0aW9uKCkge307XG52YXIgZXhjbHVkZU5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdEZuKS5maWx0ZXIoZnVuY3Rpb24obmFtZSkge1xuICB2YXIgcHJvcERlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRlc3RGbiwgbmFtZSk7XG5cbiAgLy8gTm90ZTogUGhhbnRvbUpTIDEueCBpbmNsdWRlcyBgY2FsbGVlYCBhcyBvbmUgb2YgYHRlc3RGbmAncyBvd24gcHJvcGVydGllcyxcbiAgLy8gYnV0IHRoZW4gcmV0dXJucyBgdW5kZWZpbmVkYCBhcyB0aGUgcHJvcGVydHkgZGVzY3JpcHRvciBmb3IgYGNhbGxlZWAuIEFzIGFcbiAgLy8gd29ya2Fyb3VuZCwgd2UgcGVyZm9ybSBhbiBvdGhlcndpc2UgdW5uZWNlc3NhcnkgdHlwZS1jaGVjayBmb3IgYHByb3BEZXNjYCxcbiAgLy8gYW5kIHRoZW4gZmlsdGVyIGl0IG91dCBpZiBpdCdzIG5vdCBhbiBvYmplY3QgYXMgaXQgc2hvdWxkIGJlLlxuICBpZiAodHlwZW9mIHByb3BEZXNjICE9PSAnb2JqZWN0JylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gIXByb3BEZXNjLmNvbmZpZ3VyYWJsZTtcbn0pO1xuXG4vLyBDYWNoZSBgRnVuY3Rpb25gIHByb3BlcnRpZXNcbnZhciBjYWxsICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsLFxuICAgIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xuXG4vKipcbiAqICMjIyAuYWRkQ2hhaW5hYmxlTWV0aG9kKGN0eCwgbmFtZSwgbWV0aG9kLCBjaGFpbmluZ0JlaGF2aW9yKVxuICpcbiAqIEFkZHMgYSBtZXRob2QgdG8gYW4gb2JqZWN0LCBzdWNoIHRoYXQgdGhlIG1ldGhvZCBjYW4gYWxzbyBiZSBjaGFpbmVkLlxuICpcbiAqICAgICB1dGlscy5hZGRDaGFpbmFibGVNZXRob2QoY2hhaS5Bc3NlcnRpb24ucHJvdG90eXBlLCAnZm9vJywgZnVuY3Rpb24gKHN0cikge1xuICogICAgICAgdmFyIG9iaiA9IHV0aWxzLmZsYWcodGhpcywgJ29iamVjdCcpO1xuICogICAgICAgbmV3IGNoYWkuQXNzZXJ0aW9uKG9iaikudG8uYmUuZXF1YWwoc3RyKTtcbiAqICAgICB9KTtcbiAqXG4gKiBDYW4gYWxzbyBiZSBhY2Nlc3NlZCBkaXJlY3RseSBmcm9tIGBjaGFpLkFzc2VydGlvbmAuXG4gKlxuICogICAgIGNoYWkuQXNzZXJ0aW9uLmFkZENoYWluYWJsZU1ldGhvZCgnZm9vJywgZm4sIGNoYWluaW5nQmVoYXZpb3IpO1xuICpcbiAqIFRoZSByZXN1bHQgY2FuIHRoZW4gYmUgdXNlZCBhcyBib3RoIGEgbWV0aG9kIGFzc2VydGlvbiwgZXhlY3V0aW5nIGJvdGggYG1ldGhvZGAgYW5kXG4gKiBgY2hhaW5pbmdCZWhhdmlvcmAsIG9yIGFzIGEgbGFuZ3VhZ2UgY2hhaW4sIHdoaWNoIG9ubHkgZXhlY3V0ZXMgYGNoYWluaW5nQmVoYXZpb3JgLlxuICpcbiAqICAgICBleHBlY3QoZm9vU3RyKS50by5iZS5mb28oJ2JhcicpO1xuICogICAgIGV4cGVjdChmb29TdHIpLnRvLmJlLmZvby5lcXVhbCgnZm9vJyk7XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGN0eCBvYmplY3QgdG8gd2hpY2ggdGhlIG1ldGhvZCBpcyBhZGRlZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgb2YgbWV0aG9kIHRvIGFkZFxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kIGZ1bmN0aW9uIHRvIGJlIHVzZWQgZm9yIGBuYW1lYCwgd2hlbiBjYWxsZWRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoYWluaW5nQmVoYXZpb3IgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGV2ZXJ5IHRpbWUgdGhlIHByb3BlcnR5IGlzIGFjY2Vzc2VkXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBhZGRDaGFpbmFibGVNZXRob2RcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhZGRDaGFpbmFibGVNZXRob2QoY3R4LCBuYW1lLCBtZXRob2QsIGNoYWluaW5nQmVoYXZpb3IpIHtcbiAgaWYgKHR5cGVvZiBjaGFpbmluZ0JlaGF2aW9yICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgY2hhaW5pbmdCZWhhdmlvciA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgfVxuXG4gIHZhciBjaGFpbmFibGVCZWhhdmlvciA9IHtcbiAgICAgIG1ldGhvZDogbWV0aG9kXG4gICAgLCBjaGFpbmluZ0JlaGF2aW9yOiBjaGFpbmluZ0JlaGF2aW9yXG4gIH07XG5cbiAgLy8gc2F2ZSB0aGUgbWV0aG9kcyBzbyB3ZSBjYW4gb3ZlcndyaXRlIHRoZW0gbGF0ZXIsIGlmIHdlIG5lZWQgdG8uXG4gIGlmICghY3R4Ll9fbWV0aG9kcykge1xuICAgIGN0eC5fX21ldGhvZHMgPSB7fTtcbiAgfVxuICBjdHguX19tZXRob2RzW25hbWVdID0gY2hhaW5hYmxlQmVoYXZpb3I7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0eCwgbmFtZSxcbiAgICB7IGdldDogZnVuY3Rpb24gY2hhaW5hYmxlTWV0aG9kR2V0dGVyKCkge1xuICAgICAgICBjaGFpbmFibGVCZWhhdmlvci5jaGFpbmluZ0JlaGF2aW9yLmNhbGwodGhpcyk7XG5cbiAgICAgICAgdmFyIGNoYWluYWJsZU1ldGhvZFdyYXBwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gU2V0dGluZyB0aGUgYHNzZmlgIGZsYWcgdG8gYGNoYWluYWJsZU1ldGhvZFdyYXBwZXJgIGNhdXNlcyB0aGlzXG4gICAgICAgICAgLy8gZnVuY3Rpb24gdG8gYmUgdGhlIHN0YXJ0aW5nIHBvaW50IGZvciByZW1vdmluZyBpbXBsZW1lbnRhdGlvblxuICAgICAgICAgIC8vIGZyYW1lcyBmcm9tIHRoZSBzdGFjayB0cmFjZSBvZiBhIGZhaWxlZCBhc3NlcnRpb24uXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBIb3dldmVyLCB3ZSBvbmx5IHdhbnQgdG8gdXNlIHRoaXMgZnVuY3Rpb24gYXMgdGhlIHN0YXJ0aW5nIHBvaW50IGlmXG4gICAgICAgICAgLy8gdGhlIGBsb2NrU3NmaWAgZmxhZyBpc24ndCBzZXQuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBJZiB0aGUgYGxvY2tTc2ZpYCBmbGFnIGlzIHNldCwgdGhlbiB0aGlzIGFzc2VydGlvbiBpcyBiZWluZ1xuICAgICAgICAgIC8vIGludm9rZWQgZnJvbSBpbnNpZGUgb2YgYW5vdGhlciBhc3NlcnRpb24uIEluIHRoaXMgY2FzZSwgdGhlIGBzc2ZpYFxuICAgICAgICAgIC8vIGZsYWcgaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgdGhlIG91dGVyIGFzc2VydGlvbi5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIE5vdGUgdGhhdCBvdmVyd3JpdGluZyBhIGNoYWluYWJsZSBtZXRob2QgbWVyZWx5IHJlcGxhY2VzIHRoZSBzYXZlZFxuICAgICAgICAgIC8vIG1ldGhvZHMgaW4gYGN0eC5fX21ldGhvZHNgIGluc3RlYWQgb2YgY29tcGxldGVseSByZXBsYWNpbmcgdGhlXG4gICAgICAgICAgLy8gb3ZlcndyaXR0ZW4gYXNzZXJ0aW9uLiBUaGVyZWZvcmUsIGFuIG92ZXJ3cml0aW5nIGFzc2VydGlvbiB3b24ndFxuICAgICAgICAgIC8vIHNldCB0aGUgYHNzZmlgIG9yIGBsb2NrU3NmaWAgZmxhZ3MuXG4gICAgICAgICAgaWYgKCFmbGFnKHRoaXMsICdsb2NrU3NmaScpKSB7XG4gICAgICAgICAgICBmbGFnKHRoaXMsICdzc2ZpJywgY2hhaW5hYmxlTWV0aG9kV3JhcHBlcik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHJlc3VsdCA9IGNoYWluYWJsZUJlaGF2aW9yLm1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgbmV3QXNzZXJ0aW9uID0gbmV3IGNoYWkuQXNzZXJ0aW9uKCk7XG4gICAgICAgICAgdHJhbnNmZXJGbGFncyh0aGlzLCBuZXdBc3NlcnRpb24pO1xuICAgICAgICAgIHJldHVybiBuZXdBc3NlcnRpb247XG4gICAgICAgIH07XG5cbiAgICAgICAgYWRkTGVuZ3RoR3VhcmQoY2hhaW5hYmxlTWV0aG9kV3JhcHBlciwgbmFtZSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gVXNlIGBPYmplY3Quc2V0UHJvdG90eXBlT2ZgIGlmIGF2YWlsYWJsZVxuICAgICAgICBpZiAoY2FuU2V0UHJvdG90eXBlKSB7XG4gICAgICAgICAgLy8gSW5oZXJpdCBhbGwgcHJvcGVydGllcyBmcm9tIHRoZSBvYmplY3QgYnkgcmVwbGFjaW5nIHRoZSBgRnVuY3Rpb25gIHByb3RvdHlwZVxuICAgICAgICAgIHZhciBwcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHRoaXMpO1xuICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIGBjYWxsYCBhbmQgYGFwcGx5YCBtZXRob2RzIGZyb20gYEZ1bmN0aW9uYFxuICAgICAgICAgIHByb3RvdHlwZS5jYWxsID0gY2FsbDtcbiAgICAgICAgICBwcm90b3R5cGUuYXBwbHkgPSBhcHBseTtcbiAgICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoY2hhaW5hYmxlTWV0aG9kV3JhcHBlciwgcHJvdG90eXBlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBPdGhlcndpc2UsIHJlZGVmaW5lIGFsbCBwcm9wZXJ0aWVzIChzbG93ISlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgdmFyIGFzc2VydGVyTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdHgpO1xuICAgICAgICAgIGFzc2VydGVyTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAoYXNzZXJ0ZXJOYW1lKSB7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZU5hbWVzLmluZGV4T2YoYXNzZXJ0ZXJOYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcGQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGN0eCwgYXNzZXJ0ZXJOYW1lKTtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjaGFpbmFibGVNZXRob2RXcmFwcGVyLCBhc3NlcnRlck5hbWUsIHBkKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyYW5zZmVyRmxhZ3ModGhpcywgY2hhaW5hYmxlTWV0aG9kV3JhcHBlcik7XG4gICAgICAgIHJldHVybiBwcm94aWZ5KGNoYWluYWJsZU1ldGhvZFdyYXBwZXIpO1xuICAgICAgfVxuICAgICwgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pO1xufTtcbiIsInZhciBjb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxudmFyIGZuTGVuZ3RoRGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZnVuY3Rpb24gKCkge30sICdsZW5ndGgnKTtcblxuLyohXG4gKiBDaGFpIC0gYWRkTGVuZ3RoR3VhcmQgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogIyMjIC5hZGRMZW5ndGhHdWFyZChmbiwgYXNzZXJ0aW9uTmFtZSwgaXNDaGFpbmFibGUpXG4gKlxuICogRGVmaW5lIGBsZW5ndGhgIGFzIGEgZ2V0dGVyIG9uIHRoZSBnaXZlbiB1bmludm9rZWQgbWV0aG9kIGFzc2VydGlvbi4gVGhlXG4gKiBnZXR0ZXIgYWN0cyBhcyBhIGd1YXJkIGFnYWluc3QgY2hhaW5pbmcgYGxlbmd0aGAgZGlyZWN0bHkgb2ZmIG9mIGFuIHVuaW52b2tlZFxuICogbWV0aG9kIGFzc2VydGlvbiwgd2hpY2ggaXMgYSBwcm9ibGVtIGJlY2F1c2UgaXQgcmVmZXJlbmNlcyBgZnVuY3Rpb25gJ3NcbiAqIGJ1aWx0LWluIGBsZW5ndGhgIHByb3BlcnR5IGluc3RlYWQgb2YgQ2hhaSdzIGBsZW5ndGhgIGFzc2VydGlvbi4gV2hlbiB0aGVcbiAqIGdldHRlciBjYXRjaGVzIHRoZSB1c2VyIG1ha2luZyB0aGlzIG1pc3Rha2UsIGl0IHRocm93cyBhbiBlcnJvciB3aXRoIGFcbiAqIGhlbHBmdWwgbWVzc2FnZS5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHdheXMgaW4gd2hpY2ggdGhpcyBtaXN0YWtlIGNhbiBiZSBtYWRlLiBUaGUgZmlyc3Qgd2F5IGlzIGJ5XG4gKiBjaGFpbmluZyB0aGUgYGxlbmd0aGAgYXNzZXJ0aW9uIGRpcmVjdGx5IG9mZiBvZiBhbiB1bmludm9rZWQgY2hhaW5hYmxlXG4gKiBtZXRob2QuIEluIHRoaXMgY2FzZSwgQ2hhaSBzdWdnZXN0cyB0aGF0IHRoZSB1c2VyIHVzZSBgbGVuZ3RoT2ZgIGluc3RlYWQuIFRoZVxuICogc2Vjb25kIHdheSBpcyBieSBjaGFpbmluZyB0aGUgYGxlbmd0aGAgYXNzZXJ0aW9uIGRpcmVjdGx5IG9mZiBvZiBhbiB1bmludm9rZWRcbiAqIG5vbi1jaGFpbmFibGUgbWV0aG9kLiBOb24tY2hhaW5hYmxlIG1ldGhvZHMgbXVzdCBiZSBpbnZva2VkIHByaW9yIHRvXG4gKiBjaGFpbmluZy4gSW4gdGhpcyBjYXNlLCBDaGFpIHN1Z2dlc3RzIHRoYXQgdGhlIHVzZXIgY29uc3VsdCB0aGUgZG9jcyBmb3IgdGhlXG4gKiBnaXZlbiBhc3NlcnRpb24uXG4gKlxuICogSWYgdGhlIGBsZW5ndGhgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBpcyB1bmNvbmZpZ3VyYWJsZSwgdGhlbiByZXR1cm4gYGZuYFxuICogd2l0aG91dCBtb2RpZmljYXRpb24uXG4gKlxuICogTm90ZSB0aGF0IGluIEVTNiwgdGhlIGZ1bmN0aW9uJ3MgYGxlbmd0aGAgcHJvcGVydHkgaXMgY29uZmlndXJhYmxlLCBzbyBvbmNlXG4gKiBzdXBwb3J0IGZvciBsZWdhY3kgZW52aXJvbm1lbnRzIGlzIGRyb3BwZWQsIENoYWkncyBgbGVuZ3RoYCBwcm9wZXJ0eSBjYW5cbiAqIHJlcGxhY2UgdGhlIGJ1aWx0LWluIGZ1bmN0aW9uJ3MgYGxlbmd0aGAgcHJvcGVydHksIGFuZCB0aGlzIGxlbmd0aCBndWFyZCB3aWxsXG4gKiBubyBsb25nZXIgYmUgbmVjZXNzYXJ5LiBJbiB0aGUgbWVhbiB0aW1lLCBtYWludGFpbmluZyBjb25zaXN0ZW5jeSBhY3Jvc3MgYWxsXG4gKiBlbnZpcm9ubWVudHMgaXMgdGhlIHByaW9yaXR5LlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge1N0cmluZ30gYXNzZXJ0aW9uTmFtZVxuICogQHBhcmFtIHtCb29sZWFufSBpc0NoYWluYWJsZVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgYWRkTGVuZ3RoR3VhcmRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFkZExlbmd0aEd1YXJkIChmbiwgYXNzZXJ0aW9uTmFtZSwgaXNDaGFpbmFibGUpIHtcbiAgaWYgKCFmbkxlbmd0aERlc2MuY29uZmlndXJhYmxlKSByZXR1cm4gZm47XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCAnbGVuZ3RoJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGlzQ2hhaW5hYmxlKSB7XG4gICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIENoYWkgcHJvcGVydHk6ICcgKyBhc3NlcnRpb25OYW1lICsgJy5sZW5ndGguIER1ZScgK1xuICAgICAgICAgICcgdG8gYSBjb21wYXRpYmlsaXR5IGlzc3VlLCBcImxlbmd0aFwiIGNhbm5vdCBkaXJlY3RseSBmb2xsb3cgXCInICtcbiAgICAgICAgICBhc3NlcnRpb25OYW1lICsgJ1wiLiBVc2UgXCInICsgYXNzZXJ0aW9uTmFtZSArICcubGVuZ3RoT2ZcIiBpbnN0ZWFkLicpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBDaGFpIHByb3BlcnR5OiAnICsgYXNzZXJ0aW9uTmFtZSArICcubGVuZ3RoLiBTZWUnICtcbiAgICAgICAgJyBkb2NzIGZvciBwcm9wZXIgdXNhZ2Ugb2YgXCInICsgYXNzZXJ0aW9uTmFtZSArICdcIi4nKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBmbjtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBhZGRNZXRob2QgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciBhZGRMZW5ndGhHdWFyZCA9IHJlcXVpcmUoJy4vYWRkTGVuZ3RoR3VhcmQnKTtcbnZhciBjaGFpID0gcmVxdWlyZSgnLi4vLi4vY2hhaScpO1xudmFyIGZsYWcgPSByZXF1aXJlKCcuL2ZsYWcnKTtcbnZhciBwcm94aWZ5ID0gcmVxdWlyZSgnLi9wcm94aWZ5Jyk7XG52YXIgdHJhbnNmZXJGbGFncyA9IHJlcXVpcmUoJy4vdHJhbnNmZXJGbGFncycpO1xuXG4vKipcbiAqICMjIyAuYWRkTWV0aG9kKGN0eCwgbmFtZSwgbWV0aG9kKVxuICpcbiAqIEFkZHMgYSBtZXRob2QgdG8gdGhlIHByb3RvdHlwZSBvZiBhbiBvYmplY3QuXG4gKlxuICogICAgIHV0aWxzLmFkZE1ldGhvZChjaGFpLkFzc2VydGlvbi5wcm90b3R5cGUsICdmb28nLCBmdW5jdGlvbiAoc3RyKSB7XG4gKiAgICAgICB2YXIgb2JqID0gdXRpbHMuZmxhZyh0aGlzLCAnb2JqZWN0Jyk7XG4gKiAgICAgICBuZXcgY2hhaS5Bc3NlcnRpb24ob2JqKS50by5iZS5lcXVhbChzdHIpO1xuICogICAgIH0pO1xuICpcbiAqIENhbiBhbHNvIGJlIGFjY2Vzc2VkIGRpcmVjdGx5IGZyb20gYGNoYWkuQXNzZXJ0aW9uYC5cbiAqXG4gKiAgICAgY2hhaS5Bc3NlcnRpb24uYWRkTWV0aG9kKCdmb28nLCBmbik7XG4gKlxuICogVGhlbiBjYW4gYmUgdXNlZCBhcyBhbnkgb3RoZXIgYXNzZXJ0aW9uLlxuICpcbiAqICAgICBleHBlY3QoZm9vU3RyKS50by5iZS5mb28oJ2JhcicpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHggb2JqZWN0IHRvIHdoaWNoIHRoZSBtZXRob2QgaXMgYWRkZWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG9mIG1ldGhvZCB0byBhZGRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1ldGhvZCBmdW5jdGlvbiB0byBiZSB1c2VkIGZvciBuYW1lXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBhZGRNZXRob2RcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhZGRNZXRob2QoY3R4LCBuYW1lLCBtZXRob2QpIHtcbiAgdmFyIG1ldGhvZFdyYXBwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gU2V0dGluZyB0aGUgYHNzZmlgIGZsYWcgdG8gYG1ldGhvZFdyYXBwZXJgIGNhdXNlcyB0aGlzIGZ1bmN0aW9uIHRvIGJlIHRoZVxuICAgIC8vIHN0YXJ0aW5nIHBvaW50IGZvciByZW1vdmluZyBpbXBsZW1lbnRhdGlvbiBmcmFtZXMgZnJvbSB0aGUgc3RhY2sgdHJhY2Ugb2ZcbiAgICAvLyBhIGZhaWxlZCBhc3NlcnRpb24uXG4gICAgLy9cbiAgICAvLyBIb3dldmVyLCB3ZSBvbmx5IHdhbnQgdG8gdXNlIHRoaXMgZnVuY3Rpb24gYXMgdGhlIHN0YXJ0aW5nIHBvaW50IGlmIHRoZVxuICAgIC8vIGBsb2NrU3NmaWAgZmxhZyBpc24ndCBzZXQuXG4gICAgLy9cbiAgICAvLyBJZiB0aGUgYGxvY2tTc2ZpYCBmbGFnIGlzIHNldCwgdGhlbiBlaXRoZXIgdGhpcyBhc3NlcnRpb24gaGFzIGJlZW5cbiAgICAvLyBvdmVyd3JpdHRlbiBieSBhbm90aGVyIGFzc2VydGlvbiwgb3IgdGhpcyBhc3NlcnRpb24gaXMgYmVpbmcgaW52b2tlZCBmcm9tXG4gICAgLy8gaW5zaWRlIG9mIGFub3RoZXIgYXNzZXJ0aW9uLiBJbiB0aGUgZmlyc3QgY2FzZSwgdGhlIGBzc2ZpYCBmbGFnIGhhc1xuICAgIC8vIGFscmVhZHkgYmVlbiBzZXQgYnkgdGhlIG92ZXJ3cml0aW5nIGFzc2VydGlvbi4gSW4gdGhlIHNlY29uZCBjYXNlLCB0aGVcbiAgICAvLyBgc3NmaWAgZmxhZyBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSB0aGUgb3V0ZXIgYXNzZXJ0aW9uLlxuICAgIGlmICghZmxhZyh0aGlzLCAnbG9ja1NzZmknKSkge1xuICAgICAgZmxhZyh0aGlzLCAnc3NmaScsIG1ldGhvZFdyYXBwZXIpO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgdmFyIG5ld0Fzc2VydGlvbiA9IG5ldyBjaGFpLkFzc2VydGlvbigpO1xuICAgIHRyYW5zZmVyRmxhZ3ModGhpcywgbmV3QXNzZXJ0aW9uKTtcbiAgICByZXR1cm4gbmV3QXNzZXJ0aW9uO1xuICB9O1xuXG4gIGFkZExlbmd0aEd1YXJkKG1ldGhvZFdyYXBwZXIsIG5hbWUsIGZhbHNlKTtcbiAgY3R4W25hbWVdID0gcHJveGlmeShtZXRob2RXcmFwcGVyLCBuYW1lKTtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBhZGRQcm9wZXJ0eSB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIGNoYWkgPSByZXF1aXJlKCcuLi8uLi9jaGFpJyk7XG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xudmFyIGlzUHJveHlFbmFibGVkID0gcmVxdWlyZSgnLi9pc1Byb3h5RW5hYmxlZCcpO1xudmFyIHRyYW5zZmVyRmxhZ3MgPSByZXF1aXJlKCcuL3RyYW5zZmVyRmxhZ3MnKTtcblxuLyoqXG4gKiAjIyMgLmFkZFByb3BlcnR5KGN0eCwgbmFtZSwgZ2V0dGVyKVxuICpcbiAqIEFkZHMgYSBwcm9wZXJ0eSB0byB0aGUgcHJvdG90eXBlIG9mIGFuIG9iamVjdC5cbiAqXG4gKiAgICAgdXRpbHMuYWRkUHJvcGVydHkoY2hhaS5Bc3NlcnRpb24ucHJvdG90eXBlLCAnZm9vJywgZnVuY3Rpb24gKCkge1xuICogICAgICAgdmFyIG9iaiA9IHV0aWxzLmZsYWcodGhpcywgJ29iamVjdCcpO1xuICogICAgICAgbmV3IGNoYWkuQXNzZXJ0aW9uKG9iaikudG8uYmUuaW5zdGFuY2VvZihGb28pO1xuICogICAgIH0pO1xuICpcbiAqIENhbiBhbHNvIGJlIGFjY2Vzc2VkIGRpcmVjdGx5IGZyb20gYGNoYWkuQXNzZXJ0aW9uYC5cbiAqXG4gKiAgICAgY2hhaS5Bc3NlcnRpb24uYWRkUHJvcGVydHkoJ2ZvbycsIGZuKTtcbiAqXG4gKiBUaGVuIGNhbiBiZSB1c2VkIGFzIGFueSBvdGhlciBhc3NlcnRpb24uXG4gKlxuICogICAgIGV4cGVjdChteUZvbykudG8uYmUuZm9vO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjdHggb2JqZWN0IHRvIHdoaWNoIHRoZSBwcm9wZXJ0eSBpcyBhZGRlZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgb2YgcHJvcGVydHkgdG8gYWRkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBnZXR0ZXIgZnVuY3Rpb24gdG8gYmUgdXNlZCBmb3IgbmFtZVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgYWRkUHJvcGVydHlcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhZGRQcm9wZXJ0eShjdHgsIG5hbWUsIGdldHRlcikge1xuICBnZXR0ZXIgPSBnZXR0ZXIgPT09IHVuZGVmaW5lZCA/IGZ1bmN0aW9uICgpIHt9IDogZ2V0dGVyO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjdHgsIG5hbWUsXG4gICAgeyBnZXQ6IGZ1bmN0aW9uIHByb3BlcnR5R2V0dGVyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSBgc3NmaWAgZmxhZyB0byBgcHJvcGVydHlHZXR0ZXJgIGNhdXNlcyB0aGlzIGZ1bmN0aW9uIHRvXG4gICAgICAgIC8vIGJlIHRoZSBzdGFydGluZyBwb2ludCBmb3IgcmVtb3ZpbmcgaW1wbGVtZW50YXRpb24gZnJhbWVzIGZyb20gdGhlXG4gICAgICAgIC8vIHN0YWNrIHRyYWNlIG9mIGEgZmFpbGVkIGFzc2VydGlvbi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSG93ZXZlciwgd2Ugb25seSB3YW50IHRvIHVzZSB0aGlzIGZ1bmN0aW9uIGFzIHRoZSBzdGFydGluZyBwb2ludCBpZlxuICAgICAgICAvLyB0aGUgYGxvY2tTc2ZpYCBmbGFnIGlzbid0IHNldCBhbmQgcHJveHkgcHJvdGVjdGlvbiBpcyBkaXNhYmxlZC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgdGhlIGBsb2NrU3NmaWAgZmxhZyBpcyBzZXQsIHRoZW4gZWl0aGVyIHRoaXMgYXNzZXJ0aW9uIGhhcyBiZWVuXG4gICAgICAgIC8vIG92ZXJ3cml0dGVuIGJ5IGFub3RoZXIgYXNzZXJ0aW9uLCBvciB0aGlzIGFzc2VydGlvbiBpcyBiZWluZyBpbnZva2VkXG4gICAgICAgIC8vIGZyb20gaW5zaWRlIG9mIGFub3RoZXIgYXNzZXJ0aW9uLiBJbiB0aGUgZmlyc3QgY2FzZSwgdGhlIGBzc2ZpYCBmbGFnXG4gICAgICAgIC8vIGhhcyBhbHJlYWR5IGJlZW4gc2V0IGJ5IHRoZSBvdmVyd3JpdGluZyBhc3NlcnRpb24uIEluIHRoZSBzZWNvbmRcbiAgICAgICAgLy8gY2FzZSwgdGhlIGBzc2ZpYCBmbGFnIGhhcyBhbHJlYWR5IGJlZW4gc2V0IGJ5IHRoZSBvdXRlciBhc3NlcnRpb24uXG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIHByb3h5IHByb3RlY3Rpb24gaXMgZW5hYmxlZCwgdGhlbiB0aGUgYHNzZmlgIGZsYWcgaGFzIGFscmVhZHkgYmVlblxuICAgICAgICAvLyBzZXQgYnkgdGhlIHByb3h5IGdldHRlci5cbiAgICAgICAgaWYgKCFpc1Byb3h5RW5hYmxlZCgpICYmICFmbGFnKHRoaXMsICdsb2NrU3NmaScpKSB7XG4gICAgICAgICAgZmxhZyh0aGlzLCAnc3NmaScsIHByb3BlcnR5R2V0dGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHQgPSBnZXR0ZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgdmFyIG5ld0Fzc2VydGlvbiA9IG5ldyBjaGFpLkFzc2VydGlvbigpO1xuICAgICAgICB0cmFuc2ZlckZsYWdzKHRoaXMsIG5ld0Fzc2VydGlvbik7XG4gICAgICAgIHJldHVybiBuZXdBc3NlcnRpb247XG4gICAgICB9XG4gICAgLCBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59O1xuIiwiLyohXG4gKiBDaGFpIC0gY29tcGFyZUJ5SW5zcGVjdCB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMS0yMDE2IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyohXG4gKiBNb2R1bGUgZGVwZW5kYW5jaWVzXG4gKi9cblxudmFyIGluc3BlY3QgPSByZXF1aXJlKCcuL2luc3BlY3QnKTtcblxuLyoqXG4gKiAjIyMgLmNvbXBhcmVCeUluc3BlY3QobWl4ZWQsIG1peGVkKVxuICpcbiAqIFRvIGJlIHVzZWQgYXMgYSBjb21wYXJlRnVuY3Rpb24gd2l0aCBBcnJheS5wcm90b3R5cGUuc29ydC4gQ29tcGFyZXMgZWxlbWVudHNcbiAqIHVzaW5nIGluc3BlY3QgaW5zdGVhZCBvZiBkZWZhdWx0IGJlaGF2aW9yIG9mIHVzaW5nIHRvU3RyaW5nIHNvIHRoYXQgU3ltYm9sc1xuICogYW5kIG9iamVjdHMgd2l0aCBpcnJlZ3VsYXIvbWlzc2luZyB0b1N0cmluZyBjYW4gc3RpbGwgYmUgc29ydGVkIHdpdGhvdXQgYVxuICogVHlwZUVycm9yLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGZpcnN0IGVsZW1lbnQgdG8gY29tcGFyZVxuICogQHBhcmFtIHtNaXhlZH0gc2Vjb25kIGVsZW1lbnQgdG8gY29tcGFyZVxuICogQHJldHVybnMge051bWJlcn0gLTEgaWYgJ2EnIHNob3VsZCBjb21lIGJlZm9yZSAnYic7IG90aGVyd2lzZSAxIFxuICogQG5hbWUgY29tcGFyZUJ5SW5zcGVjdFxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNvbXBhcmVCeUluc3BlY3QoYSwgYikge1xuICByZXR1cm4gaW5zcGVjdChhKSA8IGluc3BlY3QoYikgPyAtMSA6IDE7XG59O1xuIiwiLyohXG4gKiBDaGFpIC0gZXhwZWN0VHlwZXMgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogIyMjIC5leHBlY3RUeXBlcyhvYmosIHR5cGVzKVxuICpcbiAqIEVuc3VyZXMgdGhhdCB0aGUgb2JqZWN0IGJlaW5nIHRlc3RlZCBhZ2FpbnN0IGlzIG9mIGEgdmFsaWQgdHlwZS5cbiAqXG4gKiAgICAgdXRpbHMuZXhwZWN0VHlwZXModGhpcywgWydhcnJheScsICdvYmplY3QnLCAnc3RyaW5nJ10pO1xuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IG9iaiBjb25zdHJ1Y3RlZCBBc3NlcnRpb25cbiAqIEBwYXJhbSB7QXJyYXl9IHR5cGUgQSBsaXN0IG9mIGFsbG93ZWQgdHlwZXMgZm9yIHRoaXMgYXNzZXJ0aW9uXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBleHBlY3RUeXBlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG52YXIgQXNzZXJ0aW9uRXJyb3IgPSByZXF1aXJlKCdhc3NlcnRpb24tZXJyb3InKTtcbnZhciBmbGFnID0gcmVxdWlyZSgnLi9mbGFnJyk7XG52YXIgdHlwZSA9IHJlcXVpcmUoJ3R5cGUtZGV0ZWN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXhwZWN0VHlwZXMob2JqLCB0eXBlcykge1xuICB2YXIgZmxhZ01zZyA9IGZsYWcob2JqLCAnbWVzc2FnZScpO1xuICB2YXIgc3NmaSA9IGZsYWcob2JqLCAnc3NmaScpO1xuXG4gIGZsYWdNc2cgPSBmbGFnTXNnID8gZmxhZ01zZyArICc6ICcgOiAnJztcblxuICBvYmogPSBmbGFnKG9iaiwgJ29iamVjdCcpO1xuICB0eXBlcyA9IHR5cGVzLm1hcChmdW5jdGlvbiAodCkgeyByZXR1cm4gdC50b0xvd2VyQ2FzZSgpOyB9KTtcbiAgdHlwZXMuc29ydCgpO1xuXG4gIC8vIFRyYW5zZm9ybXMgWydsb3JlbScsICdpcHN1bSddIGludG8gJ2EgbG9yZW0sIG9yIGFuIGlwc3VtJ1xuICB2YXIgc3RyID0gdHlwZXMubWFwKGZ1bmN0aW9uICh0LCBpbmRleCkge1xuICAgIHZhciBhcnQgPSB+WyAnYScsICdlJywgJ2knLCAnbycsICd1JyBdLmluZGV4T2YodC5jaGFyQXQoMCkpID8gJ2FuJyA6ICdhJztcbiAgICB2YXIgb3IgPSB0eXBlcy5sZW5ndGggPiAxICYmIGluZGV4ID09PSB0eXBlcy5sZW5ndGggLSAxID8gJ29yICcgOiAnJztcbiAgICByZXR1cm4gb3IgKyBhcnQgKyAnICcgKyB0O1xuICB9KS5qb2luKCcsICcpO1xuXG4gIHZhciBvYmpUeXBlID0gdHlwZShvYmopLnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKCF0eXBlcy5zb21lKGZ1bmN0aW9uIChleHBlY3RlZCkgeyByZXR1cm4gb2JqVHlwZSA9PT0gZXhwZWN0ZWQ7IH0pKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgZmxhZ01zZyArICdvYmplY3QgdGVzdGVkIG11c3QgYmUgJyArIHN0ciArICcsIGJ1dCAnICsgb2JqVHlwZSArICcgZ2l2ZW4nLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgc3NmaVxuICAgICk7XG4gIH1cbn07XG4iLCIvKiFcbiAqIENoYWkgLSBmbGFnIHV0aWxpdHlcbiAqIENvcHlyaWdodChjKSAyMDEyLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKipcbiAqICMjIyAuZmxhZyhvYmplY3QsIGtleSwgW3ZhbHVlXSlcbiAqXG4gKiBHZXQgb3Igc2V0IGEgZmxhZyB2YWx1ZSBvbiBhbiBvYmplY3QuIElmIGFcbiAqIHZhbHVlIGlzIHByb3ZpZGVkIGl0IHdpbGwgYmUgc2V0LCBlbHNlIGl0IHdpbGxcbiAqIHJldHVybiB0aGUgY3VycmVudGx5IHNldCB2YWx1ZSBvciBgdW5kZWZpbmVkYCBpZlxuICogdGhlIHZhbHVlIGlzIG5vdCBzZXQuXG4gKlxuICogICAgIHV0aWxzLmZsYWcodGhpcywgJ2ZvbycsICdiYXInKTsgLy8gc2V0dGVyXG4gKiAgICAgdXRpbHMuZmxhZyh0aGlzLCAnZm9vJyk7IC8vIGdldHRlciwgcmV0dXJucyBgYmFyYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgY29uc3RydWN0ZWQgQXNzZXJ0aW9uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZSAob3B0aW9uYWwpXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBmbGFnXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZsYWcob2JqLCBrZXksIHZhbHVlKSB7XG4gIHZhciBmbGFncyA9IG9iai5fX2ZsYWdzIHx8IChvYmouX19mbGFncyA9IE9iamVjdC5jcmVhdGUobnVsbCkpO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgIGZsYWdzW2tleV0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmxhZ3Nba2V5XTtcbiAgfVxufTtcbiIsIi8qIVxuICogQ2hhaSAtIGdldEFjdHVhbCB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLmdldEFjdHVhbChvYmplY3QsIFthY3R1YWxdKVxuICpcbiAqIFJldHVybnMgdGhlIGBhY3R1YWxgIHZhbHVlIGZvciBhbiBBc3NlcnRpb24uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCAoY29uc3RydWN0ZWQgQXNzZXJ0aW9uKVxuICogQHBhcmFtIHtBcmd1bWVudHN9IGNoYWkuQXNzZXJ0aW9uLnByb3RvdHlwZS5hc3NlcnQgYXJndW1lbnRzXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBnZXRBY3R1YWxcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldEFjdHVhbChvYmosIGFyZ3MpIHtcbiAgcmV0dXJuIGFyZ3MubGVuZ3RoID4gNCA/IGFyZ3NbNF0gOiBvYmouX29iajtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBnZXRFbnVtZXJhYmxlUHJvcGVydGllcyB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLmdldEVudW1lcmFibGVQcm9wZXJ0aWVzKG9iamVjdClcbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgcmV0cmlldmFsIG9mIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LFxuICogaW5oZXJpdGVkIG9yIG5vdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBnZXRFbnVtZXJhYmxlUHJvcGVydGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldEVudW1lcmFibGVQcm9wZXJ0aWVzKG9iamVjdCkge1xuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIG5hbWUgaW4gb2JqZWN0KSB7XG4gICAgcmVzdWx0LnB1c2gobmFtZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBtZXNzYWdlIGNvbXBvc2l0aW9uIHV0aWxpdHlcbiAqIENvcHlyaWdodChjKSAyMDEyLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKiFcbiAqIE1vZHVsZSBkZXBlbmRhbmNpZXNcbiAqL1xuXG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpXG4gICwgZ2V0QWN0dWFsID0gcmVxdWlyZSgnLi9nZXRBY3R1YWwnKVxuICAsIGluc3BlY3QgPSByZXF1aXJlKCcuL2luc3BlY3QnKVxuICAsIG9iakRpc3BsYXkgPSByZXF1aXJlKCcuL29iakRpc3BsYXknKTtcblxuLyoqXG4gKiAjIyMgLmdldE1lc3NhZ2Uob2JqZWN0LCBtZXNzYWdlLCBuZWdhdGVNZXNzYWdlKVxuICpcbiAqIENvbnN0cnVjdCB0aGUgZXJyb3IgbWVzc2FnZSBiYXNlZCBvbiBmbGFnc1xuICogYW5kIHRlbXBsYXRlIHRhZ3MuIFRlbXBsYXRlIHRhZ3Mgd2lsbCByZXR1cm5cbiAqIGEgc3RyaW5naWZpZWQgaW5zcGVjdGlvbiBvZiB0aGUgb2JqZWN0IHJlZmVyZW5jZWQuXG4gKlxuICogTWVzc2FnZSB0ZW1wbGF0ZSB0YWdzOlxuICogLSBgI3t0aGlzfWAgY3VycmVudCBhc3NlcnRlZCBvYmplY3RcbiAqIC0gYCN7YWN0fWAgYWN0dWFsIHZhbHVlXG4gKiAtIGAje2V4cH1gIGV4cGVjdGVkIHZhbHVlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCAoY29uc3RydWN0ZWQgQXNzZXJ0aW9uKVxuICogQHBhcmFtIHtBcmd1bWVudHN9IGNoYWkuQXNzZXJ0aW9uLnByb3RvdHlwZS5hc3NlcnQgYXJndW1lbnRzXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBnZXRNZXNzYWdlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0TWVzc2FnZShvYmosIGFyZ3MpIHtcbiAgdmFyIG5lZ2F0ZSA9IGZsYWcob2JqLCAnbmVnYXRlJylcbiAgICAsIHZhbCA9IGZsYWcob2JqLCAnb2JqZWN0JylcbiAgICAsIGV4cGVjdGVkID0gYXJnc1szXVxuICAgICwgYWN0dWFsID0gZ2V0QWN0dWFsKG9iaiwgYXJncylcbiAgICAsIG1zZyA9IG5lZ2F0ZSA/IGFyZ3NbMl0gOiBhcmdzWzFdXG4gICAgLCBmbGFnTXNnID0gZmxhZyhvYmosICdtZXNzYWdlJyk7XG5cbiAgaWYodHlwZW9mIG1zZyA9PT0gXCJmdW5jdGlvblwiKSBtc2cgPSBtc2coKTtcbiAgbXNnID0gbXNnIHx8ICcnO1xuICBtc2cgPSBtc2dcbiAgICAucmVwbGFjZSgvI1xce3RoaXNcXH0vZywgZnVuY3Rpb24gKCkgeyByZXR1cm4gb2JqRGlzcGxheSh2YWwpOyB9KVxuICAgIC5yZXBsYWNlKC8jXFx7YWN0XFx9L2csIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9iakRpc3BsYXkoYWN0dWFsKTsgfSlcbiAgICAucmVwbGFjZSgvI1xce2V4cFxcfS9nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBvYmpEaXNwbGF5KGV4cGVjdGVkKTsgfSk7XG5cbiAgcmV0dXJuIGZsYWdNc2cgPyBmbGFnTXNnICsgJzogJyArIG1zZyA6IG1zZztcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBnZXRPd25FbnVtZXJhYmxlUHJvcGVydGllcyB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMS0yMDE2IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyohXG4gKiBNb2R1bGUgZGVwZW5kYW5jaWVzXG4gKi9cblxudmFyIGdldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMgPSByZXF1aXJlKCcuL2dldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMnKTtcblxuLyoqXG4gKiAjIyMgLmdldE93bkVudW1lcmFibGVQcm9wZXJ0aWVzKG9iamVjdClcbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgcmV0cmlldmFsIG9mIGRpcmVjdGx5LW93bmVkIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgYW5kXG4gKiBzeW1ib2xzIG9mIGFuIG9iamVjdC4gVGhpcyBmdW5jdGlvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBPYmplY3Qua2V5cyBvbmx5XG4gKiByZXR1cm5zIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMsIG5vdCBlbnVtZXJhYmxlIHByb3BlcnR5IHN5bWJvbHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICogQHJldHVybnMge0FycmF5fVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgZ2V0T3duRW51bWVyYWJsZVByb3BlcnRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnZXRPd25FbnVtZXJhYmxlUHJvcGVydGllcyhvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikuY29uY2F0KGdldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMob2JqKSk7XG59O1xuIiwiLyohXG4gKiBDaGFpIC0gZ2V0T3duRW51bWVyYWJsZVByb3BlcnR5U3ltYm9scyB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMS0yMDE2IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLmdldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMob2JqZWN0KVxuICpcbiAqIFRoaXMgYWxsb3dzIHRoZSByZXRyaWV2YWwgb2YgZGlyZWN0bHktb3duZWQgZW51bWVyYWJsZSBwcm9wZXJ0eSBzeW1ib2xzIG9mIGFuXG4gKiBvYmplY3QuIFRoaXMgZnVuY3Rpb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9sc1xuICogcmV0dXJucyBib3RoIGVudW1lcmFibGUgYW5kIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5IHN5bWJvbHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICogQHJldHVybnMge0FycmF5fVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgZ2V0T3duRW51bWVyYWJsZVByb3BlcnR5U3ltYm9sc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMob2JqKSB7XG4gIGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIFtdO1xuXG4gIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iaikuZmlsdGVyKGZ1bmN0aW9uIChzeW0pIHtcbiAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIHN5bSkuZW51bWVyYWJsZTtcbiAgfSk7XG59O1xuIiwiLyohXG4gKiBDaGFpIC0gZ2V0UHJvcGVydGllcyB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLmdldFByb3BlcnRpZXMob2JqZWN0KVxuICpcbiAqIFRoaXMgYWxsb3dzIHRoZSByZXRyaWV2YWwgb2YgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LCBlbnVtZXJhYmxlIG9yIG5vdCxcbiAqIGluaGVyaXRlZCBvciBub3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFxuICogQHJldHVybnMge0FycmF5fVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgZ2V0UHJvcGVydGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFByb3BlcnRpZXMob2JqZWN0KSB7XG4gIHZhciByZXN1bHQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpO1xuXG4gIGZ1bmN0aW9uIGFkZFByb3BlcnR5KHByb3BlcnR5KSB7XG4gICAgaWYgKHJlc3VsdC5pbmRleE9mKHByb3BlcnR5KSA9PT0gLTEpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHByb3BlcnR5KTtcbiAgICB9XG4gIH1cblxuICB2YXIgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgd2hpbGUgKHByb3RvICE9PSBudWxsKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocHJvdG8pLmZvckVhY2goYWRkUHJvcGVydHkpO1xuICAgIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiLyohXG4gKiBjaGFpXG4gKiBDb3B5cmlnaHQoYykgMjAxMSBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qIVxuICogRGVwZW5kZW5jaWVzIHRoYXQgYXJlIHVzZWQgZm9yIG11bHRpcGxlIGV4cG9ydHMgYXJlIHJlcXVpcmVkIGhlcmUgb25seSBvbmNlXG4gKi9cblxudmFyIHBhdGh2YWwgPSByZXF1aXJlKCdwYXRodmFsJyk7XG5cbi8qIVxuICogdGVzdCB1dGlsaXR5XG4gKi9cblxuZXhwb3J0cy50ZXN0ID0gcmVxdWlyZSgnLi90ZXN0Jyk7XG5cbi8qIVxuICogdHlwZSB1dGlsaXR5XG4gKi9cblxuZXhwb3J0cy50eXBlID0gcmVxdWlyZSgndHlwZS1kZXRlY3QnKTtcblxuLyohXG4gKiBleHBlY3RUeXBlcyB1dGlsaXR5XG4gKi9cbmV4cG9ydHMuZXhwZWN0VHlwZXMgPSByZXF1aXJlKCcuL2V4cGVjdFR5cGVzJyk7XG5cbi8qIVxuICogbWVzc2FnZSB1dGlsaXR5XG4gKi9cblxuZXhwb3J0cy5nZXRNZXNzYWdlID0gcmVxdWlyZSgnLi9nZXRNZXNzYWdlJyk7XG5cbi8qIVxuICogYWN0dWFsIHV0aWxpdHlcbiAqL1xuXG5leHBvcnRzLmdldEFjdHVhbCA9IHJlcXVpcmUoJy4vZ2V0QWN0dWFsJyk7XG5cbi8qIVxuICogSW5zcGVjdCB1dGlsXG4gKi9cblxuZXhwb3J0cy5pbnNwZWN0ID0gcmVxdWlyZSgnLi9pbnNwZWN0Jyk7XG5cbi8qIVxuICogT2JqZWN0IERpc3BsYXkgdXRpbFxuICovXG5cbmV4cG9ydHMub2JqRGlzcGxheSA9IHJlcXVpcmUoJy4vb2JqRGlzcGxheScpO1xuXG4vKiFcbiAqIEZsYWcgdXRpbGl0eVxuICovXG5cbmV4cG9ydHMuZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xuXG4vKiFcbiAqIEZsYWcgdHJhbnNmZXJyaW5nIHV0aWxpdHlcbiAqL1xuXG5leHBvcnRzLnRyYW5zZmVyRmxhZ3MgPSByZXF1aXJlKCcuL3RyYW5zZmVyRmxhZ3MnKTtcblxuLyohXG4gKiBEZWVwIGVxdWFsIHV0aWxpdHlcbiAqL1xuXG5leHBvcnRzLmVxbCA9IHJlcXVpcmUoJ2RlZXAtZXFsJyk7XG5cbi8qIVxuICogRGVlcCBwYXRoIGluZm9cbiAqL1xuXG5leHBvcnRzLmdldFBhdGhJbmZvID0gcGF0aHZhbC5nZXRQYXRoSW5mbztcblxuLyohXG4gKiBDaGVjayBpZiBhIHByb3BlcnR5IGV4aXN0c1xuICovXG5cbmV4cG9ydHMuaGFzUHJvcGVydHkgPSBwYXRodmFsLmhhc1Byb3BlcnR5O1xuXG4vKiFcbiAqIEZ1bmN0aW9uIG5hbWVcbiAqL1xuXG5leHBvcnRzLmdldE5hbWUgPSByZXF1aXJlKCdnZXQtZnVuYy1uYW1lJyk7XG5cbi8qIVxuICogYWRkIFByb3BlcnR5XG4gKi9cblxuZXhwb3J0cy5hZGRQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vYWRkUHJvcGVydHknKTtcblxuLyohXG4gKiBhZGQgTWV0aG9kXG4gKi9cblxuZXhwb3J0cy5hZGRNZXRob2QgPSByZXF1aXJlKCcuL2FkZE1ldGhvZCcpO1xuXG4vKiFcbiAqIG92ZXJ3cml0ZSBQcm9wZXJ0eVxuICovXG5cbmV4cG9ydHMub3ZlcndyaXRlUHJvcGVydHkgPSByZXF1aXJlKCcuL292ZXJ3cml0ZVByb3BlcnR5Jyk7XG5cbi8qIVxuICogb3ZlcndyaXRlIE1ldGhvZFxuICovXG5cbmV4cG9ydHMub3ZlcndyaXRlTWV0aG9kID0gcmVxdWlyZSgnLi9vdmVyd3JpdGVNZXRob2QnKTtcblxuLyohXG4gKiBBZGQgYSBjaGFpbmFibGUgbWV0aG9kXG4gKi9cblxuZXhwb3J0cy5hZGRDaGFpbmFibGVNZXRob2QgPSByZXF1aXJlKCcuL2FkZENoYWluYWJsZU1ldGhvZCcpO1xuXG4vKiFcbiAqIE92ZXJ3cml0ZSBjaGFpbmFibGUgbWV0aG9kXG4gKi9cblxuZXhwb3J0cy5vdmVyd3JpdGVDaGFpbmFibGVNZXRob2QgPSByZXF1aXJlKCcuL292ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZCcpO1xuXG4vKiFcbiAqIENvbXBhcmUgYnkgaW5zcGVjdCBtZXRob2RcbiAqL1xuXG5leHBvcnRzLmNvbXBhcmVCeUluc3BlY3QgPSByZXF1aXJlKCcuL2NvbXBhcmVCeUluc3BlY3QnKTtcblxuLyohXG4gKiBHZXQgb3duIGVudW1lcmFibGUgcHJvcGVydHkgc3ltYm9scyBtZXRob2RcbiAqL1xuXG5leHBvcnRzLmdldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMgPSByZXF1aXJlKCcuL2dldE93bkVudW1lcmFibGVQcm9wZXJ0eVN5bWJvbHMnKTtcblxuLyohXG4gKiBHZXQgb3duIGVudW1lcmFibGUgcHJvcGVydGllcyBtZXRob2RcbiAqL1xuXG5leHBvcnRzLmdldE93bkVudW1lcmFibGVQcm9wZXJ0aWVzID0gcmVxdWlyZSgnLi9nZXRPd25FbnVtZXJhYmxlUHJvcGVydGllcycpO1xuXG4vKiFcbiAqIENoZWNrcyBlcnJvciBhZ2FpbnN0IGEgZ2l2ZW4gc2V0IG9mIGNyaXRlcmlhXG4gKi9cblxuZXhwb3J0cy5jaGVja0Vycm9yID0gcmVxdWlyZSgnY2hlY2stZXJyb3InKTtcblxuLyohXG4gKiBQcm94aWZ5IHV0aWxcbiAqL1xuXG5leHBvcnRzLnByb3hpZnkgPSByZXF1aXJlKCcuL3Byb3hpZnknKTtcblxuLyohXG4gKiBhZGRMZW5ndGhHdWFyZCB1dGlsXG4gKi9cblxuZXhwb3J0cy5hZGRMZW5ndGhHdWFyZCA9IHJlcXVpcmUoJy4vYWRkTGVuZ3RoR3VhcmQnKTtcblxuLyohXG4gKiBpc1Byb3h5RW5hYmxlZCBoZWxwZXJcbiAqL1xuXG5leHBvcnRzLmlzUHJveHlFbmFibGVkID0gcmVxdWlyZSgnLi9pc1Byb3h5RW5hYmxlZCcpO1xuXG4vKiFcbiAqIGlzTmFOIG1ldGhvZFxuICovXG5cbmV4cG9ydHMuaXNOYU4gPSByZXF1aXJlKCcuL2lzTmFOJyk7XG4iLCIvLyBUaGlzIGlzIChhbG1vc3QpIGRpcmVjdGx5IGZyb20gTm9kZS5qcyB1dGlsc1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2Jsb2IvZjhjMzM1ZDBjYWY0N2YxNmQzMTQxM2Y4OWFhMjhlZGEzODc4ZTNhYS9saWIvdXRpbC5qc1xuXG52YXIgZ2V0TmFtZSA9IHJlcXVpcmUoJ2dldC1mdW5jLW5hbWUnKTtcbnZhciBnZXRQcm9wZXJ0aWVzID0gcmVxdWlyZSgnLi9nZXRQcm9wZXJ0aWVzJyk7XG52YXIgZ2V0RW51bWVyYWJsZVByb3BlcnRpZXMgPSByZXF1aXJlKCcuL2dldEVudW1lcmFibGVQcm9wZXJ0aWVzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zcGVjdDtcblxuLyoqXG4gKiAjIyMgLmluc3BlY3Qob2JqLCBbc2hvd0hpZGRlbl0sIFtkZXB0aF0sIFtjb2xvcnNdKVxuICpcbiAqIEVjaG9lcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJpZXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hvd0hpZGRlbiBGbGFnIHRoYXQgc2hvd3MgaGlkZGVuIChub3QgZW51bWVyYWJsZSlcbiAqICAgIHByb3BlcnRpZXMgb2Ygb2JqZWN0cy4gRGVmYXVsdCBpcyBmYWxzZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZXB0aCBEZXB0aCBpbiB3aGljaCB0byBkZXNjZW5kIGluIG9iamVjdC4gRGVmYXVsdCBpcyAyLlxuICogQHBhcmFtIHtCb29sZWFufSBjb2xvcnMgRmxhZyB0byB0dXJuIG9uIEFOU0kgZXNjYXBlIGNvZGVzIHRvIGNvbG9yIHRoZVxuICogICAgb3V0cHV0LiBEZWZhdWx0IGlzIGZhbHNlIChubyBjb2xvcmluZykuXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBpbnNwZWN0XG4gKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKSB7XG4gIHZhciBjdHggPSB7XG4gICAgc2hvd0hpZGRlbjogc2hvd0hpZGRlbixcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBmdW5jdGlvbiAoc3RyKSB7IHJldHVybiBzdHI7IH1cbiAgfTtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCAodHlwZW9mIGRlcHRoID09PSAndW5kZWZpbmVkJyA/IDIgOiBkZXB0aCkpO1xufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgb2JqZWN0IGlzIGEgRE9NIGVsZW1lbnQuXG52YXIgaXNET01FbGVtZW50ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICBpZiAodHlwZW9mIEhUTUxFbGVtZW50ID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBIVE1MRWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqZWN0ICYmXG4gICAgICB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgJ25vZGVUeXBlJyBpbiBvYmplY3QgJiZcbiAgICAgIG9iamVjdC5ub2RlVHlwZSA9PT0gMSAmJlxuICAgICAgdHlwZW9mIG9iamVjdC5ub2RlTmFtZSA9PT0gJ3N0cmluZyc7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlLmluc3BlY3QgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKHR5cGVvZiByZXQgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gSWYgdGhpcyBpcyBhIERPTSBlbGVtZW50LCB0cnkgdG8gZ2V0IHRoZSBvdXRlciBIVE1MLlxuICBpZiAoaXNET01FbGVtZW50KHZhbHVlKSkge1xuICAgIGlmICgnb3V0ZXJIVE1MJyBpbiB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLm91dGVySFRNTDtcbiAgICAgIC8vIFRoaXMgdmFsdWUgZG9lcyBub3QgaGF2ZSBhbiBvdXRlckhUTUwgYXR0cmlidXRlLFxuICAgICAgLy8gICBpdCBjb3VsZCBzdGlsbCBiZSBhbiBYTUwgZWxlbWVudFxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBdHRlbXB0IHRvIHNlcmlhbGl6ZSBpdFxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnhtbFZlcnNpb24pIHtcbiAgICAgICAgICB2YXIgeG1sU2VyaWFsaXplciA9IG5ldyBYTUxTZXJpYWxpemVyKCk7XG4gICAgICAgICAgcmV0dXJuIHhtbFNlcmlhbGl6ZXIuc2VyaWFsaXplVG9TdHJpbmcodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEZpcmVmb3ggMTEtIGRvIG5vdCBzdXBwb3J0IG91dGVySFRNTFxuICAgICAgICAgIC8vICAgSXQgZG9lcywgaG93ZXZlciwgc3VwcG9ydCBpbm5lckhUTUxcbiAgICAgICAgICAvLyAgIFVzZSB0aGUgZm9sbG93aW5nIHRvIHJlbmRlciB0aGUgZWxlbWVudFxuICAgICAgICAgIHZhciBucyA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiO1xuICAgICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsICdfJyk7XG5cbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodmFsdWUuY2xvbmVOb2RlKGZhbHNlKSk7XG4gICAgICAgICAgdmFyIGh0bWwgPSBjb250YWluZXIuaW5uZXJIVE1MXG4gICAgICAgICAgICAucmVwbGFjZSgnPjwnLCAnPicgKyB2YWx1ZS5pbm5lckhUTUwgKyAnPCcpO1xuICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIFRoaXMgY291bGQgYmUgYSBub24tbmF0aXZlIERPTSBpbXBsZW1lbnRhdGlvbixcbiAgICAgICAgLy8gICBjb250aW51ZSB3aXRoIHRoZSBub3JtYWwgZmxvdzpcbiAgICAgICAgLy8gICBwcmludGluZyB0aGUgZWxlbWVudCBhcyBpZiBpdCBpcyBhbiBvYmplY3QuXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIgdmlzaWJsZUtleXMgPSBnZXRFbnVtZXJhYmxlUHJvcGVydGllcyh2YWx1ZSk7XG4gIHZhciBrZXlzID0gY3R4LnNob3dIaWRkZW4gPyBnZXRQcm9wZXJ0aWVzKHZhbHVlKSA6IHZpc2libGVLZXlzO1xuXG4gIHZhciBuYW1lLCBuYW1lU3VmZml4O1xuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgLy8gSW4gSUUsIGVycm9ycyBoYXZlIGEgc2luZ2xlIGBzdGFja2AgcHJvcGVydHksIG9yIGlmIHRoZXkgYXJlIHZhbmlsbGEgYEVycm9yYCxcbiAgLy8gYSBgc3RhY2tgIHBsdXMgYGRlc2NyaXB0aW9uYCBwcm9wZXJ0eTsgaWdub3JlIHRob3NlIGZvciBjb25zaXN0ZW5jeS5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwIHx8IChpc0Vycm9yKHZhbHVlKSAmJiAoXG4gICAgICAoa2V5cy5sZW5ndGggPT09IDEgJiYga2V5c1swXSA9PT0gJ3N0YWNrJykgfHxcbiAgICAgIChrZXlzLmxlbmd0aCA9PT0gMiAmJiBrZXlzWzBdID09PSAnZGVzY3JpcHRpb24nICYmIGtleXNbMV0gPT09ICdzdGFjaycpXG4gICAgICkpKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbmFtZSA9IGdldE5hbWUodmFsdWUpO1xuICAgICAgbmFtZVN1ZmZpeCA9IG5hbWUgPyAnOiAnICsgbmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZVN1ZmZpeCArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJydcbiAgICAsIGFycmF5ID0gZmFsc2VcbiAgICAsIHR5cGVkQXJyYXkgPSBmYWxzZVxuICAgICwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICBpZiAoaXNUeXBlZEFycmF5KHZhbHVlKSkge1xuICAgIHR5cGVkQXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBuYW1lID0gZ2V0TmFtZSh2YWx1ZSk7XG4gICAgbmFtZVN1ZmZpeCA9IG5hbWUgPyAnOiAnICsgbmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuYW1lU3VmZml4ICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2UgaWYgKHR5cGVkQXJyYXkpIHtcbiAgICByZXR1cm4gZm9ybWF0VHlwZWRBcnJheSh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuXG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcblxuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICBpZiAodmFsdWUgPT09IDAgJiYgKDEvdmFsdWUpID09PSAtSW5maW5pdHkpIHtcbiAgICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCctMCcsICdudW1iZXInKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG5cbiAgICBjYXNlICdib29sZWFuJzpcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuXG4gICAgY2FzZSAnc3ltYm9sJzpcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSh2YWx1ZS50b1N0cmluZygpLCAnc3ltYm9sJyk7XG4gIH1cbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xuICB9XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG5cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUeXBlZEFycmF5KHZhbHVlKSB7XG4gIHZhciBzdHIgPSAnWyAnO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoc3RyLmxlbmd0aCA+PSBjb25maWcudHJ1bmNhdGVUaHJlc2hvbGQgLSA3KSB7XG4gICAgICBzdHIgKz0gJy4uLic7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgc3RyICs9IHZhbHVlW2ldICsgJywgJztcbiAgfVxuICBzdHIgKz0gJyBdJztcblxuICAvLyBSZW1vdmluZyB0cmFpbGluZyBgLCBgIGlmIHRoZSBhcnJheSB3YXMgbm90IHRydW5jYXRlZFxuICBpZiAoc3RyLmluZGV4T2YoJywgIF0nKSAhPT0gLTEpIHtcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgnLCAgXScsICcgXScpO1xuICB9XG5cbiAgcmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZTtcbiAgdmFyIHByb3BEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KTtcbiAgdmFyIHN0cjtcblxuICBpZiAocHJvcERlc2NyaXB0b3IpIHtcbiAgICBpZiAocHJvcERlc2NyaXB0b3IuZ2V0KSB7XG4gICAgICBpZiAocHJvcERlc2NyaXB0b3Iuc2V0KSB7XG4gICAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHByb3BEZXNjcmlwdG9yLnNldCkge1xuICAgICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAodmlzaWJsZUtleXMuaW5kZXhPZihrZXkpIDwgMCkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZih2YWx1ZVtrZXldKSA8IDApIHtcbiAgICAgIGlmIChyZWN1cnNlVGltZXMgPT09IG51bGwpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZVtrZXldLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgdmFsdWVba2V5XSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAodHlwZW9mIG5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuZnVuY3Rpb24gaXNUeXBlZEFycmF5KGFyKSB7XG4gIC8vIFVuZm9ydHVuYXRlbHkgdGhlcmUncyBubyB3YXkgdG8gY2hlY2sgaWYgYW4gb2JqZWN0IGlzIGEgVHlwZWRBcnJheVxuICAvLyBXZSBoYXZlIHRvIGNoZWNrIGlmIGl0J3Mgb25lIG9mIHRoZXNlIHR5cGVzXG4gIHJldHVybiAodHlwZW9mIGFyID09PSAnb2JqZWN0JyAmJiAvXFx3K0FycmF5XSQvLnRlc3Qob2JqZWN0VG9TdHJpbmcoYXIpKSk7XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpIHx8XG4gICAgICAgICAodHlwZW9mIGFyID09PSAnb2JqZWN0JyAmJiBvYmplY3RUb1N0cmluZyhhcikgPT09ICdbb2JqZWN0IEFycmF5XScpO1xufVxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gdHlwZW9mIHJlID09PSAnb2JqZWN0JyAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdvYmplY3QnICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gdHlwZW9mIGUgPT09ICdvYmplY3QnICYmIG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nO1xufVxuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG4iLCIvKiFcbiAqIENoYWkgLSBpc05hTiB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE1IFNha3RoaXByaXlhbiBWYWlyYW1hbmkgPHRoZWNoYXJnaW5ndm9sY2Fub0BnbWFpbC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKipcbiAqICMjIyAuaXNOYU4odmFsdWUpXG4gKlxuICogQ2hlY2tzIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBOYU4gb3Igbm90LlxuICpcbiAqICAgICB1dGlscy5pc05hTihOYU4pOyAvLyB0cnVlXG4gKlxuICogQHBhcmFtIHtWYWx1ZX0gVGhlIHZhbHVlIHdoaWNoIGhhcyB0byBiZSBjaGVja2VkIGlmIGl0IGlzIE5hTlxuICogQG5hbWUgaXNOYU5cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGlzTmFOKHZhbHVlKSB7XG4gIC8vIFJlZmVyIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1pc25hbi1udW1iZXJcbiAgLy8gc2VjdGlvbidzIE5PVEUuXG4gIHJldHVybiB2YWx1ZSAhPT0gdmFsdWU7XG59XG5cbi8vIElmIEVDTUFTY3JpcHQgNidzIE51bWJlci5pc05hTiBpcyBwcmVzZW50LCBwcmVmZXIgdGhhdC5cbm1vZHVsZS5leHBvcnRzID0gTnVtYmVyLmlzTmFOIHx8IGlzTmFOO1xuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG4vKiFcbiAqIENoYWkgLSBpc1Byb3h5RW5hYmxlZCBoZWxwZXJcbiAqIENvcHlyaWdodChjKSAyMDEyLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKipcbiAqICMjIyAuaXNQcm94eUVuYWJsZWQoKVxuICpcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjaGVjayBpZiBDaGFpJ3MgcHJveHkgcHJvdGVjdGlvbiBmZWF0dXJlIGlzIGVuYWJsZWQuIElmXG4gKiBwcm94aWVzIGFyZSB1bnN1cHBvcnRlZCBvciBkaXNhYmxlZCB2aWEgdGhlIHVzZXIncyBDaGFpIGNvbmZpZywgdGhlbiByZXR1cm5cbiAqIGZhbHNlLiBPdGhlcndpc2UsIHJldHVybiB0cnVlLlxuICpcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBuYW1lIGlzUHJveHlFbmFibGVkXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1Byb3h5RW5hYmxlZCgpIHtcbiAgcmV0dXJuIGNvbmZpZy51c2VQcm94eSAmJiBcbiAgICB0eXBlb2YgUHJveHkgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIFJlZmxlY3QgIT09ICd1bmRlZmluZWQnO1xufTtcbiIsIi8qIVxuICogQ2hhaSAtIGZsYWcgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qIVxuICogTW9kdWxlIGRlcGVuZGFuY2llc1xuICovXG5cbnZhciBpbnNwZWN0ID0gcmVxdWlyZSgnLi9pbnNwZWN0Jyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbi8qKlxuICogIyMjIC5vYmpEaXNwbGF5KG9iamVjdClcbiAqXG4gKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBvciBhbiBhcnJheSBtYXRjaGVzXG4gKiBjcml0ZXJpYSB0byBiZSBpbnNwZWN0ZWQgaW4tbGluZSBmb3IgZXJyb3JcbiAqIG1lc3NhZ2VzIG9yIHNob3VsZCBiZSB0cnVuY2F0ZWQuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gamF2YXNjcmlwdCBvYmplY3QgdG8gaW5zcGVjdFxuICogQG5hbWUgb2JqRGlzcGxheVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG9iakRpc3BsYXkob2JqKSB7XG4gIHZhciBzdHIgPSBpbnNwZWN0KG9iailcbiAgICAsIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcblxuICBpZiAoY29uZmlnLnRydW5jYXRlVGhyZXNob2xkICYmIHN0ci5sZW5ndGggPj0gY29uZmlnLnRydW5jYXRlVGhyZXNob2xkKSB7XG4gICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHtcbiAgICAgIHJldHVybiAhb2JqLm5hbWUgfHwgb2JqLm5hbWUgPT09ICcnXG4gICAgICAgID8gJ1tGdW5jdGlvbl0nXG4gICAgICAgIDogJ1tGdW5jdGlvbjogJyArIG9iai5uYW1lICsgJ10nO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgcmV0dXJuICdbIEFycmF5KCcgKyBvYmoubGVuZ3RoICsgJykgXSc7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopXG4gICAgICAgICwga3N0ciA9IGtleXMubGVuZ3RoID4gMlxuICAgICAgICAgID8ga2V5cy5zcGxpY2UoMCwgMikuam9pbignLCAnKSArICcsIC4uLidcbiAgICAgICAgICA6IGtleXMuam9pbignLCAnKTtcbiAgICAgIHJldHVybiAneyBPYmplY3QgKCcgKyBrc3RyICsgJykgfSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn07XG4iLCIvKiFcbiAqIENoYWkgLSBvdmVyd3JpdGVDaGFpbmFibGVNZXRob2QgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciBjaGFpID0gcmVxdWlyZSgnLi4vLi4vY2hhaScpO1xudmFyIHRyYW5zZmVyRmxhZ3MgPSByZXF1aXJlKCcuL3RyYW5zZmVyRmxhZ3MnKTtcblxuLyoqXG4gKiAjIyMgLm92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZChjdHgsIG5hbWUsIG1ldGhvZCwgY2hhaW5pbmdCZWhhdmlvcilcbiAqXG4gKiBPdmVyd2l0ZXMgYW4gYWxyZWFkeSBleGlzdGluZyBjaGFpbmFibGUgbWV0aG9kXG4gKiBhbmQgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBwcmV2aW91cyBmdW5jdGlvbiBvclxuICogcHJvcGVydHkuICBNdXN0IHJldHVybiBmdW5jdGlvbnMgdG8gYmUgdXNlZCBmb3JcbiAqIG5hbWUuXG4gKlxuICogICAgIHV0aWxzLm92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZChjaGFpLkFzc2VydGlvbi5wcm90b3R5cGUsICdsZW5ndGhPZicsXG4gKiAgICAgICBmdW5jdGlvbiAoX3N1cGVyKSB7XG4gKiAgICAgICB9XG4gKiAgICAgLCBmdW5jdGlvbiAoX3N1cGVyKSB7XG4gKiAgICAgICB9XG4gKiAgICAgKTtcbiAqXG4gKiBDYW4gYWxzbyBiZSBhY2Nlc3NlZCBkaXJlY3RseSBmcm9tIGBjaGFpLkFzc2VydGlvbmAuXG4gKlxuICogICAgIGNoYWkuQXNzZXJ0aW9uLm92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZCgnZm9vJywgZm4sIGZuKTtcbiAqXG4gKiBUaGVuIGNhbiBiZSB1c2VkIGFzIGFueSBvdGhlciBhc3NlcnRpb24uXG4gKlxuICogICAgIGV4cGVjdChteUZvbykudG8uaGF2ZS5sZW5ndGhPZigzKTtcbiAqICAgICBleHBlY3QobXlGb28pLnRvLmhhdmUubGVuZ3RoT2YuYWJvdmUoMyk7XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGN0eCBvYmplY3Qgd2hvc2UgbWV0aG9kIC8gcHJvcGVydHkgaXMgdG8gYmUgb3ZlcndyaXR0ZW5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG9mIG1ldGhvZCAvIHByb3BlcnR5IHRvIG92ZXJ3cml0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgZm9yIG5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoYWluaW5nQmVoYXZpb3IgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgZnVuY3Rpb24gdG8gYmUgdXNlZCBmb3IgcHJvcGVydHlcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBuYW1lIG92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG92ZXJ3cml0ZUNoYWluYWJsZU1ldGhvZChjdHgsIG5hbWUsIG1ldGhvZCwgY2hhaW5pbmdCZWhhdmlvcikge1xuICB2YXIgY2hhaW5hYmxlQmVoYXZpb3IgPSBjdHguX19tZXRob2RzW25hbWVdO1xuXG4gIHZhciBfY2hhaW5pbmdCZWhhdmlvciA9IGNoYWluYWJsZUJlaGF2aW9yLmNoYWluaW5nQmVoYXZpb3I7XG4gIGNoYWluYWJsZUJlaGF2aW9yLmNoYWluaW5nQmVoYXZpb3IgPSBmdW5jdGlvbiBvdmVyd3JpdGluZ0NoYWluYWJsZU1ldGhvZEdldHRlcigpIHtcbiAgICB2YXIgcmVzdWx0ID0gY2hhaW5pbmdCZWhhdmlvcihfY2hhaW5pbmdCZWhhdmlvcikuY2FsbCh0aGlzKTtcbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgdmFyIG5ld0Fzc2VydGlvbiA9IG5ldyBjaGFpLkFzc2VydGlvbigpO1xuICAgIHRyYW5zZmVyRmxhZ3ModGhpcywgbmV3QXNzZXJ0aW9uKTtcbiAgICByZXR1cm4gbmV3QXNzZXJ0aW9uO1xuICB9O1xuXG4gIHZhciBfbWV0aG9kID0gY2hhaW5hYmxlQmVoYXZpb3IubWV0aG9kO1xuICBjaGFpbmFibGVCZWhhdmlvci5tZXRob2QgPSBmdW5jdGlvbiBvdmVyd3JpdGluZ0NoYWluYWJsZU1ldGhvZFdyYXBwZXIoKSB7XG4gICAgdmFyIHJlc3VsdCA9IG1ldGhvZChfbWV0aG9kKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB2YXIgbmV3QXNzZXJ0aW9uID0gbmV3IGNoYWkuQXNzZXJ0aW9uKCk7XG4gICAgdHJhbnNmZXJGbGFncyh0aGlzLCBuZXdBc3NlcnRpb24pO1xuICAgIHJldHVybiBuZXdBc3NlcnRpb247XG4gIH07XG59O1xuIiwiLyohXG4gKiBDaGFpIC0gb3ZlcndyaXRlTWV0aG9kIHV0aWxpdHlcbiAqIENvcHlyaWdodChjKSAyMDEyLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG52YXIgYWRkTGVuZ3RoR3VhcmQgPSByZXF1aXJlKCcuL2FkZExlbmd0aEd1YXJkJyk7XG52YXIgY2hhaSA9IHJlcXVpcmUoJy4uLy4uL2NoYWknKTtcbnZhciBmbGFnID0gcmVxdWlyZSgnLi9mbGFnJyk7XG52YXIgcHJveGlmeSA9IHJlcXVpcmUoJy4vcHJveGlmeScpO1xudmFyIHRyYW5zZmVyRmxhZ3MgPSByZXF1aXJlKCcuL3RyYW5zZmVyRmxhZ3MnKTtcblxuLyoqXG4gKiAjIyMgLm92ZXJ3cml0ZU1ldGhvZChjdHgsIG5hbWUsIGZuKVxuICpcbiAqIE92ZXJ3aXRlcyBhbiBhbHJlYWR5IGV4aXN0aW5nIG1ldGhvZCBhbmQgcHJvdmlkZXNcbiAqIGFjY2VzcyB0byBwcmV2aW91cyBmdW5jdGlvbi4gTXVzdCByZXR1cm4gZnVuY3Rpb25cbiAqIHRvIGJlIHVzZWQgZm9yIG5hbWUuXG4gKlxuICogICAgIHV0aWxzLm92ZXJ3cml0ZU1ldGhvZChjaGFpLkFzc2VydGlvbi5wcm90b3R5cGUsICdlcXVhbCcsIGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAqICAgICAgIHJldHVybiBmdW5jdGlvbiAoc3RyKSB7XG4gKiAgICAgICAgIHZhciBvYmogPSB1dGlscy5mbGFnKHRoaXMsICdvYmplY3QnKTtcbiAqICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEZvbykge1xuICogICAgICAgICAgIG5ldyBjaGFpLkFzc2VydGlvbihvYmoudmFsdWUpLnRvLmVxdWFsKHN0cik7XG4gKiAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gKiAgICAgICAgIH1cbiAqICAgICAgIH1cbiAqICAgICB9KTtcbiAqXG4gKiBDYW4gYWxzbyBiZSBhY2Nlc3NlZCBkaXJlY3RseSBmcm9tIGBjaGFpLkFzc2VydGlvbmAuXG4gKlxuICogICAgIGNoYWkuQXNzZXJ0aW9uLm92ZXJ3cml0ZU1ldGhvZCgnZm9vJywgZm4pO1xuICpcbiAqIFRoZW4gY2FuIGJlIHVzZWQgYXMgYW55IG90aGVyIGFzc2VydGlvbi5cbiAqXG4gKiAgICAgZXhwZWN0KG15Rm9vKS50by5lcXVhbCgnYmFyJyk7XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGN0eCBvYmplY3Qgd2hvc2UgbWV0aG9kIGlzIHRvIGJlIG92ZXJ3cml0dGVuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBvZiBtZXRob2QgdG8gb3ZlcndyaXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZXRob2QgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgZnVuY3Rpb24gdG8gYmUgdXNlZCBmb3IgbmFtZVxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgb3ZlcndyaXRlTWV0aG9kXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gb3ZlcndyaXRlTWV0aG9kKGN0eCwgbmFtZSwgbWV0aG9kKSB7XG4gIHZhciBfbWV0aG9kID0gY3R4W25hbWVdXG4gICAgLCBfc3VwZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobmFtZSArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICB9O1xuXG4gIGlmIChfbWV0aG9kICYmICdmdW5jdGlvbicgPT09IHR5cGVvZiBfbWV0aG9kKVxuICAgIF9zdXBlciA9IF9tZXRob2Q7XG5cbiAgdmFyIG92ZXJ3cml0aW5nTWV0aG9kV3JhcHBlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBTZXR0aW5nIHRoZSBgc3NmaWAgZmxhZyB0byBgb3ZlcndyaXRpbmdNZXRob2RXcmFwcGVyYCBjYXVzZXMgdGhpc1xuICAgIC8vIGZ1bmN0aW9uIHRvIGJlIHRoZSBzdGFydGluZyBwb2ludCBmb3IgcmVtb3ZpbmcgaW1wbGVtZW50YXRpb24gZnJhbWVzIGZyb21cbiAgICAvLyB0aGUgc3RhY2sgdHJhY2Ugb2YgYSBmYWlsZWQgYXNzZXJ0aW9uLlxuICAgIC8vXG4gICAgLy8gSG93ZXZlciwgd2Ugb25seSB3YW50IHRvIHVzZSB0aGlzIGZ1bmN0aW9uIGFzIHRoZSBzdGFydGluZyBwb2ludCBpZiB0aGVcbiAgICAvLyBgbG9ja1NzZmlgIGZsYWcgaXNuJ3Qgc2V0LlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIGBsb2NrU3NmaWAgZmxhZyBpcyBzZXQsIHRoZW4gZWl0aGVyIHRoaXMgYXNzZXJ0aW9uIGhhcyBiZWVuXG4gICAgLy8gb3ZlcndyaXR0ZW4gYnkgYW5vdGhlciBhc3NlcnRpb24sIG9yIHRoaXMgYXNzZXJ0aW9uIGlzIGJlaW5nIGludm9rZWQgZnJvbVxuICAgIC8vIGluc2lkZSBvZiBhbm90aGVyIGFzc2VydGlvbi4gSW4gdGhlIGZpcnN0IGNhc2UsIHRoZSBgc3NmaWAgZmxhZyBoYXNcbiAgICAvLyBhbHJlYWR5IGJlZW4gc2V0IGJ5IHRoZSBvdmVyd3JpdGluZyBhc3NlcnRpb24uIEluIHRoZSBzZWNvbmQgY2FzZSwgdGhlXG4gICAgLy8gYHNzZmlgIGZsYWcgaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgdGhlIG91dGVyIGFzc2VydGlvbi5cbiAgICBpZiAoIWZsYWcodGhpcywgJ2xvY2tTc2ZpJykpIHtcbiAgICAgIGZsYWcodGhpcywgJ3NzZmknLCBvdmVyd3JpdGluZ01ldGhvZFdyYXBwZXIpO1xuICAgIH1cblxuICAgIC8vIFNldHRpbmcgdGhlIGBsb2NrU3NmaWAgZmxhZyB0byBgdHJ1ZWAgcHJldmVudHMgdGhlIG92ZXJ3cml0dGVuIGFzc2VydGlvblxuICAgIC8vIGZyb20gY2hhbmdpbmcgdGhlIGBzc2ZpYCBmbGFnLiBCeSB0aGlzIHBvaW50LCB0aGUgYHNzZmlgIGZsYWcgaXMgYWxyZWFkeVxuICAgIC8vIHNldCB0byB0aGUgY29ycmVjdCBzdGFydGluZyBwb2ludCBmb3IgdGhpcyBhc3NlcnRpb24uXG4gICAgdmFyIG9yaWdMb2NrU3NmaSA9IGZsYWcodGhpcywgJ2xvY2tTc2ZpJyk7XG4gICAgZmxhZyh0aGlzLCAnbG9ja1NzZmknLCB0cnVlKTtcbiAgICB2YXIgcmVzdWx0ID0gbWV0aG9kKF9zdXBlcikuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBmbGFnKHRoaXMsICdsb2NrU3NmaScsIG9yaWdMb2NrU3NmaSk7XG5cbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgdmFyIG5ld0Fzc2VydGlvbiA9IG5ldyBjaGFpLkFzc2VydGlvbigpO1xuICAgIHRyYW5zZmVyRmxhZ3ModGhpcywgbmV3QXNzZXJ0aW9uKTtcbiAgICByZXR1cm4gbmV3QXNzZXJ0aW9uO1xuICB9XG5cbiAgYWRkTGVuZ3RoR3VhcmQob3ZlcndyaXRpbmdNZXRob2RXcmFwcGVyLCBuYW1lLCBmYWxzZSk7XG4gIGN0eFtuYW1lXSA9IHByb3hpZnkob3ZlcndyaXRpbmdNZXRob2RXcmFwcGVyLCBuYW1lKTtcbn07XG4iLCIvKiFcbiAqIENoYWkgLSBvdmVyd3JpdGVQcm9wZXJ0eSB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxudmFyIGNoYWkgPSByZXF1aXJlKCcuLi8uLi9jaGFpJyk7XG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xudmFyIGlzUHJveHlFbmFibGVkID0gcmVxdWlyZSgnLi9pc1Byb3h5RW5hYmxlZCcpO1xudmFyIHRyYW5zZmVyRmxhZ3MgPSByZXF1aXJlKCcuL3RyYW5zZmVyRmxhZ3MnKTtcblxuLyoqXG4gKiAjIyMgLm92ZXJ3cml0ZVByb3BlcnR5KGN0eCwgbmFtZSwgZm4pXG4gKlxuICogT3ZlcndpdGVzIGFuIGFscmVhZHkgZXhpc3RpbmcgcHJvcGVydHkgZ2V0dGVyIGFuZCBwcm92aWRlc1xuICogYWNjZXNzIHRvIHByZXZpb3VzIHZhbHVlLiBNdXN0IHJldHVybiBmdW5jdGlvbiB0byB1c2UgYXMgZ2V0dGVyLlxuICpcbiAqICAgICB1dGlscy5vdmVyd3JpdGVQcm9wZXJ0eShjaGFpLkFzc2VydGlvbi5wcm90b3R5cGUsICdvaycsIGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAqICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gKiAgICAgICAgIHZhciBvYmogPSB1dGlscy5mbGFnKHRoaXMsICdvYmplY3QnKTtcbiAqICAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEZvbykge1xuICogICAgICAgICAgIG5ldyBjaGFpLkFzc2VydGlvbihvYmoubmFtZSkudG8uZXF1YWwoJ2JhcicpO1xuICogICAgICAgICB9IGVsc2Uge1xuICogICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICogICAgICAgICB9XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICpcbiAqIENhbiBhbHNvIGJlIGFjY2Vzc2VkIGRpcmVjdGx5IGZyb20gYGNoYWkuQXNzZXJ0aW9uYC5cbiAqXG4gKiAgICAgY2hhaS5Bc3NlcnRpb24ub3ZlcndyaXRlUHJvcGVydHkoJ2ZvbycsIGZuKTtcbiAqXG4gKiBUaGVuIGNhbiBiZSB1c2VkIGFzIGFueSBvdGhlciBhc3NlcnRpb24uXG4gKlxuICogICAgIGV4cGVjdChteUZvbykudG8uYmUub2s7XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGN0eCBvYmplY3Qgd2hvc2UgcHJvcGVydHkgaXMgdG8gYmUgb3ZlcndyaXR0ZW5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG9mIHByb3BlcnR5IHRvIG92ZXJ3cml0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZ2V0dGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIGdldHRlciBmdW5jdGlvbiB0byBiZSB1c2VkIGZvciBuYW1lXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBvdmVyd3JpdGVQcm9wZXJ0eVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG92ZXJ3cml0ZVByb3BlcnR5KGN0eCwgbmFtZSwgZ2V0dGVyKSB7XG4gIHZhciBfZ2V0ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjdHgsIG5hbWUpXG4gICAgLCBfc3VwZXIgPSBmdW5jdGlvbiAoKSB7fTtcblxuICBpZiAoX2dldCAmJiAnZnVuY3Rpb24nID09PSB0eXBlb2YgX2dldC5nZXQpXG4gICAgX3N1cGVyID0gX2dldC5nZXRcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY3R4LCBuYW1lLFxuICAgIHsgZ2V0OiBmdW5jdGlvbiBvdmVyd3JpdGluZ1Byb3BlcnR5R2V0dGVyKCkge1xuICAgICAgICAvLyBTZXR0aW5nIHRoZSBgc3NmaWAgZmxhZyB0byBgb3ZlcndyaXRpbmdQcm9wZXJ0eUdldHRlcmAgY2F1c2VzIHRoaXNcbiAgICAgICAgLy8gZnVuY3Rpb24gdG8gYmUgdGhlIHN0YXJ0aW5nIHBvaW50IGZvciByZW1vdmluZyBpbXBsZW1lbnRhdGlvbiBmcmFtZXNcbiAgICAgICAgLy8gZnJvbSB0aGUgc3RhY2sgdHJhY2Ugb2YgYSBmYWlsZWQgYXNzZXJ0aW9uLlxuICAgICAgICAvL1xuICAgICAgICAvLyBIb3dldmVyLCB3ZSBvbmx5IHdhbnQgdG8gdXNlIHRoaXMgZnVuY3Rpb24gYXMgdGhlIHN0YXJ0aW5nIHBvaW50IGlmXG4gICAgICAgIC8vIHRoZSBgbG9ja1NzZmlgIGZsYWcgaXNuJ3Qgc2V0IGFuZCBwcm94eSBwcm90ZWN0aW9uIGlzIGRpc2FibGVkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiB0aGUgYGxvY2tTc2ZpYCBmbGFnIGlzIHNldCwgdGhlbiBlaXRoZXIgdGhpcyBhc3NlcnRpb24gaGFzIGJlZW5cbiAgICAgICAgLy8gb3ZlcndyaXR0ZW4gYnkgYW5vdGhlciBhc3NlcnRpb24sIG9yIHRoaXMgYXNzZXJ0aW9uIGlzIGJlaW5nIGludm9rZWRcbiAgICAgICAgLy8gZnJvbSBpbnNpZGUgb2YgYW5vdGhlciBhc3NlcnRpb24uIEluIHRoZSBmaXJzdCBjYXNlLCB0aGUgYHNzZmlgIGZsYWdcbiAgICAgICAgLy8gaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgdGhlIG92ZXJ3cml0aW5nIGFzc2VydGlvbi4gSW4gdGhlIHNlY29uZFxuICAgICAgICAvLyBjYXNlLCB0aGUgYHNzZmlgIGZsYWcgaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgdGhlIG91dGVyIGFzc2VydGlvbi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgcHJveHkgcHJvdGVjdGlvbiBpcyBlbmFibGVkLCB0aGVuIHRoZSBgc3NmaWAgZmxhZyBoYXMgYWxyZWFkeSBiZWVuXG4gICAgICAgIC8vIHNldCBieSB0aGUgcHJveHkgZ2V0dGVyLlxuICAgICAgICBpZiAoIWlzUHJveHlFbmFibGVkKCkgJiYgIWZsYWcodGhpcywgJ2xvY2tTc2ZpJykpIHtcbiAgICAgICAgICBmbGFnKHRoaXMsICdzc2ZpJywgb3ZlcndyaXRpbmdQcm9wZXJ0eUdldHRlcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXR0aW5nIHRoZSBgbG9ja1NzZmlgIGZsYWcgdG8gYHRydWVgIHByZXZlbnRzIHRoZSBvdmVyd3JpdHRlblxuICAgICAgICAvLyBhc3NlcnRpb24gZnJvbSBjaGFuZ2luZyB0aGUgYHNzZmlgIGZsYWcuIEJ5IHRoaXMgcG9pbnQsIHRoZSBgc3NmaWBcbiAgICAgICAgLy8gZmxhZyBpcyBhbHJlYWR5IHNldCB0byB0aGUgY29ycmVjdCBzdGFydGluZyBwb2ludCBmb3IgdGhpcyBhc3NlcnRpb24uXG4gICAgICAgIHZhciBvcmlnTG9ja1NzZmkgPSBmbGFnKHRoaXMsICdsb2NrU3NmaScpO1xuICAgICAgICBmbGFnKHRoaXMsICdsb2NrU3NmaScsIHRydWUpO1xuICAgICAgICB2YXIgcmVzdWx0ID0gZ2V0dGVyKF9zdXBlcikuY2FsbCh0aGlzKTtcbiAgICAgICAgZmxhZyh0aGlzLCAnbG9ja1NzZmknLCBvcmlnTG9ja1NzZmkpO1xuXG4gICAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbmV3QXNzZXJ0aW9uID0gbmV3IGNoYWkuQXNzZXJ0aW9uKCk7XG4gICAgICAgIHRyYW5zZmVyRmxhZ3ModGhpcywgbmV3QXNzZXJ0aW9uKTtcbiAgICAgICAgcmV0dXJuIG5ld0Fzc2VydGlvbjtcbiAgICAgIH1cbiAgICAsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KTtcbn07XG4iLCJ2YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xudmFyIGdldFByb3BlcnRpZXMgPSByZXF1aXJlKCcuL2dldFByb3BlcnRpZXMnKTtcbnZhciBpc1Byb3h5RW5hYmxlZCA9IHJlcXVpcmUoJy4vaXNQcm94eUVuYWJsZWQnKTtcblxuLyohXG4gKiBDaGFpIC0gcHJveGlmeSB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLnByb3hpZnkob2JqZWN0KVxuICpcbiAqIFJldHVybiBhIHByb3h5IG9mIGdpdmVuIG9iamVjdCB0aGF0IHRocm93cyBhbiBlcnJvciB3aGVuIGEgbm9uLWV4aXN0ZW50XG4gKiBwcm9wZXJ0eSBpcyByZWFkLiBCeSBkZWZhdWx0LCB0aGUgcm9vdCBjYXVzZSBpcyBhc3N1bWVkIHRvIGJlIGEgbWlzc3BlbGxlZFxuICogcHJvcGVydHksIGFuZCB0aHVzIGFuIGF0dGVtcHQgaXMgbWFkZSB0byBvZmZlciBhIHJlYXNvbmFibGUgc3VnZ2VzdGlvbiBmcm9tXG4gKiB0aGUgbGlzdCBvZiBleGlzdGluZyBwcm9wZXJ0aWVzLiBIb3dldmVyLCBpZiBhIG5vbkNoYWluYWJsZU1ldGhvZE5hbWUgaXNcbiAqIHByb3ZpZGVkLCB0aGVuIHRoZSByb290IGNhdXNlIGlzIGluc3RlYWQgYSBmYWlsdXJlIHRvIGludm9rZSBhIG5vbi1jaGFpbmFibGVcbiAqIG1ldGhvZCBwcmlvciB0byByZWFkaW5nIHRoZSBub24tZXhpc3RlbnQgcHJvcGVydHkuXG4gKiBcbiAqIElmIHByb3hpZXMgYXJlIHVuc3VwcG9ydGVkIG9yIGRpc2FibGVkIHZpYSB0aGUgdXNlcidzIENoYWkgY29uZmlnLCB0aGVuXG4gKiByZXR1cm4gb2JqZWN0IHdpdGhvdXQgbW9kaWZpY2F0aW9uLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBub25DaGFpbmFibGVNZXRob2ROYW1lXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSBwcm94aWZ5XG4gKi9cblxudmFyIGJ1aWx0aW5zID0gWydfX2ZsYWdzJywgJ19fbWV0aG9kcycsICdfb2JqJywgJ2Fzc2VydCddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHByb3hpZnkob2JqLCBub25DaGFpbmFibGVNZXRob2ROYW1lKSB7XG4gIGlmICghaXNQcm94eUVuYWJsZWQoKSkgcmV0dXJuIG9iajtcblxuICByZXR1cm4gbmV3IFByb3h5KG9iaiwge1xuICAgIGdldDogZnVuY3Rpb24gcHJveHlHZXR0ZXIodGFyZ2V0LCBwcm9wZXJ0eSkge1xuICAgICAgLy8gVGhpcyBjaGVjayBpcyBoZXJlIGJlY2F1c2Ugd2Ugc2hvdWxkIG5vdCB0aHJvdyBlcnJvcnMgb24gU3ltYm9sIHByb3BlcnRpZXNcbiAgICAgIC8vIHN1Y2ggYXMgYFN5bWJvbC50b1N0cmluZ1RhZ2AuXG4gICAgICAvLyBUaGUgdmFsdWVzIGZvciB3aGljaCBhbiBlcnJvciBzaG91bGQgYmUgdGhyb3duIGNhbiBiZSBjb25maWd1cmVkIHVzaW5nXG4gICAgICAvLyB0aGUgYGNvbmZpZy5wcm94eUV4Y2x1ZGVkS2V5c2Agc2V0dGluZy5cbiAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgY29uZmlnLnByb3h5RXhjbHVkZWRLZXlzLmluZGV4T2YocHJvcGVydHkpID09PSAtMSAmJlxuICAgICAgICAgICFSZWZsZWN0Lmhhcyh0YXJnZXQsIHByb3BlcnR5KSkge1xuICAgICAgICAvLyBTcGVjaWFsIG1lc3NhZ2UgZm9yIGludmFsaWQgcHJvcGVydHkgYWNjZXNzIG9mIG5vbi1jaGFpbmFibGUgbWV0aG9kcy5cbiAgICAgICAgaWYgKG5vbkNoYWluYWJsZU1ldGhvZE5hbWUpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBDaGFpIHByb3BlcnR5OiAnICsgbm9uQ2hhaW5hYmxlTWV0aG9kTmFtZSArICcuJyArXG4gICAgICAgICAgICBwcm9wZXJ0eSArICcuIFNlZSBkb2NzIGZvciBwcm9wZXIgdXNhZ2Ugb2YgXCInICtcbiAgICAgICAgICAgIG5vbkNoYWluYWJsZU1ldGhvZE5hbWUgKyAnXCIuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3JkZXJlZFByb3BlcnRpZXMgPSBnZXRQcm9wZXJ0aWVzKHRhcmdldCkuZmlsdGVyKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgICAgICAgcmV0dXJuICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KHByb3BlcnR5KSAmJlxuICAgICAgICAgICAgYnVpbHRpbnMuaW5kZXhPZihwcm9wZXJ0eSkgPT09IC0xO1xuICAgICAgICB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gc3RyaW5nRGlzdGFuY2UocHJvcGVydHksIGEpIC0gc3RyaW5nRGlzdGFuY2UocHJvcGVydHksIGIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAob3JkZXJlZFByb3BlcnRpZXMubGVuZ3RoICYmXG4gICAgICAgICAgICBzdHJpbmdEaXN0YW5jZShvcmRlcmVkUHJvcGVydGllc1swXSwgcHJvcGVydHkpIDwgNCkge1xuICAgICAgICAgIC8vIElmIHRoZSBwcm9wZXJ0eSBpcyByZWFzb25hYmx5IGNsb3NlIHRvIGFuIGV4aXN0aW5nIENoYWkgcHJvcGVydHksXG4gICAgICAgICAgLy8gc3VnZ2VzdCB0aGF0IHByb3BlcnR5IHRvIHRoZSB1c2VyLlxuICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIENoYWkgcHJvcGVydHk6ICcgKyBwcm9wZXJ0eSArXG4gICAgICAgICAgICAnLiBEaWQgeW91IG1lYW4gXCInICsgb3JkZXJlZFByb3BlcnRpZXNbMF0gKyAnXCI/Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgQ2hhaSBwcm9wZXJ0eTogJyArIHByb3BlcnR5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdGhpcyBwcm94eSBnZXR0ZXIgYXMgdGhlIHN0YXJ0aW5nIHBvaW50IGZvciByZW1vdmluZyBpbXBsZW1lbnRhdGlvblxuICAgICAgLy8gZnJhbWVzIGZyb20gdGhlIHN0YWNrIHRyYWNlIG9mIGEgZmFpbGVkIGFzc2VydGlvbi4gRm9yIHByb3BlcnR5XG4gICAgICAvLyBhc3NlcnRpb25zLCB0aGlzIHByZXZlbnRzIHRoZSBwcm94eSBnZXR0ZXIgZnJvbSBzaG93aW5nIHVwIGluIHRoZSBzdGFja1xuICAgICAgLy8gdHJhY2Ugc2luY2UgaXQncyBpbnZva2VkIGJlZm9yZSB0aGUgcHJvcGVydHkgZ2V0dGVyLiBGb3IgbWV0aG9kIGFuZFxuICAgICAgLy8gY2hhaW5hYmxlIG1ldGhvZCBhc3NlcnRpb25zLCB0aGlzIGZsYWcgd2lsbCBlbmQgdXAgZ2V0dGluZyBjaGFuZ2VkIHRvXG4gICAgICAvLyB0aGUgbWV0aG9kIHdyYXBwZXIsIHdoaWNoIGlzIGdvb2Qgc2luY2UgdGhpcyBmcmFtZSB3aWxsIG5vIGxvbmdlciBiZSBpblxuICAgICAgLy8gdGhlIHN0YWNrIG9uY2UgdGhlIG1ldGhvZCBpcyBpbnZva2VkLiBOb3RlIHRoYXQgQ2hhaSBidWlsdGluIGFzc2VydGlvblxuICAgICAgLy8gcHJvcGVydGllcyBzdWNoIGFzIGBfX2ZsYWdzYCBhcmUgc2tpcHBlZCBzaW5jZSB0aGlzIGlzIG9ubHkgbWVhbnQgdG9cbiAgICAgIC8vIGNhcHR1cmUgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIGFuIGFzc2VydGlvbi4gVGhpcyBzdGVwIGlzIGFsc28gc2tpcHBlZFxuICAgICAgLy8gaWYgdGhlIGBsb2NrU3NmaWAgZmxhZyBpcyBzZXQsIHRodXMgaW5kaWNhdGluZyB0aGF0IHRoaXMgYXNzZXJ0aW9uIGlzXG4gICAgICAvLyBiZWluZyBjYWxsZWQgZnJvbSB3aXRoaW4gYW5vdGhlciBhc3NlcnRpb24uIEluIHRoYXQgY2FzZSwgdGhlIGBzc2ZpYFxuICAgICAgLy8gZmxhZyBpcyBhbHJlYWR5IHNldCB0byB0aGUgb3V0ZXIgYXNzZXJ0aW9uJ3Mgc3RhcnRpbmcgcG9pbnQuXG4gICAgICBpZiAoYnVpbHRpbnMuaW5kZXhPZihwcm9wZXJ0eSkgPT09IC0xICYmICFmbGFnKHRhcmdldCwgJ2xvY2tTc2ZpJykpIHtcbiAgICAgICAgZmxhZyh0YXJnZXQsICdzc2ZpJywgcHJveHlHZXR0ZXIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUmVmbGVjdC5nZXQodGFyZ2V0LCBwcm9wZXJ0eSk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogIyBzdHJpbmdEaXN0YW5jZShzdHJBLCBzdHJCKVxuICogUmV0dXJuIHRoZSBMZXZlbnNodGVpbiBkaXN0YW5jZSBiZXR3ZWVuIHR3byBzdHJpbmdzLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0ckFcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJCXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBzdHJpbmcgZGlzdGFuY2UgYmV0d2VlbiBzdHJBIGFuZCBzdHJCXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzdHJpbmdEaXN0YW5jZShzdHJBLCBzdHJCLCBtZW1vKSB7XG4gIGlmICghbWVtbykge1xuICAgIC8vIGBtZW1vYCBpcyBhIHR3by1kaW1lbnNpb25hbCBhcnJheSBjb250YWluaW5nIGEgY2FjaGUgb2YgZGlzdGFuY2VzXG4gICAgLy8gbWVtb1tpXVtqXSBpcyB0aGUgZGlzdGFuY2UgYmV0d2VlbiBzdHJBLnNsaWNlKDAsIGkpIGFuZFxuICAgIC8vIHN0ckIuc2xpY2UoMCwgaikuXG4gICAgbWVtbyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0ckEubGVuZ3RoOyBpKyspIHtcbiAgICAgIG1lbW9baV0gPSBbXTtcbiAgICB9XG4gIH1cblxuICBpZiAoIW1lbW9bc3RyQS5sZW5ndGhdIHx8ICFtZW1vW3N0ckEubGVuZ3RoXVtzdHJCLmxlbmd0aF0pIHtcbiAgICBpZiAoc3RyQS5sZW5ndGggPT09IDAgfHwgc3RyQi5sZW5ndGggPT09IDApIHtcbiAgICAgIG1lbW9bc3RyQS5sZW5ndGhdW3N0ckIubGVuZ3RoXSA9IE1hdGgubWF4KHN0ckEubGVuZ3RoLCBzdHJCLmxlbmd0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lbW9bc3RyQS5sZW5ndGhdW3N0ckIubGVuZ3RoXSA9IE1hdGgubWluKFxuICAgICAgICBzdHJpbmdEaXN0YW5jZShzdHJBLnNsaWNlKDAsIC0xKSwgc3RyQiwgbWVtbykgKyAxLFxuICAgICAgICBzdHJpbmdEaXN0YW5jZShzdHJBLCBzdHJCLnNsaWNlKDAsIC0xKSwgbWVtbykgKyAxLFxuICAgICAgICBzdHJpbmdEaXN0YW5jZShzdHJBLnNsaWNlKDAsIC0xKSwgc3RyQi5zbGljZSgwLCAtMSksIG1lbW8pICtcbiAgICAgICAgICAoc3RyQS5zbGljZSgtMSkgPT09IHN0ckIuc2xpY2UoLTEpID8gMCA6IDEpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtZW1vW3N0ckEubGVuZ3RoXVtzdHJCLmxlbmd0aF07XG59XG4iLCIvKiFcbiAqIENoYWkgLSB0ZXN0IHV0aWxpdHlcbiAqIENvcHlyaWdodChjKSAyMDEyLTIwMTQgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG4gKiBNSVQgTGljZW5zZWRcbiAqL1xuXG4vKiFcbiAqIE1vZHVsZSBkZXBlbmRhbmNpZXNcbiAqL1xuXG52YXIgZmxhZyA9IHJlcXVpcmUoJy4vZmxhZycpO1xuXG4vKipcbiAqICMjIyAudGVzdChvYmplY3QsIGV4cHJlc3Npb24pXG4gKlxuICogVGVzdCBhbmQgb2JqZWN0IGZvciBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgKGNvbnN0cnVjdGVkIEFzc2VydGlvbilcbiAqIEBwYXJhbSB7QXJndW1lbnRzfSBjaGFpLkFzc2VydGlvbi5wcm90b3R5cGUuYXNzZXJ0IGFyZ3VtZW50c1xuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgdGVzdFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdGVzdChvYmosIGFyZ3MpIHtcbiAgdmFyIG5lZ2F0ZSA9IGZsYWcob2JqLCAnbmVnYXRlJylcbiAgICAsIGV4cHIgPSBhcmdzWzBdO1xuICByZXR1cm4gbmVnYXRlID8gIWV4cHIgOiBleHByO1xufTtcbiIsIi8qIVxuICogQ2hhaSAtIHRyYW5zZmVyRmxhZ3MgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNCBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogIyMjIC50cmFuc2ZlckZsYWdzKGFzc2VydGlvbiwgb2JqZWN0LCBpbmNsdWRlQWxsID0gdHJ1ZSlcbiAqXG4gKiBUcmFuc2ZlciBhbGwgdGhlIGZsYWdzIGZvciBgYXNzZXJ0aW9uYCB0byBgb2JqZWN0YC4gSWZcbiAqIGBpbmNsdWRlQWxsYCBpcyBzZXQgdG8gYGZhbHNlYCwgdGhlbiB0aGUgYmFzZSBDaGFpXG4gKiBhc3NlcnRpb24gZmxhZ3MgKG5hbWVseSBgb2JqZWN0YCwgYHNzZmlgLCBgbG9ja1NzZmlgLFxuICogYW5kIGBtZXNzYWdlYCkgd2lsbCBub3QgYmUgdHJhbnNmZXJyZWQuXG4gKlxuICpcbiAqICAgICB2YXIgbmV3QXNzZXJ0aW9uID0gbmV3IEFzc2VydGlvbigpO1xuICogICAgIHV0aWxzLnRyYW5zZmVyRmxhZ3MoYXNzZXJ0aW9uLCBuZXdBc3NlcnRpb24pO1xuICpcbiAqICAgICB2YXIgYW5vdGhlckFzc2VyaXRvbiA9IG5ldyBBc3NlcnRpb24obXlPYmopO1xuICogICAgIHV0aWxzLnRyYW5zZmVyRmxhZ3MoYXNzZXJ0aW9uLCBhbm90aGVyQXNzZXJ0aW9uLCBmYWxzZSk7XG4gKlxuICogQHBhcmFtIHtBc3NlcnRpb259IGFzc2VydGlvbiB0aGUgYXNzZXJ0aW9uIHRvIHRyYW5zZmVyIHRoZSBmbGFncyBmcm9tXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IHRoZSBvYmplY3QgdG8gdHJhbnNmZXIgdGhlIGZsYWdzIHRvOyB1c3VhbGx5IGEgbmV3IGFzc2VydGlvblxuICogQHBhcmFtIHtCb29sZWFufSBpbmNsdWRlQWxsXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAbmFtZSB0cmFuc2ZlckZsYWdzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRyYW5zZmVyRmxhZ3MoYXNzZXJ0aW9uLCBvYmplY3QsIGluY2x1ZGVBbGwpIHtcbiAgdmFyIGZsYWdzID0gYXNzZXJ0aW9uLl9fZmxhZ3MgfHwgKGFzc2VydGlvbi5fX2ZsYWdzID0gT2JqZWN0LmNyZWF0ZShudWxsKSk7XG5cbiAgaWYgKCFvYmplY3QuX19mbGFncykge1xuICAgIG9iamVjdC5fX2ZsYWdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgfVxuXG4gIGluY2x1ZGVBbGwgPSBhcmd1bWVudHMubGVuZ3RoID09PSAzID8gaW5jbHVkZUFsbCA6IHRydWU7XG5cbiAgZm9yICh2YXIgZmxhZyBpbiBmbGFncykge1xuICAgIGlmIChpbmNsdWRlQWxsIHx8XG4gICAgICAgIChmbGFnICE9PSAnb2JqZWN0JyAmJiBmbGFnICE9PSAnc3NmaScgJiYgZmxhZyAhPT0gJ2xvY2tTc2ZpJyAmJiBmbGFnICE9ICdtZXNzYWdlJykpIHtcbiAgICAgIG9iamVjdC5fX2ZsYWdzW2ZsYWddID0gZmxhZ3NbZmxhZ107XG4gICAgfVxuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiAhXG4gKiBDaGFpIC0gY2hlY2tFcnJvciB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE2IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogTUlUIExpY2Vuc2VkXG4gKi9cblxuLyoqXG4gKiAjIyMgLmNoZWNrRXJyb3JcbiAqXG4gKiBDaGVja3MgdGhhdCBhbiBlcnJvciBjb25mb3JtcyB0byBhIGdpdmVuIHNldCBvZiBjcml0ZXJpYSBhbmQvb3IgcmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IGl0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuLyoqXG4gKiAjIyMgLmNvbXBhdGlibGVJbnN0YW5jZSh0aHJvd24sIGVycm9yTGlrZSlcbiAqXG4gKiBDaGVja3MgaWYgdHdvIGluc3RhbmNlcyBhcmUgY29tcGF0aWJsZSAoc3RyaWN0IGVxdWFsKS5cbiAqIFJldHVybnMgZmFsc2UgaWYgZXJyb3JMaWtlIGlzIG5vdCBhbiBpbnN0YW5jZSBvZiBFcnJvciwgYmVjYXVzZSBpbnN0YW5jZXNcbiAqIGNhbiBvbmx5IGJlIGNvbXBhdGlibGUgaWYgdGhleSdyZSBib3RoIGVycm9yIGluc3RhbmNlcy5cbiAqXG4gKiBAbmFtZSBjb21wYXRpYmxlSW5zdGFuY2VcbiAqIEBwYXJhbSB7RXJyb3J9IHRocm93biBlcnJvclxuICogQHBhcmFtIHtFcnJvcnxFcnJvckNvbnN0cnVjdG9yfSBlcnJvckxpa2Ugb2JqZWN0IHRvIGNvbXBhcmUgYWdhaW5zdFxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjb21wYXRpYmxlSW5zdGFuY2UodGhyb3duLCBlcnJvckxpa2UpIHtcbiAgcmV0dXJuIGVycm9yTGlrZSBpbnN0YW5jZW9mIEVycm9yICYmIHRocm93biA9PT0gZXJyb3JMaWtlO1xufVxuXG4vKipcbiAqICMjIyAuY29tcGF0aWJsZUNvbnN0cnVjdG9yKHRocm93biwgZXJyb3JMaWtlKVxuICpcbiAqIENoZWNrcyBpZiB0d28gY29uc3RydWN0b3JzIGFyZSBjb21wYXRpYmxlLlxuICogVGhpcyBmdW5jdGlvbiBjYW4gcmVjZWl2ZSBlaXRoZXIgYW4gZXJyb3IgY29uc3RydWN0b3Igb3JcbiAqIGFuIGVycm9yIGluc3RhbmNlIGFzIHRoZSBgZXJyb3JMaWtlYCBhcmd1bWVudC5cbiAqIENvbnN0cnVjdG9ycyBhcmUgY29tcGF0aWJsZSBpZiB0aGV5J3JlIHRoZSBzYW1lIG9yIGlmIG9uZSBpc1xuICogYW4gaW5zdGFuY2Ugb2YgYW5vdGhlci5cbiAqXG4gKiBAbmFtZSBjb21wYXRpYmxlQ29uc3RydWN0b3JcbiAqIEBwYXJhbSB7RXJyb3J9IHRocm93biBlcnJvclxuICogQHBhcmFtIHtFcnJvcnxFcnJvckNvbnN0cnVjdG9yfSBlcnJvckxpa2Ugb2JqZWN0IHRvIGNvbXBhcmUgYWdhaW5zdFxuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBjb21wYXRpYmxlQ29uc3RydWN0b3IodGhyb3duLCBlcnJvckxpa2UpIHtcbiAgaWYgKGVycm9yTGlrZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgLy8gSWYgYGVycm9yTGlrZWAgaXMgYW4gaW5zdGFuY2Ugb2YgYW55IGVycm9yIHdlIGNvbXBhcmUgdGhlaXIgY29uc3RydWN0b3JzXG4gICAgcmV0dXJuIHRocm93bi5jb25zdHJ1Y3RvciA9PT0gZXJyb3JMaWtlLmNvbnN0cnVjdG9yIHx8IHRocm93biBpbnN0YW5jZW9mIGVycm9yTGlrZS5jb25zdHJ1Y3RvcjtcbiAgfSBlbHNlIGlmIChlcnJvckxpa2UucHJvdG90eXBlIGluc3RhbmNlb2YgRXJyb3IgfHwgZXJyb3JMaWtlID09PSBFcnJvcikge1xuICAgIC8vIElmIGBlcnJvckxpa2VgIGlzIGEgY29uc3RydWN0b3IgdGhhdCBpbmhlcml0cyBmcm9tIEVycm9yLCB3ZSBjb21wYXJlIGB0aHJvd25gIHRvIGBlcnJvckxpa2VgIGRpcmVjdGx5XG4gICAgcmV0dXJuIHRocm93bi5jb25zdHJ1Y3RvciA9PT0gZXJyb3JMaWtlIHx8IHRocm93biBpbnN0YW5jZW9mIGVycm9yTGlrZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiAjIyMgLmNvbXBhdGlibGVNZXNzYWdlKHRocm93biwgZXJyTWF0Y2hlcilcbiAqXG4gKiBDaGVja3MgaWYgYW4gZXJyb3IncyBtZXNzYWdlIGlzIGNvbXBhdGlibGUgd2l0aCBhIG1hdGNoZXIgKFN0cmluZyBvciBSZWdFeHApLlxuICogSWYgdGhlIG1lc3NhZ2UgY29udGFpbnMgdGhlIFN0cmluZyBvciBwYXNzZXMgdGhlIFJlZ0V4cCB0ZXN0LFxuICogaXQgaXMgY29uc2lkZXJlZCBjb21wYXRpYmxlLlxuICpcbiAqIEBuYW1lIGNvbXBhdGlibGVNZXNzYWdlXG4gKiBAcGFyYW0ge0Vycm9yfSB0aHJvd24gZXJyb3JcbiAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXJyTWF0Y2hlciB0byBsb29rIGZvciBpbnRvIHRoZSBtZXNzYWdlXG4gKiBAbmFtZXNwYWNlIFV0aWxzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGNvbXBhdGlibGVNZXNzYWdlKHRocm93biwgZXJyTWF0Y2hlcikge1xuICB2YXIgY29tcGFyaXNvblN0cmluZyA9IHR5cGVvZiB0aHJvd24gPT09ICdzdHJpbmcnID8gdGhyb3duIDogdGhyb3duLm1lc3NhZ2U7XG4gIGlmIChlcnJNYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIGVyck1hdGNoZXIudGVzdChjb21wYXJpc29uU3RyaW5nKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXJyTWF0Y2hlciA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gY29tcGFyaXNvblN0cmluZy5pbmRleE9mKGVyck1hdGNoZXIpICE9PSAtMTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogIyMjIC5nZXRGdW5jdGlvbk5hbWUoY29uc3RydWN0b3JGbilcbiAqXG4gKiBSZXR1cm5zIHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24uXG4gKiBUaGlzIGFsc28gaW5jbHVkZXMgYSBwb2x5ZmlsbCBmdW5jdGlvbiBpZiBgY29uc3RydWN0b3JGbi5uYW1lYCBpcyBub3QgZGVmaW5lZC5cbiAqXG4gKiBAbmFtZSBnZXRGdW5jdGlvbk5hbWVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbnN0cnVjdG9yRm5cbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciBmdW5jdGlvbk5hbWVNYXRjaCA9IC9cXHMqZnVuY3Rpb24oPzpcXHN8XFxzKlxcL1xcKlteKD86KlxcLyldK1xcKlxcL1xccyopKihbXlxcKFxcL10rKS87XG5mdW5jdGlvbiBnZXRGdW5jdGlvbk5hbWUoY29uc3RydWN0b3JGbikge1xuICB2YXIgbmFtZSA9ICcnO1xuICBpZiAodHlwZW9mIGNvbnN0cnVjdG9yRm4ubmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBIZXJlIHdlIHJ1biBhIHBvbHlmaWxsIGlmIGNvbnN0cnVjdG9yRm4ubmFtZSBpcyBub3QgZGVmaW5lZFxuICAgIHZhciBtYXRjaCA9IFN0cmluZyhjb25zdHJ1Y3RvckZuKS5tYXRjaChmdW5jdGlvbk5hbWVNYXRjaCk7XG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBuYW1lID0gbWF0Y2hbMV07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG5hbWUgPSBjb25zdHJ1Y3RvckZuLm5hbWU7XG4gIH1cblxuICByZXR1cm4gbmFtZTtcbn1cblxuLyoqXG4gKiAjIyMgLmdldENvbnN0cnVjdG9yTmFtZShlcnJvckxpa2UpXG4gKlxuICogR2V0cyB0aGUgY29uc3RydWN0b3IgbmFtZSBmb3IgYW4gRXJyb3IgaW5zdGFuY2Ugb3IgY29uc3RydWN0b3IgaXRzZWxmLlxuICpcbiAqIEBuYW1lIGdldENvbnN0cnVjdG9yTmFtZVxuICogQHBhcmFtIHtFcnJvcnxFcnJvckNvbnN0cnVjdG9yfSBlcnJvckxpa2VcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZ2V0Q29uc3RydWN0b3JOYW1lKGVycm9yTGlrZSkge1xuICB2YXIgY29uc3RydWN0b3JOYW1lID0gZXJyb3JMaWtlO1xuICBpZiAoZXJyb3JMaWtlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICBjb25zdHJ1Y3Rvck5hbWUgPSBnZXRGdW5jdGlvbk5hbWUoZXJyb3JMaWtlLmNvbnN0cnVjdG9yKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXJyb3JMaWtlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gSWYgYGVycmAgaXMgbm90IGFuIGluc3RhbmNlIG9mIEVycm9yIGl0IGlzIGFuIGVycm9yIGNvbnN0cnVjdG9yIGl0c2VsZiBvciBhbm90aGVyIGZ1bmN0aW9uLlxuICAgIC8vIElmIHdlJ3ZlIGdvdCBhIGNvbW1vbiBmdW5jdGlvbiB3ZSBnZXQgaXRzIG5hbWUsIG90aGVyd2lzZSB3ZSBtYXkgbmVlZCB0byBjcmVhdGUgYSBuZXcgaW5zdGFuY2VcbiAgICAvLyBvZiB0aGUgZXJyb3IganVzdCBpbiBjYXNlIGl0J3MgYSBwb29ybHktY29uc3RydWN0ZWQgZXJyb3IuIFBsZWFzZSBzZWUgY2hhaWpzL2NoYWkvaXNzdWVzLzQ1IHRvIGtub3cgbW9yZS5cbiAgICBjb25zdHJ1Y3Rvck5hbWUgPSBnZXRGdW5jdGlvbk5hbWUoZXJyb3JMaWtlKS50cmltKCkgfHxcbiAgICAgICAgZ2V0RnVuY3Rpb25OYW1lKG5ldyBlcnJvckxpa2UoKSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICB9XG5cbiAgcmV0dXJuIGNvbnN0cnVjdG9yTmFtZTtcbn1cblxuLyoqXG4gKiAjIyMgLmdldE1lc3NhZ2UoZXJyb3JMaWtlKVxuICpcbiAqIEdldHMgdGhlIGVycm9yIG1lc3NhZ2UgZnJvbSBhbiBlcnJvci5cbiAqIElmIGBlcnJgIGlzIGEgU3RyaW5nIGl0c2VsZiwgd2UgcmV0dXJuIGl0LlxuICogSWYgdGhlIGVycm9yIGhhcyBubyBtZXNzYWdlLCB3ZSByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLlxuICpcbiAqIEBuYW1lIGdldE1lc3NhZ2VcbiAqIEBwYXJhbSB7RXJyb3J8U3RyaW5nfSBlcnJvckxpa2VcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShlcnJvckxpa2UpIHtcbiAgdmFyIG1zZyA9ICcnO1xuICBpZiAoZXJyb3JMaWtlICYmIGVycm9yTGlrZS5tZXNzYWdlKSB7XG4gICAgbXNnID0gZXJyb3JMaWtlLm1lc3NhZ2U7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGVycm9yTGlrZSA9PT0gJ3N0cmluZycpIHtcbiAgICBtc2cgPSBlcnJvckxpa2U7XG4gIH1cblxuICByZXR1cm4gbXNnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29tcGF0aWJsZUluc3RhbmNlOiBjb21wYXRpYmxlSW5zdGFuY2UsXG4gIGNvbXBhdGlibGVDb25zdHJ1Y3RvcjogY29tcGF0aWJsZUNvbnN0cnVjdG9yLFxuICBjb21wYXRpYmxlTWVzc2FnZTogY29tcGF0aWJsZU1lc3NhZ2UsXG4gIGdldE1lc3NhZ2U6IGdldE1lc3NhZ2UsXG4gIGdldENvbnN0cnVjdG9yTmFtZTogZ2V0Q29uc3RydWN0b3JOYW1lLFxufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGdsb2JhbHMgU3ltYm9sOiBmYWxzZSwgVWludDhBcnJheTogZmFsc2UsIFdlYWtNYXA6IGZhbHNlICovXG4vKiFcbiAqIGRlZXAtZXFsXG4gKiBDb3B5cmlnaHQoYykgMjAxMyBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbnZhciB0eXBlID0gcmVxdWlyZSgndHlwZS1kZXRlY3QnKTtcbmZ1bmN0aW9uIEZha2VNYXAoKSB7XG4gIHRoaXMuX2tleSA9ICdjaGFpL2RlZXAtZXFsX18nICsgTWF0aC5yYW5kb20oKSArIERhdGUubm93KCk7XG59XG5cbkZha2VNYXAucHJvdG90eXBlID0ge1xuICBnZXQ6IGZ1bmN0aW9uIGdldE1hcChrZXkpIHtcbiAgICByZXR1cm4ga2V5W3RoaXMuX2tleV07XG4gIH0sXG4gIHNldDogZnVuY3Rpb24gc2V0TWFwKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoT2JqZWN0LmlzRXh0ZW5zaWJsZShrZXkpKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoa2V5LCB0aGlzLl9rZXksIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG59O1xuXG52YXIgTWVtb2l6ZU1hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nID8gV2Vha01hcCA6IEZha2VNYXA7XG4vKiFcbiAqIENoZWNrIHRvIHNlZSBpZiB0aGUgTWVtb2l6ZU1hcCBoYXMgcmVjb3JkZWQgYSByZXN1bHQgb2YgdGhlIHR3byBvcGVyYW5kc1xuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtNaXhlZH0gcmlnaHRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtNZW1vaXplTWFwfSBtZW1vaXplTWFwXG4gKiBAcmV0dXJucyB7Qm9vbGVhbnxudWxsfSByZXN1bHRcbiovXG5mdW5jdGlvbiBtZW1vaXplQ29tcGFyZShsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG1lbW9pemVNYXApIHtcbiAgLy8gVGVjaG5pY2FsbHksIFdlYWtNYXAga2V5cyBjYW4gKm9ubHkqIGJlIG9iamVjdHMsIG5vdCBwcmltaXRpdmVzLlxuICBpZiAoIW1lbW9pemVNYXAgfHwgaXNQcmltaXRpdmUobGVmdEhhbmRPcGVyYW5kKSB8fCBpc1ByaW1pdGl2ZShyaWdodEhhbmRPcGVyYW5kKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZhciBsZWZ0SGFuZE1hcCA9IG1lbW9pemVNYXAuZ2V0KGxlZnRIYW5kT3BlcmFuZCk7XG4gIGlmIChsZWZ0SGFuZE1hcCkge1xuICAgIHZhciByZXN1bHQgPSBsZWZ0SGFuZE1hcC5nZXQocmlnaHRIYW5kT3BlcmFuZCk7XG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qIVxuICogU2V0IHRoZSByZXN1bHQgb2YgdGhlIGVxdWFsaXR5IGludG8gdGhlIE1lbW9pemVNYXBcbiAqXG4gKiBAcGFyYW0ge01peGVkfSBsZWZ0SGFuZE9wZXJhbmRcbiAqIEBwYXJhbSB7TWl4ZWR9IHJpZ2h0SGFuZE9wZXJhbmRcbiAqIEBwYXJhbSB7TWVtb2l6ZU1hcH0gbWVtb2l6ZU1hcFxuICogQHBhcmFtIHtCb29sZWFufSByZXN1bHRcbiovXG5mdW5jdGlvbiBtZW1vaXplU2V0KGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCwgbWVtb2l6ZU1hcCwgcmVzdWx0KSB7XG4gIC8vIFRlY2huaWNhbGx5LCBXZWFrTWFwIGtleXMgY2FuICpvbmx5KiBiZSBvYmplY3RzLCBub3QgcHJpbWl0aXZlcy5cbiAgaWYgKCFtZW1vaXplTWFwIHx8IGlzUHJpbWl0aXZlKGxlZnRIYW5kT3BlcmFuZCkgfHwgaXNQcmltaXRpdmUocmlnaHRIYW5kT3BlcmFuZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGxlZnRIYW5kTWFwID0gbWVtb2l6ZU1hcC5nZXQobGVmdEhhbmRPcGVyYW5kKTtcbiAgaWYgKGxlZnRIYW5kTWFwKSB7XG4gICAgbGVmdEhhbmRNYXAuc2V0KHJpZ2h0SGFuZE9wZXJhbmQsIHJlc3VsdCk7XG4gIH0gZWxzZSB7XG4gICAgbGVmdEhhbmRNYXAgPSBuZXcgTWVtb2l6ZU1hcCgpO1xuICAgIGxlZnRIYW5kTWFwLnNldChyaWdodEhhbmRPcGVyYW5kLCByZXN1bHQpO1xuICAgIG1lbW9pemVNYXAuc2V0KGxlZnRIYW5kT3BlcmFuZCwgbGVmdEhhbmRNYXApO1xuICB9XG59XG5cbi8qIVxuICogUHJpbWFyeSBFeHBvcnRcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZXBFcXVhbDtcbm1vZHVsZS5leHBvcnRzLk1lbW9pemVNYXAgPSBNZW1vaXplTWFwO1xuXG4vKipcbiAqIEFzc2VydCBkZWVwbHkgbmVzdGVkIHNhbWVWYWx1ZSBlcXVhbGl0eSBiZXR3ZWVuIHR3byBvYmplY3RzIG9mIGFueSB0eXBlLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtNaXhlZH0gcmlnaHRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAob3B0aW9uYWwpIEFkZGl0aW9uYWwgb3B0aW9uc1xuICogQHBhcmFtIHtBcnJheX0gW29wdGlvbnMuY29tcGFyYXRvcl0gKG9wdGlvbmFsKSBPdmVycmlkZSBkZWZhdWx0IGFsZ29yaXRobSwgZGV0ZXJtaW5pbmcgY3VzdG9tIGVxdWFsaXR5LlxuICogQHBhcmFtIHtBcnJheX0gW29wdGlvbnMubWVtb2l6ZV0gKG9wdGlvbmFsKSBQcm92aWRlIGEgY3VzdG9tIG1lbW9pemF0aW9uIG9iamVjdCB3aGljaCB3aWxsIGNhY2hlIHRoZSByZXN1bHRzIG9mXG4gICAgY29tcGxleCBvYmplY3RzIGZvciBhIHNwZWVkIGJvb3N0LiBCeSBwYXNzaW5nIGBmYWxzZWAgeW91IGNhbiBkaXNhYmxlIG1lbW9pemF0aW9uLCBidXQgdGhpcyB3aWxsIGNhdXNlIGNpcmN1bGFyXG4gICAgcmVmZXJlbmNlcyB0byBibG93IHRoZSBzdGFjay5cbiAqIEByZXR1cm4ge0Jvb2xlYW59IGVxdWFsIG1hdGNoXG4gKi9cbmZ1bmN0aW9uIGRlZXBFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgLy8gSWYgd2UgaGF2ZSBhIGNvbXBhcmF0b3IsIHdlIGNhbid0IGFzc3VtZSBhbnl0aGluZzsgc28gYmFpbCB0byBpdHMgY2hlY2sgZmlyc3QuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY29tcGFyYXRvcikge1xuICAgIHJldHVybiBleHRlbnNpdmVEZWVwRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zKTtcbiAgfVxuXG4gIHZhciBzaW1wbGVSZXN1bHQgPSBzaW1wbGVFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQpO1xuICBpZiAoc2ltcGxlUmVzdWx0ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIHNpbXBsZVJlc3VsdDtcbiAgfVxuXG4gIC8vIERlZXBlciBjb21wYXJpc29ucyBhcmUgcHVzaGVkIHRocm91Z2ggdG8gYSBsYXJnZXIgZnVuY3Rpb25cbiAgcmV0dXJuIGV4dGVuc2l2ZURlZXBFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIE1hbnkgY29tcGFyaXNvbnMgY2FuIGJlIGNhbmNlbGVkIG91dCBlYXJseSB2aWEgc2ltcGxlIGVxdWFsaXR5IG9yIHByaW1pdGl2ZSBjaGVja3MuXG4gKiBAcGFyYW0ge01peGVkfSBsZWZ0SGFuZE9wZXJhbmRcbiAqIEBwYXJhbSB7TWl4ZWR9IHJpZ2h0SGFuZE9wZXJhbmRcbiAqIEByZXR1cm4ge0Jvb2xlYW58bnVsbH0gZXF1YWwgbWF0Y2hcbiAqL1xuZnVuY3Rpb24gc2ltcGxlRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kKSB7XG4gIC8vIEVxdWFsIHJlZmVyZW5jZXMgKGV4Y2VwdCBmb3IgTnVtYmVycykgY2FuIGJlIHJldHVybmVkIGVhcmx5XG4gIGlmIChsZWZ0SGFuZE9wZXJhbmQgPT09IHJpZ2h0SGFuZE9wZXJhbmQpIHtcbiAgICAvLyBIYW5kbGUgKy0wIGNhc2VzXG4gICAgcmV0dXJuIGxlZnRIYW5kT3BlcmFuZCAhPT0gMCB8fCAxIC8gbGVmdEhhbmRPcGVyYW5kID09PSAxIC8gcmlnaHRIYW5kT3BlcmFuZDtcbiAgfVxuXG4gIC8vIGhhbmRsZSBOYU4gY2FzZXNcbiAgaWYgKFxuICAgIGxlZnRIYW5kT3BlcmFuZCAhPT0gbGVmdEhhbmRPcGVyYW5kICYmIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG4gICAgcmlnaHRIYW5kT3BlcmFuZCAhPT0gcmlnaHRIYW5kT3BlcmFuZCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxuICApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIEFueXRoaW5nIHRoYXQgaXMgbm90IGFuICdvYmplY3QnLCBpLmUuIHN5bWJvbHMsIGZ1bmN0aW9ucywgYm9vbGVhbnMsIG51bWJlcnMsXG4gIC8vIHN0cmluZ3MsIGFuZCB1bmRlZmluZWQsIGNhbiBiZSBjb21wYXJlZCBieSByZWZlcmVuY2UuXG4gIGlmIChpc1ByaW1pdGl2ZShsZWZ0SGFuZE9wZXJhbmQpIHx8IGlzUHJpbWl0aXZlKHJpZ2h0SGFuZE9wZXJhbmQpKSB7XG4gICAgLy8gRWFzeSBvdXQgYi9jIGl0IHdvdWxkIGhhdmUgcGFzc2VkIHRoZSBmaXJzdCBlcXVhbGl0eSBjaGVja1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyohXG4gKiBUaGUgbWFpbiBsb2dpYyBvZiB0aGUgYGRlZXBFcXVhbGAgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gbGVmdEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge01peGVkfSByaWdodEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIChvcHRpb25hbCkgQWRkaXRpb25hbCBvcHRpb25zXG4gKiBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5jb21wYXJhdG9yXSAob3B0aW9uYWwpIE92ZXJyaWRlIGRlZmF1bHQgYWxnb3JpdGhtLCBkZXRlcm1pbmluZyBjdXN0b20gZXF1YWxpdHkuXG4gKiBAcGFyYW0ge0FycmF5fSBbb3B0aW9ucy5tZW1vaXplXSAob3B0aW9uYWwpIFByb3ZpZGUgYSBjdXN0b20gbWVtb2l6YXRpb24gb2JqZWN0IHdoaWNoIHdpbGwgY2FjaGUgdGhlIHJlc3VsdHMgb2ZcbiAgICBjb21wbGV4IG9iamVjdHMgZm9yIGEgc3BlZWQgYm9vc3QuIEJ5IHBhc3NpbmcgYGZhbHNlYCB5b3UgY2FuIGRpc2FibGUgbWVtb2l6YXRpb24sIGJ1dCB0aGlzIHdpbGwgY2F1c2UgY2lyY3VsYXJcbiAgICByZWZlcmVuY2VzIHRvIGJsb3cgdGhlIHN0YWNrLlxuICogQHJldHVybiB7Qm9vbGVhbn0gZXF1YWwgbWF0Y2hcbiovXG5mdW5jdGlvbiBleHRlbnNpdmVEZWVwRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLm1lbW9pemUgPSBvcHRpb25zLm1lbW9pemUgPT09IGZhbHNlID8gZmFsc2UgOiBvcHRpb25zLm1lbW9pemUgfHwgbmV3IE1lbW9pemVNYXAoKTtcbiAgdmFyIGNvbXBhcmF0b3IgPSBvcHRpb25zICYmIG9wdGlvbnMuY29tcGFyYXRvcjtcblxuICAvLyBDaGVjayBpZiBhIG1lbW9pemVkIHJlc3VsdCBleGlzdHMuXG4gIHZhciBtZW1vaXplUmVzdWx0TGVmdCA9IG1lbW9pemVDb21wYXJlKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCwgb3B0aW9ucy5tZW1vaXplKTtcbiAgaWYgKG1lbW9pemVSZXN1bHRMZWZ0ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIG1lbW9pemVSZXN1bHRMZWZ0O1xuICB9XG4gIHZhciBtZW1vaXplUmVzdWx0UmlnaHQgPSBtZW1vaXplQ29tcGFyZShyaWdodEhhbmRPcGVyYW5kLCBsZWZ0SGFuZE9wZXJhbmQsIG9wdGlvbnMubWVtb2l6ZSk7XG4gIGlmIChtZW1vaXplUmVzdWx0UmlnaHQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gbWVtb2l6ZVJlc3VsdFJpZ2h0O1xuICB9XG5cbiAgLy8gSWYgYSBjb21wYXJhdG9yIGlzIHByZXNlbnQsIHVzZSBpdC5cbiAgaWYgKGNvbXBhcmF0b3IpIHtcbiAgICB2YXIgY29tcGFyYXRvclJlc3VsdCA9IGNvbXBhcmF0b3IobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kKTtcbiAgICAvLyBDb21wYXJhdG9ycyBtYXkgcmV0dXJuIG51bGwsIGluIHdoaWNoIGNhc2Ugd2Ugd2FudCB0byBnbyBiYWNrIHRvIGRlZmF1bHQgYmVoYXZpb3IuXG4gICAgaWYgKGNvbXBhcmF0b3JSZXN1bHQgPT09IGZhbHNlIHx8IGNvbXBhcmF0b3JSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIG1lbW9pemVTZXQobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zLm1lbW9pemUsIGNvbXBhcmF0b3JSZXN1bHQpO1xuICAgICAgcmV0dXJuIGNvbXBhcmF0b3JSZXN1bHQ7XG4gICAgfVxuICAgIC8vIFRvIGFsbG93IGNvbXBhcmF0b3JzIHRvIG92ZXJyaWRlICphbnkqIGJlaGF2aW9yLCB3ZSByYW4gdGhlbSBmaXJzdC4gU2luY2UgaXQgZGlkbid0IGRlY2lkZVxuICAgIC8vIHdoYXQgdG8gZG8sIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRvIHJldHVybiB0aGUgYmFzaWMgdGVzdHMgZmlyc3QgYmVmb3JlIHdlIG1vdmUgb24uXG4gICAgdmFyIHNpbXBsZVJlc3VsdCA9IHNpbXBsZUVxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCk7XG4gICAgaWYgKHNpbXBsZVJlc3VsdCAhPT0gbnVsbCkge1xuICAgICAgLy8gRG9uJ3QgbWVtb2l6ZSB0aGlzLCBpdCB0YWtlcyBsb25nZXIgdG8gc2V0L3JldHJpZXZlIHRoYW4gdG8ganVzdCBjb21wYXJlLlxuICAgICAgcmV0dXJuIHNpbXBsZVJlc3VsdDtcbiAgICB9XG4gIH1cblxuICB2YXIgbGVmdEhhbmRUeXBlID0gdHlwZShsZWZ0SGFuZE9wZXJhbmQpO1xuICBpZiAobGVmdEhhbmRUeXBlICE9PSB0eXBlKHJpZ2h0SGFuZE9wZXJhbmQpKSB7XG4gICAgbWVtb2l6ZVNldChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMubWVtb2l6ZSwgZmFsc2UpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFRlbXBvcmFyaWx5IHNldCB0aGUgb3BlcmFuZHMgaW4gdGhlIG1lbW9pemUgb2JqZWN0IHRvIHByZXZlbnQgYmxvd2luZyB0aGUgc3RhY2tcbiAgbWVtb2l6ZVNldChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMubWVtb2l6ZSwgdHJ1ZSk7XG5cbiAgdmFyIHJlc3VsdCA9IGV4dGVuc2l2ZURlZXBFcXVhbEJ5VHlwZShsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIGxlZnRIYW5kVHlwZSwgb3B0aW9ucyk7XG4gIG1lbW9pemVTZXQobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zLm1lbW9pemUsIHJlc3VsdCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGV4dGVuc2l2ZURlZXBFcXVhbEJ5VHlwZShsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIGxlZnRIYW5kVHlwZSwgb3B0aW9ucykge1xuICBzd2l0Y2ggKGxlZnRIYW5kVHlwZSkge1xuICAgIGNhc2UgJ1N0cmluZyc6XG4gICAgY2FzZSAnTnVtYmVyJzpcbiAgICBjYXNlICdCb29sZWFuJzpcbiAgICBjYXNlICdEYXRlJzpcbiAgICAgIC8vIElmIHRoZXNlIHR5cGVzIGFyZSB0aGVpciBpbnN0YW5jZSB0eXBlcyAoZS5nLiBgbmV3IE51bWJlcmApIHRoZW4gcmUtZGVlcEVxdWFsIGFnYWluc3QgdGhlaXIgdmFsdWVzXG4gICAgICByZXR1cm4gZGVlcEVxdWFsKGxlZnRIYW5kT3BlcmFuZC52YWx1ZU9mKCksIHJpZ2h0SGFuZE9wZXJhbmQudmFsdWVPZigpKTtcbiAgICBjYXNlICdQcm9taXNlJzpcbiAgICBjYXNlICdTeW1ib2wnOlxuICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICBjYXNlICdXZWFrTWFwJzpcbiAgICBjYXNlICdXZWFrU2V0JzpcbiAgICBjYXNlICdFcnJvcic6XG4gICAgICByZXR1cm4gbGVmdEhhbmRPcGVyYW5kID09PSByaWdodEhhbmRPcGVyYW5kO1xuICAgIGNhc2UgJ0FyZ3VtZW50cyc6XG4gICAgY2FzZSAnSW50OEFycmF5JzpcbiAgICBjYXNlICdVaW50OEFycmF5JzpcbiAgICBjYXNlICdVaW50OENsYW1wZWRBcnJheSc6XG4gICAgY2FzZSAnSW50MTZBcnJheSc6XG4gICAgY2FzZSAnVWludDE2QXJyYXknOlxuICAgIGNhc2UgJ0ludDMyQXJyYXknOlxuICAgIGNhc2UgJ1VpbnQzMkFycmF5JzpcbiAgICBjYXNlICdGbG9hdDMyQXJyYXknOlxuICAgIGNhc2UgJ0Zsb2F0NjRBcnJheSc6XG4gICAgY2FzZSAnQXJyYXknOlxuICAgICAgcmV0dXJuIGl0ZXJhYmxlRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zKTtcbiAgICBjYXNlICdSZWdFeHAnOlxuICAgICAgcmV0dXJuIHJlZ2V4cEVxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCk7XG4gICAgY2FzZSAnR2VuZXJhdG9yJzpcbiAgICAgIHJldHVybiBnZW5lcmF0b3JFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpO1xuICAgIGNhc2UgJ0RhdGFWaWV3JzpcbiAgICAgIHJldHVybiBpdGVyYWJsZUVxdWFsKG5ldyBVaW50OEFycmF5KGxlZnRIYW5kT3BlcmFuZC5idWZmZXIpLCBuZXcgVWludDhBcnJheShyaWdodEhhbmRPcGVyYW5kLmJ1ZmZlciksIG9wdGlvbnMpO1xuICAgIGNhc2UgJ0FycmF5QnVmZmVyJzpcbiAgICAgIHJldHVybiBpdGVyYWJsZUVxdWFsKG5ldyBVaW50OEFycmF5KGxlZnRIYW5kT3BlcmFuZCksIG5ldyBVaW50OEFycmF5KHJpZ2h0SGFuZE9wZXJhbmQpLCBvcHRpb25zKTtcbiAgICBjYXNlICdTZXQnOlxuICAgICAgcmV0dXJuIGVudHJpZXNFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpO1xuICAgIGNhc2UgJ01hcCc6XG4gICAgICByZXR1cm4gZW50cmllc0VxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCwgb3B0aW9ucyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBvYmplY3RFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpO1xuICB9XG59XG5cbi8qIVxuICogQ29tcGFyZSB0d28gUmVndWxhciBFeHByZXNzaW9ucyBmb3IgZXF1YWxpdHkuXG4gKlxuICogQHBhcmFtIHtSZWdFeHB9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtSZWdFeHB9IHJpZ2h0SGFuZE9wZXJhbmRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHJlc3VsdFxuICovXG5cbmZ1bmN0aW9uIHJlZ2V4cEVxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCkge1xuICByZXR1cm4gbGVmdEhhbmRPcGVyYW5kLnRvU3RyaW5nKCkgPT09IHJpZ2h0SGFuZE9wZXJhbmQudG9TdHJpbmcoKTtcbn1cblxuLyohXG4gKiBDb21wYXJlIHR3byBTZXRzL01hcHMgZm9yIGVxdWFsaXR5LiBGYXN0ZXIgdGhhbiBvdGhlciBlcXVhbGl0eSBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHtTZXR9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtTZXR9IHJpZ2h0SGFuZE9wZXJhbmRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gKE9wdGlvbmFsKVxuICogQHJldHVybiB7Qm9vbGVhbn0gcmVzdWx0XG4gKi9cblxuZnVuY3Rpb24gZW50cmllc0VxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCwgb3B0aW9ucykge1xuICAvLyBJRTExIGRvZXNuJ3Qgc3VwcG9ydCBTZXQjZW50cmllcyBvciBTZXQjQEBpdGVyYXRvciwgc28gd2UgbmVlZCBtYW51YWxseSBwb3B1bGF0ZSB1c2luZyBTZXQjZm9yRWFjaFxuICBpZiAobGVmdEhhbmRPcGVyYW5kLnNpemUgIT09IHJpZ2h0SGFuZE9wZXJhbmQuc2l6ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobGVmdEhhbmRPcGVyYW5kLnNpemUgPT09IDApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB2YXIgbGVmdEhhbmRJdGVtcyA9IFtdO1xuICB2YXIgcmlnaHRIYW5kSXRlbXMgPSBbXTtcbiAgbGVmdEhhbmRPcGVyYW5kLmZvckVhY2goZnVuY3Rpb24gZ2F0aGVyRW50cmllcyhrZXksIHZhbHVlKSB7XG4gICAgbGVmdEhhbmRJdGVtcy5wdXNoKFsga2V5LCB2YWx1ZSBdKTtcbiAgfSk7XG4gIHJpZ2h0SGFuZE9wZXJhbmQuZm9yRWFjaChmdW5jdGlvbiBnYXRoZXJFbnRyaWVzKGtleSwgdmFsdWUpIHtcbiAgICByaWdodEhhbmRJdGVtcy5wdXNoKFsga2V5LCB2YWx1ZSBdKTtcbiAgfSk7XG4gIHJldHVybiBpdGVyYWJsZUVxdWFsKGxlZnRIYW5kSXRlbXMuc29ydCgpLCByaWdodEhhbmRJdGVtcy5zb3J0KCksIG9wdGlvbnMpO1xufVxuXG4vKiFcbiAqIFNpbXBsZSBlcXVhbGl0eSBmb3IgZmxhdCBpdGVyYWJsZSBvYmplY3RzIHN1Y2ggYXMgQXJyYXlzLCBUeXBlZEFycmF5cyBvciBOb2RlLmpzIGJ1ZmZlcnMuXG4gKlxuICogQHBhcmFtIHtJdGVyYWJsZX0gbGVmdEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge0l0ZXJhYmxlfSByaWdodEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIChPcHRpb25hbClcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHJlc3VsdFxuICovXG5cbmZ1bmN0aW9uIGl0ZXJhYmxlRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBvcHRpb25zKSB7XG4gIHZhciBsZW5ndGggPSBsZWZ0SGFuZE9wZXJhbmQubGVuZ3RoO1xuICBpZiAobGVuZ3RoICE9PSByaWdodEhhbmRPcGVyYW5kLmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdmFyIGluZGV4ID0gLTE7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGRlZXBFcXVhbChsZWZ0SGFuZE9wZXJhbmRbaW5kZXhdLCByaWdodEhhbmRPcGVyYW5kW2luZGV4XSwgb3B0aW9ucykgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiFcbiAqIFNpbXBsZSBlcXVhbGl0eSBmb3IgZ2VuZXJhdG9yIG9iamVjdHMgc3VjaCBhcyB0aG9zZSByZXR1cm5lZCBieSBnZW5lcmF0b3IgZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB7SXRlcmFibGV9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtJdGVyYWJsZX0gcmlnaHRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAoT3B0aW9uYWwpXG4gKiBAcmV0dXJuIHtCb29sZWFufSByZXN1bHRcbiAqL1xuXG5mdW5jdGlvbiBnZW5lcmF0b3JFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGl0ZXJhYmxlRXF1YWwoZ2V0R2VuZXJhdG9yRW50cmllcyhsZWZ0SGFuZE9wZXJhbmQpLCBnZXRHZW5lcmF0b3JFbnRyaWVzKHJpZ2h0SGFuZE9wZXJhbmQpLCBvcHRpb25zKTtcbn1cblxuLyohXG4gKiBEZXRlcm1pbmUgaWYgdGhlIGdpdmVuIG9iamVjdCBoYXMgYW4gQEBpdGVyYXRvciBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIG9iamVjdCBoYXMgYW4gQEBpdGVyYXRvciBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaGFzSXRlcmF0b3JGdW5jdGlvbih0YXJnZXQpIHtcbiAgcmV0dXJuIHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIHRhcmdldCA9PT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiB0YXJnZXRbU3ltYm9sLml0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuLyohXG4gKiBHZXRzIGFsbCBpdGVyYXRvciBlbnRyaWVzIGZyb20gdGhlIGdpdmVuIE9iamVjdC4gSWYgdGhlIE9iamVjdCBoYXMgbm8gQEBpdGVyYXRvciBmdW5jdGlvbiwgcmV0dXJucyBhbiBlbXB0eSBhcnJheS5cbiAqIFRoaXMgd2lsbCBjb25zdW1lIHRoZSBpdGVyYXRvciAtIHdoaWNoIGNvdWxkIGhhdmUgc2lkZSBlZmZlY3RzIGRlcGVuZGluZyBvbiB0aGUgQEBpdGVyYXRvciBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0XG4gKiBAcmV0dXJucyB7QXJyYXl9IGFuIGFycmF5IG9mIGVudHJpZXMgZnJvbSB0aGUgQEBpdGVyYXRvciBmdW5jdGlvblxuICovXG5mdW5jdGlvbiBnZXRJdGVyYXRvckVudHJpZXModGFyZ2V0KSB7XG4gIGlmIChoYXNJdGVyYXRvckZ1bmN0aW9uKHRhcmdldCkpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGdldEdlbmVyYXRvckVudHJpZXModGFyZ2V0W1N5bWJvbC5pdGVyYXRvcl0oKSk7XG4gICAgfSBjYXRjaCAoaXRlcmF0b3JFcnJvcikge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gW107XG59XG5cbi8qIVxuICogR2V0cyBhbGwgZW50cmllcyBmcm9tIGEgR2VuZXJhdG9yLiBUaGlzIHdpbGwgY29uc3VtZSB0aGUgZ2VuZXJhdG9yIC0gd2hpY2ggY291bGQgaGF2ZSBzaWRlIGVmZmVjdHMuXG4gKlxuICogQHBhcmFtIHtHZW5lcmF0b3J9IHRhcmdldFxuICogQHJldHVybnMge0FycmF5fSBhbiBhcnJheSBvZiBlbnRyaWVzIGZyb20gdGhlIEdlbmVyYXRvci5cbiAqL1xuZnVuY3Rpb24gZ2V0R2VuZXJhdG9yRW50cmllcyhnZW5lcmF0b3IpIHtcbiAgdmFyIGdlbmVyYXRvclJlc3VsdCA9IGdlbmVyYXRvci5uZXh0KCk7XG4gIHZhciBhY2N1bXVsYXRvciA9IFsgZ2VuZXJhdG9yUmVzdWx0LnZhbHVlIF07XG4gIHdoaWxlIChnZW5lcmF0b3JSZXN1bHQuZG9uZSA9PT0gZmFsc2UpIHtcbiAgICBnZW5lcmF0b3JSZXN1bHQgPSBnZW5lcmF0b3IubmV4dCgpO1xuICAgIGFjY3VtdWxhdG9yLnB1c2goZ2VuZXJhdG9yUmVzdWx0LnZhbHVlKTtcbiAgfVxuICByZXR1cm4gYWNjdW11bGF0b3I7XG59XG5cbi8qIVxuICogR2V0cyBhbGwgb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBrZXlzIGZyb20gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxuICogQHJldHVybnMge0FycmF5fSBhbiBhcnJheSBvZiBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIGtleXMgZnJvbSB0aGUgdGFyZ2V0LlxuICovXG5mdW5jdGlvbiBnZXRFbnVtZXJhYmxlS2V5cyh0YXJnZXQpIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIHRhcmdldCkge1xuICAgIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufVxuXG4vKiFcbiAqIERldGVybWluZXMgaWYgdHdvIG9iamVjdHMgaGF2ZSBtYXRjaGluZyB2YWx1ZXMsIGdpdmVuIGEgc2V0IG9mIGtleXMuIERlZmVycyB0byBkZWVwRXF1YWwgZm9yIHRoZSBlcXVhbGl0eSBjaGVjayBvZlxuICogZWFjaCBrZXkuIElmIGFueSB2YWx1ZSBvZiB0aGUgZ2l2ZW4ga2V5IGlzIG5vdCBlcXVhbCwgdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGZhbHNlIChlYXJseSkuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gbGVmdEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge01peGVkfSByaWdodEhhbmRPcGVyYW5kXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIEFuIGFycmF5IG9mIGtleXMgdG8gY29tcGFyZSB0aGUgdmFsdWVzIG9mIGxlZnRIYW5kT3BlcmFuZCBhbmQgcmlnaHRIYW5kT3BlcmFuZCBhZ2FpbnN0XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIChPcHRpb25hbClcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHJlc3VsdFxuICovXG5mdW5jdGlvbiBrZXlzRXF1YWwobGVmdEhhbmRPcGVyYW5kLCByaWdodEhhbmRPcGVyYW5kLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoZGVlcEVxdWFsKGxlZnRIYW5kT3BlcmFuZFtrZXlzW2ldXSwgcmlnaHRIYW5kT3BlcmFuZFtrZXlzW2ldXSwgb3B0aW9ucykgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiFcbiAqIFJlY3Vyc2l2ZWx5IGNoZWNrIHRoZSBlcXVhbGl0eSBvZiB0d28gT2JqZWN0cy4gT25jZSBiYXNpYyBzYW1lbmVzcyBoYXMgYmVlbiBlc3RhYmxpc2hlZCBpdCB3aWxsIGRlZmVyIHRvIGBkZWVwRXF1YWxgXG4gKiBmb3IgZWFjaCBlbnVtZXJhYmxlIGtleSBpbiB0aGUgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IGxlZnRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtNaXhlZH0gcmlnaHRIYW5kT3BlcmFuZFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSAoT3B0aW9uYWwpXG4gKiBAcmV0dXJuIHtCb29sZWFufSByZXN1bHRcbiAqL1xuXG5mdW5jdGlvbiBvYmplY3RFcXVhbChsZWZ0SGFuZE9wZXJhbmQsIHJpZ2h0SGFuZE9wZXJhbmQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlZnRIYW5kS2V5cyA9IGdldEVudW1lcmFibGVLZXlzKGxlZnRIYW5kT3BlcmFuZCk7XG4gIHZhciByaWdodEhhbmRLZXlzID0gZ2V0RW51bWVyYWJsZUtleXMocmlnaHRIYW5kT3BlcmFuZCk7XG4gIGlmIChsZWZ0SGFuZEtleXMubGVuZ3RoICYmIGxlZnRIYW5kS2V5cy5sZW5ndGggPT09IHJpZ2h0SGFuZEtleXMubGVuZ3RoKSB7XG4gICAgbGVmdEhhbmRLZXlzLnNvcnQoKTtcbiAgICByaWdodEhhbmRLZXlzLnNvcnQoKTtcbiAgICBpZiAoaXRlcmFibGVFcXVhbChsZWZ0SGFuZEtleXMsIHJpZ2h0SGFuZEtleXMpID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4ga2V5c0VxdWFsKGxlZnRIYW5kT3BlcmFuZCwgcmlnaHRIYW5kT3BlcmFuZCwgbGVmdEhhbmRLZXlzLCBvcHRpb25zKTtcbiAgfVxuXG4gIHZhciBsZWZ0SGFuZEVudHJpZXMgPSBnZXRJdGVyYXRvckVudHJpZXMobGVmdEhhbmRPcGVyYW5kKTtcbiAgdmFyIHJpZ2h0SGFuZEVudHJpZXMgPSBnZXRJdGVyYXRvckVudHJpZXMocmlnaHRIYW5kT3BlcmFuZCk7XG4gIGlmIChsZWZ0SGFuZEVudHJpZXMubGVuZ3RoICYmIGxlZnRIYW5kRW50cmllcy5sZW5ndGggPT09IHJpZ2h0SGFuZEVudHJpZXMubGVuZ3RoKSB7XG4gICAgbGVmdEhhbmRFbnRyaWVzLnNvcnQoKTtcbiAgICByaWdodEhhbmRFbnRyaWVzLnNvcnQoKTtcbiAgICByZXR1cm4gaXRlcmFibGVFcXVhbChsZWZ0SGFuZEVudHJpZXMsIHJpZ2h0SGFuZEVudHJpZXMsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKGxlZnRIYW5kS2V5cy5sZW5ndGggPT09IDAgJiZcbiAgICAgIGxlZnRIYW5kRW50cmllcy5sZW5ndGggPT09IDAgJiZcbiAgICAgIHJpZ2h0SGFuZEtleXMubGVuZ3RoID09PSAwICYmXG4gICAgICByaWdodEhhbmRFbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKiFcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBwcmltaXRpdmUuXG4gKlxuICogVGhpcyBpbnRlbnRpb25hbGx5IHJldHVybnMgdHJ1ZSBmb3IgYWxsIG9iamVjdHMgdGhhdCBjYW4gYmUgY29tcGFyZWQgYnkgcmVmZXJlbmNlLFxuICogaW5jbHVkaW5nIGZ1bmN0aW9ucyBhbmQgc3ltYm9scy5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWx1ZVxuICogQHJldHVybiB7Qm9vbGVhbn0gcmVzdWx0XG4gKi9cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiAhXG4gKiBDaGFpIC0gZ2V0RnVuY05hbWUgdXRpbGl0eVxuICogQ29weXJpZ2h0KGMpIDIwMTItMjAxNiBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogIyMjIC5nZXRGdW5jTmFtZShjb25zdHJ1Y3RvckZuKVxuICpcbiAqIFJldHVybnMgdGhlIG5hbWUgb2YgYSBmdW5jdGlvbi5cbiAqIFdoZW4gYSBub24tZnVuY3Rpb24gaW5zdGFuY2UgaXMgcGFzc2VkLCByZXR1cm5zIGBudWxsYC5cbiAqIFRoaXMgYWxzbyBpbmNsdWRlcyBhIHBvbHlmaWxsIGZ1bmN0aW9uIGlmIGBhRnVuYy5uYW1lYCBpcyBub3QgZGVmaW5lZC5cbiAqXG4gKiBAbmFtZSBnZXRGdW5jTmFtZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3RcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxudmFyIHRvU3RyaW5nID0gRnVuY3Rpb24ucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGZ1bmN0aW9uTmFtZU1hdGNoID0gL1xccypmdW5jdGlvbig/Olxcc3xcXHMqXFwvXFwqW14oPzoqXFwvKV0rXFwqXFwvXFxzKikqKFteXFxzXFwoXFwvXSspLztcbmZ1bmN0aW9uIGdldEZ1bmNOYW1lKGFGdW5jKSB7XG4gIGlmICh0eXBlb2YgYUZ1bmMgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBuYW1lID0gJyc7XG4gIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLm5hbWUgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBhRnVuYy5uYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgIC8vIEhlcmUgd2UgcnVuIGEgcG9seWZpbGwgaWYgRnVuY3Rpb24gZG9lcyBub3Qgc3VwcG9ydCB0aGUgYG5hbWVgIHByb3BlcnR5IGFuZCBpZiBhRnVuYy5uYW1lIGlzIG5vdCBkZWZpbmVkXG4gICAgdmFyIG1hdGNoID0gdG9TdHJpbmcuY2FsbChhRnVuYykubWF0Y2goZnVuY3Rpb25OYW1lTWF0Y2gpO1xuICAgIGlmIChtYXRjaCkge1xuICAgICAgbmFtZSA9IG1hdGNoWzFdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB3ZSd2ZSBnb3QgYSBgbmFtZWAgcHJvcGVydHkgd2UganVzdCB1c2UgaXRcbiAgICBuYW1lID0gYUZ1bmMubmFtZTtcbiAgfVxuXG4gIHJldHVybiBuYW1lO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldEZ1bmNOYW1lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiAhXG4gKiBDaGFpIC0gcGF0aHZhbCB1dGlsaXR5XG4gKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE0IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vbG9naWNhbHBhcmFkb3gvZmlsdHJcbiAqIE1JVCBMaWNlbnNlZFxuICovXG5cbi8qKlxuICogIyMjIC5oYXNQcm9wZXJ0eShvYmplY3QsIG5hbWUpXG4gKlxuICogVGhpcyBhbGxvd3MgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIG93blxuICogb3IgaW5oZXJpdGVkIGZyb20gcHJvdG90eXBlIGNoYWluIG5hbWVkIHByb3BlcnR5LlxuICpcbiAqIEJhc2ljYWxseSBkb2VzIHRoZSBzYW1lIHRoaW5nIGFzIHRoZSBgaW5gXG4gKiBvcGVyYXRvciBidXQgd29ya3MgcHJvcGVybHkgd2l0aCBudWxsL3VuZGVmaW5lZCB2YWx1ZXNcbiAqIGFuZCBvdGhlciBwcmltaXRpdmVzLlxuICpcbiAqICAgICB2YXIgb2JqID0ge1xuICogICAgICAgICBhcnI6IFsnYScsICdiJywgJ2MnXVxuICogICAgICAgLCBzdHI6ICdIZWxsbydcbiAqICAgICB9XG4gKlxuICogVGhlIGZvbGxvd2luZyB3b3VsZCBiZSB0aGUgcmVzdWx0cy5cbiAqXG4gKiAgICAgaGFzUHJvcGVydHkob2JqLCAnc3RyJyk7ICAvLyB0cnVlXG4gKiAgICAgaGFzUHJvcGVydHkob2JqLCAnY29uc3RydWN0b3InKTsgIC8vIHRydWVcbiAqICAgICBoYXNQcm9wZXJ0eShvYmosICdiYXInKTsgIC8vIGZhbHNlXG4gKlxuICogICAgIGhhc1Byb3BlcnR5KG9iai5zdHIsICdsZW5ndGgnKTsgLy8gdHJ1ZVxuICogICAgIGhhc1Byb3BlcnR5KG9iai5zdHIsIDEpOyAgLy8gdHJ1ZVxuICogICAgIGhhc1Byb3BlcnR5KG9iai5zdHIsIDUpOyAgLy8gZmFsc2VcbiAqXG4gKiAgICAgaGFzUHJvcGVydHkob2JqLmFyciwgJ2xlbmd0aCcpOyAgLy8gdHJ1ZVxuICogICAgIGhhc1Byb3BlcnR5KG9iai5hcnIsIDIpOyAgLy8gdHJ1ZVxuICogICAgIGhhc1Byb3BlcnR5KG9iai5hcnIsIDMpOyAgLy8gZmFsc2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IG5hbWVcbiAqIEByZXR1cm5zIHtCb29sZWFufSB3aGV0aGVyIGl0IGV4aXN0c1xuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgaGFzUHJvcGVydHlcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gaGFzUHJvcGVydHkob2JqLCBuYW1lKSB7XG4gIGlmICh0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJyB8fCBvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBUaGUgYGluYCBvcGVyYXRvciBkb2VzIG5vdCB3b3JrIHdpdGggcHJpbWl0aXZlcy5cbiAgcmV0dXJuIG5hbWUgaW4gT2JqZWN0KG9iaik7XG59XG5cbi8qICFcbiAqICMjIHBhcnNlUGF0aChwYXRoKVxuICpcbiAqIEhlbHBlciBmdW5jdGlvbiB1c2VkIHRvIHBhcnNlIHN0cmluZyBvYmplY3RcbiAqIHBhdGhzLiBVc2UgaW4gY29uanVuY3Rpb24gd2l0aCBgaW50ZXJuYWxHZXRQYXRoVmFsdWVgLlxuICpcbiAqICAgICAgdmFyIHBhcnNlZCA9IHBhcnNlUGF0aCgnbXlvYmplY3QucHJvcGVydHkuc3VicHJvcCcpO1xuICpcbiAqICMjIyBQYXRoczpcbiAqXG4gKiAqIENhbiBiZSBpbmZpbml0ZWx5IGRlZXAgYW5kIG5lc3RlZC5cbiAqICogQXJyYXlzIGFyZSBhbHNvIHZhbGlkIHVzaW5nIHRoZSBmb3JtYWwgYG15b2JqZWN0LmRvY3VtZW50WzNdLnByb3BlcnR5YC5cbiAqICogTGl0ZXJhbCBkb3RzIGFuZCBicmFja2V0cyAobm90IGRlbGltaXRlcikgbXVzdCBiZSBiYWNrc2xhc2gtZXNjYXBlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybnMge09iamVjdH0gcGFyc2VkXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZVBhdGgocGF0aCkge1xuICB2YXIgc3RyID0gcGF0aC5yZXBsYWNlKC8oW15cXFxcXSlcXFsvZywgJyQxLlsnKTtcbiAgdmFyIHBhcnRzID0gc3RyLm1hdGNoKC8oXFxcXFxcLnxbXi5dKz8pKy9nKTtcbiAgcmV0dXJuIHBhcnRzLm1hcChmdW5jdGlvbiBtYXBNYXRjaGVzKHZhbHVlKSB7XG4gICAgdmFyIHJlZ2V4cCA9IC9eXFxbKFxcZCspXFxdJC87XG4gICAgdmFyIG1BcnIgPSByZWdleHAuZXhlYyh2YWx1ZSk7XG4gICAgdmFyIHBhcnNlZCA9IG51bGw7XG4gICAgaWYgKG1BcnIpIHtcbiAgICAgIHBhcnNlZCA9IHsgaTogcGFyc2VGbG9hdChtQXJyWzFdKSB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJzZWQgPSB7IHA6IHZhbHVlLnJlcGxhY2UoL1xcXFwoWy5cXFtcXF1dKS9nLCAnJDEnKSB9O1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZWQ7XG4gIH0pO1xufVxuXG4vKiAhXG4gKiAjIyBpbnRlcm5hbEdldFBhdGhWYWx1ZShvYmosIHBhcnNlZFssIHBhdGhEZXB0aF0pXG4gKlxuICogSGVscGVyIGNvbXBhbmlvbiBmdW5jdGlvbiBmb3IgYC5wYXJzZVBhdGhgIHRoYXQgcmV0dXJuc1xuICogdGhlIHZhbHVlIGxvY2F0ZWQgYXQgdGhlIHBhcnNlZCBhZGRyZXNzLlxuICpcbiAqICAgICAgdmFyIHZhbHVlID0gZ2V0UGF0aFZhbHVlKG9iaiwgcGFyc2VkKTtcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IHRvIHNlYXJjaCBhZ2FpbnN0XG4gKiBAcGFyYW0ge09iamVjdH0gcGFyc2VkIGRlZmluaXRpb24gZnJvbSBgcGFyc2VQYXRoYC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZXB0aCAobmVzdGluZyBsZXZlbCkgb2YgdGhlIHByb3BlcnR5IHdlIHdhbnQgdG8gcmV0cmlldmVcbiAqIEByZXR1cm5zIHtPYmplY3R8VW5kZWZpbmVkfSB2YWx1ZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaW50ZXJuYWxHZXRQYXRoVmFsdWUob2JqLCBwYXJzZWQsIHBhdGhEZXB0aCkge1xuICB2YXIgdGVtcG9yYXJ5VmFsdWUgPSBvYmo7XG4gIHZhciByZXMgPSBudWxsO1xuICBwYXRoRGVwdGggPSAodHlwZW9mIHBhdGhEZXB0aCA9PT0gJ3VuZGVmaW5lZCcgPyBwYXJzZWQubGVuZ3RoIDogcGF0aERlcHRoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhEZXB0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnQgPSBwYXJzZWRbaV07XG4gICAgaWYgKHRlbXBvcmFyeVZhbHVlKSB7XG4gICAgICBpZiAodHlwZW9mIHBhcnQucCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGVtcG9yYXJ5VmFsdWUgPSB0ZW1wb3JhcnlWYWx1ZVtwYXJ0LmldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcG9yYXJ5VmFsdWUgPSB0ZW1wb3JhcnlWYWx1ZVtwYXJ0LnBdO1xuICAgICAgfVxuXG4gICAgICBpZiAoaSA9PT0gKHBhdGhEZXB0aCAtIDEpKSB7XG4gICAgICAgIHJlcyA9IHRlbXBvcmFyeVZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qICFcbiAqICMjIGludGVybmFsU2V0UGF0aFZhbHVlKG9iaiwgdmFsdWUsIHBhcnNlZClcbiAqXG4gKiBDb21wYW5pb24gZnVuY3Rpb24gZm9yIGBwYXJzZVBhdGhgIHRoYXQgc2V0c1xuICogdGhlIHZhbHVlIGxvY2F0ZWQgYXQgYSBwYXJzZWQgYWRkcmVzcy5cbiAqXG4gKiAgaW50ZXJuYWxTZXRQYXRoVmFsdWUob2JqLCAndmFsdWUnLCBwYXJzZWQpO1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgdG8gc2VhcmNoIGFuZCBkZWZpbmUgb25cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgdG8gdXNlIHVwb24gc2V0XG4gKiBAcGFyYW0ge09iamVjdH0gcGFyc2VkIGRlZmluaXRpb24gZnJvbSBgcGFyc2VQYXRoYFxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaW50ZXJuYWxTZXRQYXRoVmFsdWUob2JqLCB2YWwsIHBhcnNlZCkge1xuICB2YXIgdGVtcE9iaiA9IG9iajtcbiAgdmFyIHBhdGhEZXB0aCA9IHBhcnNlZC5sZW5ndGg7XG4gIHZhciBwYXJ0ID0gbnVsbDtcbiAgLy8gSGVyZSB3ZSBpdGVyYXRlIHRocm91Z2ggZXZlcnkgcGFydCBvZiB0aGUgcGF0aFxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhEZXB0aDsgaSsrKSB7XG4gICAgdmFyIHByb3BOYW1lID0gbnVsbDtcbiAgICB2YXIgcHJvcFZhbCA9IG51bGw7XG4gICAgcGFydCA9IHBhcnNlZFtpXTtcblxuICAgIC8vIElmIGl0J3MgdGhlIGxhc3QgcGFydCBvZiB0aGUgcGF0aCwgd2Ugc2V0IHRoZSAncHJvcE5hbWUnIHZhbHVlIHdpdGggdGhlIHByb3BlcnR5IG5hbWVcbiAgICBpZiAoaSA9PT0gKHBhdGhEZXB0aCAtIDEpKSB7XG4gICAgICBwcm9wTmFtZSA9IHR5cGVvZiBwYXJ0LnAgPT09ICd1bmRlZmluZWQnID8gcGFydC5pIDogcGFydC5wO1xuICAgICAgLy8gTm93IHdlIHNldCB0aGUgcHJvcGVydHkgd2l0aCB0aGUgbmFtZSBoZWxkIGJ5ICdwcm9wTmFtZScgb24gb2JqZWN0IHdpdGggdGhlIGRlc2lyZWQgdmFsXG4gICAgICB0ZW1wT2JqW3Byb3BOYW1lXSA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJ0LnAgIT09ICd1bmRlZmluZWQnICYmIHRlbXBPYmpbcGFydC5wXSkge1xuICAgICAgdGVtcE9iaiA9IHRlbXBPYmpbcGFydC5wXTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJ0LmkgIT09ICd1bmRlZmluZWQnICYmIHRlbXBPYmpbcGFydC5pXSkge1xuICAgICAgdGVtcE9iaiA9IHRlbXBPYmpbcGFydC5pXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIG9iaiBkb2Vzbid0IGhhdmUgdGhlIHByb3BlcnR5IHdlIGNyZWF0ZSBvbmUgd2l0aCB0aGF0IG5hbWUgdG8gZGVmaW5lIGl0XG4gICAgICB2YXIgbmV4dCA9IHBhcnNlZFtpICsgMV07XG4gICAgICAvLyBIZXJlIHdlIHNldCB0aGUgbmFtZSBvZiB0aGUgcHJvcGVydHkgd2hpY2ggd2lsbCBiZSBkZWZpbmVkXG4gICAgICBwcm9wTmFtZSA9IHR5cGVvZiBwYXJ0LnAgPT09ICd1bmRlZmluZWQnID8gcGFydC5pIDogcGFydC5wO1xuICAgICAgLy8gSGVyZSB3ZSBkZWNpZGUgaWYgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIGFuIGFycmF5IG9yIGEgbmV3IG9iamVjdFxuICAgICAgcHJvcFZhbCA9IHR5cGVvZiBuZXh0LnAgPT09ICd1bmRlZmluZWQnID8gW10gOiB7fTtcbiAgICAgIHRlbXBPYmpbcHJvcE5hbWVdID0gcHJvcFZhbDtcbiAgICAgIHRlbXBPYmogPSB0ZW1wT2JqW3Byb3BOYW1lXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiAjIyMgLmdldFBhdGhJbmZvKG9iamVjdCwgcGF0aClcbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgcmV0cmlldmFsIG9mIHByb3BlcnR5IGluZm8gaW4gYW5cbiAqIG9iamVjdCBnaXZlbiBhIHN0cmluZyBwYXRoLlxuICpcbiAqIFRoZSBwYXRoIGluZm8gY29uc2lzdHMgb2YgYW4gb2JqZWN0IHdpdGggdGhlXG4gKiBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAqXG4gKiAqIHBhcmVudCAtIFRoZSBwYXJlbnQgb2JqZWN0IG9mIHRoZSBwcm9wZXJ0eSByZWZlcmVuY2VkIGJ5IGBwYXRoYFxuICogKiBuYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGZpbmFsIHByb3BlcnR5LCBhIG51bWJlciBpZiBpdCB3YXMgYW4gYXJyYXkgaW5kZXhlclxuICogKiB2YWx1ZSAtIFRoZSB2YWx1ZSBvZiB0aGUgcHJvcGVydHksIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIGB1bmRlZmluZWRgXG4gKiAqIGV4aXN0cyAtIFdoZXRoZXIgdGhlIHByb3BlcnR5IGV4aXN0cyBvciBub3RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybnMge09iamVjdH0gaW5mb1xuICogQG5hbWVzcGFjZSBVdGlsc1xuICogQG5hbWUgZ2V0UGF0aEluZm9cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZ2V0UGF0aEluZm8ob2JqLCBwYXRoKSB7XG4gIHZhciBwYXJzZWQgPSBwYXJzZVBhdGgocGF0aCk7XG4gIHZhciBsYXN0ID0gcGFyc2VkW3BhcnNlZC5sZW5ndGggLSAxXTtcbiAgdmFyIGluZm8gPSB7XG4gICAgcGFyZW50OiBwYXJzZWQubGVuZ3RoID4gMSA/IGludGVybmFsR2V0UGF0aFZhbHVlKG9iaiwgcGFyc2VkLCBwYXJzZWQubGVuZ3RoIC0gMSkgOiBvYmosXG4gICAgbmFtZTogbGFzdC5wIHx8IGxhc3QuaSxcbiAgICB2YWx1ZTogaW50ZXJuYWxHZXRQYXRoVmFsdWUob2JqLCBwYXJzZWQpLFxuICB9O1xuICBpbmZvLmV4aXN0cyA9IGhhc1Byb3BlcnR5KGluZm8ucGFyZW50LCBpbmZvLm5hbWUpO1xuXG4gIHJldHVybiBpbmZvO1xufVxuXG4vKipcbiAqICMjIyAuZ2V0UGF0aFZhbHVlKG9iamVjdCwgcGF0aClcbiAqXG4gKiBUaGlzIGFsbG93cyB0aGUgcmV0cmlldmFsIG9mIHZhbHVlcyBpbiBhblxuICogb2JqZWN0IGdpdmVuIGEgc3RyaW5nIHBhdGguXG4gKlxuICogICAgIHZhciBvYmogPSB7XG4gKiAgICAgICAgIHByb3AxOiB7XG4gKiAgICAgICAgICAgICBhcnI6IFsnYScsICdiJywgJ2MnXVxuICogICAgICAgICAgICwgc3RyOiAnSGVsbG8nXG4gKiAgICAgICAgIH1cbiAqICAgICAgICwgcHJvcDI6IHtcbiAqICAgICAgICAgICAgIGFycjogWyB7IG5lc3RlZDogJ1VuaXZlcnNlJyB9IF1cbiAqICAgICAgICAgICAsIHN0cjogJ0hlbGxvIGFnYWluISdcbiAqICAgICAgICAgfVxuICogICAgIH1cbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdvdWxkIGJlIHRoZSByZXN1bHRzLlxuICpcbiAqICAgICBnZXRQYXRoVmFsdWUob2JqLCAncHJvcDEuc3RyJyk7IC8vIEhlbGxvXG4gKiAgICAgZ2V0UGF0aFZhbHVlKG9iaiwgJ3Byb3AxLmF0dFsyXScpOyAvLyBiXG4gKiAgICAgZ2V0UGF0aFZhbHVlKG9iaiwgJ3Byb3AyLmFyclswXS5uZXN0ZWQnKTsgLy8gVW5pdmVyc2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHJldHVybnMge09iamVjdH0gdmFsdWUgb3IgYHVuZGVmaW5lZGBcbiAqIEBuYW1lc3BhY2UgVXRpbHNcbiAqIEBuYW1lIGdldFBhdGhWYWx1ZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBnZXRQYXRoVmFsdWUob2JqLCBwYXRoKSB7XG4gIHZhciBpbmZvID0gZ2V0UGF0aEluZm8ob2JqLCBwYXRoKTtcbiAgcmV0dXJuIGluZm8udmFsdWU7XG59XG5cbi8qKlxuICogIyMjIC5zZXRQYXRoVmFsdWUob2JqZWN0LCBwYXRoLCB2YWx1ZSlcbiAqXG4gKiBEZWZpbmUgdGhlIHZhbHVlIGluIGFuIG9iamVjdCBhdCBhIGdpdmVuIHN0cmluZyBwYXRoLlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgb2JqID0ge1xuICogICAgIHByb3AxOiB7XG4gKiAgICAgICAgIGFycjogWydhJywgJ2InLCAnYyddXG4gKiAgICAgICAsIHN0cjogJ0hlbGxvJ1xuICogICAgIH1cbiAqICAgLCBwcm9wMjoge1xuICogICAgICAgICBhcnI6IFsgeyBuZXN0ZWQ6ICdVbml2ZXJzZScgfSBdXG4gKiAgICAgICAsIHN0cjogJ0hlbGxvIGFnYWluISdcbiAqICAgICB9XG4gKiB9O1xuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3b3VsZCBiZSBhY2NlcHRhYmxlLlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgcHJvcGVydGllcyA9IHJlcXVpcmUoJ3RlYS1wcm9wZXJ0aWVzJyk7XG4gKiBwcm9wZXJ0aWVzLnNldChvYmosICdwcm9wMS5zdHInLCAnSGVsbG8gVW5pdmVyc2UhJyk7XG4gKiBwcm9wZXJ0aWVzLnNldChvYmosICdwcm9wMS5hcnJbMl0nLCAnQicpO1xuICogcHJvcGVydGllcy5zZXQob2JqLCAncHJvcDIuYXJyWzBdLm5lc3RlZC52YWx1ZScsIHsgaGVsbG86ICd1bml2ZXJzZScgfSk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0XG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtNaXhlZH0gdmFsdWVcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNldFBhdGhWYWx1ZShvYmosIHBhdGgsIHZhbCkge1xuICB2YXIgcGFyc2VkID0gcGFyc2VQYXRoKHBhdGgpO1xuICBpbnRlcm5hbFNldFBhdGhWYWx1ZShvYmosIHZhbCwgcGFyc2VkKTtcbiAgcmV0dXJuIG9iajtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGhhc1Byb3BlcnR5OiBoYXNQcm9wZXJ0eSxcbiAgZ2V0UGF0aEluZm86IGdldFBhdGhJbmZvLFxuICBnZXRQYXRoVmFsdWU6IGdldFBhdGhWYWx1ZSxcbiAgc2V0UGF0aFZhbHVlOiBzZXRQYXRoVmFsdWUsXG59O1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuXHQoZ2xvYmFsLnR5cGVEZXRlY3QgPSBmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbi8qICFcbiAqIHR5cGUtZGV0ZWN0XG4gKiBDb3B5cmlnaHQoYykgMjAxMyBqYWtlIGx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cbiAqIE1JVCBMaWNlbnNlZFxuICovXG52YXIgcHJvbWlzZUV4aXN0cyA9IHR5cGVvZiBQcm9taXNlID09PSAnZnVuY3Rpb24nO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlZiAqL1xudmFyIGdsb2JhbE9iamVjdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyA/IHNlbGYgOiBnbG9iYWw7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaWQtYmxhY2tsaXN0XG5cbnZhciBzeW1ib2xFeGlzdHMgPSB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJztcbnZhciBtYXBFeGlzdHMgPSB0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJztcbnZhciBzZXRFeGlzdHMgPSB0eXBlb2YgU2V0ICE9PSAndW5kZWZpbmVkJztcbnZhciB3ZWFrTWFwRXhpc3RzID0gdHlwZW9mIFdlYWtNYXAgIT09ICd1bmRlZmluZWQnO1xudmFyIHdlYWtTZXRFeGlzdHMgPSB0eXBlb2YgV2Vha1NldCAhPT0gJ3VuZGVmaW5lZCc7XG52YXIgZGF0YVZpZXdFeGlzdHMgPSB0eXBlb2YgRGF0YVZpZXcgIT09ICd1bmRlZmluZWQnO1xudmFyIHN5bWJvbEl0ZXJhdG9yRXhpc3RzID0gc3ltYm9sRXhpc3RzICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgIT09ICd1bmRlZmluZWQnO1xudmFyIHN5bWJvbFRvU3RyaW5nVGFnRXhpc3RzID0gc3ltYm9sRXhpc3RzICYmIHR5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWcgIT09ICd1bmRlZmluZWQnO1xudmFyIHNldEVudHJpZXNFeGlzdHMgPSBzZXRFeGlzdHMgJiYgdHlwZW9mIFNldC5wcm90b3R5cGUuZW50cmllcyA9PT0gJ2Z1bmN0aW9uJztcbnZhciBtYXBFbnRyaWVzRXhpc3RzID0gbWFwRXhpc3RzICYmIHR5cGVvZiBNYXAucHJvdG90eXBlLmVudHJpZXMgPT09ICdmdW5jdGlvbic7XG52YXIgc2V0SXRlcmF0b3JQcm90b3R5cGUgPSBzZXRFbnRyaWVzRXhpc3RzICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihuZXcgU2V0KCkuZW50cmllcygpKTtcbnZhciBtYXBJdGVyYXRvclByb3RvdHlwZSA9IG1hcEVudHJpZXNFeGlzdHMgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG5ldyBNYXAoKS5lbnRyaWVzKCkpO1xudmFyIGFycmF5SXRlcmF0b3JFeGlzdHMgPSBzeW1ib2xJdGVyYXRvckV4aXN0cyAmJiB0eXBlb2YgQXJyYXkucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPT09ICdmdW5jdGlvbic7XG52YXIgYXJyYXlJdGVyYXRvclByb3RvdHlwZSA9IGFycmF5SXRlcmF0b3JFeGlzdHMgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKFtdW1N5bWJvbC5pdGVyYXRvcl0oKSk7XG52YXIgc3RyaW5nSXRlcmF0b3JFeGlzdHMgPSBzeW1ib2xJdGVyYXRvckV4aXN0cyAmJiB0eXBlb2YgU3RyaW5nLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID09PSAnZnVuY3Rpb24nO1xudmFyIHN0cmluZ0l0ZXJhdG9yUHJvdG90eXBlID0gc3RyaW5nSXRlcmF0b3JFeGlzdHMgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKCcnW1N5bWJvbC5pdGVyYXRvcl0oKSk7XG52YXIgdG9TdHJpbmdMZWZ0U2xpY2VMZW5ndGggPSA4O1xudmFyIHRvU3RyaW5nUmlnaHRTbGljZUxlbmd0aCA9IC0xO1xuLyoqXG4gKiAjIyMgdHlwZU9mIChvYmopXG4gKlxuICogVXNlcyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AgdG8gZGV0ZXJtaW5lIHRoZSB0eXBlIG9mIGFuIG9iamVjdCxcbiAqIG5vcm1hbGlzaW5nIGJlaGF2aW91ciBhY3Jvc3MgZW5naW5lIHZlcnNpb25zICYgd2VsbCBvcHRpbWlzZWQuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtTdHJpbmd9IG9iamVjdCB0eXBlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiB0eXBlRGV0ZWN0KG9iaikge1xuICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuICAgKiBQcmU6XG4gICAqICAgc3RyaW5nIGxpdGVyYWwgICAgIHggMywwMzksMDM1IG9wcy9zZWMgwrExLjYyJSAoNzggcnVucyBzYW1wbGVkKVxuICAgKiAgIGJvb2xlYW4gbGl0ZXJhbCAgICB4IDEsNDI0LDEzOCBvcHMvc2VjIMKxNC41NCUgKDc1IHJ1bnMgc2FtcGxlZClcbiAgICogICBudW1iZXIgbGl0ZXJhbCAgICAgeCAxLDY1MywxNTMgb3BzL3NlYyDCsTEuOTElICg4MiBydW5zIHNhbXBsZWQpXG4gICAqICAgdW5kZWZpbmVkICAgICAgICAgIHggOSw5NzgsNjYwIG9wcy9zZWMgwrExLjkyJSAoNzUgcnVucyBzYW1wbGVkKVxuICAgKiAgIGZ1bmN0aW9uICAgICAgICAgICB4IDIsNTU2LDc2OSBvcHMvc2VjIMKxMS43MyUgKDc3IHJ1bnMgc2FtcGxlZClcbiAgICogUG9zdDpcbiAgICogICBzdHJpbmcgbGl0ZXJhbCAgICAgeCAzOCw1NjQsNzk2IG9wcy9zZWMgwrExLjE1JSAoNzkgcnVucyBzYW1wbGVkKVxuICAgKiAgIGJvb2xlYW4gbGl0ZXJhbCAgICB4IDMxLDE0OCw5NDAgb3BzL3NlYyDCsTEuMTAlICg3OSBydW5zIHNhbXBsZWQpXG4gICAqICAgbnVtYmVyIGxpdGVyYWwgICAgIHggMzIsNjc5LDMzMCBvcHMvc2VjIMKxMS45MCUgKDc4IHJ1bnMgc2FtcGxlZClcbiAgICogICB1bmRlZmluZWQgICAgICAgICAgeCAzMiwzNjMsMzY4IG9wcy9zZWMgwrExLjA3JSAoODIgcnVucyBzYW1wbGVkKVxuICAgKiAgIGZ1bmN0aW9uICAgICAgICAgICB4IDMxLDI5Niw4NzAgb3BzL3NlYyDCsTAuOTYlICg4MyBydW5zIHNhbXBsZWQpXG4gICAqL1xuICB2YXIgdHlwZW9mT2JqID0gdHlwZW9mIG9iajtcbiAgaWYgKHR5cGVvZk9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gdHlwZW9mT2JqO1xuICB9XG5cbiAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cbiAgICogUHJlOlxuICAgKiAgIG51bGwgICAgICAgICAgICAgICB4IDI4LDY0NSw3NjUgb3BzL3NlYyDCsTEuMTclICg4MiBydW5zIHNhbXBsZWQpXG4gICAqIFBvc3Q6XG4gICAqICAgbnVsbCAgICAgICAgICAgICAgIHggMzYsNDI4LDk2MiBvcHMvc2VjIMKxMS4zNyUgKDg0IHJ1bnMgc2FtcGxlZClcbiAgICovXG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ251bGwnO1xuICB9XG5cbiAgLyogISBTcGVjIENvbmZvcm1hbmNlXG4gICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93KWBgXG4gICAqICAtIE5vZGUgPT09IFwiW29iamVjdCBnbG9iYWxdXCJcbiAgICogIC0gQ2hyb21lID09PSBcIltvYmplY3QgZ2xvYmFsXVwiXG4gICAqICAtIEZpcmVmb3ggPT09IFwiW29iamVjdCBXaW5kb3ddXCJcbiAgICogIC0gUGhhbnRvbUpTID09PSBcIltvYmplY3QgV2luZG93XVwiXG4gICAqICAtIFNhZmFyaSA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuICAgKiAgLSBJRSAxMSA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuICAgKiAgLSBJRSBFZGdlID09PSBcIltvYmplY3QgV2luZG93XVwiXG4gICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpcylgYFxuICAgKiAgLSBDaHJvbWUgV29ya2VyID09PSBcIltvYmplY3QgZ2xvYmFsXVwiXG4gICAqICAtIEZpcmVmb3ggV29ya2VyID09PSBcIltvYmplY3QgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGVdXCJcbiAgICogIC0gU2FmYXJpIFdvcmtlciA9PT0gXCJbb2JqZWN0IERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlXVwiXG4gICAqICAtIElFIDExIFdvcmtlciA9PT0gXCJbb2JqZWN0IFdvcmtlckdsb2JhbFNjb3BlXVwiXG4gICAqICAtIElFIEVkZ2UgV29ya2VyID09PSBcIltvYmplY3QgV29ya2VyR2xvYmFsU2NvcGVdXCJcbiAgICovXG4gIGlmIChvYmogPT09IGdsb2JhbE9iamVjdCkge1xuICAgIHJldHVybiAnZ2xvYmFsJztcbiAgfVxuXG4gIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG4gICAqIFByZTpcbiAgICogICBhcnJheSBsaXRlcmFsICAgICAgeCAyLDg4OCwzNTIgb3BzL3NlYyDCsTAuNjclICg4MiBydW5zIHNhbXBsZWQpXG4gICAqIFBvc3Q6XG4gICAqICAgYXJyYXkgbGl0ZXJhbCAgICAgIHggMjIsNDc5LDY1MCBvcHMvc2VjIMKxMC45NiUgKDgxIHJ1bnMgc2FtcGxlZClcbiAgICovXG4gIGlmIChcbiAgICBBcnJheS5pc0FycmF5KG9iaikgJiZcbiAgICAoc3ltYm9sVG9TdHJpbmdUYWdFeGlzdHMgPT09IGZhbHNlIHx8ICEoU3ltYm9sLnRvU3RyaW5nVGFnIGluIG9iaikpXG4gICkge1xuICAgIHJldHVybiAnQXJyYXknO1xuICB9XG5cbiAgLy8gTm90IGNhY2hpbmcgZXhpc3RlbmNlIG9mIGB3aW5kb3dgIGFuZCByZWxhdGVkIHByb3BlcnRpZXMgZHVlIHRvIHBvdGVudGlhbFxuICAvLyBmb3IgYHdpbmRvd2AgdG8gYmUgdW5zZXQgYmVmb3JlIHRlc3RzIGluIHF1YXNpLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICE9PSBudWxsKSB7XG4gICAgLyogISBTcGVjIENvbmZvcm1hbmNlXG4gICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2Jyb3dzZXJzLmh0bWwjbG9jYXRpb24pXG4gICAgICogV2hhdFdHIEhUTUwkNy43LjMgLSBUaGUgYExvY2F0aW9uYCBpbnRlcmZhY2VcbiAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHdpbmRvdy5sb2NhdGlvbilgYFxuICAgICAqICAtIElFIDw9MTEgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICAgKiAgLSBJRSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICAgKi9cbiAgICBpZiAodHlwZW9mIHdpbmRvdy5sb2NhdGlvbiA9PT0gJ29iamVjdCcgJiYgb2JqID09PSB3aW5kb3cubG9jYXRpb24pIHtcbiAgICAgIHJldHVybiAnTG9jYXRpb24nO1xuICAgIH1cblxuICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNkb2N1bWVudClcbiAgICAgKiBXaGF0V0cgSFRNTCQzLjEuMSAtIFRoZSBgRG9jdW1lbnRgIG9iamVjdFxuICAgICAqIE5vdGU6IE1vc3QgYnJvd3NlcnMgY3VycmVudGx5IGFkaGVyIHRvIHRoZSBXM0MgRE9NIExldmVsIDIgc3BlY1xuICAgICAqICAgICAgIChodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTItSFRNTC9odG1sLmh0bWwjSUQtMjY4MDkyNjgpXG4gICAgICogICAgICAgd2hpY2ggc3VnZ2VzdHMgdGhhdCBicm93c2VycyBzaG91bGQgdXNlIEhUTUxUYWJsZUNlbGxFbGVtZW50IGZvclxuICAgICAqICAgICAgIGJvdGggVEQgYW5kIFRIIGVsZW1lbnRzLiBXaGF0V0cgc2VwYXJhdGVzIHRoZXNlLlxuICAgICAqICAgICAgIFdoYXRXRyBIVE1MIHN0YXRlczpcbiAgICAgKiAgICAgICAgID4gRm9yIGhpc3RvcmljYWwgcmVhc29ucywgV2luZG93IG9iamVjdHMgbXVzdCBhbHNvIGhhdmUgYVxuICAgICAqICAgICAgICAgPiB3cml0YWJsZSwgY29uZmlndXJhYmxlLCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lZFxuICAgICAqICAgICAgICAgPiBIVE1MRG9jdW1lbnQgd2hvc2UgdmFsdWUgaXMgdGhlIERvY3VtZW50IGludGVyZmFjZSBvYmplY3QuXG4gICAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkb2N1bWVudClgYFxuICAgICAqICAtIENocm9tZSA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuICAgICAqICAtIEZpcmVmb3ggPT09IFwiW29iamVjdCBIVE1MRG9jdW1lbnRdXCJcbiAgICAgKiAgLSBTYWZhcmkgPT09IFwiW29iamVjdCBIVE1MRG9jdW1lbnRdXCJcbiAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgRG9jdW1lbnRdXCJcbiAgICAgKiAgLSBJRSAxMSA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuICAgICAqICAtIElFIEVkZ2UgPD0xMyA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuICAgICAqL1xuICAgIGlmICh0eXBlb2Ygd2luZG93LmRvY3VtZW50ID09PSAnb2JqZWN0JyAmJiBvYmogPT09IHdpbmRvdy5kb2N1bWVudCkge1xuICAgICAgcmV0dXJuICdEb2N1bWVudCc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cubmF2aWdhdG9yID09PSAnb2JqZWN0Jykge1xuICAgICAgLyogISBTcGVjIENvbmZvcm1hbmNlXG4gICAgICAgKiAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViYXBwYXBpcy5odG1sI21pbWV0eXBlYXJyYXkpXG4gICAgICAgKiBXaGF0V0cgSFRNTCQ4LjYuMS41IC0gUGx1Z2lucyAtIEludGVyZmFjZSBNaW1lVHlwZUFycmF5XG4gICAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5hdmlnYXRvci5taW1lVHlwZXMpYGBcbiAgICAgICAqICAtIElFIDw9MTAgPT09IFwiW29iamVjdCBNU01pbWVUeXBlc0NvbGxlY3Rpb25dXCJcbiAgICAgICAqL1xuICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubmF2aWdhdG9yLm1pbWVUeXBlcyA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICBvYmogPT09IHdpbmRvdy5uYXZpZ2F0b3IubWltZVR5cGVzKSB7XG4gICAgICAgIHJldHVybiAnTWltZVR5cGVBcnJheSc7XG4gICAgICB9XG5cbiAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3dlYmFwcGFwaXMuaHRtbCNwbHVnaW5hcnJheSlcbiAgICAgICAqIFdoYXRXRyBIVE1MJDguNi4xLjUgLSBQbHVnaW5zIC0gSW50ZXJmYWNlIFBsdWdpbkFycmF5XG4gICAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5hdmlnYXRvci5wbHVnaW5zKWBgXG4gICAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgTVNQbHVnaW5zQ29sbGVjdGlvbl1cIlxuICAgICAgICovXG4gICAgICBpZiAodHlwZW9mIHdpbmRvdy5uYXZpZ2F0b3IucGx1Z2lucyA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICBvYmogPT09IHdpbmRvdy5uYXZpZ2F0b3IucGx1Z2lucykge1xuICAgICAgICByZXR1cm4gJ1BsdWdpbkFycmF5JztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKHR5cGVvZiB3aW5kb3cuSFRNTEVsZW1lbnQgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgICAgdHlwZW9mIHdpbmRvdy5IVE1MRWxlbWVudCA9PT0gJ29iamVjdCcpICYmXG4gICAgICAgIG9iaiBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudCkge1xuICAgICAgLyogISBTcGVjIENvbmZvcm1hbmNlXG4gICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS93ZWJhcHBhcGlzLmh0bWwjcGx1Z2luYXJyYXkpXG4gICAgICAqIFdoYXRXRyBIVE1MJDQuNC40IC0gVGhlIGBibG9ja3F1b3RlYCBlbGVtZW50IC0gSW50ZXJmYWNlIGBIVE1MUXVvdGVFbGVtZW50YFxuICAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Jsb2NrcXVvdGUnKSlgYFxuICAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgSFRNTEJsb2NrRWxlbWVudF1cIlxuICAgICAgKi9cbiAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gJ0JMT0NLUVVPVEUnKSB7XG4gICAgICAgIHJldHVybiAnSFRNTFF1b3RlRWxlbWVudCc7XG4gICAgICB9XG5cbiAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI2h0bWx0YWJsZWRhdGFjZWxsZWxlbWVudClcbiAgICAgICAqIFdoYXRXRyBIVE1MJDQuOS45IC0gVGhlIGB0ZGAgZWxlbWVudCAtIEludGVyZmFjZSBgSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50YFxuICAgICAgICogTm90ZTogTW9zdCBicm93c2VycyBjdXJyZW50bHkgYWRoZXIgdG8gdGhlIFczQyBET00gTGV2ZWwgMiBzcGVjXG4gICAgICAgKiAgICAgICAoaHR0cHM6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0yLUhUTUwvaHRtbC5odG1sI0lELTgyOTE1MDc1KVxuICAgICAgICogICAgICAgd2hpY2ggc3VnZ2VzdHMgdGhhdCBicm93c2VycyBzaG91bGQgdXNlIEhUTUxUYWJsZUNlbGxFbGVtZW50IGZvclxuICAgICAgICogICAgICAgYm90aCBURCBhbmQgVEggZWxlbWVudHMuIFdoYXRXRyBzZXBhcmF0ZXMgdGhlc2UuXG4gICAgICAgKiBUZXN0OiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKSlcbiAgICAgICAqICAtIENocm9tZSA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG4gICAgICAgKiAgLSBGaXJlZm94ID09PSBcIltvYmplY3QgSFRNTFRhYmxlQ2VsbEVsZW1lbnRdXCJcbiAgICAgICAqICAtIFNhZmFyaSA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG4gICAgICAgKi9cbiAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gJ1REJykge1xuICAgICAgICByZXR1cm4gJ0hUTUxUYWJsZURhdGFDZWxsRWxlbWVudCc7XG4gICAgICB9XG5cbiAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI2h0bWx0YWJsZWhlYWRlcmNlbGxlbGVtZW50KVxuICAgICAgICogV2hhdFdHIEhUTUwkNC45LjkgLSBUaGUgYHRkYCBlbGVtZW50IC0gSW50ZXJmYWNlIGBIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudGBcbiAgICAgICAqIE5vdGU6IE1vc3QgYnJvd3NlcnMgY3VycmVudGx5IGFkaGVyIHRvIHRoZSBXM0MgRE9NIExldmVsIDIgc3BlY1xuICAgICAgICogICAgICAgKGh0dHBzOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1IVE1ML2h0bWwuaHRtbCNJRC04MjkxNTA3NSlcbiAgICAgICAqICAgICAgIHdoaWNoIHN1Z2dlc3RzIHRoYXQgYnJvd3NlcnMgc2hvdWxkIHVzZSBIVE1MVGFibGVDZWxsRWxlbWVudCBmb3JcbiAgICAgICAqICAgICAgIGJvdGggVEQgYW5kIFRIIGVsZW1lbnRzLiBXaGF0V0cgc2VwYXJhdGVzIHRoZXNlLlxuICAgICAgICogVGVzdDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoJykpXG4gICAgICAgKiAgLSBDaHJvbWUgPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuICAgICAgICogIC0gRmlyZWZveCA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG4gICAgICAgKiAgLSBTYWZhcmkgPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuICAgICAgICovXG4gICAgICBpZiAob2JqLnRhZ05hbWUgPT09ICdUSCcpIHtcbiAgICAgICAgcmV0dXJuICdIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cbiAgKiBQcmU6XG4gICogICBGbG9hdDY0QXJyYXkgICAgICAgeCA2MjUsNjQ0IG9wcy9zZWMgwrExLjU4JSAoODAgcnVucyBzYW1wbGVkKVxuICAqICAgRmxvYXQzMkFycmF5ICAgICAgIHggMSwyNzksODUyIG9wcy9zZWMgwrEyLjkxJSAoNzcgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDMyQXJyYXkgICAgICAgIHggMSwxNzgsMTg1IG9wcy9zZWMgwrExLjk1JSAoODMgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDE2QXJyYXkgICAgICAgIHggMSwwMDgsMzgwIG9wcy9zZWMgwrEyLjI1JSAoODAgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDhBcnJheSAgICAgICAgIHggMSwxMjgsMDQwIG9wcy9zZWMgwrEyLjExJSAoODEgcnVucyBzYW1wbGVkKVxuICAqICAgSW50MzJBcnJheSAgICAgICAgIHggMSwxNzAsMTE5IG9wcy9zZWMgwrEyLjg4JSAoODAgcnVucyBzYW1wbGVkKVxuICAqICAgSW50MTZBcnJheSAgICAgICAgIHggMSwxNzYsMzQ4IG9wcy9zZWMgwrE1Ljc5JSAoODYgcnVucyBzYW1wbGVkKVxuICAqICAgSW50OEFycmF5ICAgICAgICAgIHggMSwwNTgsNzA3IG9wcy9zZWMgwrE0Ljk0JSAoNzcgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDhDbGFtcGVkQXJyYXkgIHggMSwxMTAsNjMzIG9wcy9zZWMgwrE0LjIwJSAoODAgcnVucyBzYW1wbGVkKVxuICAqIFBvc3Q6XG4gICogICBGbG9hdDY0QXJyYXkgICAgICAgeCA3LDEwNSw2NzEgb3BzL3NlYyDCsTEzLjQ3JSAoNjQgcnVucyBzYW1wbGVkKVxuICAqICAgRmxvYXQzMkFycmF5ICAgICAgIHggNSw4ODcsOTEyIG9wcy9zZWMgwrExLjQ2JSAoODIgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDMyQXJyYXkgICAgICAgIHggNiw0OTEsNjYxIG9wcy9zZWMgwrExLjc2JSAoNzkgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDE2QXJyYXkgICAgICAgIHggNiw1NTksNzk1IG9wcy9zZWMgwrExLjY3JSAoODIgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDhBcnJheSAgICAgICAgIHggNiw0NjMsOTY2IG9wcy9zZWMgwrExLjQzJSAoODUgcnVucyBzYW1wbGVkKVxuICAqICAgSW50MzJBcnJheSAgICAgICAgIHggNSw2NDEsODQxIG9wcy9zZWMgwrEzLjQ5JSAoODEgcnVucyBzYW1wbGVkKVxuICAqICAgSW50MTZBcnJheSAgICAgICAgIHggNiw1ODMsNTExIG9wcy9zZWMgwrExLjk4JSAoODAgcnVucyBzYW1wbGVkKVxuICAqICAgSW50OEFycmF5ICAgICAgICAgIHggNiw2MDYsMDc4IG9wcy9zZWMgwrExLjc0JSAoODEgcnVucyBzYW1wbGVkKVxuICAqICAgVWludDhDbGFtcGVkQXJyYXkgIHggNiw2MDIsMjI0IG9wcy9zZWMgwrExLjc3JSAoODMgcnVucyBzYW1wbGVkKVxuICAqL1xuICB2YXIgc3RyaW5nVGFnID0gKHN5bWJvbFRvU3RyaW5nVGFnRXhpc3RzICYmIG9ialtTeW1ib2wudG9TdHJpbmdUYWddKTtcbiAgaWYgKHR5cGVvZiBzdHJpbmdUYWcgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHN0cmluZ1RhZztcbiAgfVxuXG4gIHZhciBvYmpQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcbiAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cbiAgKiBQcmU6XG4gICogICByZWdleCBsaXRlcmFsICAgICAgeCAxLDc3MiwzODUgb3BzL3NlYyDCsTEuODUlICg3NyBydW5zIHNhbXBsZWQpXG4gICogICByZWdleCBjb25zdHJ1Y3RvciAgeCAyLDE0Myw2MzQgb3BzL3NlYyDCsTIuNDYlICg3OCBydW5zIHNhbXBsZWQpXG4gICogUG9zdDpcbiAgKiAgIHJlZ2V4IGxpdGVyYWwgICAgICB4IDMsOTI4LDAwOSBvcHMvc2VjIMKxMC42NSUgKDc4IHJ1bnMgc2FtcGxlZClcbiAgKiAgIHJlZ2V4IGNvbnN0cnVjdG9yICB4IDMsOTMxLDEwOCBvcHMvc2VjIMKxMC41OCUgKDg0IHJ1bnMgc2FtcGxlZClcbiAgKi9cbiAgaWYgKG9ialByb3RvdHlwZSA9PT0gUmVnRXhwLnByb3RvdHlwZSkge1xuICAgIHJldHVybiAnUmVnRXhwJztcbiAgfVxuXG4gIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG4gICogUHJlOlxuICAqICAgZGF0ZSAgICAgICAgICAgICAgIHggMiwxMzAsMDc0IG9wcy9zZWMgwrE0LjQyJSAoNjggcnVucyBzYW1wbGVkKVxuICAqIFBvc3Q6XG4gICogICBkYXRlICAgICAgICAgICAgICAgeCAzLDk1Myw3Nzkgb3BzL3NlYyDCsTEuMzUlICg3NyBydW5zIHNhbXBsZWQpXG4gICovXG4gIGlmIChvYmpQcm90b3R5cGUgPT09IERhdGUucHJvdG90eXBlKSB7XG4gICAgcmV0dXJuICdEYXRlJztcbiAgfVxuXG4gIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy1wcm9taXNlLnByb3RvdHlwZS1AQHRvc3RyaW5ndGFnKVxuICAgKiBFUzYkMjUuNC41LjQgLSBQcm9taXNlLnByb3RvdHlwZVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJQcm9taXNlXCI6XG4gICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUHJvbWlzZS5yZXNvbHZlKCkpYGBcbiAgICogIC0gQ2hyb21lIDw9NDcgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICogIC0gRWRnZSA8PTIwID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG4gICAqICAtIEZpcmVmb3ggMjktTGF0ZXN0ID09PSBcIltvYmplY3QgUHJvbWlzZV1cIlxuICAgKiAgLSBTYWZhcmkgNy4xLUxhdGVzdCA9PT0gXCJbb2JqZWN0IFByb21pc2VdXCJcbiAgICovXG4gIGlmIChwcm9taXNlRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gUHJvbWlzZS5wcm90b3R5cGUpIHtcbiAgICByZXR1cm4gJ1Byb21pc2UnO1xuICB9XG5cbiAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cbiAgKiBQcmU6XG4gICogICBzZXQgICAgICAgICAgICAgICAgeCAyLDIyMiwxODYgb3BzL3NlYyDCsTEuMzElICg4MiBydW5zIHNhbXBsZWQpXG4gICogUG9zdDpcbiAgKiAgIHNldCAgICAgICAgICAgICAgICB4IDQsNTQ1LDg3OSBvcHMvc2VjIMKxMS4xMyUgKDgzIHJ1bnMgc2FtcGxlZClcbiAgKi9cbiAgaWYgKHNldEV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IFNldC5wcm90b3R5cGUpIHtcbiAgICByZXR1cm4gJ1NldCc7XG4gIH1cblxuICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuICAqIFByZTpcbiAgKiAgIG1hcCAgICAgICAgICAgICAgICB4IDIsMzk2LDg0MiBvcHMvc2VjIMKxMS41OSUgKDgxIHJ1bnMgc2FtcGxlZClcbiAgKiBQb3N0OlxuICAqICAgbWFwICAgICAgICAgICAgICAgIHggNCwxODMsOTQ1IG9wcy9zZWMgwrE2LjU5JSAoODIgcnVucyBzYW1wbGVkKVxuICAqL1xuICBpZiAobWFwRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gTWFwLnByb3RvdHlwZSkge1xuICAgIHJldHVybiAnTWFwJztcbiAgfVxuXG4gIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG4gICogUHJlOlxuICAqICAgd2Vha3NldCAgICAgICAgICAgIHggMSwzMjMsMjIwIG9wcy9zZWMgwrEyLjE3JSAoNzYgcnVucyBzYW1wbGVkKVxuICAqIFBvc3Q6XG4gICogICB3ZWFrc2V0ICAgICAgICAgICAgeCA0LDIzNyw1MTAgb3BzL3NlYyDCsTIuMDElICg3NyBydW5zIHNhbXBsZWQpXG4gICovXG4gIGlmICh3ZWFrU2V0RXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gV2Vha1NldC5wcm90b3R5cGUpIHtcbiAgICByZXR1cm4gJ1dlYWtTZXQnO1xuICB9XG5cbiAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cbiAgKiBQcmU6XG4gICogICB3ZWFrbWFwICAgICAgICAgICAgeCAxLDUwMCwyNjAgb3BzL3NlYyDCsTIuMDIlICg3OCBydW5zIHNhbXBsZWQpXG4gICogUG9zdDpcbiAgKiAgIHdlYWttYXAgICAgICAgICAgICB4IDMsODgxLDM4NCBvcHMvc2VjIMKxMS40NSUgKDgyIHJ1bnMgc2FtcGxlZClcbiAgKi9cbiAgaWYgKHdlYWtNYXBFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBXZWFrTWFwLnByb3RvdHlwZSkge1xuICAgIHJldHVybiAnV2Vha01hcCc7XG4gIH1cblxuICAvKiAhIFNwZWMgQ29uZm9ybWFuY2VcbiAgICogKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvaW5kZXguaHRtbCNzZWMtZGF0YXZpZXcucHJvdG90eXBlLUBAdG9zdHJpbmd0YWcpXG4gICAqIEVTNiQyNC4yLjQuMjEgLSBEYXRhVmlldy5wcm90b3R5cGVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiRGF0YVZpZXdcIjpcbiAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKDEpKSlgYFxuICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICovXG4gIGlmIChkYXRhVmlld0V4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IERhdGFWaWV3LnByb3RvdHlwZSkge1xuICAgIHJldHVybiAnRGF0YVZpZXcnO1xuICB9XG5cbiAgLyogISBTcGVjIENvbmZvcm1hbmNlXG4gICAqIChodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wL2luZGV4Lmh0bWwjc2VjLSVtYXBpdGVyYXRvcnByb3RvdHlwZSUtQEB0b3N0cmluZ3RhZylcbiAgICogRVM2JDIzLjEuNS4yLjIgLSAlTWFwSXRlcmF0b3JQcm90b3R5cGUlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIk1hcCBJdGVyYXRvclwiOlxuICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ldyBNYXAoKS5lbnRyaWVzKCkpYGBcbiAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG4gICAqL1xuICBpZiAobWFwRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gbWFwSXRlcmF0b3JQcm90b3R5cGUpIHtcbiAgICByZXR1cm4gJ01hcCBJdGVyYXRvcic7XG4gIH1cblxuICAvKiAhIFNwZWMgQ29uZm9ybWFuY2VcbiAgICogKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvaW5kZXguaHRtbCNzZWMtJXNldGl0ZXJhdG9ycHJvdG90eXBlJS1AQHRvc3RyaW5ndGFnKVxuICAgKiBFUzYkMjMuMi41LjIuMiAtICVTZXRJdGVyYXRvclByb3RvdHlwZSVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiU2V0IEl0ZXJhdG9yXCI6XG4gICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmV3IFNldCgpLmVudHJpZXMoKSlgYFxuICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICovXG4gIGlmIChzZXRFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBzZXRJdGVyYXRvclByb3RvdHlwZSkge1xuICAgIHJldHVybiAnU2V0IEl0ZXJhdG9yJztcbiAgfVxuXG4gIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy0lYXJyYXlpdGVyYXRvcnByb3RvdHlwZSUtQEB0b3N0cmluZ3RhZylcbiAgICogRVM2JDIyLjEuNS4yLjIgLSAlQXJyYXlJdGVyYXRvclByb3RvdHlwZSVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiQXJyYXkgSXRlcmF0b3JcIjpcbiAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXVtTeW1ib2wuaXRlcmF0b3JdKCkpYGBcbiAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG4gICAqL1xuICBpZiAoYXJyYXlJdGVyYXRvckV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IGFycmF5SXRlcmF0b3JQcm90b3R5cGUpIHtcbiAgICByZXR1cm4gJ0FycmF5IEl0ZXJhdG9yJztcbiAgfVxuXG4gIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy0lc3RyaW5naXRlcmF0b3Jwcm90b3R5cGUlLUBAdG9zdHJpbmd0YWcpXG4gICAqIEVTNiQyMS4xLjUuMi4yIC0gJVN0cmluZ0l0ZXJhdG9yUHJvdG90eXBlJVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJTdHJpbmcgSXRlcmF0b3JcIjpcbiAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCgnJ1tTeW1ib2wuaXRlcmF0b3JdKCkpYGBcbiAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG4gICAqL1xuICBpZiAoc3RyaW5nSXRlcmF0b3JFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBzdHJpbmdJdGVyYXRvclByb3RvdHlwZSkge1xuICAgIHJldHVybiAnU3RyaW5nIEl0ZXJhdG9yJztcbiAgfVxuXG4gIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG4gICogUHJlOlxuICAqICAgb2JqZWN0IGZyb20gbnVsbCAgIHggMiw0MjQsMzIwIG9wcy9zZWMgwrExLjY3JSAoNzYgcnVucyBzYW1wbGVkKVxuICAqIFBvc3Q6XG4gICogICBvYmplY3QgZnJvbSBudWxsICAgeCA1LDgzOCwwMDAgb3BzL3NlYyDCsTAuOTklICg4NCBydW5zIHNhbXBsZWQpXG4gICovXG4gIGlmIChvYmpQcm90b3R5cGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gJ09iamVjdCc7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0XG4gICAgLnByb3RvdHlwZVxuICAgIC50b1N0cmluZ1xuICAgIC5jYWxsKG9iailcbiAgICAuc2xpY2UodG9TdHJpbmdMZWZ0U2xpY2VMZW5ndGgsIHRvU3RyaW5nUmlnaHRTbGljZUxlbmd0aCk7XG59XG5cbnJldHVybiB0eXBlRGV0ZWN0O1xuXG59KSkpO1xuIiwidmFyIGFzc2VydCA9IHJlcXVpcmUoJ2NoYWknKS5hc3NlcnQ7XHJcbm1vY2hhLnNldHVwKCdiZGQnKTtcclxuXHJcbnZhciBzdGFnZSA9IG5ldyBkYWxhLlNWRygnI3N0YWdlJyk7XHJcblxyXG5kZXNjcmliZSgnc2hhcGVzJywgZnVuY3Rpb24oKSB7XHJcbiAgICBpdCgndGVzdCByZWN0IGRpbWVuc2lvbnMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHIxID0gc3RhZ2UucmVjdCgpLmhlaWdodCgzMCkud2lkdGgoNTApLnRyYW5zbGF0ZSgxMCwxMCk7XHJcbiAgICAgICAgYXNzZXJ0Lm9rKHIxKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMzAsIHIxLmhlaWdodCgpLCAncmVjdCBoZWlnaHQgd2l0aG91dCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTAsIHIxLndpZHRoKCksICdyZWN0IHdpZHRoIHdpdGhvdXQgc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCh7eDozNSwgeToyNX0sIHIxLmdldENlbnRlcigpLCAncmVjdCBjZW50ZXIgbm8gc2NhbGUnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNjAsIHIxLmdldFJpZ2h0WCgpKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNDAsIHIxLmdldEJvdHRvbVkoKSk7XHJcbiAgICAgICAgcjEuc3Ryb2tlKCdncmVlbicsIDIpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCgzMiwgcjEuaGVpZ2h0KHRydWUpLCAncmVjdCBoZWlnaHQgd2l0aCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTIsIHIxLndpZHRoKHRydWUpLCAncmVjdCB3aWR0aCB3aXRoIHN0cm9rZScpO1xyXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoe3g6MzUsIHk6MjV9LCByMS5nZXRDZW50ZXIoKSwgJ3JlY3QgY2VudGVyIHdpdGggc3Ryb2tlIG5vIHNjYWxlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDYxLCByMS5nZXRSaWdodFgodHJ1ZSksICdyZWN0IHJpZ2h0IHggd2l0aCBzdHJva2Ugbm8gc2NhbGUnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNDEsIHIxLmdldEJvdHRvbVkodHJ1ZSksICdyZWN0IGJ1dHRvbSB5IHdpdGggc3Ryb2tlIG5vIHNjYWxlJyk7XHJcbiAgICAgICAgcjEuc2NhbGUoMik7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDYwLCByMS5oZWlnaHQoKSwgJ3JlY3QgaGVpZ2h0IHdpdGggc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDY0LCByMS5oZWlnaHQodHJ1ZSksICdyZWN0IGhlaWdodCB3aXRoIHN0cm9rZScpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCgxMDAsIHIxLndpZHRoKCksICdyZWN0IHdpZHRoIHdpdGggc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDEwNCwgcjEud2lkdGgodHJ1ZSksICdyZWN0IHdpZHRoIHdpdGggc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCh7eDo2MCwgeTo0MH0sIHIxLmdldENlbnRlcigpLCAncmVjdCBjZW50ZXIgd2l0aCBzdHJva2Ugc2NhbGUnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMTEwLCByMS5nZXRSaWdodFgoKSwgJ3JlY3QgcmlnaHQgeCB3aXRoIHN0cm9rZSBzY2FsZScpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCgxMTIsIHIxLmdldFJpZ2h0WCh0cnVlKSwgJ3JlY3QgcmlnaHQgeCB3aXRoIHN0cm9rZSBzY2FsZScpO1xyXG5cclxuICAgICAgICBzdGFnZS5oZWxwZXIoKS5wb2ludCgncmNlbnRlcicsIHIxLmdldENlbnRlcigpLCAncmVkJyx0cnVlKTtcclxuICAgICAgICBzdGFnZS5oZWxwZXIoKS5wb2ludCgncmxlZnRUb3BOb1N0cicsIHIxLnBvc2l0aW9uKCksICdyZWQnLHRydWUpO1xyXG4gICAgICAgIHN0YWdlLmhlbHBlcigpLnBvaW50KCdybGVmdFRvcFN0cicsIHIxLnBvc2l0aW9uKHRydWUpLCAneWVsbG93Jyx0cnVlKTtcclxuICAgICAgICBzdGFnZS5oZWxwZXIoKS5wb2ludCgncnJpZ2h0VG9wTm9TdHInLCByMS50b3BSaWdodCgpLCAncmVkJyx0cnVlKTtcclxuICAgICAgICBzdGFnZS5oZWxwZXIoKS5wb2ludCgncnJpZ2h0VG9wU3RyJywgcjEudG9wUmlnaHQodHJ1ZSksICd5ZWxsb3cnLHRydWUpO1xyXG4gICAgICAgIHN0YWdlLmhlbHBlcigpLnBvaW50KCdycmlnaHRCb3ROb1N0cicsIHIxLmJvdHRvbVJpZ2h0KCksICdyZWQnLHRydWUpO1xyXG4gICAgICAgIHN0YWdlLmhlbHBlcigpLnBvaW50KCdycmlnaHRCb3RTdHInLCByMS5ib3R0b21SaWdodCh0cnVlKSwgJ3llbGxvdycsdHJ1ZSk7XHJcbiAgICAgICAgc3RhZ2UuaGVscGVyKCkucG9pbnQoJ3JsZWZ0Qm90Tm9TdHInLCByMS5ib3R0b21MZWZ0KCksICdyZWQnLHRydWUpO1xyXG4gICAgICAgIHN0YWdlLmhlbHBlcigpLnBvaW50KCdybGVmdEJvdFN0cicsIHIxLmJvdHRvbUxlZnQodHJ1ZSksICd5ZWxsb3cnLHRydWUpO1xyXG5cclxuICAgICAgICAvL2Fzc2VydC5lcXVhbCg0MiwgcjEuZ2V0Qm90dG9tWSh0cnVlKSwgJ3JlY3QgYnV0dG9tIHkgd2l0aCBzdHJva2Ugbm8gc2NhbGUnKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCd0ZXN0IGNpcmNsZSBkaW1lbnNpb25zJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjMSA9IHN0YWdlLmNpcmNsZSgpLnIoMjUpO1xyXG4gICAgICAgIGFzc2VydC5vayhjMSk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDUwLCBjMS5oZWlnaHQoKSwgJ2NpcmNsZSBoZWlnaHQgd2l0aG91dCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTAsIGMxLndpZHRoKCksICdjaXJjbGUgd2lkdGggd2l0aG91dCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMjUsIGMxLnIoKSwgJ2NpcmNsZSByIHdpdGhvdXQgc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDI1LCBjMS5yKHRydWUpLCAnY2lyY2xlIHIgd2l0aG91dCBzdHJva2UnKTtcclxuICAgICAgICBjMS5zdHJva2UoJ2dyZWVuJywgMik7XHJcbiAgICAgICAgYzEubW92ZSgyMDAsMzUpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCgyNSwgYzEucigpLCAnY2lyY2xlIHIgd2l0aCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMjYsIGMxLnIodHJ1ZSksICdjaXJjbGUgciB3aXRoIHN0cm9rZScpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCg1MCwgYzEuaGVpZ2h0KCksICdjaXJjbGUgaGVpZ2h0IHdpdGgnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTIsIGMxLmhlaWdodCh0cnVlKSwgJ2NpcmNsZSBoZWlnaHQgd2l0aCBzdHJva2UnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTAsIGMxLndpZHRoKCksICdjaXJjbGUgd2lkdGgnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTIsIGMxLndpZHRoKHRydWUpLCAnY2lyY2xlIHdpZHRoIHdpdGggc3Ryb2tlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbCh7eDoyMDAseTozNX0sIGMxLmdldENlbnRlcigpLCAnY2lyY2xlIGNlbnRlciBubyBzY2FsZScpO1xyXG4gICAgICAgIGMxLnNjYWxlKDIpO1xyXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwoe3g6MjAwLHk6MzV9LCBjMS5nZXRDZW50ZXIoKSwgJ2NpcmNsZSBjZW50ZXIgbm8gc2NhbGUnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoNTAsIGMxLnIoKSwgJ2NpcmNsZSByIHdpdGggc3Ryb2tlYW5kIHNjYWxlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDUyLCBjMS5yKHRydWUpLCAnY2lyY2xlIHIgd2l0aCBzdHJva2UgYW5kIHNjYWxlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDEwMCwgYzEuaGVpZ2h0KCksICdjaXJjbGUgaGVpZ2h0IHN0cm9rZSBhbmQgc2NhbGUnKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMTA0LCBjMS5oZWlnaHQodHJ1ZSksICdjaXJjbGUgaGVpZ2h0IGFuZCBzY2FsZScpO1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCgxMDAsIGMxLndpZHRoKCksICdjaXJjbGUgd2lkdGggYW5kIHNjYWxlJyk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDEwNCwgYzEud2lkdGgodHJ1ZSksICdjaXJjbGUgd2lkdGggYW5kIHNjYWxlJyk7XHJcbiAgICAgICAgYzEubW92ZSgwLDIwKTtcclxuXHJcbiAgICAgICAgLy9UT0RPOiBwb3NpdGlvbiB3aXRoIGFuZCB3aXRob3V0IHN0cm9rZVxyXG4gICAgICAgIHN0YWdlLmhlbHBlcigpLnBvaW50KCdjY2VudGVyJywgYzEuZ2V0Q2VudGVyKCksICdyZWQnLHRydWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaXQoJ3Rlc3Qgc2NhbGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHIyID0gc3RhZ2UucmVjdCgpLmhlaWdodCgyKS53aWR0aCgxMCk7XHJcbiAgICAgICAgcjIuc2NhbGUoMS4yLCAxKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMTIsIHIyLndpZHRoKCkpO1xyXG4gICAgICAgIHZhciByYXRpbyA9IDEgLyAxMDtcclxuICAgICAgICB2YXIgbmV3U2NhbGUgPSAxLjIgKyByYXRpbztcclxuICAgICAgICByMi5zY2FsZShuZXdTY2FsZSwgMSk7XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKDEzLCByMi53aWR0aCgpKTtcclxuICAgICAgICByMi5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGl0KCd0ZXN0IGFwcGVuZCBlbGVtZW50JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBnID0gc3RhZ2UuZygpO1xyXG4gICAgICAgIHZhciByZWN0ID0gZy5hcHBlbmQoc3RhZ2UucmVjdCh7aWQ6J2lubmVyUmVjdCd9KS5oZWlnaHQoNTAwKS53aWR0aCg1MDApKTtcclxuICAgICAgICBhc3NlcnQuZXF1YWwoMSwgZy4kKCkuY2hpbGRyZW4oJyNpbm5lclJlY3QnKS5sZW5ndGgpO1xyXG4gICAgICAgIGFzc2VydC5vayhyZWN0KTtcclxuICAgICAgICBnLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG59KTtcclxuXHJcbm1vY2hhLnJ1bigpO1xyXG4iXX0=
