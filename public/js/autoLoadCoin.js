/*the loadSymbols takes the hidden market symbol values,
    and loads them into the form when the select input is clicked:*/

const arr = [
	'Bitcoin(BTC)',
	'Ethereum (ETH)',
	'Litecoin (LTC)',
	'Cardano (ADA)',
	'Polkadot (DOT)',
	'Bitcoin Cash (BCH)',
	'Stellar (XLM)',
	'Chainlink (LINK)',
	'Binance Coin (BNB)',
	'Tether (USDT)',
	'Monero (XMR)',
	'Celo (CELO)'
];

document.addEventListener('DOMContentLoaded', function() {
	loadCoin();
});

function loadCoin() {
	const c = document.querySelector('.comCoin');

	for (i = 0; i < arr.length; i++) {
		d = document.createElement('DIV');
		d.setAttribute('class', 'px-2');
		d.innerHTML = '<h5>' + arr[i] + '</h5>';
		c.appendChild(d);
	}
}
