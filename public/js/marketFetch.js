const Markets = require.main.require('./models/markets.js'); //markets Model
const ccxt = require('ccxt'); //crypto api

//create the new markets docs for the Market Schema
module.exports.marketFetch = async () => {
	await Markets.deleteMany({});

	const excs = [
		'aax',
		'binance',
		'bittrex',
		'bitvavo',
		'bytetrade',
		'currencycom',
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
	return;
};

module.exports.loadMarkets = async (exchange) => {
	for await (ex of exchange) {
		let loadMar = ex.load_markets();
	}
};
