exports.load = require('./steal');
exports.build = {
	amdify: require('./build/amdify'),
	stealify: require('./build/stealify'),
	open: require('./build/open'),
	parse: require('./build/parse'),
	pluginify: require('./build/pluginify'),
	builder: require('./build/builder')
}