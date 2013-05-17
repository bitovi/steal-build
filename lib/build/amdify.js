var _ = require('underscore');
var parse = require('./parse');
var opener = require('./open');

function getName(stl, mappings) {
	var src = stl.id.toString();
	var parts = src.replace('.' + stl.ext, '').split('/');

	if(parts[parts.length - 1] == parts[parts.length - 2]) {
		parts.pop();
		src = parts.join('/');
	}

	var mapping;
	for (var key in mappings) {
		if (mappings.hasOwnProperty(key)) {
			mapping = mappings[key];
			// Match for mappings that end with `/`
			if (key.charAt(key.length - 1) === '/' && value.indexOf(key) === 0) {
				return value.replace(key, mapping)
			}
			// Direct match
			if (value === key) {
				return mapping;
			}
		}
	}
	return value;
}

/**
 *
 * @param ids
 * @param options
 * @param callback
 */
function amdify(ids, options, callback) {
	opener(ids, options.steal || {}, function (error, rootSteals) {
		amdify.amdifySteals(rootSteals, options, callback);
	});
}

amdify.defaults = {
	wrapper: 'define(["<%= dependencies.join(\', "\' %>"], <%= parsed %>);'
}

function amdifySteals(steals, options, callback) {
	var results = {};

	if (!callback) {
		callback = options;
		options = {};
	}

	options = _.extend({}, amdify.defaults, options);

	// Go through all dependencies
	opener.visit(steals, function (stl, id, visited, index) {
		var dependencies = stl.dependencies.map(function(dep) {
			return getName(dep, options.map);
		});

		if (!stl.options.parsed) {
			// Extract only the function() {} part from a steal call
			// and add it to our current steal object
			stl.options.parsed = parse(stl.options.text);
		}

		results[mapDependency(stl)] = _.template(options.wrapper, {
			parsed: stl.options.parsed,
			dependencies: dependencies
		});
	});

	callback(null, results);
}

amdify.amdifySteals = amdifySteals;
module.exports = amdify;
