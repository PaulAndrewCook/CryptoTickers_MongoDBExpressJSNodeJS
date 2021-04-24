const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const wrapAsync = require('../utils/catchAsync');
const user = require('../controllers/user');

router.route('/register').get(user.renderRegister).post(wrapAsync(user.register));

router
	.route('/login')
	.get(user.renderLogin)
	.post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), user.login);

router.get('/logout', user.logout);

module.exports = router;
