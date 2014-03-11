var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var opener = require('./open');
var pluginify = require('./pluginify');
var steal = require('../steal');
var beautify = require('js-beautify');

var utilities = {
	/**
	 * Creates a banner from a template.
	 *
	 * @param {String} banner The banner template
	 * @param {Object} options The options to pass to the banner template
	 */
	banner: function (banner, options) {
		return banner ? _.template(banner, options) : '';
	},

	/**
	 * Prettify a source code string using the optional
	 * options. Removes all multiline comments and
	 * multi-newlines and semicolons.
	 * Beautifies the code with the `beautify` settings.
	 *
	 * @param {String} str The source code to beautify
	 * @param {Object} options The options containing the
	 * optional `banner` template and `beautify` settings.
	 * @returns {String} The prettified source code.
	 */
	prettify: function (str, options) {
		options = options || {};

		// Strip out multiline comments and clean up some other things
		// And run jsBeautifier
		var content = beautify(str.replace(/\/\*([\s\S]*?)\*\//gim, '')
			.replace(/\/\/(\s*)\n/gim, '')
			.replace(/;[\s]*;/gim, '')
			.replace(/(\/\/.*)\n[\s]*;/gi, '')
			.replace(/(\n){3,}/gim, '\n\n'), options);

		return content;
	},

	/**
	 * From a list of Steal objects return every object matching the
	 * id from the given list.
	 *
	 * @param {Array} steals The list of Steals
	 * @param {Array<String>} ids The list of ids
	 * @returns {Array} The list of Steal objects matching the id
	 */
	getSteals: function (steals, ids) {
		var result = [];
		ids.forEach(function (name) {
			var id = steals.opener.id(name).toString();
			var stl = _.find(steals, function (current) {
				return current.options.id.toString() === id;
			});
			if (!stl) {
				throw new Error('Module ' + name + ' is not available.');
			}
			result.push(stl);
		});
		return result;
	},

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
	getIds: function (modules, builderModules) {
		if (!modules || !modules.length) {
			var ids = [];
			_.each(builderModules, function (value, name) {
				if (value.type === "core") {
					ids.push(name);
				}
			});
			return ids;
		}
		return _.isArray(modules) ? modules : [modules];
	},

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
	getPluginIds: function (modules, builderModules) {
		if (!modules || !modules.length) {
			var ids = [];
			_.each(builderModules, function (value, name) {
				if (value.type === "plugin") {
					ids.push(name);
				}
			});
			return ids;
		}
		return _.isArray(modules) ? modules : [modules];
	},

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
	getDependencies: function (id, steals, visibleModules) {
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
	},

	/**
	 * Load all Steal dependencies for each configuration and add them to the
	 * download builder information object.
	 *
	 * @param {Object} info The download builder information object
	 * @param {String} root The root path to use
	 * @param {Function} callback Callback to call when done loading
	 */
	loadSteals: function (info, config, callback) {
		var configurations = info.configurations;
		var modules = _.keys(info.modules);
		var stealers = _.map(configurations, function (configuration, configName) {
			return function (callback) {
				var stealConfig = utilities.deepExtend(configuration.steal || {}, config);
				opener(modules, stealConfig, function (error, configSteals, opener) {
					callback(error, configName, _.uniq(configSteals, function (stl) {
						return stl.options && stl.options.id.toString();
					}), opener);
				});
			}
		});

		async.series(stealers, function (error, args) {
			if (error) {
				return callback(error);
			}

			var steals = {};
			// Callback from above: [ error, configName, steals, opener ]
			_.each(args, function (rets) {
				var name = rets[0];
				var configSteals = rets[1];
				// We need to store the cloned opener Steal so that we can
				// use it for getting ids with the correct mappings
				configSteals.opener = rets[2];
				steals[name] = configSteals;
			});
			callback(null, steals);
		});
	},

	/**
	 * A small deep extend helper.
	 *
	 * @param {Object} destination The object to recursively extend into
	 * @param {Object} source The object to extend from
	 * @returns {Object} The destination object
	 */
	deepExtend: function (destination, source) {
		for (var property in source) {
			if (source[property] && source[property].constructor &&
				source[property].constructor === Object) {
				destination[property] = destination[property] || {};
				utilities.deepExtend(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
		return destination;
	},


	/**
	 * Gets params for plugin function wrappers based on configuration dependencies in builder.json
	 * @param configuration
	 * @returns {String} params to add to function wrapper
	 */
	getConfigParams: function (configuration) {
		var configMap = {
			jquery: "jQuery"
		};

		return configMap[configuration];
	},

	/**
	 * Build with a given configuration.
	 *
	 * @param {{}} options The options to use
	 * @option {Array} ids An array of ids to build (`isDefault` modules will be used if empty)
	 * @option {String} url The source URL to put in the banner
	 * @option {String} configuration The configuration name to use (uses default configuration if not available)
	 * @param {Object} info The builder configuration information as returned by `loadInfo`
	 * @param {Function} callback The callback to call with the source output
	 * @returns {*}
	 */
	build: function (options, info, callback) {
		// Grab our ids from the `modules`
		var stealOpener = opener;
		var ids, configuration, buildSteals, plugin, pluginConfigurations, pluginifyOptions;

		configuration = options.configuration ?
			info.configurations[options.configuration] :
			_.find(info.configurations, function (item) {
				return item.isDefault;
			});

		ids = utilities.getIds(options.ids, info.modules);

		if (!configuration) {
			return callback(new Error('No configuration for: ' + options.configuration));
		}

		// From the list of ids get all our Steals
		buildSteals = utilities.getSteals(configuration.steals, ids);
		pluginifyOptions = _.extend({
			opener: configuration.steals.opener,
			dev: options.dev
		}, configuration.pluginify, info.pluginify, options.pluginify);

		pluginify.pluginifySteals(buildSteals, pluginifyOptions, function (error, str, steals) {
			if (error) {
				return callback(error);
			}

			var banner = info.banner ? utilities.banner(info.banner, {
				url: options.url || '',
				info: info,
				pkg: info,
				ids: ids
			}) : '';
			var content = utilities.prettify(str, info.beautify);

			callback(null, content, banner, steals);
		});
	}
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
 * @param {String|Object} options The resource path or a more detailed configuration.
 * @param {Function} callback Callback with the information object
 * @returns {*}
 */
var builder = function (options, callback) {
	var settings = typeof options === 'string' ? { path: options } : options;
	var filePath = settings.path;
	var builder = path.join(filePath, '/builder.json');
	var pkg = path.join(filePath, '/package.json');

	if (!(fs.existsSync(builder) && fs.existsSync(pkg))) {
		return callback(null, null);
	}

	var stealConfig = _.extend({
		root: path.dirname(filePath)
	}, options.steal);

	var info = _.extend({
		path: filePath,
		configurations: {},
		stealConfig: stealConfig
	}, require(builder), require(pkg));


	// Load Steals with parent folder of the current path as the root
	utilities.loadSteals(info, stealConfig, function (error, steals) {
		if (error) {
			return callback(error);
		} else {

			_.each(steals, function (stls, name) {
				info.configurations[name].steals = stls;
			});

			callback(null, info, function (options, cb) {
				utilities.build(options, info, cb);
			});
		}
	});
};

_.extend(builder, utilities);

module.exports = builder;
