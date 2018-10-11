
forman.prototype.errors = {};
forman.prototype.validate = function(){
	forman.clearErrors.call(this);
    _.each(this.fields, forman.validateItem)
	return this.valid;
};
forman.handleError = forman.update;
forman.validateItem = function(item){
	forman.performValidate(item);
	item.owner.errors[item.name] = item.errors;
	item.owner.valid = item.valid && item.owner.valid;
};
forman.performValidate = function(target, pValue){
	var item = target;
	var value = target.get();
	if(typeof pValue !== 'undefined'){value = pValue;}
	target.valid = true;
	target.errors = '';

	if(typeof item.validate !== 'undefined' && typeof item.validate === 'object' && item.parsable){
		for(var r in item.validate){
			if(!forman.validations[r].method.call(target, value, item.validate[r])){
				if((typeof item.show === 'undefined') || target.isVisible){
					target.valid = false;
					var estring = forman.validations[r].message;
					if(typeof item.validate[r] == 'string') {
						estring = item.validate[r];
					}
					target.errors = estring.replace('{{label}}', item.label);
				}
			}
			forman.handleError(target);
		}
	}
};
forman.clearErrors = function() {
	this.valid = true;
	this.errors = {};
	// this.form.querySelector("." + this.options.errorSelector).removeClass(this.options.errorSelector).find("." + this.options.errorTextSelector).html("");
};
//var ruleRegex = /^(.+)\[(.+)\]$/,
forman.regex = {
	numeric: /^[0-9]+$/,
	integer: /^\-?[0-9]+$/,
	decimal: /^\-?[0-9]*\.?[0-9]+$/,
	email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i,
	// alpha: /^[a-z]+$/i,
	// alphaNumeric: /^[a-z0-9]+$/i,
	// alphaDash: /^[a-z0-9_-]+$/i,
	// natural: /^[0-9]+$/i,
	// naturalNoZero: /^[1-9][0-9]*$/i,
	// ip: /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
	// base64: /[^a-zA-Z0-9\/\+=]/i,
	url: /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
	date: /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/,
};
forman.validations = {
	required:{
		method: function(value, args) {
			return this.satisfied(value);
		},
		message: 'The {{label}} field is required.'
	},
	matches:{
		method: function(value, matchName) {
			if (el == this.forman[matchName]) {
				return value === el.value;
			}
			return false;
		},
		message: 'The {{label}} field does not match the %s field.'
	},	
	date:{
		method: function(value, args) {
	        return (forman.regex.date.test(value) || value === '');
		},
		message: 'The {{label}} field should be in the format MM/DD/YYYY.'
	},
	valid_url:{
		method: function(value) {
			return (forman.regex.url.test(value) || value === '');
		},
		message: 'The {{label}} field must contain a valid Url.'
	},
	valid_email:{
		method: function(value) {
			return (forman.regex.email.test(value) || value === '');
		},
		message: 'The {{label}} field must contain a valid email address.'
	},
	valid_emails:{
		method: function(value) {
			var result = value.split(",");
			for (var i = 0; i < result.length; i++) {
				if (!forman.regex.email.test(result[i])) {
					return false;
				}
			}
			return true;
		},
		message: 'The {{label}} field must contain all valid email addresses.'
	},
	min_length:{
		method: function(value, length) {
			if (!forman.regex.numeric.test(length)) {
				return false;
			}
			return (value.length >= parseInt(length, 10));
		},
		message: 'The {{label}} field must be at least %s characters in length.'
	},
	max_length:{
		method: function(value, length) {
			if (!forman.regex.numeric.test(length)) {
				return false;
			}
			return (value.length <= parseInt(length, 10));
		},
		message: 'The {{label}} field must not exceed %s characters in length.'
	},
	exact_length:{
		method: function(value, length) {
			if (!forman.regex.numeric.test(length)) {
				return false;
			}
			return (value.length === parseInt(length, 10));
		},
		message: 'The {{label}} field must be exactly %s characters in length.'
	},
	greater_than:{
		method: function(value, param) {
			if (!forman.regex.decimal.test(value)) {
				return false;
			}
			return (parseFloat(value) > parseFloat(param));
		},
		message: 'The {{label}} field must contain a number greater than %s.'
	},
	less_than:{
		method: function(value, param) {
			if (!forman.regex.decimal.test(value)) {
				return false;
			}
			return (parseFloat(value) < parseFloat(param));
		},
		message: 'The {{label}} field must contain a number less than %s.'
	},
	numeric:{
		method: function(value) {
			return (forman.regex.decimal.test(value) || value === '');
		},
		message: 'The {{label}} field must contain only numbers.'
	},
	// alpha:{
	// 	method: function(value) {
	// 		return (forman.regex.alpha.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must only contain alphabetical characters.'
	// },
	// alpha_numeric:{
	// 	method: function(value) {
	// 		return (forman.regex.alphaNumeric.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must only contain alpha-numeric characters.'
	// },
	// alpha_dash:{
	// 	method: function(value) {
	// 		return (forman.regex.alphaDash.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must only contain alpha-numeric characters, underscores, and dashes.'
	// },
	// integer:{
	// 	method: function(value) {
	// 		return (forman.regex.integer.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain an integer.'
	// },
	// decimal:{
	// 	method: function(value) {
	// 		return (forman.regex.decimal.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain a decimal number.'
	// },
	// is_natural:{
	// 	method: function(value) {
	// 		return (forman.regex.natural.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain only positive numbers.'
	// },
	// is_natural_no_zero:{
	// 	method: function(value) {
	// 		return (forman.regex.naturalNoZero.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain a number greater than zero.'
	// },
	// valid_ip:{
	// 	method: function(value) {
	// 		return (forman.regex.ip.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain a valid IP.'
	// },
	// valid_base64:{
	// 	method: function(value) {
	// 		return (forman.regex.base64.test(value) || value === '');
	// 	},
	// 	message: 'The {{label}} field must contain a base64 string.'
	// }
};