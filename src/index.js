var Monologue = require( 'monologue.js' );
var _ = require( 'lodash' );
var metrics = require( './metricsAdapter' );
var systemMetrics = require( './system' );

var api = {};

var conversion = {
	ns: 1,
	us: 1e3,
	ms: 1e6,
	s: 1e9
};

var defaults = {
	delimiter: '.',
	units: 'ms'
};

_.assign( api, Monologue.prototype );

function cancelInterval( api ) {
	api.intervalCancelled = true;
}

function convert( config, time ) {
	var ns = ( time[ 0 ] * 1e9 ) + time[ 1 ];
	return ns / conversion[ config.units ];
}

function createTimer( config, key ) {
	var info = {
		key: getKey( config, key ),
		start: process.hrtime()
	};
	return {
		reset: function() {
			info.start = process.hrtime();
		},
		record: recordTime.bind( null, config, info )
	};
}

function createMeter( config, key ) {
	return {
		record: recordMeter.bind( null, getKey( config, key ) )
	};
}

function getKey( config, key ) {
	return _.isArray( key ) ?
		key.join( config.delimiter ) :
		key;
}

function recordTime( config, info ) {
	var diff = process.hrtime( info.start );
	var duration = convert( config, diff );
	api.emit( 'time', { key: info.key, duration: duration, units: config.units } );
	return duration;
}

function recordMeter( key, value ) {
	api.emit( 'meter', { key: key, value: value || 1 } );
	return value;
}

function recordUtilization( config, api, interval ) {
	var utilization = systemMetrics();
	var title = process.title;
	var system = utilization.systemMemory;
	var proc = utilization.processMemory;

	recordMeter(
		getKey( config, [ 'metronic', title, 'system', 'memory', 'total' ] ),
		system.availableMB
	);
	recordMeter(
		getKey( config, [ 'metronic', title, 'system', 'memory', 'used' ] ),
		system.inUseMB
	);
	recordMeter(
		getKey( config, [ 'metronic', title, 'system', 'memory', 'free' ] ),
		system.freeMB
	);
	recordMeter(
		getKey( config, [ 'metronic', title, 'process', 'memory', 'physical-allocated' ] ),
		proc.rssMB
	);
	recordMeter(
		getKey( config, [ 'metronic', title, 'process', 'memory', 'heap-total' ] ),
		proc.heapTotalMB
	);
	recordMeter(
		getKey( config, [ 'metronic', title, 'process', 'memory', 'heap-used' ] ),
		proc.heapUsedMB
	);
	_.each( utilization.loadAverage, function( load, core ) {
		recordMeter(
			getKey( config, [ 'metronic', title, 'process', 'cpu', 'load', core, ] ),
			load
		);
	} );

	if ( interval ) {
		setTimeout( function() {
			if ( !api.intervalCancelled ) {
				recordUtilization( config, api, interval );
			} else {
				api.intervalCancelled = false;
			}
		}, interval );
	}

	return utilization;
}

function removeAdapters( api ) {
	_.each( api.adpaterSubscriptions, function( subscription ) {
		subscription.unsubscribe();
	} );
}

function useAdapter( api, adapter ) {
	var subscriptions = [
		api.on( 'time', function( data ) {
			adapter.onTime( data.key, data.duration, data.units );
		} ),
		api.on( 'meter', function( data ) {
			adapter.onMeter( data.key, data.value );
		} )
	];
	if ( !api.adpaterSubscriptions ) {
		api.adpaterSubscriptions = subscriptions;
	} else {
		api.adpaterSubscriptions = api.adpaterSubscriptions.concat( subscriptions );
	}
}

function useLocalAdapter( api ) {
	useAdapter( api, metrics );
}

module.exports = function( cfg ) {
	var config = _.defaults( defaults, cfg );
	api.cancelInterval = cancelInterval.bind( null, api );
	api.getReport = metrics.getReport;
	api.intervalCancelled = false;
	api.meter = createMeter.bind( null, config );
	api.recordUtilization = recordUtilization.bind( null, config, api );
	api.removeAdapters = removeAdapters.bind( null, api );
	api.timer = createTimer.bind( null, config );
	api.useLocalAdapter = useLocalAdapter.bind( null, api );
	api.use = useAdapter.bind( null, api );
	return api;
};
