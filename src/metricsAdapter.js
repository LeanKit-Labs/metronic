var Metrics = require( 'metrics' );
var report = new Metrics.Report();

function createMetric( type, name ) {
	var metric = report.getMetric( name );
	if ( !metric ) {
		metric = new Metrics[ type ]();
		report.addMetric( name, metric );
	}
	return metric;
}

function getReport() {
	return report.summary();
}

function recordDuration( name, duration ) {
	var timer = createMetric( 'Timer', name );
	timer.update( duration );
}

function recordMeter( name, value ) {
	var meter = createMetric( 'Histogram', name );
	meter.update( value );
}

module.exports = {
	getReport: getReport,
	onMeter: recordMeter,
	onTime: recordDuration
};
