const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

//joi schema for linking models
const extension = (joi) => ({
	type     : 'string',
	base     : joi.string(),
	messages : {
		'string.escapeHTML' : '{{#label}} must not include HTML!'
	},
	rules    : {
		escapeHTML : {
			validate(value, helpers) {
				const clean = sanitizeHtml(value, {
					allowedTags       : [],
					allowedAttributes : {}
				});
				if (clean !== value) return helpers.error('string.escapeHTML', { value });
				return clean;
			}
		}
	}
});

const Joi = BaseJoi.extend(extension);

//linking of models
module.exports.investmentsSchema = Joi.object({
	currency : Joi.object({
		exchange : Joi.string().required().escapeHTML(),
		symbol   : Joi.string().required().escapeHTML(),
		crypto   : Joi.boolean()
	}),
	stock    : Joi.object({
		symbol : Joi.string().escapeHTML(),
		crypto : Joi.boolean()
	})
});
