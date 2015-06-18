var Monologue = require( 'monologue.js' );
var _ = require( 'lodash' );
var when = require( 'when' );
var metrics = require( './metricsAdapter' );
var systemMetrics = require( './system' );
var os = require( 'os' );
var convert = require( './converter' );
var hostName, processTitle;

var timeConversions = {
	ns: 1,
	us: 1e3,
	ms: 1e6,
	s: 1e9
};

var defaults = {
	delimiter: '.',
	byteUnits: 'b',
	timeUnits: 'ms',
	prefix: undefined
};

function cancelInterval( api ) {
	api.intervalCancelled = true;
}

function combineKey( config, parts ) {
	return _.filter( parts ).join( config.delimiter );
}

function convertBytes( config, bytes, units ) {
	return convert( bytes, units, config.byteUnits );
}

function convertTime( config, time ) {
	var ns = ( time[ 0 ] * 1e9 ) + time[ 1 ];
	return ns / timeConversions[ config.timeUnits ];
}

function createApi( config ) {
	processTitle = process.title;
	hostName = os.hostname();
	var api = {};
	_.assign( api, Monologue.prototype );
	api.prefix = combineKey( config, [ config.prefix, hostName, processTitle ] );
	api.cancelInterval = cancelInterval.bind( null, api );
	api.convert = convert;
	api.emitMetric = emitMetric.bind( null, api );
	api.getReport = metrics.getReport;
	api.instrument = instrument.bind( null, api, config );
	api.intervalCancelled = false;
	api.meter = createMeter.bind( null, api, config );
	api.metric = createMetric.bind( null, api, config );
	api.recordUtilization = recordUtilization.bind( null, api, config );
	api.removeAdapters = removeAdapters.bind( null, api );
	api.resetReport = metrics.getReport.bind( null, true );
	api.timer = createTimer.bind( null, api, config );
	api.useLocalAdapter = useLocalAdapter.bind( null, api );
	api.use = useAdapter.bind( null, api );
	return api;
}

function createMeter( api, config, key, units, parentNamespace ) {
	return createMetric( api, config, 'meter', key, units, parentNamespace );
}

function createMetric( api, config, type, key, units, parentNamespace ) {
	var combinedKey = getKey( config, key, parentNamespace );
	units = units || 'count';
	return {
		record: recordMetric.bind( null, api, config, type, units, combinedKey )
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

function emitMetric( api, type, units, key, value, metadata ) {
	var metric = _.merge( {
		type: type,
		key: key,
		value: value,
		units: units,
		timestamp: Date.now()
	}, metadata );
	api.emit( 'metric', metric );
}

function getArguments( fn ) {
	var fnString = fn.toString();
	return trim( /[(]([^)]*)[)]/.exec( fnString )[ 1 ].split( ',' ) );
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
	var units = options.units || 'count';
	var attemptKey = getKey( config, key.concat( 'attempted' ), options.namespace );
	var successKey = getKey( config, key.concat( 'succeeded' ), options.namespace );
	var failKey = getKey( config, key.concat( 'failed' ), options.namespace );
	var countAttempts = options.counters === undefined || _.contains( options.counters, 'attempted' );
	var countSuccesses = options.counters === undefined || _.contains( options.counters, 'succeeded' );
	var countFailures = options.counters === undefined || _.contains( options.counters, 'failed' );
	var args = getArguments( options.call );

	function recordDuration() {
		if ( options.duration !== false ) {
			var durationMeta = _.clone( options.metadata );
			if( durationMeta && durationMeta.name ) {
				durationMeta.name + '_DURATION';
			}
			recordTime( api, config, timerInfo, durationMeta );
		}
	}

	function onSuccess( result ) {
		if ( countSuccesses ) {
			var successMeta = _.clone( options.metadata );
			if( successMeta && successMeta.name ) {
				successMeta.name + '_SUCCEEDED';
			}
			recordMetric( api, config, 'meter', units, successKey, 1, successMeta );
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
			var failureMeta = _.clone( options.metadata );
			if( failureMeta && failureMeta.name ) {
				failureMeta.name + '_FAILED';
			}
			recordMetric( api, config, 'meter', units, failKey, 1, failureMeta );
		}
		recordDuration();

		if ( options.failure ) {
			return options.failure( err );
		} else {
			return err;
		}
	}

	if ( countAttempts ) {
		var attemptMeta = _.clone( options.metadata );
		if( attemptMeta && attemptMeta.name ) {
			attemptMeta.name + '_ATTEMPTED';
		}
		recordMetric( api, config, 'meter', units, attemptKey, 1, attemptMeta );
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

function recordMetric( api, config, type, units, key, value, metadata ) {
	if( type === 'bytes' ) {
		value = convertBytes( config, value, units );
	}
	emitMetric( api, type, units, key, value || 1, metadata );
	return value;
}

function recordTime( api, config, info, metadata ) {
	var diff = process.hrtime( info.start );
	var duration = convertTime( config, diff );
	emitMetric( api, 'time', config.timeUnits, info.key, duration, metadata );
	return duration;
}

function recordUtilization( api, config, interval, metadata ) {
	if ( _.isObject( interval ) ) {
		metadata = interval;
		interval = undefined;
	}
	var utilization = systemMetrics();
	var system = utilization.systemMemory;
	var proc = utilization.processMemory;
	function setName( name ) {
		return _.assign( {}, metadata, { name: name } );
	}
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		combineKey( config, [ hostName, 'memory-total' ] ),
		system.availableMB,
		setName( 'SYSTEM_MEMORY_TOTAL' )
	);
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		combineKey( config, [ hostName, 'memory-allocated' ] ),
		system.inUseMB,
		setName( 'SYSTEM_MEMORY_USED' )
	);
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		combineKey( config, [ hostName, 'memory-available' ] ),
		system.freeMB,
		setName( 'SYSTEM_MEMORY_FREE' )
	);
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		getKey( config, 'physical-allocated' ),
		proc.rssMB,
		setName( 'PROCESS_MEMORY_ALLOCATED' )
	);
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		getKey( config, 'heap-allocated' ),
		proc.heapTotalMB,
		setName( 'PROCESS_MEMORY_AVAILABLE' )
	);
	recordMetric(
		api,
		config,
		'bytes',
		'MB',
		getKey( config, 'heap-used' ),
		proc.heapUsedMB,
		setName( 'PROCESS_MEMORY_USED' )
	);
	_.each( utilization.loadAverage, function( load, core ) {
		recordMetric(
			api,
			config,
			'percentage',
			'%',
			getKey( config, 'core-' + core + '-load' ),
			load,
			setName( 'PROCESS_CORE_' + core + '_LOAD' )
		);
	} );

	if ( interval ) {
		if ( api.intervalCancelled ) {
			api.intervalCancelled = false;
		} else {
			setTimeout( function() {
				recordUtilization( api, config, interval, metadata );
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
	if ( adapter.setConverter ) {
		adapter.setConverter( convert );
	}
	var subscriptions = [
		api.on( 'metric', function( data ) {
			adapter.onMetric( data );
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

module.exports = metronic;
