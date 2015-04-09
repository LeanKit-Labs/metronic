require( '../setup' );

describe( 'Instrumentation', function() {
	describe( 'successful promise', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];
			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				call: function() {
					return when.promise( function( resolve ) {
						setTimeout( function() {
							resolve( 'done' );
						}, 200 );
					} );
				},
				success: function( x ) {
					resolution = x;
				},
				counters: [ 'attempted', 'succeeded' ]
			} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( 'done' );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: metrics.prefix + '.a.promise.attempted', value: 1 },
				{ key: metrics.prefix + '.a.promise.succeeded', value: 1 },
				{ key: metrics.prefix + '.a.promise.duration', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );

	describe( 'failed promise', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];
			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				call: function() {
					return when.promise( function( resolve, reject ) {
						setTimeout( function() {
							reject( 'done' );
						}, 200 );
					} );
				},
				failure: function( x ) {
					resolution = x;
				}
			} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( 'done' );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: metrics.prefix + '.a.promise.attempted', value: 1 },
				{ key: metrics.prefix + '.a.promise.failed', value: 1 },
				{ key: metrics.prefix + '.a.promise.duration', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );

	describe( 'successful callback', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];
			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				call: function( cb ) {
					setTimeout( function() {
						cb( null, 'done' );
					}, 200 );
				},
				success: function( x ) {
					resolution = x;
				}
			} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( 'done' );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: metrics.prefix + '.a.promise.attempted', value: 1 },
				{ key: metrics.prefix + '.a.promise.succeeded', value: 1 },
				{ key: metrics.prefix + '.a.promise.duration', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );

	describe( 'failed callback', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		var error = new Error( 'error' );
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];

			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				call: function( cb ) {
					setTimeout( function() {
						cb( error );
					}, 200 );
				}
			} )
				.then( null, function( err ) {
					resolution = err;
				} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( error );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: metrics.prefix + '.a.promise.attempted', value: 1 },
				{ key: metrics.prefix + '.a.promise.failed', value: 1 },
				{ key: metrics.prefix + '.a.promise.duration', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );

	describe( 'callback with only failure counter', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		var error = new Error( 'error' );
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];

			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				call: function( cb ) {
					setTimeout( function() {
						cb( error );
					}, 200 );
				},
				counters: [ 'failed' ],
				duration: false
			} )
				.then( null, function( err ) {
					resolution = err;
				} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( error );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: metrics.prefix + '.a.promise.failed', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );

	describe( 'promise with custom namespace', function() {
		var collected = [];
		var metrics, subscriptions, resolution;
		before( function() {
			process.title = 'test';
			metrics = require( '../../src/index' )( { prefix: 'metronics' } );
			subscriptions = [
				metrics.on( 'meter', function( data ) {
					collected.push( { key: data.key, value: data.value } );
				} ),
				metrics.on( 'time', function( data ) {
					collected.push( { key: data.key, value: 1 } );
				} )
			];
			return metrics.instrument( {
				key: [ 'a', 'promise' ],
				namespace: [ 'one', 'two' ],
				call: function() {
					return when.promise( function( resolve ) {
						setTimeout( function() {
							resolve( 'done' );
						}, 200 );
					} );
				},
				success: function( x ) {
					resolution = x;
				},
				counters: [ 'attempted', 'succeeded' ]
			} );
		} );

		it( 'should resolve promise', function() {
			resolution.should.equal( 'done' );
		} );

		it( 'should capture expected metrics', function() {
			collected.should.eql( [
				{ key: 'one.two.a.promise.attempted', value: 1 },
				{ key: 'one.two.a.promise.succeeded', value: 1 },
				{ key: 'one.two.a.promise.duration', value: 1 },
			] );
		} );

		after( function() {
			_.each( subscriptions, function( subscription ) {
				subscription.unsubscribe();
			} );
		} );
	} );
} );
