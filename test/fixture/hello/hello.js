// A comment
var test;

steal('./world.js', './other.js', './hello.css', function(test, other) {
	var content = "Hello ";

	return content + test + other;
  });
