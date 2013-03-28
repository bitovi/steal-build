var steal = require('./steal');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');

_.extend(steal.URI.prototype, {
	mkdir: function () {
		fs.mkdirSync('' + this);
		return this;
	},
	mkdirs: function () {
		// TODO
		console.warn('mkdirs not implemented');
		return this;
	},
	exists: function () {
		return fs.existsSync('' + this);
	},
	copyTo: function (dest, ignore) {
		// TODO
		console.warn('copyTo not implemented');
		return this;
	},
	moveTo: function (dest) {
		// TODO
		console.warn('move_to not implemented');
	},
	setExecutable: function () {
		fs.chmodSync('' + this, '755');
		return this;
	},
	save: function (src, encoding) {
		encoding = encoding || 'utf8';
		fs.writeFileSync('' + this, src);
		return this;
	},
	download_from: function (address) {
		// TODO
		console.warn('download_from not implemented');
	},
	basename: function () {
		return ('' + this).match(/\/?([^\/]*)\/?$/)[1];
	},
	remove: function () {
		fs.unlinkSync('' + this);
		return this;
	},
	isFile: function () {
		return fs.statSync('' + this).isFile();
	},
	removeDir: function () {
		var rmDir = function (path) {
			try {
				var files = fs.readdirSync(path);
			}
			catch (e) {
				return;
			}
			if (files.length > 0) {
				for (var i = 0; i < files.length; i++) {
					var filePath = dirPath + '/' + files[i];
					if (fs.statSync(filePath).isFile()) {
						fs.unlinkSync(filePath);
					} else {
						rmDir(filePath);
					}
				}
			}
			fs.rmdirSync(dirPath);
		}
		rmDir('' + this);
		return this;
	},
	zipDir: function (name, replacePath) {
		// TODO
		console.warn('zipDir not implemented');
	},
	contents: function (func, current) {
		var dir = '' + this,
			listOfFiles = fs.readdirSync(dir),
			uris = listOfFiles.map(function(filename) {
				return new steal.URI(path.join(dir, filename));
			});

		if ( listOfFiles == null || !listOfFiles.length ) {
			return;
		}
		for ( var i = 0; i < listOfFiles.length; i++ ) {
			func('' + listOfFiles[i], uris[i].isFile() ? "file" : "directory", current)
		}
		return listOfFiles;
	},
	/**
	 * Returns the path to the root jmvc folder
	 */
	pathToRoot: function (isFile) {
		var root = steal.root,
			rootFolders = root.split(/\/|\\/),
			targetDir = rootFolders[rootFolders.length - 1]
		i = 0,
			adjustedPath = (targetDir ? ('' + this).replace(new RegExp(".*" + targetDir + "\/?"), "") :
				'' + this),
			myFolders = adjustedPath.split(/\/|\\/);

		//for each .. in loc folders, replace with steal folder
		if (myFolders[i] == "..") {
			while (myFolders[i] == "..") {
				myFolders[i] = rootFolders.pop();
				i++;
			}
		} else {
			for (i = 0; i < myFolders.length - 1; i++) {
				myFolders[i] = ".."
			}
		}
		myFolders.pop();

		if (!isFile) {
			myFolders.push('..')
		}

		return myFolders.join("/")
	}
});

module.exports = steal;
