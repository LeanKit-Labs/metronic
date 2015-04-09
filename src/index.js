var Monologue = require( 'monologue.js' );
var _ = require( 'lodash' );
var metrics = require( './metricsAdapter' );
var systemMetrics = require( './system' );
var os = require( 'os' );
var hostName, processTitle;

var conversion = {
	ns: 1,
	us: 1e3,
	ms: 1e6,
	s: 1e9
};

var defaults = {
	delimiter: '.',
	units: 'ms',
	prefix: undefined
};

var lookup = [ 1, 1000, 1000000, 1000000000 ];
var units = [ 'ns', 'us', 'ms', 's' ];

function cancelInterval( api ) {
	api.intervalCancelled = true;
}

function combineKey( config, parts ) {
	return _.filter( parts ).join( config.delimiter );
}

function convert( value, sourceUnits, destinationUnits ) {
	var sourceIndex = _.indexOf( units, sourceUnits );
	var destinationIndex = _.indexOf( units, destinationUnits );
	var index = Math.abs( sourceIndex - destinationIndex );
	var factor = lookup[ index ];
	return sourceIndex > destinationIndex ? value * factor : value / factor;
}

function convertRaw( config, time ) {
	var ns = ( time[ 0 ] * 1e9 ) + time[ 1 ];
	return ns / conversion[ config.units ];
}

function createApi( config ) {
	processTitle = process.title;
	hostName = os.hostname();
	var api = {};
	_.assign( api, Monologue.prototype );
	api.prefix = combineKey( config, [ config.prefix, hostName, processTitle ] );
	api.cancelInterval = cancelInterval.bind( null, api );
	api.convert = convert;
	api.getReport = metrics.getReport;
	api.instrument = instrument.bind( null, api, config );
	api.intervalCancelled = false;
	api.meter = createMeter.bind( null, api, config );
	api.recordUtilization = recordUtilization.bind( null, api, config );
	api.removeAdapters = removeAdapters.bind( null, api );
	api.timer = createTimer.bind( null, api, config );
	api.useLocalAdapter = useLocalAdapter.bind( null, api );
	api.use = useAdapter.bind( null, api );
	return api;
}

function createMeter( api, config, key, parentNamespace ) {
	var combinedKey = getKey( config, key, parentNamespace );
	return {
		record: recordMeter.bind( null, api, combinedKey )
	};
}

function createTimer( api, config, key, parentNamespace ) {
	var info = {
		key: getKey( config, key, parentNamespace ),
		start: process.hrtime()
	};
	return {
		reset: function() {
			info.start = process.hrtime();
		},
		record: recordTime.bind( null, api, config, info )
	};
}

function getArguments( fn ) {
	var fnString = fn.toString();
	if ( /[(][^)]*[)]/.test( fnString ) ) {
		return trim( /[(]([^)]*)[)]/.exec( fnString )[ 1 ].split( ',' ) );
	} else {
		return [];
	}
}

function getKey( config, key, parentNamespace ) {
	var parts = _.isString( key ) ? [ key ] : key.slice();
	if ( parentNamespace ) {
		if ( _.isString( parentNamespace ) ) {
			parts.unshift( parentNamespace );
		} else {
			parts = parentNamespace.concat( parts );
		}
	} else {
		parts.unshift( processTitle );
		parts.unshift( hostName );
		parts.unshift( config.prefix );
	}
	return combineKey( config, parts );
}

function instrument( api, config, options ) {
	var key = _.isString( options.key ) ? [ options.key ] : options.key.slice();
	var timerKey = key.concat( 'duration' );
	var attemptKey = getKey( config, key.concat( 'attempted' ), options.namespace );
	var successKey = getKey( config, key.concat( 'succeeded' ), options.namespace );
	var failKey = getKey( config, key.concat( 'failed' ), options.namespace );
	var countAttempts = options.counters === undefined || _.contains( options.counters, 'attempted' );
	var countSuccesses = options.counters === undefined || _.contains( options.counters, 'succeeded' );
	var countFailures = options.counters === undefined || _.contains( options.counters, 'failed' );
	var args = getArguments( options.call );

	function recordDuration() {
		if ( options.duration !== false ) {
			recordTime( api, config, timerInfo );
		}
	}

	function onSuccess( result ) {
		if ( countSuccesses ) {
			recordMeter( api, successKey, 1 );
		}
		recordDuration();
		if ( options.success ) {
			return options.success( result );
		} else {
			return result;
		}
	}

	function onFailure( err ) {
		if ( countFailures ) {
			recordMeter( api, failKey, 1 );
		}
		recordDuration();

		if ( options.failure ) {
			return options.failure( err );
		} else {
			return err;
		}
	}

	if ( countAttempts ) {
		recordMeter( api, attemptKey, 1 );
	}

	var timerInfo = {
		key: getKey( config, timerKey, options.namespace ),
		start: process.hrtime()
	};

	if ( args[ 0 ] ) {
		return when.promise( function( resolve, reject ) {
			options.call( function( err, result ) {
				if ( err ) {
					reject( onFailure( err ) || err );
				} else {
					resolve( onSuccess( result ) );
				}
			} );
		} );
	} else {
		return options.call().then( onSuccess, onFailure );
	}
}

function recordMeter( api, key, value ) {
	api.emit( 'meter', { key: key, value: value || 1, timestamp: Date.now() } );
	return value;
}

function recordTime( api, config, info ) {
	var diff = process.hrtime( info.start );
	var duration = convertRaw( config, diff );
	api.emit( 'time', { key: info.key, duration: duration, units: config.units, timestamp: Date.now() } );
	return duration;
}

function recordUtilization( api, config, interval ) {
	var utilization = systemMetrics();
	var system = utilization.systemMemory;
	var proc = utilization.processMemory;

	recordMeter(
		api,
		combineKey( config, [ hostName, 'memory-total' ] ),
		system.availableMB
	);
	recordMeter(
		api,
		combineKey( config, [ hostName, 'memory-allocated' ] ),
		system.inUseMB
	);
	recordMeter(
		api,
		combineKey( config, [ hostName, 'memory-available' ] ),
		system.freeMB
	);
	recordMeter(
		api,
		getKey( config, 'physical-allocated' ),
		proc.rssMB
	);
	recordMeter(
		api,
		getKey( config, 'heap-allocated' ),
		proc.heapTotalMB
	);
	recordMeter(
		api,
		getKey( config, 'heap-used' ),
		proc.heapUsedMB
	);
	_.each( utilization.loadAverage, function( load, core ) {
		recordMeter(
			api,
			getKey( config, 'core-' + core + '-load' ),
			load
		);
	} );

	if ( interval ) {
		if ( api.intervalCancelled ) {
			api.intervalCancelled = false;
		} else {
			setTimeout( function() {
				recordUtilization( api, config, interval );
			}, interval );
		}
	}

	return utilization;
}

function removeAdapters( api ) {
	_.each( api.adpaterSubscriptions, function( subscription ) {
		subscription.unsubscribe();
	} );
}

function trimString( str ) {
	return str.trim();
}
function trim( list ) {
	return ( list && list.length ) ? _.filter( list.map( trimString ) ) : [];
}

function useAdapter( api, adapter ) {
	var subscriptions = [
		api.on( 'time', function( data ) {
			adapter.onTime( data.key, data.duration, data.units, data.timestamp );
		} ),
		api.on( 'meter', function( data ) {
			adapter.onMeter( data.key, data.value, data.timestamp );
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

function metronic( cfg ) {
	var config = _.defaults( cfg || {}, defaults );
	return createApi( config );
}

metronic.convert = convert;

module.exports = metronic;
