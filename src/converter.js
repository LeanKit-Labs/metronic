
var lookup = [ 1, 1000, 1000000, 1000000000 ];
var units = [ 'ns', 'us', 'ms', 's' ];

function convert( value, sourceUnits, destinationUnits ) {
	var sourceIndex = _.indexOf( units, sourceUnits );
	var destinationIndex = _.indexOf( units, destinationUnits );
	var index = Math.abs( sourceIndex - destinationIndex );
	var factor = lookup[ index ];
	return sourceIndex > destinationIndex ? value * factor : value / factor;
}

module.exports = convert;
