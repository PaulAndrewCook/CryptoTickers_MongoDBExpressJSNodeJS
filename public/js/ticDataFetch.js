const User = require.main.require('./models/user'); //user model
const Ticker = require.main.require('./models/stocks'); //Ticker Model
const Markets = require.main.require('./models/markets'); //markets Model
const ccxt = require('ccxt'); //crypto api - create all tic data
const { DateTime } = require('luxon'); //convert date and time of tic into usable info
const { boolean } = require('joi'); //link the models via joi model
const NODE_ICU_DATA = require('full-icu'); //for luxon - datetime-> to get local timezone

//create the new tickers, push them into array, save id to user, and return object with both single and array tics
module.exports.makeTics = async (userId, baseTics) => {
	const tickers = baseTics ? baseTics : await defaultTics();

	var tics = [];
	var ticker = {};
	for await (tic of tickers) {
		ticker = new Ticker(tic);
		ticker.creator = userId;
		await ticker.save();
		const { id } = ticker;
		const user = await User.findByIdAndUpdate(
			userId,
			{ $push: { tickers: id } },
			{ safe: true, upsert: true, useFindAndModify: false }
		);
		tics.push(ticker);
	}
	return { ticker, tics };
};

//optional tics for the home page
async function defaultTics() {
	const tics = [
		{ exchange: 'binance', symbol: 'BTC/USDT', crypto: true },
		{ exchange: 'bytetrade', symbol: 'ETH/USDT', crypto: true },
		{ exchange: 'kraken', symbol: 'ADA/USDT', crypto: true },
		{ exchange: 'binance', symbol: 'CELO/USDT', crypto: true }
	];
	var tickers = [];
	for (let i = 0; i < tics.length; i++) {
		await tickers.push(new Ticker(tics[i]));
	}
	return tickers;
}

//the default tickers for the index page, so we don't create them each time.
module.exports.indexTics = async () => {
	return new Promise(async (resolve, reject) => {
		//Mongo Atlas tickers
		index = [
			'6083508e58dc46845fd96f16',
			'608350f758dc46845fd96f17',
			'6083513058dc46845fd96f18',
			'6083516358dc46845fd96f19',
			'608351a858dc46845fd96f1b'
		];
		//localhost tickers
		// index = [
		// 	'607a0941ca201219560f36d3',
		// 	'607a09bbca201219560f36d6',
		// 	'607a0993ca201219560f36d5',
		// 	'607a09d0ca201219560f36d7',
		// 	'607a0f5ecf0ac71a285f6c44'
		// ];
		var tickers = [];
		for await (tic of index) {
			var tics = await Ticker.findByIdAndUpdate({ _id: tic });
			tickers.push(tics);
		}
		resolve(tickers);
	});
};

//Takes in ticker Symbol, outputs ticker data
module.exports.updateTickers = async (ticker) => {
	const tickerObj = [];
	const exc = 'coinbase';
	if (!Array.isArray(ticker)) {
		ticker = [
			ticker
		];
	}
	//make sure the promise ticker has the right dimensions
	ticker = ticker.flat(1);

	//can this be moved to seperate fn to only be called once per user?
	const exchange = ticker.map((tic) => {
		return tic.crypto
			? new ccxt[tic.exchange]({
					enableRateLimit : true
				})
			: new ccxt[exc]();
	});

	// fetch('https://worldtimeapi.org/api/ip')
	// 	.then((response) => response.json())
	// 	.then((data) => console.log('worldtime api', data.dst, data.datetime));

	//this is were magic happens - exchange data into tic model and save
	const tickers = await awaitAll(exchange, ticker, fetchTic)
		.then((tickers) => {
			for (let i = 0; i < tickers.length; i++) {
				delete tickers[i].info;
				let market = { exchange: tickers[i].exchange, id: ticker[i]._id };
				if (!tickers[i].change) {
					if (tickers[i].last && tickers[i].open) {
						tickers[i].change = tickers[i].last - tickers[i].open;
					} else {
						tickers[i].change = 0.0;
					}
				}
				let { datetime } = tickers[i];
				// const lt = new Date();
				// console.log('local data?', lt, lt.toString());
				// let newoff = DateTime.local();
				// let offset = -(new Date().getTimezoneOffset() / 60);
				let dt = DateTime.fromISO(datetime);
				// const tme = dt.plus({ minutes: newoff });
				// console.log('time into offset', offset, 'new offset', newoff);
				// console.log('time into dom', dt);
				// console.log('time into readable offset', tme.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET));
				// console.log('time into readable no offset', dt.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET));

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
			``;
			return tickers;
		});

	if (!Array.isArray(tickers)) {
		tickers = [
			tickers
		];
	}
	//trying to catch errors if tics are not made - does not work though
	if (ticker.length != tickers.length) {
		const { redtics, deletedTics } = checkTics(tickers);
		tickers = redtics;
	}

	return tickers;
};

//variable length promise call holder
async function awaitAll(list, item, asyncFn) {
	const promises = [];
	for (let i = 0; i < list.length; i++) {
		promises.push(asyncFn(list[i], item[i]));
	}
	return Promise.all(promises);
}

//get current tic data from exchange
async function fetchTic(exchange, ticker) {
	try {
		let market = { exchange: ticker.exchange };
		var tic = await exchange.fetchTicker(ticker.symbol);
		return { ...market, ...tic };
	} catch (e) {
		console.error(e);
		return ticker;
	}
}

//save tics into model Ticker
async function saveTics(tickerObj) {
	try {
		var ticker = [];
		for await (tic of tickerObj) {
			try {
				// const { id } = tic;
				ticker.push(
					await Ticker.findByIdAndUpdate({ _id: tic.id }, { ...tic }, { new: true, useFindAndModify: false })
				);
			} catch (err) {
				console.log('Error in saving tic');
				console.log('ticker in error');
				console.log(ticker);
				// console.error(err);
				continue;
			}
		}
		return ticker; //should this be Ticker (the model?)
	} catch (err) {
		return err;
	}
}

//try and remove tics that were not properly made as they break app
async function checkTics(tickers) {
	const deletedTics = [];
	for (let i = 0; i < tickers.length; i++) {
		if (!tickers[i].length) {
			deletedTics.push(tickers[i].splice(i, 1));
		}
	}
	return { tickers, deletedTics };
}

//get market data from Market model
//This probably is not being used
module.exports.loadMarkets = async (exchange) => {
	for await (ex of exchange) {
		let loadMar = ex.load_markets();
	}
};
