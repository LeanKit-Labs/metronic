var chai = require( 'chai' );
chai.should();
var os = require( 'os' );
var hostName = os.hostname();

describe( 'Meter', function() {
	var counts = {};

	before( function( done ) {
		process.title = 'test';
		var metrics = require( '../../src/index' )();
		metrics.on( 'meter', function( data ) {
			counts[ data.key ] = data.value;
		} );
		var meter1 = metrics.meter( 'counter.one' );
		var meter2 = metrics.meter( [ 'counter', 'two' ] );
		meter1.record();
		meter2.record( 2 );
		process.nextTick( done );
	} );

	it( 'should emit counters', function() {
		var key1 = hostName + '.test.counter.one';
		var key2 = hostName + '.test.counter.two';
		var expected = {};
		expected[ key1 ] = 1;
		expected[ key2 ] = 2;
		counts.should.eql( expected );
	} );
} );
