var fs = require('fs');
var path = require('path');

require('../steal.js');
steal.defaultConfig = {
	root: process.cwd(),
	types: {
		"js": function (options, success) {
			var id = options.id.toString();
			if (options.text) {
				eval(options.text);
				success();
			} else {
				var filename = path.join('' + steal.config('root'), id);
				fs.exists(filename, function(exists) {
					if(exists) {
						require(filename);
					}
					success();
				});
			}
		},
		"css": function (options, success) {
			var filename = path.join('' + steal.config('root'), options.id.toString());
			if (fs.existsSync(filename)) {
				options.text = fs.readFileSync(filename).toString();
				success();
			}
		},
		// TODO we can probably get that from the default configuration
		"fn": function (options, success) {
			var ret;
			if (!options.skipCallbacks) {
				ret = options.fn();
			}
			success(ret);
		}
	},
	win: global
};

steal.config(steal.defaultConfig);
module.exports = steal;
