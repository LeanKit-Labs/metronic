var chai = require( 'chai' );
chai.use( require( 'chai-as-promised' ) );
global.should = chai.should();
global.expect = chai.expect;
global._ = require( 'lodash' );
global.fs = require( 'fs' );
global.sinon = require( 'sinon' );
global.when = require( 'when' );
var os = require( 'os' );
global.hostName = os.hostname();

chai.Assertion.addMethod( "returnError", function( message ) {
	var obj = this._obj;
	if ( !obj.then ) {
		obj = when.resolve( obj );
	}
	var self = this;
	return obj.then( function( err ) {
		new chai.Assertion( err ).to.be.instanceof( Error );
		return self.assert(
			err.message === message,
			"expected error message to be '#{exp}' but got '#{act}'",
			message,
			err.message
		);
	} );
} );

chai.Assertion.addMethod( "partiallyEql", function( partial ) {
	var obj = this._obj;
	if ( !obj.then ) {
		obj = when.resolve( obj );
	}
	var self = this;
	return obj.then( function( actual ) {
		var diffs = deepCompare( partial, actual );
		return self.assert(
			diffs.length === 0,
			diffs.join( "\n\t" )
		);
	} );
} );

function deepCompare( a, b, k ) {
	var diffs = [];
	if ( b === undefined ) {
		diffs.push( "expected " + k + " to equal " + a + " but was undefined " );
	} else if ( _.isObject( a ) || _.isArray( a ) ) {
		_.each( a, function( v, c ) {
			var key = k ? [ k, c ].join( "." ) : c;
			diffs = diffs.concat( deepCompare( a[ c ], b[ c ], key ) );
		} );
	} else {
		var equal = a == b; // jshint ignore:line
		if ( !equal ) {
			diffs.push( "expected " + k + " to equal " + a + " but got " + b );
		}
	}
	return diffs;
};
