exports.load = require('./steal');
exports.build = {
	open: require('./build/open'),
	parse: require('./build/parse'),
	pluginify: require('./build/pluginify'),
	builder: require('./build/builder')
}