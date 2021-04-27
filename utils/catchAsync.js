//middleware to catch any async function errors thrown and send to error page

module.exports = (func) => {
	return (req, res, next) => {
		func(req, res, next).catch(next);
	};
};
