var chai = require( 'chai' );
chai.should();
var metrics = require( '../../src/index' )();

describe( 'Timer', function() {
	var t1, t2;
	var times1 = [];
	var times2 = [];
	before( function( done ) {
		metrics.on( 'time', function( data ) {
			if ( data.key === 'one.one' ) {
				times1.push( data.duration );
			} else if ( data.key === 'one.two' ) {
				times2.push( data.duration );
			}
		} );
		t1 = metrics.timer( 'one.one' );
		setTimeout( function() {
			t2 = metrics.timer( [ 'one', 'two' ] );
			done();
		}, 10 );
	} );

	it( 'should keep timers separate', function() {
		t1.record();
		t2.record();
		times1[ 0 ].should.be.greaterThan( times2[ 0 ] );
	} );

	it( 'should track time from start', function( done ) {
		setTimeout( function() {
			t1.record();
			t2.record();
			times1[ 1 ].should.be.greaterThan( times1[ 0 ] );
			times2[ 1 ].should.be.greaterThan( times2[ 0 ] );
			done();
		}, 10 );
	} );

	it( 'should track time from reset', function( done ) {
		t1.reset();
		t2.reset();
		setTimeout( function() {
			t1.record().should.be.lessThan( 15 );
			t2.record().should.be.lessThan( 15 );
			done();
		}, 10 );
	} );

	it( 'should capture all recorded durations', function() {
		times1.length.should.equal( 3 );
		times2.length.should.equal( 3 );
	} );
} );
