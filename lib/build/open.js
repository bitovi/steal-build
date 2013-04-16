var steal = require('../steal');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ignores = ['steal/dev/dev.js', 'stealconfig.js'];
var vm = require('vm');

/**
 * Opens one or more files by id, loads all depenencies and returns
 * a list or root Steal objects.
 *
 * @param id {String|Array} The file(s) to open
 * @param root The Steal root folder to use
 * @param cb {function(steals)} A callback that gets the list of
 */
function opener(id, options, cb) {
	if (!cb) {
		cb = options;
		options = {};
	}

	var ids = Array.isArray(id) ? id : [id];
	var openerSteal = steal.clone();
	var context = vm.createContext({
		steal: openerSteal
	});

	// Because in Node we load everything synchronously we should be fine
	// reconfiguring Steal and then setting it back to its original state
	openerSteal.config(_.extend({}, options, {
		types: {
			"js": function (options, success, failure) {
				var proceed = function (text) {
					// check if steal is in this file
					var stealInFile = /steal\(/.test(text);
					if (stealInFile) {
						// if so, load it
						// TODO we might just be able to get by with using require() here
						vm.runInContext(text, context);
					}
					options.text = text;
					success();
				}

				if (options.text) {
					proceed(options.text);
				} else {
					var filename = path.join('' + openerSteal.config('root'), options.id.toString());
					if (fs.existsSync(filename)) {
						proceed(fs.readFileSync(filename).toString());
					} else {
						failure();
					}
				}
			},
			"fn": function (options, success) {
				// skip all functions
				success();
			}
		},
		root: options.root || process.cwd()
	}));

	openerSteal.one('end', function(rootSteal) {
		// Filter out empty and ignored dependencies
		cb(null, _.filter(rootSteal.dependencies, function (dep) {
			if (!dep) {
				return false;
			}

			return ignores.indexOf(dep.options.id.toString()) === -1;
		}));
	});

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
			callback(stl, id, visited, length);
		}
	});
	return visited;
}

module.exports = opener;
