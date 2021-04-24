const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MarketSchema = new Schema({
	exchange : {
		type     : String,
		unique   : true,
		required : [
			true,
			'Exchange cannot be blank'
		]
	},
	symbols  : [
		{
			type : String
		}
	],
	creator  : {
		type : Schema.Types.ObjectId,
		ref  : 'User'
	},
	ticker   : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'Ticker'
		}
	]
});

module.exports = mongoose.model('Market', MarketSchema);
