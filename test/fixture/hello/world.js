steal(function() {
	var world = "World";

	//!steal-remove-start
	world = "Steal";
	//!steal-remove-end
//!dev-remove-start
	world = "Dev";
//!dev-remove-end

	return world;
});
