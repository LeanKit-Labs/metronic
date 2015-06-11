require( '../setup' );
var convert = require( '../../convert' );
console.log( convert );

describe( 'Converter', function() {
	describe( 'when converting time units', function() {
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

	describe( 'when converting time units', function() {
		it( 'should convert bytes to kilobytes', function() {
			convert( 1024, 'b', 'kb' ).should.equal( 1 );
		} );

		it( 'should convert bytes to megabytes', function() {
			convert( 1048576, 'b', 'mb' ).should.equal( 1 );
		} );

		it( 'should convert bytes to gigabytes', function() {
			convert( 5368709120, 'b', 'gb' ).should.equal( 5 );
		} );

		it( 'should convert bytes to terabytes', function() {
			convert( 7696581394432, 'b', 'tb' ).should.equal( 7 );
		} );

		it( 'should convert terabytes to gigabytes', function() {
			convert( 3, 'tb', 'gb' ).should.equal( 3072 );
		} );

		it( 'should convert terabytes to megabytes', function() {
			convert( 4, 'tb', 'mb' ).should.equal( 4194304 );
		} );

		it( 'should convert terabytes to kilobytes', function() {
			convert( 10, 'tb', 'kb' ).should.equal( 10737418240 );
		} );

		it( 'should convert gigbytes to megabytes', function() {
			convert( 6, 'gb', 'mb' ).should.equal( 6144 );
		} );

		it( 'should convert gigbytes to kilobytes', function() {
			convert( 8, 'gb', 'kb' ).should.equal( 8388608 );
		} );

		it( 'should maintain like units', function() {
			convert( 1, 'b', 'b' ).should.equal( 1 );
			convert( 1, 'kb', 'kb' ).should.equal( 1 );
			convert( 1, 'mb', 'mb' ).should.equal( 1 );
			convert( 1, 'gb', 'gb' ).should.equal( 1 );
			convert( 1, 'tb', 'tb' ).should.equal( 1 );
		} );
	} );
} );
