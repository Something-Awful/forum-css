const { resolve, extname, basename } = require('path');
const fs = require('fs');
const CleanCSS = require('clean-css');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const cssOptions = { };
const gzOptions = {
	level: 9
};

/**
 * Gets a list of all our CSS files. Prepares dist directory and any subdirectories we need.
 * @param {string} dir directory to look for CSS in
 */
async function getFiles(dir) {
	let distDir = 'dist';
	if (!fs.existsSync(distDir)) {
		fs.mkdirSync(distDir);
	}

	const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
		const res = resolve(dir, dirent.name);
		if (dirent.isDirectory()) {
			// Ensure we have valid dist/ subdirectories for later in the build
			let distSubDir = res.replace('src', 'dist');
			if (!fs.existsSync(distSubDir)) {
				fs.mkdirSync(distSubDir);
			}
			return getFiles(res);
		}
		else if (extname(dirent.name) === ".css") {
			return res;
		}
	}));
	return Array.prototype.concat(...files);
}

let files = getFiles('src');
files.then((cssinput) => {
	for (let cssFile of cssinput) {
		let dist = cssFile.replace('src', 'dist');
		let min = dist.replace(/\.css$/, '') + '.min.css';
		let gz = dist + '.gz';
		let friendlyName = basename(cssFile);

		// Put a copy in dist for convenience
		fs.copyFile(cssFile, dist, (err) => {
			if (err) throw err;
			console.log('copied ' + friendlyName);
		});

		// Minify it
		let cssOutput = new CleanCSS(cssOptions).minify([cssFile]);
		fs.writeFileSync(min, cssOutput.styles);
		console.log('wrote minified ' + friendlyName);

		// Gzip it
		let gzsource = fs.createReadStream(min);
		let destination = fs.createWriteStream(gz);
		pipeline(gzsource, createGzip(gzOptions), destination, (err) => {
			if (err) {
				console.error('gzip error:', err);
				process.exitCode = 1;
			}
			else {
				console.log('gzip created for ' + friendlyName);
			}
		});
	}
});
