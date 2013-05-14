var _ = require('underscore');
var async = require('async');
var path = require('path');
var fs = require('fs');
var clone = require('clone');

var opener = require('./open');
var pluginify = require('./pluginify');
var steal = require('../steal');
var utilities = require('./utilities');

/**
 * Load all Steal dependencies for each configuration and add them to the
 * download builder information object.
 *
 * @param {Object} info The download builder information object
 * @param {String} root The root path to use
 * @param {Function} callback Callback to call when done loading
 */
function loadSteals(info, root, callback) {
	var configurations = info.configurations;
	var modules = _.keys(info.modules);
	var stealers = _.map(configurations, function(configuration, configName) {
		return function(callback) {
			opener(modules, _.extend({
				root: root
			}, configuration.steal), function(error, configSteals) {
				callback(error, configName, clone(_.uniq(configSteals, function(stl) {
					return stl.options && stl.options.id.toString();
				})));
			});
		}
	});

	async.series(stealers, function(error, args) {
		if(error) {
			return callback(error);
		}

		var steals = {};
		_.each(args, function(rets) {
			var name = rets[0];
			var configSteals = rets[1];
			steals[name] = configSteals;
		});
		callback(null, steals);
	});
}

/**
 * Build with a given configuration.
 *
 * @param {{}} options The options to use
 * @option {Array} ids An array of ids to build (`isDefault` modules will be used if empty)
 * @option {Boolean} minify Whether to minify the output using UglifyJS 2
 * @option {String} url The source URL to put in the banner
 * @option {String} configuration The configuration name to use (uses default configuration if not available)
 * @param {Object} info The builder configuration information as returned by `loadInfo`
 * @param {Function} callback The callback to call with the source output
 * @returns {*}
 */
function builder(options, info, callback) {
	// Grab our ids from the `modules` query parameter if possible
	var ids = builder.getIds(options.ids, info.modules);
	var configuration = options.configuration ?
		info.configurations[options.configuration] :
		_.find(info.configurations, function(item) {
			return item.isDefault;
		});

	if(!configuration) {
		return callback(new Error('No configuration for: '+ options.configuration));
	}

	// From the list of ids get all our Steals
	var buildSteals = builder.getSteals(configuration.steals, ids);
	var pluginifyOptions = _.extend({}, info.pluginify, configuration.pluginify);

	pluginify.pluginifySteals(buildSteals, pluginifyOptions, function (error, str) {
		if(error) {
			return callback(error);
		}

		var banner = info.banner ? utilities.banner(info.banner, {
			url: options.url || '',
			info: info
		}) : '';
		var content = options.minify ? utilities.uglify(str) : utilities.prettify(str, info.beautify);

		callback(null, banner + content);
	});
}

/**
 * From a list of Steal objects return every object matching the
 * id from the given list.
 *
 * @param {Array} steals The list of Steals
 * @param {Array<String>} ids The list of ids
 * @returns {Array} The list of Steal objects matching the id
 */
builder.getSteals = function (steals, ids) {
	var result = [];
	ids.forEach(function (name) {
		var id = steal.id(name).toString();
		var stl = _.find(steals, function (current) {
			return current.options.id.toString() === id;
		});
		if (!stl) {
			throw new Error('Module ' + name + ' is not available.');
		}
		result.push(stl);
	});
	return result;
}

/**
 * Converts a single module name or a list of modules.
 * Returns a list of the `builder.json` default module names
 * if no modules have been given.
 *
 * @param {Object|String|null} modules The single module
 * name, a list of modules names or nothing.
 * @param {Object} builderModules The module list from the
 * `builder.json` definition
 * @returns {Array} The list of module ids
 */
builder.getIds = function (modules, builderModules) {
	if (!modules || !modules.length) {
		var ids = [];
		_.each(builderModules, function (value, name) {
			if (value.isDefault) {
				ids.push(name);
			}
		});
		return ids;
	}
	return _.isArray(modules) ? modules : [modules];
}

/**
 * Get all dependencies for a given Steal id.
 * Only include visible modules.
 *
 * @param {String} id The Steal id string to check for.
 * @param {Array} steals A list of Steal dependencies to check in
 * @param {Array} [visibleModules] A list of visible module ids.
 * If given only these modules will be included in the dependencies.
 * @returns {Array} A list of ids.
 */
builder.getDependencies = function (id, steals, visibleModules) {
	id = steal.id(id).toString();

	var result = [];
	var stl = _.find(steals, function (curStl) {
		return id === curStl.options.id.toString();
	});

	if (stl) {
		var visibles = visibleModules ? _.map(visibleModules, function (mod) {
			return steal.id(mod).toString();
		}) : null;
		opener.visit([stl], function (stl) {
			var currentId = stl.options.id.toString();
			if (steal.id(id).toString() !== currentId &&
				(!visibles || visibles.indexOf(currentId) !== -1)) {
				result.push(currentId);
			}
		});
	}

	return result;
}

/**
 * Load the download builder information which will contain:
 *
 * - `package.json`
 * - `builder.json`
 * - All Steal dependencies (and file contents) for every available download builder configuration
 *
 * This will be used throughout most of the download builder.
 * The callback data will be `undefined` if any of the JSON configuration files
 * isn't available.
 *
 * @param {String} filePath The path to check for.
 * @param {Function} callback Callback with the information object
 * @returns {*}
 */
builder.loadInfo = function (filePath, callback) {
	var builder = path.join(filePath, '/builder.json');
	var pkg = path.join(filePath, '/package.json');

	if (!(fs.existsSync(builder) && fs.existsSync(pkg))) {
		return callback(null, null);
	}

	var info = _.extend({
		path: filePath,
		configurations: {}
	}, require(builder), require(pkg));

	// Load Steals with parent folder of the current path as the root
	loadSteals(info, path.dirname(filePath), function(error, steals) {
		if(error) {
			return callback(error);
		}

		_.each(steals, function(stls, name) {
			info.configurations[name].steals = stls;
		});

		callback(null, info);
	});
}

module.exports = builder;