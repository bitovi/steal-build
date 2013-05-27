var _ = require('lodash');
var parse = require('./parse');
var opener = require('./open');

/**
 *
 * @param ids
 * @param options
 * @param callback
 */
function pluginify(ids, options, callback) {
	opener(ids, _.cloneDeep(options.steal) || {}, function (error, rootSteals, opener) {
		// Call pluginifySteals and extend the options with the opener Steal
		pluginify.pluginifySteals(rootSteals, _.extend({
			opener: opener
		}, options), callback);
	});
}

_.extend(pluginify, {
	defaults: {
		wrapper: '(function(undefined) {\n<%= content %>\n\n' +
			'<%= exports.join("\\n") %>\n' +
			'})();\n',
		exportsTemplate: 'window[\'<%= name %>\'] = <%= module %>;',
		moduleTemplate: '\n// ## <%= moduleName %>\nvar <%= variableName %> = ' +
			'(<%= parsed %>)(<%= dependencies.join(", ") %>);',
		viewTemplate: '\n// ## <%= moduleName %>\nvar <%= variableName %> = ' +
			'<%= text %>;',
		 simpleShimExportsTemplate: '\n// ## <%= moduleName %>\n<%= text %>\n' +
			'var <%= variableName %> = window[\'<%= exports %>\'];',
		 fnShimExportsTemplate: '\n// ## <%= moduleName %>\n<%= text %>\n' +
		 	'var <%= variableName %> = (<%= fn %>)(<% if(dependencies.length) { %> <%= dependencies.join(", ") %> <% } %>);\n'
	},

	/**
	 * Returns if the given id should be ignored
	 *
	 * @param {String} id The id to check
	 * @param {Array} ignores A list of regular expressions or strings to check.
	 * Strings ending with `/` will be treated as folders.
	 * @returns {Boolean} Whether to ignore the id or not
	 */
	ignores: function(id, ignores) {
		return _.some(ignores, function(current) {
			if(current.test) {
				return current.test(id);
			}
			if(/\/$/.test(current)) {
				return id.indexOf(current) === 0;
			}
			return current === id;
		});
	},

	/**
	 * Pluginify a list of steal dependencies
	 *
	 * @param steals
	 * @param options
	 * @param callback
	 */
	pluginifySteals: function(steals, options, callback) {
		if (!callback) {
			callback = options;
			options = {};
		}

		options = _.extend({}, pluginify.defaults, options);

		// Stores mappings from module ids to pluginified variable names
		var nameMap = {};
		var jsContents = [];
		var cssContents = [];
		var shims = options.steal ? options.steal.shim || {} : {};

		var addToNameMap = function(id, index) {
			// Create a variable name containing the visited array length
			var name = '__m' + index;
			// Set the variable name for the current id
			return nameMap[id] = name;
		}

		// Go through all dependencies
		opener.visit(steals, function (stl, id, visited, index) {
			if(stl.options.buildType === 'js') {
				var part;
				// If the steal has its content loaded (done by the opener) and we don't have a registered
				// variable name for that module
				if (!stl.options.skip && stl.options.text && !nameMap[id] && !pluginify.ignores(id, options.ignore || [])) {
					//If the file has a steal call, it was parsed by the opener to extract out it's callback
					if(stl.options.parsed) {
						var variableName = addToNameMap(id, index);
						// When we come back from the recursive call all our dependencies are already
						// parsed and have a name. Now create a list of all the variables names but
						// exclude any dependencies that do not have a name.
						var dependencies = _.filter(stl.dependencies.map(function (dep) {
							return nameMap['' + dep.options.id];
						}), function(name) { return name });

						// The last dependency is the module itself, we don't need that
						dependencies.pop();

						// Render the template for this module
						part = _.template(options.moduleTemplate, {
							moduleName: id,
							variableName: variableName,
							parsed: stl.options.parsed,
							dependencies: dependencies
						});
					} else {
						var shim = shims[id];
						//If there is a shim entry for this module
						if(shim) {
							var exports = shims[id].exports;
							var dependencies = [];
							//If the shim is an Array or it has a deps property than 
							//there are dependencies 
							if(_.isArray(shim) || shim['deps']) {
								dependencies = stl.needsDependencies.map(function (dep) {
									return nameMap['' + dep.options.id];
								});
							}
							//If there is an exports property
							if(exports) {
								var variableName = addToNameMap(id, index);
								//If exports is a function, the return value of it will be used as 
								//the value of the module
								if(_.isFunction(exports)) {
									var part = _.template(options.fnShimExportsTemplate, {
										moduleName: id,
										variableName: variableName,
										text: stl.options.text,
										dependencies: dependencies,
										fn: exports.toString()
									});
								//If exports is a string, it will be the name of the global variable
								// to expose after the module's code has run
								} else if(_.isString(exports)) {
									part = _.template(options.simpleShimExportsTemplate, {
										moduleName: id,
										variableName: variableName,
										text: stl.options.text,
										exports: exports
									});
								}
							} else {
								//We shouldn't really be here, but this means the module has no steal call
								//and it has a shim entry that does not do anything so we just use the contents
								//as is
								part = stl.options.text;
							}
						} else {
							//this is a plain JS file (no shim, no steal) so we just use it as is
							part = stl.options.text;
						}
					}
					jsContents.push(part);
				}
			} else if(stl.options.buildType === 'css') {
				if (stl.options.text) {
					//TODO: Normalization of paths
					cssContents.push(stl.options.text);
				}
			} else if(stl.options.buildType === 'ejs' || stl.options.buildType === 'mustache') {
				if (stl.options.text) {
					var variableName = addToNameMap(id, index);
					// Render the template for the compiled view
					var part = _.template(options.viewTemplate, {
						moduleName: id,
						variableName: variableName,
						text: stl.options.text
					});
					jsContents.push(part);
				}
			}
		});

		if(!jsContents.length) {
			throw new Error('No files to pluginify');
		}

		var exportModules = [];
		if (options.exports) {
			// Get all the modules to export
			exportModules = _.map(options.exports, function (name, moduleId) {
				// options.opener should be the Steal instance used to retrieve the pluginified
				// steals so that we can map ids with the correct configuration. Use `steal.load` as a fallback
				return _.template(options.exportsTemplate, {
					name: name,
					module: nameMap['' + options.opener.id(moduleId)]
				});
			});
		}

		callback(null, _.template(options.wrapper, {
			content: jsContents.join('\n'),
			exports: exportModules
		}), cssContents.join('\n'));
	}
});

module.exports = pluginify;
