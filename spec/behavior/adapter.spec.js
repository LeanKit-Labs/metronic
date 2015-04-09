require( '../setup' );

function createAdapter() {
	return {
		durations: [],
		meters: [],
		onTime: function( key, duration, units, timestamp ) {
			this.durations.push( { key: key, duration: duration, units: units, timestamp: timestamp } );
		},
		onMeter: function( key, value, timestamp ) {
			this.meters.push( { key: key, value: value, timestamp: timestamp } );
		}
	};
}

describe( 'Adapters', function() {
	var adapter, timer, meter, metrics;
	before( function() {
		process.title = 'test';
		metrics = require( '../../src/index' )();
		adapter = createAdapter();
		metrics.use( adapter );
		metrics.useLocalAdapter();

		timer = metrics.timer( 'one' );
		meter = metrics.meter( 'two' );
		metrics.recordUtilization();
		timer.record();
		timer.record();
		metrics.recordUtilization();
		meter.record();
		meter.record();
		meter.record();
		metrics.recordUtilization();
	} );

	it( 'should capture durations', function() {
		adapter.durations.length.should.equal( 2 );
	} );

	it( 'should capture counts', function() {
		adapter.meters.length.should.equal( 30 );
	} );

	it( 'should produce report', function() {
		var report = metrics.getReport();
		report.should.have.all.keys(
			[
				hostName,
				hostName + '.test'
			] );
		report[ hostName + '.test' ].should.have.all.keys(
			[
				'heap-allocated',
				'heap-used',
				'physical-allocated',
				'core-0-load',
				'core-1-load',
				'core-2-load',
				'one',
				'two'
			] );
		report[ hostName ].should.have.all.keys(
			[
				'memory-total',
				'memory-allocated',
				'memory-available'
			] );
	} );

	describe( 'after removing adapter', function() {
		before( function() {
			metrics.removeAdapters();
			timer.record();
			meter.record();
		} );

		it( 'should not increase captured durations', function() {
			adapter.durations.length.should.equal( 2 );
		} );

		it( 'should not increase captured counts', function() {
			adapter.meters.length.should.equal( 30 );
		} );
	} );

	describe( 'with utilization interval', function() {
		var collector, meters;
		before( function( done ) {
			collector = createAdapter();
			metrics.use( collector );
			var initial = metrics.recordUtilization( 100 );
			meters = 6 + initial.loadAverage.length;
			setTimeout( function() {
				metrics.cancelInterval();
				done();
			}, 1000 );
		} );

		it( 'should have captured multiple intervals', function() {
			collector.meters.length.should.equal( 10 * meters );
		} );

		after( function() {
			metrics.removeAdapters();
		} );
	} );
} );
