'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

module.exports = function(opt) {
  if (!opt) opt = {};
	opt.maxWeightResource = opt.maxWeightResource || 10240;

	// create a stream through which each file will pass
	return through.obj(function(file, enc, callback) {

		if (file.isNull()) {
			this.push(file);
			// do nothing if no contents
			return callback();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-img64', 'Streaming not supported'));
			return callback();
		}

		if (file.isBuffer()) {
			var $ = cheerio.load(String(file.contents));
			$('img').each(function() {
				if (this.attr('src')) {
					var ssrc = this.attr('src');
					var isdata = ssrc.indexOf("data");
					if (ssrc != "" && typeof ssrc != 'undefined' && isdata !== 0) {
						var spath = path.join(path.dirname(file.path), ssrc);
						// locate the file in the system
						var exist = fs.existsSync(spath);
						if (!exist) {
							console.log("Can't find " + spath);
							return;
						}
						var mtype = mime.lookup(spath);
						if (mtype != 'application/octet-stream') {
							var states = fs.statSync(spath);
							if (states.size > opt.maxWeightResource) {
								return;
							}
							var sfile = fs.readFileSync(spath);
							var simg64 = new Buffer(sfile).toString('base64');
							this.attr('src', 'data:' + mtype + ';base64,' + simg64);
						}
					}
				}
			});
			var output = $.html();

			file.contents = new Buffer(output);

			return callback(null, file);
		}
	});
};
