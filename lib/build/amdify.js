var _ = require('lodash');
var opener = require('./open');

/**
 *
 * @param ids
 * @param options
 * @param callback
 */
function amdify(ids, options, callback) {
	opener(ids, options.steal || {}, function (error, rootSteals, opener) {
		amdify.amdifySteals(rootSteals, _.extend({
			opener: opener
		}, options), callback);
	});
}

_.extend(amdify, {
	defaults: {
		wrapper: 'define(<% if(dependencies.length) { %>["<%= dependencies.join(\'\\", \\"\') %>"], <% } %><%= parsed %>);'
	},

	/**
	 * For a given Steal object, convert the id into an AMD module name. Use mappings
	 * if given (e.g. to map every dependency starting with can/ to start with something else
	 * or map dependencies that are exact matches)
	 *
	 * @param {Object} stl The Steal object
	 * @param {Object} mappings An object containing all mappings
	 * @returns {String} The mapped name
	 */
	convertName: function(stl, mappings) {
		var src = ('' + stl.options.id).replace('.' + stl.options.ext, '');
		var parts = src.split('/');
		var mapping;

		if (parts[parts.length - 1] == parts[parts.length - 2]) {
			parts.pop();
			src = parts.join('/');
		}

		_.each(mappings, function(mapping, key) {
			// Match for mappings that end with `/`
			if (/\/$/.test(key) && src.indexOf(key) === 0) {
				src = src.replace(key, mapping)
			}
			// Direct match
			if (src === key) {
				src = mapping;
			}
		});

		return src;
	},

	/**
	 * For a given Steal object, convert the AMD module name using converters
	 * if given (e.g. to modify the AMD module name of every CSS file to have 
	 * a prefix of css! to use a CSS loader plugin)
	 *
	 * @param {Object} stl The Steal object
	 * @param {String} name The converted AMD module name
	 * @param {Object} converters An object containing all converters
	 * @returns {String} The converted name
	 */
	convertExt: function(stl, name, converters) {		
		var newName = name,
			converter = converters[stl.options.ext];

		if(converter) {
			newName = converter.call(null, name);
		}
		return newName;
	},

	amdifySteals: function (steals, options, callback) {
		var results = {};

		if (!callback) {
			callback = options;
			options = {};
		}

		options = _.extend({}, amdify.defaults, options);

		// Go through all dependencies
		opener.visit(steals, function (stl, id, visited, index) {
			if(stl.options.text) {
				var dependencies = stl.dependencies.map(function (dep) {
					return amdify.convertExt(dep, amdify.convertName(dep, options.map), options.converters);
				});

				// The last dependency is the module itself, we don't need that
				dependencies.pop();

				results[amdify.convertExt(stl, amdify.convertName(stl, options.map), options.converters)] = _.template(options.wrapper, {
					parsed: stl.options.parsed,
					dependencies: dependencies
				});
			}
		});

		callback(null, results);
	}
});

module.exports = amdify;
