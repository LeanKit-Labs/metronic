## metronic
Provides a simple API for collecting timing information and counters that can be integrated into different metrics/telemetry libraries.

## Rationale
We wanted the ability to leverage things like Graphite without introducing it as a defacto dependency in all our shared libraries. This seemed like a simple way to support Graphite while leaving the door open for other solutions when Graphite isn't in use.

## Use

```javascript
// default configuration values shown
var metrics = require( 'metronic' )(
	{
		delimiter: '.',
		units: 'ms'
	}
);

// TIMER

// when you know the key you want to use
var timer = metrics.timer( 'metronic.myApp.action' );

// when you want a key composed for you
var timer = metrics.timer( [ 'metronic', var1, var2, var3 ] );

// creates a time measurement since the timer was started
timer.record();

// resets this timer so it can be used to measure from this point
timer.reset();

// data has `key` and `duration`
metrics.on( 'time', function( data ) { ... } );

// METER

// when you know the key
var meter = metrics.meter( 'metronic.some.event' );

// compose a key
meter = metrics.meter( [ 'metronic', var4, var5 ] );

// creates a meter event
meter.record( 5 );

// value defaults to 1
meter.record();

// data has `key` and `value`
metrics.on( 'meter', function( data ) { ... } );

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
```

## Configuration

### delimiter
The character to use to delimit key segments. Defaults to `.`.

### units

 * 'ns' - nanoseconds
 * 'us' - microseconds
 * 'ms' - milliseconds
 * 's' - seconds

## API

### timer( key )
Creates a timer instance that can be used to record elapsed time for an activity. This instance should never be used across concurrent calls.

### timer:record()
Records a duration for the key used when the timer was created. This does _NOT_ reset the timer. Every subsequent call to `record` will capture duration from when the timer was created or the most recent `reset` call.

### timer:reset()
Resets the timer to the present. All subsequent calls to `record` will capture time elapsed since this call was made.

### meter( key )
Creates a meter used to record occurrences or amounts over time.

### meter:record( key, [value] )
Records a value against a key. If value is undefined, a 1 is recorded.

### getReport()
Returns metrics that have been collected locally. Only works when used with `recordMetrics`.

### recordUtilization( [interval] )
Captures and records system and process utilization of memory and processors. When an interval is provided, this will attempt to continue recording utilization at each interval.

The following meters are collected each time this call is made:

 * metronic.{process.title}.system.memory.total
 * metronic.{process.title}.system.memory.used
 * metronic.{process.title}.system.memory.free
 * metronic.{process.title}.process.memory.physical-allocated
 * metronic.{process.title}.process.memory.heap-total
 * metronic.{process.title}.process.memory.heap-used
 * metronic.{process.title}.process.cpu.load.#

> Note: memory is measured in MB

### cancelInterval()
Stops recording utilization at the interval previously setup.

### removeAdapters()
Removes all adapter subscriptions.

### use( adapter )
Plugs an adapter into the events directly. The adapter is expected to have the following API:

 * onTime( key, duration, units )
 * onMeter( key, value )

### useLocalAdapter()
Records metrics locally with a default adapter. Meters are recorded as histograms in the metrics report.
