var Monologue = require( 'monologue.js' );
var _ = require( 'lodash' );

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

function removeAdapters( api ) {
	_.each( api.adpaterSubscriptions, function( subscription ) {
		subscription.unsubscribe();
	} );
}

module.exports = function( cfg ) {
	var config = _.defaults( defaults, cfg );
	api.meter = createMeter.bind( null, config );
	api.timer = createTimer.bind( null, config );
	api.use = useAdapter.bind( null, api );
	api.removeAdapters = removeAdapters.bind( null, api );
	return api;
};
