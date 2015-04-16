require( '../setup' );
var convert = require( '../../convert' );
console.log( convert );

describe( 'Converter', function() {

	it( 'should convert seconds to milliseconds', function() {
		convert( 1, 's', 'ms' ).should.equal( 1000 );
	} );

	it( 'should convert seconds to microseconds', function() {
		convert( 1, 's', 'us' ).should.equal( 1000000 );
	} );

	it( 'should convert seconds to nanoseconds', function() {
		convert( 1, 's', 'ns' ).should.equal( 1000000000 );
	} );

	it( 'should convert milliseconds to seconds', function() {
		convert( 1000, 'ms', 's' ).should.equal( 1 );
	} );


	it( 'should convert milliseconds to microseconds', function() {
		convert( 0.001, 'ms', 'us' ).should.equal( 1 );
	} );

	it( 'should convert milliseconds to nanoseconds', function() {
		convert( 0.000001, 'ms', 'ns' ).should.equal( 1 );
	} );

	it( 'should convert microseconds to milliseconds', function() {
		convert( 1, 'us', 'ms' ).should.equal( 0.001 );
	} );

	it( 'should convert microseconds to seconds', function() {
		convert( 1000000, 'us', 's' ).should.equal( 1 );
	} );

	it( 'should convert microseconds to nanoseconds', function() {
		convert( 0.001, 'us', 'ns' ).should.equal( 1 );
	} );

	it( 'should convert nanoseconds to milliseconds', function() {
		convert( 1000000, 'ns', 'ms' ).should.equal( 1 );
	} );

	it( 'should convert nanoseconds to microseconds', function() {
		convert( 1000, 'ns', 'us' ).should.equal( 1 );
	} );

	it( 'should convert nanoseconds to seconds', function() {
		convert( 1000000000, 'ns', 's' ).should.equal( 1 );
	} );

	it( 'should maintain like units', function() {
		convert( 1, 's', 's' ).should.equal( 1 );
		convert( 1, 'ms', 'ms' ).should.equal( 1 );
		convert( 1, 'us', 'us' ).should.equal( 1 );
		convert( 1, 'ns', 'ns' ).should.equal( 1 );
	} );
} );
