(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Hardcode image path, because Leaflet's autodetection
// fails, because mapbox.js is not named leaflet.js
window.L.Icon.Default.imagePath = '//api.tiles.mapbox.com/mapbox.js/' + 'v' +
    require('./package.json').version + '/images';

L.mapbox = module.exports = {
    VERSION: require('./package.json').version,
    geocoder: require('./src/geocoder'),
    marker: require('./src/marker'),
    simplestyle: require('./src/simplestyle'),
    tileLayer: require('./src/tile_layer'),
    infoControl: require('./src/info_control'),
    shareControl: require('./src/share_control'),
    legendControl: require('./src/legend_control'),
    geocoderControl: require('./src/geocoder_control'),
    gridControl: require('./src/grid_control'),
    gridLayer: require('./src/grid_layer'),
    featureLayer: require('./src/feature_layer'),
    map: require('./src/map'),
    config: require('./src/config'),
    sanitize: require('sanitize-caja'),
    template: require('mustache').to_html
};

L.mapbox.markerLayer = L.mapbox.featureLayer;

},{"./package.json":7,"./src/config":8,"./src/feature_layer":9,"./src/geocoder":10,"./src/geocoder_control":11,"./src/grid_control":13,"./src/grid_layer":14,"./src/info_control":15,"./src/legend_control":16,"./src/map":18,"./src/marker":19,"./src/share_control":21,"./src/simplestyle":22,"./src/tile_layer":23,"mustache":4,"sanitize-caja":5}],2:[function(require,module,exports){
function xhr(url, callback, cors) {
    var sent = false;

    if (typeof window.XMLHttpRequest === 'undefined') {
        return callback(Error('Browser not supported'));
    }

    if (typeof cors === 'undefined') {
        var m = url.match(/^\s*https?:\/\/[^\/]*/);
        cors = m && (m[0] !== location.protocol + '//' + location.domain +
                (location.port ? ':' + location.port : ''));
    }

    var x;

    function isSuccessful(status) {
        return status >= 200 && status < 300 || status === 304;
    }

    if (cors && (
        // IE7-9 Quirks & Compatibility
        typeof window.XDomainRequest === 'object' ||
        // IE9 Standards mode
        typeof window.XDomainRequest === 'function'
    )) {
        // IE8-10
        x = new window.XDomainRequest();

        // Ensure callback is never called synchronously, i.e., before
        // x.send() returns (this has been observed in the wild).
        // See https://github.com/mapbox/mapbox.js/issues/472
        var original = callback;
        callback = function() {
            if (sent) {
                original.apply(this, arguments);
            } else {
                var that = this, args = arguments;
                setTimeout(function() {
                    original.apply(that, args);
                }, 0);
            }
        }
    } else {
        x = new window.XMLHttpRequest();
    }

    function loaded() {
        if (
            // XDomainRequest
            x.status === undefined ||
            // modern browsers
            isSuccessful(x.status)) callback.call(x, null, x);
        else callback.call(x, x, null);
    }

    // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
    // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
    if ('onload' in x) {
        x.onload = loaded;
    } else {
        x.onreadystatechange = function readystate() {
            if (x.readyState === 4) {
                loaded();
            }
        };
    }

    // Call the callback with the XMLHttpRequest object as an error and prevent
    // it from ever being called again by reassigning it to `noop`
    x.onerror = function error(evt) {
        // XDomainRequest provides no evt parameter
        callback.call(this, evt || true, null);
        callback = function() { };
    };

    // IE9 must have onprogress be set to a unique function.
    x.onprogress = function() { };

    x.ontimeout = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    x.onabort = function(evt) {
        callback.call(this, evt, null);
        callback = function() { };
    };

    // GET is the only supported HTTP Verb by XDomainRequest and is the
    // only one supported here.
    x.open('GET', url, true);

    // Send the request. Sending data is not supported.
    x.send(null);
    sent = true;

    return x;
}

if (typeof module !== 'undefined') module.exports = xhr;

},{}],3:[function(require,module,exports){
/*! JSON v3.2.6 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
;(function (window) {
  // Convenience aliases.
  var getClass = {}.toString, isProperty, forEach, undef;

  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // Detect native implementations.
  var nativeJSON = typeof JSON == "object" && JSON;

  // Set up the JSON 3 namespace, preferring the CommonJS `exports` object if
  // available.
  var JSON3 = typeof exports == "object" && exports && !exports.nodeType && exports;

  if (JSON3 && nativeJSON) {
    // Explicitly delegate to the native `stringify` and `parse`
    // implementations in CommonJS environments.
    JSON3.stringify = nativeJSON.stringify;
    JSON3.parse = nativeJSON.parse;
  } else {
    // Export for web browsers, JavaScript engines, and asynchronous module
    // loaders, using the global `JSON` object if available.
    JSON3 = window.JSON = nativeJSON || {};
  }

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var isExtended = new Date(-3509827334573292);
  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // Internal: Determines whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  function has(name) {
    if (has[name] !== undef) {
      // Return cached feature test result.
      return has[name];
    }

    var isSupported;
    if (name == "bug-string-char-index") {
      // IE <= 7 doesn't support accessing string characters using square
      // bracket notation. IE 8 only supports this for primitives.
      isSupported = "a"[0] != "a";
    } else if (name == "json") {
      // Indicates whether both `JSON.stringify` and `JSON.parse` are
      // supported.
      isSupported = has("json-stringify") && has("json-parse");
    } else {
      var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
      // Test `JSON.stringify`.
      if (name == "json-stringify") {
        var stringify = JSON3.stringify, stringifySupported = typeof stringify == "function" && isExtended;
        if (stringifySupported) {
          // A test function object with a custom `toJSON` method.
          (value = function () {
            return 1;
          }).toJSON = value;
          try {
            stringifySupported =
              // Firefox 3.1b1 and b2 serialize string, number, and boolean
              // primitives as object literals.
              stringify(0) === "0" &&
              // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
              // literals.
              stringify(new Number()) === "0" &&
              stringify(new String()) == '""' &&
              // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
              // does not define a canonical JSON representation (this applies to
              // objects with `toJSON` properties as well, *unless* they are nested
              // within an object or array).
              stringify(getClass) === undef &&
              // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
              // FF 3.1b3 pass this test.
              stringify(undef) === undef &&
              // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
              // respectively, if the value is omitted entirely.
              stringify() === undef &&
              // FF 3.1b1, 2 throw an error if the given value is not a number,
              // string, array, object, Boolean, or `null` literal. This applies to
              // objects with custom `toJSON` methods as well, unless they are nested
              // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
              // methods entirely.
              stringify(value) === "1" &&
              stringify([value]) == "[1]" &&
              // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
              // `"[null]"`.
              stringify([undef]) == "[null]" &&
              // YUI 3.0.0b1 fails to serialize `null` literals.
              stringify(null) == "null" &&
              // FF 3.1b1, 2 halts serialization if an array contains a function:
              // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
              // elides non-JSON values from objects and arrays, unless they
              // define custom `toJSON` methods.
              stringify([undef, getClass, null]) == "[null,null,null]" &&
              // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
              // where character escape codes are expected (e.g., `\b` => `\u0008`).
              stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
              // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
              stringify(null, value) === "1" &&
              stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
              // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
              // serialize extended years.
              stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
              // The milliseconds are optional in ES 5, but required in 5.1.
              stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
              // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
              // four-digit years instead of six-digit years. Credits: @Yaffle.
              stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
              // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
              // values less than 1000. Credits: @Yaffle.
              stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
          } catch (exception) {
            stringifySupported = false;
          }
        }
        isSupported = stringifySupported;
      }
      // Test `JSON.parse`.
      if (name == "json-parse") {
        var parse = JSON3.parse;
        if (typeof parse == "function") {
          try {
            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
            // Conforming implementations should also coerce the initial argument to
            // a string prior to parsing.
            if (parse("0") === 0 && !parse(false)) {
              // Simple parsing test.
              value = parse(serialized);
              var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
              if (parseSupported) {
                try {
                  // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                  parseSupported = !parse('"\t"');
                } catch (exception) {}
                if (parseSupported) {
                  try {
                    // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                    // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                    // certain octal literals.
                    parseSupported = parse("01") !== 1;
                  } catch (exception) {}
                }
                if (parseSupported) {
                  try {
                    // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                    // points. These environments, along with FF 3.1b1 and 2,
                    // also allow trailing commas in JSON objects and arrays.
                    parseSupported = parse("1.") !== 1;
                  } catch (exception) {}
                }
              }
            }
          } catch (exception) {
            parseSupported = false;
          }
        }
        isSupported = parseSupported;
      }
    }
    return has[name] = !!isSupported;
  }

  if (!has("json")) {
    // Common `[[Class]]` name aliases.
    var functionClass = "[object Function]";
    var dateClass = "[object Date]";
    var numberClass = "[object Number]";
    var stringClass = "[object String]";
    var arrayClass = "[object Array]";
    var booleanClass = "[object Boolean]";

    // Detect incomplete support for accessing string characters by index.
    var charIndexBuggy = has("bug-string-char-index");

    // Define additional utility methods if the `Date` methods are buggy.
    if (!isExtended) {
      var floor = Math.floor;
      // A mapping between the months of the year and the number of days between
      // January 1st and the first of the respective month.
      var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      // Internal: Calculates the number of days between the Unix epoch and the
      // first day of the given month.
      var getDay = function (year, month) {
        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
      };
    }

    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if (!(isProperty = {}.hasOwnProperty)) {
      isProperty = function (property) {
        var members = {}, constructor;
        if ((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString": 1
        }, members).toString != getClass) {
          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = function (property) {
            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__, result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          };
        } else {
          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = function (property) {
            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          };
        }
        members = null;
        return isProperty.call(this, property);
      };
    }

    // Internal: A set of primitive types used by `isHostType`.
    var PrimitiveTypes = {
      'boolean': 1,
      'number': 1,
      'string': 1,
      'undefined': 1
    };

    // Internal: Determines if the given object `property` value is a
    // non-primitive.
    var isHostType = function (object, property) {
      var type = typeof object[property];
      return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
    };

    // Internal: Normalizes the `for...in` iteration algorithm across
    // environments. Each enumerated key is yielded to a `callback` function.
    forEach = function (object, callback) {
      var size = 0, Properties, members, property;

      // Tests for bugs in the current environment's `for...in` algorithm. The
      // `valueOf` property inherits the non-enumerable flag from
      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
      (Properties = function () {
        this.valueOf = 0;
      }).prototype.valueOf = 0;

      // Iterate over a new instance of the `Properties` class.
      members = new Properties();
      for (property in members) {
        // Ignore all properties inherited from `Object.prototype`.
        if (isProperty.call(members, property)) {
          size++;
        }
      }
      Properties = members = null;

      // Normalize the iteration algorithm.
      if (!size) {
        // A list of non-enumerable properties inherited from `Object.prototype`.
        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
        // properties.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == functionClass, property, length;
          var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
          for (property in object) {
            // Gecko <= 1.0 enumerates the `prototype` property of functions under
            // certain conditions; IE does not.
            if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
              callback(property);
            }
          }
          // Manually invoke the callback for each non-enumerable property.
          for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
        };
      } else if (size == 2) {
        // Safari <= 2.0.4 enumerates shadowed properties twice.
        forEach = function (object, callback) {
          // Create a set of iterated properties.
          var members = {}, isFunction = getClass.call(object) == functionClass, property;
          for (property in object) {
            // Store each property name to prevent double enumeration. The
            // `prototype` property of functions is not enumerated due to cross-
            // environment inconsistencies.
            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
              callback(property);
            }
          }
        };
      } else {
        // No bugs detected; use the standard `for...in` algorithm.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == functionClass, property, isConstructor;
          for (property in object) {
            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
              callback(property);
            }
          }
          // Manually invoke the callback for the `constructor` property due to
          // cross-environment inconsistencies.
          if (isConstructor || isProperty.call(object, (property = "constructor"))) {
            callback(property);
          }
        };
      }
      return forEach(object, callback);
    };

    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if (!has("json-stringify")) {
      // Internal: A map of control characters and their escaped equivalents.
      var Escapes = {
        92: "\\\\",
        34: '\\"',
        8: "\\b",
        12: "\\f",
        10: "\\n",
        13: "\\r",
        9: "\\t"
      };

      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.
      var leadingZeroes = "000000";
      var toPaddedString = function (width, value) {
        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return (leadingZeroes + (value || 0)).slice(-width);
      };

      // Internal: Double-quotes a string `value`, replacing all ASCII control
      // characters (characters with code unit values between 0 and 31) with
      // their escaped equivalents. This is an implementation of the
      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
      var unicodePrefix = "\\u00";
      var quote = function (value) {
        var result = '"', index = 0, length = value.length, isLarge = length > 10 && charIndexBuggy, symbols;
        if (isLarge) {
          symbols = value.split("");
        }
        for (; index < length; index++) {
          var charCode = value.charCodeAt(index);
          // If the character is a control character, append its Unicode or
          // shorthand escape sequence; otherwise, append the character as-is.
          switch (charCode) {
            case 8: case 9: case 10: case 12: case 13: case 34: case 92:
              result += Escapes[charCode];
              break;
            default:
              if (charCode < 32) {
                result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                break;
              }
              result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];
          }
        }
        return result + '"';
      };

      // Internal: Recursively serializes an object. Implements the
      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
      var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
        var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
        try {
          // Necessary for host object support.
          value = object[property];
        } catch (exception) {}
        if (typeof value == "object" && value) {
          className = getClass.call(value);
          if (className == dateClass && !isProperty.call(value, "toJSON")) {
            if (value > -1 / 0 && value < 1 / 0) {
              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              if (getDay) {
                // Manually compute the year, month, date, hours, minutes,
                // seconds, and milliseconds if the `getUTC*` methods are
                // buggy. Adapted from @Yaffle's `date-shim` project.
                date = floor(value / 864e5);
                for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                date = 1 + date - getDay(year, month);
                // The `time` value specifies the time within the day (see ES
                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                // to compute `A modulo B`, as the `%` operator does not
                // correspond to the `modulo` operation for negative numbers.
                time = (value % 864e5 + 864e5) % 864e5;
                // The hours, minutes, seconds, and milliseconds are obtained by
                // decomposing the time within the day. See section 15.9.1.10.
                hours = floor(time / 36e5) % 24;
                minutes = floor(time / 6e4) % 60;
                seconds = floor(time / 1e3) % 60;
                milliseconds = time % 1e3;
              } else {
                year = value.getUTCFullYear();
                month = value.getUTCMonth();
                date = value.getUTCDate();
                hours = value.getUTCHours();
                minutes = value.getUTCMinutes();
                seconds = value.getUTCSeconds();
                milliseconds = value.getUTCMilliseconds();
              }
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                // Months, dates, hours, minutes, and seconds should have two
                // digits; milliseconds should have three.
                "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                // Milliseconds are optional in ES 5.0, but required in 5.1.
                "." + toPaddedString(3, milliseconds) + "Z";
            } else {
              value = null;
            }
          } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
            // ignores all `toJSON` methods on these objects unless they are
            // defined directly on an instance.
            value = value.toJSON(property);
          }
        }
        if (callback) {
          // If a replacement function was provided, call it to obtain the value
          // for serialization.
          value = callback.call(object, property, value);
        }
        if (value === null) {
          return "null";
        }
        className = getClass.call(value);
        if (className == booleanClass) {
          // Booleans are represented literally.
          return "" + value;
        } else if (className == numberClass) {
          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
          // `"null"`.
          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
        } else if (className == stringClass) {
          // Strings are double-quoted and escaped.
          return quote("" + value);
        }
        // Recursively serialize objects and arrays.
        if (typeof value == "object") {
          // Check for cyclic structures. This is a linear search; performance
          // is inversely proportional to the number of unique nested objects.
          for (length = stack.length; length--;) {
            if (stack[length] === value) {
              // Cyclic structures cannot be serialized by `JSON.stringify`.
              throw TypeError();
            }
          }
          // Add the object to the stack of traversed objects.
          stack.push(value);
          results = [];
          // Save the current indentation level and indent one additional level.
          prefix = indentation;
          indentation += whitespace;
          if (className == arrayClass) {
            // Recursively serialize array elements.
            for (index = 0, length = value.length; index < length; index++) {
              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
              results.push(element === undef ? "null" : element);
            }
            result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
          } else {
            // Recursively serialize object members. Members are selected from
            // either a user-specified list of property names, or the object
            // itself.
            forEach(properties || value, function (property) {
              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
              if (element !== undef) {
                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                // is not the empty string, let `member` {quote(property) + ":"}
                // be the concatenation of `member` and the `space` character."
                // The "`space` character" refers to the literal space
                // character, not the `space` {width} argument provided to
                // `JSON.stringify`.
                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
              }
            });
            result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
          }
          // Remove the object from the traversed object stack.
          stack.pop();
          return result;
        }
      };

      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
      JSON3.stringify = function (source, filter, width) {
        var whitespace, callback, properties, className;
        if (typeof filter == "function" || typeof filter == "object" && filter) {
          if ((className = getClass.call(filter)) == functionClass) {
            callback = filter;
          } else if (className == arrayClass) {
            // Convert the property names array into a makeshift set.
            properties = {};
            for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
          }
        }
        if (width) {
          if ((className = getClass.call(width)) == numberClass) {
            // Convert the `width` to an integer and create a string containing
            // `width` number of space characters.
            if ((width -= width % 1) > 0) {
              for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
            }
          } else if (className == stringClass) {
            whitespace = width.length <= 10 ? width : width.slice(0, 10);
          }
        }
        // Opera <= 7.54u2 discards the values associated with empty string keys
        // (`""`) only if they are used directly within an object member list
        // (e.g., `!("" in { "": 1})`).
        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
      };
    }

    // Public: Parses a JSON source string.
    if (!has("json-parse")) {
      var fromCharCode = String.fromCharCode;

      // Internal: A map of escaped control characters and their unescaped
      // equivalents.
      var Unescapes = {
        92: "\\",
        34: '"',
        47: "/",
        98: "\b",
        116: "\t",
        110: "\n",
        102: "\f",
        114: "\r"
      };

      // Internal: Stores the parser state.
      var Index, Source;

      // Internal: Resets the parser state and throws a `SyntaxError`.
      var abort = function() {
        Index = Source = null;
        throw SyntaxError();
      };

      // Internal: Returns the next token, or `"$"` if the parser has reached
      // the end of the source string. A token may be a string, number, `null`
      // literal, or Boolean literal.
      var lex = function () {
        var source = Source, length = source.length, value, begin, position, isSigned, charCode;
        while (Index < length) {
          charCode = source.charCodeAt(Index);
          switch (charCode) {
            case 9: case 10: case 13: case 32:
              // Skip whitespace tokens, including tabs, carriage returns, line
              // feeds, and space characters.
              Index++;
              break;
            case 123: case 125: case 91: case 93: case 58: case 44:
              // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
              // the current position.
              value = charIndexBuggy ? source.charAt(Index) : source[Index];
              Index++;
              return value;
            case 34:
              // `"` delimits a JSON string; advance to the next character and
              // begin parsing the string. String tokens are prefixed with the
              // sentinel `@` character to distinguish them from punctuators and
              // end-of-string tokens.
              for (value = "@", Index++; Index < length;) {
                charCode = source.charCodeAt(Index);
                if (charCode < 32) {
                  // Unescaped ASCII control characters (those with a code unit
                  // less than the space character) are not permitted.
                  abort();
                } else if (charCode == 92) {
                  // A reverse solidus (`\`) marks the beginning of an escaped
                  // control character (including `"`, `\`, and `/`) or Unicode
                  // escape sequence.
                  charCode = source.charCodeAt(++Index);
                  switch (charCode) {
                    case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                      // Revive escaped control characters.
                      value += Unescapes[charCode];
                      Index++;
                      break;
                    case 117:
                      // `\u` marks the beginning of a Unicode escape sequence.
                      // Advance to the first character and validate the
                      // four-digit code point.
                      begin = ++Index;
                      for (position = Index + 4; Index < position; Index++) {
                        charCode = source.charCodeAt(Index);
                        // A valid sequence comprises four hexdigits (case-
                        // insensitive) that form a single hexadecimal value.
                        if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                          // Invalid Unicode escape sequence.
                          abort();
                        }
                      }
                      // Revive the escaped character.
                      value += fromCharCode("0x" + source.slice(begin, Index));
                      break;
                    default:
                      // Invalid escape sequence.
                      abort();
                  }
                } else {
                  if (charCode == 34) {
                    // An unescaped double-quote character marks the end of the
                    // string.
                    break;
                  }
                  charCode = source.charCodeAt(Index);
                  begin = Index;
                  // Optimize for the common case where a string is valid.
                  while (charCode >= 32 && charCode != 92 && charCode != 34) {
                    charCode = source.charCodeAt(++Index);
                  }
                  // Append the string as-is.
                  value += source.slice(begin, Index);
                }
              }
              if (source.charCodeAt(Index) == 34) {
                // Advance to the next character and return the revived string.
                Index++;
                return value;
              }
              // Unterminated string.
              abort();
            default:
              // Parse numbers and literals.
              begin = Index;
              // Advance past the negative sign, if one is specified.
              if (charCode == 45) {
                isSigned = true;
                charCode = source.charCodeAt(++Index);
              }
              // Parse an integer or floating-point value.
              if (charCode >= 48 && charCode <= 57) {
                // Leading zeroes are interpreted as octal literals.
                if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                  // Illegal octal literal.
                  abort();
                }
                isSigned = false;
                // Parse the integer component.
                for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                // Floats cannot contain a leading decimal point; however, this
                // case is already accounted for by the parser.
                if (source.charCodeAt(Index) == 46) {
                  position = ++Index;
                  // Parse the decimal component.
                  for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                  if (position == Index) {
                    // Illegal trailing decimal.
                    abort();
                  }
                  Index = position;
                }
                // Parse exponents. The `e` denoting the exponent is
                // case-insensitive.
                charCode = source.charCodeAt(Index);
                if (charCode == 101 || charCode == 69) {
                  charCode = source.charCodeAt(++Index);
                  // Skip past the sign following the exponent, if one is
                  // specified.
                  if (charCode == 43 || charCode == 45) {
                    Index++;
                  }
                  // Parse the exponential component.
                  for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                  if (position == Index) {
                    // Illegal empty exponent.
                    abort();
                  }
                  Index = position;
                }
                // Coerce the parsed value to a JavaScript number.
                return +source.slice(begin, Index);
              }
              // A negative sign may only precede numbers.
              if (isSigned) {
                abort();
              }
              // `true`, `false`, and `null` literals.
              if (source.slice(Index, Index + 4) == "true") {
                Index += 4;
                return true;
              } else if (source.slice(Index, Index + 5) == "false") {
                Index += 5;
                return false;
              } else if (source.slice(Index, Index + 4) == "null") {
                Index += 4;
                return null;
              }
              // Unrecognized token.
              abort();
          }
        }
        // Return the sentinel `$` character if the parser has reached the end
        // of the source string.
        return "$";
      };

      // Internal: Parses a JSON `value` token.
      var get = function (value) {
        var results, hasMembers;
        if (value == "$") {
          // Unexpected end of input.
          abort();
        }
        if (typeof value == "string") {
          if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
            // Remove the sentinel `@` character.
            return value.slice(1);
          }
          // Parse object and array literals.
          if (value == "[") {
            // Parses a JSON array, returning a new JavaScript array.
            results = [];
            for (;; hasMembers || (hasMembers = true)) {
              value = lex();
              // A closing square bracket marks the end of the array literal.
              if (value == "]") {
                break;
              }
              // If the array literal contains elements, the current token
              // should be a comma separating the previous element from the
              // next.
              if (hasMembers) {
                if (value == ",") {
                  value = lex();
                  if (value == "]") {
                    // Unexpected trailing `,` in array literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each array element.
                  abort();
                }
              }
              // Elisions and leading commas are not permitted.
              if (value == ",") {
                abort();
              }
              results.push(get(value));
            }
            return results;
          } else if (value == "{") {
            // Parses a JSON object, returning a new JavaScript object.
            results = {};
            for (;; hasMembers || (hasMembers = true)) {
              value = lex();
              // A closing curly brace marks the end of the object literal.
              if (value == "}") {
                break;
              }
              // If the object literal contains members, the current token
              // should be a comma separator.
              if (hasMembers) {
                if (value == ",") {
                  value = lex();
                  if (value == "}") {
                    // Unexpected trailing `,` in object literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each object member.
                  abort();
                }
              }
              // Leading commas are not permitted, object property names must be
              // double-quoted strings, and a `:` must separate each property
              // name and value.
              if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                abort();
              }
              results[value.slice(1)] = get(lex());
            }
            return results;
          }
          // Unexpected token encountered.
          abort();
        }
        return value;
      };

      // Internal: Updates a traversed object member.
      var update = function(source, property, callback) {
        var element = walk(source, property, callback);
        if (element === undef) {
          delete source[property];
        } else {
          source[property] = element;
        }
      };

      // Internal: Recursively traverses a parsed JSON object, invoking the
      // `callback` function for each value. This is an implementation of the
      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
      var walk = function (source, property, callback) {
        var value = source[property], length;
        if (typeof value == "object" && value) {
          // `forEach` can't be used to traverse an array in Opera <= 8.54
          // because its `Object#hasOwnProperty` implementation returns `false`
          // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
          if (getClass.call(value) == arrayClass) {
            for (length = value.length; length--;) {
              update(value, length, callback);
            }
          } else {
            forEach(value, function (property) {
              update(value, property, callback);
            });
          }
        }
        return callback.call(source, property, value);
      };

      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
      JSON3.parse = function (source, callback) {
        var result, value;
        Index = 0;
        Source = "" + source;
        result = get(lex());
        // If a JSON string contains multiple tokens, it is invalid.
        if (lex() != "$") {
          abort();
        }
        // Reset the parser state.
        Index = Source = null;
        return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
      };
    }
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}(this));

},{}],4:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  function Context(view, parent) {
    this.view = view == null ? {} : view;
    this.parent = parent;
    this._cache = { '.': this.view };
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value;
    if (name in this._cache) {
      value = this._cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this._cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  function Writer() {
    this.clearCache();
  }

  Writer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Writer.prototype.compile = function (template, tags) {
    var fn = this._cache[template];

    if (!fn) {
      var tokens = mustache.parse(template, tags);
      fn = this._cache[template] = this.compileTokens(tokens, template);
    }

    return fn;
  };

  Writer.prototype.compilePartial = function (name, template, tags) {
    var fn = this.compile(template, tags);
    this._partialCache[name] = fn;
    return fn;
  };

  Writer.prototype.getPartial = function (name) {
    if (!(name in this._partialCache) && this._loadPartial) {
      this.compilePartial(name, this._loadPartial(name));
    }

    return this._partialCache[name];
  };

  Writer.prototype.compileTokens = function (tokens, template) {
    var self = this;
    return function (view, partials) {
      if (partials) {
        if (isFunction(partials)) {
          self._loadPartial = partials;
        } else {
          for (var name in partials) {
            self.compilePartial(name, partials[name]);
          }
        }
      }

      return renderTokens(tokens, self, Context.make(view), template);
    };
  };

  Writer.prototype.render = function (template, view, partials) {
    return this.compile(template)(view, partials);
  };

  /**
   * Low-level function that renders the given `tokens` using the given `writer`
   * and `context`. The `template` string is only needed for templates that use
   * higher-order sections to extract the portion of the original template that
   * was contained in that section.
   */
  function renderTokens(tokens, writer, context, template) {
    var buffer = '';

    // This function is used to render an artbitrary template
    // in the current context by higher-order functions.
    function subRender(template) {
      return writer.render(template, context);
    }

    var token, tokenValue, value;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      tokenValue = token[1];

      switch (token[0]) {
      case '#':
        value = context.lookup(tokenValue);

        if (typeof value === 'object' || typeof value === 'string') {
          if (isArray(value)) {
            for (var j = 0, jlen = value.length; j < jlen; ++j) {
              buffer += renderTokens(token[4], writer, context.push(value[j]), template);
            }
          } else if (value) {
            buffer += renderTokens(token[4], writer, context.push(value), template);
          }
        } else if (isFunction(value)) {
          var text = template == null ? null : template.slice(token[3], token[5]);
          value = value.call(context.view, text, subRender);
          if (value != null) buffer += value;
        } else if (value) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '^':
        value = context.lookup(tokenValue);

        // Use JavaScript's definition of falsy. Include empty arrays.
        // See https://github.com/janl/mustache.js/issues/186
        if (!value || (isArray(value) && value.length === 0)) {
          buffer += renderTokens(token[4], writer, context, template);
        }

        break;
      case '>':
        value = writer.getPartial(tokenValue);
        if (isFunction(value)) buffer += value(context);
        break;
      case '&':
        value = context.lookup(tokenValue);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(tokenValue);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += tokenValue;
        break;
      }
    }

    return buffer;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];

    var token;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      switch (token[0]) {
      case '#':
      case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;
      case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;
      default:
        collector.push(token);
      }
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          lastToken = token;
          squashedTokens.push(token);
        }
      }
    }

    return squashedTokens;
  }

  function escapeTags(tags) {
    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  function parseTemplate(template, tags) {
    template = template || '';
    tags = tags || mustache.tags;

    if (typeof tags === 'string') tags = tags.split(spaceRe);
    if (tags.length !== 2) throw new Error('Invalid tags: ' + tags.join(', '));

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr == '\n') stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) throw new Error('Unclosed tag at ' + scanner.pos);

      token = [type, value, start, scanner.pos];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();
        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tags = value.split(spaceRe);
        if (tags.length !== 2) {
          throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
        }
        tagRes = escapeTags(tags);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  mustache.name = "mustache.js";
  mustache.version = "0.7.3";
  mustache.tags = ["{{", "}}"];

  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  mustache.parse = parseTemplate;

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // All Mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates and partials in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Compiles the given `template` to a reusable function using the default
   * writer.
   */
  mustache.compile = function (template, tags) {
    return defaultWriter.compile(template, tags);
  };

  /**
   * Compiles the partial with the given `name` and `template` to a reusable
   * function using the default writer.
   */
  mustache.compilePartial = function (name, template, tags) {
    return defaultWriter.compilePartial(name, template, tags);
  };

  /**
   * Compiles the given array of tokens (the output of a parse) to a reusable
   * function using the default writer.
   */
  mustache.compileTokens = function (tokens, template) {
    return defaultWriter.compileTokens(tokens, template);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

}));

},{}],5:[function(require,module,exports){
var html_sanitize = require('./sanitizer-bundle.js');

module.exports = function(_) {
    if (!_) return '';
    return html_sanitize(_, cleanUrl, cleanId);
};

// https://bugzilla.mozilla.org/show_bug.cgi?id=255107
function cleanUrl(url) {
    'use strict';
    if (/^https?/.test(url.getScheme())) return url.toString();
    if ('data' == url.getScheme() && /^image/.test(url.getPath())) {
        return url.toString();
    }
}

function cleanId(id) { return id; }

},{"./sanitizer-bundle.js":6}],6:[function(require,module,exports){

// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 * Implements RFC 3986 for parsing/formatting URIs.
 *
 * @author mikesamuel@gmail.com
 * \@provides URI
 * \@overrides window
 */

var URI = (function () {

/**
 * creates a uri from the string form.  The parser is relaxed, so special
 * characters that aren't escaped but don't cause ambiguities will not cause
 * parse failures.
 *
 * @return {URI|null}
 */
function parse(uriStr) {
  var m = ('' + uriStr).match(URI_RE_);
  if (!m) { return null; }
  return new URI(
      nullIfAbsent(m[1]),
      nullIfAbsent(m[2]),
      nullIfAbsent(m[3]),
      nullIfAbsent(m[4]),
      nullIfAbsent(m[5]),
      nullIfAbsent(m[6]),
      nullIfAbsent(m[7]));
}


/**
 * creates a uri from the given parts.
 *
 * @param scheme {string} an unencoded scheme such as "http" or null
 * @param credentials {string} unencoded user credentials or null
 * @param domain {string} an unencoded domain name or null
 * @param port {number} a port number in [1, 32768].
 *    -1 indicates no port, as does null.
 * @param path {string} an unencoded path
 * @param query {Array.<string>|string|null} a list of unencoded cgi
 *   parameters where even values are keys and odds the corresponding values
 *   or an unencoded query.
 * @param fragment {string} an unencoded fragment without the "#" or null.
 * @return {URI}
 */
function create(scheme, credentials, domain, port, path, query, fragment) {
  var uri = new URI(
      encodeIfExists2(scheme, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_),
      encodeIfExists2(
          credentials, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_),
      encodeIfExists(domain),
      port > 0 ? port.toString() : null,
      encodeIfExists2(path, URI_DISALLOWED_IN_PATH_),
      null,
      encodeIfExists(fragment));
  if (query) {
    if ('string' === typeof query) {
      uri.setRawQuery(query.replace(/[^?&=0-9A-Za-z_\-~.%]/g, encodeOne));
    } else {
      uri.setAllParameters(query);
    }
  }
  return uri;
}
function encodeIfExists(unescapedPart) {
  if ('string' == typeof unescapedPart) {
    return encodeURIComponent(unescapedPart);
  }
  return null;
};
/**
 * if unescapedPart is non null, then escapes any characters in it that aren't
 * valid characters in a url and also escapes any special characters that
 * appear in extra.
 *
 * @param unescapedPart {string}
 * @param extra {RegExp} a character set of characters in [\01-\177].
 * @return {string|null} null iff unescapedPart == null.
 */
function encodeIfExists2(unescapedPart, extra) {
  if ('string' == typeof unescapedPart) {
    return encodeURI(unescapedPart).replace(extra, encodeOne);
  }
  return null;
};
/** converts a character in [\01-\177] to its url encoded equivalent. */
function encodeOne(ch) {
  var n = ch.charCodeAt(0);
  return '%' + '0123456789ABCDEF'.charAt((n >> 4) & 0xf) +
      '0123456789ABCDEF'.charAt(n & 0xf);
}

/**
 * {@updoc
 *  $ normPath('foo/./bar')
 *  # 'foo/bar'
 *  $ normPath('./foo')
 *  # 'foo'
 *  $ normPath('foo/.')
 *  # 'foo'
 *  $ normPath('foo//bar')
 *  # 'foo/bar'
 * }
 */
function normPath(path) {
  return path.replace(/(^|\/)\.(?:\/|$)/g, '$1').replace(/\/{2,}/g, '/');
}

var PARENT_DIRECTORY_HANDLER = new RegExp(
    ''
    // A path break
    + '(/|^)'
    // followed by a non .. path element
    // (cannot be . because normPath is used prior to this RegExp)
    + '(?:[^./][^/]*|\\.{2,}(?:[^./][^/]*)|\\.{3,}[^/]*)'
    // followed by .. followed by a path break.
    + '/\\.\\.(?:/|$)');

var PARENT_DIRECTORY_HANDLER_RE = new RegExp(PARENT_DIRECTORY_HANDLER);

var EXTRA_PARENT_PATHS_RE = /^(?:\.\.\/)*(?:\.\.$)?/;

/**
 * Normalizes its input path and collapses all . and .. sequences except for
 * .. sequences that would take it above the root of the current parent
 * directory.
 * {@updoc
 *  $ collapse_dots('foo/../bar')
 *  # 'bar'
 *  $ collapse_dots('foo/./bar')
 *  # 'foo/bar'
 *  $ collapse_dots('foo/../bar/./../../baz')
 *  # 'baz'
 *  $ collapse_dots('../foo')
 *  # '../foo'
 *  $ collapse_dots('../foo').replace(EXTRA_PARENT_PATHS_RE, '')
 *  # 'foo'
 * }
 */
function collapse_dots(path) {
  if (path === null) { return null; }
  var p = normPath(path);
  // Only /../ left to flatten
  var r = PARENT_DIRECTORY_HANDLER_RE;
  // We replace with $1 which matches a / before the .. because this
  // guarantees that:
  // (1) we have at most 1 / between the adjacent place,
  // (2) always have a slash if there is a preceding path section, and
  // (3) we never turn a relative path into an absolute path.
  for (var q; (q = p.replace(r, '$1')) != p; p = q) {};
  return p;
}

/**
 * resolves a relative url string to a base uri.
 * @return {URI}
 */
function resolve(baseUri, relativeUri) {
  // there are several kinds of relative urls:
  // 1. //foo - replaces everything from the domain on.  foo is a domain name
  // 2. foo - replaces the last part of the path, the whole query and fragment
  // 3. /foo - replaces the the path, the query and fragment
  // 4. ?foo - replace the query and fragment
  // 5. #foo - replace the fragment only

  var absoluteUri = baseUri.clone();
  // we satisfy these conditions by looking for the first part of relativeUri
  // that is not blank and applying defaults to the rest

  var overridden = relativeUri.hasScheme();

  if (overridden) {
    absoluteUri.setRawScheme(relativeUri.getRawScheme());
  } else {
    overridden = relativeUri.hasCredentials();
  }

  if (overridden) {
    absoluteUri.setRawCredentials(relativeUri.getRawCredentials());
  } else {
    overridden = relativeUri.hasDomain();
  }

  if (overridden) {
    absoluteUri.setRawDomain(relativeUri.getRawDomain());
  } else {
    overridden = relativeUri.hasPort();
  }

  var rawPath = relativeUri.getRawPath();
  var simplifiedPath = collapse_dots(rawPath);
  if (overridden) {
    absoluteUri.setPort(relativeUri.getPort());
    simplifiedPath = simplifiedPath
        && simplifiedPath.replace(EXTRA_PARENT_PATHS_RE, '');
  } else {
    overridden = !!rawPath;
    if (overridden) {
      // resolve path properly
      if (simplifiedPath.charCodeAt(0) !== 0x2f /* / */) {  // path is relative
        var absRawPath = collapse_dots(absoluteUri.getRawPath() || '')
            .replace(EXTRA_PARENT_PATHS_RE, '');
        var slash = absRawPath.lastIndexOf('/') + 1;
        simplifiedPath = collapse_dots(
            (slash ? absRawPath.substring(0, slash) : '')
            + collapse_dots(rawPath))
            .replace(EXTRA_PARENT_PATHS_RE, '');
      }
    } else {
      simplifiedPath = simplifiedPath
          && simplifiedPath.replace(EXTRA_PARENT_PATHS_RE, '');
      if (simplifiedPath !== rawPath) {
        absoluteUri.setRawPath(simplifiedPath);
      }
    }
  }

  if (overridden) {
    absoluteUri.setRawPath(simplifiedPath);
  } else {
    overridden = relativeUri.hasQuery();
  }

  if (overridden) {
    absoluteUri.setRawQuery(relativeUri.getRawQuery());
  } else {
    overridden = relativeUri.hasFragment();
  }

  if (overridden) {
    absoluteUri.setRawFragment(relativeUri.getRawFragment());
  }

  return absoluteUri;
}

/**
 * a mutable URI.
 *
 * This class contains setters and getters for the parts of the URI.
 * The <tt>getXYZ</tt>/<tt>setXYZ</tt> methods return the decoded part -- so
 * <code>uri.parse('/foo%20bar').getPath()</code> will return the decoded path,
 * <tt>/foo bar</tt>.
 *
 * <p>The raw versions of fields are available too.
 * <code>uri.parse('/foo%20bar').getRawPath()</code> will return the raw path,
 * <tt>/foo%20bar</tt>.  Use the raw setters with care, since
 * <code>URI::toString</code> is not guaranteed to return a valid url if a
 * raw setter was used.
 *
 * <p>All setters return <tt>this</tt> and so may be chained, a la
 * <code>uri.parse('/foo').setFragment('part').toString()</code>.
 *
 * <p>You should not use this constructor directly -- please prefer the factory
 * functions {@link uri.parse}, {@link uri.create}, {@link uri.resolve}
 * instead.</p>
 *
 * <p>The parameters are all raw (assumed to be properly escaped) parts, and
 * any (but not all) may be null.  Undefined is not allowed.</p>
 *
 * @constructor
 */
function URI(
    rawScheme,
    rawCredentials, rawDomain, port,
    rawPath, rawQuery, rawFragment) {
  this.scheme_ = rawScheme;
  this.credentials_ = rawCredentials;
  this.domain_ = rawDomain;
  this.port_ = port;
  this.path_ = rawPath;
  this.query_ = rawQuery;
  this.fragment_ = rawFragment;
  /**
   * @type {Array|null}
   */
  this.paramCache_ = null;
}

/** returns the string form of the url. */
URI.prototype.toString = function () {
  var out = [];
  if (null !== this.scheme_) { out.push(this.scheme_, ':'); }
  if (null !== this.domain_) {
    out.push('//');
    if (null !== this.credentials_) { out.push(this.credentials_, '@'); }
    out.push(this.domain_);
    if (null !== this.port_) { out.push(':', this.port_.toString()); }
  }
  if (null !== this.path_) { out.push(this.path_); }
  if (null !== this.query_) { out.push('?', this.query_); }
  if (null !== this.fragment_) { out.push('#', this.fragment_); }
  return out.join('');
};

URI.prototype.clone = function () {
  return new URI(this.scheme_, this.credentials_, this.domain_, this.port_,
                 this.path_, this.query_, this.fragment_);
};

URI.prototype.getScheme = function () {
  // HTML5 spec does not require the scheme to be lowercased but
  // all common browsers except Safari lowercase the scheme.
  return this.scheme_ && decodeURIComponent(this.scheme_).toLowerCase();
};
URI.prototype.getRawScheme = function () {
  return this.scheme_;
};
URI.prototype.setScheme = function (newScheme) {
  this.scheme_ = encodeIfExists2(
      newScheme, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_);
  return this;
};
URI.prototype.setRawScheme = function (newScheme) {
  this.scheme_ = newScheme ? newScheme : null;
  return this;
};
URI.prototype.hasScheme = function () {
  return null !== this.scheme_;
};


URI.prototype.getCredentials = function () {
  return this.credentials_ && decodeURIComponent(this.credentials_);
};
URI.prototype.getRawCredentials = function () {
  return this.credentials_;
};
URI.prototype.setCredentials = function (newCredentials) {
  this.credentials_ = encodeIfExists2(
      newCredentials, URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_);

  return this;
};
URI.prototype.setRawCredentials = function (newCredentials) {
  this.credentials_ = newCredentials ? newCredentials : null;
  return this;
};
URI.prototype.hasCredentials = function () {
  return null !== this.credentials_;
};


URI.prototype.getDomain = function () {
  return this.domain_ && decodeURIComponent(this.domain_);
};
URI.prototype.getRawDomain = function () {
  return this.domain_;
};
URI.prototype.setDomain = function (newDomain) {
  return this.setRawDomain(newDomain && encodeURIComponent(newDomain));
};
URI.prototype.setRawDomain = function (newDomain) {
  this.domain_ = newDomain ? newDomain : null;
  // Maintain the invariant that paths must start with a slash when the URI
  // is not path-relative.
  return this.setRawPath(this.path_);
};
URI.prototype.hasDomain = function () {
  return null !== this.domain_;
};


URI.prototype.getPort = function () {
  return this.port_ && decodeURIComponent(this.port_);
};
URI.prototype.setPort = function (newPort) {
  if (newPort) {
    newPort = Number(newPort);
    if (newPort !== (newPort & 0xffff)) {
      throw new Error('Bad port number ' + newPort);
    }
    this.port_ = '' + newPort;
  } else {
    this.port_ = null;
  }
  return this;
};
URI.prototype.hasPort = function () {
  return null !== this.port_;
};


URI.prototype.getPath = function () {
  return this.path_ && decodeURIComponent(this.path_);
};
URI.prototype.getRawPath = function () {
  return this.path_;
};
URI.prototype.setPath = function (newPath) {
  return this.setRawPath(encodeIfExists2(newPath, URI_DISALLOWED_IN_PATH_));
};
URI.prototype.setRawPath = function (newPath) {
  if (newPath) {
    newPath = String(newPath);
    this.path_ = 
      // Paths must start with '/' unless this is a path-relative URL.
      (!this.domain_ || /^\//.test(newPath)) ? newPath : '/' + newPath;
  } else {
    this.path_ = null;
  }
  return this;
};
URI.prototype.hasPath = function () {
  return null !== this.path_;
};


URI.prototype.getQuery = function () {
  // From http://www.w3.org/Addressing/URL/4_URI_Recommentations.html
  // Within the query string, the plus sign is reserved as shorthand notation
  // for a space.
  return this.query_ && decodeURIComponent(this.query_).replace(/\+/g, ' ');
};
URI.prototype.getRawQuery = function () {
  return this.query_;
};
URI.prototype.setQuery = function (newQuery) {
  this.paramCache_ = null;
  this.query_ = encodeIfExists(newQuery);
  return this;
};
URI.prototype.setRawQuery = function (newQuery) {
  this.paramCache_ = null;
  this.query_ = newQuery ? newQuery : null;
  return this;
};
URI.prototype.hasQuery = function () {
  return null !== this.query_;
};

/**
 * sets the query given a list of strings of the form
 * [ key0, value0, key1, value1, ... ].
 *
 * <p><code>uri.setAllParameters(['a', 'b', 'c', 'd']).getQuery()</code>
 * will yield <code>'a=b&c=d'</code>.
 */
URI.prototype.setAllParameters = function (params) {
  if (typeof params === 'object') {
    if (!(params instanceof Array)
        && (params instanceof Object
            || Object.prototype.toString.call(params) !== '[object Array]')) {
      var newParams = [];
      var i = -1;
      for (var k in params) {
        var v = params[k];
        if ('string' === typeof v) {
          newParams[++i] = k;
          newParams[++i] = v;
        }
      }
      params = newParams;
    }
  }
  this.paramCache_ = null;
  var queryBuf = [];
  var separator = '';
  for (var j = 0; j < params.length;) {
    var k = params[j++];
    var v = params[j++];
    queryBuf.push(separator, encodeURIComponent(k.toString()));
    separator = '&';
    if (v) {
      queryBuf.push('=', encodeURIComponent(v.toString()));
    }
  }
  this.query_ = queryBuf.join('');
  return this;
};
URI.prototype.checkParameterCache_ = function () {
  if (!this.paramCache_) {
    var q = this.query_;
    if (!q) {
      this.paramCache_ = [];
    } else {
      var cgiParams = q.split(/[&\?]/);
      var out = [];
      var k = -1;
      for (var i = 0; i < cgiParams.length; ++i) {
        var m = cgiParams[i].match(/^([^=]*)(?:=(.*))?$/);
        // From http://www.w3.org/Addressing/URL/4_URI_Recommentations.html
        // Within the query string, the plus sign is reserved as shorthand
        // notation for a space.
        out[++k] = decodeURIComponent(m[1]).replace(/\+/g, ' ');
        out[++k] = decodeURIComponent(m[2] || '').replace(/\+/g, ' ');
      }
      this.paramCache_ = out;
    }
  }
};
/**
 * sets the values of the named cgi parameters.
 *
 * <p>So, <code>uri.parse('foo?a=b&c=d&e=f').setParameterValues('c', ['new'])
 * </code> yields <tt>foo?a=b&c=new&e=f</tt>.</p>
 *
 * @param key {string}
 * @param values {Array.<string>} the new values.  If values is a single string
 *   then it will be treated as the sole value.
 */
URI.prototype.setParameterValues = function (key, values) {
  // be nice and avoid subtle bugs where [] operator on string performs charAt
  // on some browsers and crashes on IE
  if (typeof values === 'string') {
    values = [ values ];
  }

  this.checkParameterCache_();
  var newValueIndex = 0;
  var pc = this.paramCache_;
  var params = [];
  for (var i = 0, k = 0; i < pc.length; i += 2) {
    if (key === pc[i]) {
      if (newValueIndex < values.length) {
        params.push(key, values[newValueIndex++]);
      }
    } else {
      params.push(pc[i], pc[i + 1]);
    }
  }
  while (newValueIndex < values.length) {
    params.push(key, values[newValueIndex++]);
  }
  this.setAllParameters(params);
  return this;
};
URI.prototype.removeParameter = function (key) {
  return this.setParameterValues(key, []);
};
/**
 * returns the parameters specified in the query part of the uri as a list of
 * keys and values like [ key0, value0, key1, value1, ... ].
 *
 * @return {Array.<string>}
 */
URI.prototype.getAllParameters = function () {
  this.checkParameterCache_();
  return this.paramCache_.slice(0, this.paramCache_.length);
};
/**
 * returns the value<b>s</b> for a given cgi parameter as a list of decoded
 * query parameter values.
 * @return {Array.<string>}
 */
URI.prototype.getParameterValues = function (paramNameUnescaped) {
  this.checkParameterCache_();
  var values = [];
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    if (paramNameUnescaped === this.paramCache_[i]) {
      values.push(this.paramCache_[i + 1]);
    }
  }
  return values;
};
/**
 * returns a map of cgi parameter names to (non-empty) lists of values.
 * @return {Object.<string,Array.<string>>}
 */
URI.prototype.getParameterMap = function (paramNameUnescaped) {
  this.checkParameterCache_();
  var paramMap = {};
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    var key = this.paramCache_[i++],
      value = this.paramCache_[i++];
    if (!(key in paramMap)) {
      paramMap[key] = [value];
    } else {
      paramMap[key].push(value);
    }
  }
  return paramMap;
};
/**
 * returns the first value for a given cgi parameter or null if the given
 * parameter name does not appear in the query string.
 * If the given parameter name does appear, but has no '<tt>=</tt>' following
 * it, then the empty string will be returned.
 * @return {string|null}
 */
URI.prototype.getParameterValue = function (paramNameUnescaped) {
  this.checkParameterCache_();
  for (var i = 0; i < this.paramCache_.length; i += 2) {
    if (paramNameUnescaped === this.paramCache_[i]) {
      return this.paramCache_[i + 1];
    }
  }
  return null;
};

URI.prototype.getFragment = function () {
  return this.fragment_ && decodeURIComponent(this.fragment_);
};
URI.prototype.getRawFragment = function () {
  return this.fragment_;
};
URI.prototype.setFragment = function (newFragment) {
  this.fragment_ = newFragment ? encodeURIComponent(newFragment) : null;
  return this;
};
URI.prototype.setRawFragment = function (newFragment) {
  this.fragment_ = newFragment ? newFragment : null;
  return this;
};
URI.prototype.hasFragment = function () {
  return null !== this.fragment_;
};

function nullIfAbsent(matchPart) {
  return ('string' == typeof matchPart) && (matchPart.length > 0)
         ? matchPart
         : null;
}




/**
 * a regular expression for breaking a URI into its component parts.
 *
 * <p>http://www.gbiv.com/protocols/uri/rfc/rfc3986.html#RFC2234 says
 * As the "first-match-wins" algorithm is identical to the "greedy"
 * disambiguation method used by POSIX regular expressions, it is natural and
 * commonplace to use a regular expression for parsing the potential five
 * components of a URI reference.
 *
 * <p>The following line is the regular expression for breaking-down a
 * well-formed URI reference into its components.
 *
 * <pre>
 * ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
 *  12            3  4          5       6  7        8 9
 * </pre>
 *
 * <p>The numbers in the second line above are only to assist readability; they
 * indicate the reference points for each subexpression (i.e., each paired
 * parenthesis). We refer to the value matched for subexpression <n> as $<n>.
 * For example, matching the above expression to
 * <pre>
 *     http://www.ics.uci.edu/pub/ietf/uri/#Related
 * </pre>
 * results in the following subexpression matches:
 * <pre>
 *    $1 = http:
 *    $2 = http
 *    $3 = //www.ics.uci.edu
 *    $4 = www.ics.uci.edu
 *    $5 = /pub/ietf/uri/
 *    $6 = <undefined>
 *    $7 = <undefined>
 *    $8 = #Related
 *    $9 = Related
 * </pre>
 * where <undefined> indicates that the component is not present, as is the
 * case for the query component in the above example. Therefore, we can
 * determine the value of the five components as
 * <pre>
 *    scheme    = $2
 *    authority = $4
 *    path      = $5
 *    query     = $7
 *    fragment  = $9
 * </pre>
 *
 * <p>msamuel: I have modified the regular expression slightly to expose the
 * credentials, domain, and port separately from the authority.
 * The modified version yields
 * <pre>
 *    $1 = http              scheme
 *    $2 = <undefined>       credentials -\
 *    $3 = www.ics.uci.edu   domain       | authority
 *    $4 = <undefined>       port        -/
 *    $5 = /pub/ietf/uri/    path
 *    $6 = <undefined>       query without ?
 *    $7 = Related           fragment without #
 * </pre>
 */
var URI_RE_ = new RegExp(
      "^" +
      "(?:" +
        "([^:/?#]+)" +         // scheme
      ":)?" +
      "(?://" +
        "(?:([^/?#]*)@)?" +    // credentials
        "([^/?#:@]*)" +        // domain
        "(?::([0-9]+))?" +     // port
      ")?" +
      "([^?#]+)?" +            // path
      "(?:\\?([^#]*))?" +      // query
      "(?:#(.*))?" +           // fragment
      "$"
      );

var URI_DISALLOWED_IN_SCHEME_OR_CREDENTIALS_ = /[#\/\?@]/g;
var URI_DISALLOWED_IN_PATH_ = /[\#\?]/g;

URI.parse = parse;
URI.create = create;
URI.resolve = resolve;
URI.collapse_dots = collapse_dots;  // Visible for testing.

// lightweight string-based api for loadModuleMaker
URI.utils = {
  mimeTypeOf: function (uri) {
    var uriObj = parse(uri);
    if (/\.html$/.test(uriObj.getPath())) {
      return 'text/html';
    } else {
      return 'application/javascript';
    }
  },
  resolve: function (base, uri) {
    if (base) {
      return resolve(parse(base), parse(uri)).toString();
    } else {
      return '' + uri;
    }
  }
};


return URI;
})();

// Copyright Google Inc.
// Licensed under the Apache Licence Version 2.0
// Autogenerated at Mon Feb 25 13:05:42 EST 2013
// @overrides window
// @provides html4
var html4 = {};
html4.atype = {
  'NONE': 0,
  'URI': 1,
  'URI_FRAGMENT': 11,
  'SCRIPT': 2,
  'STYLE': 3,
  'HTML': 12,
  'ID': 4,
  'IDREF': 5,
  'IDREFS': 6,
  'GLOBAL_NAME': 7,
  'LOCAL_NAME': 8,
  'CLASSES': 9,
  'FRAME_TARGET': 10,
  'MEDIA_QUERY': 13
};
html4[ 'atype' ] = html4.atype;
html4.ATTRIBS = {
  '*::class': 9,
  '*::dir': 0,
  '*::draggable': 0,
  '*::hidden': 0,
  '*::id': 4,
  '*::inert': 0,
  '*::itemprop': 0,
  '*::itemref': 6,
  '*::itemscope': 0,
  '*::lang': 0,
  '*::onblur': 2,
  '*::onchange': 2,
  '*::onclick': 2,
  '*::ondblclick': 2,
  '*::onfocus': 2,
  '*::onkeydown': 2,
  '*::onkeypress': 2,
  '*::onkeyup': 2,
  '*::onload': 2,
  '*::onmousedown': 2,
  '*::onmousemove': 2,
  '*::onmouseout': 2,
  '*::onmouseover': 2,
  '*::onmouseup': 2,
  '*::onreset': 2,
  '*::onscroll': 2,
  '*::onselect': 2,
  '*::onsubmit': 2,
  '*::onunload': 2,
  '*::spellcheck': 0,
  '*::style': 3,
  '*::title': 0,
  '*::translate': 0,
  'a::accesskey': 0,
  'a::coords': 0,
  'a::href': 1,
  'a::hreflang': 0,
  'a::name': 7,
  'a::onblur': 2,
  'a::onfocus': 2,
  'a::shape': 0,
  'a::tabindex': 0,
  'a::target': 10,
  'a::type': 0,
  'area::accesskey': 0,
  'area::alt': 0,
  'area::coords': 0,
  'area::href': 1,
  'area::nohref': 0,
  'area::onblur': 2,
  'area::onfocus': 2,
  'area::shape': 0,
  'area::tabindex': 0,
  'area::target': 10,
  'audio::controls': 0,
  'audio::loop': 0,
  'audio::mediagroup': 5,
  'audio::muted': 0,
  'audio::preload': 0,
  'bdo::dir': 0,
  'blockquote::cite': 1,
  'br::clear': 0,
  'button::accesskey': 0,
  'button::disabled': 0,
  'button::name': 8,
  'button::onblur': 2,
  'button::onfocus': 2,
  'button::tabindex': 0,
  'button::type': 0,
  'button::value': 0,
  'canvas::height': 0,
  'canvas::width': 0,
  'caption::align': 0,
  'col::align': 0,
  'col::char': 0,
  'col::charoff': 0,
  'col::span': 0,
  'col::valign': 0,
  'col::width': 0,
  'colgroup::align': 0,
  'colgroup::char': 0,
  'colgroup::charoff': 0,
  'colgroup::span': 0,
  'colgroup::valign': 0,
  'colgroup::width': 0,
  'command::checked': 0,
  'command::command': 5,
  'command::disabled': 0,
  'command::icon': 1,
  'command::label': 0,
  'command::radiogroup': 0,
  'command::type': 0,
  'data::value': 0,
  'del::cite': 1,
  'del::datetime': 0,
  'details::open': 0,
  'dir::compact': 0,
  'div::align': 0,
  'dl::compact': 0,
  'fieldset::disabled': 0,
  'font::color': 0,
  'font::face': 0,
  'font::size': 0,
  'form::accept': 0,
  'form::action': 1,
  'form::autocomplete': 0,
  'form::enctype': 0,
  'form::method': 0,
  'form::name': 7,
  'form::novalidate': 0,
  'form::onreset': 2,
  'form::onsubmit': 2,
  'form::target': 10,
  'h1::align': 0,
  'h2::align': 0,
  'h3::align': 0,
  'h4::align': 0,
  'h5::align': 0,
  'h6::align': 0,
  'hr::align': 0,
  'hr::noshade': 0,
  'hr::size': 0,
  'hr::width': 0,
  'iframe::align': 0,
  'iframe::frameborder': 0,
  'iframe::height': 0,
  'iframe::marginheight': 0,
  'iframe::marginwidth': 0,
  'iframe::width': 0,
  'img::align': 0,
  'img::alt': 0,
  'img::border': 0,
  'img::height': 0,
  'img::hspace': 0,
  'img::ismap': 0,
  'img::name': 7,
  'img::src': 1,
  'img::usemap': 11,
  'img::vspace': 0,
  'img::width': 0,
  'input::accept': 0,
  'input::accesskey': 0,
  'input::align': 0,
  'input::alt': 0,
  'input::autocomplete': 0,
  'input::checked': 0,
  'input::disabled': 0,
  'input::inputmode': 0,
  'input::ismap': 0,
  'input::list': 5,
  'input::max': 0,
  'input::maxlength': 0,
  'input::min': 0,
  'input::multiple': 0,
  'input::name': 8,
  'input::onblur': 2,
  'input::onchange': 2,
  'input::onfocus': 2,
  'input::onselect': 2,
  'input::placeholder': 0,
  'input::readonly': 0,
  'input::required': 0,
  'input::size': 0,
  'input::src': 1,
  'input::step': 0,
  'input::tabindex': 0,
  'input::type': 0,
  'input::usemap': 11,
  'input::value': 0,
  'ins::cite': 1,
  'ins::datetime': 0,
  'label::accesskey': 0,
  'label::for': 5,
  'label::onblur': 2,
  'label::onfocus': 2,
  'legend::accesskey': 0,
  'legend::align': 0,
  'li::type': 0,
  'li::value': 0,
  'map::name': 7,
  'menu::compact': 0,
  'menu::label': 0,
  'menu::type': 0,
  'meter::high': 0,
  'meter::low': 0,
  'meter::max': 0,
  'meter::min': 0,
  'meter::value': 0,
  'ol::compact': 0,
  'ol::reversed': 0,
  'ol::start': 0,
  'ol::type': 0,
  'optgroup::disabled': 0,
  'optgroup::label': 0,
  'option::disabled': 0,
  'option::label': 0,
  'option::selected': 0,
  'option::value': 0,
  'output::for': 6,
  'output::name': 8,
  'p::align': 0,
  'pre::width': 0,
  'progress::max': 0,
  'progress::min': 0,
  'progress::value': 0,
  'q::cite': 1,
  'select::autocomplete': 0,
  'select::disabled': 0,
  'select::multiple': 0,
  'select::name': 8,
  'select::onblur': 2,
  'select::onchange': 2,
  'select::onfocus': 2,
  'select::required': 0,
  'select::size': 0,
  'select::tabindex': 0,
  'source::type': 0,
  'table::align': 0,
  'table::bgcolor': 0,
  'table::border': 0,
  'table::cellpadding': 0,
  'table::cellspacing': 0,
  'table::frame': 0,
  'table::rules': 0,
  'table::summary': 0,
  'table::width': 0,
  'tbody::align': 0,
  'tbody::char': 0,
  'tbody::charoff': 0,
  'tbody::valign': 0,
  'td::abbr': 0,
  'td::align': 0,
  'td::axis': 0,
  'td::bgcolor': 0,
  'td::char': 0,
  'td::charoff': 0,
  'td::colspan': 0,
  'td::headers': 6,
  'td::height': 0,
  'td::nowrap': 0,
  'td::rowspan': 0,
  'td::scope': 0,
  'td::valign': 0,
  'td::width': 0,
  'textarea::accesskey': 0,
  'textarea::autocomplete': 0,
  'textarea::cols': 0,
  'textarea::disabled': 0,
  'textarea::inputmode': 0,
  'textarea::name': 8,
  'textarea::onblur': 2,
  'textarea::onchange': 2,
  'textarea::onfocus': 2,
  'textarea::onselect': 2,
  'textarea::placeholder': 0,
  'textarea::readonly': 0,
  'textarea::required': 0,
  'textarea::rows': 0,
  'textarea::tabindex': 0,
  'textarea::wrap': 0,
  'tfoot::align': 0,
  'tfoot::char': 0,
  'tfoot::charoff': 0,
  'tfoot::valign': 0,
  'th::abbr': 0,
  'th::align': 0,
  'th::axis': 0,
  'th::bgcolor': 0,
  'th::char': 0,
  'th::charoff': 0,
  'th::colspan': 0,
  'th::headers': 6,
  'th::height': 0,
  'th::nowrap': 0,
  'th::rowspan': 0,
  'th::scope': 0,
  'th::valign': 0,
  'th::width': 0,
  'thead::align': 0,
  'thead::char': 0,
  'thead::charoff': 0,
  'thead::valign': 0,
  'tr::align': 0,
  'tr::bgcolor': 0,
  'tr::char': 0,
  'tr::charoff': 0,
  'tr::valign': 0,
  'track::default': 0,
  'track::kind': 0,
  'track::label': 0,
  'track::srclang': 0,
  'ul::compact': 0,
  'ul::type': 0,
  'video::controls': 0,
  'video::height': 0,
  'video::loop': 0,
  'video::mediagroup': 5,
  'video::muted': 0,
  'video::poster': 1,
  'video::preload': 0,
  'video::width': 0
};
html4[ 'ATTRIBS' ] = html4.ATTRIBS;
html4.eflags = {
  'OPTIONAL_ENDTAG': 1,
  'EMPTY': 2,
  'CDATA': 4,
  'RCDATA': 8,
  'UNSAFE': 16,
  'FOLDABLE': 32,
  'SCRIPT': 64,
  'STYLE': 128,
  'VIRTUALIZED': 256
};
html4[ 'eflags' ] = html4.eflags;
html4.ELEMENTS = {
  'a': 0,
  'abbr': 0,
  'acronym': 0,
  'address': 0,
  'applet': 272,
  'area': 2,
  'article': 0,
  'aside': 0,
  'audio': 0,
  'b': 0,
  'base': 274,
  'basefont': 274,
  'bdi': 0,
  'bdo': 0,
  'big': 0,
  'blockquote': 0,
  'body': 305,
  'br': 2,
  'button': 0,
  'canvas': 0,
  'caption': 0,
  'center': 0,
  'cite': 0,
  'code': 0,
  'col': 2,
  'colgroup': 1,
  'command': 2,
  'data': 0,
  'datalist': 0,
  'dd': 1,
  'del': 0,
  'details': 0,
  'dfn': 0,
  'dialog': 272,
  'dir': 0,
  'div': 0,
  'dl': 0,
  'dt': 1,
  'em': 0,
  'fieldset': 0,
  'figcaption': 0,
  'figure': 0,
  'font': 0,
  'footer': 0,
  'form': 0,
  'frame': 274,
  'frameset': 272,
  'h1': 0,
  'h2': 0,
  'h3': 0,
  'h4': 0,
  'h5': 0,
  'h6': 0,
  'head': 305,
  'header': 0,
  'hgroup': 0,
  'hr': 2,
  'html': 305,
  'i': 0,
  'iframe': 4,
  'img': 2,
  'input': 2,
  'ins': 0,
  'isindex': 274,
  'kbd': 0,
  'keygen': 274,
  'label': 0,
  'legend': 0,
  'li': 1,
  'link': 274,
  'map': 0,
  'mark': 0,
  'menu': 0,
  'meta': 274,
  'meter': 0,
  'nav': 0,
  'nobr': 0,
  'noembed': 276,
  'noframes': 276,
  'noscript': 276,
  'object': 272,
  'ol': 0,
  'optgroup': 0,
  'option': 1,
  'output': 0,
  'p': 1,
  'param': 274,
  'pre': 0,
  'progress': 0,
  'q': 0,
  's': 0,
  'samp': 0,
  'script': 84,
  'section': 0,
  'select': 0,
  'small': 0,
  'source': 2,
  'span': 0,
  'strike': 0,
  'strong': 0,
  'style': 148,
  'sub': 0,
  'summary': 0,
  'sup': 0,
  'table': 0,
  'tbody': 1,
  'td': 1,
  'textarea': 8,
  'tfoot': 1,
  'th': 1,
  'thead': 1,
  'time': 0,
  'title': 280,
  'tr': 1,
  'track': 2,
  'tt': 0,
  'u': 0,
  'ul': 0,
  'var': 0,
  'video': 0,
  'wbr': 2
};
html4[ 'ELEMENTS' ] = html4.ELEMENTS;
html4.ELEMENT_DOM_INTERFACES = {
  'a': 'HTMLAnchorElement',
  'abbr': 'HTMLElement',
  'acronym': 'HTMLElement',
  'address': 'HTMLElement',
  'applet': 'HTMLAppletElement',
  'area': 'HTMLAreaElement',
  'article': 'HTMLElement',
  'aside': 'HTMLElement',
  'audio': 'HTMLAudioElement',
  'b': 'HTMLElement',
  'base': 'HTMLBaseElement',
  'basefont': 'HTMLBaseFontElement',
  'bdi': 'HTMLElement',
  'bdo': 'HTMLElement',
  'big': 'HTMLElement',
  'blockquote': 'HTMLQuoteElement',
  'body': 'HTMLBodyElement',
  'br': 'HTMLBRElement',
  'button': 'HTMLButtonElement',
  'canvas': 'HTMLCanvasElement',
  'caption': 'HTMLTableCaptionElement',
  'center': 'HTMLElement',
  'cite': 'HTMLElement',
  'code': 'HTMLElement',
  'col': 'HTMLTableColElement',
  'colgroup': 'HTMLTableColElement',
  'command': 'HTMLCommandElement',
  'data': 'HTMLElement',
  'datalist': 'HTMLDataListElement',
  'dd': 'HTMLElement',
  'del': 'HTMLModElement',
  'details': 'HTMLDetailsElement',
  'dfn': 'HTMLElement',
  'dialog': 'HTMLDialogElement',
  'dir': 'HTMLDirectoryElement',
  'div': 'HTMLDivElement',
  'dl': 'HTMLDListElement',
  'dt': 'HTMLElement',
  'em': 'HTMLElement',
  'fieldset': 'HTMLFieldSetElement',
  'figcaption': 'HTMLElement',
  'figure': 'HTMLElement',
  'font': 'HTMLFontElement',
  'footer': 'HTMLElement',
  'form': 'HTMLFormElement',
  'frame': 'HTMLFrameElement',
  'frameset': 'HTMLFrameSetElement',
  'h1': 'HTMLHeadingElement',
  'h2': 'HTMLHeadingElement',
  'h3': 'HTMLHeadingElement',
  'h4': 'HTMLHeadingElement',
  'h5': 'HTMLHeadingElement',
  'h6': 'HTMLHeadingElement',
  'head': 'HTMLHeadElement',
  'header': 'HTMLElement',
  'hgroup': 'HTMLElement',
  'hr': 'HTMLHRElement',
  'html': 'HTMLHtmlElement',
  'i': 'HTMLElement',
  'iframe': 'HTMLIFrameElement',
  'img': 'HTMLImageElement',
  'input': 'HTMLInputElement',
  'ins': 'HTMLModElement',
  'isindex': 'HTMLUnknownElement',
  'kbd': 'HTMLElement',
  'keygen': 'HTMLKeygenElement',
  'label': 'HTMLLabelElement',
  'legend': 'HTMLLegendElement',
  'li': 'HTMLLIElement',
  'link': 'HTMLLinkElement',
  'map': 'HTMLMapElement',
  'mark': 'HTMLElement',
  'menu': 'HTMLMenuElement',
  'meta': 'HTMLMetaElement',
  'meter': 'HTMLMeterElement',
  'nav': 'HTMLElement',
  'nobr': 'HTMLElement',
  'noembed': 'HTMLElement',
  'noframes': 'HTMLElement',
  'noscript': 'HTMLElement',
  'object': 'HTMLObjectElement',
  'ol': 'HTMLOListElement',
  'optgroup': 'HTMLOptGroupElement',
  'option': 'HTMLOptionElement',
  'output': 'HTMLOutputElement',
  'p': 'HTMLParagraphElement',
  'param': 'HTMLParamElement',
  'pre': 'HTMLPreElement',
  'progress': 'HTMLProgressElement',
  'q': 'HTMLQuoteElement',
  's': 'HTMLElement',
  'samp': 'HTMLElement',
  'script': 'HTMLScriptElement',
  'section': 'HTMLElement',
  'select': 'HTMLSelectElement',
  'small': 'HTMLElement',
  'source': 'HTMLSourceElement',
  'span': 'HTMLSpanElement',
  'strike': 'HTMLElement',
  'strong': 'HTMLElement',
  'style': 'HTMLStyleElement',
  'sub': 'HTMLElement',
  'summary': 'HTMLElement',
  'sup': 'HTMLElement',
  'table': 'HTMLTableElement',
  'tbody': 'HTMLTableSectionElement',
  'td': 'HTMLTableDataCellElement',
  'textarea': 'HTMLTextAreaElement',
  'tfoot': 'HTMLTableSectionElement',
  'th': 'HTMLTableHeaderCellElement',
  'thead': 'HTMLTableSectionElement',
  'time': 'HTMLTimeElement',
  'title': 'HTMLTitleElement',
  'tr': 'HTMLTableRowElement',
  'track': 'HTMLTrackElement',
  'tt': 'HTMLElement',
  'u': 'HTMLElement',
  'ul': 'HTMLUListElement',
  'var': 'HTMLElement',
  'video': 'HTMLVideoElement',
  'wbr': 'HTMLElement'
};
html4[ 'ELEMENT_DOM_INTERFACES' ] = html4.ELEMENT_DOM_INTERFACES;
html4.ueffects = {
  'NOT_LOADED': 0,
  'SAME_DOCUMENT': 1,
  'NEW_DOCUMENT': 2
};
html4[ 'ueffects' ] = html4.ueffects;
html4.URIEFFECTS = {
  'a::href': 2,
  'area::href': 2,
  'blockquote::cite': 0,
  'command::icon': 1,
  'del::cite': 0,
  'form::action': 2,
  'img::src': 1,
  'input::src': 1,
  'ins::cite': 0,
  'q::cite': 0,
  'video::poster': 1
};
html4[ 'URIEFFECTS' ] = html4.URIEFFECTS;
html4.ltypes = {
  'UNSANDBOXED': 2,
  'SANDBOXED': 1,
  'DATA': 0
};
html4[ 'ltypes' ] = html4.ltypes;
html4.LOADERTYPES = {
  'a::href': 2,
  'area::href': 2,
  'blockquote::cite': 2,
  'command::icon': 1,
  'del::cite': 2,
  'form::action': 2,
  'img::src': 1,
  'input::src': 1,
  'ins::cite': 2,
  'q::cite': 2,
  'video::poster': 1
};
html4[ 'LOADERTYPES' ] = html4.LOADERTYPES;

// Copyright (C) 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview
 * An HTML sanitizer that can satisfy a variety of security policies.
 *
 * <p>
 * The HTML sanitizer is built around a SAX parser and HTML element and
 * attributes schemas.
 *
 * If the cssparser is loaded, inline styles are sanitized using the
 * css property and value schemas.  Else they are remove during
 * sanitization.
 *
 * If it exists, uses parseCssDeclarations, sanitizeCssProperty,  cssSchema
 *
 * @author mikesamuel@gmail.com
 * @author jasvir@gmail.com
 * \@requires html4, URI
 * \@overrides window
 * \@provides html, html_sanitize
 */

// The Turkish i seems to be a non-issue, but abort in case it is.
if ('I'.toLowerCase() !== 'i') { throw 'I/i problem'; }

/**
 * \@namespace
 */
var html = (function(html4) {

  // For closure compiler
  var parseCssDeclarations, sanitizeCssProperty, cssSchema;
  if ('undefined' !== typeof window) {
    parseCssDeclarations = window['parseCssDeclarations'];
    sanitizeCssProperty = window['sanitizeCssProperty'];
    cssSchema = window['cssSchema'];
  }

  // The keys of this object must be 'quoted' or JSCompiler will mangle them!
  // This is a partial list -- lookupEntity() uses the host browser's parser
  // (when available) to implement full entity lookup.
  // Note that entities are in general case-sensitive; the uppercase ones are
  // explicitly defined by HTML5 (presumably as compatibility).
  var ENTITIES = {
    'lt': '<',
    'LT': '<',
    'gt': '>',
    'GT': '>',
    'amp': '&',
    'AMP': '&',
    'quot': '"',
    'apos': '\'',
    'nbsp': '\240'
  };

  // Patterns for types of entity/character reference names.
  var decimalEscapeRe = /^#(\d+)$/;
  var hexEscapeRe = /^#x([0-9A-Fa-f]+)$/;
  // contains every entity per http://www.w3.org/TR/2011/WD-html5-20110113/named-character-references.html
  var safeEntityNameRe = /^[A-Za-z][A-za-z0-9]+$/;
  // Used as a hook to invoke the browser's entity parsing. <textarea> is used
  // because its content is parsed for entities but not tags.
  // TODO(kpreid): This retrieval is a kludge and leads to silent loss of
  // functionality if the document isn't available.
  var entityLookupElement =
      ('undefined' !== typeof window && window['document'])
          ? window['document'].createElement('textarea') : null;
  /**
   * Decodes an HTML entity.
   *
   * {\@updoc
   * $ lookupEntity('lt')
   * # '<'
   * $ lookupEntity('GT')
   * # '>'
   * $ lookupEntity('amp')
   * # '&'
   * $ lookupEntity('nbsp')
   * # '\xA0'
   * $ lookupEntity('apos')
   * # "'"
   * $ lookupEntity('quot')
   * # '"'
   * $ lookupEntity('#xa')
   * # '\n'
   * $ lookupEntity('#10')
   * # '\n'
   * $ lookupEntity('#x0a')
   * # '\n'
   * $ lookupEntity('#010')
   * # '\n'
   * $ lookupEntity('#x00A')
   * # '\n'
   * $ lookupEntity('Pi')      // Known failure
   * # '\u03A0'
   * $ lookupEntity('pi')      // Known failure
   * # '\u03C0'
   * }
   *
   * @param {string} name the content between the '&' and the ';'.
   * @return {string} a single unicode code-point as a string.
   */
  function lookupEntity(name) {
    // TODO: entity lookup as specified by HTML5 actually depends on the
    // presence of the ";".
    if (ENTITIES.hasOwnProperty(name)) { return ENTITIES[name]; }
    var m = name.match(decimalEscapeRe);
    if (m) {
      return String.fromCharCode(parseInt(m[1], 10));
    } else if (!!(m = name.match(hexEscapeRe))) {
      return String.fromCharCode(parseInt(m[1], 16));
    } else if (entityLookupElement && safeEntityNameRe.test(name)) {
      entityLookupElement.innerHTML = '&' + name + ';';
      var text = entityLookupElement.textContent;
      ENTITIES[name] = text;
      return text;
    } else {
      return '&' + name + ';';
    }
  }

  function decodeOneEntity(_, name) {
    return lookupEntity(name);
  }

  var nulRe = /\0/g;
  function stripNULs(s) {
    return s.replace(nulRe, '');
  }

  var ENTITY_RE_1 = /&(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/g;
  var ENTITY_RE_2 = /^(#[0-9]+|#[xX][0-9A-Fa-f]+|\w+);/;
  /**
   * The plain text of a chunk of HTML CDATA which possibly containing.
   *
   * {\@updoc
   * $ unescapeEntities('')
   * # ''
   * $ unescapeEntities('hello World!')
   * # 'hello World!'
   * $ unescapeEntities('1 &lt; 2 &amp;&AMP; 4 &gt; 3&#10;')
   * # '1 < 2 && 4 > 3\n'
   * $ unescapeEntities('&lt;&lt <- unfinished entity&gt;')
   * # '<&lt <- unfinished entity>'
   * $ unescapeEntities('/foo?bar=baz&copy=true')  // & often unescaped in URLS
   * # '/foo?bar=baz&copy=true'
   * $ unescapeEntities('pi=&pi;&#x3c0;, Pi=&Pi;\u03A0') // FIXME: known failure
   * # 'pi=\u03C0\u03c0, Pi=\u03A0\u03A0'
   * }
   *
   * @param {string} s a chunk of HTML CDATA.  It must not start or end inside
   *     an HTML entity.
   */
  function unescapeEntities(s) {
    return s.replace(ENTITY_RE_1, decodeOneEntity);
  }

  var ampRe = /&/g;
  var looseAmpRe = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/gi;
  var ltRe = /[<]/g;
  var gtRe = />/g;
  var quotRe = /\"/g;

  /**
   * Escapes HTML special characters in attribute values.
   *
   * {\@updoc
   * $ escapeAttrib('')
   * # ''
   * $ escapeAttrib('"<<&==&>>"')  // Do not just escape the first occurrence.
   * # '&#34;&lt;&lt;&amp;&#61;&#61;&amp;&gt;&gt;&#34;'
   * $ escapeAttrib('Hello <World>!')
   * # 'Hello &lt;World&gt;!'
   * }
   */
  function escapeAttrib(s) {
    return ('' + s).replace(ampRe, '&amp;').replace(ltRe, '&lt;')
        .replace(gtRe, '&gt;').replace(quotRe, '&#34;');
  }

  /**
   * Escape entities in RCDATA that can be escaped without changing the meaning.
   * {\@updoc
   * $ normalizeRCData('1 < 2 &&amp; 3 > 4 &amp;& 5 &lt; 7&8')
   * # '1 &lt; 2 &amp;&amp; 3 &gt; 4 &amp;&amp; 5 &lt; 7&amp;8'
   * }
   */
  function normalizeRCData(rcdata) {
    return rcdata
        .replace(looseAmpRe, '&amp;$1')
        .replace(ltRe, '&lt;')
        .replace(gtRe, '&gt;');
  }

  // TODO(felix8a): validate sanitizer regexs against the HTML5 grammar at
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/tokenization.html
  // http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html

  // We initially split input so that potentially meaningful characters
  // like '<' and '>' are separate tokens, using a fast dumb process that
  // ignores quoting.  Then we walk that token stream, and when we see a
  // '<' that's the start of a tag, we use ATTR_RE to extract tag
  // attributes from the next token.  That token will never have a '>'
  // character.  However, it might have an unbalanced quote character, and
  // when we see that, we combine additional tokens to balance the quote.

  var ATTR_RE = new RegExp(
    '^\\s*' +
    '([-.:\\w]+)' +             // 1 = Attribute name
    '(?:' + (
      '\\s*(=)\\s*' +           // 2 = Is there a value?
      '(' + (                   // 3 = Attribute value
        // TODO(felix8a): maybe use backref to match quotes
        '(\")[^\"]*(\"|$)' +    // 4, 5 = Double-quoted string
        '|' +
        '(\')[^\']*(\'|$)' +    // 6, 7 = Single-quoted string
        '|' +
        // Positive lookahead to prevent interpretation of
        // <foo a= b=c> as <foo a='b=c'>
        // TODO(felix8a): might be able to drop this case
        '(?=[a-z][-\\w]*\\s*=)' +
        '|' +
        // Unquoted value that isn't an attribute name
        // (since we didn't match the positive lookahead above)
        '[^\"\'\\s]*' ) +
      ')' ) +
    ')?',
    'i');

  // false on IE<=8, true on most other browsers
  var splitWillCapture = ('a,b'.split(/(,)/).length === 3);

  // bitmask for tags with special parsing, like <script> and <textarea>
  var EFLAGS_TEXT = html4.eflags['CDATA'] | html4.eflags['RCDATA'];

  /**
   * Given a SAX-like event handler, produce a function that feeds those
   * events and a parameter to the event handler.
   *
   * The event handler has the form:{@code
   * {
   *   // Name is an upper-case HTML tag name.  Attribs is an array of
   *   // alternating upper-case attribute names, and attribute values.  The
   *   // attribs array is reused by the parser.  Param is the value passed to
   *   // the saxParser.
   *   startTag: function (name, attribs, param) { ... },
   *   endTag:   function (name, param) { ... },
   *   pcdata:   function (text, param) { ... },
   *   rcdata:   function (text, param) { ... },
   *   cdata:    function (text, param) { ... },
   *   startDoc: function (param) { ... },
   *   endDoc:   function (param) { ... }
   * }}
   *
   * @param {Object} handler a record containing event handlers.
   * @return {function(string, Object)} A function that takes a chunk of HTML
   *     and a parameter.  The parameter is passed on to the handler methods.
   */
  function makeSaxParser(handler) {
    // Accept quoted or unquoted keys (Closure compat)
    var hcopy = {
      cdata: handler.cdata || handler['cdata'],
      comment: handler.comment || handler['comment'],
      endDoc: handler.endDoc || handler['endDoc'],
      endTag: handler.endTag || handler['endTag'],
      pcdata: handler.pcdata || handler['pcdata'],
      rcdata: handler.rcdata || handler['rcdata'],
      startDoc: handler.startDoc || handler['startDoc'],
      startTag: handler.startTag || handler['startTag']
    };
    return function(htmlText, param) {
      return parse(htmlText, hcopy, param);
    };
  }

  // Parsing strategy is to split input into parts that might be lexically
  // meaningful (every ">" becomes a separate part), and then recombine
  // parts if we discover they're in a different context.

  // TODO(felix8a): Significant performance regressions from -legacy,
  // tested on
  //    Chrome 18.0
  //    Firefox 11.0
  //    IE 6, 7, 8, 9
  //    Opera 11.61
  //    Safari 5.1.3
  // Many of these are unusual patterns that are linearly slower and still
  // pretty fast (eg 1ms to 5ms), so not necessarily worth fixing.

  // TODO(felix8a): "<script> && && && ... <\/script>" is slower on all
  // browsers.  The hotspot is htmlSplit.

  // TODO(felix8a): "<p title='>>>>...'><\/p>" is slower on all browsers.
  // This is partly htmlSplit, but the hotspot is parseTagAndAttrs.

  // TODO(felix8a): "<a><\/a><a><\/a>..." is slower on IE9.
  // "<a>1<\/a><a>1<\/a>..." is faster, "<a><\/a>2<a><\/a>2..." is faster.

  // TODO(felix8a): "<p<p<p..." is slower on IE[6-8]

  var continuationMarker = {};
  function parse(htmlText, handler, param) {
    var m, p, tagName;
    var parts = htmlSplit(htmlText);
    var state = {
      noMoreGT: false,
      noMoreEndComments: false
    };
    parseCPS(handler, parts, 0, state, param);
  }

  function continuationMaker(h, parts, initial, state, param) {
    return function () {
      parseCPS(h, parts, initial, state, param);
    };
  }

  function parseCPS(h, parts, initial, state, param) {
    try {
      if (h.startDoc && initial == 0) { h.startDoc(param); }
      var m, p, tagName;
      for (var pos = initial, end = parts.length; pos < end;) {
        var current = parts[pos++];
        var next = parts[pos];
        switch (current) {
        case '&':
          if (ENTITY_RE_2.test(next)) {
            if (h.pcdata) {
              h.pcdata('&' + next, param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
            pos++;
          } else {
            if (h.pcdata) { h.pcdata("&amp;", param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\/':
          if (m = /^([-\w:]+)[^\'\"]*/.exec(next)) {
            if (m[0].length === next.length && parts[pos + 1] === '>') {
              // fast case, no attribute parsing needed
              pos += 2;
              tagName = m[1].toLowerCase();
              if (h.endTag) {
                h.endTag(tagName, param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
            } else {
              // slow case, need to parse attributes
              // TODO(felix8a): do we really care about misparsing this?
              pos = parseEndTag(
                parts, pos, h, param, continuationMarker, state);
            }
          } else {
            if (h.pcdata) {
              h.pcdata('&lt;/', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<':
          if (m = /^([-\w:]+)\s*\/?/.exec(next)) {
            if (m[0].length === next.length && parts[pos + 1] === '>') {
              // fast case, no attribute parsing needed
              pos += 2;
              tagName = m[1].toLowerCase();
              if (h.startTag) {
                h.startTag(tagName, [], param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
              // tags like <script> and <textarea> have special parsing
              var eflags = html4.ELEMENTS[tagName];
              if (eflags & EFLAGS_TEXT) {
                var tag = { name: tagName, next: pos, eflags: eflags };
                pos = parseText(
                  parts, tag, h, param, continuationMarker, state);
              }
            } else {
              // slow case, need to parse attributes
              pos = parseStartTag(
                parts, pos, h, param, continuationMarker, state);
            }
          } else {
            if (h.pcdata) {
              h.pcdata('&lt;', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\!--':
          // The pathological case is n copies of '<\!--' without '-->', and
          // repeated failure to find '-->' is quadratic.  We avoid that by
          // remembering when search for '-->' fails.
          if (!state.noMoreEndComments) {
            // A comment <\!--x--> is split into three tokens:
            //   '<\!--', 'x--', '>'
            // We want to find the next '>' token that has a preceding '--'.
            // pos is at the 'x--'.
            for (p = pos + 1; p < end; p++) {
              if (parts[p] === '>' && /--$/.test(parts[p - 1])) { break; }
            }
            if (p < end) {
              if (h.comment) {
                var comment = parts.slice(pos, p).join('');
                h.comment(
                  comment.substr(0, comment.length - 2), param,
                  continuationMarker,
                  continuationMaker(h, parts, p + 1, state, param));
              }
              pos = p + 1;
            } else {
              state.noMoreEndComments = true;
            }
          }
          if (state.noMoreEndComments) {
            if (h.pcdata) {
              h.pcdata('&lt;!--', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '<\!':
          if (!/^\w/.test(next)) {
            if (h.pcdata) {
              h.pcdata('&lt;!', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          } else {
            // similar to noMoreEndComment logic
            if (!state.noMoreGT) {
              for (p = pos + 1; p < end; p++) {
                if (parts[p] === '>') { break; }
              }
              if (p < end) {
                pos = p + 1;
              } else {
                state.noMoreGT = true;
              }
            }
            if (state.noMoreGT) {
              if (h.pcdata) {
                h.pcdata('&lt;!', param, continuationMarker,
                  continuationMaker(h, parts, pos, state, param));
              }
            }
          }
          break;
        case '<?':
          // similar to noMoreEndComment logic
          if (!state.noMoreGT) {
            for (p = pos + 1; p < end; p++) {
              if (parts[p] === '>') { break; }
            }
            if (p < end) {
              pos = p + 1;
            } else {
              state.noMoreGT = true;
            }
          }
          if (state.noMoreGT) {
            if (h.pcdata) {
              h.pcdata('&lt;?', param, continuationMarker,
                continuationMaker(h, parts, pos, state, param));
            }
          }
          break;
        case '>':
          if (h.pcdata) {
            h.pcdata("&gt;", param, continuationMarker,
              continuationMaker(h, parts, pos, state, param));
          }
          break;
        case '':
          break;
        default:
          if (h.pcdata) {
            h.pcdata(current, param, continuationMarker,
              continuationMaker(h, parts, pos, state, param));
          }
          break;
        }
      }
      if (h.endDoc) { h.endDoc(param); }
    } catch (e) {
      if (e !== continuationMarker) { throw e; }
    }
  }

  // Split str into parts for the html parser.
  function htmlSplit(str) {
    // can't hoist this out of the function because of the re.exec loop.
    var re = /(<\/|<\!--|<[!?]|[&<>])/g;
    str += '';
    if (splitWillCapture) {
      return str.split(re);
    } else {
      var parts = [];
      var lastPos = 0;
      var m;
      while ((m = re.exec(str)) !== null) {
        parts.push(str.substring(lastPos, m.index));
        parts.push(m[0]);
        lastPos = m.index + m[0].length;
      }
      parts.push(str.substring(lastPos));
      return parts;
    }
  }

  function parseEndTag(parts, pos, h, param, continuationMarker, state) {
    var tag = parseTagAndAttrs(parts, pos);
    // drop unclosed tags
    if (!tag) { return parts.length; }
    if (h.endTag) {
      h.endTag(tag.name, param, continuationMarker,
        continuationMaker(h, parts, pos, state, param));
    }
    return tag.next;
  }

  function parseStartTag(parts, pos, h, param, continuationMarker, state) {
    var tag = parseTagAndAttrs(parts, pos);
    // drop unclosed tags
    if (!tag) { return parts.length; }
    if (h.startTag) {
      h.startTag(tag.name, tag.attrs, param, continuationMarker,
        continuationMaker(h, parts, tag.next, state, param));
    }
    // tags like <script> and <textarea> have special parsing
    if (tag.eflags & EFLAGS_TEXT) {
      return parseText(parts, tag, h, param, continuationMarker, state);
    } else {
      return tag.next;
    }
  }

  var endTagRe = {};

  // Tags like <script> and <textarea> are flagged as CDATA or RCDATA,
  // which means everything is text until we see the correct closing tag.
  function parseText(parts, tag, h, param, continuationMarker, state) {
    var end = parts.length;
    if (!endTagRe.hasOwnProperty(tag.name)) {
      endTagRe[tag.name] = new RegExp('^' + tag.name + '(?:[\\s\\/]|$)', 'i');
    }
    var re = endTagRe[tag.name];
    var first = tag.next;
    var p = tag.next + 1;
    for (; p < end; p++) {
      if (parts[p - 1] === '<\/' && re.test(parts[p])) { break; }
    }
    if (p < end) { p -= 1; }
    var buf = parts.slice(first, p).join('');
    if (tag.eflags & html4.eflags['CDATA']) {
      if (h.cdata) {
        h.cdata(buf, param, continuationMarker,
          continuationMaker(h, parts, p, state, param));
      }
    } else if (tag.eflags & html4.eflags['RCDATA']) {
      if (h.rcdata) {
        h.rcdata(normalizeRCData(buf), param, continuationMarker,
          continuationMaker(h, parts, p, state, param));
      }
    } else {
      throw new Error('bug');
    }
    return p;
  }

  // at this point, parts[pos-1] is either "<" or "<\/".
  function parseTagAndAttrs(parts, pos) {
    var m = /^([-\w:]+)/.exec(parts[pos]);
    var tag = {};
    tag.name = m[1].toLowerCase();
    tag.eflags = html4.ELEMENTS[tag.name];
    var buf = parts[pos].substr(m[0].length);
    // Find the next '>'.  We optimistically assume this '>' is not in a
    // quoted context, and further down we fix things up if it turns out to
    // be quoted.
    var p = pos + 1;
    var end = parts.length;
    for (; p < end; p++) {
      if (parts[p] === '>') { break; }
      buf += parts[p];
    }
    if (end <= p) { return void 0; }
    var attrs = [];
    while (buf !== '') {
      m = ATTR_RE.exec(buf);
      if (!m) {
        // No attribute found: skip garbage
        buf = buf.replace(/^[\s\S][^a-z\s]*/, '');

      } else if ((m[4] && !m[5]) || (m[6] && !m[7])) {
        // Unterminated quote: slurp to the next unquoted '>'
        var quote = m[4] || m[6];
        var sawQuote = false;
        var abuf = [buf, parts[p++]];
        for (; p < end; p++) {
          if (sawQuote) {
            if (parts[p] === '>') { break; }
          } else if (0 <= parts[p].indexOf(quote)) {
            sawQuote = true;
          }
          abuf.push(parts[p]);
        }
        // Slurp failed: lose the garbage
        if (end <= p) { break; }
        // Otherwise retry attribute parsing
        buf = abuf.join('');
        continue;

      } else {
        // We have an attribute
        var aName = m[1].toLowerCase();
        var aValue = m[2] ? decodeValue(m[3]) : '';
        attrs.push(aName, aValue);
        buf = buf.substr(m[0].length);
      }
    }
    tag.attrs = attrs;
    tag.next = p + 1;
    return tag;
  }

  function decodeValue(v) {
    var q = v.charCodeAt(0);
    if (q === 0x22 || q === 0x27) { // " or '
      v = v.substr(1, v.length - 2);
    }
    return unescapeEntities(stripNULs(v));
  }

  /**
   * Returns a function that strips unsafe tags and attributes from html.
   * @param {function(string, Array.<string>): ?Array.<string>} tagPolicy
   *     A function that takes (tagName, attribs[]), where tagName is a key in
   *     html4.ELEMENTS and attribs is an array of alternating attribute names
   *     and values.  It should return a record (as follows), or null to delete
   *     the element.  It's okay for tagPolicy to modify the attribs array,
   *     but the same array is reused, so it should not be held between calls.
   *     Record keys:
   *        attribs: (required) Sanitized attributes array.
   *        tagName: Replacement tag name.
   * @return {function(string, Array)} A function that sanitizes a string of
   *     HTML and appends result strings to the second argument, an array.
   */
  function makeHtmlSanitizer(tagPolicy) {
    var stack;
    var ignoring;
    var emit = function (text, out) {
      if (!ignoring) { out.push(text); }
    };
    return makeSaxParser({
      'startDoc': function(_) {
        stack = [];
        ignoring = false;
      },
      'startTag': function(tagNameOrig, attribs, out) {
        if (ignoring) { return; }
        if (!html4.ELEMENTS.hasOwnProperty(tagNameOrig)) { return; }
        var eflagsOrig = html4.ELEMENTS[tagNameOrig];
        if (eflagsOrig & html4.eflags['FOLDABLE']) {
          return;
        }

        var decision = tagPolicy(tagNameOrig, attribs);
        if (!decision) {
          ignoring = !(eflagsOrig & html4.eflags['EMPTY']);
          return;
        } else if (typeof decision !== 'object') {
          throw new Error('tagPolicy did not return object (old API?)');
        }
        if ('attribs' in decision) {
          attribs = decision['attribs'];
        } else {
          throw new Error('tagPolicy gave no attribs');
        }
        var eflagsRep;
        var tagNameRep;
        if ('tagName' in decision) {
          tagNameRep = decision['tagName'];
          eflagsRep = html4.ELEMENTS[tagNameRep];
        } else {
          tagNameRep = tagNameOrig;
          eflagsRep = eflagsOrig;
        }
        // TODO(mikesamuel): relying on tagPolicy not to insert unsafe
        // attribute names.

        // If this is an optional-end-tag element and either this element or its
        // previous like sibling was rewritten, then insert a close tag to
        // preserve structure.
        if (eflagsOrig & html4.eflags['OPTIONAL_ENDTAG']) {
          var onStack = stack[stack.length - 1];
          if (onStack && onStack.orig === tagNameOrig &&
              (onStack.rep !== tagNameRep || tagNameOrig !== tagNameRep)) {
                out.push('<\/', onStack.rep, '>');
          }
        }

        if (!(eflagsOrig & html4.eflags['EMPTY'])) {
          stack.push({orig: tagNameOrig, rep: tagNameRep});
        }

        out.push('<', tagNameRep);
        for (var i = 0, n = attribs.length; i < n; i += 2) {
          var attribName = attribs[i],
              value = attribs[i + 1];
          if (value !== null && value !== void 0) {
            out.push(' ', attribName, '="', escapeAttrib(value), '"');
          }
        }
        out.push('>');

        if ((eflagsOrig & html4.eflags['EMPTY'])
            && !(eflagsRep & html4.eflags['EMPTY'])) {
          // replacement is non-empty, synthesize end tag
          out.push('<\/', tagNameRep, '>');
        }
      },
      'endTag': function(tagName, out) {
        if (ignoring) {
          ignoring = false;
          return;
        }
        if (!html4.ELEMENTS.hasOwnProperty(tagName)) { return; }
        var eflags = html4.ELEMENTS[tagName];
        if (!(eflags & (html4.eflags['EMPTY'] | html4.eflags['FOLDABLE']))) {
          var index;
          if (eflags & html4.eflags['OPTIONAL_ENDTAG']) {
            for (index = stack.length; --index >= 0;) {
              var stackElOrigTag = stack[index].orig;
              if (stackElOrigTag === tagName) { break; }
              if (!(html4.ELEMENTS[stackElOrigTag] &
                    html4.eflags['OPTIONAL_ENDTAG'])) {
                // Don't pop non optional end tags looking for a match.
                return;
              }
            }
          } else {
            for (index = stack.length; --index >= 0;) {
              if (stack[index].orig === tagName) { break; }
            }
          }
          if (index < 0) { return; }  // Not opened.
          for (var i = stack.length; --i > index;) {
            var stackElRepTag = stack[i].rep;
            if (!(html4.ELEMENTS[stackElRepTag] &
                  html4.eflags['OPTIONAL_ENDTAG'])) {
              out.push('<\/', stackElRepTag, '>');
            }
          }
          if (index < stack.length) {
            tagName = stack[index].rep;
          }
          stack.length = index;
          out.push('<\/', tagName, '>');
        }
      },
      'pcdata': emit,
      'rcdata': emit,
      'cdata': emit,
      'endDoc': function(out) {
        for (; stack.length; stack.length--) {
          out.push('<\/', stack[stack.length - 1].rep, '>');
        }
      }
    });
  }

  var ALLOWED_URI_SCHEMES = /^(?:https?|mailto|data)$/i;

  function safeUri(uri, effect, ltype, hints, naiveUriRewriter) {
    if (!naiveUriRewriter) { return null; }
    try {
      var parsed = URI.parse('' + uri);
      if (parsed) {
        if (!parsed.hasScheme() ||
            ALLOWED_URI_SCHEMES.test(parsed.getScheme())) {
          var safe = naiveUriRewriter(parsed, effect, ltype, hints);
          return safe ? safe.toString() : null;
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  function log(logger, tagName, attribName, oldValue, newValue) {
    if (!attribName) {
      logger(tagName + " removed", {
        change: "removed",
        tagName: tagName
      });
    }
    if (oldValue !== newValue) {
      var changed = "changed";
      if (oldValue && !newValue) {
        changed = "removed";
      } else if (!oldValue && newValue)  {
        changed = "added";
      }
      logger(tagName + "." + attribName + " " + changed, {
        change: changed,
        tagName: tagName,
        attribName: attribName,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  }

  function lookupAttribute(map, tagName, attribName) {
    var attribKey;
    attribKey = tagName + '::' + attribName;
    if (map.hasOwnProperty(attribKey)) {
      return map[attribKey];
    }
    attribKey = '*::' + attribName;
    if (map.hasOwnProperty(attribKey)) {
      return map[attribKey];
    }
    return void 0;
  }
  function getAttributeType(tagName, attribName) {
    return lookupAttribute(html4.ATTRIBS, tagName, attribName);
  }
  function getLoaderType(tagName, attribName) {
    return lookupAttribute(html4.LOADERTYPES, tagName, attribName);
  }
  function getUriEffect(tagName, attribName) {
    return lookupAttribute(html4.URIEFFECTS, tagName, attribName);
  }

  /**
   * Sanitizes attributes on an HTML tag.
   * @param {string} tagName An HTML tag name in lowercase.
   * @param {Array.<?string>} attribs An array of alternating names and values.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes; it can return a new string value, or null to
   *     delete the attribute.  If unspecified, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes; it can return a new string value, or null to delete
   *     the attribute.  If unspecified, these attributes are kept unchanged.
   * @return {Array.<?string>} The sanitized attributes as a list of alternating
   *     names and values, where a null value means to omit the attribute.
   */
  function sanitizeAttribs(tagName, attribs,
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    // TODO(felix8a): it's obnoxious that domado duplicates much of this
    // TODO(felix8a): maybe consistently enforce constraints like target=
    for (var i = 0; i < attribs.length; i += 2) {
      var attribName = attribs[i];
      var value = attribs[i + 1];
      var oldValue = value;
      var atype = null, attribKey;
      if ((attribKey = tagName + '::' + attribName,
           html4.ATTRIBS.hasOwnProperty(attribKey)) ||
          (attribKey = '*::' + attribName,
           html4.ATTRIBS.hasOwnProperty(attribKey))) {
        atype = html4.ATTRIBS[attribKey];
      }
      if (atype !== null) {
        switch (atype) {
          case html4.atype['NONE']: break;
          case html4.atype['SCRIPT']:
            value = null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['STYLE']:
            if ('undefined' === typeof parseCssDeclarations) {
              value = null;
              if (opt_logger) {
                log(opt_logger, tagName, attribName, oldValue, value);
	      }
              break;
            }
            var sanitizedDeclarations = [];
            parseCssDeclarations(
                value,
                {
                  declaration: function (property, tokens) {
                    var normProp = property.toLowerCase();
                    var schema = cssSchema[normProp];
                    if (!schema) {
                      return;
                    }
                    sanitizeCssProperty(
                        normProp, schema, tokens,
                        opt_naiveUriRewriter
                        ? function (url) {
                            return safeUri(
                                url, html4.ueffects.SAME_DOCUMENT,
                                html4.ltypes.SANDBOXED,
                                {
                                  "TYPE": "CSS",
                                  "CSS_PROP": normProp
                                }, opt_naiveUriRewriter);
                          }
                        : null);
                    sanitizedDeclarations.push(property + ': ' + tokens.join(' '));
                  }
                });
            value = sanitizedDeclarations.length > 0 ?
              sanitizedDeclarations.join(' ; ') : null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['ID']:
          case html4.atype['IDREF']:
          case html4.atype['IDREFS']:
          case html4.atype['GLOBAL_NAME']:
          case html4.atype['LOCAL_NAME']:
          case html4.atype['CLASSES']:
            value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['URI']:
            value = safeUri(value,
              getUriEffect(tagName, attribName),
              getLoaderType(tagName, attribName),
              {
                "TYPE": "MARKUP",
                "XML_ATTR": attribName,
                "XML_TAG": tagName
              }, opt_naiveUriRewriter);
              if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          case html4.atype['URI_FRAGMENT']:
            if (value && '#' === value.charAt(0)) {
              value = value.substring(1);  // remove the leading '#'
              value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
              if (value !== null && value !== void 0) {
                value = '#' + value;  // restore the leading '#'
              }
            } else {
              value = null;
            }
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
          default:
            value = null;
            if (opt_logger) {
              log(opt_logger, tagName, attribName, oldValue, value);
            }
            break;
        }
      } else {
        value = null;
        if (opt_logger) {
          log(opt_logger, tagName, attribName, oldValue, value);
        }
      }
      attribs[i + 1] = value;
    }
    return attribs;
  }

  /**
   * Creates a tag policy that omits all tags marked UNSAFE in html4-defs.js
   * and applies the default attribute sanitizer with the supplied policy for
   * URI attributes and NMTOKEN attributes.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes.  If not given, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes.  If not given, such attributes are left unchanged.
   * @return {function(string, Array.<?string>)} A tagPolicy suitable for
   *     passing to html.sanitize.
   */
  function makeTagPolicy(
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    return function(tagName, attribs) {
      if (!(html4.ELEMENTS[tagName] & html4.eflags['UNSAFE'])) {
        return {
          'attribs': sanitizeAttribs(tagName, attribs,
            opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger)
        };
      } else {
        if (opt_logger) {
          log(opt_logger, tagName, undefined, undefined, undefined);
        }
      }
    };
  }

  /**
   * Sanitizes HTML tags and attributes according to a given policy.
   * @param {string} inputHtml The HTML to sanitize.
   * @param {function(string, Array.<?string>)} tagPolicy A function that
   *     decides which tags to accept and sanitizes their attributes (see
   *     makeHtmlSanitizer above for details).
   * @return {string} The sanitized HTML.
   */
  function sanitizeWithPolicy(inputHtml, tagPolicy) {
    var outputArray = [];
    makeHtmlSanitizer(tagPolicy)(inputHtml, outputArray);
    return outputArray.join('');
  }

  /**
   * Strips unsafe tags and attributes from HTML.
   * @param {string} inputHtml The HTML to sanitize.
   * @param {?function(?string): ?string} opt_naiveUriRewriter A transform to
   *     apply to URI attributes.  If not given, URI attributes are deleted.
   * @param {function(?string): ?string} opt_nmTokenPolicy A transform to apply
   *     to attributes containing HTML names, element IDs, and space-separated
   *     lists of classes.  If not given, such attributes are left unchanged.
   */
  function sanitize(inputHtml,
    opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger) {
    var tagPolicy = makeTagPolicy(
      opt_naiveUriRewriter, opt_nmTokenPolicy, opt_logger);
    return sanitizeWithPolicy(inputHtml, tagPolicy);
  }

  // Export both quoted and unquoted names for Closure linkage.
  var html = {};
  html.escapeAttrib = html['escapeAttrib'] = escapeAttrib;
  html.makeHtmlSanitizer = html['makeHtmlSanitizer'] = makeHtmlSanitizer;
  html.makeSaxParser = html['makeSaxParser'] = makeSaxParser;
  html.makeTagPolicy = html['makeTagPolicy'] = makeTagPolicy;
  html.normalizeRCData = html['normalizeRCData'] = normalizeRCData;
  html.sanitize = html['sanitize'] = sanitize;
  html.sanitizeAttribs = html['sanitizeAttribs'] = sanitizeAttribs;
  html.sanitizeWithPolicy = html['sanitizeWithPolicy'] = sanitizeWithPolicy;
  html.unescapeEntities = html['unescapeEntities'] = unescapeEntities;
  return html;
})(html4);

var html_sanitize = html['sanitize'];

// Loosen restrictions of Caja's
// html-sanitizer to allow for styling
html4.ATTRIBS['*::style'] = 0;
html4.ELEMENTS['style'] = 0;
html4.ATTRIBS['a::target'] = 0;
html4.ELEMENTS['video'] = 0;
html4.ATTRIBS['video::src'] = 0;
html4.ATTRIBS['video::poster'] = 0;
html4.ATTRIBS['video::controls'] = 0;
html4.ELEMENTS['audio'] = 0;
html4.ATTRIBS['audio::src'] = 0;
html4.ATTRIBS['video::autoplay'] = 0;
html4.ATTRIBS['video::controls'] = 0;

if (typeof module !== 'undefined') {
    module.exports = html_sanitize;
}

},{}],7:[function(require,module,exports){
module.exports={
  "author": "Mapbox",
  "name": "mapbox.js",
  "description": "mapbox javascript api",
  "version": "1.6.2",
  "homepage": "http://mapbox.com/",
  "repository": {
    "type": "git",
    "url": "git://github.com/mapbox/mapbox.js.git"
  },
  "main": "index.js",
  "dependencies": {
    "leaflet": "0.7.2",
    "mustache": "0.7.3",
    "corslite": "0.0.5",
    "json3": "git://github.com/bestiejs/json3.git#v3.2.6",
    "sanitize-caja": "0.0.0",
    "leaflet-hash": "~0.2.1"
  },
  "scripts": {
    "test": "jshint src/*.js && mocha-phantomjs test/index.html"
  },
  "devDependencies": {
    "leaflet-hash": "git://github.com/mlevans/leaflet-hash.git#b039a3aa4e2492a5c7448075172ac26769e601d6",
    "leaflet-fullscreen": "0.0.0",
    "uglify-js": "2.4.8",
    "mocha": "1.17.1",
    "expect.js": "0.3.1",
    "sinon": "1.8.2",
    "mocha-phantomjs": "3.1.6",
    "happen": "0.1.3",
    "browserify": "3.23.1",
    "jshint": "2.4.4",
    "clean-css": "~2.0.7"
  },
  "optionalDependencies": {},
  "engines": {
    "node": "*"
  }
}

},{}],8:[function(require,module,exports){
'use strict';

module.exports = {

    HTTP_URLS: [
        'http://a.tiles.mapbox.com/v3/',
        'http://b.tiles.mapbox.com/v3/',
        'http://c.tiles.mapbox.com/v3/',
        'http://d.tiles.mapbox.com/v3/'],

    FORCE_HTTPS: false,

    HTTPS_URLS: [
        'https://a.tiles.mapbox.com/v3/',
        'https://b.tiles.mapbox.com/v3/',
        'https://c.tiles.mapbox.com/v3/',
        'https://d.tiles.mapbox.com/v3/']
};

},{}],9:[function(require,module,exports){
'use strict';

var util = require('./util'),
    urlhelper = require('./url'),
    request = require('./request'),
    marker = require('./marker'),
    simplestyle = require('./simplestyle');

// # featureLayer
//
// A layer of features, loaded from Mapbox or else. Adds the ability
// to reset features, filter them, and load them from a GeoJSON URL.
var FeatureLayer = L.FeatureGroup.extend({
    options: {
        filter: function() { return true; },
        sanitizer: require('sanitize-caja'),
        style: simplestyle.style
    },

    initialize: function(_, options) {
        L.setOptions(this, options);

        this._layers = {};

        if (typeof _ === 'string') {
            util.idUrl(_, this);
        // javascript object of TileJSON data
        } else if (_ && typeof _ === 'object') {
            this.setGeoJSON(_);
        }
    },

    setGeoJSON: function(_) {
        this._geojson = _;
        this.clearLayers();
        this._initialize(_);
        return this;
    },

    getGeoJSON: function() {
        return this._geojson;
    },

    loadURL: function(url) {
        if (this._request && 'abort' in this._request) this._request.abort();
        url = urlhelper.jsonify(url);
        this._request = request(url, L.bind(function(err, json) {
            this._request = null;
            if (err && err.type !== 'abort') {
                util.log('could not load features at ' + url);
                this.fire('error', {error: err});
            } else if (json) {
                this.setGeoJSON(json);
                this.fire('ready');
            }
        }, this));
        return this;
    },

    loadID: function(id) {
        return this.loadURL(urlhelper.base() + id + '/markers.geojson');
    },

    setFilter: function(_) {
        this.options.filter = _;
        if (this._geojson) {
            this.clearLayers();
            this._initialize(this._geojson);
        }
        return this;
    },

    getFilter: function() {
        return this.options.filter;
    },

    _initialize: function(json) {
        var features = L.Util.isArray(json) ? json : json.features,
            i, len;

        if (features) {
            for (i = 0, len = features.length; i < len; i++) {
                // Only add this if geometry or geometries are set and not null
                if (features[i].geometries || features[i].geometry || features[i].features) {
                    this._initialize(features[i]);
                }
            }
        } else if (this.options.filter(json)) {

            var layer = L.GeoJSON.geometryToLayer(json, marker.style),
                popupHtml = marker.createPopup(json, this.options.sanitizer);

            if ('setStyle' in layer) {
                layer.setStyle(simplestyle.style(json));
            }

            layer.feature = json;

            if (popupHtml) {
                layer.bindPopup(popupHtml, {
                    closeButton: false
                });
            }

            this.addLayer(layer);
        }
    }
});

module.exports = function(_, options) {
    return new FeatureLayer(_, options);
};

},{"./marker":19,"./request":20,"./simplestyle":22,"./url":24,"./util":25,"sanitize-caja":5}],10:[function(require,module,exports){
'use strict';

var util = require('./util'),
    urlhelper = require('./url'),
    request = require('./request');

// Low-level geocoding interface - wraps specific API calls and their
// return values.
module.exports = function(_) {

    var geocoder = {}, url;

    geocoder.getURL = function(_) {
        return url;
    };

    geocoder.setURL = function(_) {
        url = urlhelper.jsonify(_);
        return geocoder;
    };

    geocoder.setID = function(_) {
        util.strict(_, 'string');
        geocoder.setURL(urlhelper.base() + _ + '/geocode/{query}.json');
        return geocoder;
    };

    geocoder.setTileJSON = function(_) {
        util.strict(_, 'object');
        geocoder.setURL(_.geocoder);
        return geocoder;
    };

    geocoder.queryURL = function(_) {
        util.strict(_, 'string');
        if (!geocoder.getURL()) throw new Error('Geocoding map ID not set');
        return L.Util.template(geocoder.getURL(), { query: encodeURIComponent(_) });
    };

    geocoder.query = function(_, callback) {
        util.strict(_, 'string');
        util.strict(callback, 'function');
        request(geocoder.queryURL(_), function(err, json) {
            if (json && json.results && json.results.length) {
                var res = {
                    results: json.results,
                    latlng: [json.results[0][0].lat, json.results[0][0].lon]
                };
                if (json.results[0][0].bounds !== undefined) {
                    res.bounds = json.results[0][0].bounds;
                    res.lbounds = util.lbounds(res.bounds);
                }
                callback(null, res);
            } else callback(err || true);
        });

        return geocoder;
    };

    // a reverse geocode:
    //
    //  geocoder.reverseQuery([80, 20])
    geocoder.reverseQuery = function(_, callback) {
        var q = '';

        function norm(x) {
            if (x.lat !== undefined && x.lng !== undefined) return x.lng + ',' + x.lat;
            else if (x.lat !== undefined && x.lon !== undefined) return x.lon + ',' + x.lat;
            else return x[0] + ',' + x[1];
        }

        if (_.length && _[0].length) {
            for (var i = 0, pts = []; i < _.length; i++) pts.push(norm(_[i]));
            q = pts.join(';');
        } else q = norm(_);

        request(geocoder.queryURL(q), function(err, json) {
            callback(err, json);
        });

        return geocoder;
    };

    if (typeof _ === 'string') {
        if (_.indexOf('/') == -1) geocoder.setID(_);
        else geocoder.setURL(_);
    }
    else if (typeof _ === 'object') geocoder.setTileJSON(_);

    return geocoder;
};

},{"./request":20,"./url":24,"./util":25}],11:[function(require,module,exports){
'use strict';

var geocoder = require('./geocoder');

var GeocoderControl = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'topleft',
        pointZoom: 16,
        keepOpen: false
    },

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        this.geocoder = geocoder(_);
    },

    setURL: function(_) {
        this.geocoder.setURL(_);
        return this;
    },

    getURL: function() {
        return this.geocoder.getURL();
    },

    setID: function(_) {
        this.geocoder.setID(_);
        return this;
    },

    setTileJSON: function(_) {
        this.geocoder.setTileJSON(_);
        return this;
    },

    _toggle: function(e) {
        if (e) L.DomEvent.stop(e);
        if (L.DomUtil.hasClass(this._container, 'active')) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        } else {
            L.DomUtil.addClass(this._container, 'active');
            this._input.focus();
            this._input.select();
        }
    },

    _closeIfOpen: function(e) {
        if (L.DomUtil.hasClass(this._container, 'active') &&
            !this.options.keepOpen) {
            L.DomUtil.removeClass(this._container, 'active');
            this._results.innerHTML = '';
            this._input.blur();
        }
    },

    onAdd: function(map) {

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder leaflet-bar leaflet-control'),
            link = L.DomUtil.create('a', 'leaflet-control-mapbox-geocoder-toggle mapbox-icon mapbox-icon-geocoder', container),
            results = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-results', container),
            wrap = L.DomUtil.create('div', 'leaflet-control-mapbox-geocoder-wrap', container),
            form = L.DomUtil.create('form', 'leaflet-control-mapbox-geocoder-form', wrap),
            input  = L.DomUtil.create('input', '', form);

        link.href = '#';
        link.innerHTML = '&nbsp;';

        input.type = 'text';
        input.setAttribute('placeholder', 'Search');

        L.DomEvent.addListener(form, 'submit', this._geocode, this);
        L.DomEvent.disableClickPropagation(container);

        this._map = map;
        this._results = results;
        this._input = input;
        this._form = form;

        if (this.options.keepOpen) {
            L.DomUtil.addClass(container, 'active');
        } else {
            this._map.on('click', this._closeIfOpen, this);
            L.DomEvent.addListener(link, 'click', this._toggle, this);
        }

        return container;
    },

    _geocode: function(e) {
        L.DomEvent.preventDefault(e);
        L.DomUtil.addClass(this._container, 'searching');

        var map = this._map;
        var onload = L.bind(function(err, resp) {
            L.DomUtil.removeClass(this._container, 'searching');
            if (err || !resp || !resp.results || !resp.results.length) {
                this.fire('error', {error: err});
            } else {
                this._results.innerHTML = '';
                if (resp.results.length === 1) {
                    this.fire('autoselect', { data: resp });
                    chooseResult(resp.results[0][0]);
                    this._closeIfOpen();
                } else {
                    for (var i = 0, l = Math.min(resp.results.length, 5); i < l; i++) {
                        var name = [];
                        for (var j = 0; j < resp.results[i].length; j++) {
                            if (resp.results[i][j].name) name.push(resp.results[i][j].name);
                        }
                        if (!name.length) continue;

                        var r = L.DomUtil.create('a', '', this._results);
                        r.innerHTML = name.join(', ');
                        r.href = '#';

                        (L.bind(function(result) {
                            L.DomEvent.addListener(r, 'click', function(e) {
                                chooseResult(result[0]);
                                L.DomEvent.stop(e);
                                this.fire('select', { data: result });
                            }, this);
                        }, this))(resp.results[i]);
                    }
                    if (resp.results.length > 5) {
                        var outof = L.DomUtil.create('span', '', this._results);
                        outof.innerHTML = 'Top 5 of ' + resp.results.length + '  results';
                    }
                }
                this.fire('found', resp);
            }
        }, this);

        var chooseResult = L.bind(function(result) {
            if (result.bounds) {
                var _ = result.bounds;
                this._map.fitBounds(L.latLngBounds([[_[1], _[0]], [_[3], _[2]]]));
            } else if (result.lat !== undefined && result.lon !== undefined) {
                this._map.setView([result.lat, result.lon], (map.getZoom() === undefined) ?
                    this.options.pointZoom :
                    Math.max(map.getZoom(), this.options.pointZoom));
            }
        }, this);

        this.geocoder.query(this._input.value, onload);
    }
});

module.exports = function(_, options) {
    return new GeocoderControl(_, options);
};

},{"./geocoder":10}],12:[function(require,module,exports){
'use strict';

function utfDecode(c) {
    if (c >= 93) c--;
    if (c >= 35) c--;
    return c - 32;
}

module.exports = function(data) {
    return function(x, y) {
        if (!data) return;
        var idx = utfDecode(data.grid[y].charCodeAt(x)),
            key = data.keys[idx];
        return data.data[key];
    };
};

},{}],13:[function(require,module,exports){
'use strict';

var util = require('./util'),
    Mustache = require('mustache');

var GridControl = L.Control.extend({

    options: {
        pinnable: true,
        follow: false,
        sanitizer: require('sanitize-caja'),
        touchTeaser: true,
        location: true
    },

    _currentContent: '',

    // pinned means that this control is on a feature and the user has likely
    // clicked. pinned will not become false unless the user clicks off
    // of the feature onto another or clicks x
    _pinned: false,

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        util.strict_instance(_, L.Class, 'L.mapbox.gridLayer');
        this._layer = _;
    },

    setTemplate: function(template) {
        util.strict(template, 'string');
        this.options.template = template;
        return this;
    },

    _template: function(format, data) {
        if (!data) return;
        var template = this.options.template || this._layer.getTileJSON().template;
        if (template) {
            var d = {};
            d['__' + format + '__'] = true;
            return this.options.sanitizer(
                Mustache.to_html(template, L.extend(d, data)));
        }
    },

    // change the content of the tooltip HTML if it has changed, otherwise
    // noop
    _show: function(content, o) {
        if (content === this._currentContent) return;

        this._currentContent = content;

        if (this.options.follow) {
            this._popup.setContent(content)
                .setLatLng(o.latLng);
            if (this._map._popup !== this._popup) this._popup.openOn(this._map);
        } else {
            this._container.style.display = 'block';
            this._contentWrapper.innerHTML = content;
        }
    },

    hide: function() {
        this._pinned = false;
        this._currentContent = '';

        this._map.closePopup();
        this._container.style.display = 'none';
        this._contentWrapper.innerHTML = '';

        L.DomUtil.removeClass(this._container, 'closable');

        return this;
    },

    _mouseover: function(o) {
        if (o.data) {
            L.DomUtil.addClass(this._map._container, 'map-clickable');
        } else {
            L.DomUtil.removeClass(this._map._container, 'map-clickable');
        }

        if (this._pinned) return;

        var content = this._template('teaser', o.data);
        if (content) {
            this._show(content, o);
        } else {
            this.hide();
        }
    },

    _mousemove: function(o) {
        if (this._pinned) return;
        if (!this.options.follow) return;

        this._popup.setLatLng(o.latLng);
    },

    _navigateTo: function(url) {
        window.top.location.href = url;
    },

    _click: function(o) {

        var location_formatted = this._template('location', o.data);
        if (this.options.location && location_formatted &&
            location_formatted.search(/^https?:/) === 0) {
            return this._navigateTo(this._template('location', o.data));
        }

        if (!this.options.pinnable) return;

        var content = this._template('full', o.data);

        if (!content && this.options.touchTeaser && L.Browser.touch) {
            content = this._template('teaser', o.data);
        }

        if (content) {
            L.DomUtil.addClass(this._container, 'closable');
            this._pinned = true;
            this._show(content, o);
        } else if (this._pinned) {
            L.DomUtil.removeClass(this._container, 'closable');
            this._pinned = false;
            this.hide();
        }
    },

    _onPopupClose: function() {
        this._currentContent = null;
        this._pinned = false;
    },

    _createClosebutton: function(container, fn) {
        var link = L.DomUtil.create('a', 'close', container);

        link.innerHTML = 'close';
        link.href = '#';
        link.title = 'close';

        L.DomEvent
            .on(link, 'click', L.DomEvent.stopPropagation)
            .on(link, 'mousedown', L.DomEvent.stopPropagation)
            .on(link, 'dblclick', L.DomEvent.stopPropagation)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, this);

        return link;
    },

    onAdd: function(map) {
        this._map = map;

        var className = 'leaflet-control-grid map-tooltip',
            container = L.DomUtil.create('div', className),
            contentWrapper = L.DomUtil.create('div', 'map-tooltip-content');

        // hide the container element initially
        container.style.display = 'none';
        this._createClosebutton(container, this.hide);
        container.appendChild(contentWrapper);

        this._contentWrapper = contentWrapper;
        this._popup = new L.Popup({ autoPan: false, closeOnClick: false });

        map.on('popupclose', this._onPopupClose, this);

        L.DomEvent
            .disableClickPropagation(container)
            // allow people to scroll tooltips with mousewheel
            .addListener(container, 'mousewheel', L.DomEvent.stopPropagation);

        this._layer
            .on('mouseover', this._mouseover, this)
            .on('mousemove', this._mousemove, this)
            .on('click', this._click, this);

        return container;
    },

    onRemove: function (map) {

        map.off('popupclose', this._onPopupClose, this);

        this._layer
            .off('mouseover', this._mouseover, this)
            .off('mousemove', this._mousemove, this)
            .off('click', this._click, this);
    }
});

module.exports = function(_, options) {
    return new GridControl(_, options);
};

},{"./util":25,"mustache":4,"sanitize-caja":5}],14:[function(require,module,exports){
'use strict';

var util = require('./util'),
    url = require('./url'),
    request = require('./request'),
    grid = require('./grid');

// forked from danzel/L.UTFGrid
var GridLayer = L.Class.extend({
    includes: [L.Mixin.Events, require('./load_tilejson')],

    options: {
        template: function() { return ''; }
    },

    _mouseOn: null,
    _tilejson: {},
    _cache: {},

    initialize: function(_, options) {
        L.Util.setOptions(this, options);
        this._loadTileJSON(_);
    },

    _setTileJSON: function(json) {
        util.strict(json, 'object');

        L.extend(this.options, {
            grids: json.grids,
            minZoom: json.minzoom,
            maxZoom: json.maxzoom,
            bounds: json.bounds && util.lbounds(json.bounds)
        });

        this._tilejson = json;
        this._cache = {};
        this._update();

        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    active: function() {
        return !!(this._map && this.options.grids && this.options.grids.length);
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    onAdd: function(map) {
        this._map = map;
        this._update();

        this._map
            .on('click', this._click, this)
            .on('mousemove', this._move, this)
            .on('moveend', this._update, this);
    },

    onRemove: function() {
        this._map
            .off('click', this._click, this)
            .off('mousemove', this._move, this)
            .off('moveend', this._update, this);
    },

    getData: function(latlng, callback) {
        if (!this.active()) return;

        var map = this._map,
            point = map.project(latlng.wrap()),
            tileSize = 256,
            resolution = 4,
            x = Math.floor(point.x / tileSize),
            y = Math.floor(point.y / tileSize),
            max = map.options.crs.scale(map.getZoom()) / tileSize;

        x = (x + max) % max;
        y = (y + max) % max;

        this._getTile(map.getZoom(), x, y, function(grid) {
            var gridX = Math.floor((point.x - (x * tileSize)) / resolution),
                gridY = Math.floor((point.y - (y * tileSize)) / resolution);

            callback(grid(gridX, gridY));
        });

        return this;
    },

    _click: function(e) {
        this.getData(e.latlng, L.bind(function(data) {
            this.fire('click', {
                latLng: e.latlng,
                data: data
            });
        }, this));
    },

    _move: function(e) {
        this.getData(e.latlng, L.bind(function(data) {
            if (data !== this._mouseOn) {
                if (this._mouseOn) {
                    this.fire('mouseout', {
                        latLng: e.latlng,
                        data: this._mouseOn
                    });
                }

                this.fire('mouseover', {
                    latLng: e.latlng,
                    data: data
                });

                this._mouseOn = data;
            } else {
                this.fire('mousemove', {
                    latLng: e.latlng,
                    data: data
                });
            }
        }, this));
    },

    _getTileURL: function(tilePoint) {
        var urls = this.options.grids,
            index = (tilePoint.x + tilePoint.y) % urls.length,
            url = urls[index];

        return L.Util.template(url, tilePoint);
    },

    // Load up all required json grid files
    _update: function() {
        if (!this.active()) return;

        var bounds = this._map.getPixelBounds(),
            z = this._map.getZoom(),
            tileSize = 256;

        if (z > this.options.maxZoom || z < this.options.minZoom) return;

        var nwTilePoint = new L.Point(
                Math.floor(bounds.min.x / tileSize),
                Math.floor(bounds.min.y / tileSize)),
            seTilePoint = new L.Point(
                Math.floor(bounds.max.x / tileSize),
                Math.floor(bounds.max.y / tileSize)),
            max = this._map.options.crs.scale(z) / tileSize;

        for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) {
            for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) {
                // x wrapped
                var xw = (x + max) % max, yw = (y + max) % max;
                this._getTile(z, xw, yw);
            }
        }
    },

    _getTile: function(z, x, y, callback) {
        var key = z + '_' + x + '_' + y,
            tilePoint = L.point(x, y);

        tilePoint.z = z;

        if (!this._tileShouldBeLoaded(tilePoint)) {
            return;
        }

        if (key in this._cache) {
            if (!callback) return;

            if (typeof this._cache[key] === 'function') {
                callback(this._cache[key]); // Already loaded
            } else {
                this._cache[key].push(callback); // Pending
            }

            return;
        }

        this._cache[key] = [];

        if (callback) {
            this._cache[key].push(callback);
        }

        request(this._getTileURL(tilePoint), L.bind(function(err, json) {
            var callbacks = this._cache[key];
            this._cache[key] = grid(json);
            for (var i = 0; i < callbacks.length; ++i) {
                callbacks[i](this._cache[key]);
            }
        }, this));
    },

    _tileShouldBeLoaded: function(tilePoint) {
        if (tilePoint.z > this.options.maxZoom || tilePoint.z < this.options.minZoom) {
            return false;
        }

        if (this.options.bounds) {
            var tileSize = 256,
                nwPoint = tilePoint.multiplyBy(tileSize),
                sePoint = nwPoint.add(new L.Point(tileSize, tileSize)),
                nw = this._map.unproject(nwPoint),
                se = this._map.unproject(sePoint),
                bounds = new L.LatLngBounds([nw, se]);

            if (!this.options.bounds.intersects(bounds)) {
                return false;
            }
        }

        return true;
    }
});

module.exports = function(_, options) {
    return new GridLayer(_, options);
};

},{"./grid":12,"./load_tilejson":17,"./request":20,"./url":24,"./util":25}],15:[function(require,module,exports){
'use strict';

var InfoControl = L.Control.extend({
    options: {
        position: 'bottomright',
        sanitizer: require('sanitize-caja')
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._info = {};
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'mapbox-control-info mapbox-small');
        this._content = L.DomUtil.create('div', 'map-info-container', this._container);

        if (this.options.position === 'bottomright' ||
            this.options.position === 'topright') {
            this._container.className += ' mapbox-control-info-right';
        }

        var link = L.DomUtil.create('a', 'mapbox-info-toggle mapbox-icon mapbox-icon-info', this._container);
        link.href = '#';

        L.DomEvent.addListener(link, 'click', this._showInfo, this);
        L.DomEvent.disableClickPropagation(this._container);

        for (var i in map._layers) {
            if (map._layers[i].getAttribution) {
                this.addInfo(map._layers[i].getAttribution());
            }
        }

        map
            .on('moveend', this._editLink, this)
            .on('layeradd', this._onLayerAdd, this)
            .on('layerremove', this._onLayerRemove, this);

        this._update();
        return this._container;
    },

    onRemove: function(map) {
        map
            .off('moveend', this._editLink, this)
            .off('layeradd', this._onLayerAdd, this)
            .off('layerremove', this._onLayerRemove, this);
    },

    addInfo: function(text) {
        if (!text) return this;
        if (!this._info[text]) this._info[text] = 0;
        this._info[text] = true;
        return this._update();
    },

    removeInfo: function (text) {
        if (!text) return this;
        if (this._info[text]) this._info[text] = false;
        return this._update();
    },

    _showInfo: function(e) {
        L.DomEvent.preventDefault(e);
        if (this._active === true) return this._hidecontent();

        L.DomUtil.addClass(this._container, 'active');
        this._active = true;
        this._update();
    },

    _hidecontent: function() {
        this._content.innerHTML = '';
        this._active = false;
        L.DomUtil.removeClass(this._container, 'active');
        return;
    },

    _update: function() {
        if (!this._map) { return this; }
        this._content.innerHTML = '';
        var hide = 'none';
        var info = [];

        for (var i in this._info) {
            if (this._info.hasOwnProperty(i) && this._info[i]) {
                info.push(this.options.sanitizer(i));
                hide = 'block';
            }
        }

        this._content.innerHTML += info.join(' | ');
        this._editLink();

        // If there are no results in _info then hide this.
        this._container.style.display = hide;
        return this;
    },

    _editLink: function() {
        if (!this._content.getElementsByClassName) {
            return;
        }
        var link = this._content.getElementsByClassName('mapbox-improve-map');
        if (link.length && this._map._loaded) {
            var center = this._map.getCenter().wrap();
            var tilejson = this._tilejson || this._map._tilejson || {};
            var id = tilejson.id || '';

            for (var i = 0; i < link.length; i++) {
                link[i].href = link[i].href.split('#')[0] + '#' + id + '/' +
                    center.lng.toFixed(3) + '/' +
                    center.lat.toFixed(3) + '/' +
                    this._map.getZoom();
            }
        }
    },

    _onLayerAdd: function(e) {
        if (e.layer.getAttribution && e.layer.getAttribution()) {
            this.addInfo(e.layer.getAttribution());
        } else if ('on' in e.layer && e.layer.getAttribution) {
            e.layer.on('ready', L.bind(function() {
                this.addInfo(e.layer.getAttribution());
            }, this));
        }
    },

    _onLayerRemove: function (e) {
        if (e.layer.getAttribution) {
            this.removeInfo(e.layer.getAttribution());
        }
    }
});

module.exports = function(options) {
    return new InfoControl(options);
};

},{"sanitize-caja":5}],16:[function(require,module,exports){
'use strict';

var LegendControl = L.Control.extend({

    options: {
        position: 'bottomright',
        sanitizer: require('sanitize-caja')
    },

    initialize: function(options) {
        L.setOptions(this, options);
        this._legends = {};
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'map-legends wax-legends');
        L.DomEvent.disableClickPropagation(this._container);

        this._update();

        return this._container;
    },

    addLegend: function(text) {
        if (!text) { return this; }

        if (!this._legends[text]) {
            this._legends[text] = 0;
        }

        this._legends[text]++;
        return this._update();
    },

    removeLegend: function(text) {
        if (!text) { return this; }
        if (this._legends[text]) this._legends[text]--;
        return this._update();
    },

    _update: function() {
        if (!this._map) { return this; }

        this._container.innerHTML = '';
        var hide = 'none';

        for (var i in this._legends) {
            if (this._legends.hasOwnProperty(i) && this._legends[i]) {
                var div = L.DomUtil.create('div', 'map-legend wax-legend', this._container);
                div.innerHTML = this.options.sanitizer(i);
                hide = 'block';
            }
        }

        // hide the control entirely unless there is at least one legend;
        // otherwise there will be a small grey blemish on the map.
        this._container.style.display = hide;

        return this;
    }
});

module.exports = function(options) {
    return new LegendControl(options);
};

},{"sanitize-caja":5}],17:[function(require,module,exports){
'use strict';

var request = require('./request'),
    url = require('./url'),
    util = require('./util');

module.exports = {
    _loadTileJSON: function(_) {
        if (typeof _ === 'string') {
            if (_.indexOf('/') == -1) {
                _ = url.base() + _ + '.json';
            }

            request(url.secureFlag(_), L.bind(function(err, json) {
                if (err) {
                    util.log('could not load TileJSON at ' + _);
                    this.fire('error', {error: err});
                } else if (json) {
                    this._setTileJSON(json);
                    this.fire('ready');
                }
            }, this));
        } else if (_ && typeof _ === 'object') {
            this._setTileJSON(_);
        }
    }
};

},{"./request":20,"./url":24,"./util":25}],18:[function(require,module,exports){
'use strict';

var util = require('./util'),
    tileLayer = require('./tile_layer'),
    featureLayer = require('./feature_layer'),
    gridLayer = require('./grid_layer'),
    gridControl = require('./grid_control'),
    infoControl = require('./info_control'),
    shareControl = require('./share_control'),
    legendControl = require('./legend_control');

var LMap = L.Map.extend({
    includes: [require('./load_tilejson')],

    options: {
        tileLayer: {},
        featureLayer: {},
        gridLayer: {},
        legendControl: {},
        gridControl: {},
        infoControl: {},
        attributionControl: false,
        shareControl: false
    },

    _tilejson: {},

    initialize: function(element, _, options) {
        L.Map.prototype.initialize.call(this, element, options);

        // disable the default 'Leaflet' text
        if (this.attributionControl) this.attributionControl.setPrefix('');

        if (this.options.tileLayer) {
            this.tileLayer = tileLayer(undefined, this.options.tileLayer);
            this.addLayer(this.tileLayer);
        }

        if (this.options.featureLayer === false || this.options.markerLayer === false) {
            this.options.featureLayer = this.options.markerLayer = false;
        } else if (this.options.markerLayer) {
            this.options.featureLayer = this.options.markerLayer;
        }

        if (this.options.featureLayer) {
            this.featureLayer = this.markerLayer =
                featureLayer(undefined, this.options.featureLayer);
            this.addLayer(this.featureLayer);
        }

        if (this.options.gridLayer) {
            this.gridLayer = gridLayer(undefined, this.options.gridLayer);
            this.addLayer(this.gridLayer);
        }

        if (this.options.gridLayer && this.options.gridControl) {
            this.gridControl = gridControl(this.gridLayer, this.options.gridControl);
            this.addControl(this.gridControl);
        }

        if (this.options.infoControl) {
            this.infoControl = infoControl(this.options.infoControl);
            this.addControl(this.infoControl);
        }

        if (this.options.legendControl) {
            this.legendControl = legendControl(this.options.legendControl);
            this.addControl(this.legendControl);
        }

        if (this.options.shareControl) {
            this.shareControl = shareControl(undefined, this.options.shareControl);
            this.addControl(this.shareControl);
        }

        this._loadTileJSON(_);
    },

    // Update certain properties on 'ready' event
    addLayer: function(layer) {
        if ('on' in layer) { layer.on('ready', L.bind(function() { this._updateLayer(layer); }, this)); }
        return L.Map.prototype.addLayer.call(this, layer);
    },

    // use a javascript object of tilejson data to configure this layer
    _setTileJSON: function(_) {
        this._tilejson = _;
        this._initialize(_);
        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    _initialize: function(json) {
        if (this.tileLayer) {
            this.tileLayer._setTileJSON(json);
            this._updateLayer(this.tileLayer);
        }

        if (this.featureLayer && !this.featureLayer.getGeoJSON() && json.data && json.data[0]) {
            this.featureLayer.loadURL(json.data[0]);
        }

        if (this.gridLayer) {
            this.gridLayer._setTileJSON(json);
            this._updateLayer(this.gridLayer);
        }

        if (this.infoControl && json.attribution) {
            this.infoControl.addInfo(json.attribution);
        }

        if (this.legendControl && json.legend) {
            this.legendControl.addLegend(json.legend);
        }

        if (this.shareControl) {
            this.shareControl._setTileJSON(json);
        }

        if (!this._loaded && json.center) {
            var zoom = json.center[2],
                center = L.latLng(json.center[1], json.center[0]);

            this.setView(center, zoom);
        }
    },

    _updateLayer: function(layer) {
        if (!layer.options) return;

        if (this.infoControl && this._loaded) {
            this.infoControl.addInfo(layer.options.infoControl);
        }

        if (this.attributionControl && this._loaded && layer.getAttribution) {
            this.attributionControl.addAttribution(layer.getAttribution());
        }

        if (!(L.stamp(layer) in this._zoomBoundLayers) &&
                (layer.options.maxZoom || layer.options.minZoom)) {
            this._zoomBoundLayers[L.stamp(layer)] = layer;
        }

        this._updateZoomLevels();
    }
});

module.exports = function(element, _, options) {
    return new LMap(element, _, options);
};

},{"./feature_layer":9,"./grid_control":13,"./grid_layer":14,"./info_control":15,"./legend_control":16,"./load_tilejson":17,"./share_control":21,"./tile_layer":23,"./util":25}],19:[function(require,module,exports){
'use strict';

var url = require('./url'),
    util = require('./util'),
    sanitize = require('sanitize-caja');

// mapbox-related markers functionality
// provide an icon from mapbox's simple-style spec and hosted markers
// service
function icon(fp) {
    fp = fp || {};

    var sizes = {
            small: [20, 50],
            medium: [30, 70],
            large: [35, 90]
        },
        size = fp['marker-size'] || 'medium',
        symbol = (fp['marker-symbol']) ? '-' + fp['marker-symbol'] : '',
        color = (fp['marker-color'] || '7e7e7e').replace('#', '');

    return L.icon({
        iconUrl: url.base() + 'marker/' +
            'pin-' + size.charAt(0) + symbol + '+' + color +
            // detect and use retina markers, which are x2 resolution
            ((L.Browser.retina) ? '@2x' : '') + '.png',
        iconSize: sizes[size],
        iconAnchor: [sizes[size][0] / 2, sizes[size][1] / 2],
        popupAnchor: [0, -sizes[size][1] / 2]
    });
}

// a factory that provides markers for Leaflet from Mapbox's
// [simple-style specification](https://github.com/mapbox/simplestyle-spec)
// and [Markers API](http://mapbox.com/developers/api/#markers).
function style(f, latlon) {
    return L.marker(latlon, {
        icon: icon(f.properties),
        title: util.strip_tags(
            sanitize((f.properties && f.properties.title) || ''))
    });
}

// Sanitize and format properties of a GeoJSON Feature object in order
// to form the HTML string used as the argument for `L.createPopup`
function createPopup(f, sanitizer) {
    if (!f || !f.properties) return '';
    var popup = '';

    if (f.properties.title) {
        popup += '<div class="marker-title">' + f.properties.title + '</div>';
    }

    if (f.properties.description) {
        popup += '<div class="marker-description">' + f.properties.description + '</div>';
    }

    return (sanitizer || sanitize)(popup);
}

module.exports = {
    icon: icon,
    style: style,
    createPopup: createPopup
};

},{"./url":24,"./util":25,"sanitize-caja":5}],20:[function(require,module,exports){
'use strict';

var corslite = require('corslite'),
    JSON3 = require('json3'),
    strict = require('./util').strict;

module.exports = function(url, callback) {
    strict(url, 'string');
    strict(callback, 'function');
    return corslite(url, onload);
    function onload(err, resp) {
        if (!err && resp) {
            // hardcoded grid response
            if (resp.responseText[0] == 'g') {
                resp = JSON3.parse(resp.responseText
                    .substring(5, resp.responseText.length - 2));
            } else {
                resp = JSON3.parse(resp.responseText);
            }
        }
        callback(err, resp);
    }
};

},{"./util":25,"corslite":2,"json3":3}],21:[function(require,module,exports){
'use strict';

var url = require('./url');

var ShareControl = L.Control.extend({
    includes: [require('./load_tilejson')],

    options: {
        position: 'topleft',
        url: ''
    },

    initialize: function(_, options) {
        L.setOptions(this, options);
        this._loadTileJSON(_);
    },

    _setTileJSON: function(json) {
        this._tilejson = json;
    },

    onAdd: function(map) {
        this._map = map;
        this._url = url;

        var container = L.DomUtil.create('div', 'leaflet-control-mapbox-share leaflet-bar');
        var link = L.DomUtil.create('a', 'mapbox-share mapbox-icon mapbox-icon-share', container);
        link.href = '#';

        this._modal = map._createPane('mapbox-modal', this._map._container);
        this._mask = map._createPane('mapbox-modal-mask', this._modal);
        this._content = map._createPane('mapbox-modal-content', this._modal);

        L.DomEvent.addListener(link, 'click', this._shareClick, this);
        L.DomEvent.disableClickPropagation(container);

        this._map.on('mousedown', this._clickOut, this);

        return container;
    },

    _clickOut: function(e) {
        if (this._sharing) {
            L.DomEvent.preventDefault(e);
            L.DomUtil.removeClass(this._modal, 'active');
            this._content.innerHTML = '';
            this._sharing = null;
            return;
        }
    },

    _shareClick: function(e) {
        L.DomEvent.stop(e);
        if (this._sharing) return this._clickOut(e);

        var tilejson = this._tilejson || this._map._tilejson || {},
            url = encodeURIComponent(this.options.url || tilejson.webpage || window.location),
            name = encodeURIComponent(tilejson.name),
            image = this._url.base() + tilejson.id + '/' + this._map.getCenter().lng + ',' + this._map.getCenter().lat + ',' + this._map.getZoom() + '/600x600.png',
            twitter = '//twitter.com/intent/tweet?status=' + name + ' ' + url,
            facebook = '//www.facebook.com/sharer.php?u=' + url + '&t=' + encodeURIComponent(tilejson.name),
            pinterest = '//www.pinterest.com/pin/create/button/?url=' + url + '&media=' + image + '&description=' + tilejson.name,
            share = ("<h3>Share this map</h3>" +
                    "<div class='mapbox-share-buttons'><a class='mapbox-button mapbox-button-icon mapbox-icon-facebook' target='_blank' href='{{facebook}}'>Facebook</a>" +
                    "<a class='mapbox-button mapbox-button-icon mapbox-icon-twitter' target='_blank' href='{{twitter}}'>Twitter</a>" +
                    "<a class='mapbox-button mapbox-button-icon mapbox-icon-pinterest' target='_blank' href='{{pinterest}}'>Pinterest</a></div>")
                    .replace('{{twitter}}', twitter)
                    .replace('{{facebook}}', facebook)
                    .replace('{{pinterest}}', pinterest),
            embedValue = '<iframe width="100%" height="500px" frameBorder="0" src="{{embed}}"></iframe>'.replace('{{embed}}', tilejson.embed || window.location),
            embedLabel = 'Copy and paste this <strong>HTML code</strong> into documents to embed this map on web pages.';

        L.DomUtil.addClass(this._modal, 'active');

        this._sharing = this._map._createPane('mapbox-modal-body', this._content);
        this._sharing.innerHTML = share;

        var embed = L.DomUtil.create('input', 'mapbox-embed', this._sharing);
        embed.type = 'text';
        embed.value = embedValue;

        var label = L.DomUtil.create('label', 'mapbox-embed-description', this._sharing);
        label.innerHTML = embedLabel;

        var close = L.DomUtil.create('a', 'leaflet-popup-close-button', this._sharing);
        close.href = '#';

        L.DomEvent.disableClickPropagation(this._sharing);
        L.DomEvent.addListener(close, 'click', this._clickOut, this);
        L.DomEvent.addListener(embed, 'click', function(e) {
            e.target.focus();
            e.target.select();
        });
    }
});

module.exports = function(_, options) {
    return new ShareControl(_, options);
};

},{"./load_tilejson":17,"./url":24}],22:[function(require,module,exports){
'use strict';

// an implementation of the simplestyle spec for polygon and linestring features
// https://github.com/mapbox/simplestyle-spec
var defaults = {
    stroke: '#555555',
    'stroke-width': 2,
    'stroke-opacity': 1,
    fill: '#555555',
    'fill-opacity': 0.5
};

var mapping = [
    ['stroke', 'color'],
    ['stroke-width', 'weight'],
    ['stroke-opacity', 'opacity'],
    ['fill', 'fillColor'],
    ['fill-opacity', 'fillOpacity']
];

function fallback(a, b) {
    var c = {};
    for (var k in b) {
        if (a[k] === undefined) c[k] = b[k];
        else c[k] = a[k];
    }
    return c;
}

function remap(a) {
    var d = {};
    for (var i = 0; i < mapping.length; i++) {
        d[mapping[i][1]] = a[mapping[i][0]];
    }
    return d;
}

function style(feature) {
    return remap(fallback(feature.properties || {}, defaults));
}

module.exports = {
    style: style,
    defaults: defaults
};

},{}],23:[function(require,module,exports){
'use strict';

var util = require('./util'),
    url = require('./url');

var TileLayer = L.TileLayer.extend({
    includes: [require('./load_tilejson')],

    options: {
        format: 'png'
    },

    // http://mapbox.com/developers/api/#image_quality
    formats: [
        'png',
        // PNG
        'png32', 'png64', 'png128', 'png256',
        // JPG
        'jpg70', 'jpg80', 'jpg90'],

    scalePrefix: '@2x.',

    initialize: function(_, options) {
        L.TileLayer.prototype.initialize.call(this, undefined, options);

        this._tilejson = {};

        if (options && options.detectRetina &&
            L.Browser.retina && options.retinaVersion) {
            _ = options.retinaVersion;
        }

        if (options && options.format) {
            util.strict_oneof(options.format, this.formats);
        }

        this._loadTileJSON(_);
    },

    setFormat: function(_) {
        util.strict(_, 'string');
        this.options.format = _;
        this.redraw();
        return this;
    },

    _autoScale: function() {
        return this.options &&
            L.Browser.retina &&
            this.options.detectRetina &&
            (!this.options.retinaVersion) &&
            this.options.autoscale;
    },

    // disable the setUrl function, which is not available on mapbox tilelayers
    setUrl: null,

    _setTileJSON: function(json) {
        util.strict(json, 'object');

        L.extend(this.options, {
            tiles: json.tiles,
            attribution: json.attribution,
            minZoom: json.minzoom,
            maxZoom: json.maxzoom,
            autoscale: json.autoscale || false,
            tms: json.scheme === 'tms',
            bounds: json.bounds && util.lbounds(json.bounds)
        });

        this._tilejson = json;
        this.redraw();
        return this;
    },

    getTileJSON: function() {
        return this._tilejson;
    },

    // this is an exception to mapbox.js naming rules because it's called
    // by `L.map`
    getTileUrl: function(tilePoint) {
        var tiles = this.options.tiles,
            index = Math.floor(Math.abs(tilePoint.x + tilePoint.y) % tiles.length),
            url = tiles[index];

        var templated = L.Util.template(url, tilePoint);
        if (!templated) {
            return templated;
        } else {
            return templated.replace('.png',
                (this._autoScale() ? this.scalePrefix : '.') + this.options.format);
        }
    },

    // TileJSON.TileLayers are added to the map immediately, so that they get
    // the desired z-index, but do not update until the TileJSON has been loaded.
    _update: function() {
        if (this.options.tiles) {
            L.TileLayer.prototype._update.call(this);
        }
    }
});

module.exports = function(_, options) {
    return new TileLayer(_, options);
};

},{"./load_tilejson":17,"./url":24,"./util":25}],24:[function(require,module,exports){
'use strict';

var config = require('./config');

// Return the base url of a specific version of Mapbox's API.
//
// `hash`, if provided must be a number and is used to distribute requests
// against multiple `CNAME`s in order to avoid connection limits in browsers
module.exports = {
    isSSL: function() {
        return 'https:' === document.location.protocol || config.FORCE_HTTPS;
    },
    base: function(hash) {
        // By default, use public HTTP urls
        // Support HTTPS if the user has specified HTTPS urls to use, and this
        // page is under HTTPS
        var urls = this.isSSL() ? config.HTTPS_URLS : config.HTTP_URLS;
        if (hash === undefined || typeof hash !== 'number') {
            return urls[0];
        } else {
            return urls[hash % urls.length];
        }
    },
    // Requests that contain URLs need a secure flag appended
    // to their URLs so that the server knows to send SSL-ified
    // resource references.
    secureFlag: function(url) {
        if (!this.isSSL()) return url;
        else if (url.match(/(\?|&)secure/)) return url;
        else if (url.indexOf('?') !== -1) return url + '&secure';
        else return url + '?secure';
    },
    // Convert a JSONP url to a JSON URL. (Mapbox TileJSON sometimes hardcodes JSONP.)
    jsonify: function(url) {
        return url.replace(/\.(geo)?jsonp(?=$|\?)/, '.$1json');
    }
};

},{"./config":8}],25:[function(require,module,exports){
'use strict';

module.exports = {
    idUrl: function(_, t) {
        if (_.indexOf('/') == -1) t.loadID(_);
        else t.loadURL(_);
    },
    log: function(_) {
        if (console && typeof console.error === 'function') {
            console.error(_);
        }
    },
    strict: function(_, type) {
        if (typeof _ !== type) {
            throw new Error('Invalid argument: ' + type + ' expected');
        }
    },
    strict_instance: function(_, klass, name) {
        if (!(_ instanceof klass)) {
            throw new Error('Invalid argument: ' + name + ' expected');
        }
    },
    strict_oneof: function(_, values) {
        if (!contains(_, values)) {
            throw new Error('Invalid argument: ' + _ + ' given, valid values are ' +
                values.join(', '));
        }
    },
    strip_tags: function(_) {
        return _.replace(/<[^<]+>/g, '');
    },
    lbounds: function(_) {
        // leaflet-compatible bounds, since leaflet does not do geojson
        return new L.LatLngBounds([[_[1], _[0]], [_[3], _[2]]]);
    }
};

function contains(item, list) {
    if (!list || !list.length) return false;
    for (var i = 0; i < list.length; i++) {
        if (list[i] == item) return true;
    }
    return false;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9tYXBib3guanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9ub2RlX21vZHVsZXMvY29yc2xpdGUvY29yc2xpdGUuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9ub2RlX21vZHVsZXMvanNvbjMvbGliL2pzb24zLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvbm9kZV9tb2R1bGVzL211c3RhY2hlL211c3RhY2hlLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvbm9kZV9tb2R1bGVzL3Nhbml0aXplLWNhamEvaW5kZXguanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9ub2RlX21vZHVsZXMvc2FuaXRpemUtY2FqYS9zYW5pdGl6ZXItYnVuZGxlLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvcGFja2FnZS5qc29uIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvc3JjL2NvbmZpZy5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy9mZWF0dXJlX2xheWVyLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvc3JjL2dlb2NvZGVyLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvc3JjL2dlb2NvZGVyX2NvbnRyb2wuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvZ3JpZC5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy9ncmlkX2NvbnRyb2wuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvZ3JpZF9sYXllci5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy9pbmZvX2NvbnRyb2wuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvbGVnZW5kX2NvbnRyb2wuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvbG9hZF90aWxlanNvbi5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy9tYXAuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvbWFya2VyLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvc3JjL3JlcXVlc3QuanMiLCIvdmFyL3d3dy9pbi9ib3dlcl9jb21wb25lbnRzL21hcGJveC5qcy9zcmMvc2hhcmVfY29udHJvbC5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy9zaW1wbGVzdHlsZS5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy90aWxlX2xheWVyLmpzIiwiL3Zhci93d3cvaW4vYm93ZXJfY29tcG9uZW50cy9tYXBib3guanMvc3JjL3VybC5qcyIsIi92YXIvd3d3L2luL2Jvd2VyX2NvbXBvbmVudHMvbWFwYm94LmpzL3NyYy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOTRFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEhhcmRjb2RlIGltYWdlIHBhdGgsIGJlY2F1c2UgTGVhZmxldCdzIGF1dG9kZXRlY3Rpb25cbi8vIGZhaWxzLCBiZWNhdXNlIG1hcGJveC5qcyBpcyBub3QgbmFtZWQgbGVhZmxldC5qc1xud2luZG93LkwuSWNvbi5EZWZhdWx0LmltYWdlUGF0aCA9ICcvL2FwaS50aWxlcy5tYXBib3guY29tL21hcGJveC5qcy8nICsgJ3YnICtcbiAgICByZXF1aXJlKCcuL3BhY2thZ2UuanNvbicpLnZlcnNpb24gKyAnL2ltYWdlcyc7XG5cbkwubWFwYm94ID0gbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgVkVSU0lPTjogcmVxdWlyZSgnLi9wYWNrYWdlLmpzb24nKS52ZXJzaW9uLFxuICAgIGdlb2NvZGVyOiByZXF1aXJlKCcuL3NyYy9nZW9jb2RlcicpLFxuICAgIG1hcmtlcjogcmVxdWlyZSgnLi9zcmMvbWFya2VyJyksXG4gICAgc2ltcGxlc3R5bGU6IHJlcXVpcmUoJy4vc3JjL3NpbXBsZXN0eWxlJyksXG4gICAgdGlsZUxheWVyOiByZXF1aXJlKCcuL3NyYy90aWxlX2xheWVyJyksXG4gICAgaW5mb0NvbnRyb2w6IHJlcXVpcmUoJy4vc3JjL2luZm9fY29udHJvbCcpLFxuICAgIHNoYXJlQ29udHJvbDogcmVxdWlyZSgnLi9zcmMvc2hhcmVfY29udHJvbCcpLFxuICAgIGxlZ2VuZENvbnRyb2w6IHJlcXVpcmUoJy4vc3JjL2xlZ2VuZF9jb250cm9sJyksXG4gICAgZ2VvY29kZXJDb250cm9sOiByZXF1aXJlKCcuL3NyYy9nZW9jb2Rlcl9jb250cm9sJyksXG4gICAgZ3JpZENvbnRyb2w6IHJlcXVpcmUoJy4vc3JjL2dyaWRfY29udHJvbCcpLFxuICAgIGdyaWRMYXllcjogcmVxdWlyZSgnLi9zcmMvZ3JpZF9sYXllcicpLFxuICAgIGZlYXR1cmVMYXllcjogcmVxdWlyZSgnLi9zcmMvZmVhdHVyZV9sYXllcicpLFxuICAgIG1hcDogcmVxdWlyZSgnLi9zcmMvbWFwJyksXG4gICAgY29uZmlnOiByZXF1aXJlKCcuL3NyYy9jb25maWcnKSxcbiAgICBzYW5pdGl6ZTogcmVxdWlyZSgnc2FuaXRpemUtY2FqYScpLFxuICAgIHRlbXBsYXRlOiByZXF1aXJlKCdtdXN0YWNoZScpLnRvX2h0bWxcbn07XG5cbkwubWFwYm94Lm1hcmtlckxheWVyID0gTC5tYXBib3guZmVhdHVyZUxheWVyO1xuIiwiZnVuY3Rpb24geGhyKHVybCwgY2FsbGJhY2ssIGNvcnMpIHtcbiAgICB2YXIgc2VudCA9IGZhbHNlO1xuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cuWE1MSHR0cFJlcXVlc3QgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvcignQnJvd3NlciBub3Qgc3VwcG9ydGVkJykpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY29ycyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG0gPSB1cmwubWF0Y2goL15cXHMqaHR0cHM/OlxcL1xcL1teXFwvXSovKTtcbiAgICAgICAgY29ycyA9IG0gJiYgKG1bMF0gIT09IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmRvbWFpbiArXG4gICAgICAgICAgICAgICAgKGxvY2F0aW9uLnBvcnQgPyAnOicgKyBsb2NhdGlvbi5wb3J0IDogJycpKTtcbiAgICB9XG5cbiAgICB2YXIgeDtcblxuICAgIGZ1bmN0aW9uIGlzU3VjY2Vzc2Z1bChzdGF0dXMpIHtcbiAgICAgICAgcmV0dXJuIHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwIHx8IHN0YXR1cyA9PT0gMzA0O1xuICAgIH1cblxuICAgIGlmIChjb3JzICYmIChcbiAgICAgICAgLy8gSUU3LTkgUXVpcmtzICYgQ29tcGF0aWJpbGl0eVxuICAgICAgICB0eXBlb2Ygd2luZG93LlhEb21haW5SZXF1ZXN0ID09PSAnb2JqZWN0JyB8fFxuICAgICAgICAvLyBJRTkgU3RhbmRhcmRzIG1vZGVcbiAgICAgICAgdHlwZW9mIHdpbmRvdy5YRG9tYWluUmVxdWVzdCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICkpIHtcbiAgICAgICAgLy8gSUU4LTEwXG4gICAgICAgIHggPSBuZXcgd2luZG93LlhEb21haW5SZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gRW5zdXJlIGNhbGxiYWNrIGlzIG5ldmVyIGNhbGxlZCBzeW5jaHJvbm91c2x5LCBpLmUuLCBiZWZvcmVcbiAgICAgICAgLy8geC5zZW5kKCkgcmV0dXJucyAodGhpcyBoYXMgYmVlbiBvYnNlcnZlZCBpbiB0aGUgd2lsZCkuXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vbWFwYm94L21hcGJveC5qcy9pc3N1ZXMvNDcyXG4gICAgICAgIHZhciBvcmlnaW5hbCA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHNlbnQpIHtcbiAgICAgICAgICAgICAgICBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWwuYXBwbHkodGhhdCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB4ID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRlZCgpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgLy8gWERvbWFpblJlcXVlc3RcbiAgICAgICAgICAgIHguc3RhdHVzID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAgICAgaXNTdWNjZXNzZnVsKHguc3RhdHVzKSkgY2FsbGJhY2suY2FsbCh4LCBudWxsLCB4KTtcbiAgICAgICAgZWxzZSBjYWxsYmFjay5jYWxsKHgsIHgsIG51bGwpO1xuICAgIH1cblxuICAgIC8vIEJvdGggYG9ucmVhZHlzdGF0ZWNoYW5nZWAgYW5kIGBvbmxvYWRgIGNhbiBmaXJlLiBgb25yZWFkeXN0YXRlY2hhbmdlYFxuICAgIC8vIGhhcyBbYmVlbiBzdXBwb3J0ZWQgZm9yIGxvbmdlcl0oaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvOTE4MTUwOC8yMjkwMDEpLlxuICAgIGlmICgnb25sb2FkJyBpbiB4KSB7XG4gICAgICAgIHgub25sb2FkID0gbG9hZGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHgub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gcmVhZHlzdGF0ZSgpIHtcbiAgICAgICAgICAgIGlmICh4LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHRoZSBjYWxsYmFjayB3aXRoIHRoZSBYTUxIdHRwUmVxdWVzdCBvYmplY3QgYXMgYW4gZXJyb3IgYW5kIHByZXZlbnRcbiAgICAvLyBpdCBmcm9tIGV2ZXIgYmVpbmcgY2FsbGVkIGFnYWluIGJ5IHJlYXNzaWduaW5nIGl0IHRvIGBub29wYFxuICAgIHgub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKGV2dCkge1xuICAgICAgICAvLyBYRG9tYWluUmVxdWVzdCBwcm92aWRlcyBubyBldnQgcGFyYW1ldGVyXG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgZXZ0IHx8IHRydWUsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICAvLyBJRTkgbXVzdCBoYXZlIG9ucHJvZ3Jlc3MgYmUgc2V0IHRvIGEgdW5pcXVlIGZ1bmN0aW9uLlxuICAgIHgub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkgeyB9O1xuXG4gICAgeC5vbnRpbWVvdXQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBldnQsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICB4Lm9uYWJvcnQgPSBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBldnQsIG51bGwpO1xuICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkgeyB9O1xuICAgIH07XG5cbiAgICAvLyBHRVQgaXMgdGhlIG9ubHkgc3VwcG9ydGVkIEhUVFAgVmVyYiBieSBYRG9tYWluUmVxdWVzdCBhbmQgaXMgdGhlXG4gICAgLy8gb25seSBvbmUgc3VwcG9ydGVkIGhlcmUuXG4gICAgeC5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXG4gICAgLy8gU2VuZCB0aGUgcmVxdWVzdC4gU2VuZGluZyBkYXRhIGlzIG5vdCBzdXBwb3J0ZWQuXG4gICAgeC5zZW5kKG51bGwpO1xuICAgIHNlbnQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHg7XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSB4aHI7XG4iLCIvKiEgSlNPTiB2My4yLjYgfCBodHRwOi8vYmVzdGllanMuZ2l0aHViLmlvL2pzb24zIHwgQ29weXJpZ2h0IDIwMTItMjAxMywgS2l0IENhbWJyaWRnZSB8IGh0dHA6Ly9raXQubWl0LWxpY2Vuc2Uub3JnICovXG47KGZ1bmN0aW9uICh3aW5kb3cpIHtcbiAgLy8gQ29udmVuaWVuY2UgYWxpYXNlcy5cbiAgdmFyIGdldENsYXNzID0ge30udG9TdHJpbmcsIGlzUHJvcGVydHksIGZvckVhY2gsIHVuZGVmO1xuXG4gIC8vIERldGVjdCB0aGUgYGRlZmluZWAgZnVuY3Rpb24gZXhwb3NlZCBieSBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuIFRoZVxuICAvLyBzdHJpY3QgYGRlZmluZWAgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBjb21wYXRpYmlsaXR5IHdpdGggYHIuanNgLlxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcblxuICAvLyBEZXRlY3QgbmF0aXZlIGltcGxlbWVudGF0aW9ucy5cbiAgdmFyIG5hdGl2ZUpTT04gPSB0eXBlb2YgSlNPTiA9PSBcIm9iamVjdFwiICYmIEpTT047XG5cbiAgLy8gU2V0IHVwIHRoZSBKU09OIDMgbmFtZXNwYWNlLCBwcmVmZXJyaW5nIHRoZSBDb21tb25KUyBgZXhwb3J0c2Agb2JqZWN0IGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgdmFyIEpTT04zID0gdHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG5cbiAgaWYgKEpTT04zICYmIG5hdGl2ZUpTT04pIHtcbiAgICAvLyBFeHBsaWNpdGx5IGRlbGVnYXRlIHRvIHRoZSBuYXRpdmUgYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWBcbiAgICAvLyBpbXBsZW1lbnRhdGlvbnMgaW4gQ29tbW9uSlMgZW52aXJvbm1lbnRzLlxuICAgIEpTT04zLnN0cmluZ2lmeSA9IG5hdGl2ZUpTT04uc3RyaW5naWZ5O1xuICAgIEpTT04zLnBhcnNlID0gbmF0aXZlSlNPTi5wYXJzZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBFeHBvcnQgZm9yIHdlYiBicm93c2VycywgSmF2YVNjcmlwdCBlbmdpbmVzLCBhbmQgYXN5bmNocm9ub3VzIG1vZHVsZVxuICAgIC8vIGxvYWRlcnMsIHVzaW5nIHRoZSBnbG9iYWwgYEpTT05gIG9iamVjdCBpZiBhdmFpbGFibGUuXG4gICAgSlNPTjMgPSB3aW5kb3cuSlNPTiA9IG5hdGl2ZUpTT04gfHwge307XG4gIH1cblxuICAvLyBUZXN0IHRoZSBgRGF0ZSNnZXRVVEMqYCBtZXRob2RzLiBCYXNlZCBvbiB3b3JrIGJ5IEBZYWZmbGUuXG4gIHZhciBpc0V4dGVuZGVkID0gbmV3IERhdGUoLTM1MDk4MjczMzQ1NzMyOTIpO1xuICB0cnkge1xuICAgIC8vIFRoZSBgZ2V0VVRDRnVsbFllYXJgLCBgTW9udGhgLCBhbmQgYERhdGVgIG1ldGhvZHMgcmV0dXJuIG5vbnNlbnNpY2FsXG4gICAgLy8gcmVzdWx0cyBmb3IgY2VydGFpbiBkYXRlcyBpbiBPcGVyYSA+PSAxMC41My5cbiAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXG4gICAgICAvLyBTYWZhcmkgPCAyLjAuMiBzdG9yZXMgdGhlIGludGVybmFsIG1pbGxpc2Vjb25kIHRpbWUgdmFsdWUgY29ycmVjdGx5LFxuICAgICAgLy8gYnV0IGNsaXBzIHRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGRhdGUgbWV0aG9kcyB0byB0aGUgcmFuZ2Ugb2ZcbiAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cbiAgICAgIGlzRXh0ZW5kZWQuZ2V0VVRDSG91cnMoKSA9PSAxMCAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbnV0ZXMoKSA9PSAzNyAmJiBpc0V4dGVuZGVkLmdldFVUQ1NlY29uZHMoKSA9PSA2ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgPT0gNzA4O1xuICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG5cbiAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgd2hldGhlciB0aGUgbmF0aXZlIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBwYXJzZWBcbiAgLy8gaW1wbGVtZW50YXRpb25zIGFyZSBzcGVjLWNvbXBsaWFudC4gQmFzZWQgb24gd29yayBieSBLZW4gU255ZGVyLlxuICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgIGlmIChoYXNbbmFtZV0gIT09IHVuZGVmKSB7XG4gICAgICAvLyBSZXR1cm4gY2FjaGVkIGZlYXR1cmUgdGVzdCByZXN1bHQuXG4gICAgICByZXR1cm4gaGFzW25hbWVdO1xuICAgIH1cblxuICAgIHZhciBpc1N1cHBvcnRlZDtcbiAgICBpZiAobmFtZSA9PSBcImJ1Zy1zdHJpbmctY2hhci1pbmRleFwiKSB7XG4gICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXG4gICAgICAvLyBicmFja2V0IG5vdGF0aW9uLiBJRSA4IG9ubHkgc3VwcG9ydHMgdGhpcyBmb3IgcHJpbWl0aXZlcy5cbiAgICAgIGlzU3VwcG9ydGVkID0gXCJhXCJbMF0gIT0gXCJhXCI7XG4gICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XG4gICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciBib3RoIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBKU09OLnBhcnNlYCBhcmVcbiAgICAgIC8vIHN1cHBvcnRlZC5cbiAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHZhbHVlLCBzZXJpYWxpemVkID0gJ3tcImFcIjpbMSx0cnVlLGZhbHNlLG51bGwsXCJcXFxcdTAwMDBcXFxcYlxcXFxuXFxcXGZcXFxcclxcXFx0XCJdfSc7XG4gICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICBpZiAobmFtZSA9PSBcImpzb24tc3RyaW5naWZ5XCIpIHtcbiAgICAgICAgdmFyIHN0cmluZ2lmeSA9IEpTT04zLnN0cmluZ2lmeSwgc3RyaW5naWZ5U3VwcG9ydGVkID0gdHlwZW9mIHN0cmluZ2lmeSA9PSBcImZ1bmN0aW9uXCIgJiYgaXNFeHRlbmRlZDtcbiAgICAgICAgaWYgKHN0cmluZ2lmeVN1cHBvcnRlZCkge1xuICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXG4gICAgICAgICAgKHZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9XG4gICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cbiAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlcyBhcyBvYmplY3QgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeSgwKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XG4gICAgICAgICAgICAgIC8vIGxpdGVyYWxzLlxuICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IE51bWJlcigpKSA9PT0gXCIwXCIgJiZcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIGB1bmRlZmluZWRgLCBvclxuICAgICAgICAgICAgICAvLyBkb2VzIG5vdCBkZWZpbmUgYSBjYW5vbmljYWwgSlNPTiByZXByZXNlbnRhdGlvbiAodGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxuICAgICAgICAgICAgICAvLyB3aXRoaW4gYW4gb2JqZWN0IG9yIGFycmF5KS5cbiAgICAgICAgICAgICAgc3RyaW5naWZ5KGdldENsYXNzKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxuICAgICAgICAgICAgICAvLyBGRiAzLjFiMyBwYXNzIHRoaXMgdGVzdC5cbiAgICAgICAgICAgICAgc3RyaW5naWZ5KHVuZGVmKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxuICAgICAgICAgICAgICAvLyByZXNwZWN0aXZlbHksIGlmIHRoZSB2YWx1ZSBpcyBvbWl0dGVkIGVudGlyZWx5LlxuICAgICAgICAgICAgICBzdHJpbmdpZnkoKSA9PT0gdW5kZWYgJiZcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcbiAgICAgICAgICAgICAgLy8gc3RyaW5nLCBhcnJheSwgb2JqZWN0LCBCb29sZWFuLCBvciBgbnVsbGAgbGl0ZXJhbC4gVGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBjdXN0b20gYHRvSlNPTmAgbWV0aG9kcyBhcyB3ZWxsLCB1bmxlc3MgdGhleSBhcmUgbmVzdGVkXG4gICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXG4gICAgICAgICAgICAgIC8vIG1ldGhvZHMgZW50aXJlbHkuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeSh2YWx1ZSkgPT09IFwiMVwiICYmXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXG4gICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBzZXJpYWxpemVzIGBbdW5kZWZpbmVkXWAgYXMgYFwiW11cImAgaW5zdGVhZCBvZlxuICAgICAgICAgICAgICAvLyBgXCJbbnVsbF1cImAuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXG4gICAgICAgICAgICAgIC8vIFlVSSAzLjAuMGIxIGZhaWxzIHRvIHNlcmlhbGl6ZSBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShudWxsKSA9PSBcIm51bGxcIiAmJlxuICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XG4gICAgICAgICAgICAgIC8vIGBbMSwgdHJ1ZSwgZ2V0Q2xhc3MsIDFdYCBzZXJpYWxpemVzIGFzIFwiWzEsdHJ1ZSxdLFwiLiBGRiAzLjFiM1xuICAgICAgICAgICAgICAvLyBlbGlkZXMgbm9uLUpTT04gdmFsdWVzIGZyb20gb2JqZWN0cyBhbmQgYXJyYXlzLCB1bmxlc3MgdGhleVxuICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWYsIGdldENsYXNzLCBudWxsXSkgPT0gXCJbbnVsbCxudWxsLG51bGxdXCIgJiZcbiAgICAgICAgICAgICAgLy8gU2ltcGxlIHNlcmlhbGl6YXRpb24gdGVzdC4gRkYgMy4xYjEgdXNlcyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZXNcbiAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeSh7IFwiYVwiOiBbdmFsdWUsIHRydWUsIGZhbHNlLCBudWxsLCBcIlxceDAwXFxiXFxuXFxmXFxyXFx0XCJdIH0pID09IHNlcmlhbGl6ZWQgJiZcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEgYW5kIGIyIGlnbm9yZSB0aGUgYGZpbHRlcmAgYW5kIGB3aWR0aGAgYXJndW1lbnRzLlxuICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxuICAgICAgICAgICAgICBzdHJpbmdpZnkoWzEsIDJdLCBudWxsLCAxKSA9PSBcIltcXG4gMSxcXG4gMlxcbl1cIiAmJlxuICAgICAgICAgICAgICAvLyBKU09OIDIsIFByb3RvdHlwZSA8PSAxLjcsIGFuZCBvbGRlciBXZWJLaXQgYnVpbGRzIGluY29ycmVjdGx5XG4gICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC04LjY0ZTE1KSkgPT0gJ1wiLTI3MTgyMS0wNC0yMFQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgIC8vIFRoZSBtaWxsaXNlY29uZHMgYXJlIG9wdGlvbmFsIGluIEVTIDUsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgIC8vIEZpcmVmb3ggPD0gMTEuMCBpbmNvcnJlY3RseSBzZXJpYWxpemVzIHllYXJzIHByaW9yIHRvIDAgYXMgbmVnYXRpdmVcbiAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCB5ZWFycyBpbnN0ZWFkIG9mIHNpeC1kaWdpdCB5ZWFycy4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjUgYW5kIE9wZXJhID49IDEwLjUzIGluY29ycmVjdGx5IHNlcmlhbGl6ZSBtaWxsaXNlY29uZFxuICAgICAgICAgICAgICAvLyB2YWx1ZXMgbGVzcyB0aGFuIDEwMDAuIENyZWRpdHM6IEBZYWZmbGUuXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHN0cmluZ2lmeVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpc1N1cHBvcnRlZCA9IHN0cmluZ2lmeVN1cHBvcnRlZDtcbiAgICAgIH1cbiAgICAgIC8vIFRlc3QgYEpTT04ucGFyc2VgLlxuICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXBhcnNlXCIpIHtcbiAgICAgICAgdmFyIHBhcnNlID0gSlNPTjMucGFyc2U7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyc2UgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhIGJhcmUgbGl0ZXJhbCBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgIC8vIENvbmZvcm1pbmcgaW1wbGVtZW50YXRpb25zIHNob3VsZCBhbHNvIGNvZXJjZSB0aGUgaW5pdGlhbCBhcmd1bWVudCB0b1xuICAgICAgICAgICAgLy8gYSBzdHJpbmcgcHJpb3IgdG8gcGFyc2luZy5cbiAgICAgICAgICAgIGlmIChwYXJzZShcIjBcIikgPT09IDAgJiYgIXBhcnNlKGZhbHNlKSkge1xuICAgICAgICAgICAgICAvLyBTaW1wbGUgcGFyc2luZyB0ZXN0LlxuICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlKHNlcmlhbGl6ZWQpO1xuICAgICAgICAgICAgICB2YXIgcGFyc2VTdXBwb3J0ZWQgPSB2YWx1ZVtcImFcIl0ubGVuZ3RoID09IDUgJiYgdmFsdWVbXCJhXCJdWzBdID09PSAxO1xuICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS4yIGFuZCBGRiAzLjFiMSBhbGxvdyB1bmVzY2FwZWQgdGFicyBpbiBzdHJpbmdzLlxuICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSAhcGFyc2UoJ1wiXFx0XCInKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAgYW5kIDQuMC4xIGFsbG93IGxlYWRpbmcgYCtgIHNpZ25zIGFuZCBsZWFkaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgcG9pbnRzLiBGRiA0LjAsIDQuMC4xLCBhbmQgSUUgOS0xMCBhbHNvIGFsbG93XG4gICAgICAgICAgICAgICAgICAgIC8vIGNlcnRhaW4gb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIwMVwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAsIDQuMC4xLCBhbmQgUmhpbm8gMS43UjMtUjQgYWxsb3cgdHJhaWxpbmcgZGVjaW1hbFxuICAgICAgICAgICAgICAgICAgICAvLyBwb2ludHMuIFRoZXNlIGVudmlyb25tZW50cywgYWxvbmcgd2l0aCBGRiAzLjFiMSBhbmQgMixcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBhbGxvdyB0cmFpbGluZyBjb21tYXMgaW4gSlNPTiBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIxLlwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlzU3VwcG9ydGVkID0gcGFyc2VTdXBwb3J0ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoYXNbbmFtZV0gPSAhIWlzU3VwcG9ydGVkO1xuICB9XG5cbiAgaWYgKCFoYXMoXCJqc29uXCIpKSB7XG4gICAgLy8gQ29tbW9uIGBbW0NsYXNzXV1gIG5hbWUgYWxpYXNlcy5cbiAgICB2YXIgZnVuY3Rpb25DbGFzcyA9IFwiW29iamVjdCBGdW5jdGlvbl1cIjtcbiAgICB2YXIgZGF0ZUNsYXNzID0gXCJbb2JqZWN0IERhdGVdXCI7XG4gICAgdmFyIG51bWJlckNsYXNzID0gXCJbb2JqZWN0IE51bWJlcl1cIjtcbiAgICB2YXIgc3RyaW5nQ2xhc3MgPSBcIltvYmplY3QgU3RyaW5nXVwiO1xuICAgIHZhciBhcnJheUNsYXNzID0gXCJbb2JqZWN0IEFycmF5XVwiO1xuICAgIHZhciBib29sZWFuQ2xhc3MgPSBcIltvYmplY3QgQm9vbGVhbl1cIjtcblxuICAgIC8vIERldGVjdCBpbmNvbXBsZXRlIHN1cHBvcnQgZm9yIGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyBieSBpbmRleC5cbiAgICB2YXIgY2hhckluZGV4QnVnZ3kgPSBoYXMoXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIik7XG5cbiAgICAvLyBEZWZpbmUgYWRkaXRpb25hbCB1dGlsaXR5IG1ldGhvZHMgaWYgdGhlIGBEYXRlYCBtZXRob2RzIGFyZSBidWdneS5cbiAgICBpZiAoIWlzRXh0ZW5kZWQpIHtcbiAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAvLyBBIG1hcHBpbmcgYmV0d2VlbiB0aGUgbW9udGhzIG9mIHRoZSB5ZWFyIGFuZCB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlblxuICAgICAgLy8gSmFudWFyeSAxc3QgYW5kIHRoZSBmaXJzdCBvZiB0aGUgcmVzcGVjdGl2ZSBtb250aC5cbiAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xuICAgICAgLy8gSW50ZXJuYWw6IENhbGN1bGF0ZXMgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW4gdGhlIFVuaXggZXBvY2ggYW5kIHRoZVxuICAgICAgLy8gZmlyc3QgZGF5IG9mIHRoZSBnaXZlbiBtb250aC5cbiAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcbiAgICAgICAgcmV0dXJuIE1vbnRoc1ttb250aF0gKyAzNjUgKiAoeWVhciAtIDE5NzApICsgZmxvb3IoKHllYXIgLSAxOTY5ICsgKG1vbnRoID0gKyhtb250aCA+IDEpKSkgLyA0KSAtIGZsb29yKCh5ZWFyIC0gMTkwMSArIG1vbnRoKSAvIDEwMCkgKyBmbG9vcigoeWVhciAtIDE2MDEgKyBtb250aCkgLyA0MDApO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiBhIHByb3BlcnR5IGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIHRoZSBnaXZlblxuICAgIC8vIG9iamVjdC4gRGVsZWdhdGVzIHRvIHRoZSBuYXRpdmUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgbWV0aG9kLlxuICAgIGlmICghKGlzUHJvcGVydHkgPSB7fS5oYXNPd25Qcm9wZXJ0eSkpIHtcbiAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgY29uc3RydWN0b3I7XG4gICAgICAgIGlmICgobWVtYmVycy5fX3Byb3RvX18gPSBudWxsLCBtZW1iZXJzLl9fcHJvdG9fXyA9IHtcbiAgICAgICAgICAvLyBUaGUgKnByb3RvKiBwcm9wZXJ0eSBjYW5ub3QgYmUgc2V0IG11bHRpcGxlIHRpbWVzIGluIHJlY2VudFxuICAgICAgICAgIC8vIHZlcnNpb25zIG9mIEZpcmVmb3ggYW5kIFNlYU1vbmtleS5cbiAgICAgICAgICBcInRvU3RyaW5nXCI6IDFcbiAgICAgICAgfSwgbWVtYmVycykudG9TdHJpbmcgIT0gZ2V0Q2xhc3MpIHtcbiAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjMgZG9lc24ndCBpbXBsZW1lbnQgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAsIGJ1dFxuICAgICAgICAgIC8vIHN1cHBvcnRzIHRoZSBtdXRhYmxlICpwcm90byogcHJvcGVydHkuXG4gICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhbmQgYnJlYWsgdGhlIG9iamVjdCdzIHByb3RvdHlwZSBjaGFpbiAoc2VlIHNlY3Rpb24gOC42LjJcbiAgICAgICAgICAgIC8vIG9mIHRoZSBFUyA1LjEgc3BlYykuIFRoZSBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb24gcHJldmVudHMgYW5cbiAgICAgICAgICAgIC8vIHVuc2FmZSB0cmFuc2Zvcm1hdGlvbiBieSB0aGUgQ2xvc3VyZSBDb21waWxlci5cbiAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuX19wcm90b19fLCByZXN1bHQgPSBwcm9wZXJ0eSBpbiAodGhpcy5fX3Byb3RvX18gPSBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICAgIHRoaXMuX19wcm90b19fID0gb3JpZ2luYWw7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2FwdHVyZSBhIHJlZmVyZW5jZSB0byB0aGUgdG9wLWxldmVsIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgICAgICAgIGNvbnN0cnVjdG9yID0gbWVtYmVycy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAvLyBVc2UgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgdG8gc2ltdWxhdGUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW5cbiAgICAgICAgICAvLyBvdGhlciBlbnZpcm9ubWVudHMuXG4gICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9ICh0aGlzLmNvbnN0cnVjdG9yIHx8IGNvbnN0cnVjdG9yKS5wcm90b3R5cGU7XG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiAhKHByb3BlcnR5IGluIHBhcmVudCAmJiB0aGlzW3Byb3BlcnR5XSA9PT0gcGFyZW50W3Byb3BlcnR5XSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBtZW1iZXJzID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGlzUHJvcGVydHkuY2FsbCh0aGlzLCBwcm9wZXJ0eSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIEludGVybmFsOiBBIHNldCBvZiBwcmltaXRpdmUgdHlwZXMgdXNlZCBieSBgaXNIb3N0VHlwZWAuXG4gICAgdmFyIFByaW1pdGl2ZVR5cGVzID0ge1xuICAgICAgJ2Jvb2xlYW4nOiAxLFxuICAgICAgJ251bWJlcic6IDEsXG4gICAgICAnc3RyaW5nJzogMSxcbiAgICAgICd1bmRlZmluZWQnOiAxXG4gICAgfTtcblxuICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBvYmplY3QgYHByb3BlcnR5YCB2YWx1ZSBpcyBhXG4gICAgLy8gbm9uLXByaW1pdGl2ZS5cbiAgICB2YXIgaXNIb3N0VHlwZSA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmplY3RbcHJvcGVydHldO1xuICAgICAgcmV0dXJuIHR5cGUgPT0gJ29iamVjdCcgPyAhIW9iamVjdFtwcm9wZXJ0eV0gOiAhUHJpbWl0aXZlVHlwZXNbdHlwZV07XG4gICAgfTtcblxuICAgIC8vIEludGVybmFsOiBOb3JtYWxpemVzIHRoZSBgZm9yLi4uaW5gIGl0ZXJhdGlvbiBhbGdvcml0aG0gYWNyb3NzXG4gICAgLy8gZW52aXJvbm1lbnRzLiBFYWNoIGVudW1lcmF0ZWQga2V5IGlzIHlpZWxkZWQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLlxuICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgdmFyIHNpemUgPSAwLCBQcm9wZXJ0aWVzLCBtZW1iZXJzLCBwcm9wZXJ0eTtcblxuICAgICAgLy8gVGVzdHMgZm9yIGJ1Z3MgaW4gdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQncyBgZm9yLi4uaW5gIGFsZ29yaXRobS4gVGhlXG4gICAgICAvLyBgdmFsdWVPZmAgcHJvcGVydHkgaW5oZXJpdHMgdGhlIG5vbi1lbnVtZXJhYmxlIGZsYWcgZnJvbVxuICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXG4gICAgICAoUHJvcGVydGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy52YWx1ZU9mID0gMDtcbiAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcblxuICAgICAgLy8gSXRlcmF0ZSBvdmVyIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgUHJvcGVydGllc2AgY2xhc3MuXG4gICAgICBtZW1iZXJzID0gbmV3IFByb3BlcnRpZXMoKTtcbiAgICAgIGZvciAocHJvcGVydHkgaW4gbWVtYmVycykge1xuICAgICAgICAvLyBJZ25vcmUgYWxsIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICBpZiAoaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSkge1xuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgUHJvcGVydGllcyA9IG1lbWJlcnMgPSBudWxsO1xuXG4gICAgICAvLyBOb3JtYWxpemUgdGhlIGl0ZXJhdGlvbiBhbGdvcml0aG0uXG4gICAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgLy8gQSBsaXN0IG9mIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICBtZW1iZXJzID0gW1widmFsdWVPZlwiLCBcInRvU3RyaW5nXCIsIFwidG9Mb2NhbGVTdHJpbmdcIiwgXCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLCBcImlzUHJvdG90eXBlT2ZcIiwgXCJoYXNPd25Qcm9wZXJ0eVwiLCBcImNvbnN0cnVjdG9yXCJdO1xuICAgICAgICAvLyBJRSA8PSA4LCBNb3ppbGxhIDEuMCwgYW5kIE5ldHNjYXBlIDYuMiBpZ25vcmUgc2hhZG93ZWQgbm9uLWVudW1lcmFibGVcbiAgICAgICAgLy8gcHJvcGVydGllcy5cbiAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGxlbmd0aDtcbiAgICAgICAgICB2YXIgaGFzUHJvcGVydHkgPSAhaXNGdW5jdGlvbiAmJiB0eXBlb2Ygb2JqZWN0LmNvbnN0cnVjdG9yICE9ICdmdW5jdGlvbicgJiYgaXNIb3N0VHlwZShvYmplY3QsICdoYXNPd25Qcm9wZXJ0eScpID8gb2JqZWN0Lmhhc093blByb3BlcnR5IDogaXNQcm9wZXJ0eTtcbiAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgLy8gR2Vja28gPD0gMS4wIGVudW1lcmF0ZXMgdGhlIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyB1bmRlclxuICAgICAgICAgICAgLy8gY2VydGFpbiBjb25kaXRpb25zOyBJRSBkb2VzIG5vdC5cbiAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE1hbnVhbGx5IGludm9rZSB0aGUgY2FsbGJhY2sgZm9yIGVhY2ggbm9uLWVudW1lcmFibGUgcHJvcGVydHkuXG4gICAgICAgICAgZm9yIChsZW5ndGggPSBtZW1iZXJzLmxlbmd0aDsgcHJvcGVydHkgPSBtZW1iZXJzWy0tbGVuZ3RoXTsgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiBjYWxsYmFjayhwcm9wZXJ0eSkpO1xuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmIChzaXplID09IDIpIHtcbiAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC40IGVudW1lcmF0ZXMgc2hhZG93ZWQgcHJvcGVydGllcyB0d2ljZS5cbiAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgc2V0IG9mIGl0ZXJhdGVkIHByb3BlcnRpZXMuXG4gICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eTtcbiAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgLy8gU3RvcmUgZWFjaCBwcm9wZXJ0eSBuYW1lIHRvIHByZXZlbnQgZG91YmxlIGVudW1lcmF0aW9uLiBUaGVcbiAgICAgICAgICAgIC8vIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBpcyBub3QgZW51bWVyYXRlZCBkdWUgdG8gY3Jvc3MtXG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmICFpc1Byb3BlcnR5LmNhbGwobWVtYmVycywgcHJvcGVydHkpICYmIChtZW1iZXJzW3Byb3BlcnR5XSA9IDEpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTm8gYnVncyBkZXRlY3RlZDsgdXNlIHRoZSBzdGFuZGFyZCBgZm9yLi4uaW5gIGFsZ29yaXRobS5cbiAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGlzQ29uc3RydWN0b3I7XG4gICAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmICEoaXNDb25zdHJ1Y3RvciA9IHByb3BlcnR5ID09PSBcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgZHVlIHRvXG4gICAgICAgICAgLy8gY3Jvc3MtZW52aXJvbm1lbnQgaW5jb25zaXN0ZW5jaWVzLlxuICAgICAgICAgIGlmIChpc0NvbnN0cnVjdG9yIHx8IGlzUHJvcGVydHkuY2FsbChvYmplY3QsIChwcm9wZXJ0eSA9IFwiY29uc3RydWN0b3JcIikpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIC8vIFB1YmxpYzogU2VyaWFsaXplcyBhIEphdmFTY3JpcHQgYHZhbHVlYCBhcyBhIEpTT04gc3RyaW5nLiBUaGUgb3B0aW9uYWxcbiAgICAvLyBgZmlsdGVyYCBhcmd1bWVudCBtYXkgc3BlY2lmeSBlaXRoZXIgYSBmdW5jdGlvbiB0aGF0IGFsdGVycyBob3cgb2JqZWN0IGFuZFxuICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxuICAgIC8vIGluZGljYXRlcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgb3B0aW9uYWwgYHdpZHRoYFxuICAgIC8vIGFyZ3VtZW50IG1heSBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgbnVtYmVyIHRoYXQgc3BlY2lmaWVzIHRoZSBpbmRlbnRhdGlvblxuICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXG4gICAgaWYgKCFoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSkge1xuICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy5cbiAgICAgIHZhciBFc2NhcGVzID0ge1xuICAgICAgICA5MjogXCJcXFxcXFxcXFwiLFxuICAgICAgICAzNDogJ1xcXFxcIicsXG4gICAgICAgIDg6IFwiXFxcXGJcIixcbiAgICAgICAgMTI6IFwiXFxcXGZcIixcbiAgICAgICAgMTA6IFwiXFxcXG5cIixcbiAgICAgICAgMTM6IFwiXFxcXHJcIixcbiAgICAgICAgOTogXCJcXFxcdFwiXG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogQ29udmVydHMgYHZhbHVlYCBpbnRvIGEgemVyby1wYWRkZWQgc3RyaW5nIHN1Y2ggdGhhdCBpdHNcbiAgICAgIC8vIGxlbmd0aCBpcyBhdCBsZWFzdCBlcXVhbCB0byBgd2lkdGhgLiBUaGUgYHdpZHRoYCBtdXN0IGJlIDw9IDYuXG4gICAgICB2YXIgbGVhZGluZ1plcm9lcyA9IFwiMDAwMDAwXCI7XG4gICAgICB2YXIgdG9QYWRkZWRTdHJpbmcgPSBmdW5jdGlvbiAod2lkdGgsIHZhbHVlKSB7XG4gICAgICAgIC8vIFRoZSBgfHwgMGAgZXhwcmVzc2lvbiBpcyBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBidWcgaW5cbiAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIHdoZXJlIGAwID09IC0wYCwgYnV0IGBTdHJpbmcoLTApICE9PSBcIjBcImAuXG4gICAgICAgIHJldHVybiAobGVhZGluZ1plcm9lcyArICh2YWx1ZSB8fCAwKSkuc2xpY2UoLXdpZHRoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBEb3VibGUtcXVvdGVzIGEgc3RyaW5nIGB2YWx1ZWAsIHJlcGxhY2luZyBhbGwgQVNDSUkgY29udHJvbFxuICAgICAgLy8gY2hhcmFjdGVycyAoY2hhcmFjdGVycyB3aXRoIGNvZGUgdW5pdCB2YWx1ZXMgYmV0d2VlbiAwIGFuZCAzMSkgd2l0aFxuICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgIC8vIGBRdW90ZSh2YWx1ZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICB2YXIgdW5pY29kZVByZWZpeCA9IFwiXFxcXHUwMFwiO1xuICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSAnXCInLCBpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aCwgaXNMYXJnZSA9IGxlbmd0aCA+IDEwICYmIGNoYXJJbmRleEJ1Z2d5LCBzeW1ib2xzO1xuICAgICAgICBpZiAoaXNMYXJnZSkge1xuICAgICAgICAgIHN5bWJvbHMgPSB2YWx1ZS5zcGxpdChcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICB2YXIgY2hhckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICAvLyBJZiB0aGUgY2hhcmFjdGVyIGlzIGEgY29udHJvbCBjaGFyYWN0ZXIsIGFwcGVuZCBpdHMgVW5pY29kZSBvclxuICAgICAgICAgIC8vIHNob3J0aGFuZCBlc2NhcGUgc2VxdWVuY2U7IG90aGVyd2lzZSwgYXBwZW5kIHRoZSBjaGFyYWN0ZXIgYXMtaXMuXG4gICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgY2FzZSA4OiBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTI6IGNhc2UgMTM6IGNhc2UgMzQ6IGNhc2UgOTI6XG4gICAgICAgICAgICAgIHJlc3VsdCArPSBFc2NhcGVzW2NoYXJDb2RlXTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1bmljb2RlUHJlZml4ICsgdG9QYWRkZWRTdHJpbmcoMiwgY2hhckNvZGUudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQgKz0gaXNMYXJnZSA/IHN5bWJvbHNbaW5kZXhdIDogY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoaW5kZXgpIDogdmFsdWVbaW5kZXhdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0ICsgJ1wiJztcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcbiAgICAgIC8vIGBTdHIoa2V5LCBob2xkZXIpYCwgYEpPKHZhbHVlKWAsIGFuZCBgSkEodmFsdWUpYCBvcGVyYXRpb25zLlxuICAgICAgdmFyIHNlcmlhbGl6ZSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSwgb2JqZWN0LCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKSB7XG4gICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gTmVjZXNzYXJ5IGZvciBob3N0IG9iamVjdCBzdXBwb3J0LlxuICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcbiAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcbiAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGRhdGVDbGFzcyAmJiAhaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDApIHtcbiAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxuICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuOS41LjQ0LiBTZWUgc2VjdGlvbiAxNS45LjEuMTVcbiAgICAgICAgICAgICAgLy8gZm9yIHRoZSBJU08gODYwMSBkYXRlIHRpbWUgc3RyaW5nIGZvcm1hdC5cbiAgICAgICAgICAgICAgaWYgKGdldERheSkge1xuICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNvbXB1dGUgdGhlIHllYXIsIG1vbnRoLCBkYXRlLCBob3VycywgbWludXRlcyxcbiAgICAgICAgICAgICAgICAvLyBzZWNvbmRzLCBhbmQgbWlsbGlzZWNvbmRzIGlmIHRoZSBgZ2V0VVRDKmAgbWV0aG9kcyBhcmVcbiAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxuICAgICAgICAgICAgICAgIGRhdGUgPSBmbG9vcih2YWx1ZSAvIDg2NGU1KTtcbiAgICAgICAgICAgICAgICBmb3IgKHllYXIgPSBmbG9vcihkYXRlIC8gMzY1LjI0MjUpICsgMTk3MCAtIDE7IGdldERheSh5ZWFyICsgMSwgMCkgPD0gZGF0ZTsgeWVhcisrKTtcbiAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcbiAgICAgICAgICAgICAgICBkYXRlID0gMSArIGRhdGUgLSBnZXREYXkoeWVhciwgbW9udGgpO1xuICAgICAgICAgICAgICAgIC8vIFRoZSBgdGltZWAgdmFsdWUgc3BlY2lmaWVzIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5IChzZWUgRVNcbiAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcbiAgICAgICAgICAgICAgICAvLyB0byBjb21wdXRlIGBBIG1vZHVsbyBCYCwgYXMgdGhlIGAlYCBvcGVyYXRvciBkb2VzIG5vdFxuICAgICAgICAgICAgICAgIC8vIGNvcnJlc3BvbmQgdG8gdGhlIGBtb2R1bG9gIG9wZXJhdGlvbiBmb3IgbmVnYXRpdmUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcbiAgICAgICAgICAgICAgICAvLyBUaGUgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgYXJlIG9idGFpbmVkIGJ5XG4gICAgICAgICAgICAgICAgLy8gZGVjb21wb3NpbmcgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkuIFNlZSBzZWN0aW9uIDE1LjkuMS4xMC5cbiAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBmbG9vcih0aW1lIC8gNmU0KSAlIDYwO1xuICAgICAgICAgICAgICAgIHNlY29uZHMgPSBmbG9vcih0aW1lIC8gMWUzKSAlIDYwO1xuICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeWVhciA9IHZhbHVlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgICAgIGRhdGUgPSB2YWx1ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgICAgICAgICAgaG91cnMgPSB2YWx1ZS5nZXRVVENIb3VycygpO1xuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XG4gICAgICAgICAgICAgICAgc2Vjb25kcyA9IHZhbHVlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB2YWx1ZS5nZXRVVENNaWxsaXNlY29uZHMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBTZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMgY29ycmVjdGx5LlxuICAgICAgICAgICAgICB2YWx1ZSA9ICh5ZWFyIDw9IDAgfHwgeWVhciA+PSAxZTQgPyAoeWVhciA8IDAgPyBcIi1cIiA6IFwiK1wiKSArIHRvUGFkZGVkU3RyaW5nKDYsIHllYXIgPCAwID8gLXllYXIgOiB5ZWFyKSA6IHRvUGFkZGVkU3RyaW5nKDQsIHllYXIpKSArXG4gICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXG4gICAgICAgICAgICAgICAgLy8gTW9udGhzLCBkYXRlcywgaG91cnMsIG1pbnV0ZXMsIGFuZCBzZWNvbmRzIHNob3VsZCBoYXZlIHR3b1xuICAgICAgICAgICAgICAgIC8vIGRpZ2l0czsgbWlsbGlzZWNvbmRzIHNob3VsZCBoYXZlIHRocmVlLlxuICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xuICAgICAgICAgICAgICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNS4wLCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgIFwiLlwiICsgdG9QYWRkZWRTdHJpbmcoMywgbWlsbGlzZWNvbmRzKSArIFwiWlwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xuICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIGFkZHMgbm9uLXN0YW5kYXJkIGB0b0pTT05gIG1ldGhvZHMgdG8gdGhlXG4gICAgICAgICAgICAvLyBgTnVtYmVyYCwgYFN0cmluZ2AsIGBEYXRlYCwgYW5kIGBBcnJheWAgcHJvdG90eXBlcy4gSlNPTiAzXG4gICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXG4gICAgICAgICAgICAvLyBkZWZpbmVkIGRpcmVjdGx5IG9uIGFuIGluc3RhbmNlLlxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b0pTT04ocHJvcGVydHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXG4gICAgICAgICAgLy8gZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9iamVjdCwgcHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gXCJudWxsXCI7XG4gICAgICAgIH1cbiAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgIGlmIChjbGFzc05hbWUgPT0gYm9vbGVhbkNsYXNzKSB7XG4gICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cbiAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBudW1iZXJDbGFzcykge1xuICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcbiAgICAgICAgICAvLyBgXCJudWxsXCJgLlxuICAgICAgICAgIHJldHVybiB2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwID8gXCJcIiArIHZhbHVlIDogXCJudWxsXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XG4gICAgICAgICAgLy8gU3RyaW5ncyBhcmUgZG91YmxlLXF1b3RlZCBhbmQgZXNjYXBlZC5cbiAgICAgICAgICByZXR1cm4gcXVvdGUoXCJcIiArIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxuICAgICAgICAgIC8vIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZiB1bmlxdWUgbmVzdGVkIG9iamVjdHMuXG4gICAgICAgICAgZm9yIChsZW5ndGggPSBzdGFjay5sZW5ndGg7IGxlbmd0aC0tOykge1xuICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgIC8vIEN5Y2xpYyBzdHJ1Y3R1cmVzIGNhbm5vdCBiZSBzZXJpYWxpemVkIGJ5IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBBZGQgdGhlIG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgaW5kZW50YXRpb24gbGV2ZWwgYW5kIGluZGVudCBvbmUgYWRkaXRpb25hbCBsZXZlbC5cbiAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcbiAgICAgICAgICBpbmRlbnRhdGlvbiArPSB3aGl0ZXNwYWNlO1xuICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxuICAgICAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgZWxlbWVudCA9IHNlcmlhbGl6ZShpbmRleCwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCA9PT0gdW5kZWYgPyBcIm51bGxcIiA6IGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0cy5sZW5ndGggPyAod2hpdGVzcGFjZSA/IFwiW1xcblwiICsgaW5kZW50YXRpb24gKyByZXN1bHRzLmpvaW4oXCIsXFxuXCIgKyBpbmRlbnRhdGlvbikgKyBcIlxcblwiICsgcHJlZml4ICsgXCJdXCIgOiAoXCJbXCIgKyByZXN1bHRzLmpvaW4oXCIsXCIpICsgXCJdXCIpKSA6IFwiW11cIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdCBtZW1iZXJzLiBNZW1iZXJzIGFyZSBzZWxlY3RlZCBmcm9tXG4gICAgICAgICAgICAvLyBlaXRoZXIgYSB1c2VyLXNwZWNpZmllZCBsaXN0IG9mIHByb3BlcnR5IG5hbWVzLCBvciB0aGUgb2JqZWN0XG4gICAgICAgICAgICAvLyBpdHNlbGYuXG4gICAgICAgICAgICBmb3JFYWNoKHByb3BlcnRpZXMgfHwgdmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICB2YXIgZWxlbWVudCA9IHNlcmlhbGl6ZShwcm9wZXJ0eSwgdmFsdWUsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spO1xuICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICAvLyBBY2NvcmRpbmcgdG8gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMzogXCJJZiBgZ2FwYCB7d2hpdGVzcGFjZX1cbiAgICAgICAgICAgICAgICAvLyBpcyBub3QgdGhlIGVtcHR5IHN0cmluZywgbGV0IGBtZW1iZXJgIHtxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIn1cbiAgICAgICAgICAgICAgICAvLyBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiBgbWVtYmVyYCBhbmQgdGhlIGBzcGFjZWAgY2hhcmFjdGVyLlwiXG4gICAgICAgICAgICAgICAgLy8gVGhlIFwiYHNwYWNlYCBjaGFyYWN0ZXJcIiByZWZlcnMgdG8gdGhlIGxpdGVyYWwgc3BhY2VcbiAgICAgICAgICAgICAgICAvLyBjaGFyYWN0ZXIsIG5vdCB0aGUgYHNwYWNlYCB7d2lkdGh9IGFyZ3VtZW50IHByb3ZpZGVkIHRvXG4gICAgICAgICAgICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocXVvdGUocHJvcGVydHkpICsgXCI6XCIgKyAod2hpdGVzcGFjZSA/IFwiIFwiIDogXCJcIikgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6IChcIntcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIn1cIikpIDogXCJ7fVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxuICAgICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIFB1YmxpYzogYEpTT04uc3RyaW5naWZ5YC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXG4gICAgICBKU09OMy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoc291cmNlLCBmaWx0ZXIsIHdpZHRoKSB7XG4gICAgICAgIHZhciB3aGl0ZXNwYWNlLCBjYWxsYmFjaywgcHJvcGVydGllcywgY2xhc3NOYW1lO1xuICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGZpbHRlciA9PSBcIm9iamVjdFwiICYmIGZpbHRlcikge1xuICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbChmaWx0ZXIpKSA9PSBmdW5jdGlvbkNsYXNzKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGZpbHRlcjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwcm9wZXJ0eSBuYW1lcyBhcnJheSBpbnRvIGEgbWFrZXNoaWZ0IHNldC5cbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpZHRoKSB7XG4gICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHdpZHRoKSkgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGB3aWR0aGAgdG8gYW4gaW50ZWdlciBhbmQgY3JlYXRlIGEgc3RyaW5nIGNvbnRhaW5pbmdcbiAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICBpZiAoKHdpZHRoIC09IHdpZHRoICUgMSkgPiAwKSB7XG4gICAgICAgICAgICAgIGZvciAod2hpdGVzcGFjZSA9IFwiXCIsIHdpZHRoID4gMTAgJiYgKHdpZHRoID0gMTApOyB3aGl0ZXNwYWNlLmxlbmd0aCA8IHdpZHRoOyB3aGl0ZXNwYWNlICs9IFwiIFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgd2hpdGVzcGFjZSA9IHdpZHRoLmxlbmd0aCA8PSAxMCA/IHdpZHRoIDogd2lkdGguc2xpY2UoMCwgMTApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgZGlzY2FyZHMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggZW1wdHkgc3RyaW5nIGtleXNcbiAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcbiAgICAgICAgLy8gKGUuZy4sIGAhKFwiXCIgaW4geyBcIlwiOiAxfSlgKS5cbiAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZShcIlwiLCAodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSBzb3VyY2UsIHZhbHVlKSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIFwiXCIsIFtdKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXG4gICAgaWYgKCFoYXMoXCJqc29uLXBhcnNlXCIpKSB7XG4gICAgICB2YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcblxuICAgICAgLy8gSW50ZXJuYWw6IEEgbWFwIG9mIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciB1bmVzY2FwZWRcbiAgICAgIC8vIGVxdWl2YWxlbnRzLlxuICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcbiAgICAgICAgOTI6IFwiXFxcXFwiLFxuICAgICAgICAzNDogJ1wiJyxcbiAgICAgICAgNDc6IFwiL1wiLFxuICAgICAgICA5ODogXCJcXGJcIixcbiAgICAgICAgMTE2OiBcIlxcdFwiLFxuICAgICAgICAxMTA6IFwiXFxuXCIsXG4gICAgICAgIDEwMjogXCJcXGZcIixcbiAgICAgICAgMTE0OiBcIlxcclwiXG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogU3RvcmVzIHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICB2YXIgSW5kZXgsIFNvdXJjZTtcblxuICAgICAgLy8gSW50ZXJuYWw6IFJlc2V0cyB0aGUgcGFyc2VyIHN0YXRlIGFuZCB0aHJvd3MgYSBgU3ludGF4RXJyb3JgLlxuICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgdGhyb3cgU3ludGF4RXJyb3IoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBSZXR1cm5zIHRoZSBuZXh0IHRva2VuLCBvciBgXCIkXCJgIGlmIHRoZSBwYXJzZXIgaGFzIHJlYWNoZWRcbiAgICAgIC8vIHRoZSBlbmQgb2YgdGhlIHNvdXJjZSBzdHJpbmcuIEEgdG9rZW4gbWF5IGJlIGEgc3RyaW5nLCBudW1iZXIsIGBudWxsYFxuICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxuICAgICAgdmFyIGxleCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IFNvdXJjZSwgbGVuZ3RoID0gc291cmNlLmxlbmd0aCwgdmFsdWUsIGJlZ2luLCBwb3NpdGlvbiwgaXNTaWduZWQsIGNoYXJDb2RlO1xuICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XG4gICAgICAgICAgICAgIC8vIFNraXAgd2hpdGVzcGFjZSB0b2tlbnMsIGluY2x1ZGluZyB0YWJzLCBjYXJyaWFnZSByZXR1cm5zLCBsaW5lXG4gICAgICAgICAgICAgIC8vIGZlZWRzLCBhbmQgc3BhY2UgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDEyMzogY2FzZSAxMjU6IGNhc2UgOTE6IGNhc2UgOTM6IGNhc2UgNTg6IGNhc2UgNDQ6XG4gICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcbiAgICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAgICAgICAgICAgIHZhbHVlID0gY2hhckluZGV4QnVnZ3kgPyBzb3VyY2UuY2hhckF0KEluZGV4KSA6IHNvdXJjZVtJbmRleF07XG4gICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgMzQ6XG4gICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXG4gICAgICAgICAgICAgIC8vIGJlZ2luIHBhcnNpbmcgdGhlIHN0cmluZy4gU3RyaW5nIHRva2VucyBhcmUgcHJlZml4ZWQgd2l0aCB0aGVcbiAgICAgICAgICAgICAgLy8gc2VudGluZWwgYEBgIGNoYXJhY3RlciB0byBkaXN0aW5ndWlzaCB0aGVtIGZyb20gcHVuY3R1YXRvcnMgYW5kXG4gICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICBmb3IgKHZhbHVlID0gXCJAXCIsIEluZGV4Kys7IEluZGV4IDwgbGVuZ3RoOykge1xuICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICAvLyBVbmVzY2FwZWQgQVNDSUkgY29udHJvbCBjaGFyYWN0ZXJzICh0aG9zZSB3aXRoIGEgY29kZSB1bml0XG4gICAgICAgICAgICAgICAgICAvLyBsZXNzIHRoYW4gdGhlIHNwYWNlIGNoYXJhY3RlcikgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hhckNvZGUgPT0gOTIpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEEgcmV2ZXJzZSBzb2xpZHVzIChgXFxgKSBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGFuIGVzY2FwZWRcbiAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxuICAgICAgICAgICAgICAgICAgLy8gZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA5MjogY2FzZSAzNDogY2FzZSA0NzogY2FzZSA5ODogY2FzZSAxMTY6IGNhc2UgMTEwOiBjYXNlIDEwMjogY2FzZSAxMTQ6XG4gICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XG4gICAgICAgICAgICAgICAgICAgICAgLy8gYFxcdWAgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgdmFsaWRhdGUgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgIGJlZ2luID0gKytJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXggKyA0OyBJbmRleCA8IHBvc2l0aW9uOyBJbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEgdmFsaWQgc2VxdWVuY2UgY29tcHJpc2VzIGZvdXIgaGV4ZGlnaXRzIChjYXNlLVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zZW5zaXRpdmUpIHRoYXQgZm9ybSBhIHNpbmdsZSBoZXhhZGVjaW1hbCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBbiB1bmVzY2FwZWQgZG91YmxlLXF1b3RlIGNoYXJhY3RlciBtYXJrcyB0aGUgZW5kIG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgZm9yIHRoZSBjb21tb24gY2FzZSB3aGVyZSBhIHN0cmluZyBpcyB2YWxpZC5cbiAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXG4gICAgICAgICAgICAgICAgICB2YWx1ZSArPSBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSAzNCkge1xuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZCByZXR1cm4gdGhlIHJldml2ZWQgc3RyaW5nLlxuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXG4gICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcbiAgICAgICAgICAgICAgLy8gQWR2YW5jZSBwYXN0IHRoZSBuZWdhdGl2ZSBzaWduLCBpZiBvbmUgaXMgc3BlY2lmaWVkLlxuICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBQYXJzZSBhbiBpbnRlZ2VyIG9yIGZsb2F0aW5nLXBvaW50IHZhbHVlLlxuICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpIHtcbiAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQ4ICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCArIDEpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpKSB7XG4gICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIG9jdGFsIGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICBmb3IgKDsgSW5kZXggPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgSW5kZXgrKyk7XG4gICAgICAgICAgICAgICAgLy8gRmxvYXRzIGNhbm5vdCBjb250YWluIGEgbGVhZGluZyBkZWNpbWFsIHBvaW50OyBob3dldmVyLCB0aGlzXG4gICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDQ2KSB7XG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICsrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICBmb3IgKDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgZXhwb25lbnRzLiBUaGUgYGVgIGRlbm90aW5nIHRoZSBleHBvbmVudCBpc1xuICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXG4gICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDEwMSB8fCBjaGFyQ29kZSA9PSA2OSkge1xuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgIC8vIFNraXAgcGFzdCB0aGUgc2lnbiBmb2xsb3dpbmcgdGhlIGV4cG9uZW50LCBpZiBvbmUgaXNcbiAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgIGZvciAocG9zaXRpb24gPSBJbmRleDsgcG9zaXRpb24gPCBsZW5ndGggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KHBvc2l0aW9uKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KTsgcG9zaXRpb24rKyk7XG4gICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIENvZXJjZSB0aGUgcGFyc2VkIHZhbHVlIHRvIGEgSmF2YVNjcmlwdCBudW1iZXIuXG4gICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBBIG5lZ2F0aXZlIHNpZ24gbWF5IG9ubHkgcHJlY2VkZSBudW1iZXJzLlxuICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcInRydWVcIikge1xuICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDUpID09IFwiZmFsc2VcIikge1xuICAgICAgICAgICAgICAgIEluZGV4ICs9IDU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA0KSA9PSBcIm51bGxcIikge1xuICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIHRva2VuLlxuICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgIC8vIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLlxuICAgICAgICByZXR1cm4gXCIkXCI7XG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxuICAgICAgdmFyIGdldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgcmVzdWx0cywgaGFzTWVtYmVycztcbiAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XG4gICAgICAgICAgLy8gVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQuXG4gICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBpZiAoKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pID09IFwiQFwiKSB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuc2xpY2UoMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXG4gICAgICAgICAgaWYgKHZhbHVlID09IFwiW1wiKSB7XG4gICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIGFycmF5LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBhcnJheS5cbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBJZiB0aGUgYXJyYXkgbGl0ZXJhbCBjb250YWlucyBlbGVtZW50cywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdGluZyB0aGUgcHJldmlvdXMgZWxlbWVudCBmcm9tIHRoZVxuICAgICAgICAgICAgICAvLyBuZXh0LlxuICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIEVsaXNpb25zIGFuZCBsZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZC5cbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0KHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwie1wiKSB7XG4gICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxuICAgICAgICAgICAgcmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIGN1cmx5IGJyYWNlIG1hcmtzIHRoZSBlbmQgb2YgdGhlIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGxpdGVyYWwgY29udGFpbnMgbWVtYmVycywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxuICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBMZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZCwgb2JqZWN0IHByb3BlcnR5IG5hbWVzIG11c3QgYmVcbiAgICAgICAgICAgICAgLy8gZG91YmxlLXF1b3RlZCBzdHJpbmdzLCBhbmQgYSBgOmAgbXVzdCBzZXBhcmF0ZSBlYWNoIHByb3BlcnR5XG4gICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxuICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIgfHwgdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgfHwgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pICE9IFwiQFwiIHx8IGxleCgpICE9IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHRzW3ZhbHVlLnNsaWNlKDEpXSA9IGdldChsZXgoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gVW5leHBlY3RlZCB0b2tlbiBlbmNvdW50ZXJlZC5cbiAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBVcGRhdGVzIGEgdHJhdmVyc2VkIG9iamVjdCBtZW1iZXIuXG4gICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGVsZW1lbnQgPT09IHVuZGVmKSB7XG4gICAgICAgICAgZGVsZXRlIHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc291cmNlW3Byb3BlcnR5XSA9IGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxuICAgICAgLy8gYGNhbGxiYWNrYCBmdW5jdGlvbiBmb3IgZWFjaCB2YWx1ZS4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgIC8vIGBXYWxrKGhvbGRlciwgbmFtZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2VbcHJvcGVydHldLCBsZW5ndGg7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcbiAgICAgICAgICAvLyBiZWNhdXNlIGl0cyBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpbXBsZW1lbnRhdGlvbiByZXR1cm5zIGBmYWxzZWBcbiAgICAgICAgICAvLyBmb3IgYXJyYXkgaW5kaWNlcyAoZS5nLiwgYCFbMSwgMiwgM10uaGFzT3duUHJvcGVydHkoXCIwXCIpYCkuXG4gICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBsZW5ndGgtLTspIHtcbiAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBsZW5ndGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzb3VyY2UsIHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBQdWJsaWM6IGBKU09OLnBhcnNlYC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICBKU09OMy5wYXJzZSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xuICAgICAgICBJbmRleCA9IDA7XG4gICAgICAgIFNvdXJjZSA9IFwiXCIgKyBzb3VyY2U7XG4gICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XG4gICAgICAgIC8vIElmIGEgSlNPTiBzdHJpbmcgY29udGFpbnMgbXVsdGlwbGUgdG9rZW5zLCBpdCBpcyBpbnZhbGlkLlxuICAgICAgICBpZiAobGV4KCkgIT0gXCIkXCIpIHtcbiAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJlc2V0IHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGdldENsYXNzLmNhbGwoY2FsbGJhY2spID09IGZ1bmN0aW9uQ2xhc3MgPyB3YWxrKCh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHJlc3VsdCwgdmFsdWUpLCBcIlwiLCBjYWxsYmFjaykgOiByZXN1bHQ7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEV4cG9ydCBmb3IgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLlxuICBpZiAoaXNMb2FkZXIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEpTT04zO1xuICAgIH0pO1xuICB9XG59KHRoaXMpKTtcbiIsIi8qIVxuICogbXVzdGFjaGUuanMgLSBMb2dpYy1sZXNzIHt7bXVzdGFjaGV9fSB0ZW1wbGF0ZXMgd2l0aCBKYXZhU2NyaXB0XG4gKiBodHRwOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgZXhwb3J0cykge1xuICAgIGZhY3RvcnkoZXhwb3J0cyk7IC8vIENvbW1vbkpTXG4gIH0gZWxzZSB7XG4gICAgdmFyIG11c3RhY2hlID0ge307XG4gICAgZmFjdG9yeShtdXN0YWNoZSk7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICBkZWZpbmUobXVzdGFjaGUpOyAvLyBBTURcbiAgICB9IGVsc2Uge1xuICAgICAgcm9vdC5NdXN0YWNoZSA9IG11c3RhY2hlOyAvLyA8c2NyaXB0PlxuICAgIH1cbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAobXVzdGFjaGUpIHtcblxuICB2YXIgd2hpdGVSZSA9IC9cXHMqLztcbiAgdmFyIHNwYWNlUmUgPSAvXFxzKy87XG4gIHZhciBub25TcGFjZVJlID0gL1xcUy87XG4gIHZhciBlcVJlID0gL1xccyo9LztcbiAgdmFyIGN1cmx5UmUgPSAvXFxzKlxcfS87XG4gIHZhciB0YWdSZSA9IC8jfFxcXnxcXC98PnxcXHt8Jnw9fCEvO1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vaXNzdWVzLmFwYWNoZS5vcmcvamlyYS9icm93c2UvQ09VQ0hEQi01NzdcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODlcbiAgdmFyIFJlZ0V4cF90ZXN0ID0gUmVnRXhwLnByb3RvdHlwZS50ZXN0O1xuICBmdW5jdGlvbiB0ZXN0UmVnRXhwKHJlLCBzdHJpbmcpIHtcbiAgICByZXR1cm4gUmVnRXhwX3Rlc3QuY2FsbChyZSwgc3RyaW5nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlzV2hpdGVzcGFjZShzdHJpbmcpIHtcbiAgICByZXR1cm4gIXRlc3RSZWdFeHAobm9uU3BhY2VSZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBPYmplY3RfdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBPYmplY3RfdG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbic7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG4gIH1cblxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIFwiJlwiOiBcIiZhbXA7XCIsXG4gICAgXCI8XCI6IFwiJmx0O1wiLFxuICAgIFwiPlwiOiBcIiZndDtcIixcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICBcIi9cIjogJyYjeDJGOydcbiAgfTtcblxuICBmdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcFtzXTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIFNjYW5uZXIoc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgdGhpcy50YWlsID0gc3RyaW5nO1xuICAgIHRoaXMucG9zID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdGFpbCBpcyBlbXB0eSAoZW5kIG9mIHN0cmluZykuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5lb3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGFpbCA9PT0gXCJcIjtcbiAgfTtcblxuICAvKipcbiAgICogVHJpZXMgdG8gbWF0Y2ggdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBhdCB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICogUmV0dXJucyB0aGUgbWF0Y2hlZCB0ZXh0IGlmIGl0IGNhbiBtYXRjaCwgdGhlIGVtcHR5IHN0cmluZyBvdGhlcndpc2UuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKHJlKSB7XG4gICAgdmFyIG1hdGNoID0gdGhpcy50YWlsLm1hdGNoKHJlKTtcblxuICAgIGlmIChtYXRjaCAmJiBtYXRjaC5pbmRleCA9PT0gMCkge1xuICAgICAgdmFyIHN0cmluZyA9IG1hdGNoWzBdO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhzdHJpbmcubGVuZ3RoKTtcbiAgICAgIHRoaXMucG9zICs9IHN0cmluZy5sZW5ndGg7XG4gICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTa2lwcyBhbGwgdGV4dCB1bnRpbCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGNhbiBiZSBtYXRjaGVkLiBSZXR1cm5zXG4gICAqIHRoZSBza2lwcGVkIHN0cmluZywgd2hpY2ggaXMgdGhlIGVudGlyZSB0YWlsIGlmIG5vIG1hdGNoIGNhbiBiZSBtYWRlLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuc2NhblVudGlsID0gZnVuY3Rpb24gKHJlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy50YWlsLnNlYXJjaChyZSksIG1hdGNoO1xuXG4gICAgc3dpdGNoIChpbmRleCkge1xuICAgIGNhc2UgLTE6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbDtcbiAgICAgIHRoaXMudGFpbCA9IFwiXCI7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDA6XG4gICAgICBtYXRjaCA9IFwiXCI7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgbWF0Y2ggPSB0aGlzLnRhaWwuc3Vic3RyaW5nKDAsIGluZGV4KTtcbiAgICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5zdWJzdHJpbmcoaW5kZXgpO1xuICAgIH1cblxuICAgIHRoaXMucG9zICs9IG1hdGNoLmxlbmd0aDtcblxuICAgIHJldHVybiBtYXRjaDtcbiAgfTtcblxuICBmdW5jdGlvbiBDb250ZXh0KHZpZXcsIHBhcmVudCkge1xuICAgIHRoaXMudmlldyA9IHZpZXcgPT0gbnVsbCA/IHt9IDogdmlldztcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLl9jYWNoZSA9IHsgJy4nOiB0aGlzLnZpZXcgfTtcbiAgfVxuXG4gIENvbnRleHQubWFrZSA9IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgcmV0dXJuICh2aWV3IGluc3RhbmNlb2YgQ29udGV4dCkgPyB2aWV3IDogbmV3IENvbnRleHQodmlldyk7XG4gIH07XG5cbiAgQ29udGV4dC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgcmV0dXJuIG5ldyBDb250ZXh0KHZpZXcsIHRoaXMpO1xuICB9O1xuXG4gIENvbnRleHQucHJvdG90eXBlLmxvb2t1cCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIHZhbHVlO1xuICAgIGlmIChuYW1lIGluIHRoaXMuX2NhY2hlKSB7XG4gICAgICB2YWx1ZSA9IHRoaXMuX2NhY2hlW25hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG5cbiAgICAgIHdoaWxlIChjb250ZXh0KSB7XG4gICAgICAgIGlmIChuYW1lLmluZGV4T2YoJy4nKSA+IDApIHtcbiAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlldztcblxuICAgICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoJy4nKSwgaSA9IDA7XG4gICAgICAgICAgd2hpbGUgKHZhbHVlICE9IG51bGwgJiYgaSA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVtuYW1lc1tpKytdXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSBjb250ZXh0LnZpZXdbbmFtZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnJlYWs7XG5cbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQucGFyZW50O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIFdyaXRlcigpIHtcbiAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcbiAgfVxuXG4gIFdyaXRlci5wcm90b3R5cGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIHRoaXMuX3BhcnRpYWxDYWNoZSA9IHt9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHZhciBmbiA9IHRoaXMuX2NhY2hlW3RlbXBsYXRlXTtcblxuICAgIGlmICghZm4pIHtcbiAgICAgIHZhciB0b2tlbnMgPSBtdXN0YWNoZS5wYXJzZSh0ZW1wbGF0ZSwgdGFncyk7XG4gICAgICBmbiA9IHRoaXMuX2NhY2hlW3RlbXBsYXRlXSA9IHRoaXMuY29tcGlsZVRva2Vucyh0b2tlbnMsIHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZm47XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jb21waWxlUGFydGlhbCA9IGZ1bmN0aW9uIChuYW1lLCB0ZW1wbGF0ZSwgdGFncykge1xuICAgIHZhciBmbiA9IHRoaXMuY29tcGlsZSh0ZW1wbGF0ZSwgdGFncyk7XG4gICAgdGhpcy5fcGFydGlhbENhY2hlW25hbWVdID0gZm47XG4gICAgcmV0dXJuIGZuO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuZ2V0UGFydGlhbCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYgKCEobmFtZSBpbiB0aGlzLl9wYXJ0aWFsQ2FjaGUpICYmIHRoaXMuX2xvYWRQYXJ0aWFsKSB7XG4gICAgICB0aGlzLmNvbXBpbGVQYXJ0aWFsKG5hbWUsIHRoaXMuX2xvYWRQYXJ0aWFsKG5hbWUpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fcGFydGlhbENhY2hlW25hbWVdO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuY29tcGlsZVRva2VucyA9IGZ1bmN0aW9uICh0b2tlbnMsIHRlbXBsYXRlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAodmlldywgcGFydGlhbHMpIHtcbiAgICAgIGlmIChwYXJ0aWFscykge1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihwYXJ0aWFscykpIHtcbiAgICAgICAgICBzZWxmLl9sb2FkUGFydGlhbCA9IHBhcnRpYWxzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gcGFydGlhbHMpIHtcbiAgICAgICAgICAgIHNlbGYuY29tcGlsZVBhcnRpYWwobmFtZSwgcGFydGlhbHNbbmFtZV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVuZGVyVG9rZW5zKHRva2Vucywgc2VsZiwgQ29udGV4dC5tYWtlKHZpZXcpLCB0ZW1wbGF0ZSk7XG4gICAgfTtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICByZXR1cm4gdGhpcy5jb21waWxlKHRlbXBsYXRlKSh2aWV3LCBwYXJ0aWFscyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIExvdy1sZXZlbCBmdW5jdGlvbiB0aGF0IHJlbmRlcnMgdGhlIGdpdmVuIGB0b2tlbnNgIHVzaW5nIHRoZSBnaXZlbiBgd3JpdGVyYFxuICAgKiBhbmQgYGNvbnRleHRgLiBUaGUgYHRlbXBsYXRlYCBzdHJpbmcgaXMgb25seSBuZWVkZWQgZm9yIHRlbXBsYXRlcyB0aGF0IHVzZVxuICAgKiBoaWdoZXItb3JkZXIgc2VjdGlvbnMgdG8gZXh0cmFjdCB0aGUgcG9ydGlvbiBvZiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdGhhdFxuICAgKiB3YXMgY29udGFpbmVkIGluIHRoYXQgc2VjdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIHJlbmRlclRva2Vucyh0b2tlbnMsIHdyaXRlciwgY29udGV4dCwgdGVtcGxhdGUpIHtcbiAgICB2YXIgYnVmZmVyID0gJyc7XG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmVuZGVyIGFuIGFydGJpdHJhcnkgdGVtcGxhdGVcbiAgICAvLyBpbiB0aGUgY3VycmVudCBjb250ZXh0IGJ5IGhpZ2hlci1vcmRlciBmdW5jdGlvbnMuXG4gICAgZnVuY3Rpb24gc3ViUmVuZGVyKHRlbXBsYXRlKSB7XG4gICAgICByZXR1cm4gd3JpdGVyLnJlbmRlcih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgdmFyIHRva2VuLCB0b2tlblZhbHVlLCB2YWx1ZTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgIHRva2VuVmFsdWUgPSB0b2tlblsxXTtcblxuICAgICAgc3dpdGNoICh0b2tlblswXSkge1xuICAgICAgY2FzZSAnIyc6XG4gICAgICAgIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5WYWx1ZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpsZW4gPSB2YWx1ZS5sZW5ndGg7IGogPCBqbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgYnVmZmVyICs9IHJlbmRlclRva2Vucyh0b2tlbls0XSwgd3JpdGVyLCBjb250ZXh0LnB1c2godmFsdWVbal0pLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgYnVmZmVyICs9IHJlbmRlclRva2Vucyh0b2tlbls0XSwgd3JpdGVyLCBjb250ZXh0LnB1c2godmFsdWUpLCB0ZW1wbGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgICAgdmFyIHRleHQgPSB0ZW1wbGF0ZSA9PSBudWxsID8gbnVsbCA6IHRlbXBsYXRlLnNsaWNlKHRva2VuWzNdLCB0b2tlbls1XSk7XG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKGNvbnRleHQudmlldywgdGV4dCwgc3ViUmVuZGVyKTtcbiAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IHZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgYnVmZmVyICs9IHJlbmRlclRva2Vucyh0b2tlbls0XSwgd3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ14nOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuVmFsdWUpO1xuXG4gICAgICAgIC8vIFVzZSBKYXZhU2NyaXB0J3MgZGVmaW5pdGlvbiBvZiBmYWxzeS4gSW5jbHVkZSBlbXB0eSBhcnJheXMuXG4gICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMTg2XG4gICAgICAgIGlmICghdmFsdWUgfHwgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICBidWZmZXIgKz0gcmVuZGVyVG9rZW5zKHRva2VuWzRdLCB3cml0ZXIsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnPic6XG4gICAgICAgIHZhbHVlID0gd3JpdGVyLmdldFBhcnRpYWwodG9rZW5WYWx1ZSk7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkgYnVmZmVyICs9IHZhbHVlKGNvbnRleHQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJyYnOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuVmFsdWUpO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IHZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ25hbWUnOlxuICAgICAgICB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuVmFsdWUpO1xuICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkgYnVmZmVyICs9IG11c3RhY2hlLmVzY2FwZSh2YWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgIGJ1ZmZlciArPSB0b2tlblZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1zIHRoZSBnaXZlbiBhcnJheSBvZiBgdG9rZW5zYCBpbnRvIGEgbmVzdGVkIHRyZWUgc3RydWN0dXJlIHdoZXJlXG4gICAqIHRva2VucyB0aGF0IHJlcHJlc2VudCBhIHNlY3Rpb24gaGF2ZSB0d28gYWRkaXRpb25hbCBpdGVtczogMSkgYW4gYXJyYXkgb2ZcbiAgICogYWxsIHRva2VucyB0aGF0IGFwcGVhciBpbiB0aGF0IHNlY3Rpb24gYW5kIDIpIHRoZSBpbmRleCBpbiB0aGUgb3JpZ2luYWxcbiAgICogdGVtcGxhdGUgdGhhdCByZXByZXNlbnRzIHRoZSBlbmQgb2YgdGhhdCBzZWN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gbmVzdFRva2Vucyh0b2tlbnMpIHtcbiAgICB2YXIgdHJlZSA9IFtdO1xuICAgIHZhciBjb2xsZWN0b3IgPSB0cmVlO1xuICAgIHZhciBzZWN0aW9ucyA9IFtdO1xuXG4gICAgdmFyIHRva2VuO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgc3dpdGNoICh0b2tlblswXSkge1xuICAgICAgY2FzZSAnIyc6XG4gICAgICBjYXNlICdeJzpcbiAgICAgICAgc2VjdGlvbnMucHVzaCh0b2tlbik7XG4gICAgICAgIGNvbGxlY3Rvci5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yID0gdG9rZW5bNF0gPSBbXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICcvJzpcbiAgICAgICAgdmFyIHNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICAgICAgc2VjdGlvbls1XSA9IHRva2VuWzJdO1xuICAgICAgICBjb2xsZWN0b3IgPSBzZWN0aW9ucy5sZW5ndGggPiAwID8gc2VjdGlvbnNbc2VjdGlvbnMubGVuZ3RoIC0gMV1bNF0gOiB0cmVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbGxlY3Rvci5wdXNoKHRva2VuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJlZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21iaW5lcyB0aGUgdmFsdWVzIG9mIGNvbnNlY3V0aXZlIHRleHQgdG9rZW5zIGluIHRoZSBnaXZlbiBgdG9rZW5zYCBhcnJheVxuICAgKiB0byBhIHNpbmdsZSB0b2tlbi5cbiAgICovXG4gIGZ1bmN0aW9uIHNxdWFzaFRva2Vucyh0b2tlbnMpIHtcbiAgICB2YXIgc3F1YXNoZWRUb2tlbnMgPSBbXTtcblxuICAgIHZhciB0b2tlbiwgbGFzdFRva2VuO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuICAgICAgaWYgKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlblswXSA9PT0gJ3RleHQnICYmIGxhc3RUb2tlbiAmJiBsYXN0VG9rZW5bMF0gPT09ICd0ZXh0Jykge1xuICAgICAgICAgIGxhc3RUb2tlblsxXSArPSB0b2tlblsxXTtcbiAgICAgICAgICBsYXN0VG9rZW5bM10gPSB0b2tlblszXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsYXN0VG9rZW4gPSB0b2tlbjtcbiAgICAgICAgICBzcXVhc2hlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzcXVhc2hlZFRva2VucztcbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZVRhZ3ModGFncykge1xuICAgIHJldHVybiBbXG4gICAgICBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cCh0YWdzWzBdKSArIFwiXFxcXHMqXCIpLFxuICAgICAgbmV3IFJlZ0V4cChcIlxcXFxzKlwiICsgZXNjYXBlUmVnRXhwKHRhZ3NbMV0pKVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogQnJlYWtzIHVwIHRoZSBnaXZlbiBgdGVtcGxhdGVgIHN0cmluZyBpbnRvIGEgdHJlZSBvZiB0b2tlbiBvYmplY3RzLiBJZlxuICAgKiBgdGFnc2AgaXMgZ2l2ZW4gaGVyZSBpdCBtdXN0IGJlIGFuIGFycmF5IHdpdGggdHdvIHN0cmluZyB2YWx1ZXM6IHRoZVxuICAgKiBvcGVuaW5nIGFuZCBjbG9zaW5nIHRhZ3MgdXNlZCBpbiB0aGUgdGVtcGxhdGUgKGUuZy4gW1wiPCVcIiwgXCIlPlwiXSkuIE9mXG4gICAqIGNvdXJzZSwgdGhlIGRlZmF1bHQgaXMgdG8gdXNlIG11c3RhY2hlcyAoaS5lLiBNdXN0YWNoZS50YWdzKS5cbiAgICovXG4gIGZ1bmN0aW9uIHBhcnNlVGVtcGxhdGUodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICB0ZW1wbGF0ZSA9IHRlbXBsYXRlIHx8ICcnO1xuICAgIHRhZ3MgPSB0YWdzIHx8IG11c3RhY2hlLnRhZ3M7XG5cbiAgICBpZiAodHlwZW9mIHRhZ3MgPT09ICdzdHJpbmcnKSB0YWdzID0gdGFncy5zcGxpdChzcGFjZVJlKTtcbiAgICBpZiAodGFncy5sZW5ndGggIT09IDIpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCB0YWdzOiAnICsgdGFncy5qb2luKCcsICcpKTtcblxuICAgIHZhciB0YWdSZXMgPSBlc2NhcGVUYWdzKHRhZ3MpO1xuICAgIHZhciBzY2FubmVyID0gbmV3IFNjYW5uZXIodGVtcGxhdGUpO1xuXG4gICAgdmFyIHNlY3Rpb25zID0gW107ICAgICAvLyBTdGFjayB0byBob2xkIHNlY3Rpb24gdG9rZW5zXG4gICAgdmFyIHRva2VucyA9IFtdOyAgICAgICAvLyBCdWZmZXIgdG8gaG9sZCB0aGUgdG9rZW5zXG4gICAgdmFyIHNwYWNlcyA9IFtdOyAgICAgICAvLyBJbmRpY2VzIG9mIHdoaXRlc3BhY2UgdG9rZW5zIG9uIHRoZSBjdXJyZW50IGxpbmVcbiAgICB2YXIgaGFzVGFnID0gZmFsc2U7ICAgIC8vIElzIHRoZXJlIGEge3t0YWd9fSBvbiB0aGUgY3VycmVudCBsaW5lP1xuICAgIHZhciBub25TcGFjZSA9IGZhbHNlOyAgLy8gSXMgdGhlcmUgYSBub24tc3BhY2UgY2hhciBvbiB0aGUgY3VycmVudCBsaW5lP1xuXG4gICAgLy8gU3RyaXBzIGFsbCB3aGl0ZXNwYWNlIHRva2VucyBhcnJheSBmb3IgdGhlIGN1cnJlbnQgbGluZVxuICAgIC8vIGlmIHRoZXJlIHdhcyBhIHt7I3RhZ319IG9uIGl0IGFuZCBvdGhlcndpc2Ugb25seSBzcGFjZS5cbiAgICBmdW5jdGlvbiBzdHJpcFNwYWNlKCkge1xuICAgICAgaWYgKGhhc1RhZyAmJiAhbm9uU3BhY2UpIHtcbiAgICAgICAgd2hpbGUgKHNwYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICBkZWxldGUgdG9rZW5zW3NwYWNlcy5wb3AoKV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYWNlcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBoYXNUYWcgPSBmYWxzZTtcbiAgICAgIG5vblNwYWNlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHN0YXJ0LCB0eXBlLCB2YWx1ZSwgY2hyLCB0b2tlbiwgb3BlblNlY3Rpb247XG4gICAgd2hpbGUgKCFzY2FubmVyLmVvcygpKSB7XG4gICAgICBzdGFydCA9IHNjYW5uZXIucG9zO1xuXG4gICAgICAvLyBNYXRjaCBhbnkgdGV4dCBiZXR3ZWVuIHRhZ3MuXG4gICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1swXSk7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgY2hyID0gdmFsdWUuY2hhckF0KGkpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaHIpKSB7XG4gICAgICAgICAgICBzcGFjZXMucHVzaCh0b2tlbnMubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRva2Vucy5wdXNoKFsndGV4dCcsIGNociwgc3RhcnQsIHN0YXJ0ICsgMV0pO1xuICAgICAgICAgIHN0YXJ0ICs9IDE7XG5cbiAgICAgICAgICAvLyBDaGVjayBmb3Igd2hpdGVzcGFjZSBvbiB0aGUgY3VycmVudCBsaW5lLlxuICAgICAgICAgIGlmIChjaHIgPT0gJ1xcbicpIHN0cmlwU3BhY2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNYXRjaCB0aGUgb3BlbmluZyB0YWcuXG4gICAgICBpZiAoIXNjYW5uZXIuc2Nhbih0YWdSZXNbMF0pKSBicmVhaztcbiAgICAgIGhhc1RhZyA9IHRydWU7XG5cbiAgICAgIC8vIEdldCB0aGUgdGFnIHR5cGUuXG4gICAgICB0eXBlID0gc2Nhbm5lci5zY2FuKHRhZ1JlKSB8fCAnbmFtZSc7XG4gICAgICBzY2FubmVyLnNjYW4od2hpdGVSZSk7XG5cbiAgICAgIC8vIEdldCB0aGUgdGFnIHZhbHVlLlxuICAgICAgaWYgKHR5cGUgPT09ICc9Jykge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKGVxUmUpO1xuICAgICAgICBzY2FubmVyLnNjYW4oZXFSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd7Jykge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKG5ldyBSZWdFeHAoJ1xcXFxzKicgKyBlc2NhcGVSZWdFeHAoJ30nICsgdGFnc1sxXSkpKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuKGN1cmx5UmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgICB0eXBlID0gJyYnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBNYXRjaCB0aGUgY2xvc2luZyB0YWcuXG4gICAgICBpZiAoIXNjYW5uZXIuc2Nhbih0YWdSZXNbMV0pKSB0aHJvdyBuZXcgRXJyb3IoJ1VuY2xvc2VkIHRhZyBhdCAnICsgc2Nhbm5lci5wb3MpO1xuXG4gICAgICB0b2tlbiA9IFt0eXBlLCB2YWx1ZSwgc3RhcnQsIHNjYW5uZXIucG9zXTtcbiAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcblxuICAgICAgaWYgKHR5cGUgPT09ICcjJyB8fCB0eXBlID09PSAnXicpIHtcbiAgICAgICAgc2VjdGlvbnMucHVzaCh0b2tlbik7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICcvJykge1xuICAgICAgICAvLyBDaGVjayBzZWN0aW9uIG5lc3RpbmcuXG4gICAgICAgIG9wZW5TZWN0aW9uID0gc2VjdGlvbnMucG9wKCk7XG4gICAgICAgIGlmICghb3BlblNlY3Rpb24pIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vub3BlbmVkIHNlY3Rpb24gXCInICsgdmFsdWUgKyAnXCIgYXQgJyArIHN0YXJ0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3BlblNlY3Rpb25bMV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIG9wZW5TZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ25hbWUnIHx8IHR5cGUgPT09ICd7JyB8fCB0eXBlID09PSAnJicpIHtcbiAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnPScpIHtcbiAgICAgICAgLy8gU2V0IHRoZSB0YWdzIGZvciB0aGUgbmV4dCB0aW1lIGFyb3VuZC5cbiAgICAgICAgdGFncyA9IHZhbHVlLnNwbGl0KHNwYWNlUmUpO1xuICAgICAgICBpZiAodGFncy5sZW5ndGggIT09IDIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFncyBhdCAnICsgc3RhcnQgKyAnOiAnICsgdGFncy5qb2luKCcsICcpKTtcbiAgICAgICAgfVxuICAgICAgICB0YWdSZXMgPSBlc2NhcGVUYWdzKHRhZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb3BlbiBzZWN0aW9ucyB3aGVuIHdlJ3JlIGRvbmUuXG4gICAgb3BlblNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICBpZiAob3BlblNlY3Rpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBvcGVuU2VjdGlvblsxXSArICdcIiBhdCAnICsgc2Nhbm5lci5wb3MpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXN0VG9rZW5zKHNxdWFzaFRva2Vucyh0b2tlbnMpKTtcbiAgfVxuXG4gIG11c3RhY2hlLm5hbWUgPSBcIm11c3RhY2hlLmpzXCI7XG4gIG11c3RhY2hlLnZlcnNpb24gPSBcIjAuNy4zXCI7XG4gIG11c3RhY2hlLnRhZ3MgPSBbXCJ7e1wiLCBcIn19XCJdO1xuXG4gIG11c3RhY2hlLlNjYW5uZXIgPSBTY2FubmVyO1xuICBtdXN0YWNoZS5Db250ZXh0ID0gQ29udGV4dDtcbiAgbXVzdGFjaGUuV3JpdGVyID0gV3JpdGVyO1xuXG4gIG11c3RhY2hlLnBhcnNlID0gcGFyc2VUZW1wbGF0ZTtcblxuICAvLyBFeHBvcnQgdGhlIGVzY2FwaW5nIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIHVzZXIgbWF5IG92ZXJyaWRlIGl0LlxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzI0NFxuICBtdXN0YWNoZS5lc2NhcGUgPSBlc2NhcGVIdG1sO1xuXG4gIC8vIEFsbCBNdXN0YWNoZS4qIGZ1bmN0aW9ucyB1c2UgdGhpcyB3cml0ZXIuXG4gIHZhciBkZWZhdWx0V3JpdGVyID0gbmV3IFdyaXRlcigpO1xuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0ZW1wbGF0ZXMgYW5kIHBhcnRpYWxzIGluIHRoZSBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRXcml0ZXIuY2xlYXJDYWNoZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCB0byBhIHJldXNhYmxlIGZ1bmN0aW9uIHVzaW5nIHRoZSBkZWZhdWx0XG4gICAqIHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLmNvbXBpbGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jb21waWxlKHRlbXBsYXRlLCB0YWdzKTtcbiAgfTtcblxuICAvKipcbiAgICogQ29tcGlsZXMgdGhlIHBhcnRpYWwgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgIGFuZCBgdGVtcGxhdGVgIHRvIGEgcmV1c2FibGVcbiAgICogZnVuY3Rpb24gdXNpbmcgdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgbXVzdGFjaGUuY29tcGlsZVBhcnRpYWwgPSBmdW5jdGlvbiAobmFtZSwgdGVtcGxhdGUsIHRhZ3MpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jb21waWxlUGFydGlhbChuYW1lLCB0ZW1wbGF0ZSwgdGFncyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbXBpbGVzIHRoZSBnaXZlbiBhcnJheSBvZiB0b2tlbnMgKHRoZSBvdXRwdXQgb2YgYSBwYXJzZSkgdG8gYSByZXVzYWJsZVxuICAgKiBmdW5jdGlvbiB1c2luZyB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHRoZSBgdGVtcGxhdGVgIHdpdGggdGhlIGdpdmVuIGB2aWV3YCBhbmQgYHBhcnRpYWxzYCB1c2luZyB0aGVcbiAgICogZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBtdXN0YWNoZS5yZW5kZXIgPSBmdW5jdGlvbiAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRXcml0ZXIucmVuZGVyKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscyk7XG4gIH07XG5cbiAgLy8gVGhpcyBpcyBoZXJlIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoIDAuNC54LlxuICBtdXN0YWNoZS50b19odG1sID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscywgc2VuZCkge1xuICAgIHZhciByZXN1bHQgPSBtdXN0YWNoZS5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKHNlbmQpKSB7XG4gICAgICBzZW5kKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuXG59KSk7XG4iLCJ2YXIgaHRtbF9zYW5pdGl6ZSA9IHJlcXVpcmUoJy4vc2FuaXRpemVyLWJ1bmRsZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKF8pIHtcbiAgICBpZiAoIV8pIHJldHVybiAnJztcbiAgICByZXR1cm4gaHRtbF9zYW5pdGl6ZShfLCBjbGVhblVybCwgY2xlYW5JZCk7XG59O1xuXG4vLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0yNTUxMDdcbmZ1bmN0aW9uIGNsZWFuVXJsKHVybCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICBpZiAoL15odHRwcz8vLnRlc3QodXJsLmdldFNjaGVtZSgpKSkgcmV0dXJuIHVybC50b1N0cmluZygpO1xuICAgIGlmICgnZGF0YScgPT0gdXJsLmdldFNjaGVtZSgpICYmIC9eaW1hZ2UvLnRlc3QodXJsLmdldFBhdGgoKSkpIHtcbiAgICAgICAgcmV0dXJuIHVybC50b1N0cmluZygpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xlYW5JZChpZCkgeyByZXR1cm4gaWQ7IH1cbiIsIlxuLy8gQ29weXJpZ2h0IChDKSAyMDEwIEdvb2dsZSBJbmMuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBJbXBsZW1lbnRzIFJGQyAzOTg2IGZvciBwYXJzaW5nL2Zvcm1hdHRpbmcgVVJJcy5cbiAqXG4gKiBAYXV0aG9yIG1pa2VzYW11ZWxAZ21haWwuY29tXG4gKiBcXEBwcm92aWRlcyBVUklcbiAqIFxcQG92ZXJyaWRlcyB3aW5kb3dcbiAqL1xuXG52YXIgVVJJID0gKGZ1bmN0aW9uICgpIHtcblxuLyoqXG4gKiBjcmVhdGVzIGEgdXJpIGZyb20gdGhlIHN0cmluZyBmb3JtLiAgVGhlIHBhcnNlciBpcyByZWxheGVkLCBzbyBzcGVjaWFsXG4gKiBjaGFyYWN0ZXJzIHRoYXQgYXJlbid0IGVzY2FwZWQgYnV0IGRvbid0IGNhdXNlIGFtYmlndWl0aWVzIHdpbGwgbm90IGNhdXNlXG4gKiBwYXJzZSBmYWlsdXJlcy5cbiAqXG4gKiBAcmV0dXJuIHtVUkl8bnVsbH1cbiAqL1xuZnVuY3Rpb24gcGFyc2UodXJpU3RyKSB7XG4gIHZhciBtID0gKCcnICsgdXJpU3RyKS5tYXRjaChVUklfUkVfKTtcbiAgaWYgKCFtKSB7IHJldHVybiBudWxsOyB9XG4gIHJldHVybiBuZXcgVVJJKFxuICAgICAgbnVsbElmQWJzZW50KG1bMV0pLFxuICAgICAgbnVsbElmQWJzZW50KG1bMl0pLFxuICAgICAgbnVsbElmQWJzZW50KG1bM10pLFxuICAgICAgbnVsbElmQWJzZW50KG1bNF0pLFxuICAgICAgbnVsbElmQWJzZW50KG1bNV0pLFxuICAgICAgbnVsbElmQWJzZW50KG1bNl0pLFxuICAgICAgbnVsbElmQWJzZW50KG1bN10pKTtcbn1cblxuXG4vKipcbiAqIGNyZWF0ZXMgYSB1cmkgZnJvbSB0aGUgZ2l2ZW4gcGFydHMuXG4gKlxuICogQHBhcmFtIHNjaGVtZSB7c3RyaW5nfSBhbiB1bmVuY29kZWQgc2NoZW1lIHN1Y2ggYXMgXCJodHRwXCIgb3IgbnVsbFxuICogQHBhcmFtIGNyZWRlbnRpYWxzIHtzdHJpbmd9IHVuZW5jb2RlZCB1c2VyIGNyZWRlbnRpYWxzIG9yIG51bGxcbiAqIEBwYXJhbSBkb21haW4ge3N0cmluZ30gYW4gdW5lbmNvZGVkIGRvbWFpbiBuYW1lIG9yIG51bGxcbiAqIEBwYXJhbSBwb3J0IHtudW1iZXJ9IGEgcG9ydCBudW1iZXIgaW4gWzEsIDMyNzY4XS5cbiAqICAgIC0xIGluZGljYXRlcyBubyBwb3J0LCBhcyBkb2VzIG51bGwuXG4gKiBAcGFyYW0gcGF0aCB7c3RyaW5nfSBhbiB1bmVuY29kZWQgcGF0aFxuICogQHBhcmFtIHF1ZXJ5IHtBcnJheS48c3RyaW5nPnxzdHJpbmd8bnVsbH0gYSBsaXN0IG9mIHVuZW5jb2RlZCBjZ2lcbiAqICAgcGFyYW1ldGVycyB3aGVyZSBldmVuIHZhbHVlcyBhcmUga2V5cyBhbmQgb2RkcyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqICAgb3IgYW4gdW5lbmNvZGVkIHF1ZXJ5LlxuICogQHBhcmFtIGZyYWdtZW50IHtzdHJpbmd9IGFuIHVuZW5jb2RlZCBmcmFnbWVudCB3aXRob3V0IHRoZSBcIiNcIiBvciBudWxsLlxuICogQHJldHVybiB7VVJJfVxuICovXG5mdW5jdGlvbiBjcmVhdGUoc2NoZW1lLCBjcmVkZW50aWFscywgZG9tYWluLCBwb3J0LCBwYXRoLCBxdWVyeSwgZnJhZ21lbnQpIHtcbiAgdmFyIHVyaSA9IG5ldyBVUkkoXG4gICAgICBlbmNvZGVJZkV4aXN0czIoc2NoZW1lLCBVUklfRElTQUxMT1dFRF9JTl9TQ0hFTUVfT1JfQ1JFREVOVElBTFNfKSxcbiAgICAgIGVuY29kZUlmRXhpc3RzMihcbiAgICAgICAgICBjcmVkZW50aWFscywgVVJJX0RJU0FMTE9XRURfSU5fU0NIRU1FX09SX0NSRURFTlRJQUxTXyksXG4gICAgICBlbmNvZGVJZkV4aXN0cyhkb21haW4pLFxuICAgICAgcG9ydCA+IDAgPyBwb3J0LnRvU3RyaW5nKCkgOiBudWxsLFxuICAgICAgZW5jb2RlSWZFeGlzdHMyKHBhdGgsIFVSSV9ESVNBTExPV0VEX0lOX1BBVEhfKSxcbiAgICAgIG51bGwsXG4gICAgICBlbmNvZGVJZkV4aXN0cyhmcmFnbWVudCkpO1xuICBpZiAocXVlcnkpIHtcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBxdWVyeSkge1xuICAgICAgdXJpLnNldFJhd1F1ZXJ5KHF1ZXJ5LnJlcGxhY2UoL1tePyY9MC05QS1aYS16X1xcLX4uJV0vZywgZW5jb2RlT25lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVyaS5zZXRBbGxQYXJhbWV0ZXJzKHF1ZXJ5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVyaTtcbn1cbmZ1bmN0aW9uIGVuY29kZUlmRXhpc3RzKHVuZXNjYXBlZFBhcnQpIHtcbiAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB1bmVzY2FwZWRQYXJ0KSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCh1bmVzY2FwZWRQYXJ0KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG4vKipcbiAqIGlmIHVuZXNjYXBlZFBhcnQgaXMgbm9uIG51bGwsIHRoZW4gZXNjYXBlcyBhbnkgY2hhcmFjdGVycyBpbiBpdCB0aGF0IGFyZW4ndFxuICogdmFsaWQgY2hhcmFjdGVycyBpbiBhIHVybCBhbmQgYWxzbyBlc2NhcGVzIGFueSBzcGVjaWFsIGNoYXJhY3RlcnMgdGhhdFxuICogYXBwZWFyIGluIGV4dHJhLlxuICpcbiAqIEBwYXJhbSB1bmVzY2FwZWRQYXJ0IHtzdHJpbmd9XG4gKiBAcGFyYW0gZXh0cmEge1JlZ0V4cH0gYSBjaGFyYWN0ZXIgc2V0IG9mIGNoYXJhY3RlcnMgaW4gW1xcMDEtXFwxNzddLlxuICogQHJldHVybiB7c3RyaW5nfG51bGx9IG51bGwgaWZmIHVuZXNjYXBlZFBhcnQgPT0gbnVsbC5cbiAqL1xuZnVuY3Rpb24gZW5jb2RlSWZFeGlzdHMyKHVuZXNjYXBlZFBhcnQsIGV4dHJhKSB7XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdW5lc2NhcGVkUGFydCkge1xuICAgIHJldHVybiBlbmNvZGVVUkkodW5lc2NhcGVkUGFydCkucmVwbGFjZShleHRyYSwgZW5jb2RlT25lKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG4vKiogY29udmVydHMgYSBjaGFyYWN0ZXIgaW4gW1xcMDEtXFwxNzddIHRvIGl0cyB1cmwgZW5jb2RlZCBlcXVpdmFsZW50LiAqL1xuZnVuY3Rpb24gZW5jb2RlT25lKGNoKSB7XG4gIHZhciBuID0gY2guY2hhckNvZGVBdCgwKTtcbiAgcmV0dXJuICclJyArICcwMTIzNDU2Nzg5QUJDREVGJy5jaGFyQXQoKG4gPj4gNCkgJiAweGYpICtcbiAgICAgICcwMTIzNDU2Nzg5QUJDREVGJy5jaGFyQXQobiAmIDB4Zik7XG59XG5cbi8qKlxuICoge0B1cGRvY1xuICogICQgbm9ybVBhdGgoJ2Zvby8uL2JhcicpXG4gKiAgIyAnZm9vL2JhcidcbiAqICAkIG5vcm1QYXRoKCcuL2ZvbycpXG4gKiAgIyAnZm9vJ1xuICogICQgbm9ybVBhdGgoJ2Zvby8uJylcbiAqICAjICdmb28nXG4gKiAgJCBub3JtUGF0aCgnZm9vLy9iYXInKVxuICogICMgJ2Zvby9iYXInXG4gKiB9XG4gKi9cbmZ1bmN0aW9uIG5vcm1QYXRoKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGgucmVwbGFjZSgvKF58XFwvKVxcLig/OlxcL3wkKS9nLCAnJDEnKS5yZXBsYWNlKC9cXC97Mix9L2csICcvJyk7XG59XG5cbnZhciBQQVJFTlRfRElSRUNUT1JZX0hBTkRMRVIgPSBuZXcgUmVnRXhwKFxuICAgICcnXG4gICAgLy8gQSBwYXRoIGJyZWFrXG4gICAgKyAnKC98XiknXG4gICAgLy8gZm9sbG93ZWQgYnkgYSBub24gLi4gcGF0aCBlbGVtZW50XG4gICAgLy8gKGNhbm5vdCBiZSAuIGJlY2F1c2Ugbm9ybVBhdGggaXMgdXNlZCBwcmlvciB0byB0aGlzIFJlZ0V4cClcbiAgICArICcoPzpbXi4vXVteL10qfFxcXFwuezIsfSg/OlteLi9dW14vXSopfFxcXFwuezMsfVteL10qKSdcbiAgICAvLyBmb2xsb3dlZCBieSAuLiBmb2xsb3dlZCBieSBhIHBhdGggYnJlYWsuXG4gICAgKyAnL1xcXFwuXFxcXC4oPzovfCQpJyk7XG5cbnZhciBQQVJFTlRfRElSRUNUT1JZX0hBTkRMRVJfUkUgPSBuZXcgUmVnRXhwKFBBUkVOVF9ESVJFQ1RPUllfSEFORExFUik7XG5cbnZhciBFWFRSQV9QQVJFTlRfUEFUSFNfUkUgPSAvXig/OlxcLlxcLlxcLykqKD86XFwuXFwuJCk/LztcblxuLyoqXG4gKiBOb3JtYWxpemVzIGl0cyBpbnB1dCBwYXRoIGFuZCBjb2xsYXBzZXMgYWxsIC4gYW5kIC4uIHNlcXVlbmNlcyBleGNlcHQgZm9yXG4gKiAuLiBzZXF1ZW5jZXMgdGhhdCB3b3VsZCB0YWtlIGl0IGFib3ZlIHRoZSByb290IG9mIHRoZSBjdXJyZW50IHBhcmVudFxuICogZGlyZWN0b3J5LlxuICoge0B1cGRvY1xuICogICQgY29sbGFwc2VfZG90cygnZm9vLy4uL2JhcicpXG4gKiAgIyAnYmFyJ1xuICogICQgY29sbGFwc2VfZG90cygnZm9vLy4vYmFyJylcbiAqICAjICdmb28vYmFyJ1xuICogICQgY29sbGFwc2VfZG90cygnZm9vLy4uL2Jhci8uLy4uLy4uL2JheicpXG4gKiAgIyAnYmF6J1xuICogICQgY29sbGFwc2VfZG90cygnLi4vZm9vJylcbiAqICAjICcuLi9mb28nXG4gKiAgJCBjb2xsYXBzZV9kb3RzKCcuLi9mb28nKS5yZXBsYWNlKEVYVFJBX1BBUkVOVF9QQVRIU19SRSwgJycpXG4gKiAgIyAnZm9vJ1xuICogfVxuICovXG5mdW5jdGlvbiBjb2xsYXBzZV9kb3RzKHBhdGgpIHtcbiAgaWYgKHBhdGggPT09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cbiAgdmFyIHAgPSBub3JtUGF0aChwYXRoKTtcbiAgLy8gT25seSAvLi4vIGxlZnQgdG8gZmxhdHRlblxuICB2YXIgciA9IFBBUkVOVF9ESVJFQ1RPUllfSEFORExFUl9SRTtcbiAgLy8gV2UgcmVwbGFjZSB3aXRoICQxIHdoaWNoIG1hdGNoZXMgYSAvIGJlZm9yZSB0aGUgLi4gYmVjYXVzZSB0aGlzXG4gIC8vIGd1YXJhbnRlZXMgdGhhdDpcbiAgLy8gKDEpIHdlIGhhdmUgYXQgbW9zdCAxIC8gYmV0d2VlbiB0aGUgYWRqYWNlbnQgcGxhY2UsXG4gIC8vICgyKSBhbHdheXMgaGF2ZSBhIHNsYXNoIGlmIHRoZXJlIGlzIGEgcHJlY2VkaW5nIHBhdGggc2VjdGlvbiwgYW5kXG4gIC8vICgzKSB3ZSBuZXZlciB0dXJuIGEgcmVsYXRpdmUgcGF0aCBpbnRvIGFuIGFic29sdXRlIHBhdGguXG4gIGZvciAodmFyIHE7IChxID0gcC5yZXBsYWNlKHIsICckMScpKSAhPSBwOyBwID0gcSkge307XG4gIHJldHVybiBwO1xufVxuXG4vKipcbiAqIHJlc29sdmVzIGEgcmVsYXRpdmUgdXJsIHN0cmluZyB0byBhIGJhc2UgdXJpLlxuICogQHJldHVybiB7VVJJfVxuICovXG5mdW5jdGlvbiByZXNvbHZlKGJhc2VVcmksIHJlbGF0aXZlVXJpKSB7XG4gIC8vIHRoZXJlIGFyZSBzZXZlcmFsIGtpbmRzIG9mIHJlbGF0aXZlIHVybHM6XG4gIC8vIDEuIC8vZm9vIC0gcmVwbGFjZXMgZXZlcnl0aGluZyBmcm9tIHRoZSBkb21haW4gb24uICBmb28gaXMgYSBkb21haW4gbmFtZVxuICAvLyAyLiBmb28gLSByZXBsYWNlcyB0aGUgbGFzdCBwYXJ0IG9mIHRoZSBwYXRoLCB0aGUgd2hvbGUgcXVlcnkgYW5kIGZyYWdtZW50XG4gIC8vIDMuIC9mb28gLSByZXBsYWNlcyB0aGUgdGhlIHBhdGgsIHRoZSBxdWVyeSBhbmQgZnJhZ21lbnRcbiAgLy8gNC4gP2ZvbyAtIHJlcGxhY2UgdGhlIHF1ZXJ5IGFuZCBmcmFnbWVudFxuICAvLyA1LiAjZm9vIC0gcmVwbGFjZSB0aGUgZnJhZ21lbnQgb25seVxuXG4gIHZhciBhYnNvbHV0ZVVyaSA9IGJhc2VVcmkuY2xvbmUoKTtcbiAgLy8gd2Ugc2F0aXNmeSB0aGVzZSBjb25kaXRpb25zIGJ5IGxvb2tpbmcgZm9yIHRoZSBmaXJzdCBwYXJ0IG9mIHJlbGF0aXZlVXJpXG4gIC8vIHRoYXQgaXMgbm90IGJsYW5rIGFuZCBhcHBseWluZyBkZWZhdWx0cyB0byB0aGUgcmVzdFxuXG4gIHZhciBvdmVycmlkZGVuID0gcmVsYXRpdmVVcmkuaGFzU2NoZW1lKCk7XG5cbiAgaWYgKG92ZXJyaWRkZW4pIHtcbiAgICBhYnNvbHV0ZVVyaS5zZXRSYXdTY2hlbWUocmVsYXRpdmVVcmkuZ2V0UmF3U2NoZW1lKCkpO1xuICB9IGVsc2Uge1xuICAgIG92ZXJyaWRkZW4gPSByZWxhdGl2ZVVyaS5oYXNDcmVkZW50aWFscygpO1xuICB9XG5cbiAgaWYgKG92ZXJyaWRkZW4pIHtcbiAgICBhYnNvbHV0ZVVyaS5zZXRSYXdDcmVkZW50aWFscyhyZWxhdGl2ZVVyaS5nZXRSYXdDcmVkZW50aWFscygpKTtcbiAgfSBlbHNlIHtcbiAgICBvdmVycmlkZGVuID0gcmVsYXRpdmVVcmkuaGFzRG9tYWluKCk7XG4gIH1cblxuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFJhd0RvbWFpbihyZWxhdGl2ZVVyaS5nZXRSYXdEb21haW4oKSk7XG4gIH0gZWxzZSB7XG4gICAgb3ZlcnJpZGRlbiA9IHJlbGF0aXZlVXJpLmhhc1BvcnQoKTtcbiAgfVxuXG4gIHZhciByYXdQYXRoID0gcmVsYXRpdmVVcmkuZ2V0UmF3UGF0aCgpO1xuICB2YXIgc2ltcGxpZmllZFBhdGggPSBjb2xsYXBzZV9kb3RzKHJhd1BhdGgpO1xuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFBvcnQocmVsYXRpdmVVcmkuZ2V0UG9ydCgpKTtcbiAgICBzaW1wbGlmaWVkUGF0aCA9IHNpbXBsaWZpZWRQYXRoXG4gICAgICAgICYmIHNpbXBsaWZpZWRQYXRoLnJlcGxhY2UoRVhUUkFfUEFSRU5UX1BBVEhTX1JFLCAnJyk7XG4gIH0gZWxzZSB7XG4gICAgb3ZlcnJpZGRlbiA9ICEhcmF3UGF0aDtcbiAgICBpZiAob3ZlcnJpZGRlbikge1xuICAgICAgLy8gcmVzb2x2ZSBwYXRoIHByb3Blcmx5XG4gICAgICBpZiAoc2ltcGxpZmllZFBhdGguY2hhckNvZGVBdCgwKSAhPT0gMHgyZiAvKiAvICovKSB7ICAvLyBwYXRoIGlzIHJlbGF0aXZlXG4gICAgICAgIHZhciBhYnNSYXdQYXRoID0gY29sbGFwc2VfZG90cyhhYnNvbHV0ZVVyaS5nZXRSYXdQYXRoKCkgfHwgJycpXG4gICAgICAgICAgICAucmVwbGFjZShFWFRSQV9QQVJFTlRfUEFUSFNfUkUsICcnKTtcbiAgICAgICAgdmFyIHNsYXNoID0gYWJzUmF3UGF0aC5sYXN0SW5kZXhPZignLycpICsgMTtcbiAgICAgICAgc2ltcGxpZmllZFBhdGggPSBjb2xsYXBzZV9kb3RzKFxuICAgICAgICAgICAgKHNsYXNoID8gYWJzUmF3UGF0aC5zdWJzdHJpbmcoMCwgc2xhc2gpIDogJycpXG4gICAgICAgICAgICArIGNvbGxhcHNlX2RvdHMocmF3UGF0aCkpXG4gICAgICAgICAgICAucmVwbGFjZShFWFRSQV9QQVJFTlRfUEFUSFNfUkUsICcnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2ltcGxpZmllZFBhdGggPSBzaW1wbGlmaWVkUGF0aFxuICAgICAgICAgICYmIHNpbXBsaWZpZWRQYXRoLnJlcGxhY2UoRVhUUkFfUEFSRU5UX1BBVEhTX1JFLCAnJyk7XG4gICAgICBpZiAoc2ltcGxpZmllZFBhdGggIT09IHJhd1BhdGgpIHtcbiAgICAgICAgYWJzb2x1dGVVcmkuc2V0UmF3UGF0aChzaW1wbGlmaWVkUGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKG92ZXJyaWRkZW4pIHtcbiAgICBhYnNvbHV0ZVVyaS5zZXRSYXdQYXRoKHNpbXBsaWZpZWRQYXRoKTtcbiAgfSBlbHNlIHtcbiAgICBvdmVycmlkZGVuID0gcmVsYXRpdmVVcmkuaGFzUXVlcnkoKTtcbiAgfVxuXG4gIGlmIChvdmVycmlkZGVuKSB7XG4gICAgYWJzb2x1dGVVcmkuc2V0UmF3UXVlcnkocmVsYXRpdmVVcmkuZ2V0UmF3UXVlcnkoKSk7XG4gIH0gZWxzZSB7XG4gICAgb3ZlcnJpZGRlbiA9IHJlbGF0aXZlVXJpLmhhc0ZyYWdtZW50KCk7XG4gIH1cblxuICBpZiAob3ZlcnJpZGRlbikge1xuICAgIGFic29sdXRlVXJpLnNldFJhd0ZyYWdtZW50KHJlbGF0aXZlVXJpLmdldFJhd0ZyYWdtZW50KCkpO1xuICB9XG5cbiAgcmV0dXJuIGFic29sdXRlVXJpO1xufVxuXG4vKipcbiAqIGEgbXV0YWJsZSBVUkkuXG4gKlxuICogVGhpcyBjbGFzcyBjb250YWlucyBzZXR0ZXJzIGFuZCBnZXR0ZXJzIGZvciB0aGUgcGFydHMgb2YgdGhlIFVSSS5cbiAqIFRoZSA8dHQ+Z2V0WFlaPC90dD4vPHR0PnNldFhZWjwvdHQ+IG1ldGhvZHMgcmV0dXJuIHRoZSBkZWNvZGVkIHBhcnQgLS0gc29cbiAqIDxjb2RlPnVyaS5wYXJzZSgnL2ZvbyUyMGJhcicpLmdldFBhdGgoKTwvY29kZT4gd2lsbCByZXR1cm4gdGhlIGRlY29kZWQgcGF0aCxcbiAqIDx0dD4vZm9vIGJhcjwvdHQ+LlxuICpcbiAqIDxwPlRoZSByYXcgdmVyc2lvbnMgb2YgZmllbGRzIGFyZSBhdmFpbGFibGUgdG9vLlxuICogPGNvZGU+dXJpLnBhcnNlKCcvZm9vJTIwYmFyJykuZ2V0UmF3UGF0aCgpPC9jb2RlPiB3aWxsIHJldHVybiB0aGUgcmF3IHBhdGgsXG4gKiA8dHQ+L2ZvbyUyMGJhcjwvdHQ+LiAgVXNlIHRoZSByYXcgc2V0dGVycyB3aXRoIGNhcmUsIHNpbmNlXG4gKiA8Y29kZT5VUkk6OnRvU3RyaW5nPC9jb2RlPiBpcyBub3QgZ3VhcmFudGVlZCB0byByZXR1cm4gYSB2YWxpZCB1cmwgaWYgYVxuICogcmF3IHNldHRlciB3YXMgdXNlZC5cbiAqXG4gKiA8cD5BbGwgc2V0dGVycyByZXR1cm4gPHR0PnRoaXM8L3R0PiBhbmQgc28gbWF5IGJlIGNoYWluZWQsIGEgbGFcbiAqIDxjb2RlPnVyaS5wYXJzZSgnL2ZvbycpLnNldEZyYWdtZW50KCdwYXJ0JykudG9TdHJpbmcoKTwvY29kZT4uXG4gKlxuICogPHA+WW91IHNob3VsZCBub3QgdXNlIHRoaXMgY29uc3RydWN0b3IgZGlyZWN0bHkgLS0gcGxlYXNlIHByZWZlciB0aGUgZmFjdG9yeVxuICogZnVuY3Rpb25zIHtAbGluayB1cmkucGFyc2V9LCB7QGxpbmsgdXJpLmNyZWF0ZX0sIHtAbGluayB1cmkucmVzb2x2ZX1cbiAqIGluc3RlYWQuPC9wPlxuICpcbiAqIDxwPlRoZSBwYXJhbWV0ZXJzIGFyZSBhbGwgcmF3IChhc3N1bWVkIHRvIGJlIHByb3Blcmx5IGVzY2FwZWQpIHBhcnRzLCBhbmRcbiAqIGFueSAoYnV0IG5vdCBhbGwpIG1heSBiZSBudWxsLiAgVW5kZWZpbmVkIGlzIG5vdCBhbGxvd2VkLjwvcD5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVVJJKFxuICAgIHJhd1NjaGVtZSxcbiAgICByYXdDcmVkZW50aWFscywgcmF3RG9tYWluLCBwb3J0LFxuICAgIHJhd1BhdGgsIHJhd1F1ZXJ5LCByYXdGcmFnbWVudCkge1xuICB0aGlzLnNjaGVtZV8gPSByYXdTY2hlbWU7XG4gIHRoaXMuY3JlZGVudGlhbHNfID0gcmF3Q3JlZGVudGlhbHM7XG4gIHRoaXMuZG9tYWluXyA9IHJhd0RvbWFpbjtcbiAgdGhpcy5wb3J0XyA9IHBvcnQ7XG4gIHRoaXMucGF0aF8gPSByYXdQYXRoO1xuICB0aGlzLnF1ZXJ5XyA9IHJhd1F1ZXJ5O1xuICB0aGlzLmZyYWdtZW50XyA9IHJhd0ZyYWdtZW50O1xuICAvKipcbiAgICogQHR5cGUge0FycmF5fG51bGx9XG4gICAqL1xuICB0aGlzLnBhcmFtQ2FjaGVfID0gbnVsbDtcbn1cblxuLyoqIHJldHVybnMgdGhlIHN0cmluZyBmb3JtIG9mIHRoZSB1cmwuICovXG5VUkkucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW107XG4gIGlmIChudWxsICE9PSB0aGlzLnNjaGVtZV8pIHsgb3V0LnB1c2godGhpcy5zY2hlbWVfLCAnOicpOyB9XG4gIGlmIChudWxsICE9PSB0aGlzLmRvbWFpbl8pIHtcbiAgICBvdXQucHVzaCgnLy8nKTtcbiAgICBpZiAobnVsbCAhPT0gdGhpcy5jcmVkZW50aWFsc18pIHsgb3V0LnB1c2godGhpcy5jcmVkZW50aWFsc18sICdAJyk7IH1cbiAgICBvdXQucHVzaCh0aGlzLmRvbWFpbl8pO1xuICAgIGlmIChudWxsICE9PSB0aGlzLnBvcnRfKSB7IG91dC5wdXNoKCc6JywgdGhpcy5wb3J0Xy50b1N0cmluZygpKTsgfVxuICB9XG4gIGlmIChudWxsICE9PSB0aGlzLnBhdGhfKSB7IG91dC5wdXNoKHRoaXMucGF0aF8pOyB9XG4gIGlmIChudWxsICE9PSB0aGlzLnF1ZXJ5XykgeyBvdXQucHVzaCgnPycsIHRoaXMucXVlcnlfKTsgfVxuICBpZiAobnVsbCAhPT0gdGhpcy5mcmFnbWVudF8pIHsgb3V0LnB1c2goJyMnLCB0aGlzLmZyYWdtZW50Xyk7IH1cbiAgcmV0dXJuIG91dC5qb2luKCcnKTtcbn07XG5cblVSSS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgVVJJKHRoaXMuc2NoZW1lXywgdGhpcy5jcmVkZW50aWFsc18sIHRoaXMuZG9tYWluXywgdGhpcy5wb3J0XyxcbiAgICAgICAgICAgICAgICAgdGhpcy5wYXRoXywgdGhpcy5xdWVyeV8sIHRoaXMuZnJhZ21lbnRfKTtcbn07XG5cblVSSS5wcm90b3R5cGUuZ2V0U2NoZW1lID0gZnVuY3Rpb24gKCkge1xuICAvLyBIVE1MNSBzcGVjIGRvZXMgbm90IHJlcXVpcmUgdGhlIHNjaGVtZSB0byBiZSBsb3dlcmNhc2VkIGJ1dFxuICAvLyBhbGwgY29tbW9uIGJyb3dzZXJzIGV4Y2VwdCBTYWZhcmkgbG93ZXJjYXNlIHRoZSBzY2hlbWUuXG4gIHJldHVybiB0aGlzLnNjaGVtZV8gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuc2NoZW1lXykudG9Mb3dlckNhc2UoKTtcbn07XG5VUkkucHJvdG90eXBlLmdldFJhd1NjaGVtZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2NoZW1lXztcbn07XG5VUkkucHJvdG90eXBlLnNldFNjaGVtZSA9IGZ1bmN0aW9uIChuZXdTY2hlbWUpIHtcbiAgdGhpcy5zY2hlbWVfID0gZW5jb2RlSWZFeGlzdHMyKFxuICAgICAgbmV3U2NoZW1lLCBVUklfRElTQUxMT1dFRF9JTl9TQ0hFTUVfT1JfQ1JFREVOVElBTFNfKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5zZXRSYXdTY2hlbWUgPSBmdW5jdGlvbiAobmV3U2NoZW1lKSB7XG4gIHRoaXMuc2NoZW1lXyA9IG5ld1NjaGVtZSA/IG5ld1NjaGVtZSA6IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuaGFzU2NoZW1lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbnVsbCAhPT0gdGhpcy5zY2hlbWVfO1xufTtcblxuXG5VUkkucHJvdG90eXBlLmdldENyZWRlbnRpYWxzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5jcmVkZW50aWFsc18gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuY3JlZGVudGlhbHNfKTtcbn07XG5VUkkucHJvdG90eXBlLmdldFJhd0NyZWRlbnRpYWxzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5jcmVkZW50aWFsc187XG59O1xuVVJJLnByb3RvdHlwZS5zZXRDcmVkZW50aWFscyA9IGZ1bmN0aW9uIChuZXdDcmVkZW50aWFscykge1xuICB0aGlzLmNyZWRlbnRpYWxzXyA9IGVuY29kZUlmRXhpc3RzMihcbiAgICAgIG5ld0NyZWRlbnRpYWxzLCBVUklfRElTQUxMT1dFRF9JTl9TQ0hFTUVfT1JfQ1JFREVOVElBTFNfKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLnNldFJhd0NyZWRlbnRpYWxzID0gZnVuY3Rpb24gKG5ld0NyZWRlbnRpYWxzKSB7XG4gIHRoaXMuY3JlZGVudGlhbHNfID0gbmV3Q3JlZGVudGlhbHMgPyBuZXdDcmVkZW50aWFscyA6IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuaGFzQ3JlZGVudGlhbHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBudWxsICE9PSB0aGlzLmNyZWRlbnRpYWxzXztcbn07XG5cblxuVVJJLnByb3RvdHlwZS5nZXREb21haW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRvbWFpbl8gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuZG9tYWluXyk7XG59O1xuVVJJLnByb3RvdHlwZS5nZXRSYXdEb21haW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRvbWFpbl87XG59O1xuVVJJLnByb3RvdHlwZS5zZXREb21haW4gPSBmdW5jdGlvbiAobmV3RG9tYWluKSB7XG4gIHJldHVybiB0aGlzLnNldFJhd0RvbWFpbihuZXdEb21haW4gJiYgZW5jb2RlVVJJQ29tcG9uZW50KG5ld0RvbWFpbikpO1xufTtcblVSSS5wcm90b3R5cGUuc2V0UmF3RG9tYWluID0gZnVuY3Rpb24gKG5ld0RvbWFpbikge1xuICB0aGlzLmRvbWFpbl8gPSBuZXdEb21haW4gPyBuZXdEb21haW4gOiBudWxsO1xuICAvLyBNYWludGFpbiB0aGUgaW52YXJpYW50IHRoYXQgcGF0aHMgbXVzdCBzdGFydCB3aXRoIGEgc2xhc2ggd2hlbiB0aGUgVVJJXG4gIC8vIGlzIG5vdCBwYXRoLXJlbGF0aXZlLlxuICByZXR1cm4gdGhpcy5zZXRSYXdQYXRoKHRoaXMucGF0aF8pO1xufTtcblVSSS5wcm90b3R5cGUuaGFzRG9tYWluID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbnVsbCAhPT0gdGhpcy5kb21haW5fO1xufTtcblxuXG5VUkkucHJvdG90eXBlLmdldFBvcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnBvcnRfICYmIGRlY29kZVVSSUNvbXBvbmVudCh0aGlzLnBvcnRfKTtcbn07XG5VUkkucHJvdG90eXBlLnNldFBvcnQgPSBmdW5jdGlvbiAobmV3UG9ydCkge1xuICBpZiAobmV3UG9ydCkge1xuICAgIG5ld1BvcnQgPSBOdW1iZXIobmV3UG9ydCk7XG4gICAgaWYgKG5ld1BvcnQgIT09IChuZXdQb3J0ICYgMHhmZmZmKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdCYWQgcG9ydCBudW1iZXIgJyArIG5ld1BvcnQpO1xuICAgIH1cbiAgICB0aGlzLnBvcnRfID0gJycgKyBuZXdQb3J0O1xuICB9IGVsc2Uge1xuICAgIHRoaXMucG9ydF8gPSBudWxsO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuaGFzUG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG51bGwgIT09IHRoaXMucG9ydF87XG59O1xuXG5cblVSSS5wcm90b3R5cGUuZ2V0UGF0aCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMucGF0aF8gJiYgZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMucGF0aF8pO1xufTtcblVSSS5wcm90b3R5cGUuZ2V0UmF3UGF0aCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMucGF0aF87XG59O1xuVVJJLnByb3RvdHlwZS5zZXRQYXRoID0gZnVuY3Rpb24gKG5ld1BhdGgpIHtcbiAgcmV0dXJuIHRoaXMuc2V0UmF3UGF0aChlbmNvZGVJZkV4aXN0czIobmV3UGF0aCwgVVJJX0RJU0FMTE9XRURfSU5fUEFUSF8pKTtcbn07XG5VUkkucHJvdG90eXBlLnNldFJhd1BhdGggPSBmdW5jdGlvbiAobmV3UGF0aCkge1xuICBpZiAobmV3UGF0aCkge1xuICAgIG5ld1BhdGggPSBTdHJpbmcobmV3UGF0aCk7XG4gICAgdGhpcy5wYXRoXyA9IFxuICAgICAgLy8gUGF0aHMgbXVzdCBzdGFydCB3aXRoICcvJyB1bmxlc3MgdGhpcyBpcyBhIHBhdGgtcmVsYXRpdmUgVVJMLlxuICAgICAgKCF0aGlzLmRvbWFpbl8gfHwgL15cXC8vLnRlc3QobmV3UGF0aCkpID8gbmV3UGF0aCA6ICcvJyArIG5ld1BhdGg7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wYXRoXyA9IG51bGw7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNQYXRoID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbnVsbCAhPT0gdGhpcy5wYXRoXztcbn07XG5cblxuVVJJLnByb3RvdHlwZS5nZXRRdWVyeSA9IGZ1bmN0aW9uICgpIHtcbiAgLy8gRnJvbSBodHRwOi8vd3d3LnczLm9yZy9BZGRyZXNzaW5nL1VSTC80X1VSSV9SZWNvbW1lbnRhdGlvbnMuaHRtbFxuICAvLyBXaXRoaW4gdGhlIHF1ZXJ5IHN0cmluZywgdGhlIHBsdXMgc2lnbiBpcyByZXNlcnZlZCBhcyBzaG9ydGhhbmQgbm90YXRpb25cbiAgLy8gZm9yIGEgc3BhY2UuXG4gIHJldHVybiB0aGlzLnF1ZXJ5XyAmJiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5xdWVyeV8pLnJlcGxhY2UoL1xcKy9nLCAnICcpO1xufTtcblVSSS5wcm90b3R5cGUuZ2V0UmF3UXVlcnkgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnF1ZXJ5Xztcbn07XG5VUkkucHJvdG90eXBlLnNldFF1ZXJ5ID0gZnVuY3Rpb24gKG5ld1F1ZXJ5KSB7XG4gIHRoaXMucGFyYW1DYWNoZV8gPSBudWxsO1xuICB0aGlzLnF1ZXJ5XyA9IGVuY29kZUlmRXhpc3RzKG5ld1F1ZXJ5KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5zZXRSYXdRdWVyeSA9IGZ1bmN0aW9uIChuZXdRdWVyeSkge1xuICB0aGlzLnBhcmFtQ2FjaGVfID0gbnVsbDtcbiAgdGhpcy5xdWVyeV8gPSBuZXdRdWVyeSA/IG5ld1F1ZXJ5IDogbnVsbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5oYXNRdWVyeSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG51bGwgIT09IHRoaXMucXVlcnlfO1xufTtcblxuLyoqXG4gKiBzZXRzIHRoZSBxdWVyeSBnaXZlbiBhIGxpc3Qgb2Ygc3RyaW5ncyBvZiB0aGUgZm9ybVxuICogWyBrZXkwLCB2YWx1ZTAsIGtleTEsIHZhbHVlMSwgLi4uIF0uXG4gKlxuICogPHA+PGNvZGU+dXJpLnNldEFsbFBhcmFtZXRlcnMoWydhJywgJ2InLCAnYycsICdkJ10pLmdldFF1ZXJ5KCk8L2NvZGU+XG4gKiB3aWxsIHlpZWxkIDxjb2RlPidhPWImYz1kJzwvY29kZT4uXG4gKi9cblVSSS5wcm90b3R5cGUuc2V0QWxsUGFyYW1ldGVycyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdvYmplY3QnKSB7XG4gICAgaWYgKCEocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgICYmIChwYXJhbXMgaW5zdGFuY2VvZiBPYmplY3RcbiAgICAgICAgICAgIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChwYXJhbXMpICE9PSAnW29iamVjdCBBcnJheV0nKSkge1xuICAgICAgdmFyIG5ld1BhcmFtcyA9IFtdO1xuICAgICAgdmFyIGkgPSAtMTtcbiAgICAgIGZvciAodmFyIGsgaW4gcGFyYW1zKSB7XG4gICAgICAgIHZhciB2ID0gcGFyYW1zW2tdO1xuICAgICAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiB2KSB7XG4gICAgICAgICAgbmV3UGFyYW1zWysraV0gPSBrO1xuICAgICAgICAgIG5ld1BhcmFtc1srK2ldID0gdjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGFyYW1zID0gbmV3UGFyYW1zO1xuICAgIH1cbiAgfVxuICB0aGlzLnBhcmFtQ2FjaGVfID0gbnVsbDtcbiAgdmFyIHF1ZXJ5QnVmID0gW107XG4gIHZhciBzZXBhcmF0b3IgPSAnJztcbiAgZm9yICh2YXIgaiA9IDA7IGogPCBwYXJhbXMubGVuZ3RoOykge1xuICAgIHZhciBrID0gcGFyYW1zW2orK107XG4gICAgdmFyIHYgPSBwYXJhbXNbaisrXTtcbiAgICBxdWVyeUJ1Zi5wdXNoKHNlcGFyYXRvciwgZW5jb2RlVVJJQ29tcG9uZW50KGsudG9TdHJpbmcoKSkpO1xuICAgIHNlcGFyYXRvciA9ICcmJztcbiAgICBpZiAodikge1xuICAgICAgcXVlcnlCdWYucHVzaCgnPScsIGVuY29kZVVSSUNvbXBvbmVudCh2LnRvU3RyaW5nKCkpKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5xdWVyeV8gPSBxdWVyeUJ1Zi5qb2luKCcnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuVVJJLnByb3RvdHlwZS5jaGVja1BhcmFtZXRlckNhY2hlXyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLnBhcmFtQ2FjaGVfKSB7XG4gICAgdmFyIHEgPSB0aGlzLnF1ZXJ5XztcbiAgICBpZiAoIXEpIHtcbiAgICAgIHRoaXMucGFyYW1DYWNoZV8gPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGNnaVBhcmFtcyA9IHEuc3BsaXQoL1smXFw/XS8pO1xuICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgdmFyIGsgPSAtMTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2dpUGFyYW1zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBtID0gY2dpUGFyYW1zW2ldLm1hdGNoKC9eKFtePV0qKSg/Oj0oLiopKT8kLyk7XG4gICAgICAgIC8vIEZyb20gaHR0cDovL3d3dy53My5vcmcvQWRkcmVzc2luZy9VUkwvNF9VUklfUmVjb21tZW50YXRpb25zLmh0bWxcbiAgICAgICAgLy8gV2l0aGluIHRoZSBxdWVyeSBzdHJpbmcsIHRoZSBwbHVzIHNpZ24gaXMgcmVzZXJ2ZWQgYXMgc2hvcnRoYW5kXG4gICAgICAgIC8vIG5vdGF0aW9uIGZvciBhIHNwYWNlLlxuICAgICAgICBvdXRbKytrXSA9IGRlY29kZVVSSUNvbXBvbmVudChtWzFdKS5yZXBsYWNlKC9cXCsvZywgJyAnKTtcbiAgICAgICAgb3V0Wysra10gPSBkZWNvZGVVUklDb21wb25lbnQobVsyXSB8fCAnJykucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgICB9XG4gICAgICB0aGlzLnBhcmFtQ2FjaGVfID0gb3V0O1xuICAgIH1cbiAgfVxufTtcbi8qKlxuICogc2V0cyB0aGUgdmFsdWVzIG9mIHRoZSBuYW1lZCBjZ2kgcGFyYW1ldGVycy5cbiAqXG4gKiA8cD5TbywgPGNvZGU+dXJpLnBhcnNlKCdmb28/YT1iJmM9ZCZlPWYnKS5zZXRQYXJhbWV0ZXJWYWx1ZXMoJ2MnLCBbJ25ldyddKVxuICogPC9jb2RlPiB5aWVsZHMgPHR0PmZvbz9hPWImYz1uZXcmZT1mPC90dD4uPC9wPlxuICpcbiAqIEBwYXJhbSBrZXkge3N0cmluZ31cbiAqIEBwYXJhbSB2YWx1ZXMge0FycmF5LjxzdHJpbmc+fSB0aGUgbmV3IHZhbHVlcy4gIElmIHZhbHVlcyBpcyBhIHNpbmdsZSBzdHJpbmdcbiAqICAgdGhlbiBpdCB3aWxsIGJlIHRyZWF0ZWQgYXMgdGhlIHNvbGUgdmFsdWUuXG4gKi9cblVSSS5wcm90b3R5cGUuc2V0UGFyYW1ldGVyVmFsdWVzID0gZnVuY3Rpb24gKGtleSwgdmFsdWVzKSB7XG4gIC8vIGJlIG5pY2UgYW5kIGF2b2lkIHN1YnRsZSBidWdzIHdoZXJlIFtdIG9wZXJhdG9yIG9uIHN0cmluZyBwZXJmb3JtcyBjaGFyQXRcbiAgLy8gb24gc29tZSBicm93c2VycyBhbmQgY3Jhc2hlcyBvbiBJRVxuICBpZiAodHlwZW9mIHZhbHVlcyA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZXMgPSBbIHZhbHVlcyBdO1xuICB9XG5cbiAgdGhpcy5jaGVja1BhcmFtZXRlckNhY2hlXygpO1xuICB2YXIgbmV3VmFsdWVJbmRleCA9IDA7XG4gIHZhciBwYyA9IHRoaXMucGFyYW1DYWNoZV87XG4gIHZhciBwYXJhbXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGsgPSAwOyBpIDwgcGMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBpZiAoa2V5ID09PSBwY1tpXSkge1xuICAgICAgaWYgKG5ld1ZhbHVlSW5kZXggPCB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgIHBhcmFtcy5wdXNoKGtleSwgdmFsdWVzW25ld1ZhbHVlSW5kZXgrK10pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMucHVzaChwY1tpXSwgcGNbaSArIDFdKTtcbiAgICB9XG4gIH1cbiAgd2hpbGUgKG5ld1ZhbHVlSW5kZXggPCB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgcGFyYW1zLnB1c2goa2V5LCB2YWx1ZXNbbmV3VmFsdWVJbmRleCsrXSk7XG4gIH1cbiAgdGhpcy5zZXRBbGxQYXJhbWV0ZXJzKHBhcmFtcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUucmVtb3ZlUGFyYW1ldGVyID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5zZXRQYXJhbWV0ZXJWYWx1ZXMoa2V5LCBbXSk7XG59O1xuLyoqXG4gKiByZXR1cm5zIHRoZSBwYXJhbWV0ZXJzIHNwZWNpZmllZCBpbiB0aGUgcXVlcnkgcGFydCBvZiB0aGUgdXJpIGFzIGEgbGlzdCBvZlxuICoga2V5cyBhbmQgdmFsdWVzIGxpa2UgWyBrZXkwLCB2YWx1ZTAsIGtleTEsIHZhbHVlMSwgLi4uIF0uXG4gKlxuICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59XG4gKi9cblVSSS5wcm90b3R5cGUuZ2V0QWxsUGFyYW1ldGVycyA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5jaGVja1BhcmFtZXRlckNhY2hlXygpO1xuICByZXR1cm4gdGhpcy5wYXJhbUNhY2hlXy5zbGljZSgwLCB0aGlzLnBhcmFtQ2FjaGVfLmxlbmd0aCk7XG59O1xuLyoqXG4gKiByZXR1cm5zIHRoZSB2YWx1ZTxiPnM8L2I+IGZvciBhIGdpdmVuIGNnaSBwYXJhbWV0ZXIgYXMgYSBsaXN0IG9mIGRlY29kZWRcbiAqIHF1ZXJ5IHBhcmFtZXRlciB2YWx1ZXMuXG4gKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn1cbiAqL1xuVVJJLnByb3RvdHlwZS5nZXRQYXJhbWV0ZXJWYWx1ZXMgPSBmdW5jdGlvbiAocGFyYW1OYW1lVW5lc2NhcGVkKSB7XG4gIHRoaXMuY2hlY2tQYXJhbWV0ZXJDYWNoZV8oKTtcbiAgdmFyIHZhbHVlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1DYWNoZV8ubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBpZiAocGFyYW1OYW1lVW5lc2NhcGVkID09PSB0aGlzLnBhcmFtQ2FjaGVfW2ldKSB7XG4gICAgICB2YWx1ZXMucHVzaCh0aGlzLnBhcmFtQ2FjaGVfW2kgKyAxXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZXM7XG59O1xuLyoqXG4gKiByZXR1cm5zIGEgbWFwIG9mIGNnaSBwYXJhbWV0ZXIgbmFtZXMgdG8gKG5vbi1lbXB0eSkgbGlzdHMgb2YgdmFsdWVzLlxuICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsQXJyYXkuPHN0cmluZz4+fVxuICovXG5VUkkucHJvdG90eXBlLmdldFBhcmFtZXRlck1hcCA9IGZ1bmN0aW9uIChwYXJhbU5hbWVVbmVzY2FwZWQpIHtcbiAgdGhpcy5jaGVja1BhcmFtZXRlckNhY2hlXygpO1xuICB2YXIgcGFyYW1NYXAgPSB7fTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBhcmFtQ2FjaGVfLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgdmFyIGtleSA9IHRoaXMucGFyYW1DYWNoZV9baSsrXSxcbiAgICAgIHZhbHVlID0gdGhpcy5wYXJhbUNhY2hlX1tpKytdO1xuICAgIGlmICghKGtleSBpbiBwYXJhbU1hcCkpIHtcbiAgICAgIHBhcmFtTWFwW2tleV0gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbU1hcFtrZXldLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcGFyYW1NYXA7XG59O1xuLyoqXG4gKiByZXR1cm5zIHRoZSBmaXJzdCB2YWx1ZSBmb3IgYSBnaXZlbiBjZ2kgcGFyYW1ldGVyIG9yIG51bGwgaWYgdGhlIGdpdmVuXG4gKiBwYXJhbWV0ZXIgbmFtZSBkb2VzIG5vdCBhcHBlYXIgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cbiAqIElmIHRoZSBnaXZlbiBwYXJhbWV0ZXIgbmFtZSBkb2VzIGFwcGVhciwgYnV0IGhhcyBubyAnPHR0Pj08L3R0PicgZm9sbG93aW5nXG4gKiBpdCwgdGhlbiB0aGUgZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQuXG4gKiBAcmV0dXJuIHtzdHJpbmd8bnVsbH1cbiAqL1xuVVJJLnByb3RvdHlwZS5nZXRQYXJhbWV0ZXJWYWx1ZSA9IGZ1bmN0aW9uIChwYXJhbU5hbWVVbmVzY2FwZWQpIHtcbiAgdGhpcy5jaGVja1BhcmFtZXRlckNhY2hlXygpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1DYWNoZV8ubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBpZiAocGFyYW1OYW1lVW5lc2NhcGVkID09PSB0aGlzLnBhcmFtQ2FjaGVfW2ldKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJhbUNhY2hlX1tpICsgMV07XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufTtcblxuVVJJLnByb3RvdHlwZS5nZXRGcmFnbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZnJhZ21lbnRfICYmIGRlY29kZVVSSUNvbXBvbmVudCh0aGlzLmZyYWdtZW50Xyk7XG59O1xuVVJJLnByb3RvdHlwZS5nZXRSYXdGcmFnbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZnJhZ21lbnRfO1xufTtcblVSSS5wcm90b3R5cGUuc2V0RnJhZ21lbnQgPSBmdW5jdGlvbiAobmV3RnJhZ21lbnQpIHtcbiAgdGhpcy5mcmFnbWVudF8gPSBuZXdGcmFnbWVudCA/IGVuY29kZVVSSUNvbXBvbmVudChuZXdGcmFnbWVudCkgOiBudWxsO1xuICByZXR1cm4gdGhpcztcbn07XG5VUkkucHJvdG90eXBlLnNldFJhd0ZyYWdtZW50ID0gZnVuY3Rpb24gKG5ld0ZyYWdtZW50KSB7XG4gIHRoaXMuZnJhZ21lbnRfID0gbmV3RnJhZ21lbnQgPyBuZXdGcmFnbWVudCA6IG51bGw7XG4gIHJldHVybiB0aGlzO1xufTtcblVSSS5wcm90b3R5cGUuaGFzRnJhZ21lbnQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBudWxsICE9PSB0aGlzLmZyYWdtZW50Xztcbn07XG5cbmZ1bmN0aW9uIG51bGxJZkFic2VudChtYXRjaFBhcnQpIHtcbiAgcmV0dXJuICgnc3RyaW5nJyA9PSB0eXBlb2YgbWF0Y2hQYXJ0KSAmJiAobWF0Y2hQYXJ0Lmxlbmd0aCA+IDApXG4gICAgICAgICA/IG1hdGNoUGFydFxuICAgICAgICAgOiBudWxsO1xufVxuXG5cblxuXG4vKipcbiAqIGEgcmVndWxhciBleHByZXNzaW9uIGZvciBicmVha2luZyBhIFVSSSBpbnRvIGl0cyBjb21wb25lbnQgcGFydHMuXG4gKlxuICogPHA+aHR0cDovL3d3dy5nYml2LmNvbS9wcm90b2NvbHMvdXJpL3JmYy9yZmMzOTg2Lmh0bWwjUkZDMjIzNCBzYXlzXG4gKiBBcyB0aGUgXCJmaXJzdC1tYXRjaC13aW5zXCIgYWxnb3JpdGhtIGlzIGlkZW50aWNhbCB0byB0aGUgXCJncmVlZHlcIlxuICogZGlzYW1iaWd1YXRpb24gbWV0aG9kIHVzZWQgYnkgUE9TSVggcmVndWxhciBleHByZXNzaW9ucywgaXQgaXMgbmF0dXJhbCBhbmRcbiAqIGNvbW1vbnBsYWNlIHRvIHVzZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBmb3IgcGFyc2luZyB0aGUgcG90ZW50aWFsIGZpdmVcbiAqIGNvbXBvbmVudHMgb2YgYSBVUkkgcmVmZXJlbmNlLlxuICpcbiAqIDxwPlRoZSBmb2xsb3dpbmcgbGluZSBpcyB0aGUgcmVndWxhciBleHByZXNzaW9uIGZvciBicmVha2luZy1kb3duIGFcbiAqIHdlbGwtZm9ybWVkIFVSSSByZWZlcmVuY2UgaW50byBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiA8cHJlPlxuICogXigoW146Lz8jXSspOik/KC8vKFteLz8jXSopKT8oW14/I10qKShcXD8oW14jXSopKT8oIyguKikpP1xuICogIDEyICAgICAgICAgICAgMyAgNCAgICAgICAgICA1ICAgICAgIDYgIDcgICAgICAgIDggOVxuICogPC9wcmU+XG4gKlxuICogPHA+VGhlIG51bWJlcnMgaW4gdGhlIHNlY29uZCBsaW5lIGFib3ZlIGFyZSBvbmx5IHRvIGFzc2lzdCByZWFkYWJpbGl0eTsgdGhleVxuICogaW5kaWNhdGUgdGhlIHJlZmVyZW5jZSBwb2ludHMgZm9yIGVhY2ggc3ViZXhwcmVzc2lvbiAoaS5lLiwgZWFjaCBwYWlyZWRcbiAqIHBhcmVudGhlc2lzKS4gV2UgcmVmZXIgdG8gdGhlIHZhbHVlIG1hdGNoZWQgZm9yIHN1YmV4cHJlc3Npb24gPG4+IGFzICQ8bj4uXG4gKiBGb3IgZXhhbXBsZSwgbWF0Y2hpbmcgdGhlIGFib3ZlIGV4cHJlc3Npb24gdG9cbiAqIDxwcmU+XG4gKiAgICAgaHR0cDovL3d3dy5pY3MudWNpLmVkdS9wdWIvaWV0Zi91cmkvI1JlbGF0ZWRcbiAqIDwvcHJlPlxuICogcmVzdWx0cyBpbiB0aGUgZm9sbG93aW5nIHN1YmV4cHJlc3Npb24gbWF0Y2hlczpcbiAqIDxwcmU+XG4gKiAgICAkMSA9IGh0dHA6XG4gKiAgICAkMiA9IGh0dHBcbiAqICAgICQzID0gLy93d3cuaWNzLnVjaS5lZHVcbiAqICAgICQ0ID0gd3d3Lmljcy51Y2kuZWR1XG4gKiAgICAkNSA9IC9wdWIvaWV0Zi91cmkvXG4gKiAgICAkNiA9IDx1bmRlZmluZWQ+XG4gKiAgICAkNyA9IDx1bmRlZmluZWQ+XG4gKiAgICAkOCA9ICNSZWxhdGVkXG4gKiAgICAkOSA9IFJlbGF0ZWRcbiAqIDwvcHJlPlxuICogd2hlcmUgPHVuZGVmaW5lZD4gaW5kaWNhdGVzIHRoYXQgdGhlIGNvbXBvbmVudCBpcyBub3QgcHJlc2VudCwgYXMgaXMgdGhlXG4gKiBjYXNlIGZvciB0aGUgcXVlcnkgY29tcG9uZW50IGluIHRoZSBhYm92ZSBleGFtcGxlLiBUaGVyZWZvcmUsIHdlIGNhblxuICogZGV0ZXJtaW5lIHRoZSB2YWx1ZSBvZiB0aGUgZml2ZSBjb21wb25lbnRzIGFzXG4gKiA8cHJlPlxuICogICAgc2NoZW1lICAgID0gJDJcbiAqICAgIGF1dGhvcml0eSA9ICQ0XG4gKiAgICBwYXRoICAgICAgPSAkNVxuICogICAgcXVlcnkgICAgID0gJDdcbiAqICAgIGZyYWdtZW50ICA9ICQ5XG4gKiA8L3ByZT5cbiAqXG4gKiA8cD5tc2FtdWVsOiBJIGhhdmUgbW9kaWZpZWQgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBzbGlnaHRseSB0byBleHBvc2UgdGhlXG4gKiBjcmVkZW50aWFscywgZG9tYWluLCBhbmQgcG9ydCBzZXBhcmF0ZWx5IGZyb20gdGhlIGF1dGhvcml0eS5cbiAqIFRoZSBtb2RpZmllZCB2ZXJzaW9uIHlpZWxkc1xuICogPHByZT5cbiAqICAgICQxID0gaHR0cCAgICAgICAgICAgICAgc2NoZW1lXG4gKiAgICAkMiA9IDx1bmRlZmluZWQ+ICAgICAgIGNyZWRlbnRpYWxzIC1cXFxuICogICAgJDMgPSB3d3cuaWNzLnVjaS5lZHUgICBkb21haW4gICAgICAgfCBhdXRob3JpdHlcbiAqICAgICQ0ID0gPHVuZGVmaW5lZD4gICAgICAgcG9ydCAgICAgICAgLS9cbiAqICAgICQ1ID0gL3B1Yi9pZXRmL3VyaS8gICAgcGF0aFxuICogICAgJDYgPSA8dW5kZWZpbmVkPiAgICAgICBxdWVyeSB3aXRob3V0ID9cbiAqICAgICQ3ID0gUmVsYXRlZCAgICAgICAgICAgZnJhZ21lbnQgd2l0aG91dCAjXG4gKiA8L3ByZT5cbiAqL1xudmFyIFVSSV9SRV8gPSBuZXcgUmVnRXhwKFxuICAgICAgXCJeXCIgK1xuICAgICAgXCIoPzpcIiArXG4gICAgICAgIFwiKFteOi8/I10rKVwiICsgICAgICAgICAvLyBzY2hlbWVcbiAgICAgIFwiOik/XCIgK1xuICAgICAgXCIoPzovL1wiICtcbiAgICAgICAgXCIoPzooW14vPyNdKilAKT9cIiArICAgIC8vIGNyZWRlbnRpYWxzXG4gICAgICAgIFwiKFteLz8jOkBdKilcIiArICAgICAgICAvLyBkb21haW5cbiAgICAgICAgXCIoPzo6KFswLTldKykpP1wiICsgICAgIC8vIHBvcnRcbiAgICAgIFwiKT9cIiArXG4gICAgICBcIihbXj8jXSspP1wiICsgICAgICAgICAgICAvLyBwYXRoXG4gICAgICBcIig/OlxcXFw/KFteI10qKSk/XCIgKyAgICAgIC8vIHF1ZXJ5XG4gICAgICBcIig/OiMoLiopKT9cIiArICAgICAgICAgICAvLyBmcmFnbWVudFxuICAgICAgXCIkXCJcbiAgICAgICk7XG5cbnZhciBVUklfRElTQUxMT1dFRF9JTl9TQ0hFTUVfT1JfQ1JFREVOVElBTFNfID0gL1sjXFwvXFw/QF0vZztcbnZhciBVUklfRElTQUxMT1dFRF9JTl9QQVRIXyA9IC9bXFwjXFw/XS9nO1xuXG5VUkkucGFyc2UgPSBwYXJzZTtcblVSSS5jcmVhdGUgPSBjcmVhdGU7XG5VUkkucmVzb2x2ZSA9IHJlc29sdmU7XG5VUkkuY29sbGFwc2VfZG90cyA9IGNvbGxhcHNlX2RvdHM7ICAvLyBWaXNpYmxlIGZvciB0ZXN0aW5nLlxuXG4vLyBsaWdodHdlaWdodCBzdHJpbmctYmFzZWQgYXBpIGZvciBsb2FkTW9kdWxlTWFrZXJcblVSSS51dGlscyA9IHtcbiAgbWltZVR5cGVPZjogZnVuY3Rpb24gKHVyaSkge1xuICAgIHZhciB1cmlPYmogPSBwYXJzZSh1cmkpO1xuICAgIGlmICgvXFwuaHRtbCQvLnRlc3QodXJpT2JqLmdldFBhdGgoKSkpIHtcbiAgICAgIHJldHVybiAndGV4dC9odG1sJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JztcbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IGZ1bmN0aW9uIChiYXNlLCB1cmkpIHtcbiAgICBpZiAoYmFzZSkge1xuICAgICAgcmV0dXJuIHJlc29sdmUocGFyc2UoYmFzZSksIHBhcnNlKHVyaSkpLnRvU3RyaW5nKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJyArIHVyaTtcbiAgICB9XG4gIH1cbn07XG5cblxucmV0dXJuIFVSSTtcbn0pKCk7XG5cbi8vIENvcHlyaWdodCBHb29nbGUgSW5jLlxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbmNlIFZlcnNpb24gMi4wXG4vLyBBdXRvZ2VuZXJhdGVkIGF0IE1vbiBGZWIgMjUgMTM6MDU6NDIgRVNUIDIwMTNcbi8vIEBvdmVycmlkZXMgd2luZG93XG4vLyBAcHJvdmlkZXMgaHRtbDRcbnZhciBodG1sNCA9IHt9O1xuaHRtbDQuYXR5cGUgPSB7XG4gICdOT05FJzogMCxcbiAgJ1VSSSc6IDEsXG4gICdVUklfRlJBR01FTlQnOiAxMSxcbiAgJ1NDUklQVCc6IDIsXG4gICdTVFlMRSc6IDMsXG4gICdIVE1MJzogMTIsXG4gICdJRCc6IDQsXG4gICdJRFJFRic6IDUsXG4gICdJRFJFRlMnOiA2LFxuICAnR0xPQkFMX05BTUUnOiA3LFxuICAnTE9DQUxfTkFNRSc6IDgsXG4gICdDTEFTU0VTJzogOSxcbiAgJ0ZSQU1FX1RBUkdFVCc6IDEwLFxuICAnTUVESUFfUVVFUlknOiAxM1xufTtcbmh0bWw0WyAnYXR5cGUnIF0gPSBodG1sNC5hdHlwZTtcbmh0bWw0LkFUVFJJQlMgPSB7XG4gICcqOjpjbGFzcyc6IDksXG4gICcqOjpkaXInOiAwLFxuICAnKjo6ZHJhZ2dhYmxlJzogMCxcbiAgJyo6OmhpZGRlbic6IDAsXG4gICcqOjppZCc6IDQsXG4gICcqOjppbmVydCc6IDAsXG4gICcqOjppdGVtcHJvcCc6IDAsXG4gICcqOjppdGVtcmVmJzogNixcbiAgJyo6Oml0ZW1zY29wZSc6IDAsXG4gICcqOjpsYW5nJzogMCxcbiAgJyo6Om9uYmx1cic6IDIsXG4gICcqOjpvbmNoYW5nZSc6IDIsXG4gICcqOjpvbmNsaWNrJzogMixcbiAgJyo6Om9uZGJsY2xpY2snOiAyLFxuICAnKjo6b25mb2N1cyc6IDIsXG4gICcqOjpvbmtleWRvd24nOiAyLFxuICAnKjo6b25rZXlwcmVzcyc6IDIsXG4gICcqOjpvbmtleXVwJzogMixcbiAgJyo6Om9ubG9hZCc6IDIsXG4gICcqOjpvbm1vdXNlZG93bic6IDIsXG4gICcqOjpvbm1vdXNlbW92ZSc6IDIsXG4gICcqOjpvbm1vdXNlb3V0JzogMixcbiAgJyo6Om9ubW91c2VvdmVyJzogMixcbiAgJyo6Om9ubW91c2V1cCc6IDIsXG4gICcqOjpvbnJlc2V0JzogMixcbiAgJyo6Om9uc2Nyb2xsJzogMixcbiAgJyo6Om9uc2VsZWN0JzogMixcbiAgJyo6Om9uc3VibWl0JzogMixcbiAgJyo6Om9udW5sb2FkJzogMixcbiAgJyo6OnNwZWxsY2hlY2snOiAwLFxuICAnKjo6c3R5bGUnOiAzLFxuICAnKjo6dGl0bGUnOiAwLFxuICAnKjo6dHJhbnNsYXRlJzogMCxcbiAgJ2E6OmFjY2Vzc2tleSc6IDAsXG4gICdhOjpjb29yZHMnOiAwLFxuICAnYTo6aHJlZic6IDEsXG4gICdhOjpocmVmbGFuZyc6IDAsXG4gICdhOjpuYW1lJzogNyxcbiAgJ2E6Om9uYmx1cic6IDIsXG4gICdhOjpvbmZvY3VzJzogMixcbiAgJ2E6OnNoYXBlJzogMCxcbiAgJ2E6OnRhYmluZGV4JzogMCxcbiAgJ2E6OnRhcmdldCc6IDEwLFxuICAnYTo6dHlwZSc6IDAsXG4gICdhcmVhOjphY2Nlc3NrZXknOiAwLFxuICAnYXJlYTo6YWx0JzogMCxcbiAgJ2FyZWE6OmNvb3Jkcyc6IDAsXG4gICdhcmVhOjpocmVmJzogMSxcbiAgJ2FyZWE6Om5vaHJlZic6IDAsXG4gICdhcmVhOjpvbmJsdXInOiAyLFxuICAnYXJlYTo6b25mb2N1cyc6IDIsXG4gICdhcmVhOjpzaGFwZSc6IDAsXG4gICdhcmVhOjp0YWJpbmRleCc6IDAsXG4gICdhcmVhOjp0YXJnZXQnOiAxMCxcbiAgJ2F1ZGlvOjpjb250cm9scyc6IDAsXG4gICdhdWRpbzo6bG9vcCc6IDAsXG4gICdhdWRpbzo6bWVkaWFncm91cCc6IDUsXG4gICdhdWRpbzo6bXV0ZWQnOiAwLFxuICAnYXVkaW86OnByZWxvYWQnOiAwLFxuICAnYmRvOjpkaXInOiAwLFxuICAnYmxvY2txdW90ZTo6Y2l0ZSc6IDEsXG4gICdicjo6Y2xlYXInOiAwLFxuICAnYnV0dG9uOjphY2Nlc3NrZXknOiAwLFxuICAnYnV0dG9uOjpkaXNhYmxlZCc6IDAsXG4gICdidXR0b246Om5hbWUnOiA4LFxuICAnYnV0dG9uOjpvbmJsdXInOiAyLFxuICAnYnV0dG9uOjpvbmZvY3VzJzogMixcbiAgJ2J1dHRvbjo6dGFiaW5kZXgnOiAwLFxuICAnYnV0dG9uOjp0eXBlJzogMCxcbiAgJ2J1dHRvbjo6dmFsdWUnOiAwLFxuICAnY2FudmFzOjpoZWlnaHQnOiAwLFxuICAnY2FudmFzOjp3aWR0aCc6IDAsXG4gICdjYXB0aW9uOjphbGlnbic6IDAsXG4gICdjb2w6OmFsaWduJzogMCxcbiAgJ2NvbDo6Y2hhcic6IDAsXG4gICdjb2w6OmNoYXJvZmYnOiAwLFxuICAnY29sOjpzcGFuJzogMCxcbiAgJ2NvbDo6dmFsaWduJzogMCxcbiAgJ2NvbDo6d2lkdGgnOiAwLFxuICAnY29sZ3JvdXA6OmFsaWduJzogMCxcbiAgJ2NvbGdyb3VwOjpjaGFyJzogMCxcbiAgJ2NvbGdyb3VwOjpjaGFyb2ZmJzogMCxcbiAgJ2NvbGdyb3VwOjpzcGFuJzogMCxcbiAgJ2NvbGdyb3VwOjp2YWxpZ24nOiAwLFxuICAnY29sZ3JvdXA6OndpZHRoJzogMCxcbiAgJ2NvbW1hbmQ6OmNoZWNrZWQnOiAwLFxuICAnY29tbWFuZDo6Y29tbWFuZCc6IDUsXG4gICdjb21tYW5kOjpkaXNhYmxlZCc6IDAsXG4gICdjb21tYW5kOjppY29uJzogMSxcbiAgJ2NvbW1hbmQ6OmxhYmVsJzogMCxcbiAgJ2NvbW1hbmQ6OnJhZGlvZ3JvdXAnOiAwLFxuICAnY29tbWFuZDo6dHlwZSc6IDAsXG4gICdkYXRhOjp2YWx1ZSc6IDAsXG4gICdkZWw6OmNpdGUnOiAxLFxuICAnZGVsOjpkYXRldGltZSc6IDAsXG4gICdkZXRhaWxzOjpvcGVuJzogMCxcbiAgJ2Rpcjo6Y29tcGFjdCc6IDAsXG4gICdkaXY6OmFsaWduJzogMCxcbiAgJ2RsOjpjb21wYWN0JzogMCxcbiAgJ2ZpZWxkc2V0OjpkaXNhYmxlZCc6IDAsXG4gICdmb250Ojpjb2xvcic6IDAsXG4gICdmb250OjpmYWNlJzogMCxcbiAgJ2ZvbnQ6OnNpemUnOiAwLFxuICAnZm9ybTo6YWNjZXB0JzogMCxcbiAgJ2Zvcm06OmFjdGlvbic6IDEsXG4gICdmb3JtOjphdXRvY29tcGxldGUnOiAwLFxuICAnZm9ybTo6ZW5jdHlwZSc6IDAsXG4gICdmb3JtOjptZXRob2QnOiAwLFxuICAnZm9ybTo6bmFtZSc6IDcsXG4gICdmb3JtOjpub3ZhbGlkYXRlJzogMCxcbiAgJ2Zvcm06Om9ucmVzZXQnOiAyLFxuICAnZm9ybTo6b25zdWJtaXQnOiAyLFxuICAnZm9ybTo6dGFyZ2V0JzogMTAsXG4gICdoMTo6YWxpZ24nOiAwLFxuICAnaDI6OmFsaWduJzogMCxcbiAgJ2gzOjphbGlnbic6IDAsXG4gICdoNDo6YWxpZ24nOiAwLFxuICAnaDU6OmFsaWduJzogMCxcbiAgJ2g2OjphbGlnbic6IDAsXG4gICdocjo6YWxpZ24nOiAwLFxuICAnaHI6Om5vc2hhZGUnOiAwLFxuICAnaHI6OnNpemUnOiAwLFxuICAnaHI6OndpZHRoJzogMCxcbiAgJ2lmcmFtZTo6YWxpZ24nOiAwLFxuICAnaWZyYW1lOjpmcmFtZWJvcmRlcic6IDAsXG4gICdpZnJhbWU6OmhlaWdodCc6IDAsXG4gICdpZnJhbWU6Om1hcmdpbmhlaWdodCc6IDAsXG4gICdpZnJhbWU6Om1hcmdpbndpZHRoJzogMCxcbiAgJ2lmcmFtZTo6d2lkdGgnOiAwLFxuICAnaW1nOjphbGlnbic6IDAsXG4gICdpbWc6OmFsdCc6IDAsXG4gICdpbWc6OmJvcmRlcic6IDAsXG4gICdpbWc6OmhlaWdodCc6IDAsXG4gICdpbWc6OmhzcGFjZSc6IDAsXG4gICdpbWc6OmlzbWFwJzogMCxcbiAgJ2ltZzo6bmFtZSc6IDcsXG4gICdpbWc6OnNyYyc6IDEsXG4gICdpbWc6OnVzZW1hcCc6IDExLFxuICAnaW1nOjp2c3BhY2UnOiAwLFxuICAnaW1nOjp3aWR0aCc6IDAsXG4gICdpbnB1dDo6YWNjZXB0JzogMCxcbiAgJ2lucHV0OjphY2Nlc3NrZXknOiAwLFxuICAnaW5wdXQ6OmFsaWduJzogMCxcbiAgJ2lucHV0OjphbHQnOiAwLFxuICAnaW5wdXQ6OmF1dG9jb21wbGV0ZSc6IDAsXG4gICdpbnB1dDo6Y2hlY2tlZCc6IDAsXG4gICdpbnB1dDo6ZGlzYWJsZWQnOiAwLFxuICAnaW5wdXQ6OmlucHV0bW9kZSc6IDAsXG4gICdpbnB1dDo6aXNtYXAnOiAwLFxuICAnaW5wdXQ6Omxpc3QnOiA1LFxuICAnaW5wdXQ6Om1heCc6IDAsXG4gICdpbnB1dDo6bWF4bGVuZ3RoJzogMCxcbiAgJ2lucHV0OjptaW4nOiAwLFxuICAnaW5wdXQ6Om11bHRpcGxlJzogMCxcbiAgJ2lucHV0OjpuYW1lJzogOCxcbiAgJ2lucHV0OjpvbmJsdXInOiAyLFxuICAnaW5wdXQ6Om9uY2hhbmdlJzogMixcbiAgJ2lucHV0OjpvbmZvY3VzJzogMixcbiAgJ2lucHV0OjpvbnNlbGVjdCc6IDIsXG4gICdpbnB1dDo6cGxhY2Vob2xkZXInOiAwLFxuICAnaW5wdXQ6OnJlYWRvbmx5JzogMCxcbiAgJ2lucHV0OjpyZXF1aXJlZCc6IDAsXG4gICdpbnB1dDo6c2l6ZSc6IDAsXG4gICdpbnB1dDo6c3JjJzogMSxcbiAgJ2lucHV0OjpzdGVwJzogMCxcbiAgJ2lucHV0Ojp0YWJpbmRleCc6IDAsXG4gICdpbnB1dDo6dHlwZSc6IDAsXG4gICdpbnB1dDo6dXNlbWFwJzogMTEsXG4gICdpbnB1dDo6dmFsdWUnOiAwLFxuICAnaW5zOjpjaXRlJzogMSxcbiAgJ2luczo6ZGF0ZXRpbWUnOiAwLFxuICAnbGFiZWw6OmFjY2Vzc2tleSc6IDAsXG4gICdsYWJlbDo6Zm9yJzogNSxcbiAgJ2xhYmVsOjpvbmJsdXInOiAyLFxuICAnbGFiZWw6Om9uZm9jdXMnOiAyLFxuICAnbGVnZW5kOjphY2Nlc3NrZXknOiAwLFxuICAnbGVnZW5kOjphbGlnbic6IDAsXG4gICdsaTo6dHlwZSc6IDAsXG4gICdsaTo6dmFsdWUnOiAwLFxuICAnbWFwOjpuYW1lJzogNyxcbiAgJ21lbnU6OmNvbXBhY3QnOiAwLFxuICAnbWVudTo6bGFiZWwnOiAwLFxuICAnbWVudTo6dHlwZSc6IDAsXG4gICdtZXRlcjo6aGlnaCc6IDAsXG4gICdtZXRlcjo6bG93JzogMCxcbiAgJ21ldGVyOjptYXgnOiAwLFxuICAnbWV0ZXI6Om1pbic6IDAsXG4gICdtZXRlcjo6dmFsdWUnOiAwLFxuICAnb2w6OmNvbXBhY3QnOiAwLFxuICAnb2w6OnJldmVyc2VkJzogMCxcbiAgJ29sOjpzdGFydCc6IDAsXG4gICdvbDo6dHlwZSc6IDAsXG4gICdvcHRncm91cDo6ZGlzYWJsZWQnOiAwLFxuICAnb3B0Z3JvdXA6OmxhYmVsJzogMCxcbiAgJ29wdGlvbjo6ZGlzYWJsZWQnOiAwLFxuICAnb3B0aW9uOjpsYWJlbCc6IDAsXG4gICdvcHRpb246OnNlbGVjdGVkJzogMCxcbiAgJ29wdGlvbjo6dmFsdWUnOiAwLFxuICAnb3V0cHV0Ojpmb3InOiA2LFxuICAnb3V0cHV0OjpuYW1lJzogOCxcbiAgJ3A6OmFsaWduJzogMCxcbiAgJ3ByZTo6d2lkdGgnOiAwLFxuICAncHJvZ3Jlc3M6Om1heCc6IDAsXG4gICdwcm9ncmVzczo6bWluJzogMCxcbiAgJ3Byb2dyZXNzOjp2YWx1ZSc6IDAsXG4gICdxOjpjaXRlJzogMSxcbiAgJ3NlbGVjdDo6YXV0b2NvbXBsZXRlJzogMCxcbiAgJ3NlbGVjdDo6ZGlzYWJsZWQnOiAwLFxuICAnc2VsZWN0OjptdWx0aXBsZSc6IDAsXG4gICdzZWxlY3Q6Om5hbWUnOiA4LFxuICAnc2VsZWN0OjpvbmJsdXInOiAyLFxuICAnc2VsZWN0OjpvbmNoYW5nZSc6IDIsXG4gICdzZWxlY3Q6Om9uZm9jdXMnOiAyLFxuICAnc2VsZWN0OjpyZXF1aXJlZCc6IDAsXG4gICdzZWxlY3Q6OnNpemUnOiAwLFxuICAnc2VsZWN0Ojp0YWJpbmRleCc6IDAsXG4gICdzb3VyY2U6OnR5cGUnOiAwLFxuICAndGFibGU6OmFsaWduJzogMCxcbiAgJ3RhYmxlOjpiZ2NvbG9yJzogMCxcbiAgJ3RhYmxlOjpib3JkZXInOiAwLFxuICAndGFibGU6OmNlbGxwYWRkaW5nJzogMCxcbiAgJ3RhYmxlOjpjZWxsc3BhY2luZyc6IDAsXG4gICd0YWJsZTo6ZnJhbWUnOiAwLFxuICAndGFibGU6OnJ1bGVzJzogMCxcbiAgJ3RhYmxlOjpzdW1tYXJ5JzogMCxcbiAgJ3RhYmxlOjp3aWR0aCc6IDAsXG4gICd0Ym9keTo6YWxpZ24nOiAwLFxuICAndGJvZHk6OmNoYXInOiAwLFxuICAndGJvZHk6OmNoYXJvZmYnOiAwLFxuICAndGJvZHk6OnZhbGlnbic6IDAsXG4gICd0ZDo6YWJicic6IDAsXG4gICd0ZDo6YWxpZ24nOiAwLFxuICAndGQ6OmF4aXMnOiAwLFxuICAndGQ6OmJnY29sb3InOiAwLFxuICAndGQ6OmNoYXInOiAwLFxuICAndGQ6OmNoYXJvZmYnOiAwLFxuICAndGQ6OmNvbHNwYW4nOiAwLFxuICAndGQ6OmhlYWRlcnMnOiA2LFxuICAndGQ6OmhlaWdodCc6IDAsXG4gICd0ZDo6bm93cmFwJzogMCxcbiAgJ3RkOjpyb3dzcGFuJzogMCxcbiAgJ3RkOjpzY29wZSc6IDAsXG4gICd0ZDo6dmFsaWduJzogMCxcbiAgJ3RkOjp3aWR0aCc6IDAsXG4gICd0ZXh0YXJlYTo6YWNjZXNza2V5JzogMCxcbiAgJ3RleHRhcmVhOjphdXRvY29tcGxldGUnOiAwLFxuICAndGV4dGFyZWE6OmNvbHMnOiAwLFxuICAndGV4dGFyZWE6OmRpc2FibGVkJzogMCxcbiAgJ3RleHRhcmVhOjppbnB1dG1vZGUnOiAwLFxuICAndGV4dGFyZWE6Om5hbWUnOiA4LFxuICAndGV4dGFyZWE6Om9uYmx1cic6IDIsXG4gICd0ZXh0YXJlYTo6b25jaGFuZ2UnOiAyLFxuICAndGV4dGFyZWE6Om9uZm9jdXMnOiAyLFxuICAndGV4dGFyZWE6Om9uc2VsZWN0JzogMixcbiAgJ3RleHRhcmVhOjpwbGFjZWhvbGRlcic6IDAsXG4gICd0ZXh0YXJlYTo6cmVhZG9ubHknOiAwLFxuICAndGV4dGFyZWE6OnJlcXVpcmVkJzogMCxcbiAgJ3RleHRhcmVhOjpyb3dzJzogMCxcbiAgJ3RleHRhcmVhOjp0YWJpbmRleCc6IDAsXG4gICd0ZXh0YXJlYTo6d3JhcCc6IDAsXG4gICd0Zm9vdDo6YWxpZ24nOiAwLFxuICAndGZvb3Q6OmNoYXInOiAwLFxuICAndGZvb3Q6OmNoYXJvZmYnOiAwLFxuICAndGZvb3Q6OnZhbGlnbic6IDAsXG4gICd0aDo6YWJicic6IDAsXG4gICd0aDo6YWxpZ24nOiAwLFxuICAndGg6OmF4aXMnOiAwLFxuICAndGg6OmJnY29sb3InOiAwLFxuICAndGg6OmNoYXInOiAwLFxuICAndGg6OmNoYXJvZmYnOiAwLFxuICAndGg6OmNvbHNwYW4nOiAwLFxuICAndGg6OmhlYWRlcnMnOiA2LFxuICAndGg6OmhlaWdodCc6IDAsXG4gICd0aDo6bm93cmFwJzogMCxcbiAgJ3RoOjpyb3dzcGFuJzogMCxcbiAgJ3RoOjpzY29wZSc6IDAsXG4gICd0aDo6dmFsaWduJzogMCxcbiAgJ3RoOjp3aWR0aCc6IDAsXG4gICd0aGVhZDo6YWxpZ24nOiAwLFxuICAndGhlYWQ6OmNoYXInOiAwLFxuICAndGhlYWQ6OmNoYXJvZmYnOiAwLFxuICAndGhlYWQ6OnZhbGlnbic6IDAsXG4gICd0cjo6YWxpZ24nOiAwLFxuICAndHI6OmJnY29sb3InOiAwLFxuICAndHI6OmNoYXInOiAwLFxuICAndHI6OmNoYXJvZmYnOiAwLFxuICAndHI6OnZhbGlnbic6IDAsXG4gICd0cmFjazo6ZGVmYXVsdCc6IDAsXG4gICd0cmFjazo6a2luZCc6IDAsXG4gICd0cmFjazo6bGFiZWwnOiAwLFxuICAndHJhY2s6OnNyY2xhbmcnOiAwLFxuICAndWw6OmNvbXBhY3QnOiAwLFxuICAndWw6OnR5cGUnOiAwLFxuICAndmlkZW86OmNvbnRyb2xzJzogMCxcbiAgJ3ZpZGVvOjpoZWlnaHQnOiAwLFxuICAndmlkZW86Omxvb3AnOiAwLFxuICAndmlkZW86Om1lZGlhZ3JvdXAnOiA1LFxuICAndmlkZW86Om11dGVkJzogMCxcbiAgJ3ZpZGVvOjpwb3N0ZXInOiAxLFxuICAndmlkZW86OnByZWxvYWQnOiAwLFxuICAndmlkZW86OndpZHRoJzogMFxufTtcbmh0bWw0WyAnQVRUUklCUycgXSA9IGh0bWw0LkFUVFJJQlM7XG5odG1sNC5lZmxhZ3MgPSB7XG4gICdPUFRJT05BTF9FTkRUQUcnOiAxLFxuICAnRU1QVFknOiAyLFxuICAnQ0RBVEEnOiA0LFxuICAnUkNEQVRBJzogOCxcbiAgJ1VOU0FGRSc6IDE2LFxuICAnRk9MREFCTEUnOiAzMixcbiAgJ1NDUklQVCc6IDY0LFxuICAnU1RZTEUnOiAxMjgsXG4gICdWSVJUVUFMSVpFRCc6IDI1NlxufTtcbmh0bWw0WyAnZWZsYWdzJyBdID0gaHRtbDQuZWZsYWdzO1xuaHRtbDQuRUxFTUVOVFMgPSB7XG4gICdhJzogMCxcbiAgJ2FiYnInOiAwLFxuICAnYWNyb255bSc6IDAsXG4gICdhZGRyZXNzJzogMCxcbiAgJ2FwcGxldCc6IDI3MixcbiAgJ2FyZWEnOiAyLFxuICAnYXJ0aWNsZSc6IDAsXG4gICdhc2lkZSc6IDAsXG4gICdhdWRpbyc6IDAsXG4gICdiJzogMCxcbiAgJ2Jhc2UnOiAyNzQsXG4gICdiYXNlZm9udCc6IDI3NCxcbiAgJ2JkaSc6IDAsXG4gICdiZG8nOiAwLFxuICAnYmlnJzogMCxcbiAgJ2Jsb2NrcXVvdGUnOiAwLFxuICAnYm9keSc6IDMwNSxcbiAgJ2JyJzogMixcbiAgJ2J1dHRvbic6IDAsXG4gICdjYW52YXMnOiAwLFxuICAnY2FwdGlvbic6IDAsXG4gICdjZW50ZXInOiAwLFxuICAnY2l0ZSc6IDAsXG4gICdjb2RlJzogMCxcbiAgJ2NvbCc6IDIsXG4gICdjb2xncm91cCc6IDEsXG4gICdjb21tYW5kJzogMixcbiAgJ2RhdGEnOiAwLFxuICAnZGF0YWxpc3QnOiAwLFxuICAnZGQnOiAxLFxuICAnZGVsJzogMCxcbiAgJ2RldGFpbHMnOiAwLFxuICAnZGZuJzogMCxcbiAgJ2RpYWxvZyc6IDI3MixcbiAgJ2Rpcic6IDAsXG4gICdkaXYnOiAwLFxuICAnZGwnOiAwLFxuICAnZHQnOiAxLFxuICAnZW0nOiAwLFxuICAnZmllbGRzZXQnOiAwLFxuICAnZmlnY2FwdGlvbic6IDAsXG4gICdmaWd1cmUnOiAwLFxuICAnZm9udCc6IDAsXG4gICdmb290ZXInOiAwLFxuICAnZm9ybSc6IDAsXG4gICdmcmFtZSc6IDI3NCxcbiAgJ2ZyYW1lc2V0JzogMjcyLFxuICAnaDEnOiAwLFxuICAnaDInOiAwLFxuICAnaDMnOiAwLFxuICAnaDQnOiAwLFxuICAnaDUnOiAwLFxuICAnaDYnOiAwLFxuICAnaGVhZCc6IDMwNSxcbiAgJ2hlYWRlcic6IDAsXG4gICdoZ3JvdXAnOiAwLFxuICAnaHInOiAyLFxuICAnaHRtbCc6IDMwNSxcbiAgJ2knOiAwLFxuICAnaWZyYW1lJzogNCxcbiAgJ2ltZyc6IDIsXG4gICdpbnB1dCc6IDIsXG4gICdpbnMnOiAwLFxuICAnaXNpbmRleCc6IDI3NCxcbiAgJ2tiZCc6IDAsXG4gICdrZXlnZW4nOiAyNzQsXG4gICdsYWJlbCc6IDAsXG4gICdsZWdlbmQnOiAwLFxuICAnbGknOiAxLFxuICAnbGluayc6IDI3NCxcbiAgJ21hcCc6IDAsXG4gICdtYXJrJzogMCxcbiAgJ21lbnUnOiAwLFxuICAnbWV0YSc6IDI3NCxcbiAgJ21ldGVyJzogMCxcbiAgJ25hdic6IDAsXG4gICdub2JyJzogMCxcbiAgJ25vZW1iZWQnOiAyNzYsXG4gICdub2ZyYW1lcyc6IDI3NixcbiAgJ25vc2NyaXB0JzogMjc2LFxuICAnb2JqZWN0JzogMjcyLFxuICAnb2wnOiAwLFxuICAnb3B0Z3JvdXAnOiAwLFxuICAnb3B0aW9uJzogMSxcbiAgJ291dHB1dCc6IDAsXG4gICdwJzogMSxcbiAgJ3BhcmFtJzogMjc0LFxuICAncHJlJzogMCxcbiAgJ3Byb2dyZXNzJzogMCxcbiAgJ3EnOiAwLFxuICAncyc6IDAsXG4gICdzYW1wJzogMCxcbiAgJ3NjcmlwdCc6IDg0LFxuICAnc2VjdGlvbic6IDAsXG4gICdzZWxlY3QnOiAwLFxuICAnc21hbGwnOiAwLFxuICAnc291cmNlJzogMixcbiAgJ3NwYW4nOiAwLFxuICAnc3RyaWtlJzogMCxcbiAgJ3N0cm9uZyc6IDAsXG4gICdzdHlsZSc6IDE0OCxcbiAgJ3N1Yic6IDAsXG4gICdzdW1tYXJ5JzogMCxcbiAgJ3N1cCc6IDAsXG4gICd0YWJsZSc6IDAsXG4gICd0Ym9keSc6IDEsXG4gICd0ZCc6IDEsXG4gICd0ZXh0YXJlYSc6IDgsXG4gICd0Zm9vdCc6IDEsXG4gICd0aCc6IDEsXG4gICd0aGVhZCc6IDEsXG4gICd0aW1lJzogMCxcbiAgJ3RpdGxlJzogMjgwLFxuICAndHInOiAxLFxuICAndHJhY2snOiAyLFxuICAndHQnOiAwLFxuICAndSc6IDAsXG4gICd1bCc6IDAsXG4gICd2YXInOiAwLFxuICAndmlkZW8nOiAwLFxuICAnd2JyJzogMlxufTtcbmh0bWw0WyAnRUxFTUVOVFMnIF0gPSBodG1sNC5FTEVNRU5UUztcbmh0bWw0LkVMRU1FTlRfRE9NX0lOVEVSRkFDRVMgPSB7XG4gICdhJzogJ0hUTUxBbmNob3JFbGVtZW50JyxcbiAgJ2FiYnInOiAnSFRNTEVsZW1lbnQnLFxuICAnYWNyb255bSc6ICdIVE1MRWxlbWVudCcsXG4gICdhZGRyZXNzJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2FwcGxldCc6ICdIVE1MQXBwbGV0RWxlbWVudCcsXG4gICdhcmVhJzogJ0hUTUxBcmVhRWxlbWVudCcsXG4gICdhcnRpY2xlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2FzaWRlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2F1ZGlvJzogJ0hUTUxBdWRpb0VsZW1lbnQnLFxuICAnYic6ICdIVE1MRWxlbWVudCcsXG4gICdiYXNlJzogJ0hUTUxCYXNlRWxlbWVudCcsXG4gICdiYXNlZm9udCc6ICdIVE1MQmFzZUZvbnRFbGVtZW50JyxcbiAgJ2JkaSc6ICdIVE1MRWxlbWVudCcsXG4gICdiZG8nOiAnSFRNTEVsZW1lbnQnLFxuICAnYmlnJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2Jsb2NrcXVvdGUnOiAnSFRNTFF1b3RlRWxlbWVudCcsXG4gICdib2R5JzogJ0hUTUxCb2R5RWxlbWVudCcsXG4gICdicic6ICdIVE1MQlJFbGVtZW50JyxcbiAgJ2J1dHRvbic6ICdIVE1MQnV0dG9uRWxlbWVudCcsXG4gICdjYW52YXMnOiAnSFRNTENhbnZhc0VsZW1lbnQnLFxuICAnY2FwdGlvbic6ICdIVE1MVGFibGVDYXB0aW9uRWxlbWVudCcsXG4gICdjZW50ZXInOiAnSFRNTEVsZW1lbnQnLFxuICAnY2l0ZSc6ICdIVE1MRWxlbWVudCcsXG4gICdjb2RlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2NvbCc6ICdIVE1MVGFibGVDb2xFbGVtZW50JyxcbiAgJ2NvbGdyb3VwJzogJ0hUTUxUYWJsZUNvbEVsZW1lbnQnLFxuICAnY29tbWFuZCc6ICdIVE1MQ29tbWFuZEVsZW1lbnQnLFxuICAnZGF0YSc6ICdIVE1MRWxlbWVudCcsXG4gICdkYXRhbGlzdCc6ICdIVE1MRGF0YUxpc3RFbGVtZW50JyxcbiAgJ2RkJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2RlbCc6ICdIVE1MTW9kRWxlbWVudCcsXG4gICdkZXRhaWxzJzogJ0hUTUxEZXRhaWxzRWxlbWVudCcsXG4gICdkZm4nOiAnSFRNTEVsZW1lbnQnLFxuICAnZGlhbG9nJzogJ0hUTUxEaWFsb2dFbGVtZW50JyxcbiAgJ2Rpcic6ICdIVE1MRGlyZWN0b3J5RWxlbWVudCcsXG4gICdkaXYnOiAnSFRNTERpdkVsZW1lbnQnLFxuICAnZGwnOiAnSFRNTERMaXN0RWxlbWVudCcsXG4gICdkdCc6ICdIVE1MRWxlbWVudCcsXG4gICdlbSc6ICdIVE1MRWxlbWVudCcsXG4gICdmaWVsZHNldCc6ICdIVE1MRmllbGRTZXRFbGVtZW50JyxcbiAgJ2ZpZ2NhcHRpb24nOiAnSFRNTEVsZW1lbnQnLFxuICAnZmlndXJlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2ZvbnQnOiAnSFRNTEZvbnRFbGVtZW50JyxcbiAgJ2Zvb3Rlcic6ICdIVE1MRWxlbWVudCcsXG4gICdmb3JtJzogJ0hUTUxGb3JtRWxlbWVudCcsXG4gICdmcmFtZSc6ICdIVE1MRnJhbWVFbGVtZW50JyxcbiAgJ2ZyYW1lc2V0JzogJ0hUTUxGcmFtZVNldEVsZW1lbnQnLFxuICAnaDEnOiAnSFRNTEhlYWRpbmdFbGVtZW50JyxcbiAgJ2gyJzogJ0hUTUxIZWFkaW5nRWxlbWVudCcsXG4gICdoMyc6ICdIVE1MSGVhZGluZ0VsZW1lbnQnLFxuICAnaDQnOiAnSFRNTEhlYWRpbmdFbGVtZW50JyxcbiAgJ2g1JzogJ0hUTUxIZWFkaW5nRWxlbWVudCcsXG4gICdoNic6ICdIVE1MSGVhZGluZ0VsZW1lbnQnLFxuICAnaGVhZCc6ICdIVE1MSGVhZEVsZW1lbnQnLFxuICAnaGVhZGVyJzogJ0hUTUxFbGVtZW50JyxcbiAgJ2hncm91cCc6ICdIVE1MRWxlbWVudCcsXG4gICdocic6ICdIVE1MSFJFbGVtZW50JyxcbiAgJ2h0bWwnOiAnSFRNTEh0bWxFbGVtZW50JyxcbiAgJ2knOiAnSFRNTEVsZW1lbnQnLFxuICAnaWZyYW1lJzogJ0hUTUxJRnJhbWVFbGVtZW50JyxcbiAgJ2ltZyc6ICdIVE1MSW1hZ2VFbGVtZW50JyxcbiAgJ2lucHV0JzogJ0hUTUxJbnB1dEVsZW1lbnQnLFxuICAnaW5zJzogJ0hUTUxNb2RFbGVtZW50JyxcbiAgJ2lzaW5kZXgnOiAnSFRNTFVua25vd25FbGVtZW50JyxcbiAgJ2tiZCc6ICdIVE1MRWxlbWVudCcsXG4gICdrZXlnZW4nOiAnSFRNTEtleWdlbkVsZW1lbnQnLFxuICAnbGFiZWwnOiAnSFRNTExhYmVsRWxlbWVudCcsXG4gICdsZWdlbmQnOiAnSFRNTExlZ2VuZEVsZW1lbnQnLFxuICAnbGknOiAnSFRNTExJRWxlbWVudCcsXG4gICdsaW5rJzogJ0hUTUxMaW5rRWxlbWVudCcsXG4gICdtYXAnOiAnSFRNTE1hcEVsZW1lbnQnLFxuICAnbWFyayc6ICdIVE1MRWxlbWVudCcsXG4gICdtZW51JzogJ0hUTUxNZW51RWxlbWVudCcsXG4gICdtZXRhJzogJ0hUTUxNZXRhRWxlbWVudCcsXG4gICdtZXRlcic6ICdIVE1MTWV0ZXJFbGVtZW50JyxcbiAgJ25hdic6ICdIVE1MRWxlbWVudCcsXG4gICdub2JyJzogJ0hUTUxFbGVtZW50JyxcbiAgJ25vZW1iZWQnOiAnSFRNTEVsZW1lbnQnLFxuICAnbm9mcmFtZXMnOiAnSFRNTEVsZW1lbnQnLFxuICAnbm9zY3JpcHQnOiAnSFRNTEVsZW1lbnQnLFxuICAnb2JqZWN0JzogJ0hUTUxPYmplY3RFbGVtZW50JyxcbiAgJ29sJzogJ0hUTUxPTGlzdEVsZW1lbnQnLFxuICAnb3B0Z3JvdXAnOiAnSFRNTE9wdEdyb3VwRWxlbWVudCcsXG4gICdvcHRpb24nOiAnSFRNTE9wdGlvbkVsZW1lbnQnLFxuICAnb3V0cHV0JzogJ0hUTUxPdXRwdXRFbGVtZW50JyxcbiAgJ3AnOiAnSFRNTFBhcmFncmFwaEVsZW1lbnQnLFxuICAncGFyYW0nOiAnSFRNTFBhcmFtRWxlbWVudCcsXG4gICdwcmUnOiAnSFRNTFByZUVsZW1lbnQnLFxuICAncHJvZ3Jlc3MnOiAnSFRNTFByb2dyZXNzRWxlbWVudCcsXG4gICdxJzogJ0hUTUxRdW90ZUVsZW1lbnQnLFxuICAncyc6ICdIVE1MRWxlbWVudCcsXG4gICdzYW1wJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3NjcmlwdCc6ICdIVE1MU2NyaXB0RWxlbWVudCcsXG4gICdzZWN0aW9uJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3NlbGVjdCc6ICdIVE1MU2VsZWN0RWxlbWVudCcsXG4gICdzbWFsbCc6ICdIVE1MRWxlbWVudCcsXG4gICdzb3VyY2UnOiAnSFRNTFNvdXJjZUVsZW1lbnQnLFxuICAnc3Bhbic6ICdIVE1MU3BhbkVsZW1lbnQnLFxuICAnc3RyaWtlJzogJ0hUTUxFbGVtZW50JyxcbiAgJ3N0cm9uZyc6ICdIVE1MRWxlbWVudCcsXG4gICdzdHlsZSc6ICdIVE1MU3R5bGVFbGVtZW50JyxcbiAgJ3N1Yic6ICdIVE1MRWxlbWVudCcsXG4gICdzdW1tYXJ5JzogJ0hUTUxFbGVtZW50JyxcbiAgJ3N1cCc6ICdIVE1MRWxlbWVudCcsXG4gICd0YWJsZSc6ICdIVE1MVGFibGVFbGVtZW50JyxcbiAgJ3Rib2R5JzogJ0hUTUxUYWJsZVNlY3Rpb25FbGVtZW50JyxcbiAgJ3RkJzogJ0hUTUxUYWJsZURhdGFDZWxsRWxlbWVudCcsXG4gICd0ZXh0YXJlYSc6ICdIVE1MVGV4dEFyZWFFbGVtZW50JyxcbiAgJ3Rmb290JzogJ0hUTUxUYWJsZVNlY3Rpb25FbGVtZW50JyxcbiAgJ3RoJzogJ0hUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50JyxcbiAgJ3RoZWFkJzogJ0hUTUxUYWJsZVNlY3Rpb25FbGVtZW50JyxcbiAgJ3RpbWUnOiAnSFRNTFRpbWVFbGVtZW50JyxcbiAgJ3RpdGxlJzogJ0hUTUxUaXRsZUVsZW1lbnQnLFxuICAndHInOiAnSFRNTFRhYmxlUm93RWxlbWVudCcsXG4gICd0cmFjayc6ICdIVE1MVHJhY2tFbGVtZW50JyxcbiAgJ3R0JzogJ0hUTUxFbGVtZW50JyxcbiAgJ3UnOiAnSFRNTEVsZW1lbnQnLFxuICAndWwnOiAnSFRNTFVMaXN0RWxlbWVudCcsXG4gICd2YXInOiAnSFRNTEVsZW1lbnQnLFxuICAndmlkZW8nOiAnSFRNTFZpZGVvRWxlbWVudCcsXG4gICd3YnInOiAnSFRNTEVsZW1lbnQnXG59O1xuaHRtbDRbICdFTEVNRU5UX0RPTV9JTlRFUkZBQ0VTJyBdID0gaHRtbDQuRUxFTUVOVF9ET01fSU5URVJGQUNFUztcbmh0bWw0LnVlZmZlY3RzID0ge1xuICAnTk9UX0xPQURFRCc6IDAsXG4gICdTQU1FX0RPQ1VNRU5UJzogMSxcbiAgJ05FV19ET0NVTUVOVCc6IDJcbn07XG5odG1sNFsgJ3VlZmZlY3RzJyBdID0gaHRtbDQudWVmZmVjdHM7XG5odG1sNC5VUklFRkZFQ1RTID0ge1xuICAnYTo6aHJlZic6IDIsXG4gICdhcmVhOjpocmVmJzogMixcbiAgJ2Jsb2NrcXVvdGU6OmNpdGUnOiAwLFxuICAnY29tbWFuZDo6aWNvbic6IDEsXG4gICdkZWw6OmNpdGUnOiAwLFxuICAnZm9ybTo6YWN0aW9uJzogMixcbiAgJ2ltZzo6c3JjJzogMSxcbiAgJ2lucHV0OjpzcmMnOiAxLFxuICAnaW5zOjpjaXRlJzogMCxcbiAgJ3E6OmNpdGUnOiAwLFxuICAndmlkZW86OnBvc3Rlcic6IDFcbn07XG5odG1sNFsgJ1VSSUVGRkVDVFMnIF0gPSBodG1sNC5VUklFRkZFQ1RTO1xuaHRtbDQubHR5cGVzID0ge1xuICAnVU5TQU5EQk9YRUQnOiAyLFxuICAnU0FOREJPWEVEJzogMSxcbiAgJ0RBVEEnOiAwXG59O1xuaHRtbDRbICdsdHlwZXMnIF0gPSBodG1sNC5sdHlwZXM7XG5odG1sNC5MT0FERVJUWVBFUyA9IHtcbiAgJ2E6OmhyZWYnOiAyLFxuICAnYXJlYTo6aHJlZic6IDIsXG4gICdibG9ja3F1b3RlOjpjaXRlJzogMixcbiAgJ2NvbW1hbmQ6Omljb24nOiAxLFxuICAnZGVsOjpjaXRlJzogMixcbiAgJ2Zvcm06OmFjdGlvbic6IDIsXG4gICdpbWc6OnNyYyc6IDEsXG4gICdpbnB1dDo6c3JjJzogMSxcbiAgJ2luczo6Y2l0ZSc6IDIsXG4gICdxOjpjaXRlJzogMixcbiAgJ3ZpZGVvOjpwb3N0ZXInOiAxXG59O1xuaHRtbDRbICdMT0FERVJUWVBFUycgXSA9IGh0bWw0LkxPQURFUlRZUEVTO1xuXG4vLyBDb3B5cmlnaHQgKEMpIDIwMDYgR29vZ2xlIEluYy5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEFuIEhUTUwgc2FuaXRpemVyIHRoYXQgY2FuIHNhdGlzZnkgYSB2YXJpZXR5IG9mIHNlY3VyaXR5IHBvbGljaWVzLlxuICpcbiAqIDxwPlxuICogVGhlIEhUTUwgc2FuaXRpemVyIGlzIGJ1aWx0IGFyb3VuZCBhIFNBWCBwYXJzZXIgYW5kIEhUTUwgZWxlbWVudCBhbmRcbiAqIGF0dHJpYnV0ZXMgc2NoZW1hcy5cbiAqXG4gKiBJZiB0aGUgY3NzcGFyc2VyIGlzIGxvYWRlZCwgaW5saW5lIHN0eWxlcyBhcmUgc2FuaXRpemVkIHVzaW5nIHRoZVxuICogY3NzIHByb3BlcnR5IGFuZCB2YWx1ZSBzY2hlbWFzLiAgRWxzZSB0aGV5IGFyZSByZW1vdmUgZHVyaW5nXG4gKiBzYW5pdGl6YXRpb24uXG4gKlxuICogSWYgaXQgZXhpc3RzLCB1c2VzIHBhcnNlQ3NzRGVjbGFyYXRpb25zLCBzYW5pdGl6ZUNzc1Byb3BlcnR5LCAgY3NzU2NoZW1hXG4gKlxuICogQGF1dGhvciBtaWtlc2FtdWVsQGdtYWlsLmNvbVxuICogQGF1dGhvciBqYXN2aXJAZ21haWwuY29tXG4gKiBcXEByZXF1aXJlcyBodG1sNCwgVVJJXG4gKiBcXEBvdmVycmlkZXMgd2luZG93XG4gKiBcXEBwcm92aWRlcyBodG1sLCBodG1sX3Nhbml0aXplXG4gKi9cblxuLy8gVGhlIFR1cmtpc2ggaSBzZWVtcyB0byBiZSBhIG5vbi1pc3N1ZSwgYnV0IGFib3J0IGluIGNhc2UgaXQgaXMuXG5pZiAoJ0knLnRvTG93ZXJDYXNlKCkgIT09ICdpJykgeyB0aHJvdyAnSS9pIHByb2JsZW0nOyB9XG5cbi8qKlxuICogXFxAbmFtZXNwYWNlXG4gKi9cbnZhciBodG1sID0gKGZ1bmN0aW9uKGh0bWw0KSB7XG5cbiAgLy8gRm9yIGNsb3N1cmUgY29tcGlsZXJcbiAgdmFyIHBhcnNlQ3NzRGVjbGFyYXRpb25zLCBzYW5pdGl6ZUNzc1Byb3BlcnR5LCBjc3NTY2hlbWE7XG4gIGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHdpbmRvdykge1xuICAgIHBhcnNlQ3NzRGVjbGFyYXRpb25zID0gd2luZG93WydwYXJzZUNzc0RlY2xhcmF0aW9ucyddO1xuICAgIHNhbml0aXplQ3NzUHJvcGVydHkgPSB3aW5kb3dbJ3Nhbml0aXplQ3NzUHJvcGVydHknXTtcbiAgICBjc3NTY2hlbWEgPSB3aW5kb3dbJ2Nzc1NjaGVtYSddO1xuICB9XG5cbiAgLy8gVGhlIGtleXMgb2YgdGhpcyBvYmplY3QgbXVzdCBiZSAncXVvdGVkJyBvciBKU0NvbXBpbGVyIHdpbGwgbWFuZ2xlIHRoZW0hXG4gIC8vIFRoaXMgaXMgYSBwYXJ0aWFsIGxpc3QgLS0gbG9va3VwRW50aXR5KCkgdXNlcyB0aGUgaG9zdCBicm93c2VyJ3MgcGFyc2VyXG4gIC8vICh3aGVuIGF2YWlsYWJsZSkgdG8gaW1wbGVtZW50IGZ1bGwgZW50aXR5IGxvb2t1cC5cbiAgLy8gTm90ZSB0aGF0IGVudGl0aWVzIGFyZSBpbiBnZW5lcmFsIGNhc2Utc2Vuc2l0aXZlOyB0aGUgdXBwZXJjYXNlIG9uZXMgYXJlXG4gIC8vIGV4cGxpY2l0bHkgZGVmaW5lZCBieSBIVE1MNSAocHJlc3VtYWJseSBhcyBjb21wYXRpYmlsaXR5KS5cbiAgdmFyIEVOVElUSUVTID0ge1xuICAgICdsdCc6ICc8JyxcbiAgICAnTFQnOiAnPCcsXG4gICAgJ2d0JzogJz4nLFxuICAgICdHVCc6ICc+JyxcbiAgICAnYW1wJzogJyYnLFxuICAgICdBTVAnOiAnJicsXG4gICAgJ3F1b3QnOiAnXCInLFxuICAgICdhcG9zJzogJ1xcJycsXG4gICAgJ25ic3AnOiAnXFwyNDAnXG4gIH07XG5cbiAgLy8gUGF0dGVybnMgZm9yIHR5cGVzIG9mIGVudGl0eS9jaGFyYWN0ZXIgcmVmZXJlbmNlIG5hbWVzLlxuICB2YXIgZGVjaW1hbEVzY2FwZVJlID0gL14jKFxcZCspJC87XG4gIHZhciBoZXhFc2NhcGVSZSA9IC9eI3goWzAtOUEtRmEtZl0rKSQvO1xuICAvLyBjb250YWlucyBldmVyeSBlbnRpdHkgcGVyIGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTEvV0QtaHRtbDUtMjAxMTAxMTMvbmFtZWQtY2hhcmFjdGVyLXJlZmVyZW5jZXMuaHRtbFxuICB2YXIgc2FmZUVudGl0eU5hbWVSZSA9IC9eW0EtWmEtel1bQS16YS16MC05XSskLztcbiAgLy8gVXNlZCBhcyBhIGhvb2sgdG8gaW52b2tlIHRoZSBicm93c2VyJ3MgZW50aXR5IHBhcnNpbmcuIDx0ZXh0YXJlYT4gaXMgdXNlZFxuICAvLyBiZWNhdXNlIGl0cyBjb250ZW50IGlzIHBhcnNlZCBmb3IgZW50aXRpZXMgYnV0IG5vdCB0YWdzLlxuICAvLyBUT0RPKGtwcmVpZCk6IFRoaXMgcmV0cmlldmFsIGlzIGEga2x1ZGdlIGFuZCBsZWFkcyB0byBzaWxlbnQgbG9zcyBvZlxuICAvLyBmdW5jdGlvbmFsaXR5IGlmIHRoZSBkb2N1bWVudCBpc24ndCBhdmFpbGFibGUuXG4gIHZhciBlbnRpdHlMb29rdXBFbGVtZW50ID1cbiAgICAgICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHdpbmRvdyAmJiB3aW5kb3dbJ2RvY3VtZW50J10pXG4gICAgICAgICAgPyB3aW5kb3dbJ2RvY3VtZW50J10uY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKSA6IG51bGw7XG4gIC8qKlxuICAgKiBEZWNvZGVzIGFuIEhUTUwgZW50aXR5LlxuICAgKlxuICAgKiB7XFxAdXBkb2NcbiAgICogJCBsb29rdXBFbnRpdHkoJ2x0JylcbiAgICogIyAnPCdcbiAgICogJCBsb29rdXBFbnRpdHkoJ0dUJylcbiAgICogIyAnPidcbiAgICogJCBsb29rdXBFbnRpdHkoJ2FtcCcpXG4gICAqICMgJyYnXG4gICAqICQgbG9va3VwRW50aXR5KCduYnNwJylcbiAgICogIyAnXFx4QTAnXG4gICAqICQgbG9va3VwRW50aXR5KCdhcG9zJylcbiAgICogIyBcIidcIlxuICAgKiAkIGxvb2t1cEVudGl0eSgncXVvdCcpXG4gICAqICMgJ1wiJ1xuICAgKiAkIGxvb2t1cEVudGl0eSgnI3hhJylcbiAgICogIyAnXFxuJ1xuICAgKiAkIGxvb2t1cEVudGl0eSgnIzEwJylcbiAgICogIyAnXFxuJ1xuICAgKiAkIGxvb2t1cEVudGl0eSgnI3gwYScpXG4gICAqICMgJ1xcbidcbiAgICogJCBsb29rdXBFbnRpdHkoJyMwMTAnKVxuICAgKiAjICdcXG4nXG4gICAqICQgbG9va3VwRW50aXR5KCcjeDAwQScpXG4gICAqICMgJ1xcbidcbiAgICogJCBsb29rdXBFbnRpdHkoJ1BpJykgICAgICAvLyBLbm93biBmYWlsdXJlXG4gICAqICMgJ1xcdTAzQTAnXG4gICAqICQgbG9va3VwRW50aXR5KCdwaScpICAgICAgLy8gS25vd24gZmFpbHVyZVxuICAgKiAjICdcXHUwM0MwJ1xuICAgKiB9XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBjb250ZW50IGJldHdlZW4gdGhlICcmJyBhbmQgdGhlICc7Jy5cbiAgICogQHJldHVybiB7c3RyaW5nfSBhIHNpbmdsZSB1bmljb2RlIGNvZGUtcG9pbnQgYXMgYSBzdHJpbmcuXG4gICAqL1xuICBmdW5jdGlvbiBsb29rdXBFbnRpdHkobmFtZSkge1xuICAgIC8vIFRPRE86IGVudGl0eSBsb29rdXAgYXMgc3BlY2lmaWVkIGJ5IEhUTUw1IGFjdHVhbGx5IGRlcGVuZHMgb24gdGhlXG4gICAgLy8gcHJlc2VuY2Ugb2YgdGhlIFwiO1wiLlxuICAgIGlmIChFTlRJVElFUy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkgeyByZXR1cm4gRU5USVRJRVNbbmFtZV07IH1cbiAgICB2YXIgbSA9IG5hbWUubWF0Y2goZGVjaW1hbEVzY2FwZVJlKTtcbiAgICBpZiAobSkge1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobVsxXSwgMTApKTtcbiAgICB9IGVsc2UgaWYgKCEhKG0gPSBuYW1lLm1hdGNoKGhleEVzY2FwZVJlKSkpIHtcbiAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KG1bMV0sIDE2KSk7XG4gICAgfSBlbHNlIGlmIChlbnRpdHlMb29rdXBFbGVtZW50ICYmIHNhZmVFbnRpdHlOYW1lUmUudGVzdChuYW1lKSkge1xuICAgICAgZW50aXR5TG9va3VwRWxlbWVudC5pbm5lckhUTUwgPSAnJicgKyBuYW1lICsgJzsnO1xuICAgICAgdmFyIHRleHQgPSBlbnRpdHlMb29rdXBFbGVtZW50LnRleHRDb250ZW50O1xuICAgICAgRU5USVRJRVNbbmFtZV0gPSB0ZXh0O1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJicgKyBuYW1lICsgJzsnO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZU9uZUVudGl0eShfLCBuYW1lKSB7XG4gICAgcmV0dXJuIGxvb2t1cEVudGl0eShuYW1lKTtcbiAgfVxuXG4gIHZhciBudWxSZSA9IC9cXDAvZztcbiAgZnVuY3Rpb24gc3RyaXBOVUxzKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKG51bFJlLCAnJyk7XG4gIH1cblxuICB2YXIgRU5USVRZX1JFXzEgPSAvJigjWzAtOV0rfCNbeFhdWzAtOUEtRmEtZl0rfFxcdyspOy9nO1xuICB2YXIgRU5USVRZX1JFXzIgPSAvXigjWzAtOV0rfCNbeFhdWzAtOUEtRmEtZl0rfFxcdyspOy87XG4gIC8qKlxuICAgKiBUaGUgcGxhaW4gdGV4dCBvZiBhIGNodW5rIG9mIEhUTUwgQ0RBVEEgd2hpY2ggcG9zc2libHkgY29udGFpbmluZy5cbiAgICpcbiAgICoge1xcQHVwZG9jXG4gICAqICQgdW5lc2NhcGVFbnRpdGllcygnJylcbiAgICogIyAnJ1xuICAgKiAkIHVuZXNjYXBlRW50aXRpZXMoJ2hlbGxvIFdvcmxkIScpXG4gICAqICMgJ2hlbGxvIFdvcmxkISdcbiAgICogJCB1bmVzY2FwZUVudGl0aWVzKCcxICZsdDsgMiAmYW1wOyZBTVA7IDQgJmd0OyAzJiMxMDsnKVxuICAgKiAjICcxIDwgMiAmJiA0ID4gM1xcbidcbiAgICogJCB1bmVzY2FwZUVudGl0aWVzKCcmbHQ7Jmx0IDwtIHVuZmluaXNoZWQgZW50aXR5Jmd0OycpXG4gICAqICMgJzwmbHQgPC0gdW5maW5pc2hlZCBlbnRpdHk+J1xuICAgKiAkIHVuZXNjYXBlRW50aXRpZXMoJy9mb28/YmFyPWJheiZjb3B5PXRydWUnKSAgLy8gJiBvZnRlbiB1bmVzY2FwZWQgaW4gVVJMU1xuICAgKiAjICcvZm9vP2Jhcj1iYXomY29weT10cnVlJ1xuICAgKiAkIHVuZXNjYXBlRW50aXRpZXMoJ3BpPSZwaTsmI3gzYzA7LCBQaT0mUGk7XFx1MDNBMCcpIC8vIEZJWE1FOiBrbm93biBmYWlsdXJlXG4gICAqICMgJ3BpPVxcdTAzQzBcXHUwM2MwLCBQaT1cXHUwM0EwXFx1MDNBMCdcbiAgICogfVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcyBhIGNodW5rIG9mIEhUTUwgQ0RBVEEuICBJdCBtdXN0IG5vdCBzdGFydCBvciBlbmQgaW5zaWRlXG4gICAqICAgICBhbiBIVE1MIGVudGl0eS5cbiAgICovXG4gIGZ1bmN0aW9uIHVuZXNjYXBlRW50aXRpZXMocykge1xuICAgIHJldHVybiBzLnJlcGxhY2UoRU5USVRZX1JFXzEsIGRlY29kZU9uZUVudGl0eSk7XG4gIH1cblxuICB2YXIgYW1wUmUgPSAvJi9nO1xuICB2YXIgbG9vc2VBbXBSZSA9IC8mKFteYS16I118Iyg/OlteMC05eF18eCg/OlteMC05YS1mXXwkKXwkKXwkKS9naTtcbiAgdmFyIGx0UmUgPSAvWzxdL2c7XG4gIHZhciBndFJlID0gLz4vZztcbiAgdmFyIHF1b3RSZSA9IC9cXFwiL2c7XG5cbiAgLyoqXG4gICAqIEVzY2FwZXMgSFRNTCBzcGVjaWFsIGNoYXJhY3RlcnMgaW4gYXR0cmlidXRlIHZhbHVlcy5cbiAgICpcbiAgICoge1xcQHVwZG9jXG4gICAqICQgZXNjYXBlQXR0cmliKCcnKVxuICAgKiAjICcnXG4gICAqICQgZXNjYXBlQXR0cmliKCdcIjw8Jj09Jj4+XCInKSAgLy8gRG8gbm90IGp1c3QgZXNjYXBlIHRoZSBmaXJzdCBvY2N1cnJlbmNlLlxuICAgKiAjICcmIzM0OyZsdDsmbHQ7JmFtcDsmIzYxOyYjNjE7JmFtcDsmZ3Q7Jmd0OyYjMzQ7J1xuICAgKiAkIGVzY2FwZUF0dHJpYignSGVsbG8gPFdvcmxkPiEnKVxuICAgKiAjICdIZWxsbyAmbHQ7V29ybGQmZ3Q7ISdcbiAgICogfVxuICAgKi9cbiAgZnVuY3Rpb24gZXNjYXBlQXR0cmliKHMpIHtcbiAgICByZXR1cm4gKCcnICsgcykucmVwbGFjZShhbXBSZSwgJyZhbXA7JykucmVwbGFjZShsdFJlLCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKGd0UmUsICcmZ3Q7JykucmVwbGFjZShxdW90UmUsICcmIzM0OycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVzY2FwZSBlbnRpdGllcyBpbiBSQ0RBVEEgdGhhdCBjYW4gYmUgZXNjYXBlZCB3aXRob3V0IGNoYW5naW5nIHRoZSBtZWFuaW5nLlxuICAgKiB7XFxAdXBkb2NcbiAgICogJCBub3JtYWxpemVSQ0RhdGEoJzEgPCAyICYmYW1wOyAzID4gNCAmYW1wOyYgNSAmbHQ7IDcmOCcpXG4gICAqICMgJzEgJmx0OyAyICZhbXA7JmFtcDsgMyAmZ3Q7IDQgJmFtcDsmYW1wOyA1ICZsdDsgNyZhbXA7OCdcbiAgICogfVxuICAgKi9cbiAgZnVuY3Rpb24gbm9ybWFsaXplUkNEYXRhKHJjZGF0YSkge1xuICAgIHJldHVybiByY2RhdGFcbiAgICAgICAgLnJlcGxhY2UobG9vc2VBbXBSZSwgJyZhbXA7JDEnKVxuICAgICAgICAucmVwbGFjZShsdFJlLCAnJmx0OycpXG4gICAgICAgIC5yZXBsYWNlKGd0UmUsICcmZ3Q7Jyk7XG4gIH1cblxuICAvLyBUT0RPKGZlbGl4OGEpOiB2YWxpZGF0ZSBzYW5pdGl6ZXIgcmVnZXhzIGFnYWluc3QgdGhlIEhUTUw1IGdyYW1tYXIgYXRcbiAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2Uvc3ludGF4Lmh0bWxcbiAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2UvcGFyc2luZy5odG1sXG4gIC8vIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL3Rva2VuaXphdGlvbi5odG1sXG4gIC8vIGh0dHA6Ly93d3cud2hhdHdnLm9yZy9zcGVjcy93ZWItYXBwcy9jdXJyZW50LXdvcmsvbXVsdGlwYWdlL3RyZWUtY29uc3RydWN0aW9uLmh0bWxcblxuICAvLyBXZSBpbml0aWFsbHkgc3BsaXQgaW5wdXQgc28gdGhhdCBwb3RlbnRpYWxseSBtZWFuaW5nZnVsIGNoYXJhY3RlcnNcbiAgLy8gbGlrZSAnPCcgYW5kICc+JyBhcmUgc2VwYXJhdGUgdG9rZW5zLCB1c2luZyBhIGZhc3QgZHVtYiBwcm9jZXNzIHRoYXRcbiAgLy8gaWdub3JlcyBxdW90aW5nLiAgVGhlbiB3ZSB3YWxrIHRoYXQgdG9rZW4gc3RyZWFtLCBhbmQgd2hlbiB3ZSBzZWUgYVxuICAvLyAnPCcgdGhhdCdzIHRoZSBzdGFydCBvZiBhIHRhZywgd2UgdXNlIEFUVFJfUkUgdG8gZXh0cmFjdCB0YWdcbiAgLy8gYXR0cmlidXRlcyBmcm9tIHRoZSBuZXh0IHRva2VuLiAgVGhhdCB0b2tlbiB3aWxsIG5ldmVyIGhhdmUgYSAnPidcbiAgLy8gY2hhcmFjdGVyLiAgSG93ZXZlciwgaXQgbWlnaHQgaGF2ZSBhbiB1bmJhbGFuY2VkIHF1b3RlIGNoYXJhY3RlciwgYW5kXG4gIC8vIHdoZW4gd2Ugc2VlIHRoYXQsIHdlIGNvbWJpbmUgYWRkaXRpb25hbCB0b2tlbnMgdG8gYmFsYW5jZSB0aGUgcXVvdGUuXG5cbiAgdmFyIEFUVFJfUkUgPSBuZXcgUmVnRXhwKFxuICAgICdeXFxcXHMqJyArXG4gICAgJyhbLS46XFxcXHddKyknICsgICAgICAgICAgICAgLy8gMSA9IEF0dHJpYnV0ZSBuYW1lXG4gICAgJyg/OicgKyAoXG4gICAgICAnXFxcXHMqKD0pXFxcXHMqJyArICAgICAgICAgICAvLyAyID0gSXMgdGhlcmUgYSB2YWx1ZT9cbiAgICAgICcoJyArICggICAgICAgICAgICAgICAgICAgLy8gMyA9IEF0dHJpYnV0ZSB2YWx1ZVxuICAgICAgICAvLyBUT0RPKGZlbGl4OGEpOiBtYXliZSB1c2UgYmFja3JlZiB0byBtYXRjaCBxdW90ZXNcbiAgICAgICAgJyhcXFwiKVteXFxcIl0qKFxcXCJ8JCknICsgICAgLy8gNCwgNSA9IERvdWJsZS1xdW90ZWQgc3RyaW5nXG4gICAgICAgICd8JyArXG4gICAgICAgICcoXFwnKVteXFwnXSooXFwnfCQpJyArICAgIC8vIDYsIDcgPSBTaW5nbGUtcXVvdGVkIHN0cmluZ1xuICAgICAgICAnfCcgK1xuICAgICAgICAvLyBQb3NpdGl2ZSBsb29rYWhlYWQgdG8gcHJldmVudCBpbnRlcnByZXRhdGlvbiBvZlxuICAgICAgICAvLyA8Zm9vIGE9IGI9Yz4gYXMgPGZvbyBhPSdiPWMnPlxuICAgICAgICAvLyBUT0RPKGZlbGl4OGEpOiBtaWdodCBiZSBhYmxlIHRvIGRyb3AgdGhpcyBjYXNlXG4gICAgICAgICcoPz1bYS16XVstXFxcXHddKlxcXFxzKj0pJyArXG4gICAgICAgICd8JyArXG4gICAgICAgIC8vIFVucXVvdGVkIHZhbHVlIHRoYXQgaXNuJ3QgYW4gYXR0cmlidXRlIG5hbWVcbiAgICAgICAgLy8gKHNpbmNlIHdlIGRpZG4ndCBtYXRjaCB0aGUgcG9zaXRpdmUgbG9va2FoZWFkIGFib3ZlKVxuICAgICAgICAnW15cXFwiXFwnXFxcXHNdKicgKSArXG4gICAgICAnKScgKSArXG4gICAgJyk/JyxcbiAgICAnaScpO1xuXG4gIC8vIGZhbHNlIG9uIElFPD04LCB0cnVlIG9uIG1vc3Qgb3RoZXIgYnJvd3NlcnNcbiAgdmFyIHNwbGl0V2lsbENhcHR1cmUgPSAoJ2EsYicuc3BsaXQoLygsKS8pLmxlbmd0aCA9PT0gMyk7XG5cbiAgLy8gYml0bWFzayBmb3IgdGFncyB3aXRoIHNwZWNpYWwgcGFyc2luZywgbGlrZSA8c2NyaXB0PiBhbmQgPHRleHRhcmVhPlxuICB2YXIgRUZMQUdTX1RFWFQgPSBodG1sNC5lZmxhZ3NbJ0NEQVRBJ10gfCBodG1sNC5lZmxhZ3NbJ1JDREFUQSddO1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIFNBWC1saWtlIGV2ZW50IGhhbmRsZXIsIHByb2R1Y2UgYSBmdW5jdGlvbiB0aGF0IGZlZWRzIHRob3NlXG4gICAqIGV2ZW50cyBhbmQgYSBwYXJhbWV0ZXIgdG8gdGhlIGV2ZW50IGhhbmRsZXIuXG4gICAqXG4gICAqIFRoZSBldmVudCBoYW5kbGVyIGhhcyB0aGUgZm9ybTp7QGNvZGVcbiAgICoge1xuICAgKiAgIC8vIE5hbWUgaXMgYW4gdXBwZXItY2FzZSBIVE1MIHRhZyBuYW1lLiAgQXR0cmlicyBpcyBhbiBhcnJheSBvZlxuICAgKiAgIC8vIGFsdGVybmF0aW5nIHVwcGVyLWNhc2UgYXR0cmlidXRlIG5hbWVzLCBhbmQgYXR0cmlidXRlIHZhbHVlcy4gIFRoZVxuICAgKiAgIC8vIGF0dHJpYnMgYXJyYXkgaXMgcmV1c2VkIGJ5IHRoZSBwYXJzZXIuICBQYXJhbSBpcyB0aGUgdmFsdWUgcGFzc2VkIHRvXG4gICAqICAgLy8gdGhlIHNheFBhcnNlci5cbiAgICogICBzdGFydFRhZzogZnVuY3Rpb24gKG5hbWUsIGF0dHJpYnMsIHBhcmFtKSB7IC4uLiB9LFxuICAgKiAgIGVuZFRhZzogICBmdW5jdGlvbiAobmFtZSwgcGFyYW0pIHsgLi4uIH0sXG4gICAqICAgcGNkYXRhOiAgIGZ1bmN0aW9uICh0ZXh0LCBwYXJhbSkgeyAuLi4gfSxcbiAgICogICByY2RhdGE6ICAgZnVuY3Rpb24gKHRleHQsIHBhcmFtKSB7IC4uLiB9LFxuICAgKiAgIGNkYXRhOiAgICBmdW5jdGlvbiAodGV4dCwgcGFyYW0pIHsgLi4uIH0sXG4gICAqICAgc3RhcnREb2M6IGZ1bmN0aW9uIChwYXJhbSkgeyAuLi4gfSxcbiAgICogICBlbmREb2M6ICAgZnVuY3Rpb24gKHBhcmFtKSB7IC4uLiB9XG4gICAqIH19XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBoYW5kbGVyIGEgcmVjb3JkIGNvbnRhaW5pbmcgZXZlbnQgaGFuZGxlcnMuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uKHN0cmluZywgT2JqZWN0KX0gQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgY2h1bmsgb2YgSFRNTFxuICAgKiAgICAgYW5kIGEgcGFyYW1ldGVyLiAgVGhlIHBhcmFtZXRlciBpcyBwYXNzZWQgb24gdG8gdGhlIGhhbmRsZXIgbWV0aG9kcy5cbiAgICovXG4gIGZ1bmN0aW9uIG1ha2VTYXhQYXJzZXIoaGFuZGxlcikge1xuICAgIC8vIEFjY2VwdCBxdW90ZWQgb3IgdW5xdW90ZWQga2V5cyAoQ2xvc3VyZSBjb21wYXQpXG4gICAgdmFyIGhjb3B5ID0ge1xuICAgICAgY2RhdGE6IGhhbmRsZXIuY2RhdGEgfHwgaGFuZGxlclsnY2RhdGEnXSxcbiAgICAgIGNvbW1lbnQ6IGhhbmRsZXIuY29tbWVudCB8fCBoYW5kbGVyWydjb21tZW50J10sXG4gICAgICBlbmREb2M6IGhhbmRsZXIuZW5kRG9jIHx8IGhhbmRsZXJbJ2VuZERvYyddLFxuICAgICAgZW5kVGFnOiBoYW5kbGVyLmVuZFRhZyB8fCBoYW5kbGVyWydlbmRUYWcnXSxcbiAgICAgIHBjZGF0YTogaGFuZGxlci5wY2RhdGEgfHwgaGFuZGxlclsncGNkYXRhJ10sXG4gICAgICByY2RhdGE6IGhhbmRsZXIucmNkYXRhIHx8IGhhbmRsZXJbJ3JjZGF0YSddLFxuICAgICAgc3RhcnREb2M6IGhhbmRsZXIuc3RhcnREb2MgfHwgaGFuZGxlclsnc3RhcnREb2MnXSxcbiAgICAgIHN0YXJ0VGFnOiBoYW5kbGVyLnN0YXJ0VGFnIHx8IGhhbmRsZXJbJ3N0YXJ0VGFnJ11cbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbihodG1sVGV4dCwgcGFyYW0pIHtcbiAgICAgIHJldHVybiBwYXJzZShodG1sVGV4dCwgaGNvcHksIHBhcmFtKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gUGFyc2luZyBzdHJhdGVneSBpcyB0byBzcGxpdCBpbnB1dCBpbnRvIHBhcnRzIHRoYXQgbWlnaHQgYmUgbGV4aWNhbGx5XG4gIC8vIG1lYW5pbmdmdWwgKGV2ZXJ5IFwiPlwiIGJlY29tZXMgYSBzZXBhcmF0ZSBwYXJ0KSwgYW5kIHRoZW4gcmVjb21iaW5lXG4gIC8vIHBhcnRzIGlmIHdlIGRpc2NvdmVyIHRoZXkncmUgaW4gYSBkaWZmZXJlbnQgY29udGV4dC5cblxuICAvLyBUT0RPKGZlbGl4OGEpOiBTaWduaWZpY2FudCBwZXJmb3JtYW5jZSByZWdyZXNzaW9ucyBmcm9tIC1sZWdhY3ksXG4gIC8vIHRlc3RlZCBvblxuICAvLyAgICBDaHJvbWUgMTguMFxuICAvLyAgICBGaXJlZm94IDExLjBcbiAgLy8gICAgSUUgNiwgNywgOCwgOVxuICAvLyAgICBPcGVyYSAxMS42MVxuICAvLyAgICBTYWZhcmkgNS4xLjNcbiAgLy8gTWFueSBvZiB0aGVzZSBhcmUgdW51c3VhbCBwYXR0ZXJucyB0aGF0IGFyZSBsaW5lYXJseSBzbG93ZXIgYW5kIHN0aWxsXG4gIC8vIHByZXR0eSBmYXN0IChlZyAxbXMgdG8gNW1zKSwgc28gbm90IG5lY2Vzc2FyaWx5IHdvcnRoIGZpeGluZy5cblxuICAvLyBUT0RPKGZlbGl4OGEpOiBcIjxzY3JpcHQ+ICYmICYmICYmIC4uLiA8XFwvc2NyaXB0PlwiIGlzIHNsb3dlciBvbiBhbGxcbiAgLy8gYnJvd3NlcnMuICBUaGUgaG90c3BvdCBpcyBodG1sU3BsaXQuXG5cbiAgLy8gVE9ETyhmZWxpeDhhKTogXCI8cCB0aXRsZT0nPj4+Pi4uLic+PFxcL3A+XCIgaXMgc2xvd2VyIG9uIGFsbCBicm93c2Vycy5cbiAgLy8gVGhpcyBpcyBwYXJ0bHkgaHRtbFNwbGl0LCBidXQgdGhlIGhvdHNwb3QgaXMgcGFyc2VUYWdBbmRBdHRycy5cblxuICAvLyBUT0RPKGZlbGl4OGEpOiBcIjxhPjxcXC9hPjxhPjxcXC9hPi4uLlwiIGlzIHNsb3dlciBvbiBJRTkuXG4gIC8vIFwiPGE+MTxcXC9hPjxhPjE8XFwvYT4uLi5cIiBpcyBmYXN0ZXIsIFwiPGE+PFxcL2E+MjxhPjxcXC9hPjIuLi5cIiBpcyBmYXN0ZXIuXG5cbiAgLy8gVE9ETyhmZWxpeDhhKTogXCI8cDxwPHAuLi5cIiBpcyBzbG93ZXIgb24gSUVbNi04XVxuXG4gIHZhciBjb250aW51YXRpb25NYXJrZXIgPSB7fTtcbiAgZnVuY3Rpb24gcGFyc2UoaHRtbFRleHQsIGhhbmRsZXIsIHBhcmFtKSB7XG4gICAgdmFyIG0sIHAsIHRhZ05hbWU7XG4gICAgdmFyIHBhcnRzID0gaHRtbFNwbGl0KGh0bWxUZXh0KTtcbiAgICB2YXIgc3RhdGUgPSB7XG4gICAgICBub01vcmVHVDogZmFsc2UsXG4gICAgICBub01vcmVFbmRDb21tZW50czogZmFsc2VcbiAgICB9O1xuICAgIHBhcnNlQ1BTKGhhbmRsZXIsIHBhcnRzLCAwLCBzdGF0ZSwgcGFyYW0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIGluaXRpYWwsIHN0YXRlLCBwYXJhbSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBwYXJzZUNQUyhoLCBwYXJ0cywgaW5pdGlhbCwgc3RhdGUsIHBhcmFtKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VDUFMoaCwgcGFydHMsIGluaXRpYWwsIHN0YXRlLCBwYXJhbSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoaC5zdGFydERvYyAmJiBpbml0aWFsID09IDApIHsgaC5zdGFydERvYyhwYXJhbSk7IH1cbiAgICAgIHZhciBtLCBwLCB0YWdOYW1lO1xuICAgICAgZm9yICh2YXIgcG9zID0gaW5pdGlhbCwgZW5kID0gcGFydHMubGVuZ3RoOyBwb3MgPCBlbmQ7KSB7XG4gICAgICAgIHZhciBjdXJyZW50ID0gcGFydHNbcG9zKytdO1xuICAgICAgICB2YXIgbmV4dCA9IHBhcnRzW3Bvc107XG4gICAgICAgIHN3aXRjaCAoY3VycmVudCkge1xuICAgICAgICBjYXNlICcmJzpcbiAgICAgICAgICBpZiAoRU5USVRZX1JFXzIudGVzdChuZXh0KSkge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgIGgucGNkYXRhKCcmJyArIG5leHQsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3MrKztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7IGgucGNkYXRhKFwiJmFtcDtcIiwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzxcXC8nOlxuICAgICAgICAgIGlmIChtID0gL14oWy1cXHc6XSspW15cXCdcXFwiXSovLmV4ZWMobmV4dCkpIHtcbiAgICAgICAgICAgIGlmIChtWzBdLmxlbmd0aCA9PT0gbmV4dC5sZW5ndGggJiYgcGFydHNbcG9zICsgMV0gPT09ICc+Jykge1xuICAgICAgICAgICAgICAvLyBmYXN0IGNhc2UsIG5vIGF0dHJpYnV0ZSBwYXJzaW5nIG5lZWRlZFxuICAgICAgICAgICAgICBwb3MgKz0gMjtcbiAgICAgICAgICAgICAgdGFnTmFtZSA9IG1bMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgaWYgKGguZW5kVGFnKSB7XG4gICAgICAgICAgICAgICAgaC5lbmRUYWcodGFnTmFtZSwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBzbG93IGNhc2UsIG5lZWQgdG8gcGFyc2UgYXR0cmlidXRlc1xuICAgICAgICAgICAgICAvLyBUT0RPKGZlbGl4OGEpOiBkbyB3ZSByZWFsbHkgY2FyZSBhYm91dCBtaXNwYXJzaW5nIHRoaXM/XG4gICAgICAgICAgICAgIHBvcyA9IHBhcnNlRW5kVGFnKFxuICAgICAgICAgICAgICAgIHBhcnRzLCBwb3MsIGgsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsIHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgIGgucGNkYXRhKCcmbHQ7LycsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc8JzpcbiAgICAgICAgICBpZiAobSA9IC9eKFstXFx3Ol0rKVxccypcXC8/Ly5leGVjKG5leHQpKSB7XG4gICAgICAgICAgICBpZiAobVswXS5sZW5ndGggPT09IG5leHQubGVuZ3RoICYmIHBhcnRzW3BvcyArIDFdID09PSAnPicpIHtcbiAgICAgICAgICAgICAgLy8gZmFzdCBjYXNlLCBubyBhdHRyaWJ1dGUgcGFyc2luZyBuZWVkZWRcbiAgICAgICAgICAgICAgcG9zICs9IDI7XG4gICAgICAgICAgICAgIHRhZ05hbWUgPSBtWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGlmIChoLnN0YXJ0VGFnKSB7XG4gICAgICAgICAgICAgICAgaC5zdGFydFRhZyh0YWdOYW1lLCBbXSwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIHRhZ3MgbGlrZSA8c2NyaXB0PiBhbmQgPHRleHRhcmVhPiBoYXZlIHNwZWNpYWwgcGFyc2luZ1xuICAgICAgICAgICAgICB2YXIgZWZsYWdzID0gaHRtbDQuRUxFTUVOVFNbdGFnTmFtZV07XG4gICAgICAgICAgICAgIGlmIChlZmxhZ3MgJiBFRkxBR1NfVEVYVCkge1xuICAgICAgICAgICAgICAgIHZhciB0YWcgPSB7IG5hbWU6IHRhZ05hbWUsIG5leHQ6IHBvcywgZWZsYWdzOiBlZmxhZ3MgfTtcbiAgICAgICAgICAgICAgICBwb3MgPSBwYXJzZVRleHQoXG4gICAgICAgICAgICAgICAgICBwYXJ0cywgdGFnLCBoLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLCBzdGF0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIHNsb3cgY2FzZSwgbmVlZCB0byBwYXJzZSBhdHRyaWJ1dGVzXG4gICAgICAgICAgICAgIHBvcyA9IHBhcnNlU3RhcnRUYWcoXG4gICAgICAgICAgICAgICAgcGFydHMsIHBvcywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgICAgaC5wY2RhdGEoJyZsdDsnLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPFxcIS0tJzpcbiAgICAgICAgICAvLyBUaGUgcGF0aG9sb2dpY2FsIGNhc2UgaXMgbiBjb3BpZXMgb2YgJzxcXCEtLScgd2l0aG91dCAnLS0+JywgYW5kXG4gICAgICAgICAgLy8gcmVwZWF0ZWQgZmFpbHVyZSB0byBmaW5kICctLT4nIGlzIHF1YWRyYXRpYy4gIFdlIGF2b2lkIHRoYXQgYnlcbiAgICAgICAgICAvLyByZW1lbWJlcmluZyB3aGVuIHNlYXJjaCBmb3IgJy0tPicgZmFpbHMuXG4gICAgICAgICAgaWYgKCFzdGF0ZS5ub01vcmVFbmRDb21tZW50cykge1xuICAgICAgICAgICAgLy8gQSBjb21tZW50IDxcXCEtLXgtLT4gaXMgc3BsaXQgaW50byB0aHJlZSB0b2tlbnM6XG4gICAgICAgICAgICAvLyAgICc8XFwhLS0nLCAneC0tJywgJz4nXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRvIGZpbmQgdGhlIG5leHQgJz4nIHRva2VuIHRoYXQgaGFzIGEgcHJlY2VkaW5nICctLScuXG4gICAgICAgICAgICAvLyBwb3MgaXMgYXQgdGhlICd4LS0nLlxuICAgICAgICAgICAgZm9yIChwID0gcG9zICsgMTsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICAgICAgICAgIGlmIChwYXJ0c1twXSA9PT0gJz4nICYmIC8tLSQvLnRlc3QocGFydHNbcCAtIDFdKSkgeyBicmVhazsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHAgPCBlbmQpIHtcbiAgICAgICAgICAgICAgaWYgKGguY29tbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50ID0gcGFydHMuc2xpY2UocG9zLCBwKS5qb2luKCcnKTtcbiAgICAgICAgICAgICAgICBoLmNvbW1lbnQoXG4gICAgICAgICAgICAgICAgICBjb21tZW50LnN1YnN0cigwLCBjb21tZW50Lmxlbmd0aCAtIDIpLCBwYXJhbSxcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwICsgMSwgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcG9zID0gcCArIDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdGF0ZS5ub01vcmVFbmRDb21tZW50cyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGF0ZS5ub01vcmVFbmRDb21tZW50cykge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgIGgucGNkYXRhKCcmbHQ7IS0tJywgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlcixcbiAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzxcXCEnOlxuICAgICAgICAgIGlmICghL15cXHcvLnRlc3QobmV4dCkpIHtcbiAgICAgICAgICAgIGlmIChoLnBjZGF0YSkge1xuICAgICAgICAgICAgICBoLnBjZGF0YSgnJmx0OyEnLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzaW1pbGFyIHRvIG5vTW9yZUVuZENvbW1lbnQgbG9naWNcbiAgICAgICAgICAgIGlmICghc3RhdGUubm9Nb3JlR1QpIHtcbiAgICAgICAgICAgICAgZm9yIChwID0gcG9zICsgMTsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzW3BdID09PSAnPicpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAocCA8IGVuZCkge1xuICAgICAgICAgICAgICAgIHBvcyA9IHAgKyAxO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN0YXRlLm5vTW9yZUdUID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YXRlLm5vTW9yZUdUKSB7XG4gICAgICAgICAgICAgIGlmIChoLnBjZGF0YSkge1xuICAgICAgICAgICAgICAgIGgucGNkYXRhKCcmbHQ7IScsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPD8nOlxuICAgICAgICAgIC8vIHNpbWlsYXIgdG8gbm9Nb3JlRW5kQ29tbWVudCBsb2dpY1xuICAgICAgICAgIGlmICghc3RhdGUubm9Nb3JlR1QpIHtcbiAgICAgICAgICAgIGZvciAocCA9IHBvcyArIDE7IHAgPCBlbmQ7IHArKykge1xuICAgICAgICAgICAgICBpZiAocGFydHNbcF0gPT09ICc+JykgeyBicmVhazsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHAgPCBlbmQpIHtcbiAgICAgICAgICAgICAgcG9zID0gcCArIDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdGF0ZS5ub01vcmVHVCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGF0ZS5ub01vcmVHVCkge1xuICAgICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICAgIGgucGNkYXRhKCcmbHQ7PycsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHBvcywgc3RhdGUsIHBhcmFtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc+JzpcbiAgICAgICAgICBpZiAoaC5wY2RhdGEpIHtcbiAgICAgICAgICAgIGgucGNkYXRhKFwiJmd0O1wiLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKGgucGNkYXRhKSB7XG4gICAgICAgICAgICBoLnBjZGF0YShjdXJyZW50LCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgICAgICBjb250aW51YXRpb25NYWtlcihoLCBwYXJ0cywgcG9zLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoLmVuZERvYykgeyBoLmVuZERvYyhwYXJhbSk7IH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSAhPT0gY29udGludWF0aW9uTWFya2VyKSB7IHRocm93IGU7IH1cbiAgICB9XG4gIH1cblxuICAvLyBTcGxpdCBzdHIgaW50byBwYXJ0cyBmb3IgdGhlIGh0bWwgcGFyc2VyLlxuICBmdW5jdGlvbiBodG1sU3BsaXQoc3RyKSB7XG4gICAgLy8gY2FuJ3QgaG9pc3QgdGhpcyBvdXQgb2YgdGhlIGZ1bmN0aW9uIGJlY2F1c2Ugb2YgdGhlIHJlLmV4ZWMgbG9vcC5cbiAgICB2YXIgcmUgPSAvKDxcXC98PFxcIS0tfDxbIT9dfFsmPD5dKS9nO1xuICAgIHN0ciArPSAnJztcbiAgICBpZiAoc3BsaXRXaWxsQ2FwdHVyZSkge1xuICAgICAgcmV0dXJuIHN0ci5zcGxpdChyZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgICAgdmFyIGxhc3RQb3MgPSAwO1xuICAgICAgdmFyIG07XG4gICAgICB3aGlsZSAoKG0gPSByZS5leGVjKHN0cikpICE9PSBudWxsKSB7XG4gICAgICAgIHBhcnRzLnB1c2goc3RyLnN1YnN0cmluZyhsYXN0UG9zLCBtLmluZGV4KSk7XG4gICAgICAgIHBhcnRzLnB1c2gobVswXSk7XG4gICAgICAgIGxhc3RQb3MgPSBtLmluZGV4ICsgbVswXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBwYXJ0cy5wdXNoKHN0ci5zdWJzdHJpbmcobGFzdFBvcykpO1xuICAgICAgcmV0dXJuIHBhcnRzO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlRW5kVGFnKHBhcnRzLCBwb3MsIGgsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsIHN0YXRlKSB7XG4gICAgdmFyIHRhZyA9IHBhcnNlVGFnQW5kQXR0cnMocGFydHMsIHBvcyk7XG4gICAgLy8gZHJvcCB1bmNsb3NlZCB0YWdzXG4gICAgaWYgKCF0YWcpIHsgcmV0dXJuIHBhcnRzLmxlbmd0aDsgfVxuICAgIGlmIChoLmVuZFRhZykge1xuICAgICAgaC5lbmRUYWcodGFnLm5hbWUsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwb3MsIHN0YXRlLCBwYXJhbSkpO1xuICAgIH1cbiAgICByZXR1cm4gdGFnLm5leHQ7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZVN0YXJ0VGFnKHBhcnRzLCBwb3MsIGgsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsIHN0YXRlKSB7XG4gICAgdmFyIHRhZyA9IHBhcnNlVGFnQW5kQXR0cnMocGFydHMsIHBvcyk7XG4gICAgLy8gZHJvcCB1bmNsb3NlZCB0YWdzXG4gICAgaWYgKCF0YWcpIHsgcmV0dXJuIHBhcnRzLmxlbmd0aDsgfVxuICAgIGlmIChoLnN0YXJ0VGFnKSB7XG4gICAgICBoLnN0YXJ0VGFnKHRhZy5uYW1lLCB0YWcuYXR0cnMsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCB0YWcubmV4dCwgc3RhdGUsIHBhcmFtKSk7XG4gICAgfVxuICAgIC8vIHRhZ3MgbGlrZSA8c2NyaXB0PiBhbmQgPHRleHRhcmVhPiBoYXZlIHNwZWNpYWwgcGFyc2luZ1xuICAgIGlmICh0YWcuZWZsYWdzICYgRUZMQUdTX1RFWFQpIHtcbiAgICAgIHJldHVybiBwYXJzZVRleHQocGFydHMsIHRhZywgaCwgcGFyYW0sIGNvbnRpbnVhdGlvbk1hcmtlciwgc3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGFnLm5leHQ7XG4gICAgfVxuICB9XG5cbiAgdmFyIGVuZFRhZ1JlID0ge307XG5cbiAgLy8gVGFncyBsaWtlIDxzY3JpcHQ+IGFuZCA8dGV4dGFyZWE+IGFyZSBmbGFnZ2VkIGFzIENEQVRBIG9yIFJDREFUQSxcbiAgLy8gd2hpY2ggbWVhbnMgZXZlcnl0aGluZyBpcyB0ZXh0IHVudGlsIHdlIHNlZSB0aGUgY29ycmVjdCBjbG9zaW5nIHRhZy5cbiAgZnVuY3Rpb24gcGFyc2VUZXh0KHBhcnRzLCB0YWcsIGgsIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsIHN0YXRlKSB7XG4gICAgdmFyIGVuZCA9IHBhcnRzLmxlbmd0aDtcbiAgICBpZiAoIWVuZFRhZ1JlLmhhc093blByb3BlcnR5KHRhZy5uYW1lKSkge1xuICAgICAgZW5kVGFnUmVbdGFnLm5hbWVdID0gbmV3IFJlZ0V4cCgnXicgKyB0YWcubmFtZSArICcoPzpbXFxcXHNcXFxcL118JCknLCAnaScpO1xuICAgIH1cbiAgICB2YXIgcmUgPSBlbmRUYWdSZVt0YWcubmFtZV07XG4gICAgdmFyIGZpcnN0ID0gdGFnLm5leHQ7XG4gICAgdmFyIHAgPSB0YWcubmV4dCArIDE7XG4gICAgZm9yICg7IHAgPCBlbmQ7IHArKykge1xuICAgICAgaWYgKHBhcnRzW3AgLSAxXSA9PT0gJzxcXC8nICYmIHJlLnRlc3QocGFydHNbcF0pKSB7IGJyZWFrOyB9XG4gICAgfVxuICAgIGlmIChwIDwgZW5kKSB7IHAgLT0gMTsgfVxuICAgIHZhciBidWYgPSBwYXJ0cy5zbGljZShmaXJzdCwgcCkuam9pbignJyk7XG4gICAgaWYgKHRhZy5lZmxhZ3MgJiBodG1sNC5lZmxhZ3NbJ0NEQVRBJ10pIHtcbiAgICAgIGlmIChoLmNkYXRhKSB7XG4gICAgICAgIGguY2RhdGEoYnVmLCBwYXJhbSwgY29udGludWF0aW9uTWFya2VyLFxuICAgICAgICAgIGNvbnRpbnVhdGlvbk1ha2VyKGgsIHBhcnRzLCBwLCBzdGF0ZSwgcGFyYW0pKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRhZy5lZmxhZ3MgJiBodG1sNC5lZmxhZ3NbJ1JDREFUQSddKSB7XG4gICAgICBpZiAoaC5yY2RhdGEpIHtcbiAgICAgICAgaC5yY2RhdGEobm9ybWFsaXplUkNEYXRhKGJ1ZiksIHBhcmFtLCBjb250aW51YXRpb25NYXJrZXIsXG4gICAgICAgICAgY29udGludWF0aW9uTWFrZXIoaCwgcGFydHMsIHAsIHN0YXRlLCBwYXJhbSkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2J1ZycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfVxuXG4gIC8vIGF0IHRoaXMgcG9pbnQsIHBhcnRzW3Bvcy0xXSBpcyBlaXRoZXIgXCI8XCIgb3IgXCI8XFwvXCIuXG4gIGZ1bmN0aW9uIHBhcnNlVGFnQW5kQXR0cnMocGFydHMsIHBvcykge1xuICAgIHZhciBtID0gL14oWy1cXHc6XSspLy5leGVjKHBhcnRzW3Bvc10pO1xuICAgIHZhciB0YWcgPSB7fTtcbiAgICB0YWcubmFtZSA9IG1bMV0udG9Mb3dlckNhc2UoKTtcbiAgICB0YWcuZWZsYWdzID0gaHRtbDQuRUxFTUVOVFNbdGFnLm5hbWVdO1xuICAgIHZhciBidWYgPSBwYXJ0c1twb3NdLnN1YnN0cihtWzBdLmxlbmd0aCk7XG4gICAgLy8gRmluZCB0aGUgbmV4dCAnPicuICBXZSBvcHRpbWlzdGljYWxseSBhc3N1bWUgdGhpcyAnPicgaXMgbm90IGluIGFcbiAgICAvLyBxdW90ZWQgY29udGV4dCwgYW5kIGZ1cnRoZXIgZG93biB3ZSBmaXggdGhpbmdzIHVwIGlmIGl0IHR1cm5zIG91dCB0b1xuICAgIC8vIGJlIHF1b3RlZC5cbiAgICB2YXIgcCA9IHBvcyArIDE7XG4gICAgdmFyIGVuZCA9IHBhcnRzLmxlbmd0aDtcbiAgICBmb3IgKDsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICBpZiAocGFydHNbcF0gPT09ICc+JykgeyBicmVhazsgfVxuICAgICAgYnVmICs9IHBhcnRzW3BdO1xuICAgIH1cbiAgICBpZiAoZW5kIDw9IHApIHsgcmV0dXJuIHZvaWQgMDsgfVxuICAgIHZhciBhdHRycyA9IFtdO1xuICAgIHdoaWxlIChidWYgIT09ICcnKSB7XG4gICAgICBtID0gQVRUUl9SRS5leGVjKGJ1Zik7XG4gICAgICBpZiAoIW0pIHtcbiAgICAgICAgLy8gTm8gYXR0cmlidXRlIGZvdW5kOiBza2lwIGdhcmJhZ2VcbiAgICAgICAgYnVmID0gYnVmLnJlcGxhY2UoL15bXFxzXFxTXVteYS16XFxzXSovLCAnJyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoKG1bNF0gJiYgIW1bNV0pIHx8IChtWzZdICYmICFtWzddKSkge1xuICAgICAgICAvLyBVbnRlcm1pbmF0ZWQgcXVvdGU6IHNsdXJwIHRvIHRoZSBuZXh0IHVucXVvdGVkICc+J1xuICAgICAgICB2YXIgcXVvdGUgPSBtWzRdIHx8IG1bNl07XG4gICAgICAgIHZhciBzYXdRdW90ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgYWJ1ZiA9IFtidWYsIHBhcnRzW3ArK11dO1xuICAgICAgICBmb3IgKDsgcCA8IGVuZDsgcCsrKSB7XG4gICAgICAgICAgaWYgKHNhd1F1b3RlKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbcF0gPT09ICc+JykgeyBicmVhazsgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoMCA8PSBwYXJ0c1twXS5pbmRleE9mKHF1b3RlKSkge1xuICAgICAgICAgICAgc2F3UXVvdGUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhYnVmLnB1c2gocGFydHNbcF0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNsdXJwIGZhaWxlZDogbG9zZSB0aGUgZ2FyYmFnZVxuICAgICAgICBpZiAoZW5kIDw9IHApIHsgYnJlYWs7IH1cbiAgICAgICAgLy8gT3RoZXJ3aXNlIHJldHJ5IGF0dHJpYnV0ZSBwYXJzaW5nXG4gICAgICAgIGJ1ZiA9IGFidWYuam9pbignJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBoYXZlIGFuIGF0dHJpYnV0ZVxuICAgICAgICB2YXIgYU5hbWUgPSBtWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBhVmFsdWUgPSBtWzJdID8gZGVjb2RlVmFsdWUobVszXSkgOiAnJztcbiAgICAgICAgYXR0cnMucHVzaChhTmFtZSwgYVZhbHVlKTtcbiAgICAgICAgYnVmID0gYnVmLnN1YnN0cihtWzBdLmxlbmd0aCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRhZy5hdHRycyA9IGF0dHJzO1xuICAgIHRhZy5uZXh0ID0gcCArIDE7XG4gICAgcmV0dXJuIHRhZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZVZhbHVlKHYpIHtcbiAgICB2YXIgcSA9IHYuY2hhckNvZGVBdCgwKTtcbiAgICBpZiAocSA9PT0gMHgyMiB8fCBxID09PSAweDI3KSB7IC8vIFwiIG9yICdcbiAgICAgIHYgPSB2LnN1YnN0cigxLCB2Lmxlbmd0aCAtIDIpO1xuICAgIH1cbiAgICByZXR1cm4gdW5lc2NhcGVFbnRpdGllcyhzdHJpcE5VTHModikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHN0cmlwcyB1bnNhZmUgdGFncyBhbmQgYXR0cmlidXRlcyBmcm9tIGh0bWwuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBBcnJheS48c3RyaW5nPik6ID9BcnJheS48c3RyaW5nPn0gdGFnUG9saWN5XG4gICAqICAgICBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgKHRhZ05hbWUsIGF0dHJpYnNbXSksIHdoZXJlIHRhZ05hbWUgaXMgYSBrZXkgaW5cbiAgICogICAgIGh0bWw0LkVMRU1FTlRTIGFuZCBhdHRyaWJzIGlzIGFuIGFycmF5IG9mIGFsdGVybmF0aW5nIGF0dHJpYnV0ZSBuYW1lc1xuICAgKiAgICAgYW5kIHZhbHVlcy4gIEl0IHNob3VsZCByZXR1cm4gYSByZWNvcmQgKGFzIGZvbGxvd3MpLCBvciBudWxsIHRvIGRlbGV0ZVxuICAgKiAgICAgdGhlIGVsZW1lbnQuICBJdCdzIG9rYXkgZm9yIHRhZ1BvbGljeSB0byBtb2RpZnkgdGhlIGF0dHJpYnMgYXJyYXksXG4gICAqICAgICBidXQgdGhlIHNhbWUgYXJyYXkgaXMgcmV1c2VkLCBzbyBpdCBzaG91bGQgbm90IGJlIGhlbGQgYmV0d2VlbiBjYWxscy5cbiAgICogICAgIFJlY29yZCBrZXlzOlxuICAgKiAgICAgICAgYXR0cmliczogKHJlcXVpcmVkKSBTYW5pdGl6ZWQgYXR0cmlidXRlcyBhcnJheS5cbiAgICogICAgICAgIHRhZ05hbWU6IFJlcGxhY2VtZW50IHRhZyBuYW1lLlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbihzdHJpbmcsIEFycmF5KX0gQSBmdW5jdGlvbiB0aGF0IHNhbml0aXplcyBhIHN0cmluZyBvZlxuICAgKiAgICAgSFRNTCBhbmQgYXBwZW5kcyByZXN1bHQgc3RyaW5ncyB0byB0aGUgc2Vjb25kIGFyZ3VtZW50LCBhbiBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIG1ha2VIdG1sU2FuaXRpemVyKHRhZ1BvbGljeSkge1xuICAgIHZhciBzdGFjaztcbiAgICB2YXIgaWdub3Jpbmc7XG4gICAgdmFyIGVtaXQgPSBmdW5jdGlvbiAodGV4dCwgb3V0KSB7XG4gICAgICBpZiAoIWlnbm9yaW5nKSB7IG91dC5wdXNoKHRleHQpOyB9XG4gICAgfTtcbiAgICByZXR1cm4gbWFrZVNheFBhcnNlcih7XG4gICAgICAnc3RhcnREb2MnOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHN0YWNrID0gW107XG4gICAgICAgIGlnbm9yaW5nID0gZmFsc2U7XG4gICAgICB9LFxuICAgICAgJ3N0YXJ0VGFnJzogZnVuY3Rpb24odGFnTmFtZU9yaWcsIGF0dHJpYnMsIG91dCkge1xuICAgICAgICBpZiAoaWdub3JpbmcpIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICghaHRtbDQuRUxFTUVOVFMuaGFzT3duUHJvcGVydHkodGFnTmFtZU9yaWcpKSB7IHJldHVybjsgfVxuICAgICAgICB2YXIgZWZsYWdzT3JpZyA9IGh0bWw0LkVMRU1FTlRTW3RhZ05hbWVPcmlnXTtcbiAgICAgICAgaWYgKGVmbGFnc09yaWcgJiBodG1sNC5lZmxhZ3NbJ0ZPTERBQkxFJ10pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGVjaXNpb24gPSB0YWdQb2xpY3kodGFnTmFtZU9yaWcsIGF0dHJpYnMpO1xuICAgICAgICBpZiAoIWRlY2lzaW9uKSB7XG4gICAgICAgICAgaWdub3JpbmcgPSAhKGVmbGFnc09yaWcgJiBodG1sNC5lZmxhZ3NbJ0VNUFRZJ10pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGVjaXNpb24gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0YWdQb2xpY3kgZGlkIG5vdCByZXR1cm4gb2JqZWN0IChvbGQgQVBJPyknKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ2F0dHJpYnMnIGluIGRlY2lzaW9uKSB7XG4gICAgICAgICAgYXR0cmlicyA9IGRlY2lzaW9uWydhdHRyaWJzJ107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0YWdQb2xpY3kgZ2F2ZSBubyBhdHRyaWJzJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVmbGFnc1JlcDtcbiAgICAgICAgdmFyIHRhZ05hbWVSZXA7XG4gICAgICAgIGlmICgndGFnTmFtZScgaW4gZGVjaXNpb24pIHtcbiAgICAgICAgICB0YWdOYW1lUmVwID0gZGVjaXNpb25bJ3RhZ05hbWUnXTtcbiAgICAgICAgICBlZmxhZ3NSZXAgPSBodG1sNC5FTEVNRU5UU1t0YWdOYW1lUmVwXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0YWdOYW1lUmVwID0gdGFnTmFtZU9yaWc7XG4gICAgICAgICAgZWZsYWdzUmVwID0gZWZsYWdzT3JpZztcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPKG1pa2VzYW11ZWwpOiByZWx5aW5nIG9uIHRhZ1BvbGljeSBub3QgdG8gaW5zZXJ0IHVuc2FmZVxuICAgICAgICAvLyBhdHRyaWJ1dGUgbmFtZXMuXG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhbiBvcHRpb25hbC1lbmQtdGFnIGVsZW1lbnQgYW5kIGVpdGhlciB0aGlzIGVsZW1lbnQgb3IgaXRzXG4gICAgICAgIC8vIHByZXZpb3VzIGxpa2Ugc2libGluZyB3YXMgcmV3cml0dGVuLCB0aGVuIGluc2VydCBhIGNsb3NlIHRhZyB0b1xuICAgICAgICAvLyBwcmVzZXJ2ZSBzdHJ1Y3R1cmUuXG4gICAgICAgIGlmIChlZmxhZ3NPcmlnICYgaHRtbDQuZWZsYWdzWydPUFRJT05BTF9FTkRUQUcnXSkge1xuICAgICAgICAgIHZhciBvblN0YWNrID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKG9uU3RhY2sgJiYgb25TdGFjay5vcmlnID09PSB0YWdOYW1lT3JpZyAmJlxuICAgICAgICAgICAgICAob25TdGFjay5yZXAgIT09IHRhZ05hbWVSZXAgfHwgdGFnTmFtZU9yaWcgIT09IHRhZ05hbWVSZXApKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2goJzxcXC8nLCBvblN0YWNrLnJlcCwgJz4nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShlZmxhZ3NPcmlnICYgaHRtbDQuZWZsYWdzWydFTVBUWSddKSkge1xuICAgICAgICAgIHN0YWNrLnB1c2goe29yaWc6IHRhZ05hbWVPcmlnLCByZXA6IHRhZ05hbWVSZXB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG91dC5wdXNoKCc8JywgdGFnTmFtZVJlcCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXR0cmlicy5sZW5ndGg7IGkgPCBuOyBpICs9IDIpIHtcbiAgICAgICAgICB2YXIgYXR0cmliTmFtZSA9IGF0dHJpYnNbaV0sXG4gICAgICAgICAgICAgIHZhbHVlID0gYXR0cmlic1tpICsgMV07XG4gICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDApIHtcbiAgICAgICAgICAgIG91dC5wdXNoKCcgJywgYXR0cmliTmFtZSwgJz1cIicsIGVzY2FwZUF0dHJpYih2YWx1ZSksICdcIicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvdXQucHVzaCgnPicpO1xuXG4gICAgICAgIGlmICgoZWZsYWdzT3JpZyAmIGh0bWw0LmVmbGFnc1snRU1QVFknXSlcbiAgICAgICAgICAgICYmICEoZWZsYWdzUmVwICYgaHRtbDQuZWZsYWdzWydFTVBUWSddKSkge1xuICAgICAgICAgIC8vIHJlcGxhY2VtZW50IGlzIG5vbi1lbXB0eSwgc3ludGhlc2l6ZSBlbmQgdGFnXG4gICAgICAgICAgb3V0LnB1c2goJzxcXC8nLCB0YWdOYW1lUmVwLCAnPicpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ2VuZFRhZyc6IGZ1bmN0aW9uKHRhZ05hbWUsIG91dCkge1xuICAgICAgICBpZiAoaWdub3JpbmcpIHtcbiAgICAgICAgICBpZ25vcmluZyA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWh0bWw0LkVMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7IHJldHVybjsgfVxuICAgICAgICB2YXIgZWZsYWdzID0gaHRtbDQuRUxFTUVOVFNbdGFnTmFtZV07XG4gICAgICAgIGlmICghKGVmbGFncyAmIChodG1sNC5lZmxhZ3NbJ0VNUFRZJ10gfCBodG1sNC5lZmxhZ3NbJ0ZPTERBQkxFJ10pKSkge1xuICAgICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgICBpZiAoZWZsYWdzICYgaHRtbDQuZWZsYWdzWydPUFRJT05BTF9FTkRUQUcnXSkge1xuICAgICAgICAgICAgZm9yIChpbmRleCA9IHN0YWNrLmxlbmd0aDsgLS1pbmRleCA+PSAwOykge1xuICAgICAgICAgICAgICB2YXIgc3RhY2tFbE9yaWdUYWcgPSBzdGFja1tpbmRleF0ub3JpZztcbiAgICAgICAgICAgICAgaWYgKHN0YWNrRWxPcmlnVGFnID09PSB0YWdOYW1lKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgIGlmICghKGh0bWw0LkVMRU1FTlRTW3N0YWNrRWxPcmlnVGFnXSAmXG4gICAgICAgICAgICAgICAgICAgIGh0bWw0LmVmbGFnc1snT1BUSU9OQUxfRU5EVEFHJ10pKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgcG9wIG5vbiBvcHRpb25hbCBlbmQgdGFncyBsb29raW5nIGZvciBhIG1hdGNoLlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gc3RhY2subGVuZ3RoOyAtLWluZGV4ID49IDA7KSB7XG4gICAgICAgICAgICAgIGlmIChzdGFja1tpbmRleF0ub3JpZyA9PT0gdGFnTmFtZSkgeyBicmVhazsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaW5kZXggPCAwKSB7IHJldHVybjsgfSAgLy8gTm90IG9wZW5lZC5cbiAgICAgICAgICBmb3IgKHZhciBpID0gc3RhY2subGVuZ3RoOyAtLWkgPiBpbmRleDspIHtcbiAgICAgICAgICAgIHZhciBzdGFja0VsUmVwVGFnID0gc3RhY2tbaV0ucmVwO1xuICAgICAgICAgICAgaWYgKCEoaHRtbDQuRUxFTUVOVFNbc3RhY2tFbFJlcFRhZ10gJlxuICAgICAgICAgICAgICAgICAgaHRtbDQuZWZsYWdzWydPUFRJT05BTF9FTkRUQUcnXSkpIHtcbiAgICAgICAgICAgICAgb3V0LnB1c2goJzxcXC8nLCBzdGFja0VsUmVwVGFnLCAnPicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaW5kZXggPCBzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhZ05hbWUgPSBzdGFja1tpbmRleF0ucmVwO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGFjay5sZW5ndGggPSBpbmRleDtcbiAgICAgICAgICBvdXQucHVzaCgnPFxcLycsIHRhZ05hbWUsICc+Jyk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAncGNkYXRhJzogZW1pdCxcbiAgICAgICdyY2RhdGEnOiBlbWl0LFxuICAgICAgJ2NkYXRhJzogZW1pdCxcbiAgICAgICdlbmREb2MnOiBmdW5jdGlvbihvdXQpIHtcbiAgICAgICAgZm9yICg7IHN0YWNrLmxlbmd0aDsgc3RhY2subGVuZ3RoLS0pIHtcbiAgICAgICAgICBvdXQucHVzaCgnPFxcLycsIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLnJlcCwgJz4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIEFMTE9XRURfVVJJX1NDSEVNRVMgPSAvXig/Omh0dHBzP3xtYWlsdG98ZGF0YSkkL2k7XG5cbiAgZnVuY3Rpb24gc2FmZVVyaSh1cmksIGVmZmVjdCwgbHR5cGUsIGhpbnRzLCBuYWl2ZVVyaVJld3JpdGVyKSB7XG4gICAgaWYgKCFuYWl2ZVVyaVJld3JpdGVyKSB7IHJldHVybiBudWxsOyB9XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYXJzZWQgPSBVUkkucGFyc2UoJycgKyB1cmkpO1xuICAgICAgaWYgKHBhcnNlZCkge1xuICAgICAgICBpZiAoIXBhcnNlZC5oYXNTY2hlbWUoKSB8fFxuICAgICAgICAgICAgQUxMT1dFRF9VUklfU0NIRU1FUy50ZXN0KHBhcnNlZC5nZXRTY2hlbWUoKSkpIHtcbiAgICAgICAgICB2YXIgc2FmZSA9IG5haXZlVXJpUmV3cml0ZXIocGFyc2VkLCBlZmZlY3QsIGx0eXBlLCBoaW50cyk7XG4gICAgICAgICAgcmV0dXJuIHNhZmUgPyBzYWZlLnRvU3RyaW5nKCkgOiBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9nKGxvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKCFhdHRyaWJOYW1lKSB7XG4gICAgICBsb2dnZXIodGFnTmFtZSArIFwiIHJlbW92ZWRcIiwge1xuICAgICAgICBjaGFuZ2U6IFwicmVtb3ZlZFwiLFxuICAgICAgICB0YWdOYW1lOiB0YWdOYW1lXG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgdmFyIGNoYW5nZWQgPSBcImNoYW5nZWRcIjtcbiAgICAgIGlmIChvbGRWYWx1ZSAmJiAhbmV3VmFsdWUpIHtcbiAgICAgICAgY2hhbmdlZCA9IFwicmVtb3ZlZFwiO1xuICAgICAgfSBlbHNlIGlmICghb2xkVmFsdWUgJiYgbmV3VmFsdWUpICB7XG4gICAgICAgIGNoYW5nZWQgPSBcImFkZGVkXCI7XG4gICAgICB9XG4gICAgICBsb2dnZXIodGFnTmFtZSArIFwiLlwiICsgYXR0cmliTmFtZSArIFwiIFwiICsgY2hhbmdlZCwge1xuICAgICAgICBjaGFuZ2U6IGNoYW5nZWQsXG4gICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgIGF0dHJpYk5hbWU6IGF0dHJpYk5hbWUsXG4gICAgICAgIG9sZFZhbHVlOiBvbGRWYWx1ZSxcbiAgICAgICAgbmV3VmFsdWU6IG5ld1ZhbHVlXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsb29rdXBBdHRyaWJ1dGUobWFwLCB0YWdOYW1lLCBhdHRyaWJOYW1lKSB7XG4gICAgdmFyIGF0dHJpYktleTtcbiAgICBhdHRyaWJLZXkgPSB0YWdOYW1lICsgJzo6JyArIGF0dHJpYk5hbWU7XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShhdHRyaWJLZXkpKSB7XG4gICAgICByZXR1cm4gbWFwW2F0dHJpYktleV07XG4gICAgfVxuICAgIGF0dHJpYktleSA9ICcqOjonICsgYXR0cmliTmFtZTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGF0dHJpYktleSkpIHtcbiAgICAgIHJldHVybiBtYXBbYXR0cmliS2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHZvaWQgMDtcbiAgfVxuICBmdW5jdGlvbiBnZXRBdHRyaWJ1dGVUeXBlKHRhZ05hbWUsIGF0dHJpYk5hbWUpIHtcbiAgICByZXR1cm4gbG9va3VwQXR0cmlidXRlKGh0bWw0LkFUVFJJQlMsIHRhZ05hbWUsIGF0dHJpYk5hbWUpO1xuICB9XG4gIGZ1bmN0aW9uIGdldExvYWRlclR5cGUodGFnTmFtZSwgYXR0cmliTmFtZSkge1xuICAgIHJldHVybiBsb29rdXBBdHRyaWJ1dGUoaHRtbDQuTE9BREVSVFlQRVMsIHRhZ05hbWUsIGF0dHJpYk5hbWUpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFVyaUVmZmVjdCh0YWdOYW1lLCBhdHRyaWJOYW1lKSB7XG4gICAgcmV0dXJuIGxvb2t1cEF0dHJpYnV0ZShodG1sNC5VUklFRkZFQ1RTLCB0YWdOYW1lLCBhdHRyaWJOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTYW5pdGl6ZXMgYXR0cmlidXRlcyBvbiBhbiBIVE1MIHRhZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgQW4gSFRNTCB0YWcgbmFtZSBpbiBsb3dlcmNhc2UuXG4gICAqIEBwYXJhbSB7QXJyYXkuPD9zdHJpbmc+fSBhdHRyaWJzIEFuIGFycmF5IG9mIGFsdGVybmF0aW5nIG5hbWVzIGFuZCB2YWx1ZXMuXG4gICAqIEBwYXJhbSB7P2Z1bmN0aW9uKD9zdHJpbmcpOiA/c3RyaW5nfSBvcHRfbmFpdmVVcmlSZXdyaXRlciBBIHRyYW5zZm9ybSB0b1xuICAgKiAgICAgYXBwbHkgdG8gVVJJIGF0dHJpYnV0ZXM7IGl0IGNhbiByZXR1cm4gYSBuZXcgc3RyaW5nIHZhbHVlLCBvciBudWxsIHRvXG4gICAqICAgICBkZWxldGUgdGhlIGF0dHJpYnV0ZS4gIElmIHVuc3BlY2lmaWVkLCBVUkkgYXR0cmlidXRlcyBhcmUgZGVsZXRlZC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbig/c3RyaW5nKTogP3N0cmluZ30gb3B0X25tVG9rZW5Qb2xpY3kgQSB0cmFuc2Zvcm0gdG8gYXBwbHlcbiAgICogICAgIHRvIGF0dHJpYnV0ZXMgY29udGFpbmluZyBIVE1MIG5hbWVzLCBlbGVtZW50IElEcywgYW5kIHNwYWNlLXNlcGFyYXRlZFxuICAgKiAgICAgbGlzdHMgb2YgY2xhc3NlczsgaXQgY2FuIHJldHVybiBhIG5ldyBzdHJpbmcgdmFsdWUsIG9yIG51bGwgdG8gZGVsZXRlXG4gICAqICAgICB0aGUgYXR0cmlidXRlLiAgSWYgdW5zcGVjaWZpZWQsIHRoZXNlIGF0dHJpYnV0ZXMgYXJlIGtlcHQgdW5jaGFuZ2VkLlxuICAgKiBAcmV0dXJuIHtBcnJheS48P3N0cmluZz59IFRoZSBzYW5pdGl6ZWQgYXR0cmlidXRlcyBhcyBhIGxpc3Qgb2YgYWx0ZXJuYXRpbmdcbiAgICogICAgIG5hbWVzIGFuZCB2YWx1ZXMsIHdoZXJlIGEgbnVsbCB2YWx1ZSBtZWFucyB0byBvbWl0IHRoZSBhdHRyaWJ1dGUuXG4gICAqL1xuICBmdW5jdGlvbiBzYW5pdGl6ZUF0dHJpYnModGFnTmFtZSwgYXR0cmlicyxcbiAgICBvcHRfbmFpdmVVcmlSZXdyaXRlciwgb3B0X25tVG9rZW5Qb2xpY3ksIG9wdF9sb2dnZXIpIHtcbiAgICAvLyBUT0RPKGZlbGl4OGEpOiBpdCdzIG9ibm94aW91cyB0aGF0IGRvbWFkbyBkdXBsaWNhdGVzIG11Y2ggb2YgdGhpc1xuICAgIC8vIFRPRE8oZmVsaXg4YSk6IG1heWJlIGNvbnNpc3RlbnRseSBlbmZvcmNlIGNvbnN0cmFpbnRzIGxpa2UgdGFyZ2V0PVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cmlicy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgdmFyIGF0dHJpYk5hbWUgPSBhdHRyaWJzW2ldO1xuICAgICAgdmFyIHZhbHVlID0gYXR0cmlic1tpICsgMV07XG4gICAgICB2YXIgb2xkVmFsdWUgPSB2YWx1ZTtcbiAgICAgIHZhciBhdHlwZSA9IG51bGwsIGF0dHJpYktleTtcbiAgICAgIGlmICgoYXR0cmliS2V5ID0gdGFnTmFtZSArICc6OicgKyBhdHRyaWJOYW1lLFxuICAgICAgICAgICBodG1sNC5BVFRSSUJTLmhhc093blByb3BlcnR5KGF0dHJpYktleSkpIHx8XG4gICAgICAgICAgKGF0dHJpYktleSA9ICcqOjonICsgYXR0cmliTmFtZSxcbiAgICAgICAgICAgaHRtbDQuQVRUUklCUy5oYXNPd25Qcm9wZXJ0eShhdHRyaWJLZXkpKSkge1xuICAgICAgICBhdHlwZSA9IGh0bWw0LkFUVFJJQlNbYXR0cmliS2V5XTtcbiAgICAgIH1cbiAgICAgIGlmIChhdHlwZSAhPT0gbnVsbCkge1xuICAgICAgICBzd2l0Y2ggKGF0eXBlKSB7XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnTk9ORSddOiBicmVhaztcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydTQ1JJUFQnXTpcbiAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnU1RZTEUnXTpcbiAgICAgICAgICAgIGlmICgndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHBhcnNlQ3NzRGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYgKG9wdF9sb2dnZXIpIHtcbiAgICAgICAgICAgICAgICBsb2cob3B0X2xvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIHZhbHVlKTtcblx0ICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzYW5pdGl6ZWREZWNsYXJhdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIHBhcnNlQ3NzRGVjbGFyYXRpb25zKFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uOiBmdW5jdGlvbiAocHJvcGVydHksIHRva2Vucykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm9ybVByb3AgPSBwcm9wZXJ0eS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2NoZW1hID0gY3NzU2NoZW1hW25vcm1Qcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzY2hlbWEpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2FuaXRpemVDc3NQcm9wZXJ0eShcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1Qcm9wLCBzY2hlbWEsIHRva2VucyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdF9uYWl2ZVVyaVJld3JpdGVyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2FmZVVyaShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsLCBodG1sNC51ZWZmZWN0cy5TQU1FX0RPQ1VNRU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sNC5sdHlwZXMuU0FOREJPWEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJUWVBFXCI6IFwiQ1NTXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJDU1NfUFJPUFwiOiBub3JtUHJvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBvcHRfbmFpdmVVcmlSZXdyaXRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHNhbml0aXplZERlY2xhcmF0aW9ucy5wdXNoKHByb3BlcnR5ICsgJzogJyArIHRva2Vucy5qb2luKCcgJykpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFsdWUgPSBzYW5pdGl6ZWREZWNsYXJhdGlvbnMubGVuZ3RoID4gMCA/XG4gICAgICAgICAgICAgIHNhbml0aXplZERlY2xhcmF0aW9ucy5qb2luKCcgOyAnKSA6IG51bGw7XG4gICAgICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgICAgICBsb2cob3B0X2xvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ0lEJ106XG4gICAgICAgICAgY2FzZSBodG1sNC5hdHlwZVsnSURSRUYnXTpcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydJRFJFRlMnXTpcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydHTE9CQUxfTkFNRSddOlxuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ0xPQ0FMX05BTUUnXTpcbiAgICAgICAgICBjYXNlIGh0bWw0LmF0eXBlWydDTEFTU0VTJ106XG4gICAgICAgICAgICB2YWx1ZSA9IG9wdF9ubVRva2VuUG9saWN5ID8gb3B0X25tVG9rZW5Qb2xpY3kodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgICAgICBsb2cob3B0X2xvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ1VSSSddOlxuICAgICAgICAgICAgdmFsdWUgPSBzYWZlVXJpKHZhbHVlLFxuICAgICAgICAgICAgICBnZXRVcmlFZmZlY3QodGFnTmFtZSwgYXR0cmliTmFtZSksXG4gICAgICAgICAgICAgIGdldExvYWRlclR5cGUodGFnTmFtZSwgYXR0cmliTmFtZSksXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcIlRZUEVcIjogXCJNQVJLVVBcIixcbiAgICAgICAgICAgICAgICBcIlhNTF9BVFRSXCI6IGF0dHJpYk5hbWUsXG4gICAgICAgICAgICAgICAgXCJYTUxfVEFHXCI6IHRhZ05hbWVcbiAgICAgICAgICAgICAgfSwgb3B0X25haXZlVXJpUmV3cml0ZXIpO1xuICAgICAgICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgICAgICBsb2cob3B0X2xvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgaHRtbDQuYXR5cGVbJ1VSSV9GUkFHTUVOVCddOlxuICAgICAgICAgICAgaWYgKHZhbHVlICYmICcjJyA9PT0gdmFsdWUuY2hhckF0KDApKSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDEpOyAgLy8gcmVtb3ZlIHRoZSBsZWFkaW5nICcjJ1xuICAgICAgICAgICAgICB2YWx1ZSA9IG9wdF9ubVRva2VuUG9saWN5ID8gb3B0X25tVG9rZW5Qb2xpY3kodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSAnIycgKyB2YWx1ZTsgIC8vIHJlc3RvcmUgdGhlIGxlYWRpbmcgJyMnXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChvcHRfbG9nZ2VyKSB7XG4gICAgICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCBhdHRyaWJOYW1lLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgaWYgKG9wdF9sb2dnZXIpIHtcbiAgICAgICAgICBsb2cob3B0X2xvZ2dlciwgdGFnTmFtZSwgYXR0cmliTmFtZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXR0cmlic1tpICsgMV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHRhZyBwb2xpY3kgdGhhdCBvbWl0cyBhbGwgdGFncyBtYXJrZWQgVU5TQUZFIGluIGh0bWw0LWRlZnMuanNcbiAgICogYW5kIGFwcGxpZXMgdGhlIGRlZmF1bHQgYXR0cmlidXRlIHNhbml0aXplciB3aXRoIHRoZSBzdXBwbGllZCBwb2xpY3kgZm9yXG4gICAqIFVSSSBhdHRyaWJ1dGVzIGFuZCBOTVRPS0VOIGF0dHJpYnV0ZXMuXG4gICAqIEBwYXJhbSB7P2Z1bmN0aW9uKD9zdHJpbmcpOiA/c3RyaW5nfSBvcHRfbmFpdmVVcmlSZXdyaXRlciBBIHRyYW5zZm9ybSB0b1xuICAgKiAgICAgYXBwbHkgdG8gVVJJIGF0dHJpYnV0ZXMuICBJZiBub3QgZ2l2ZW4sIFVSSSBhdHRyaWJ1dGVzIGFyZSBkZWxldGVkLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKD9zdHJpbmcpOiA/c3RyaW5nfSBvcHRfbm1Ub2tlblBvbGljeSBBIHRyYW5zZm9ybSB0byBhcHBseVxuICAgKiAgICAgdG8gYXR0cmlidXRlcyBjb250YWluaW5nIEhUTUwgbmFtZXMsIGVsZW1lbnQgSURzLCBhbmQgc3BhY2Utc2VwYXJhdGVkXG4gICAqICAgICBsaXN0cyBvZiBjbGFzc2VzLiAgSWYgbm90IGdpdmVuLCBzdWNoIGF0dHJpYnV0ZXMgYXJlIGxlZnQgdW5jaGFuZ2VkLlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbihzdHJpbmcsIEFycmF5Ljw/c3RyaW5nPil9IEEgdGFnUG9saWN5IHN1aXRhYmxlIGZvclxuICAgKiAgICAgcGFzc2luZyB0byBodG1sLnNhbml0aXplLlxuICAgKi9cbiAgZnVuY3Rpb24gbWFrZVRhZ1BvbGljeShcbiAgICBvcHRfbmFpdmVVcmlSZXdyaXRlciwgb3B0X25tVG9rZW5Qb2xpY3ksIG9wdF9sb2dnZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24odGFnTmFtZSwgYXR0cmlicykge1xuICAgICAgaWYgKCEoaHRtbDQuRUxFTUVOVFNbdGFnTmFtZV0gJiBodG1sNC5lZmxhZ3NbJ1VOU0FGRSddKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICdhdHRyaWJzJzogc2FuaXRpemVBdHRyaWJzKHRhZ05hbWUsIGF0dHJpYnMsXG4gICAgICAgICAgICBvcHRfbmFpdmVVcmlSZXdyaXRlciwgb3B0X25tVG9rZW5Qb2xpY3ksIG9wdF9sb2dnZXIpXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob3B0X2xvZ2dlcikge1xuICAgICAgICAgIGxvZyhvcHRfbG9nZ2VyLCB0YWdOYW1lLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2FuaXRpemVzIEhUTUwgdGFncyBhbmQgYXR0cmlidXRlcyBhY2NvcmRpbmcgdG8gYSBnaXZlbiBwb2xpY3kuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dEh0bWwgVGhlIEhUTUwgdG8gc2FuaXRpemUuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nLCBBcnJheS48P3N0cmluZz4pfSB0YWdQb2xpY3kgQSBmdW5jdGlvbiB0aGF0XG4gICAqICAgICBkZWNpZGVzIHdoaWNoIHRhZ3MgdG8gYWNjZXB0IGFuZCBzYW5pdGl6ZXMgdGhlaXIgYXR0cmlidXRlcyAoc2VlXG4gICAqICAgICBtYWtlSHRtbFNhbml0aXplciBhYm92ZSBmb3IgZGV0YWlscykuXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIHNhbml0aXplZCBIVE1MLlxuICAgKi9cbiAgZnVuY3Rpb24gc2FuaXRpemVXaXRoUG9saWN5KGlucHV0SHRtbCwgdGFnUG9saWN5KSB7XG4gICAgdmFyIG91dHB1dEFycmF5ID0gW107XG4gICAgbWFrZUh0bWxTYW5pdGl6ZXIodGFnUG9saWN5KShpbnB1dEh0bWwsIG91dHB1dEFycmF5KTtcbiAgICByZXR1cm4gb3V0cHV0QXJyYXkuam9pbignJyk7XG4gIH1cblxuICAvKipcbiAgICogU3RyaXBzIHVuc2FmZSB0YWdzIGFuZCBhdHRyaWJ1dGVzIGZyb20gSFRNTC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGlucHV0SHRtbCBUaGUgSFRNTCB0byBzYW5pdGl6ZS5cbiAgICogQHBhcmFtIHs/ZnVuY3Rpb24oP3N0cmluZyk6ID9zdHJpbmd9IG9wdF9uYWl2ZVVyaVJld3JpdGVyIEEgdHJhbnNmb3JtIHRvXG4gICAqICAgICBhcHBseSB0byBVUkkgYXR0cmlidXRlcy4gIElmIG5vdCBnaXZlbiwgVVJJIGF0dHJpYnV0ZXMgYXJlIGRlbGV0ZWQuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oP3N0cmluZyk6ID9zdHJpbmd9IG9wdF9ubVRva2VuUG9saWN5IEEgdHJhbnNmb3JtIHRvIGFwcGx5XG4gICAqICAgICB0byBhdHRyaWJ1dGVzIGNvbnRhaW5pbmcgSFRNTCBuYW1lcywgZWxlbWVudCBJRHMsIGFuZCBzcGFjZS1zZXBhcmF0ZWRcbiAgICogICAgIGxpc3RzIG9mIGNsYXNzZXMuICBJZiBub3QgZ2l2ZW4sIHN1Y2ggYXR0cmlidXRlcyBhcmUgbGVmdCB1bmNoYW5nZWQuXG4gICAqL1xuICBmdW5jdGlvbiBzYW5pdGl6ZShpbnB1dEh0bWwsXG4gICAgb3B0X25haXZlVXJpUmV3cml0ZXIsIG9wdF9ubVRva2VuUG9saWN5LCBvcHRfbG9nZ2VyKSB7XG4gICAgdmFyIHRhZ1BvbGljeSA9IG1ha2VUYWdQb2xpY3koXG4gICAgICBvcHRfbmFpdmVVcmlSZXdyaXRlciwgb3B0X25tVG9rZW5Qb2xpY3ksIG9wdF9sb2dnZXIpO1xuICAgIHJldHVybiBzYW5pdGl6ZVdpdGhQb2xpY3koaW5wdXRIdG1sLCB0YWdQb2xpY3kpO1xuICB9XG5cbiAgLy8gRXhwb3J0IGJvdGggcXVvdGVkIGFuZCB1bnF1b3RlZCBuYW1lcyBmb3IgQ2xvc3VyZSBsaW5rYWdlLlxuICB2YXIgaHRtbCA9IHt9O1xuICBodG1sLmVzY2FwZUF0dHJpYiA9IGh0bWxbJ2VzY2FwZUF0dHJpYiddID0gZXNjYXBlQXR0cmliO1xuICBodG1sLm1ha2VIdG1sU2FuaXRpemVyID0gaHRtbFsnbWFrZUh0bWxTYW5pdGl6ZXInXSA9IG1ha2VIdG1sU2FuaXRpemVyO1xuICBodG1sLm1ha2VTYXhQYXJzZXIgPSBodG1sWydtYWtlU2F4UGFyc2VyJ10gPSBtYWtlU2F4UGFyc2VyO1xuICBodG1sLm1ha2VUYWdQb2xpY3kgPSBodG1sWydtYWtlVGFnUG9saWN5J10gPSBtYWtlVGFnUG9saWN5O1xuICBodG1sLm5vcm1hbGl6ZVJDRGF0YSA9IGh0bWxbJ25vcm1hbGl6ZVJDRGF0YSddID0gbm9ybWFsaXplUkNEYXRhO1xuICBodG1sLnNhbml0aXplID0gaHRtbFsnc2FuaXRpemUnXSA9IHNhbml0aXplO1xuICBodG1sLnNhbml0aXplQXR0cmlicyA9IGh0bWxbJ3Nhbml0aXplQXR0cmlicyddID0gc2FuaXRpemVBdHRyaWJzO1xuICBodG1sLnNhbml0aXplV2l0aFBvbGljeSA9IGh0bWxbJ3Nhbml0aXplV2l0aFBvbGljeSddID0gc2FuaXRpemVXaXRoUG9saWN5O1xuICBodG1sLnVuZXNjYXBlRW50aXRpZXMgPSBodG1sWyd1bmVzY2FwZUVudGl0aWVzJ10gPSB1bmVzY2FwZUVudGl0aWVzO1xuICByZXR1cm4gaHRtbDtcbn0pKGh0bWw0KTtcblxudmFyIGh0bWxfc2FuaXRpemUgPSBodG1sWydzYW5pdGl6ZSddO1xuXG4vLyBMb29zZW4gcmVzdHJpY3Rpb25zIG9mIENhamEnc1xuLy8gaHRtbC1zYW5pdGl6ZXIgdG8gYWxsb3cgZm9yIHN0eWxpbmdcbmh0bWw0LkFUVFJJQlNbJyo6OnN0eWxlJ10gPSAwO1xuaHRtbDQuRUxFTUVOVFNbJ3N0eWxlJ10gPSAwO1xuaHRtbDQuQVRUUklCU1snYTo6dGFyZ2V0J10gPSAwO1xuaHRtbDQuRUxFTUVOVFNbJ3ZpZGVvJ10gPSAwO1xuaHRtbDQuQVRUUklCU1sndmlkZW86OnNyYyddID0gMDtcbmh0bWw0LkFUVFJJQlNbJ3ZpZGVvOjpwb3N0ZXInXSA9IDA7XG5odG1sNC5BVFRSSUJTWyd2aWRlbzo6Y29udHJvbHMnXSA9IDA7XG5odG1sNC5FTEVNRU5UU1snYXVkaW8nXSA9IDA7XG5odG1sNC5BVFRSSUJTWydhdWRpbzo6c3JjJ10gPSAwO1xuaHRtbDQuQVRUUklCU1sndmlkZW86OmF1dG9wbGF5J10gPSAwO1xuaHRtbDQuQVRUUklCU1sndmlkZW86OmNvbnRyb2xzJ10gPSAwO1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGh0bWxfc2FuaXRpemU7XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwiYXV0aG9yXCI6IFwiTWFwYm94XCIsXG4gIFwibmFtZVwiOiBcIm1hcGJveC5qc1wiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwibWFwYm94IGphdmFzY3JpcHQgYXBpXCIsXG4gIFwidmVyc2lvblwiOiBcIjEuNi4yXCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwOi8vbWFwYm94LmNvbS9cIixcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImdpdDovL2dpdGh1Yi5jb20vbWFwYm94L21hcGJveC5qcy5naXRcIlxuICB9LFxuICBcIm1haW5cIjogXCJpbmRleC5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsZWFmbGV0XCI6IFwiMC43LjJcIixcbiAgICBcIm11c3RhY2hlXCI6IFwiMC43LjNcIixcbiAgICBcImNvcnNsaXRlXCI6IFwiMC4wLjVcIixcbiAgICBcImpzb24zXCI6IFwiZ2l0Oi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9qc29uMy5naXQjdjMuMi42XCIsXG4gICAgXCJzYW5pdGl6ZS1jYWphXCI6IFwiMC4wLjBcIixcbiAgICBcImxlYWZsZXQtaGFzaFwiOiBcIn4wLjIuMVwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJ0ZXN0XCI6IFwianNoaW50IHNyYy8qLmpzICYmIG1vY2hhLXBoYW50b21qcyB0ZXN0L2luZGV4Lmh0bWxcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsZWFmbGV0LWhhc2hcIjogXCJnaXQ6Ly9naXRodWIuY29tL21sZXZhbnMvbGVhZmxldC1oYXNoLmdpdCNiMDM5YTNhYTRlMjQ5MmE1Yzc0NDgwNzUxNzJhYzI2NzY5ZTYwMWQ2XCIsXG4gICAgXCJsZWFmbGV0LWZ1bGxzY3JlZW5cIjogXCIwLjAuMFwiLFxuICAgIFwidWdsaWZ5LWpzXCI6IFwiMi40LjhcIixcbiAgICBcIm1vY2hhXCI6IFwiMS4xNy4xXCIsXG4gICAgXCJleHBlY3QuanNcIjogXCIwLjMuMVwiLFxuICAgIFwic2lub25cIjogXCIxLjguMlwiLFxuICAgIFwibW9jaGEtcGhhbnRvbWpzXCI6IFwiMy4xLjZcIixcbiAgICBcImhhcHBlblwiOiBcIjAuMS4zXCIsXG4gICAgXCJicm93c2VyaWZ5XCI6IFwiMy4yMy4xXCIsXG4gICAgXCJqc2hpbnRcIjogXCIyLjQuNFwiLFxuICAgIFwiY2xlYW4tY3NzXCI6IFwifjIuMC43XCJcbiAgfSxcbiAgXCJvcHRpb25hbERlcGVuZGVuY2llc1wiOiB7fSxcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcIm5vZGVcIjogXCIqXCJcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIEhUVFBfVVJMUzogW1xuICAgICAgICAnaHR0cDovL2EudGlsZXMubWFwYm94LmNvbS92My8nLFxuICAgICAgICAnaHR0cDovL2IudGlsZXMubWFwYm94LmNvbS92My8nLFxuICAgICAgICAnaHR0cDovL2MudGlsZXMubWFwYm94LmNvbS92My8nLFxuICAgICAgICAnaHR0cDovL2QudGlsZXMubWFwYm94LmNvbS92My8nXSxcblxuICAgIEZPUkNFX0hUVFBTOiBmYWxzZSxcblxuICAgIEhUVFBTX1VSTFM6IFtcbiAgICAgICAgJ2h0dHBzOi8vYS50aWxlcy5tYXBib3guY29tL3YzLycsXG4gICAgICAgICdodHRwczovL2IudGlsZXMubWFwYm94LmNvbS92My8nLFxuICAgICAgICAnaHR0cHM6Ly9jLnRpbGVzLm1hcGJveC5jb20vdjMvJyxcbiAgICAgICAgJ2h0dHBzOi8vZC50aWxlcy5tYXBib3guY29tL3YzLyddXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybGhlbHBlciA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLFxuICAgIG1hcmtlciA9IHJlcXVpcmUoJy4vbWFya2VyJyksXG4gICAgc2ltcGxlc3R5bGUgPSByZXF1aXJlKCcuL3NpbXBsZXN0eWxlJyk7XG5cbi8vICMgZmVhdHVyZUxheWVyXG4vL1xuLy8gQSBsYXllciBvZiBmZWF0dXJlcywgbG9hZGVkIGZyb20gTWFwYm94IG9yIGVsc2UuIEFkZHMgdGhlIGFiaWxpdHlcbi8vIHRvIHJlc2V0IGZlYXR1cmVzLCBmaWx0ZXIgdGhlbSwgYW5kIGxvYWQgdGhlbSBmcm9tIGEgR2VvSlNPTiBVUkwuXG52YXIgRmVhdHVyZUxheWVyID0gTC5GZWF0dXJlR3JvdXAuZXh0ZW5kKHtcbiAgICBvcHRpb25zOiB7XG4gICAgICAgIGZpbHRlcjogZnVuY3Rpb24oKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgICBzYW5pdGl6ZXI6IHJlcXVpcmUoJ3Nhbml0aXplLWNhamEnKSxcbiAgICAgICAgc3R5bGU6IHNpbXBsZXN0eWxlLnN0eWxlXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMuX2xheWVycyA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlb2YgXyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHV0aWwuaWRVcmwoXywgdGhpcyk7XG4gICAgICAgIC8vIGphdmFzY3JpcHQgb2JqZWN0IG9mIFRpbGVKU09OIGRhdGFcbiAgICAgICAgfSBlbHNlIGlmIChfICYmIHR5cGVvZiBfID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhpcy5zZXRHZW9KU09OKF8pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldEdlb0pTT046IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5fZ2VvanNvbiA9IF87XG4gICAgICAgIHRoaXMuY2xlYXJMYXllcnMoKTtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZShfKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldEdlb0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ2VvanNvbjtcbiAgICB9LFxuXG4gICAgbG9hZFVSTDogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZXF1ZXN0ICYmICdhYm9ydCcgaW4gdGhpcy5fcmVxdWVzdCkgdGhpcy5fcmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICB1cmwgPSB1cmxoZWxwZXIuanNvbmlmeSh1cmwpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdCh1cmwsIEwuYmluZChmdW5jdGlvbihlcnIsIGpzb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3QgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIudHlwZSAhPT0gJ2Fib3J0Jykge1xuICAgICAgICAgICAgICAgIHV0aWwubG9nKCdjb3VsZCBub3QgbG9hZCBmZWF0dXJlcyBhdCAnICsgdXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge2Vycm9yOiBlcnJ9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0R2VvSlNPTihqc29uKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ3JlYWR5Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGxvYWRJRDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9hZFVSTCh1cmxoZWxwZXIuYmFzZSgpICsgaWQgKyAnL21hcmtlcnMuZ2VvanNvbicpO1xuICAgIH0sXG5cbiAgICBzZXRGaWx0ZXI6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmZpbHRlciA9IF87XG4gICAgICAgIGlmICh0aGlzLl9nZW9qc29uKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyTGF5ZXJzKCk7XG4gICAgICAgICAgICB0aGlzLl9pbml0aWFsaXplKHRoaXMuX2dlb2pzb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmZpbHRlcjtcbiAgICB9LFxuXG4gICAgX2luaXRpYWxpemU6IGZ1bmN0aW9uKGpzb24pIHtcbiAgICAgICAgdmFyIGZlYXR1cmVzID0gTC5VdGlsLmlzQXJyYXkoanNvbikgPyBqc29uIDoganNvbi5mZWF0dXJlcyxcbiAgICAgICAgICAgIGksIGxlbjtcblxuICAgICAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGZlYXR1cmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBhZGQgdGhpcyBpZiBnZW9tZXRyeSBvciBnZW9tZXRyaWVzIGFyZSBzZXQgYW5kIG5vdCBudWxsXG4gICAgICAgICAgICAgICAgaWYgKGZlYXR1cmVzW2ldLmdlb21ldHJpZXMgfHwgZmVhdHVyZXNbaV0uZ2VvbWV0cnkgfHwgZmVhdHVyZXNbaV0uZmVhdHVyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faW5pdGlhbGl6ZShmZWF0dXJlc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5maWx0ZXIoanNvbikpIHtcblxuICAgICAgICAgICAgdmFyIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllcihqc29uLCBtYXJrZXIuc3R5bGUpLFxuICAgICAgICAgICAgICAgIHBvcHVwSHRtbCA9IG1hcmtlci5jcmVhdGVQb3B1cChqc29uLCB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKTtcblxuICAgICAgICAgICAgaWYgKCdzZXRTdHlsZScgaW4gbGF5ZXIpIHtcbiAgICAgICAgICAgICAgICBsYXllci5zZXRTdHlsZShzaW1wbGVzdHlsZS5zdHlsZShqc29uKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxheWVyLmZlYXR1cmUgPSBqc29uO1xuXG4gICAgICAgICAgICBpZiAocG9wdXBIdG1sKSB7XG4gICAgICAgICAgICAgICAgbGF5ZXIuYmluZFBvcHVwKHBvcHVwSHRtbCwge1xuICAgICAgICAgICAgICAgICAgICBjbG9zZUJ1dHRvbjogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hZGRMYXllcihsYXllcik7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihfLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBGZWF0dXJlTGF5ZXIoXywgb3B0aW9ucyk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybGhlbHBlciA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpO1xuXG4vLyBMb3ctbGV2ZWwgZ2VvY29kaW5nIGludGVyZmFjZSAtIHdyYXBzIHNwZWNpZmljIEFQSSBjYWxscyBhbmQgdGhlaXJcbi8vIHJldHVybiB2YWx1ZXMuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKF8pIHtcblxuICAgIHZhciBnZW9jb2RlciA9IHt9LCB1cmw7XG5cbiAgICBnZW9jb2Rlci5nZXRVUkwgPSBmdW5jdGlvbihfKSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIGdlb2NvZGVyLnNldFVSTCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdXJsID0gdXJsaGVscGVyLmpzb25pZnkoXyk7XG4gICAgICAgIHJldHVybiBnZW9jb2RlcjtcbiAgICB9O1xuXG4gICAgZ2VvY29kZXIuc2V0SUQgPSBmdW5jdGlvbihfKSB7XG4gICAgICAgIHV0aWwuc3RyaWN0KF8sICdzdHJpbmcnKTtcbiAgICAgICAgZ2VvY29kZXIuc2V0VVJMKHVybGhlbHBlci5iYXNlKCkgKyBfICsgJy9nZW9jb2RlL3txdWVyeX0uanNvbicpO1xuICAgICAgICByZXR1cm4gZ2VvY29kZXI7XG4gICAgfTtcblxuICAgIGdlb2NvZGVyLnNldFRpbGVKU09OID0gZnVuY3Rpb24oXykge1xuICAgICAgICB1dGlsLnN0cmljdChfLCAnb2JqZWN0Jyk7XG4gICAgICAgIGdlb2NvZGVyLnNldFVSTChfLmdlb2NvZGVyKTtcbiAgICAgICAgcmV0dXJuIGdlb2NvZGVyO1xuICAgIH07XG5cbiAgICBnZW9jb2Rlci5xdWVyeVVSTCA9IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdXRpbC5zdHJpY3QoXywgJ3N0cmluZycpO1xuICAgICAgICBpZiAoIWdlb2NvZGVyLmdldFVSTCgpKSB0aHJvdyBuZXcgRXJyb3IoJ0dlb2NvZGluZyBtYXAgSUQgbm90IHNldCcpO1xuICAgICAgICByZXR1cm4gTC5VdGlsLnRlbXBsYXRlKGdlb2NvZGVyLmdldFVSTCgpLCB7IHF1ZXJ5OiBlbmNvZGVVUklDb21wb25lbnQoXykgfSk7XG4gICAgfTtcblxuICAgIGdlb2NvZGVyLnF1ZXJ5ID0gZnVuY3Rpb24oXywgY2FsbGJhY2spIHtcbiAgICAgICAgdXRpbC5zdHJpY3QoXywgJ3N0cmluZycpO1xuICAgICAgICB1dGlsLnN0cmljdChjYWxsYmFjaywgJ2Z1bmN0aW9uJyk7XG4gICAgICAgIHJlcXVlc3QoZ2VvY29kZXIucXVlcnlVUkwoXyksIGZ1bmN0aW9uKGVyciwganNvbikge1xuICAgICAgICAgICAgaWYgKGpzb24gJiYganNvbi5yZXN1bHRzICYmIGpzb24ucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0ge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzOiBqc29uLnJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgIGxhdGxuZzogW2pzb24ucmVzdWx0c1swXVswXS5sYXQsIGpzb24ucmVzdWx0c1swXVswXS5sb25dXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoanNvbi5yZXN1bHRzWzBdWzBdLmJvdW5kcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5ib3VuZHMgPSBqc29uLnJlc3VsdHNbMF1bMF0uYm91bmRzO1xuICAgICAgICAgICAgICAgICAgICByZXMubGJvdW5kcyA9IHV0aWwubGJvdW5kcyhyZXMuYm91bmRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICAgICAgICAgIH0gZWxzZSBjYWxsYmFjayhlcnIgfHwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBnZW9jb2RlcjtcbiAgICB9O1xuXG4gICAgLy8gYSByZXZlcnNlIGdlb2NvZGU6XG4gICAgLy9cbiAgICAvLyAgZ2VvY29kZXIucmV2ZXJzZVF1ZXJ5KFs4MCwgMjBdKVxuICAgIGdlb2NvZGVyLnJldmVyc2VRdWVyeSA9IGZ1bmN0aW9uKF8sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBxID0gJyc7XG5cbiAgICAgICAgZnVuY3Rpb24gbm9ybSh4KSB7XG4gICAgICAgICAgICBpZiAoeC5sYXQgIT09IHVuZGVmaW5lZCAmJiB4LmxuZyAhPT0gdW5kZWZpbmVkKSByZXR1cm4geC5sbmcgKyAnLCcgKyB4LmxhdDtcbiAgICAgICAgICAgIGVsc2UgaWYgKHgubGF0ICE9PSB1bmRlZmluZWQgJiYgeC5sb24gIT09IHVuZGVmaW5lZCkgcmV0dXJuIHgubG9uICsgJywnICsgeC5sYXQ7XG4gICAgICAgICAgICBlbHNlIHJldHVybiB4WzBdICsgJywnICsgeFsxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLmxlbmd0aCAmJiBfWzBdLmxlbmd0aCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHB0cyA9IFtdOyBpIDwgXy5sZW5ndGg7IGkrKykgcHRzLnB1c2gobm9ybShfW2ldKSk7XG4gICAgICAgICAgICBxID0gcHRzLmpvaW4oJzsnKTtcbiAgICAgICAgfSBlbHNlIHEgPSBub3JtKF8pO1xuXG4gICAgICAgIHJlcXVlc3QoZ2VvY29kZXIucXVlcnlVUkwocSksIGZ1bmN0aW9uKGVyciwganNvbikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBqc29uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGdlb2NvZGVyO1xuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIF8gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmIChfLmluZGV4T2YoJy8nKSA9PSAtMSkgZ2VvY29kZXIuc2V0SUQoXyk7XG4gICAgICAgIGVsc2UgZ2VvY29kZXIuc2V0VVJMKF8pO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgXyA9PT0gJ29iamVjdCcpIGdlb2NvZGVyLnNldFRpbGVKU09OKF8pO1xuXG4gICAgcmV0dXJuIGdlb2NvZGVyO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdlb2NvZGVyID0gcmVxdWlyZSgnLi9nZW9jb2RlcicpO1xuXG52YXIgR2VvY29kZXJDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG4gICAgaW5jbHVkZXM6IEwuTWl4aW4uRXZlbnRzLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgICAgICBwb2ludFpvb206IDE2LFxuICAgICAgICBrZWVwT3BlbjogZmFsc2VcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgICAgICBMLlV0aWwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5nZW9jb2RlciA9IGdlb2NvZGVyKF8pO1xuICAgIH0sXG5cbiAgICBzZXRVUkw6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5nZW9jb2Rlci5zZXRVUkwoXyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXRVUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZW9jb2Rlci5nZXRVUkwoKTtcbiAgICB9LFxuXG4gICAgc2V0SUQ6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5nZW9jb2Rlci5zZXRJRChfKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNldFRpbGVKU09OOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHRoaXMuZ2VvY29kZXIuc2V0VGlsZUpTT04oXyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfdG9nZ2xlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlKSBMLkRvbUV2ZW50LnN0b3AoZSk7XG4gICAgICAgIGlmIChMLkRvbVV0aWwuaGFzQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnYWN0aXZlJykpIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC5ibHVyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnYWN0aXZlJyk7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgdGhpcy5faW5wdXQuc2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2Nsb3NlSWZPcGVuOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChMLkRvbVV0aWwuaGFzQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnYWN0aXZlJykgJiZcbiAgICAgICAgICAgICF0aGlzLm9wdGlvbnMua2VlcE9wZW4pIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdHMuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC5ibHVyKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuXG4gICAgICAgIHZhciBjb250YWluZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1nZW9jb2RlciBsZWFmbGV0LWJhciBsZWFmbGV0LWNvbnRyb2wnKSxcbiAgICAgICAgICAgIGxpbmsgPSBMLkRvbVV0aWwuY3JlYXRlKCdhJywgJ2xlYWZsZXQtY29udHJvbC1tYXBib3gtZ2VvY29kZXItdG9nZ2xlIG1hcGJveC1pY29uIG1hcGJveC1pY29uLWdlb2NvZGVyJywgY29udGFpbmVyKSxcbiAgICAgICAgICAgIHJlc3VsdHMgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1nZW9jb2Rlci1yZXN1bHRzJywgY29udGFpbmVyKSxcbiAgICAgICAgICAgIHdyYXAgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC1jb250cm9sLW1hcGJveC1nZW9jb2Rlci13cmFwJywgY29udGFpbmVyKSxcbiAgICAgICAgICAgIGZvcm0gPSBMLkRvbVV0aWwuY3JlYXRlKCdmb3JtJywgJ2xlYWZsZXQtY29udHJvbC1tYXBib3gtZ2VvY29kZXItZm9ybScsIHdyYXApLFxuICAgICAgICAgICAgaW5wdXQgID0gTC5Eb21VdGlsLmNyZWF0ZSgnaW5wdXQnLCAnJywgZm9ybSk7XG5cbiAgICAgICAgbGluay5ocmVmID0gJyMnO1xuICAgICAgICBsaW5rLmlubmVySFRNTCA9ICcmbmJzcDsnO1xuXG4gICAgICAgIGlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInLCAnU2VhcmNoJyk7XG5cbiAgICAgICAgTC5Eb21FdmVudC5hZGRMaXN0ZW5lcihmb3JtLCAnc3VibWl0JywgdGhpcy5fZ2VvY29kZSwgdGhpcyk7XG4gICAgICAgIEwuRG9tRXZlbnQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24oY29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgICAgIHRoaXMuX3Jlc3VsdHMgPSByZXN1bHRzO1xuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuICAgICAgICB0aGlzLl9mb3JtID0gZm9ybTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmtlZXBPcGVuKSB7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3MoY29udGFpbmVyLCAnYWN0aXZlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9tYXAub24oJ2NsaWNrJywgdGhpcy5fY2xvc2VJZk9wZW4sIHRoaXMpO1xuICAgICAgICAgICAgTC5Eb21FdmVudC5hZGRMaXN0ZW5lcihsaW5rLCAnY2xpY2snLCB0aGlzLl90b2dnbGUsIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9LFxuXG4gICAgX2dlb2NvZGU6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgTC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcbiAgICAgICAgTC5Eb21VdGlsLmFkZENsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ3NlYXJjaGluZycpO1xuXG4gICAgICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XG4gICAgICAgIHZhciBvbmxvYWQgPSBMLmJpbmQoZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICBMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnc2VhcmNoaW5nJyk7XG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFyZXNwIHx8ICFyZXNwLnJlc3VsdHMgfHwgIXJlc3AucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2Vycm9yJywge2Vycm9yOiBlcnJ9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cy5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAocmVzcC5yZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ2F1dG9zZWxlY3QnLCB7IGRhdGE6IHJlc3AgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNob29zZVJlc3VsdChyZXNwLnJlc3VsdHNbMF1bMF0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZUlmT3BlbigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gTWF0aC5taW4ocmVzcC5yZXN1bHRzLmxlbmd0aCwgNSk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHJlc3AucmVzdWx0c1tpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLnJlc3VsdHNbaV1bal0ubmFtZSkgbmFtZS5wdXNoKHJlc3AucmVzdWx0c1tpXVtqXS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbmFtZS5sZW5ndGgpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnJywgdGhpcy5fcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByLmlubmVySFRNTCA9IG5hbWUuam9pbignLCAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHIuaHJlZiA9ICcjJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgKEwuYmluZChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKHIsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvb3NlUmVzdWx0KHJlc3VsdFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEwuRG9tRXZlbnQuc3RvcChlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdzZWxlY3QnLCB7IGRhdGE6IHJlc3VsdCB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHRoaXMpKShyZXNwLnJlc3VsdHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLnJlc3VsdHMubGVuZ3RoID4gNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG91dG9mID0gTC5Eb21VdGlsLmNyZWF0ZSgnc3BhbicsICcnLCB0aGlzLl9yZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dG9mLmlubmVySFRNTCA9ICdUb3AgNSBvZiAnICsgcmVzcC5yZXN1bHRzLmxlbmd0aCArICcgIHJlc3VsdHMnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZm91bmQnLCByZXNwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdmFyIGNob29zZVJlc3VsdCA9IEwuYmluZChmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuYm91bmRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIF8gPSByZXN1bHQuYm91bmRzO1xuICAgICAgICAgICAgICAgIHRoaXMuX21hcC5maXRCb3VuZHMoTC5sYXRMbmdCb3VuZHMoW1tfWzFdLCBfWzBdXSwgW19bM10sIF9bMl1dXSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQubGF0ICE9PSB1bmRlZmluZWQgJiYgcmVzdWx0LmxvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFwLnNldFZpZXcoW3Jlc3VsdC5sYXQsIHJlc3VsdC5sb25dLCAobWFwLmdldFpvb20oKSA9PT0gdW5kZWZpbmVkKSA/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb2ludFpvb20gOlxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1heChtYXAuZ2V0Wm9vbSgpLCB0aGlzLm9wdGlvbnMucG9pbnRab29tKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuZ2VvY29kZXIucXVlcnkodGhpcy5faW5wdXQudmFsdWUsIG9ubG9hZCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgR2VvY29kZXJDb250cm9sKF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdXRmRGVjb2RlKGMpIHtcbiAgICBpZiAoYyA+PSA5MykgYy0tO1xuICAgIGlmIChjID49IDM1KSBjLS07XG4gICAgcmV0dXJuIGMgLSAzMjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgaWYgKCFkYXRhKSByZXR1cm47XG4gICAgICAgIHZhciBpZHggPSB1dGZEZWNvZGUoZGF0YS5ncmlkW3ldLmNoYXJDb2RlQXQoeCkpLFxuICAgICAgICAgICAga2V5ID0gZGF0YS5rZXlzW2lkeF07XG4gICAgICAgIHJldHVybiBkYXRhLmRhdGFba2V5XTtcbiAgICB9O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICBNdXN0YWNoZSA9IHJlcXVpcmUoJ211c3RhY2hlJyk7XG5cbnZhciBHcmlkQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBwaW5uYWJsZTogdHJ1ZSxcbiAgICAgICAgZm9sbG93OiBmYWxzZSxcbiAgICAgICAgc2FuaXRpemVyOiByZXF1aXJlKCdzYW5pdGl6ZS1jYWphJyksXG4gICAgICAgIHRvdWNoVGVhc2VyOiB0cnVlLFxuICAgICAgICBsb2NhdGlvbjogdHJ1ZVxuICAgIH0sXG5cbiAgICBfY3VycmVudENvbnRlbnQ6ICcnLFxuXG4gICAgLy8gcGlubmVkIG1lYW5zIHRoYXQgdGhpcyBjb250cm9sIGlzIG9uIGEgZmVhdHVyZSBhbmQgdGhlIHVzZXIgaGFzIGxpa2VseVxuICAgIC8vIGNsaWNrZWQuIHBpbm5lZCB3aWxsIG5vdCBiZWNvbWUgZmFsc2UgdW5sZXNzIHRoZSB1c2VyIGNsaWNrcyBvZmZcbiAgICAvLyBvZiB0aGUgZmVhdHVyZSBvbnRvIGFub3RoZXIgb3IgY2xpY2tzIHhcbiAgICBfcGlubmVkOiBmYWxzZSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHV0aWwuc3RyaWN0X2luc3RhbmNlKF8sIEwuQ2xhc3MsICdMLm1hcGJveC5ncmlkTGF5ZXInKTtcbiAgICAgICAgdGhpcy5fbGF5ZXIgPSBfO1xuICAgIH0sXG5cbiAgICBzZXRUZW1wbGF0ZTogZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgdXRpbC5zdHJpY3QodGVtcGxhdGUsICdzdHJpbmcnKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfdGVtcGxhdGU6IGZ1bmN0aW9uKGZvcm1hdCwgZGF0YSkge1xuICAgICAgICBpZiAoIWRhdGEpIHJldHVybjtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy5vcHRpb25zLnRlbXBsYXRlIHx8IHRoaXMuX2xheWVyLmdldFRpbGVKU09OKCkudGVtcGxhdGU7XG4gICAgICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdmFyIGQgPSB7fTtcbiAgICAgICAgICAgIGRbJ19fJyArIGZvcm1hdCArICdfXyddID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKFxuICAgICAgICAgICAgICAgIE11c3RhY2hlLnRvX2h0bWwodGVtcGxhdGUsIEwuZXh0ZW5kKGQsIGRhdGEpKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gY2hhbmdlIHRoZSBjb250ZW50IG9mIHRoZSB0b29sdGlwIEhUTUwgaWYgaXQgaGFzIGNoYW5nZWQsIG90aGVyd2lzZVxuICAgIC8vIG5vb3BcbiAgICBfc2hvdzogZnVuY3Rpb24oY29udGVudCwgbykge1xuICAgICAgICBpZiAoY29udGVudCA9PT0gdGhpcy5fY3VycmVudENvbnRlbnQpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9jdXJyZW50Q29udGVudCA9IGNvbnRlbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mb2xsb3cpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvcHVwLnNldENvbnRlbnQoY29udGVudClcbiAgICAgICAgICAgICAgICAuc2V0TGF0TG5nKG8ubGF0TG5nKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXAuX3BvcHVwICE9PSB0aGlzLl9wb3B1cCkgdGhpcy5fcG9wdXAub3Blbk9uKHRoaXMuX21hcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9jb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICB0aGlzLl9jb250ZW50V3JhcHBlci5pbm5lckhUTUwgPSBjb250ZW50O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9waW5uZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY3VycmVudENvbnRlbnQgPSAnJztcblxuICAgICAgICB0aGlzLl9tYXAuY2xvc2VQb3B1cCgpO1xuICAgICAgICB0aGlzLl9jb250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgdGhpcy5fY29udGVudFdyYXBwZXIuaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ2Nsb3NhYmxlJyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9tb3VzZW92ZXI6IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgaWYgKG8uZGF0YSkge1xuICAgICAgICAgICAgTC5Eb21VdGlsLmFkZENsYXNzKHRoaXMuX21hcC5fY29udGFpbmVyLCAnbWFwLWNsaWNrYWJsZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTC5Eb21VdGlsLnJlbW92ZUNsYXNzKHRoaXMuX21hcC5fY29udGFpbmVyLCAnbWFwLWNsaWNrYWJsZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3Bpbm5lZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBjb250ZW50ID0gdGhpcy5fdGVtcGxhdGUoJ3RlYXNlcicsIG8uZGF0YSk7XG4gICAgICAgIGlmIChjb250ZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93KGNvbnRlbnQsIG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX21vdXNlbW92ZTogZnVuY3Rpb24obykge1xuICAgICAgICBpZiAodGhpcy5fcGlubmVkKSByZXR1cm47XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmZvbGxvdykgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuX3BvcHVwLnNldExhdExuZyhvLmxhdExuZyk7XG4gICAgfSxcblxuICAgIF9uYXZpZ2F0ZVRvOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgd2luZG93LnRvcC5sb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgIH0sXG5cbiAgICBfY2xpY2s6IGZ1bmN0aW9uKG8pIHtcblxuICAgICAgICB2YXIgbG9jYXRpb25fZm9ybWF0dGVkID0gdGhpcy5fdGVtcGxhdGUoJ2xvY2F0aW9uJywgby5kYXRhKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sb2NhdGlvbiAmJiBsb2NhdGlvbl9mb3JtYXR0ZWQgJiZcbiAgICAgICAgICAgIGxvY2F0aW9uX2Zvcm1hdHRlZC5zZWFyY2goL15odHRwcz86LykgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYXZpZ2F0ZVRvKHRoaXMuX3RlbXBsYXRlKCdsb2NhdGlvbicsIG8uZGF0YSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucGlubmFibGUpIHJldHVybjtcblxuICAgICAgICB2YXIgY29udGVudCA9IHRoaXMuX3RlbXBsYXRlKCdmdWxsJywgby5kYXRhKTtcblxuICAgICAgICBpZiAoIWNvbnRlbnQgJiYgdGhpcy5vcHRpb25zLnRvdWNoVGVhc2VyICYmIEwuQnJvd3Nlci50b3VjaCkge1xuICAgICAgICAgICAgY29udGVudCA9IHRoaXMuX3RlbXBsYXRlKCd0ZWFzZXInLCBvLmRhdGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbnRlbnQpIHtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9jb250YWluZXIsICdjbG9zYWJsZScpO1xuICAgICAgICAgICAgdGhpcy5fcGlubmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3Nob3coY29udGVudCwgbyk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fcGlubmVkKSB7XG4gICAgICAgICAgICBMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fY29udGFpbmVyLCAnY2xvc2FibGUnKTtcbiAgICAgICAgICAgIHRoaXMuX3Bpbm5lZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uUG9wdXBDbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRDb250ZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fcGlubmVkID0gZmFsc2U7XG4gICAgfSxcblxuICAgIF9jcmVhdGVDbG9zZWJ1dHRvbjogZnVuY3Rpb24oY29udGFpbmVyLCBmbikge1xuICAgICAgICB2YXIgbGluayA9IEwuRG9tVXRpbC5jcmVhdGUoJ2EnLCAnY2xvc2UnLCBjb250YWluZXIpO1xuXG4gICAgICAgIGxpbmsuaW5uZXJIVE1MID0gJ2Nsb3NlJztcbiAgICAgICAgbGluay5ocmVmID0gJyMnO1xuICAgICAgICBsaW5rLnRpdGxlID0gJ2Nsb3NlJztcblxuICAgICAgICBMLkRvbUV2ZW50XG4gICAgICAgICAgICAub24obGluaywgJ2NsaWNrJywgTC5Eb21FdmVudC5zdG9wUHJvcGFnYXRpb24pXG4gICAgICAgICAgICAub24obGluaywgJ21vdXNlZG93bicsIEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uKVxuICAgICAgICAgICAgLm9uKGxpbmssICdkYmxjbGljaycsIEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uKVxuICAgICAgICAgICAgLm9uKGxpbmssICdjbGljaycsIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQpXG4gICAgICAgICAgICAub24obGluaywgJ2NsaWNrJywgZm4sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBsaW5rO1xuICAgIH0sXG5cbiAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgIHRoaXMuX21hcCA9IG1hcDtcblxuICAgICAgICB2YXIgY2xhc3NOYW1lID0gJ2xlYWZsZXQtY29udHJvbC1ncmlkIG1hcC10b29sdGlwJyxcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsIGNsYXNzTmFtZSksXG4gICAgICAgICAgICBjb250ZW50V3JhcHBlciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXAtdG9vbHRpcC1jb250ZW50Jyk7XG5cbiAgICAgICAgLy8gaGlkZSB0aGUgY29udGFpbmVyIGVsZW1lbnQgaW5pdGlhbGx5XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB0aGlzLl9jcmVhdGVDbG9zZWJ1dHRvbihjb250YWluZXIsIHRoaXMuaGlkZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb250ZW50V3JhcHBlcik7XG5cbiAgICAgICAgdGhpcy5fY29udGVudFdyYXBwZXIgPSBjb250ZW50V3JhcHBlcjtcbiAgICAgICAgdGhpcy5fcG9wdXAgPSBuZXcgTC5Qb3B1cCh7IGF1dG9QYW46IGZhbHNlLCBjbG9zZU9uQ2xpY2s6IGZhbHNlIH0pO1xuXG4gICAgICAgIG1hcC5vbigncG9wdXBjbG9zZScsIHRoaXMuX29uUG9wdXBDbG9zZSwgdGhpcyk7XG5cbiAgICAgICAgTC5Eb21FdmVudFxuICAgICAgICAgICAgLmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKGNvbnRhaW5lcilcbiAgICAgICAgICAgIC8vIGFsbG93IHBlb3BsZSB0byBzY3JvbGwgdG9vbHRpcHMgd2l0aCBtb3VzZXdoZWVsXG4gICAgICAgICAgICAuYWRkTGlzdGVuZXIoY29udGFpbmVyLCAnbW91c2V3aGVlbCcsIEwuRG9tRXZlbnQuc3RvcFByb3BhZ2F0aW9uKTtcblxuICAgICAgICB0aGlzLl9sYXllclxuICAgICAgICAgICAgLm9uKCdtb3VzZW92ZXInLCB0aGlzLl9tb3VzZW92ZXIsIHRoaXMpXG4gICAgICAgICAgICAub24oJ21vdXNlbW92ZScsIHRoaXMuX21vdXNlbW92ZSwgdGhpcylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCB0aGlzLl9jbGljaywgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmU6IGZ1bmN0aW9uIChtYXApIHtcblxuICAgICAgICBtYXAub2ZmKCdwb3B1cGNsb3NlJywgdGhpcy5fb25Qb3B1cENsb3NlLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl9sYXllclxuICAgICAgICAgICAgLm9mZignbW91c2VvdmVyJywgdGhpcy5fbW91c2VvdmVyLCB0aGlzKVxuICAgICAgICAgICAgLm9mZignbW91c2Vtb3ZlJywgdGhpcy5fbW91c2Vtb3ZlLCB0aGlzKVxuICAgICAgICAgICAgLm9mZignY2xpY2snLCB0aGlzLl9jbGljaywgdGhpcyk7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgR3JpZENvbnRyb2woXywgb3B0aW9ucyk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHVybCA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLFxuICAgIGdyaWQgPSByZXF1aXJlKCcuL2dyaWQnKTtcblxuLy8gZm9ya2VkIGZyb20gZGFuemVsL0wuVVRGR3JpZFxudmFyIEdyaWRMYXllciA9IEwuQ2xhc3MuZXh0ZW5kKHtcbiAgICBpbmNsdWRlczogW0wuTWl4aW4uRXZlbnRzLCByZXF1aXJlKCcuL2xvYWRfdGlsZWpzb24nKV0sXG5cbiAgICBvcHRpb25zOiB7XG4gICAgICAgIHRlbXBsYXRlOiBmdW5jdGlvbigpIHsgcmV0dXJuICcnOyB9XG4gICAgfSxcblxuICAgIF9tb3VzZU9uOiBudWxsLFxuICAgIF90aWxlanNvbjoge30sXG4gICAgX2NhY2hlOiB7fSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuX2xvYWRUaWxlSlNPTihfKTtcbiAgICB9LFxuXG4gICAgX3NldFRpbGVKU09OOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIHV0aWwuc3RyaWN0KGpzb24sICdvYmplY3QnKTtcblxuICAgICAgICBMLmV4dGVuZCh0aGlzLm9wdGlvbnMsIHtcbiAgICAgICAgICAgIGdyaWRzOiBqc29uLmdyaWRzLFxuICAgICAgICAgICAgbWluWm9vbToganNvbi5taW56b29tLFxuICAgICAgICAgICAgbWF4Wm9vbToganNvbi5tYXh6b29tLFxuICAgICAgICAgICAgYm91bmRzOiBqc29uLmJvdW5kcyAmJiB1dGlsLmxib3VuZHMoanNvbi5ib3VuZHMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3RpbGVqc29uID0ganNvbjtcbiAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFRpbGVKU09OOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RpbGVqc29uO1xuICAgIH0sXG5cbiAgICBhY3RpdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gISEodGhpcy5fbWFwICYmIHRoaXMub3B0aW9ucy5ncmlkcyAmJiB0aGlzLm9wdGlvbnMuZ3JpZHMubGVuZ3RoKTtcbiAgICB9LFxuXG4gICAgYWRkVG86IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgbWFwLmFkZExheWVyKHRoaXMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICB0aGlzLl9tYXAgPSBtYXA7XG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuXG4gICAgICAgIHRoaXMuX21hcFxuICAgICAgICAgICAgLm9uKCdjbGljaycsIHRoaXMuX2NsaWNrLCB0aGlzKVxuICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUnLCB0aGlzLl9tb3ZlLCB0aGlzKVxuICAgICAgICAgICAgLm9uKCdtb3ZlZW5kJywgdGhpcy5fdXBkYXRlLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgb25SZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9tYXBcbiAgICAgICAgICAgIC5vZmYoJ2NsaWNrJywgdGhpcy5fY2xpY2ssIHRoaXMpXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW1vdmUnLCB0aGlzLl9tb3ZlLCB0aGlzKVxuICAgICAgICAgICAgLm9mZignbW92ZWVuZCcsIHRoaXMuX3VwZGF0ZSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGdldERhdGE6IGZ1bmN0aW9uKGxhdGxuZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmFjdGl2ZSgpKSByZXR1cm47XG5cbiAgICAgICAgdmFyIG1hcCA9IHRoaXMuX21hcCxcbiAgICAgICAgICAgIHBvaW50ID0gbWFwLnByb2plY3QobGF0bG5nLndyYXAoKSksXG4gICAgICAgICAgICB0aWxlU2l6ZSA9IDI1NixcbiAgICAgICAgICAgIHJlc29sdXRpb24gPSA0LFxuICAgICAgICAgICAgeCA9IE1hdGguZmxvb3IocG9pbnQueCAvIHRpbGVTaXplKSxcbiAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKHBvaW50LnkgLyB0aWxlU2l6ZSksXG4gICAgICAgICAgICBtYXggPSBtYXAub3B0aW9ucy5jcnMuc2NhbGUobWFwLmdldFpvb20oKSkgLyB0aWxlU2l6ZTtcblxuICAgICAgICB4ID0gKHggKyBtYXgpICUgbWF4O1xuICAgICAgICB5ID0gKHkgKyBtYXgpICUgbWF4O1xuXG4gICAgICAgIHRoaXMuX2dldFRpbGUobWFwLmdldFpvb20oKSwgeCwgeSwgZnVuY3Rpb24oZ3JpZCkge1xuICAgICAgICAgICAgdmFyIGdyaWRYID0gTWF0aC5mbG9vcigocG9pbnQueCAtICh4ICogdGlsZVNpemUpKSAvIHJlc29sdXRpb24pLFxuICAgICAgICAgICAgICAgIGdyaWRZID0gTWF0aC5mbG9vcigocG9pbnQueSAtICh5ICogdGlsZVNpemUpKSAvIHJlc29sdXRpb24pO1xuXG4gICAgICAgICAgICBjYWxsYmFjayhncmlkKGdyaWRYLCBncmlkWSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2NsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIHRoaXMuZ2V0RGF0YShlLmxhdGxuZywgTC5iaW5kKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgnY2xpY2snLCB7XG4gICAgICAgICAgICAgICAgbGF0TG5nOiBlLmxhdGxuZyxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGhpcykpO1xuICAgIH0sXG5cbiAgICBfbW92ZTogZnVuY3Rpb24oZSkge1xuICAgICAgICB0aGlzLmdldERhdGEoZS5sYXRsbmcsIEwuYmluZChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YSAhPT0gdGhpcy5fbW91c2VPbikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9tb3VzZU9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnbW91c2VvdXQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXRMbmc6IGUubGF0bG5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpcy5fbW91c2VPblxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmZpcmUoJ21vdXNlb3ZlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgbGF0TG5nOiBlLmxhdGxuZyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fbW91c2VPbiA9IGRhdGE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnbW91c2Vtb3ZlJywge1xuICAgICAgICAgICAgICAgICAgICBsYXRMbmc6IGUubGF0bG5nLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpKTtcbiAgICB9LFxuXG4gICAgX2dldFRpbGVVUkw6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICB2YXIgdXJscyA9IHRoaXMub3B0aW9ucy5ncmlkcyxcbiAgICAgICAgICAgIGluZGV4ID0gKHRpbGVQb2ludC54ICsgdGlsZVBvaW50LnkpICUgdXJscy5sZW5ndGgsXG4gICAgICAgICAgICB1cmwgPSB1cmxzW2luZGV4XTtcblxuICAgICAgICByZXR1cm4gTC5VdGlsLnRlbXBsYXRlKHVybCwgdGlsZVBvaW50KTtcbiAgICB9LFxuXG4gICAgLy8gTG9hZCB1cCBhbGwgcmVxdWlyZWQganNvbiBncmlkIGZpbGVzXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5hY3RpdmUoKSkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBib3VuZHMgPSB0aGlzLl9tYXAuZ2V0UGl4ZWxCb3VuZHMoKSxcbiAgICAgICAgICAgIHogPSB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgdGlsZVNpemUgPSAyNTY7XG5cbiAgICAgICAgaWYgKHogPiB0aGlzLm9wdGlvbnMubWF4Wm9vbSB8fCB6IDwgdGhpcy5vcHRpb25zLm1pblpvb20pIHJldHVybjtcblxuICAgICAgICB2YXIgbndUaWxlUG9pbnQgPSBuZXcgTC5Qb2ludChcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKGJvdW5kcy5taW4ueCAvIHRpbGVTaXplKSxcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKGJvdW5kcy5taW4ueSAvIHRpbGVTaXplKSksXG4gICAgICAgICAgICBzZVRpbGVQb2ludCA9IG5ldyBMLlBvaW50KFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoYm91bmRzLm1heC54IC8gdGlsZVNpemUpLFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IoYm91bmRzLm1heC55IC8gdGlsZVNpemUpKSxcbiAgICAgICAgICAgIG1heCA9IHRoaXMuX21hcC5vcHRpb25zLmNycy5zY2FsZSh6KSAvIHRpbGVTaXplO1xuXG4gICAgICAgIGZvciAodmFyIHggPSBud1RpbGVQb2ludC54OyB4IDw9IHNlVGlsZVBvaW50Lng7IHgrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgeSA9IG53VGlsZVBvaW50Lnk7IHkgPD0gc2VUaWxlUG9pbnQueTsgeSsrKSB7XG4gICAgICAgICAgICAgICAgLy8geCB3cmFwcGVkXG4gICAgICAgICAgICAgICAgdmFyIHh3ID0gKHggKyBtYXgpICUgbWF4LCB5dyA9ICh5ICsgbWF4KSAlIG1heDtcbiAgICAgICAgICAgICAgICB0aGlzLl9nZXRUaWxlKHosIHh3LCB5dyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldFRpbGU6IGZ1bmN0aW9uKHosIHgsIHksIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBrZXkgPSB6ICsgJ18nICsgeCArICdfJyArIHksXG4gICAgICAgICAgICB0aWxlUG9pbnQgPSBMLnBvaW50KHgsIHkpO1xuXG4gICAgICAgIHRpbGVQb2ludC56ID0gejtcblxuICAgICAgICBpZiAoIXRoaXMuX3RpbGVTaG91bGRCZUxvYWRlZCh0aWxlUG9pbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa2V5IGluIHRoaXMuX2NhY2hlKSB7XG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKSByZXR1cm47XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuX2NhY2hlW2tleV0pOyAvLyBBbHJlYWR5IGxvYWRlZFxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZVtrZXldLnB1c2goY2FsbGJhY2spOyAvLyBQZW5kaW5nXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NhY2hlW2tleV0gPSBbXTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlW2tleV0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0KHRoaXMuX2dldFRpbGVVUkwodGlsZVBvaW50KSwgTC5iaW5kKGZ1bmN0aW9uKGVyciwganNvbikge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhY2hlW2tleV07XG4gICAgICAgICAgICB0aGlzLl9jYWNoZVtrZXldID0gZ3JpZChqc29uKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzW2ldKHRoaXMuX2NhY2hlW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKSk7XG4gICAgfSxcblxuICAgIF90aWxlU2hvdWxkQmVMb2FkZWQ6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICBpZiAodGlsZVBvaW50LnogPiB0aGlzLm9wdGlvbnMubWF4Wm9vbSB8fCB0aWxlUG9pbnQueiA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJvdW5kcykge1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gMjU2LFxuICAgICAgICAgICAgICAgIG53UG9pbnQgPSB0aWxlUG9pbnQubXVsdGlwbHlCeSh0aWxlU2l6ZSksXG4gICAgICAgICAgICAgICAgc2VQb2ludCA9IG53UG9pbnQuYWRkKG5ldyBMLlBvaW50KHRpbGVTaXplLCB0aWxlU2l6ZSkpLFxuICAgICAgICAgICAgICAgIG53ID0gdGhpcy5fbWFwLnVucHJvamVjdChud1BvaW50KSxcbiAgICAgICAgICAgICAgICBzZSA9IHRoaXMuX21hcC51bnByb2plY3Qoc2VQb2ludCksXG4gICAgICAgICAgICAgICAgYm91bmRzID0gbmV3IEwuTGF0TG5nQm91bmRzKFtudywgc2VdKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYm91bmRzLmludGVyc2VjdHMoYm91bmRzKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IEdyaWRMYXllcihfLCBvcHRpb25zKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBJbmZvQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgcG9zaXRpb246ICdib3R0b21yaWdodCcsXG4gICAgICAgIHNhbml0aXplcjogcmVxdWlyZSgnc2FuaXRpemUtY2FqYScpXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9pbmZvID0ge307XG4gICAgfSxcblxuICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ21hcGJveC1jb250cm9sLWluZm8gbWFwYm94LXNtYWxsJyk7XG4gICAgICAgIHRoaXMuX2NvbnRlbnQgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbWFwLWluZm8tY29udGFpbmVyJywgdGhpcy5fY29udGFpbmVyKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBvc2l0aW9uID09PSAnYm90dG9tcmlnaHQnIHx8XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9zaXRpb24gPT09ICd0b3ByaWdodCcpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc05hbWUgKz0gJyBtYXBib3gtY29udHJvbC1pbmZvLXJpZ2h0JztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICdtYXBib3gtaW5mby10b2dnbGUgbWFwYm94LWljb24gbWFwYm94LWljb24taW5mbycsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIGxpbmsuaHJlZiA9ICcjJztcblxuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGxpbmssICdjbGljaycsIHRoaXMuX3Nob3dJbmZvLCB0aGlzKTtcbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbih0aGlzLl9jb250YWluZXIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgaW4gbWFwLl9sYXllcnMpIHtcbiAgICAgICAgICAgIGlmIChtYXAuX2xheWVyc1tpXS5nZXRBdHRyaWJ1dGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5mbyhtYXAuX2xheWVyc1tpXS5nZXRBdHRyaWJ1dGlvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1hcFxuICAgICAgICAgICAgLm9uKCdtb3ZlZW5kJywgdGhpcy5fZWRpdExpbmssIHRoaXMpXG4gICAgICAgICAgICAub24oJ2xheWVyYWRkJywgdGhpcy5fb25MYXllckFkZCwgdGhpcylcbiAgICAgICAgICAgIC5vbignbGF5ZXJyZW1vdmUnLCB0aGlzLl9vbkxheWVyUmVtb3ZlLCB0aGlzKTtcblxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICBtYXBcbiAgICAgICAgICAgIC5vZmYoJ21vdmVlbmQnLCB0aGlzLl9lZGl0TGluaywgdGhpcylcbiAgICAgICAgICAgIC5vZmYoJ2xheWVyYWRkJywgdGhpcy5fb25MYXllckFkZCwgdGhpcylcbiAgICAgICAgICAgIC5vZmYoJ2xheWVycmVtb3ZlJywgdGhpcy5fb25MYXllclJlbW92ZSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGFkZEluZm86IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgaWYgKCF0ZXh0KSByZXR1cm4gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLl9pbmZvW3RleHRdKSB0aGlzLl9pbmZvW3RleHRdID0gMDtcbiAgICAgICAgdGhpcy5faW5mb1t0ZXh0XSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlSW5mbzogZnVuY3Rpb24gKHRleHQpIHtcbiAgICAgICAgaWYgKCF0ZXh0KSByZXR1cm4gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuX2luZm9bdGV4dF0pIHRoaXMuX2luZm9bdGV4dF0gPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwZGF0ZSgpO1xuICAgIH0sXG5cbiAgICBfc2hvd0luZm86IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgTC5Eb21FdmVudC5wcmV2ZW50RGVmYXVsdChlKTtcbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSA9PT0gdHJ1ZSkgcmV0dXJuIHRoaXMuX2hpZGVjb250ZW50KCk7XG5cbiAgICAgICAgTC5Eb21VdGlsLmFkZENsYXNzKHRoaXMuX2NvbnRhaW5lciwgJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgX2hpZGVjb250ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY29udGVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIEwuRG9tVXRpbC5yZW1vdmVDbGFzcyh0aGlzLl9jb250YWluZXIsICdhY3RpdmUnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH0sXG5cbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXApIHsgcmV0dXJuIHRoaXM7IH1cbiAgICAgICAgdGhpcy5fY29udGVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdmFyIGhpZGUgPSAnbm9uZSc7XG4gICAgICAgIHZhciBpbmZvID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9pbmZvKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5faW5mby5oYXNPd25Qcm9wZXJ0eShpKSAmJiB0aGlzLl9pbmZvW2ldKSB7XG4gICAgICAgICAgICAgICAgaW5mby5wdXNoKHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIoaSkpO1xuICAgICAgICAgICAgICAgIGhpZGUgPSAnYmxvY2snO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29udGVudC5pbm5lckhUTUwgKz0gaW5mby5qb2luKCcgfCAnKTtcbiAgICAgICAgdGhpcy5fZWRpdExpbmsoKTtcblxuICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gcmVzdWx0cyBpbiBfaW5mbyB0aGVuIGhpZGUgdGhpcy5cbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBoaWRlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX2VkaXRMaW5rOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9jb250ZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGluayA9IHRoaXMuX2NvbnRlbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbWFwYm94LWltcHJvdmUtbWFwJyk7XG4gICAgICAgIGlmIChsaW5rLmxlbmd0aCAmJiB0aGlzLl9tYXAuX2xvYWRlZCkge1xuICAgICAgICAgICAgdmFyIGNlbnRlciA9IHRoaXMuX21hcC5nZXRDZW50ZXIoKS53cmFwKCk7XG4gICAgICAgICAgICB2YXIgdGlsZWpzb24gPSB0aGlzLl90aWxlanNvbiB8fCB0aGlzLl9tYXAuX3RpbGVqc29uIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlkID0gdGlsZWpzb24uaWQgfHwgJyc7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluay5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxpbmtbaV0uaHJlZiA9IGxpbmtbaV0uaHJlZi5zcGxpdCgnIycpWzBdICsgJyMnICsgaWQgKyAnLycgK1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXIubG5nLnRvRml4ZWQoMykgKyAnLycgK1xuICAgICAgICAgICAgICAgICAgICBjZW50ZXIubGF0LnRvRml4ZWQoMykgKyAnLycgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tYXAuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkxheWVyQWRkOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLmxheWVyLmdldEF0dHJpYnV0aW9uICYmIGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRJbmZvKGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoJ29uJyBpbiBlLmxheWVyICYmIGUubGF5ZXIuZ2V0QXR0cmlidXRpb24pIHtcbiAgICAgICAgICAgIGUubGF5ZXIub24oJ3JlYWR5JywgTC5iaW5kKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkSW5mbyhlLmxheWVyLmdldEF0dHJpYnV0aW9uKCkpO1xuICAgICAgICAgICAgfSwgdGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkxheWVyUmVtb3ZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoZS5sYXllci5nZXRBdHRyaWJ1dGlvbikge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVJbmZvKGUubGF5ZXIuZ2V0QXR0cmlidXRpb24oKSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZvQ29udHJvbChvcHRpb25zKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBMZWdlbmRDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG5cbiAgICBvcHRpb25zOiB7XG4gICAgICAgIHBvc2l0aW9uOiAnYm90dG9tcmlnaHQnLFxuICAgICAgICBzYW5pdGl6ZXI6IHJlcXVpcmUoJ3Nhbml0aXplLWNhamEnKVxuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fbGVnZW5kcyA9IHt9O1xuICAgIH0sXG5cbiAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXAtbGVnZW5kcyB3YXgtbGVnZW5kcycpO1xuICAgICAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uKHRoaXMuX2NvbnRhaW5lcik7XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcbiAgICB9LFxuXG4gICAgYWRkTGVnZW5kOiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIGlmICghdGV4dCkgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgIGlmICghdGhpcy5fbGVnZW5kc1t0ZXh0XSkge1xuICAgICAgICAgICAgdGhpcy5fbGVnZW5kc1t0ZXh0XSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sZWdlbmRzW3RleHRdKys7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGRhdGUoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlTGVnZW5kOiBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICAgIGlmICghdGV4dCkgeyByZXR1cm4gdGhpczsgfVxuICAgICAgICBpZiAodGhpcy5fbGVnZW5kc1t0ZXh0XSkgdGhpcy5fbGVnZW5kc1t0ZXh0XS0tO1xuICAgICAgICByZXR1cm4gdGhpcy5fdXBkYXRlKCk7XG4gICAgfSxcblxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX21hcCkgeyByZXR1cm4gdGhpczsgfVxuXG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdmFyIGhpZGUgPSAnbm9uZSc7XG5cbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLl9sZWdlbmRzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGVnZW5kcy5oYXNPd25Qcm9wZXJ0eShpKSAmJiB0aGlzLl9sZWdlbmRzW2ldKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpdiA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdtYXAtbGVnZW5kIHdheC1sZWdlbmQnLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKGkpO1xuICAgICAgICAgICAgICAgIGhpZGUgPSAnYmxvY2snO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaGlkZSB0aGUgY29udHJvbCBlbnRpcmVseSB1bmxlc3MgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIGxlZ2VuZDtcbiAgICAgICAgLy8gb3RoZXJ3aXNlIHRoZXJlIHdpbGwgYmUgYSBzbWFsbCBncmV5IGJsZW1pc2ggb24gdGhlIG1hcC5cbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBoaWRlO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExlZ2VuZENvbnRyb2wob3B0aW9ucyk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJy4vcmVxdWVzdCcpLFxuICAgIHVybCA9IHJlcXVpcmUoJy4vdXJsJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBfbG9hZFRpbGVKU09OOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIGlmICh0eXBlb2YgXyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmIChfLmluZGV4T2YoJy8nKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgIF8gPSB1cmwuYmFzZSgpICsgXyArICcuanNvbic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlcXVlc3QodXJsLnNlY3VyZUZsYWcoXyksIEwuYmluZChmdW5jdGlvbihlcnIsIGpzb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWwubG9nKCdjb3VsZCBub3QgbG9hZCBUaWxlSlNPTiBhdCAnICsgXyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnZXJyb3InLCB7ZXJyb3I6IGVycn0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoanNvbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zZXRUaWxlSlNPTihqc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maXJlKCdyZWFkeScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpKTtcbiAgICAgICAgfSBlbHNlIGlmIChfICYmIHR5cGVvZiBfID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdGhpcy5fc2V0VGlsZUpTT04oXyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpLFxuICAgIHRpbGVMYXllciA9IHJlcXVpcmUoJy4vdGlsZV9sYXllcicpLFxuICAgIGZlYXR1cmVMYXllciA9IHJlcXVpcmUoJy4vZmVhdHVyZV9sYXllcicpLFxuICAgIGdyaWRMYXllciA9IHJlcXVpcmUoJy4vZ3JpZF9sYXllcicpLFxuICAgIGdyaWRDb250cm9sID0gcmVxdWlyZSgnLi9ncmlkX2NvbnRyb2wnKSxcbiAgICBpbmZvQ29udHJvbCA9IHJlcXVpcmUoJy4vaW5mb19jb250cm9sJyksXG4gICAgc2hhcmVDb250cm9sID0gcmVxdWlyZSgnLi9zaGFyZV9jb250cm9sJyksXG4gICAgbGVnZW5kQ29udHJvbCA9IHJlcXVpcmUoJy4vbGVnZW5kX2NvbnRyb2wnKTtcblxudmFyIExNYXAgPSBMLk1hcC5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBbcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICB0aWxlTGF5ZXI6IHt9LFxuICAgICAgICBmZWF0dXJlTGF5ZXI6IHt9LFxuICAgICAgICBncmlkTGF5ZXI6IHt9LFxuICAgICAgICBsZWdlbmRDb250cm9sOiB7fSxcbiAgICAgICAgZ3JpZENvbnRyb2w6IHt9LFxuICAgICAgICBpbmZvQ29udHJvbDoge30sXG4gICAgICAgIGF0dHJpYnV0aW9uQ29udHJvbDogZmFsc2UsXG4gICAgICAgIHNoYXJlQ29udHJvbDogZmFsc2VcbiAgICB9LFxuXG4gICAgX3RpbGVqc29uOiB7fSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKGVsZW1lbnQsIF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5NYXAucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcblxuICAgICAgICAvLyBkaXNhYmxlIHRoZSBkZWZhdWx0ICdMZWFmbGV0JyB0ZXh0XG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0aW9uQ29udHJvbCkgdGhpcy5hdHRyaWJ1dGlvbkNvbnRyb2wuc2V0UHJlZml4KCcnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpbGVMYXllcikge1xuICAgICAgICAgICAgdGhpcy50aWxlTGF5ZXIgPSB0aWxlTGF5ZXIodW5kZWZpbmVkLCB0aGlzLm9wdGlvbnMudGlsZUxheWVyKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXIodGhpcy50aWxlTGF5ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mZWF0dXJlTGF5ZXIgPT09IGZhbHNlIHx8IHRoaXMub3B0aW9ucy5tYXJrZXJMYXllciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mZWF0dXJlTGF5ZXIgPSB0aGlzLm9wdGlvbnMubWFya2VyTGF5ZXIgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMubWFya2VyTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5mZWF0dXJlTGF5ZXIgPSB0aGlzLm9wdGlvbnMubWFya2VyTGF5ZXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZlYXR1cmVMYXllcikge1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlTGF5ZXIgPSB0aGlzLm1hcmtlckxheWVyID1cbiAgICAgICAgICAgICAgICBmZWF0dXJlTGF5ZXIodW5kZWZpbmVkLCB0aGlzLm9wdGlvbnMuZmVhdHVyZUxheWVyKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTGF5ZXIodGhpcy5mZWF0dXJlTGF5ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ncmlkTGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZExheWVyID0gZ3JpZExheWVyKHVuZGVmaW5lZCwgdGhpcy5vcHRpb25zLmdyaWRMYXllcik7XG4gICAgICAgICAgICB0aGlzLmFkZExheWVyKHRoaXMuZ3JpZExheWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JpZExheWVyICYmIHRoaXMub3B0aW9ucy5ncmlkQ29udHJvbCkge1xuICAgICAgICAgICAgdGhpcy5ncmlkQ29udHJvbCA9IGdyaWRDb250cm9sKHRoaXMuZ3JpZExheWVyLCB0aGlzLm9wdGlvbnMuZ3JpZENvbnRyb2wpO1xuICAgICAgICAgICAgdGhpcy5hZGRDb250cm9sKHRoaXMuZ3JpZENvbnRyb2wpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pbmZvQ29udHJvbCkge1xuICAgICAgICAgICAgdGhpcy5pbmZvQ29udHJvbCA9IGluZm9Db250cm9sKHRoaXMub3B0aW9ucy5pbmZvQ29udHJvbCk7XG4gICAgICAgICAgICB0aGlzLmFkZENvbnRyb2wodGhpcy5pbmZvQ29udHJvbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxlZ2VuZENvbnRyb2wpIHtcbiAgICAgICAgICAgIHRoaXMubGVnZW5kQ29udHJvbCA9IGxlZ2VuZENvbnRyb2wodGhpcy5vcHRpb25zLmxlZ2VuZENvbnRyb2wpO1xuICAgICAgICAgICAgdGhpcy5hZGRDb250cm9sKHRoaXMubGVnZW5kQ29udHJvbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNoYXJlQ29udHJvbCkge1xuICAgICAgICAgICAgdGhpcy5zaGFyZUNvbnRyb2wgPSBzaGFyZUNvbnRyb2wodW5kZWZpbmVkLCB0aGlzLm9wdGlvbnMuc2hhcmVDb250cm9sKTtcbiAgICAgICAgICAgIHRoaXMuYWRkQ29udHJvbCh0aGlzLnNoYXJlQ29udHJvbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb2FkVGlsZUpTT04oXyk7XG4gICAgfSxcblxuICAgIC8vIFVwZGF0ZSBjZXJ0YWluIHByb3BlcnRpZXMgb24gJ3JlYWR5JyBldmVudFxuICAgIGFkZExheWVyOiBmdW5jdGlvbihsYXllcikge1xuICAgICAgICBpZiAoJ29uJyBpbiBsYXllcikgeyBsYXllci5vbigncmVhZHknLCBMLmJpbmQoZnVuY3Rpb24oKSB7IHRoaXMuX3VwZGF0ZUxheWVyKGxheWVyKTsgfSwgdGhpcykpOyB9XG4gICAgICAgIHJldHVybiBMLk1hcC5wcm90b3R5cGUuYWRkTGF5ZXIuY2FsbCh0aGlzLCBsYXllcik7XG4gICAgfSxcblxuICAgIC8vIHVzZSBhIGphdmFzY3JpcHQgb2JqZWN0IG9mIHRpbGVqc29uIGRhdGEgdG8gY29uZmlndXJlIHRoaXMgbGF5ZXJcbiAgICBfc2V0VGlsZUpTT046IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgdGhpcy5fdGlsZWpzb24gPSBfO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplKF8pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0VGlsZUpTT046IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdGlsZWpzb247XG4gICAgfSxcblxuICAgIF9pbml0aWFsaXplOiBmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIGlmICh0aGlzLnRpbGVMYXllcikge1xuICAgICAgICAgICAgdGhpcy50aWxlTGF5ZXIuX3NldFRpbGVKU09OKGpzb24pO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGF5ZXIodGhpcy50aWxlTGF5ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZmVhdHVyZUxheWVyICYmICF0aGlzLmZlYXR1cmVMYXllci5nZXRHZW9KU09OKCkgJiYganNvbi5kYXRhICYmIGpzb24uZGF0YVswXSkge1xuICAgICAgICAgICAgdGhpcy5mZWF0dXJlTGF5ZXIubG9hZFVSTChqc29uLmRhdGFbMF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZExheWVyKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRMYXllci5fc2V0VGlsZUpTT04oanNvbik7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVMYXllcih0aGlzLmdyaWRMYXllcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pbmZvQ29udHJvbCAmJiBqc29uLmF0dHJpYnV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmluZm9Db250cm9sLmFkZEluZm8oanNvbi5hdHRyaWJ1dGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5sZWdlbmRDb250cm9sICYmIGpzb24ubGVnZW5kKSB7XG4gICAgICAgICAgICB0aGlzLmxlZ2VuZENvbnRyb2wuYWRkTGVnZW5kKGpzb24ubGVnZW5kKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNoYXJlQ29udHJvbCkge1xuICAgICAgICAgICAgdGhpcy5zaGFyZUNvbnRyb2wuX3NldFRpbGVKU09OKGpzb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9sb2FkZWQgJiYganNvbi5jZW50ZXIpIHtcbiAgICAgICAgICAgIHZhciB6b29tID0ganNvbi5jZW50ZXJbMl0sXG4gICAgICAgICAgICAgICAgY2VudGVyID0gTC5sYXRMbmcoanNvbi5jZW50ZXJbMV0sIGpzb24uY2VudGVyWzBdKTtcblxuICAgICAgICAgICAgdGhpcy5zZXRWaWV3KGNlbnRlciwgem9vbSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZUxheWVyOiBmdW5jdGlvbihsYXllcikge1xuICAgICAgICBpZiAoIWxheWVyLm9wdGlvbnMpIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5pbmZvQ29udHJvbCAmJiB0aGlzLl9sb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRyb2wuYWRkSW5mbyhsYXllci5vcHRpb25zLmluZm9Db250cm9sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0aW9uQ29udHJvbCAmJiB0aGlzLl9sb2FkZWQgJiYgbGF5ZXIuZ2V0QXR0cmlidXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRpb25Db250cm9sLmFkZEF0dHJpYnV0aW9uKGxheWVyLmdldEF0dHJpYnV0aW9uKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEoTC5zdGFtcChsYXllcikgaW4gdGhpcy5fem9vbUJvdW5kTGF5ZXJzKSAmJlxuICAgICAgICAgICAgICAgIChsYXllci5vcHRpb25zLm1heFpvb20gfHwgbGF5ZXIub3B0aW9ucy5taW5ab29tKSkge1xuICAgICAgICAgICAgdGhpcy5fem9vbUJvdW5kTGF5ZXJzW0wuc3RhbXAobGF5ZXIpXSA9IGxheWVyO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlWm9vbUxldmVscygpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQsIF8sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExNYXAoZWxlbWVudCwgXywgb3B0aW9ucyk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXJsID0gcmVxdWlyZSgnLi91cmwnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyksXG4gICAgc2FuaXRpemUgPSByZXF1aXJlKCdzYW5pdGl6ZS1jYWphJyk7XG5cbi8vIG1hcGJveC1yZWxhdGVkIG1hcmtlcnMgZnVuY3Rpb25hbGl0eVxuLy8gcHJvdmlkZSBhbiBpY29uIGZyb20gbWFwYm94J3Mgc2ltcGxlLXN0eWxlIHNwZWMgYW5kIGhvc3RlZCBtYXJrZXJzXG4vLyBzZXJ2aWNlXG5mdW5jdGlvbiBpY29uKGZwKSB7XG4gICAgZnAgPSBmcCB8fCB7fTtcblxuICAgIHZhciBzaXplcyA9IHtcbiAgICAgICAgICAgIHNtYWxsOiBbMjAsIDUwXSxcbiAgICAgICAgICAgIG1lZGl1bTogWzMwLCA3MF0sXG4gICAgICAgICAgICBsYXJnZTogWzM1LCA5MF1cbiAgICAgICAgfSxcbiAgICAgICAgc2l6ZSA9IGZwWydtYXJrZXItc2l6ZSddIHx8ICdtZWRpdW0nLFxuICAgICAgICBzeW1ib2wgPSAoZnBbJ21hcmtlci1zeW1ib2wnXSkgPyAnLScgKyBmcFsnbWFya2VyLXN5bWJvbCddIDogJycsXG4gICAgICAgIGNvbG9yID0gKGZwWydtYXJrZXItY29sb3InXSB8fCAnN2U3ZTdlJykucmVwbGFjZSgnIycsICcnKTtcblxuICAgIHJldHVybiBMLmljb24oe1xuICAgICAgICBpY29uVXJsOiB1cmwuYmFzZSgpICsgJ21hcmtlci8nICtcbiAgICAgICAgICAgICdwaW4tJyArIHNpemUuY2hhckF0KDApICsgc3ltYm9sICsgJysnICsgY29sb3IgK1xuICAgICAgICAgICAgLy8gZGV0ZWN0IGFuZCB1c2UgcmV0aW5hIG1hcmtlcnMsIHdoaWNoIGFyZSB4MiByZXNvbHV0aW9uXG4gICAgICAgICAgICAoKEwuQnJvd3Nlci5yZXRpbmEpID8gJ0AyeCcgOiAnJykgKyAnLnBuZycsXG4gICAgICAgIGljb25TaXplOiBzaXplc1tzaXplXSxcbiAgICAgICAgaWNvbkFuY2hvcjogW3NpemVzW3NpemVdWzBdIC8gMiwgc2l6ZXNbc2l6ZV1bMV0gLyAyXSxcbiAgICAgICAgcG9wdXBBbmNob3I6IFswLCAtc2l6ZXNbc2l6ZV1bMV0gLyAyXVxuICAgIH0pO1xufVxuXG4vLyBhIGZhY3RvcnkgdGhhdCBwcm92aWRlcyBtYXJrZXJzIGZvciBMZWFmbGV0IGZyb20gTWFwYm94J3Ncbi8vIFtzaW1wbGUtc3R5bGUgc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly9naXRodWIuY29tL21hcGJveC9zaW1wbGVzdHlsZS1zcGVjKVxuLy8gYW5kIFtNYXJrZXJzIEFQSV0oaHR0cDovL21hcGJveC5jb20vZGV2ZWxvcGVycy9hcGkvI21hcmtlcnMpLlxuZnVuY3Rpb24gc3R5bGUoZiwgbGF0bG9uKSB7XG4gICAgcmV0dXJuIEwubWFya2VyKGxhdGxvbiwge1xuICAgICAgICBpY29uOiBpY29uKGYucHJvcGVydGllcyksXG4gICAgICAgIHRpdGxlOiB1dGlsLnN0cmlwX3RhZ3MoXG4gICAgICAgICAgICBzYW5pdGl6ZSgoZi5wcm9wZXJ0aWVzICYmIGYucHJvcGVydGllcy50aXRsZSkgfHwgJycpKVxuICAgIH0pO1xufVxuXG4vLyBTYW5pdGl6ZSBhbmQgZm9ybWF0IHByb3BlcnRpZXMgb2YgYSBHZW9KU09OIEZlYXR1cmUgb2JqZWN0IGluIG9yZGVyXG4vLyB0byBmb3JtIHRoZSBIVE1MIHN0cmluZyB1c2VkIGFzIHRoZSBhcmd1bWVudCBmb3IgYEwuY3JlYXRlUG9wdXBgXG5mdW5jdGlvbiBjcmVhdGVQb3B1cChmLCBzYW5pdGl6ZXIpIHtcbiAgICBpZiAoIWYgfHwgIWYucHJvcGVydGllcykgcmV0dXJuICcnO1xuICAgIHZhciBwb3B1cCA9ICcnO1xuXG4gICAgaWYgKGYucHJvcGVydGllcy50aXRsZSkge1xuICAgICAgICBwb3B1cCArPSAnPGRpdiBjbGFzcz1cIm1hcmtlci10aXRsZVwiPicgKyBmLnByb3BlcnRpZXMudGl0bGUgKyAnPC9kaXY+JztcbiAgICB9XG5cbiAgICBpZiAoZi5wcm9wZXJ0aWVzLmRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHBvcHVwICs9ICc8ZGl2IGNsYXNzPVwibWFya2VyLWRlc2NyaXB0aW9uXCI+JyArIGYucHJvcGVydGllcy5kZXNjcmlwdGlvbiArICc8L2Rpdj4nO1xuICAgIH1cblxuICAgIHJldHVybiAoc2FuaXRpemVyIHx8IHNhbml0aXplKShwb3B1cCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGljb246IGljb24sXG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIGNyZWF0ZVBvcHVwOiBjcmVhdGVQb3B1cFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvcnNsaXRlID0gcmVxdWlyZSgnY29yc2xpdGUnKSxcbiAgICBKU09OMyA9IHJlcXVpcmUoJ2pzb24zJyksXG4gICAgc3RyaWN0ID0gcmVxdWlyZSgnLi91dGlsJykuc3RyaWN0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICBzdHJpY3QodXJsLCAnc3RyaW5nJyk7XG4gICAgc3RyaWN0KGNhbGxiYWNrLCAnZnVuY3Rpb24nKTtcbiAgICByZXR1cm4gY29yc2xpdGUodXJsLCBvbmxvYWQpO1xuICAgIGZ1bmN0aW9uIG9ubG9hZChlcnIsIHJlc3ApIHtcbiAgICAgICAgaWYgKCFlcnIgJiYgcmVzcCkge1xuICAgICAgICAgICAgLy8gaGFyZGNvZGVkIGdyaWQgcmVzcG9uc2VcbiAgICAgICAgICAgIGlmIChyZXNwLnJlc3BvbnNlVGV4dFswXSA9PSAnZycpIHtcbiAgICAgICAgICAgICAgICByZXNwID0gSlNPTjMucGFyc2UocmVzcC5yZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgICAgICAgLnN1YnN0cmluZyg1LCByZXNwLnJlc3BvbnNlVGV4dC5sZW5ndGggLSAyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3AgPSBKU09OMy5wYXJzZShyZXNwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2FsbGJhY2soZXJyLCByZXNwKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXJsID0gcmVxdWlyZSgnLi91cmwnKTtcblxudmFyIFNoYXJlQ29udHJvbCA9IEwuQ29udHJvbC5leHRlbmQoe1xuICAgIGluY2x1ZGVzOiBbcmVxdWlyZSgnLi9sb2FkX3RpbGVqc29uJyldLFxuXG4gICAgb3B0aW9uczoge1xuICAgICAgICBwb3NpdGlvbjogJ3RvcGxlZnQnLFxuICAgICAgICB1cmw6ICcnXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9sb2FkVGlsZUpTT04oXyk7XG4gICAgfSxcblxuICAgIF9zZXRUaWxlSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgICB0aGlzLl90aWxlanNvbiA9IGpzb247XG4gICAgfSxcblxuICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuICAgICAgICB0aGlzLl91cmwgPSB1cmw7XG5cbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LWNvbnRyb2wtbWFwYm94LXNoYXJlIGxlYWZsZXQtYmFyJyk7XG4gICAgICAgIHZhciBsaW5rID0gTC5Eb21VdGlsLmNyZWF0ZSgnYScsICdtYXBib3gtc2hhcmUgbWFwYm94LWljb24gbWFwYm94LWljb24tc2hhcmUnLCBjb250YWluZXIpO1xuICAgICAgICBsaW5rLmhyZWYgPSAnIyc7XG5cbiAgICAgICAgdGhpcy5fbW9kYWwgPSBtYXAuX2NyZWF0ZVBhbmUoJ21hcGJveC1tb2RhbCcsIHRoaXMuX21hcC5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fbWFzayA9IG1hcC5fY3JlYXRlUGFuZSgnbWFwYm94LW1vZGFsLW1hc2snLCB0aGlzLl9tb2RhbCk7XG4gICAgICAgIHRoaXMuX2NvbnRlbnQgPSBtYXAuX2NyZWF0ZVBhbmUoJ21hcGJveC1tb2RhbC1jb250ZW50JywgdGhpcy5fbW9kYWwpO1xuXG4gICAgICAgIEwuRG9tRXZlbnQuYWRkTGlzdGVuZXIobGluaywgJ2NsaWNrJywgdGhpcy5fc2hhcmVDbGljaywgdGhpcyk7XG4gICAgICAgIEwuRG9tRXZlbnQuZGlzYWJsZUNsaWNrUHJvcGFnYXRpb24oY29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLl9tYXAub24oJ21vdXNlZG93bicsIHRoaXMuX2NsaWNrT3V0LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH0sXG5cbiAgICBfY2xpY2tPdXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3NoYXJpbmcpIHtcbiAgICAgICAgICAgIEwuRG9tRXZlbnQucHJldmVudERlZmF1bHQoZSk7XG4gICAgICAgICAgICBMLkRvbVV0aWwucmVtb3ZlQ2xhc3ModGhpcy5fbW9kYWwsICdhY3RpdmUnKTtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRlbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB0aGlzLl9zaGFyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2hhcmVDbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICBMLkRvbUV2ZW50LnN0b3AoZSk7XG4gICAgICAgIGlmICh0aGlzLl9zaGFyaW5nKSByZXR1cm4gdGhpcy5fY2xpY2tPdXQoZSk7XG5cbiAgICAgICAgdmFyIHRpbGVqc29uID0gdGhpcy5fdGlsZWpzb24gfHwgdGhpcy5fbWFwLl90aWxlanNvbiB8fCB7fSxcbiAgICAgICAgICAgIHVybCA9IGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLm9wdGlvbnMudXJsIHx8IHRpbGVqc29uLndlYnBhZ2UgfHwgd2luZG93LmxvY2F0aW9uKSxcbiAgICAgICAgICAgIG5hbWUgPSBlbmNvZGVVUklDb21wb25lbnQodGlsZWpzb24ubmFtZSksXG4gICAgICAgICAgICBpbWFnZSA9IHRoaXMuX3VybC5iYXNlKCkgKyB0aWxlanNvbi5pZCArICcvJyArIHRoaXMuX21hcC5nZXRDZW50ZXIoKS5sbmcgKyAnLCcgKyB0aGlzLl9tYXAuZ2V0Q2VudGVyKCkubGF0ICsgJywnICsgdGhpcy5fbWFwLmdldFpvb20oKSArICcvNjAweDYwMC5wbmcnLFxuICAgICAgICAgICAgdHdpdHRlciA9ICcvL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD9zdGF0dXM9JyArIG5hbWUgKyAnICcgKyB1cmwsXG4gICAgICAgICAgICBmYWNlYm9vayA9ICcvL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyLnBocD91PScgKyB1cmwgKyAnJnQ9JyArIGVuY29kZVVSSUNvbXBvbmVudCh0aWxlanNvbi5uYW1lKSxcbiAgICAgICAgICAgIHBpbnRlcmVzdCA9ICcvL3d3dy5waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYnV0dG9uLz91cmw9JyArIHVybCArICcmbWVkaWE9JyArIGltYWdlICsgJyZkZXNjcmlwdGlvbj0nICsgdGlsZWpzb24ubmFtZSxcbiAgICAgICAgICAgIHNoYXJlID0gKFwiPGgzPlNoYXJlIHRoaXMgbWFwPC9oMz5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nbWFwYm94LXNoYXJlLWJ1dHRvbnMnPjxhIGNsYXNzPSdtYXBib3gtYnV0dG9uIG1hcGJveC1idXR0b24taWNvbiBtYXBib3gtaWNvbi1mYWNlYm9vaycgdGFyZ2V0PSdfYmxhbmsnIGhyZWY9J3t7ZmFjZWJvb2t9fSc+RmFjZWJvb2s8L2E+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSdtYXBib3gtYnV0dG9uIG1hcGJveC1idXR0b24taWNvbiBtYXBib3gtaWNvbi10d2l0dGVyJyB0YXJnZXQ9J19ibGFuaycgaHJlZj0ne3t0d2l0dGVyfX0nPlR3aXR0ZXI8L2E+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSdtYXBib3gtYnV0dG9uIG1hcGJveC1idXR0b24taWNvbiBtYXBib3gtaWNvbi1waW50ZXJlc3QnIHRhcmdldD0nX2JsYW5rJyBocmVmPSd7e3BpbnRlcmVzdH19Jz5QaW50ZXJlc3Q8L2E+PC9kaXY+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCd7e3R3aXR0ZXJ9fScsIHR3aXR0ZXIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCd7e2ZhY2Vib29rfX0nLCBmYWNlYm9vaylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoJ3t7cGludGVyZXN0fX0nLCBwaW50ZXJlc3QpLFxuICAgICAgICAgICAgZW1iZWRWYWx1ZSA9ICc8aWZyYW1lIHdpZHRoPVwiMTAwJVwiIGhlaWdodD1cIjUwMHB4XCIgZnJhbWVCb3JkZXI9XCIwXCIgc3JjPVwie3tlbWJlZH19XCI+PC9pZnJhbWU+Jy5yZXBsYWNlKCd7e2VtYmVkfX0nLCB0aWxlanNvbi5lbWJlZCB8fCB3aW5kb3cubG9jYXRpb24pLFxuICAgICAgICAgICAgZW1iZWRMYWJlbCA9ICdDb3B5IGFuZCBwYXN0ZSB0aGlzIDxzdHJvbmc+SFRNTCBjb2RlPC9zdHJvbmc+IGludG8gZG9jdW1lbnRzIHRvIGVtYmVkIHRoaXMgbWFwIG9uIHdlYiBwYWdlcy4nO1xuXG4gICAgICAgIEwuRG9tVXRpbC5hZGRDbGFzcyh0aGlzLl9tb2RhbCwgJ2FjdGl2ZScpO1xuXG4gICAgICAgIHRoaXMuX3NoYXJpbmcgPSB0aGlzLl9tYXAuX2NyZWF0ZVBhbmUoJ21hcGJveC1tb2RhbC1ib2R5JywgdGhpcy5fY29udGVudCk7XG4gICAgICAgIHRoaXMuX3NoYXJpbmcuaW5uZXJIVE1MID0gc2hhcmU7XG5cbiAgICAgICAgdmFyIGVtYmVkID0gTC5Eb21VdGlsLmNyZWF0ZSgnaW5wdXQnLCAnbWFwYm94LWVtYmVkJywgdGhpcy5fc2hhcmluZyk7XG4gICAgICAgIGVtYmVkLnR5cGUgPSAndGV4dCc7XG4gICAgICAgIGVtYmVkLnZhbHVlID0gZW1iZWRWYWx1ZTtcblxuICAgICAgICB2YXIgbGFiZWwgPSBMLkRvbVV0aWwuY3JlYXRlKCdsYWJlbCcsICdtYXBib3gtZW1iZWQtZGVzY3JpcHRpb24nLCB0aGlzLl9zaGFyaW5nKTtcbiAgICAgICAgbGFiZWwuaW5uZXJIVE1MID0gZW1iZWRMYWJlbDtcblxuICAgICAgICB2YXIgY2xvc2UgPSBMLkRvbVV0aWwuY3JlYXRlKCdhJywgJ2xlYWZsZXQtcG9wdXAtY2xvc2UtYnV0dG9uJywgdGhpcy5fc2hhcmluZyk7XG4gICAgICAgIGNsb3NlLmhyZWYgPSAnIyc7XG5cbiAgICAgICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbih0aGlzLl9zaGFyaW5nKTtcbiAgICAgICAgTC5Eb21FdmVudC5hZGRMaXN0ZW5lcihjbG9zZSwgJ2NsaWNrJywgdGhpcy5fY2xpY2tPdXQsIHRoaXMpO1xuICAgICAgICBMLkRvbUV2ZW50LmFkZExpc3RlbmVyKGVtYmVkLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnRhcmdldC5mb2N1cygpO1xuICAgICAgICAgICAgZS50YXJnZXQuc2VsZWN0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKF8sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IFNoYXJlQ29udHJvbChfLCBvcHRpb25zKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZSBzaW1wbGVzdHlsZSBzcGVjIGZvciBwb2x5Z29uIGFuZCBsaW5lc3RyaW5nIGZlYXR1cmVzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbWFwYm94L3NpbXBsZXN0eWxlLXNwZWNcbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzdHJva2U6ICcjNTU1NTU1JyxcbiAgICAnc3Ryb2tlLXdpZHRoJzogMixcbiAgICAnc3Ryb2tlLW9wYWNpdHknOiAxLFxuICAgIGZpbGw6ICcjNTU1NTU1JyxcbiAgICAnZmlsbC1vcGFjaXR5JzogMC41XG59O1xuXG52YXIgbWFwcGluZyA9IFtcbiAgICBbJ3N0cm9rZScsICdjb2xvciddLFxuICAgIFsnc3Ryb2tlLXdpZHRoJywgJ3dlaWdodCddLFxuICAgIFsnc3Ryb2tlLW9wYWNpdHknLCAnb3BhY2l0eSddLFxuICAgIFsnZmlsbCcsICdmaWxsQ29sb3InXSxcbiAgICBbJ2ZpbGwtb3BhY2l0eScsICdmaWxsT3BhY2l0eSddXG5dO1xuXG5mdW5jdGlvbiBmYWxsYmFjayhhLCBiKSB7XG4gICAgdmFyIGMgPSB7fTtcbiAgICBmb3IgKHZhciBrIGluIGIpIHtcbiAgICAgICAgaWYgKGFba10gPT09IHVuZGVmaW5lZCkgY1trXSA9IGJba107XG4gICAgICAgIGVsc2UgY1trXSA9IGFba107XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuXG5mdW5jdGlvbiByZW1hcChhKSB7XG4gICAgdmFyIGQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcHBpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZFttYXBwaW5nW2ldWzFdXSA9IGFbbWFwcGluZ1tpXVswXV07XG4gICAgfVxuICAgIHJldHVybiBkO1xufVxuXG5mdW5jdGlvbiBzdHlsZShmZWF0dXJlKSB7XG4gICAgcmV0dXJuIHJlbWFwKGZhbGxiYWNrKGZlYXR1cmUucHJvcGVydGllcyB8fCB7fSwgZGVmYXVsdHMpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3R5bGU6IHN0eWxlLFxuICAgIGRlZmF1bHRzOiBkZWZhdWx0c1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKSxcbiAgICB1cmwgPSByZXF1aXJlKCcuL3VybCcpO1xuXG52YXIgVGlsZUxheWVyID0gTC5UaWxlTGF5ZXIuZXh0ZW5kKHtcbiAgICBpbmNsdWRlczogW3JlcXVpcmUoJy4vbG9hZF90aWxlanNvbicpXSxcblxuICAgIG9wdGlvbnM6IHtcbiAgICAgICAgZm9ybWF0OiAncG5nJ1xuICAgIH0sXG5cbiAgICAvLyBodHRwOi8vbWFwYm94LmNvbS9kZXZlbG9wZXJzL2FwaS8jaW1hZ2VfcXVhbGl0eVxuICAgIGZvcm1hdHM6IFtcbiAgICAgICAgJ3BuZycsXG4gICAgICAgIC8vIFBOR1xuICAgICAgICAncG5nMzInLCAncG5nNjQnLCAncG5nMTI4JywgJ3BuZzI1NicsXG4gICAgICAgIC8vIEpQR1xuICAgICAgICAnanBnNzAnLCAnanBnODAnLCAnanBnOTAnXSxcblxuICAgIHNjYWxlUHJlZml4OiAnQDJ4LicsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihfLCBvcHRpb25zKSB7XG4gICAgICAgIEwuVGlsZUxheWVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgdW5kZWZpbmVkLCBvcHRpb25zKTtcblxuICAgICAgICB0aGlzLl90aWxlanNvbiA9IHt9O1xuXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZGV0ZWN0UmV0aW5hICYmXG4gICAgICAgICAgICBMLkJyb3dzZXIucmV0aW5hICYmIG9wdGlvbnMucmV0aW5hVmVyc2lvbikge1xuICAgICAgICAgICAgXyA9IG9wdGlvbnMucmV0aW5hVmVyc2lvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZm9ybWF0KSB7XG4gICAgICAgICAgICB1dGlsLnN0cmljdF9vbmVvZihvcHRpb25zLmZvcm1hdCwgdGhpcy5mb3JtYXRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xvYWRUaWxlSlNPTihfKTtcbiAgICB9LFxuXG4gICAgc2V0Rm9ybWF0OiBmdW5jdGlvbihfKSB7XG4gICAgICAgIHV0aWwuc3RyaWN0KF8sICdzdHJpbmcnKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmZvcm1hdCA9IF87XG4gICAgICAgIHRoaXMucmVkcmF3KCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfYXV0b1NjYWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucyAmJlxuICAgICAgICAgICAgTC5Ccm93c2VyLnJldGluYSAmJlxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmRldGVjdFJldGluYSAmJlxuICAgICAgICAgICAgKCF0aGlzLm9wdGlvbnMucmV0aW5hVmVyc2lvbikgJiZcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hdXRvc2NhbGU7XG4gICAgfSxcblxuICAgIC8vIGRpc2FibGUgdGhlIHNldFVybCBmdW5jdGlvbiwgd2hpY2ggaXMgbm90IGF2YWlsYWJsZSBvbiBtYXBib3ggdGlsZWxheWVyc1xuICAgIHNldFVybDogbnVsbCxcblxuICAgIF9zZXRUaWxlSlNPTjogZnVuY3Rpb24oanNvbikge1xuICAgICAgICB1dGlsLnN0cmljdChqc29uLCAnb2JqZWN0Jyk7XG5cbiAgICAgICAgTC5leHRlbmQodGhpcy5vcHRpb25zLCB7XG4gICAgICAgICAgICB0aWxlczoganNvbi50aWxlcyxcbiAgICAgICAgICAgIGF0dHJpYnV0aW9uOiBqc29uLmF0dHJpYnV0aW9uLFxuICAgICAgICAgICAgbWluWm9vbToganNvbi5taW56b29tLFxuICAgICAgICAgICAgbWF4Wm9vbToganNvbi5tYXh6b29tLFxuICAgICAgICAgICAgYXV0b3NjYWxlOiBqc29uLmF1dG9zY2FsZSB8fCBmYWxzZSxcbiAgICAgICAgICAgIHRtczoganNvbi5zY2hlbWUgPT09ICd0bXMnLFxuICAgICAgICAgICAgYm91bmRzOiBqc29uLmJvdW5kcyAmJiB1dGlsLmxib3VuZHMoanNvbi5ib3VuZHMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3RpbGVqc29uID0ganNvbjtcbiAgICAgICAgdGhpcy5yZWRyYXcoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldFRpbGVKU09OOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3RpbGVqc29uO1xuICAgIH0sXG5cbiAgICAvLyB0aGlzIGlzIGFuIGV4Y2VwdGlvbiB0byBtYXBib3guanMgbmFtaW5nIHJ1bGVzIGJlY2F1c2UgaXQncyBjYWxsZWRcbiAgICAvLyBieSBgTC5tYXBgXG4gICAgZ2V0VGlsZVVybDogZnVuY3Rpb24odGlsZVBvaW50KSB7XG4gICAgICAgIHZhciB0aWxlcyA9IHRoaXMub3B0aW9ucy50aWxlcyxcbiAgICAgICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcihNYXRoLmFicyh0aWxlUG9pbnQueCArIHRpbGVQb2ludC55KSAlIHRpbGVzLmxlbmd0aCksXG4gICAgICAgICAgICB1cmwgPSB0aWxlc1tpbmRleF07XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlZCA9IEwuVXRpbC50ZW1wbGF0ZSh1cmwsIHRpbGVQb2ludCk7XG4gICAgICAgIGlmICghdGVtcGxhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlZC5yZXBsYWNlKCcucG5nJyxcbiAgICAgICAgICAgICAgICAodGhpcy5fYXV0b1NjYWxlKCkgPyB0aGlzLnNjYWxlUHJlZml4IDogJy4nKSArIHRoaXMub3B0aW9ucy5mb3JtYXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIFRpbGVKU09OLlRpbGVMYXllcnMgYXJlIGFkZGVkIHRvIHRoZSBtYXAgaW1tZWRpYXRlbHksIHNvIHRoYXQgdGhleSBnZXRcbiAgICAvLyB0aGUgZGVzaXJlZCB6LWluZGV4LCBidXQgZG8gbm90IHVwZGF0ZSB1bnRpbCB0aGUgVGlsZUpTT04gaGFzIGJlZW4gbG9hZGVkLlxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpbGVzKSB7XG4gICAgICAgICAgICBMLlRpbGVMYXllci5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oXywgb3B0aW9ucykge1xuICAgIHJldHVybiBuZXcgVGlsZUxheWVyKF8sIG9wdGlvbnMpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG5cbi8vIFJldHVybiB0aGUgYmFzZSB1cmwgb2YgYSBzcGVjaWZpYyB2ZXJzaW9uIG9mIE1hcGJveCdzIEFQSS5cbi8vXG4vLyBgaGFzaGAsIGlmIHByb3ZpZGVkIG11c3QgYmUgYSBudW1iZXIgYW5kIGlzIHVzZWQgdG8gZGlzdHJpYnV0ZSByZXF1ZXN0c1xuLy8gYWdhaW5zdCBtdWx0aXBsZSBgQ05BTUVgcyBpbiBvcmRlciB0byBhdm9pZCBjb25uZWN0aW9uIGxpbWl0cyBpbiBicm93c2Vyc1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaXNTU0w6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJ2h0dHBzOicgPT09IGRvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sIHx8IGNvbmZpZy5GT1JDRV9IVFRQUztcbiAgICB9LFxuICAgIGJhc2U6IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgLy8gQnkgZGVmYXVsdCwgdXNlIHB1YmxpYyBIVFRQIHVybHNcbiAgICAgICAgLy8gU3VwcG9ydCBIVFRQUyBpZiB0aGUgdXNlciBoYXMgc3BlY2lmaWVkIEhUVFBTIHVybHMgdG8gdXNlLCBhbmQgdGhpc1xuICAgICAgICAvLyBwYWdlIGlzIHVuZGVyIEhUVFBTXG4gICAgICAgIHZhciB1cmxzID0gdGhpcy5pc1NTTCgpID8gY29uZmlnLkhUVFBTX1VSTFMgOiBjb25maWcuSFRUUF9VUkxTO1xuICAgICAgICBpZiAoaGFzaCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBoYXNoICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgcmV0dXJuIHVybHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsc1toYXNoICUgdXJscy5sZW5ndGhdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBSZXF1ZXN0cyB0aGF0IGNvbnRhaW4gVVJMcyBuZWVkIGEgc2VjdXJlIGZsYWcgYXBwZW5kZWRcbiAgICAvLyB0byB0aGVpciBVUkxzIHNvIHRoYXQgdGhlIHNlcnZlciBrbm93cyB0byBzZW5kIFNTTC1pZmllZFxuICAgIC8vIHJlc291cmNlIHJlZmVyZW5jZXMuXG4gICAgc2VjdXJlRmxhZzogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIGlmICghdGhpcy5pc1NTTCgpKSByZXR1cm4gdXJsO1xuICAgICAgICBlbHNlIGlmICh1cmwubWF0Y2goLyhcXD98JilzZWN1cmUvKSkgcmV0dXJuIHVybDtcbiAgICAgICAgZWxzZSBpZiAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEpIHJldHVybiB1cmwgKyAnJnNlY3VyZSc7XG4gICAgICAgIGVsc2UgcmV0dXJuIHVybCArICc/c2VjdXJlJztcbiAgICB9LFxuICAgIC8vIENvbnZlcnQgYSBKU09OUCB1cmwgdG8gYSBKU09OIFVSTC4gKE1hcGJveCBUaWxlSlNPTiBzb21ldGltZXMgaGFyZGNvZGVzIEpTT05QLilcbiAgICBqc29uaWZ5OiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgcmV0dXJuIHVybC5yZXBsYWNlKC9cXC4oZ2VvKT9qc29ucCg/PSR8XFw/KS8sICcuJDFqc29uJyk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaWRVcmw6IGZ1bmN0aW9uKF8sIHQpIHtcbiAgICAgICAgaWYgKF8uaW5kZXhPZignLycpID09IC0xKSB0LmxvYWRJRChfKTtcbiAgICAgICAgZWxzZSB0LmxvYWRVUkwoXyk7XG4gICAgfSxcbiAgICBsb2c6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN0cmljdDogZnVuY3Rpb24oXywgdHlwZSkge1xuICAgICAgICBpZiAodHlwZW9mIF8gIT09IHR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBhcmd1bWVudDogJyArIHR5cGUgKyAnIGV4cGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN0cmljdF9pbnN0YW5jZTogZnVuY3Rpb24oXywga2xhc3MsIG5hbWUpIHtcbiAgICAgICAgaWYgKCEoXyBpbnN0YW5jZW9mIGtsYXNzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGFyZ3VtZW50OiAnICsgbmFtZSArICcgZXhwZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc3RyaWN0X29uZW9mOiBmdW5jdGlvbihfLCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFjb250YWlucyhfLCB2YWx1ZXMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXJndW1lbnQ6ICcgKyBfICsgJyBnaXZlbiwgdmFsaWQgdmFsdWVzIGFyZSAnICtcbiAgICAgICAgICAgICAgICB2YWx1ZXMuam9pbignLCAnKSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN0cmlwX3RhZ3M6IGZ1bmN0aW9uKF8pIHtcbiAgICAgICAgcmV0dXJuIF8ucmVwbGFjZSgvPFtePF0rPi9nLCAnJyk7XG4gICAgfSxcbiAgICBsYm91bmRzOiBmdW5jdGlvbihfKSB7XG4gICAgICAgIC8vIGxlYWZsZXQtY29tcGF0aWJsZSBib3VuZHMsIHNpbmNlIGxlYWZsZXQgZG9lcyBub3QgZG8gZ2VvanNvblxuICAgICAgICByZXR1cm4gbmV3IEwuTGF0TG5nQm91bmRzKFtbX1sxXSwgX1swXV0sIFtfWzNdLCBfWzJdXV0pO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKGl0ZW0sIGxpc3QpIHtcbiAgICBpZiAoIWxpc3QgfHwgIWxpc3QubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChsaXN0W2ldID09IGl0ZW0pIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iXX0=
