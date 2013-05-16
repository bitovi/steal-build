var _ = require('underscore');
var beautify = require('js-beautify').js_beautify;
var UglifyJS = require('uglify-js');

/**
 * Creates a banner from a template.
 *
 * @param {String} banner The banner template
 * @param {Object} options The options to pass to the banner template
 */
exports.banner = function (banner, options) {
	return banner ? _.template(banner, options) : '';
}

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
exports.prettify = function (str, options) {
	options = options || {};

	// Strip out multiline comments and clean up some other things
	// And run jsBeautifier
	var content = beautify(str.replace(/\/\*([\s\S]*?)\*\//gim, '')
		.replace(/\/\/(\s*)\n/gim, '')
		.replace(/;[\s]*;/gim, '')
		.replace(/(\/\/.*)\n[\s]*;/gi, '')
		.replace(/(\n){3,}/gim, '\n\n'), options);

	return content;
}

/**
 * Minify JavaScript source code using UglifyJS 2.
 *
 * @param {String} code The JavaScript source code to minify.
 * @returns {String} The minified source code
 */
exports.uglify = function (code) {
	var toplevel = UglifyJS.parse(code);

	toplevel.figure_out_scope();

	var compressor = UglifyJS.Compressor({
		warnings: false
	});
	var compressed = toplevel.transform(compressor);

	compressed.figure_out_scope();
	compressed.compute_char_frequency();
	compressed.mangle_names();

	return compressed.print_to_string();
}

/**
 * A small deep extend helper.
 *
 * @param {Object} destination The object to recursively extend into
 * @param {Object} source The object to extend from
 * @returns {Object} The destination object
 */
exports.deepExtend = function(destination, source) {
	for (var property in source) {
		if (source[property] && source[property].constructor &&
			source[property].constructor === Object) {
			destination[property] = destination[property] || {};
			exports.deepExtend(destination[property], source[property]);
		} else {
			destination[property] = source[property];
		}
	}
	return destination;
}
