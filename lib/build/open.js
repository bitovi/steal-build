var steal = require('../steal');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var ignores = ['steal/dev/dev.js', 'stealconfig.js'];
var vm = require('vm');
var parse = require('./parse');
var compiler = require('can-compile');
var parseContent = function(text) {
	return parse(text)
		.replace(/(\s?)\/\/!steal-remove-start((.|\n)*?)\/\/!steal-remove-end/gim, '')
		.replace(/(\s?)\/\/!pluginify-remove-start((.|\n)*?)\/\/!pluginify-remove-end/gim, '');
}

/**
 * Opens one or more files by id, loads all depenencies and returns
 * a list or root Steal objects.
 *
 * @param id {String|Array} The file(s) to open
 * @param options {Object} The Steal configuration to use
 * @param cb {function(steals, opener)} A callback that gets the list of
 * steal dependency objects and the Steal instance used to open the files.
 */
function opener(id, options, cb) {
	if (!cb) {
		cb = options;
		options = {};
	}

	var ignore = ignores.concat(options.ignore || []);
	var ids = Array.isArray(id) ? id : [id];
	// clone Steal so that we don't mess with the original
	var openerSteal = steal.clone();
	// Node VM module == fancy eval with custom context
	var context = vm.createContext({
		steal: openerSteal
	});

	/**
	 * Get the contents of a steal module's file
	 * @param  {Object} options steal module's options
	 * @return {String} content of file if it exists, null otherwise
	 */
	var getFileContents = function(options) {
		var filename = path.join('' + openerSteal.idToUri(options.id));
		if (fs.existsSync(filename)) {
			return fs.readFileSync(filename).toString();
		}
		return null;
	};

	/**
	 * Compile a EJS or Mustache template using can-compile.
	 * Sets options.text to the compiled template
	 * @param  {Object} options steal module's options
	 * @param  {Function} success success callback
	 * @param  {Function} failure failure callback
	 */
	var compileTemplate = function(options, success, failure) {
		var filename = ''+ openerSteal.idToUri(options.id);
		compiler.compile(filename, function(error, output) {
			if(error) {
				failure();
			}
			options.text = output;
			success();
		});
	};

	// Because in Node we load everything synchronously we should be fine
	// reconfiguring Steal and then setting it back to its original state
	openerSteal.config(_.extend({}, options, {
		// Overwrite Steals `js` (load text instead of adding script tag) and
		// `fn` type (don't execute any callbacks)
		types: {
			"js": function (options, success, failure) {
				var proceed = function (text) {
					// check if steal is in this file
					var stealInFile = /steal\(/.test(text);
					if (stealInFile) {
						// if so, load it (run in another context which is just a fancy `eval`)
						vm.runInContext(text, context);
						// Also store a version of the parsed out function body with all `steal-remove`
						// and `pluginify-remove` blocks stripped out
						options.parsed = parseContent(text);
						//Skip this file if there was no callback (pluginify)
						options.skip = options.parsed.length === 0;
					}
					options.text = text;
					success();
				}

				if (options.text) {
					proceed(options.text);
				} else {
					var filename = ''+ openerSteal.idToUri(options.id);
					if (fs.existsSync(filename)) {
						proceed(fs.readFileSync(filename).toString());
					} else {
						failure();
					}
				}
			},
			"css": function(options, success, failure) {
				var text = getFileContents(options);
				if(text) {
					options.text = text;
					success();
				} else {
					failure();
				}
			},
			"ejs": compileTemplate,
			"mustache": compileTemplate,
			"fn": function (options, success) {
				// skip all functions
				success();
			}
		},
		root: options.root || process.cwd()
	}));

	openerSteal.one('end', function(rootSteal) {
		// Filter out empty and ignored dependencies'
		var steals = _.filter(rootSteal.dependencies, function (dep) {
			if (!dep) { return false; }
			return ignore.indexOf(dep.options.id.toString()) === -1;
		});

		// We also want to have access to the cloned Steal used by this open call
		cb(null, steals, openerSteal);
	});

	// steal(id1, id2...)
	openerSteal.apply(openerSteal, ids);
}

/**
 * Visit every dependency depth first and call the callback with it.
 *
 * @param steals The initial list of Steal dependencies
 * @param callback The callback to call
 * @returns {*}
 */
opener.visit = function visit(steals, callback, visited) {
	visited = visited || [];
	_.toArray(steals).forEach(function (stl) {
		var id = '' + stl.options.id;
		// Only visit if we haven't yet
		if (visited.indexOf(id) === -1) {
			var length = visited.push(id);
			// Depth first
			visit(stl.dependencies, callback, visited);
			visit(stl.needsDependencies, callback, visited);
			callback(stl, id, visited, length);
		}
	});
	return visited;
}

module.exports = opener;
	