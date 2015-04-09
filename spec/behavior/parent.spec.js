require( '../setup' );

describe( 'Parent Namespace', function() {
	var collected = [];
	var metrics;
	before( function( done ) {
		process.title = 'test';
		metrics = require( '../../src/index' )( { prefix: 'metronics' } );
		metrics.once( 'meter', function( data ) {
			collected.push( data.key );
		} );
		metrics.once( 'time', function( data ) {
			collected.push( data.key );
		} );
		var meter = metrics.meter( 'meter', 'test' );
		var timer = metrics.timer( 'timer', 'test' );
		meter.record();
		timer.record();
		process.nextTick( done );
	} );

	it( 'should make prefix available', function() {
		metrics.prefix.should.equal( [ 'metronics', hostName, process.title ].join( '.' ) );
	} );

	it( 'should prefer namespace over prefix', function() {
		collected.should.eql( [ 'test.meter', 'test.timer' ] );
	} );
} );
