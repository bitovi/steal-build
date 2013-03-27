exports.load = require('./steal');
exports.file = require('./file').URI;
exports.build = {
	open: require('./build/open'),
	parse: require('./build/parse'),
	pluginify: require('./build/pluginify')
}