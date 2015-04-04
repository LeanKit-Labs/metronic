var chai = require( 'chai' );
chai.should();
var metrics = require( '../../src/index' )();

describe( 'Meter', function() {
	var counts = {};

	before( function( done ) {
		metrics.on( 'meter', function( data ) {
			counts[ data.key ] = data.value;
		} );
		var meter1 = metrics.meter( 'test.counter.one' );
		var meter2 = metrics.meter( [ 'test', 'counter', 'two' ] );
		meter1.record();
		meter2.record( 2 );
		process.nextTick( done );
	} );

	it( 'should emit counters', function() {
		counts.should.eql( {
			'test.counter.one': 1,
			'test.counter.two': 2
		} );
	} );
} );
