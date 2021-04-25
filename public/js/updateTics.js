// var DateTime = luxon.DateTime;
var tickerObj = [];
var intervalId;
var status = 'updating';

//get the elements that need to be listened to or updated
const update = document.querySelector('#autoUpdate');
//check to see how long ago the tickers were updated
//updates when greater than duration (min)
const duration = 5;
const updateDom = timeCheck(duration);

// status = 'updating';
// updateBtn();

// var asdf = document.getElementById('updateScript').getAttribute('ticker');
document.addEventListener('DOMContentLoaded', async function() {
	if (updateDom === true) {
		getTicData()
			.then((response) => {
				status = 'stop';
				updateBtn();
			})
			.catch((error) => {
				// handle error
				status = 'stop';
				updateBtn();
				update.innerText = 'Error';
				console.log(error);
			});
	} else {
		status = 'stop';
		updateBtn();
	}
});

//update all the elements and push objects into single element for saving
update.addEventListener('click', async function() {
	if (this.classList.contains('static')) {
		status = 'updating';
		updateBtn();
		goLive();
	} else {
		stopUpdate();
	}
});

//check the time and run the update if it's been awhile
function timeCheck(duration) {
	const dateTic = JSON.parse(ticker);

	var date1 = new Date();
	var date2 = Date.parse(dateTic[0].datetime);
	if (date1 - date2 > duration * 60 * 1000) {
		return true;
	} else {
		return false;
	}
}

function stopUpdate() {
	console.log('Please stop here');
	clearInterval(intervalId);
	status = 'stop';
	updateBtn();
}

function getTicData() {
	var tickers = JSON.parse(ticker);
	const params = new URLSearchParams();
	params.append('tickers', ticker);

	return Promise.all([
		//axios puts everything into a string - for nested objects we need to use URLSearchParams.
		//modified axios to hit relative route instead of 'http://localhost:3000/investments/updateTics'
		axios
			.post('/investments/updateTics', params)
			.then((tics) => {
				const t = [];
				for (let i = 0; i < tics.data.length; i++) {
					t.push(tics.data[i]);
				}
				domUpdate(t);
			})
			.then((response) => {
				return response;
			})
			.catch((error) => {
				// handle error
				return error;
			})
	]);
}

async function goLive() {
	status = 'live';
	intervalId = setInterval(getTicData, 10000);
}

//we can now grab the correct elements by serching within the selected div
async function domUpdate(tickers) {
	try {
		for (tic of tickers) {
			const div = document.getElementById(tic._id);
			const last = document.getElementById(`${tic._id}_last`);
			const change = document.getElementById(`${tic._id}_change`);
			const time = document.getElementById(`${tic._id}_time`);
			last.innerText = `$${tic.last.toFixed(2)}`;
			change.innerText = `$${tic.change.toFixed(2)}`;

			time.innerHTML = `Reported: <span class="text-info"> ${tic.time} </span>`;
			// time.classList.add('text-info');
			// time.classList.remove('text-muted');

			updateBtn();
			updateClr(change);
		}
	} catch (e) {
		console.log('error report');
		console.log(e);
		return e;
	}
}

function updateBtn() {
	console.log('update call start', status, update.classList);
	if (status === 'live') {
		update.classList.remove('bg-warning', 'searching');
		update.classList.add('live', 'bg-success');
	} else if (status === 'updating') {
		update.classList.remove('static');
		update.classList.add('bg-warning', 'searching');
	} else if (status === 'stop') {
		update.classList.remove('bg-success', 'live', 'bg-warning', 'searching');
		update.classList.add('static');
	}
	console.log('update call end', status, update.classList);
}

function updateClr(tic) {
	const value = parseFloat(tic.innerHTML.replace(/\$/g, ''));
	if (value > 0) {
		tic.classList.remove('loss');
		tic.classList.add('gain');
	} else if (value < 0) {
		tic.classList.remove('gain');
		tic.classList.add('loss');
	} else {
		tic.classList.remove('gain');
		tic.classList.remove('loss');
	}
}
