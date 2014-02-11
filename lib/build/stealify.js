var _ = require('lodash');
var opener = require('./open');

/**
 *
 * @param ids
 * @param options
 * @param callback
 */
function stealify(ids, options, callback) {
  opener(ids, options.steal || {}, function (error, rootSteals, opener) {
    stealify.stealifySteals(rootSteals, _.extend({
      opener: opener
    }, options), callback);
  });
}

_.extend(stealify, {
  stealifySteals: function (steals, options, callback) {
    var results = {};

    if (!callback) {
      callback = options;
      options = {};
    }

    options = _.extend({}, options);

    // Go through all dependencies
    opener.visit(steals, function (stl, id, visited, index) {
      if(stl.options.text) {
        results[stl.options.id] = stl.options.text;
      }
    });

    callback(null, results);
  }
});

module.exports = stealify;
