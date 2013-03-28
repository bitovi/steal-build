var _ = require('underscore');
var parse = require('./parse');
var opener = require('./open')
/**
 *
 * @param ids
 * @param options
 * @param callback
 */
function pluginify(ids, options, callback) {
	opener(ids, options.root, function (error, rootSteals) {
		pluginify.pluginifySteals(rootSteals, options, callback);
	});
}

pluginify.defaults = {
	wrapper: '(function(undefined) {\n<%= content %>\n\n' +
		'<%= exports.join("\\n") %>\n' +
		'})();\n',
	exportsTemplate: 'window[\'<%= name %>\'] = <%= module %>;',
	moduleTemplate: '\n// ## <%= moduleName %>\nvar <%= variableName %> = ' +
		'(<%= parsed %>)(<%= dependencies.join(", ") %>);'
};

/**
 * Pluginify a list of steal dependencies
 *
 * @param steals
 * @param options
 * @param callback
 */
function pluginifySteals(steals, options, callback) {
	if (!callback) {
		callback = options;
		options = {};
	}

	options = _.extend({}, pluginify.defaults, options);

	// Stores mappings from module ids to pluginified variable names
	var nameMap = _.extend({}, options.shim);
	var contents = [];

	// Go through all dependencies
	opener.visit(steals, function (stl, id, visited, index) {
		// If the steal has its content loaded (done by the opener)
		if (stl.options.text) {
			// Create a variable name containing the visited array length
			var variableName = '__m' + index;
			// Set the variable name for the current id
			nameMap[id] = variableName;
			if (!stl.options.parsed) {
				// Extract only the function() {} part from a steal call
				// and add it to our current steal object
				stl.options.parsed = parse(stl.options.text);
			}

			// When we come back from the recursive call all our dependencies are already
			// parsed and have a name. Now create a list of all the variables names.
			var dependencies = stl.dependencies.map(function (dep) {
				return nameMap['' + dep.options.id];
			});

			// The last dependency is the module itself, we don't need that
			dependencies.pop();

			// Render the template for this module
			var part = _.template(options.moduleTemplate, {
				moduleName: id,
				variableName: variableName,
				parsed: stl.options.parsed,
				dependencies: dependencies
			});

			contents.push(part);
		}
	});

	if(!contents.length) {
		throw new Error('No files to pluginify');
	}

	var exportModules = [];
	if (options.exports) {
		// Get all the modules to export
		exportModules = _.map(options.exports, function (name, moduleId) {
			return _.template(options.exportsTemplate, {
				name: name,
				module: nameMap['' + steal.id(moduleId)]
			});
		});
	}

	callback(null, _.template(options.wrapper, {
		content: contents.join('\n'),
		exports: exportModules
	}));
}

pluginify.pluginifySteals = pluginifySteals;
module.exports = pluginify;
