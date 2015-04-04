var os = require( 'os' );
var MB = 1024 * 1024;
var GB = MB * 1024;
var total = os.totalmem();
var TOTALMB = total / MB;
var TOTALGB = total / GB;

function getSystemMetrics() {
	var free = os.freemem();
	var used = total - free;
	var processMemory = process.memoryUsage();
	return {
		systemMemory: {
			availableGB: TOTALGB,
			inUseGB: used / GB,
			freeGB: free / GB,
			availableMB: TOTALMB,
			inUseMB: used / MB,
			freeMB: free / MB
		},
		processMemory: {
			rssGB: processMemory.rss / GB,
			heapTotalGB: processMemory.heapTotal / GB,
			heapUsedGB: processMemory.heapUsed / GB,
			rssMB: processMemory.rss / MB,
			heapTotalMB: processMemory.heapTotal / MB,
			heapUsedMB: processMemory.heapUsed / MB
		},
		loadAverage: os.loadavg()
	};
}

module.exports = getSystemMetrics;
