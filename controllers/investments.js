const Ticker = require('../models/stocks'); //Ticker Model
const Markets = require('../models/markets'); //markets Model
const User = require('../models/user'); //user model
const { getTics, updateTickers, makeTics, indexTics, checkTics } = require('../public/js/ticDataFetch'); //js functions for updating tics
const { marketFetch } = require('../public/js/marketFetch'); //js functions for updating market data
const ccxt = require('ccxt'); //crypto api
const { DateTime } = require('luxon');
const flash = require('connect-flash'); //flash update for screen updates
const { boolean } = require('joi');

//Find all current tickers and update the data - is called from the DOM and back end
module.exports.updateTics = async (req, res) => {
	const tickers = JSON.parse(req.body.tickers);

	Promise.all([
		updateTickers(tickers)
	]).then(async (ticker) => {
		res.json(ticker.flat(1));
	});
};

//Main route for displaying default tickers
//Find default tics, send to DOM, update DOM with new API call
module.exports.index = async (req, res) => {
	const ticker = await indexTics();
	const pageName = 'welcome';
	const updateTics = true;
	res.render('investments/index', { ticker, updateTics, pageName });
};

//Create the markets for each exchange so we can display exchange specific tickers
//Find desired markets, send symbols to NEW route
module.exports.markets = async (req, res) => {
	await marketFetch();
	const markets = await Markets.find({});

	req.flash('success', `There are ${markets.length} markets!`);
	res.redirect('/investments');
};

//Personalized page for displaying user tickers
//find user (required), find user's tickers, send tickers to DOM, update DOM
module.exports.home = async (req, res) => {
	const userID = req.user._id;
	const ticker = await Ticker.find({ creator: userID });

	var k = 0;
	const pageName = 'home';
	for (let tic of ticker) {
		if (tic != null) {
			k++;
		}
	}
	updateTics = k > 0 ? true : false;
	res.render('investments/index', { ticker, updateTics, pageName });
};

//Load default / preloaded tickers if desired by user
module.exports.defaultHome = async (req, res) => {
	const userID = req.user._id;
	const loadDefault = req.body.loadDefault;

	const { tics } = await makeTics(userID);

	const ticker = await updateTickers(tics);
	const pageName = 'home';
	updateTics = true;
	res.render('investments/index', { ticker, updateTics, pageName });
};

//New ticker info selection page
//Find loaded market data for symbols, enable user to select exchange and market desired
module.exports.renderNewTicker = async (req, res) => {
	const markets = await Markets.find({});
	const pageName = 'new';
	res.render('investments/new', { markets, pageName });
};

//Create new ticker from user selection
module.exports.createNewTicker = async (req, res) => {
	const currency = [
		req.body.currency
	];
	const userId = req.user._id;
	const { ticker } = await makeTics(userId, currency);

	req.flash('success', 'Successfully made a new ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

//Display new ticker
//Get new ticker, display solo new ticker
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

//Show edit form, similar to show page, but with edit buttons
module.exports.renderEditForm = async (req, res) => {
	const ticker = await Ticker.findById(req.params.id);
	const markets = await Markets.find({});
	const pageName = 'edit';
	res.render(`investments/edit`, { ticker, markets, pageName });
};

//Edit and update current tic with by having user select new info
module.exports.editTicker = async (req, res) => {
	const { id } = req.params; //Deconsturcting params
	const ticker = await Ticker.findByIdAndUpdate(id, { ...req.body.currency });
	req.flash('success', 'Successfully updated ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

//delete a ticker and stay on same page
//find desired ticker to delete, remove from user's model and ticker model
module.exports.deleteTicker = async (req, res) => {
	const { id } = req.params;
	const userId = req.user._id;
	await Ticker.findByIdAndDelete(id);

	await User.findByIdAndUpdate(userId, { $pull: { tickers: id } }); //pull the deleted ticker from the user's saved ticker
	req.flash('success', 'Successfully deleted a ticker!');
	res.redirect('/investments/home');
};
