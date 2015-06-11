var _ = require( 'lodash' );
var timeLookup = [ 1, 1000, 1000000, 1000000000 ];
var timeUnits = [ 'NS', 'US', 'MS', 'S' ];

var byteLookup = [ 1, 1024, 1048576, 1073741824, 1099511627776 ]
var byteUnits = [ 'B', 'KB', 'MB', 'GB', 'TB' ];

function convertTime( value, sourceUnits, destinationUnits ) {
	var sourceIndex = _.indexOf( timeUnits, sourceUnits );
	var destinationIndex = _.indexOf( timeUnits, destinationUnits );
	var index = Math.abs( sourceIndex - destinationIndex );
	var factor = timeLookup[ index ];
	return sourceIndex > destinationIndex ? value * factor : value / factor;
}

function convertBytes( value, sourceUnits, destinationUnits ) {
	var sourceIndex = _.indexOf( byteUnits, sourceUnits );
	var destinationIndex = _.indexOf( byteUnits, destinationUnits );
	var index = Math.abs( sourceIndex - destinationIndex );
	var factor = byteLookup[ index ];
	return sourceIndex > destinationIndex ? value * factor : value / factor;
}

function convert( value, sourceUnits, destinationUnits ) {
	sourceUnits = sourceUnits.toUpperCase()
	destinationUnits = destinationUnits.toUpperCase();
	if( _.contains( timeUnits, sourceUnits ) ) {
		return convertTime( value, sourceUnits, destinationUnits );
	} else if( _.contains( byteUnits, sourceUnits ) ) {
		return convertBytes( value, sourceUnits, destinationUnits );
	} else {
		throw new Error( 'Metronic converter only supports conversion between time or byte measurements' );
	}
}

module.exports = convert;
