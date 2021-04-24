const Ticker = require('../models/stocks'); //Ticker Model
const Markets = require('../models/markets'); //markets Model
const ccxt = require('ccxt');
const { DateTime } = require('luxon');
const flash = require('connect-flash'); //flash update for screen updates

module.exports.markets = async (req, res) => {
	await Markets.deleteMany({});

	const excs = [
		'aax',
		'binance',
		'bittrex',
		'bitvavo',
		'bytetrade',
		'currencycom',
		'eterbase',
		'ftx',
		'gopax',
		'idex',
		'kraken'
	];
	for await (let ex of excs) {
		let exchange = new ccxt[ex]();
		let markets = await exchange.load_markets();
		let symbols = Object.keys(exchange.markets);

		const market = new Markets({
			exchange : ex,
			symbols  : symbols
		});
		await market.save().then(async (market) => {});
	}
	const markets = await Markets.find({});
	req.flash('success', `There are ${markets.length} markets!`);
	res.redirect('/investments');
};

module.exports.autoUpdate = async (req, res) => {
	const tickers = await Ticker.findById(req.params.id);
	console.log('ticker from fist call');
	console.log(tickers);
	const ticker = await autoUpdate(tickers);
	return ticker;
	// req.flash('success', 'Successfully passed the information!');
	// res.redirect('/investments');
};

module.exports.index = async (req, res) => {
	const tickers = await Ticker.find({});
	const ticker = await updateTickers(tickers);
	res.render('investments/index', { ticker });
};

module.exports.renderNewTicker = async (req, res) => {
	const markets = await Markets.find({});
	console.log('markets');
	console.log(markets);
	res.render('investments/new', { markets });
};

module.exports.createNewTicker = async (req, res) => {
	const ticker = new Ticker(req.body.currency);
	ticker.creator = req.user._id;
	await ticker.save();
	req.flash('success', 'Successfully made a new ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

module.exports.showTicker = async (req, res, next) => {
	const tickers = await Ticker.findById(req.params.id).populate('creator'); //needs reveiws to work to populate reviews
	const ticker = await updateTickers(tickers);
	if (!ticker) {
		req.flash('error', 'Ticker Not Found!');
		return res.redirect('/investments');
	}
	res.render('investments/show', { ticker });
};

module.exports.renderEditForm = async (req, res) => {
	const tickers = await Ticker.findById(req.params.id);
	const ticker = await updateTickers(tickers);
	res.render(`investments/edit`, { ticker });
};

module.exports.editTicker = async (req, res) => {
	const { id } = req.params; //Deconsturcting params
	const ticker = await Ticker.findByIdAndUpdate(id, { ...req.body.currency });
	req.flash('success', 'Successfully updated ticker!');
	res.redirect(`/investments/${ticker._id}`);
};

module.exports.deleteTicker = async (req, res) => {
	const { id } = req.params;
	await Ticker.findByIdAndDelete(id);
	req.flash('success', 'Successfully deleted a ticker!');
	res.redirect('/investments');
};

//Takes in ticker Symbol, outputs ticker data
async function updateTickers(ticker) {
	const tickerObj = [];
	const exc = 'coinbase';
	if (!Array.isArray(ticker)) {
		ticker = [
			ticker
		];
	}

	//checks to see if there is one or more tickers and if they are crypto - does NOT handle stocks
	//is there a way to update only the ticker and not recreate the entire object each time?
	const exchange = ticker.map((tic) => {
		return tic.crypto
			? new ccxt[tic.exchange]({
					enableRateLimit : true
				})
			: new ccxt[exc]();
	});

	const tickers = await awaitAll(exchange, ticker, fetchTic)
		.then((tickers) => {
			// could do this with for (let tic of ticker ) and use tic instead of index
			for (let i = 0; i < tickers.length; i++) {
				delete tickers[i].info;
				let market = { exchange: tickers[i].exchange, id: ticker[i]._id };
				let { datetime } = tickers[i];
				let dt = DateTime.fromISO(datetime);
				let timeMerge = {
					time : dt.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET),
					date : dt.toLocaleString(DateTime.DATE_MED)
				};
				tickerObj[i] = { ...market, ...timeMerge, ...tickers[i] };
			}

			return tickerObj;
		})
		.then(async (tickerObj) => {
			let tickers = await saveTics(tickerObj);
			return tickers;
		});

	if (!Array.isArray(tickers)) {
		tickers = [
			tickers
		];
	}
	return tickers;
}

function awaitAll(list, item, asyncFn) {
	const promises = [];
	for (let i = 0; i < list.length; i++) {
		promises.push(asyncFn(list[i], item[i]));
	}
	return Promise.all(promises);
}

async function fetchTic(exchange, ticker) {
	// JavaScript to fetch multiple tickers at once
	// if (exchange.has['fetchTickers']) {
	//     console.log (await (exchange.fetchTickers ())) // all tickers indexed by their symbols
	// }
	try {
		let market = { exchange: ticker.exchange };
		let tic = await Promise.resolve(exchange.fetchTicker(ticker.symbol));
		return { ...market, ...tic };
	} catch (e) {
		console.log(e);
		return;
	}
}

//still not updating properly
async function saveTics(tickerObj) {
	var ticker = [];
	// console.log('tickerObj sent to saveTics');
	// console.log(tickerObj);
	for await (tic of tickerObj) {
		// const { id } = tic;
		ticker.push(
			await Ticker.findByIdAndUpdate({ _id: tic.id }, { ...tic }, { new: true, useFindAndModify: false })
		);
	}
	return ticker;
}

async function autoUpdate(ticker) {
	try {
		const { exchange, symbol } = ticker;
		const exc = new ccxt[exchange]({
			enableRateLimit : true
		});

		setInterval(function() {
			uptic(exc, symbol);
		}, 5000);

		async function uptic(exchange, symbol) {
			let newtic = await Promise.resolve(exchange.fetchTicker(symbol));
			console.log('newtic');
			console.log(newtic);
			return newtic;
		}
	} catch (e) {
		console.log('error report');
		console.log(e);
		return;
	}
}
