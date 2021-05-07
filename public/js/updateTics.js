//is called via script in DOM of index / home ejs file
//gets current tic data, axios api call to get updated data, updates DOM with new info
//also updates the tic status button accordingly

// var DateTime = luxon.DateTime;
//global variables
var tickerObj = [];
var intervalId;
var status = 'updating';

//get the elements that need to be listened to or updated
const update = document.querySelector('#autoUpdate');

//check to see how long ago the tickers were updated
//updates when greater than duration (min)
const duration = 5;
const updateDom = timeCheck(duration);

//eventlistener fires when DOM is ready
//checks if tics need updating and responds
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

//stop the auto updting (live feature)
function stopUpdate() {
	console.log('Please stop here');
	clearInterval(intervalId);
	status = 'stop';
	updateBtn();
}

//parse in tickers sent from Node to DOM,
//send tic data for update via axios api
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

//automatically update the tickers
async function goLive() {
	status = 'live';
	intervalId = setInterval(getTicData, 10000);
}

//update each ticker when we have new info
async function domUpdate(tickers) {
	try {
		for (tic of tickers) {
			const div = document.getElementById(tic._id);
			const last = document.getElementById(`${tic._id}_last`);
			const change = document.getElementById(`${tic._id}_change`);
			const time = document.getElementById(`${tic._id}_time`);
			const date = document.getElementById(`${tic._id}_date`);
			if (last) {
				last.innerText = `$${tic.last.toFixed(2)}`;
				change.innerHTML = `<small class="text-muted"> change: </small>$${tic.change.toFixed(2)}`;
			}
			let dt = DateTime.fromISO(tic.datetime);
			let nt = dt.toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);
			let cldt = dt.toLocaleString(DateTime.DATE_MED);

			date.innerText = cldt;
			time.innerHTML = `Reported: <span class="text-info"> ${nt} </span>`;
			// time.innerHTML = `Reported: <span class="text-info"> ${tic.time} </span>`;

			updateBtn();
			updateClr(change);
		}
	} catch (e) {
		console.log('error report');
		console.log(e);
		return e;
	}
}

//manages the text and colors of update btn via classes and css rules
function updateBtn() {
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
}

//changes the color of the latest price
function updateClr(tic) {
	if (tic) {
		const value = parseFloat(tic.innerText.replace(/.*\$/g, ''));
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
}
