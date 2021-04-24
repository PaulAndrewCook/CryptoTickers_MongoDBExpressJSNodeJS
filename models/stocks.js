const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TickerSchema = new Schema({
	exchange   : {
		type     : String,
		required : [
			false,
			'Exchange cannot be blank'
		]
	},
	symbol     : {
		type     : String,
		required : [
			true,
			'Symbol cannot be blank'
		]
	},
	creator    : {
		type : Schema.Types.ObjectId,
		ref  : 'User'
	},
	crypto     : Boolean,
	high       : Number,
	low        : Number,
	open       : Number,
	close      : Number,
	last       : Number,
	baseVolume : Number,
	change     : Schema.Types.Mixed,
	percentage : Number,
	datetime   : String,
	time       : String,
	date       : String,
	personnel  : String,
	info       : String,
	reviews    : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'Review'
		}
	]
});

module.exports = mongoose.model('Ticker', TickerSchema);
