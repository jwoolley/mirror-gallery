const fs = require ('fs');

function fileExists(path) {
	try {
		fs.statSync(path);
		return true;
	} catch (e) { 
		if (e.code === 'ENOENT') {
			return false;
		}
		throw e;
	}
}

module.exports = {
	fileExists,	
};