var chai = require( 'chai' );
chai.should();
var metrics = require( '../../src/index' )();

describe( 'Adapters', function() {
	var adapter, timer, meter;
	before( function() {
		adapter = {
			durations: [],
			meters: [],
			onTime: function( key, duration, units ) {
				this.durations.push( { key: key, duration: duration, units: units } );
			},
			onMeter: function( key, value ) {
				this.meters.push( { key: key, value: value } );
			}
		};
		metrics.use( adapter );

		timer = metrics.timer( 'one' );
		meter = metrics.meter( 'two' );

		timer.record();
		timer.record();
		meter.record();
		meter.record();
		meter.record();
	} );

	it( 'should capture durations', function() {
		adapter.durations.length.should.equal( 2 );
	} );

	it( 'should capture counts', function() {
		adapter.meters.length.should.equal( 3 );
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
			adapter.meters.length.should.equal( 3 );
		} );
	} );
} );
