var steal = require('../steal');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var ignores = ['steal/dev/dev.js', 'stealconfig.js'];
var stealBackup = {};

// Configures steal to load js files
function configureSteal(rootPath) {
	stealBackup.config = steal.defaultConfig;
	stealBackup.root = steal.root;
	// Overwrite the steal types
	steal.config({
		types: {
			"js": function (options, success, failure) {
				var proceed = function (text) {
					// check if steal is in this file
					var stealInFile = /steal\(/.test(text);
					if (stealInFile) {
						// if so, load it
						// TODO we might just be able to get by with using require() here
						eval(text);
					}
					options.text = text;
					success();
				}

				if (options.text) {
					proceed(options.text);
				} else {
					var filename = path.join(steal.root, options.id.toString());
					// TODO we might need to do this synchronously
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
		win: global
	});

	steal.root = rootPath;
}

function resetSteal() {
	steal.config(stealBackup.config);
	steal.root = stealBackup.root;
}

/**
 * Opens one or more files by id, loads all depenencies and returns
 * a list or root Steal objects.
 *
 * @param id {String|Array} The file(s) to open
 * @param root The Steal root folder to use
 * @param cb {function(steals)} A callback that gets the list of
 */
function opener(id, root, cb) {
	// Have to wait for the original Steal to be ready before messing with it
	steal.one('done', function () {
		var ids = Array.isArray(id) ? id : [id];

		if (!cb) {
			cb = root;
			root = null;
		}
		root = root || process.cwd();

		// Because in Node we load everything synchronously we should be fine
		// reconfiguring Steal and then setting it back to its original state
		configureSteal(root);

		steal.apply(steal, ids);
		steal.one('end', function (rootSteal) {
			// Reset the steal configuration
			resetSteal();

			// Filter out empty and ignored dependencies
			cb(null, _.filter(rootSteal.dependencies, function (dep) {
				if (!dep) {
					return false;
				}
				return ignores.indexOf(dep.options.id.toString()) === -1;
			}));
		});
	});
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
