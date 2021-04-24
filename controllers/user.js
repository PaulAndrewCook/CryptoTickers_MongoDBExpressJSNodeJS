const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
	const pageName = 'register';
	res.render('users/register', { pageName });
};

module.exports.register = async (req, res, next) => {
	try {
		const { email, username, password } = req.body;
		const user = new User({ email, username });
		const regisUser = await User.register(user, password);
		req.login(regisUser, (err) => {
			if (err) return next(err);
		});
		req.flash('success', `Welcome to your Investments, ${regisUser.username}!`);
		res.redirect('/investments');
	} catch (e) {
		req.flash('error', e.message);
		res.redirect('register');
	}
};

module.exports.renderLogin = (req, res) => {
	const pageName = 'register';
	res.render('users/login', { pageName });
};

module.exports.login = (req, res) => {
	req.flash('success', `Welcome back ${req.body.username}`);
	const redirectUrl = req.session.returnTo || '/investments/home';
	delete req.session.returnTo;
	res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'Goodbye! See you again soon!');
	res.redirect('/investments');
};
