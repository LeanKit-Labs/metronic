var Metrics = require( 'metrics' );
var report = new Metrics.Report();
require( './index' );
var convert = require( './converter' );

var types = {
	'time': 'Timer',
	'meter': 'Histogram',
	'bytes': 'Histogram',
	'percentage': 'Histogram'
};

function createMetric( type, name ) {
	var metric = report.getMetric( name );
	if ( !metric ) {
		metric = new Metrics[ type ]();
		report.addMetric( name, metric );
	}
	return metric;
}

function getReport( reset ) {
	var data = report.summary();
	if ( reset ) {
		report = new Metrics.Report();
	}
	return data;
}

function recordMetric( data ) {
	var value = data.value;
	if ( data.type === 'time' ) {
		value = convert( data.value, data.units, 'ms' );
	} else if( data.type === 'bytes' ) {
		value = convert( data.value, data.units, 'bytes' );
	}
	var metric = createMetric( types[ data.type ], data.key );
	metric.update( value );
}

module.exports = {
	getReport: getReport,
	onMetric: recordMetric
};
