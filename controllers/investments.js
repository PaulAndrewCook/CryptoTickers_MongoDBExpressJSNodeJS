const Ticker = require('../models/stocks'); //Ticker Model
const Markets = require('../models/markets'); //markets Model
const User = require('../models/user'); //user model
const { getTics, updateTickers, makeTics, indexTics, checkTics } = require('../public/js/ticDataFetch'); //js functions for updating tics
const { marketFetch } = require('../public/js/marketFetch'); //js functions for updating tics
const ccxt = require('ccxt'); //crypto api
const { DateTime } = require('luxon');
const flash = require('connect-flash'); //flash update for screen updates
const { boolean } = require('joi');

module.exports.updateTics = async (req, res) => {
	const tickers = JSON.parse(req.body.tickers);

	Promise.all([
		updateTickers(tickers)
	]).then(async (ticker) => {
		res.json(ticker.flat(1));
	});
};

module.exports.index = async (req, res) => {
	const ticker = await indexTics();
	const pageName = 'welcome';
	const updateTics = true;
	res.render('investments/index', { ticker, updateTics, pageName });
};

module.exports.markets = async (req, res) => {
	await marketFetch();
	const markets = await Markets.find({});

	req.flash('success', `There are ${markets.length} markets!`);
	res.redirect('/investments');
};

module.exports.home = async (req, res) => {
	const userID = req.user._id;
	const ticker = await Ticker.find({ creator: userID });

	const pageName = 'home';
	updateTics = true;
	res.render('investments/index', { ticker, updateTics, pageName });
};

module.exports.defaultHome = async (req, res) => {
	const userID = req.user._id;
	const loadDefault = req.body.loadDefault;

	const { tics } = await makeTics(userID);

	const ticker = await updateTickers(tics);
	const pageName = 'home';
	updateTics = true;
	res.render('investments/index', { ticker, updateTics, pageName });
};

module.exports.renderNewTicker = async (req, res) => {
	const markets = await Markets.find({});
	const pageName = 'new';
	res.render('investments/new', { markets, pageName });
};

module.exports.createNewTicker = async (req, res) => {
	const currency = [
		req.body.currency
	];

	const userId = req.user._id;
	const { ticker } = await makeTics(userId, currency);
	req.flash('success', 'Successfully made a new ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

module.exports.showTicker = async (req, res, next) => {
	const tickers = await Ticker.findById(req.params.id); //needs reveiws to work to populate reviews

	const ticker = await updateTickers(tickers);
	if (!ticker) {
		req.flash('error', 'Ticker Not Found!');
		return res.redirect('/investments');
	}
	const pageName = 'new';
	updateTics = true;
	res.render('investments/show', { ticker, pageName });
};

module.exports.renderEditForm = async (req, res) => {
	const ticker = await Ticker.findById(req.params.id);
	const markets = await Markets.find({});
	const pageName = 'edit';
	res.render(`investments/edit`, { ticker, markets, pageName });
};

module.exports.editTicker = async (req, res) => {
	const { id } = req.params; //Deconsturcting params
	const ticker = await Ticker.findByIdAndUpdate(id, { ...req.body.currency });
	req.flash('success', 'Successfully updated ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

module.exports.deleteTicker = async (req, res) => {
	const { id } = req.params;
	const userId = req.user._id;
	await Ticker.findByIdAndDelete(id);

	await User.findByIdAndUpdate(userId, { $pull: { tickers: id } }); //pull the deleted ticker from the user's saved ticker
	req.flash('success', 'Successfully deleted a ticker!');
	res.redirect('/investments/home');
};
