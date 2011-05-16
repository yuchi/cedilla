//		 Cedilla.js 0.1
//		 (c) 2011 Pier Paolo Ramon
//		 Cedilla is freely distributable under the MIT license.
//		 Development pattern stolen by Underscore.js and jQuery

(function() {

	//Baseline setup
	//--------------

	// Establish the root object, `window` in the browser, or `global` on the server.
	var root = this;

	// Save previous values of `cedilla` and `ç` variables.
	var previous_cedilla = root.cedilla,
		previous_cedilla_char = root['ç'];

	// Create a safe reference to the Cedilla object for use below.
	var cedilla = function (key, data) {
		return cedilla.translate(key,data);
	};

	// Requires Underscore.js
	var _;
	if (typeof require != 'undefined') {
		_ = require('underscore');
	} else {
		_ = root.underscore || root._;
	}

	// Export the Cedilla object for **CommonJS**, with backwards-compatibility
	// for the old `require()` API. If we're not in CommonJS, add `ç` and `cedilla`
	// to the global object.
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = cedilla;
		cedilla.cedilla = cedilla.cedilla = cedilla;
		} else {
		root.cedilla = cedilla;
	}

	// Build settings and procedures
	// -----------------------------

	// This whole awesome system borrows from [Underscore.js](http://documentcloud.github.com/underscore/)
	// most of its code, originally by John Resig.

	// Main build regexps, `{# ... #}` for evaluation, `{ ... }` for interpolation.
	cedilla.buildSettings = {
		evaluate          : /\{#([\s\S]+?)#}/g,
		evaluateString    : /^\{#([\s\S]+?)#}$/,
		interpolate	      : /\{([^#]+[\s\S]*?)}/g,
		interpolateString : /^\{(\!|\^|)([^#]+[\s\S]*?)}$/
	};

	// Builds the translation object. Stolen from Underscore.js.
	cedilla.buildFunc = function(obj, lang, data) {
		var c = cedilla.buildSettings;
		var tmpl =
			'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
			'if(before)before.apply(obj,arguments);'+
			'with(obj||{}){\n'+
			cedilla.buildPartial(obj)+
			"\n}return __p.join('');";
		var func = new Function('obj', 'before', tmpl);
		return data ? func(data) : func;
	};

	// Understands translation nature and creates bodies. 
	cedilla.buildPartial = function (obj) {
		var c = cedilla.buildSettings;
		// Strings are leafs, so let's build the body directly.
		if (_.isString(obj)) {
			return cedilla.buildBody(obj);
		}
		// If this `obj` is not a string, then we must build the matching cases
		var tmpl = '';
		_.each(obj,function(params,expr){
			var evaluation,
				interpolation,
				code;
			if (evaluation = c.evaluateString.exec(expr)) {
				if (code = (evaluation && evaluation[1])) {
					console.log(code, 'evaluate');
					console.log('Evaulation will be available very soon');
					return tmpl;
				}
			} else {
				interpolation = c.interpolateString.exec(expr);
				if (code = (interpolation && interpolation[2])) {
					// Attention `reverse` is supported **only** for direct translations.
					var reversed = !!(interpolation[1]),
						operator = reversed ? "===" : "!==";
					// Check for presence
					tmpl += 'if(typeof ('+code+')'+operator+'"undefined"){';
					// If params is actually a string, just build it.
					if (_.isString(params) || reversed) {
						tmpl +=	cedilla.buildBody(params);
					} else {
						// Retrieve `:plural`,`:singular` and `:else`.
						cover([':plural','>1'], '>1', params);
						cover([':singular','1'], '1', params);
						var elseCase = popOut(':else',params),
							pSize = _.size(params),
							count = 0;
						_.each(params,function(obj2,param){
							++count;
							var operator = /^\s*[\>\<\=\!\.]+/.test(param) ? '' : '==';
							tmpl+=
							'if(('+code+')'+operator+param+'){'+
								cedilla.buildPartial(obj2)+
							(count < pSize ? '}else ' : '}');
						});
						if (elseCase) {
							if (pSize > 0) tmpl+='else{';
							tmpl += cedilla.buildPartial(elseCase);
							if (pSize > 0) tmpl+='}';
						}
					}
					tmpl+='}';
				}
			}
		});
		return tmpl;
	};

	// Build the body of the function, append data chunks. Stolen from Underscore.js.
	cedilla.buildBody = function (str) {
		var c = cedilla.buildSettings;
		return "print('" +
		str.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'")
			.replace(c.interpolate, function(match, code) {
			 return "'," + code.replace(/\\'/g, "'") + ",'";
			})
			.replace(c.evaluate || null, function(match, code) {
			return "');" +
				code.replace(/\\'/g, "'")
				.replace(/[\r\n\t]/g, ' ') +
				"print('";
			})
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n')
			.replace(/\t/g, '\\t')
			+ "');";
	}

	// Languages
	// ---------

	// This is were langauges describe themselves and register to the main languages object.
	// (partially inspired by [visionmedia's Lingo](https://github.com/visionmedia/lingo/))

	cedilla.languages = {};

	var Language = function Language (code, name, rules) {
		this.code = code;
		this.name = name;
		this.strings = {};
		this.translations = {};
		rules || (rules = {});
		this.rules = _.defaults(rules, Language.defaultRules);
		cedilla.languages[code] = this;
		this.retrieveInfo();
	}

	// Export Langauge inside Cedilla
	cedilla.Language = Language;

	// ###  Static class objects
	_.extend(Language, {
		// Default rules for the Language
		defaultRules: {
			zeroIsPlural: true
		}
	});

	// ### Non-static class objects and methods
	_.extend(Language.prototype, {

		// Retrieve informations from [Locale Planet](http://www.localeplanet.com)
		retrieveInfo : function () {
			this.icu = {};
			var url = 'http://www.localeplanet.com/api/'+this.code+'/icu.js',
				objectname = 'window.cedilla.languages.'+this.code+'.icu';
			if (root.jQuery && root.jQuery.ajax) {
				root.jQuery.ajax({
					url: url,
					dataType: 'jsonp',
					data: {
						object: objectname
					},
					jsonp: false,
					/*jsonpCallback: 'load'+this.code+'info',*/
					parseData: true,
					/*success: function (){
						console.log(arguments);
					}*/
				});
			} else {
				console.log("There is no information retrival for node.js by now... Sorry");
				/* help! Please*/
			}
		},

		// Actual translation method
		translate: function (key, data) {
			var translation = this.translations[key];
			if (!translation) {
				var original = this.strings[key];
				if (original) {
					translation = this.translations[key] = cedilla.buildFunc(original,this);
				}
			}
			if (_.isFunction(translation)) {
				return translation(data);
			} else {
				return translation || key;
			}
		},

		// Append a single translation
		add: function (key, translation) {
			this.strings[key] = translation;
			if (cedilla.precompile) {
				this.translations[key] = cedilla.buildFunc(translation, this);
			}
		},

		// Append multiple tranlations
		addAll: function (translations) {
			var lang = this;
			_.each(translations, function(translation,key){
				lang.add(key,translation);
			});
		}
	});

	// APIs
	// ----

	// Temporary i18ns injecton procedure.

	cedilla.inject = function (translations) {
		cedilla.addAll(translations);
		/*
		cedilla.i18n = _i18n;
		cedilla.strings || (cedilla.strings = {});
		_.each(_i18n,function(translation,key){
			cedilla.strings[key] = cedilla.buildFunc(translation);
		});
		*/
	}

	// Reverse injection method
	cedilla.add = function (key, translation, lang) {
		lang || (lang = cedilla.currentLanguage);
		lang.add(key,translation);
	}

	// Reverse multiple injection method
	cedilla.addAll = function (translations, lang) {
		lang || (lang = cedilla.currentLanguage);
		land.addAll(translation);
	}

	// Actual tranlsate method
	cedilla.translate = function (key,data,lang) {
		lang || (lang = cedilla.currentLanguage);
		return lang.translate(key,data);
	};

	// Be able to use the `ç` character
	cedilla.simplifyAccess = function(){
		previous_cedilla_char = root['ç'];
		root['ç'] = cedilla;
	}

	// Be able to retrieve previous values
	cedilla.noConflict = function (key) {
		root.cedilla = previous_cedilla;
		root['ç'] = typeof previous_cedilla_char !== "undefined" ? previous_cedilla_char : root['ç'];
		root[key || '_cedilla'] = cedilla;
	};

	cedilla.i18n = {};

	// Utils
	// -----

	// ### Underscore mixin
	_.mixin({
		translate: cedilla.translate
	});

	// Util method that searches through an hash for a set of property, removes them and then put
	// what it found values inside `array[key]`.
	var cover = root.cover = function (properties, key, array) {
		var v = popOut(properties,array);
		if (typeof v !== "undefined") {
			array[key] = v;
		}
	};

	// Util method to get and remove an hash property. I think I'd like to move it on Underscore.js.
	var popOut = root.popOut = function (property, array) {
		array || (array = this);
		var p;
		if (_.isArray(property)){
			_.each(property,function(property){
			p = popOut(property, array);
			});
		} else {
			if (Object.prototype.hasOwnProperty.call(array,property)){
			p = array[property];
			delete array[property];
			}
		}
		return p;
	}

})();
