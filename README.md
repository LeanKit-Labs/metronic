## metronic
Provides a simple API for collecting timing information and counters that can be integrated into different metrics/telemetry libraries.

## Rationale
We wanted the ability to leverage things like Graphite without introducing it as a concrete dependency in all our shared libraries. This seemed like a simple way to support Graphite while leaving the door open for other solutions.

## Use

```javascript
// default configuration values shown
var metrics = require( 'metronic' )(
	{
		delimiter: '.',
		units: 'ms',
		prefix: '' // a custom key prefix to prepend to all keys
	}
);

// TIMER

// when you know the key you want to use
var timer = metrics.timer( 'action' );

// when you want a key composed for you
var timer = metrics.timer( [ var1, var2, var3 ] );

// when inheriting a namespace from another key
var timer = metrics.timer( 'child', 'parent' ); // key will be 'parent.child'

// creates a time measurement since the timer was started
timer.record();

// resets this timer so it can be used to measure from this point
timer.reset();

// data has `key`, `duration`, `units` and `timestamp`
metrics.on( 'time', function( data ) { ... } );

// METER

// when you know the key
var meter = metrics.meter( 'some.event' );

// compose a key
meter = metrics.meter( [ var4, var5 ] );

// creates a meter event
meter.record( 5 );

// value defaults to 1
meter.record();

// data has `key`, `value` and `timestamp`
metrics.on( 'meter', function( data ) { ... } );

// INSTRUMENTATION

// instruments a promise or callback with a timer and attempt, success and failure counters.
metrics.instrument(
	key: [ 'one', 'two' ],
	namespace: 'example',
	call: function( cb ) {
		// just return the promise
		return someApi.call( ... );

		// for a callback, pass the callback
		someApi.call( cb );
	},
	success: onSuccess
	failure: onFailure
);

// TELEMETRY

// captures a snapshot of processor and memory utilization
meter.recordUtilization();

// setup recording utilization on an interval in milliseconds
meter.recordUtilization( 1000 );

// cancel recording utilization interval
meter.cancelInterval();

// ADAPTER

// uses a metrics library to collect locally
metrics.useLocalAdapter();

// gets the local metrics report
metrics.getReport();

// custom adapter
var myAdapter = require( 'myAdapter' );
metrics.use( myAdapter );

// remove adapter
metrics.removeAdapters();

// TIME UNIT CONVERSIONS
// convert is also available directly off the require
// require( 'metronic' ).convert

// supports conversion between supported units
metrics.convert( 1000000, 'us', 's' ); // 1
metrics.convert( 10, 'ms', 'ns' ); // 10000000
```

## Configuration

### delimiter
The character to use to delimit key segments. Defaults to `.`.

### units

 * 'ns' - nanoseconds
 * 'us' - microseconds
 * 'ms' - milliseconds
 * 's' - seconds

### prefix
This lets you provide a custom prefix that will be added at the very beginning of every key.

## Keys
Metronic creates keys by prepending the machine name (obtained from `os.hostname()`) and the `process.title`. The `process.title` must already be set before calling the metronic function to create the instance.

Example:
```javascript
process.title = 'myApp';
var metronic = require( 'metronic' )();

// generates 'machineName.myApp.perf' as this timer's key
var timer = metronic.timer( 'perf' );
```

## API

### Prefix
By default, metronic auto-appends a prefix containing the configuration prefix, host name and process title to everything. If you need this information (to construct your own keys or namespaces), it's available via the prefix property:

```javascript
metronic.prefix; //{config.prefix}.{hostName}.{processTitle}
```

### Parent Namespaces
It may be desirable to track metrics that roll up under a common activity. A shared namespace eliminates the default `{config.prefix}.{machineName}.{processTitle}` prefix and uses the provided `parentNamespace` instead when provided for the `timer` and `meter` calls.

### meter( key, [parentNamespace] )
Creates a meter used to record occurrences or amounts over time.

### meter:record( key, [value] )
Records a value against a key. If value is undefined, a 1 is recorded.

### timer( key, [parentNamespace] )
Creates a timer instance that can be used to record elapsed time for an activity. This instance should never be used across concurrent calls.

### timer:record()
Records a duration for the key used when the timer was created. This does _NOT_ reset the timer. Every subsequent call to `record` will capture duration from when the timer was created or the most recent `reset` call.

### timer:reset()
Resets the timer to the present. All subsequent calls to `record` will capture time elapsed since this call was made.

### instrument( options )
Instruments a call with timing and counters based on the hash object provided. Each metric collected appends the name of the measure after the provided key. Returns a promise wether or not the supplied `call` provides a promises by default or uses node-style callback.

 * duration - the wallclock time elapsed between the invokation and resolution of the call
 * attempted - the number of times the call has been invoked
 * succeeded - the number of successful resolutions
 * failed - the number of errored/rejected resolutions

The options has the following properties:

 * key - string or array to make up key
 * namespace - string or array to provide custom namespace
 * call - a wrapper around a promise or callback style function
 * success - the success handler
 * failure - the failure handler
 * counters - specifies limited subset of counters to record: 'succeeded', 'failed', 'attempted'
 * duration - set this to `false` to prevent recording the duration

> Note: the `success` and `failure` callbacks should always return a value/error.

```javascript
// collect all metrics
metrics.instrument(
	key: [ 'one', 'two' ],
	namespace: [ 'a', 'b' ],
	call: function() {
		// just return the promise
		return someApi.call( ... );
	},
	success: onSuccess,
	failure: onFailure
);

// timing only
metrics.instrument(
	key: [ 'one', 'two' ],
	namespace: 'example',
	call: function( cb ) {
		// for a callback, pass the callback
		someApi.call( cb );
	},
	success: onSuccess,
	failure: onFailure,
	counters: []
);

// no timer, count failures and attempts
metrics.instrument(
	key: [ 'one', 'two' ],
	namespace: 'example',
	call: function() {
		// just return the promise
		return someApi.call( ... );
	},
	success: onSuccess,
	failure: onFailure,
	counters: [ 'failed', 'attempted' ],
	duration: false
);
```

### getReport()
Returns metrics that have been collected locally. Only works when used with `recordMetrics`.

### recordUtilization( [interval] )
Captures and records system and process utilization of memory and processors. When an interval is provided, this will attempt to continue recording utilization at each interval.

The following meters are collected each time this call is made:

 * {config.prefix}.{hostName}.memory-total
 * {config.prefix}.{hostName}.memory-used
 * {config.prefix}.{hostName}.memory-free
 * {config.prefix}.{hostName}.{processTitle}.memory-physical
 * {config.prefix}.{hostName}.{processTitle}.memory-available
 * {config.prefix}.{hostName}.{processTitle}.memory-used
 * {config.prefix}.{hostName}.{processTitle}.core-#-load

> Note: memory is measured in MB

### cancelInterval()
Stops recording utilization at the interval previously setup.

### removeAdapters()
Removes all adapter subscriptions.

### use( adapter )
Plugs an adapter into the events directly. The adapter is expected to have the following API:

> Note: The timestamp is milliseconds since the unix epoch in UTC (obtained from Date.now()).

 * onTime( key, duration, units, timestamp )
 * onMeter( key, value, timestamp )
 * setConverter( converter )

### useLocalAdapter()
Records metrics locally with a default adapter. Meters are recorded as histograms in the metrics report.
