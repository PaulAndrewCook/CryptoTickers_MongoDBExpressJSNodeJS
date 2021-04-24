const { boolean } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
	email   : {
		type     : String,
		required : true,
		unique   : true
	},
	isAdmin : {
		type    : Boolean,
		default : false
	},
	tickers : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'Ticker'
		}
	]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
