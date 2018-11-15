gform.processConditions = function(conditions, func) {
	if (typeof conditions === 'string') {
		if(conditions === 'display' || conditions === 'enable'  || conditions === 'parse') {
			conditions = this.item[conditions];
		}else if(conditions === 'enable') {
			conditions = this.item.enable;
		}
	}
	if (typeof conditions === 'boolean') {
		return conditions;
	}
	if (typeof conditions === 'function') {
		return conditions(this.owner, this)
	}
	if (typeof conditions === 'object') {
		// return _.map(conditions, function(item, c){
		// 	return gform.conditions[c].call(this, this.owner, item, (func || item.callBack))
		// }.bind(this))
		// debugger;
		var callback = function(rules,func){
			func.call(this,gform.rules.call(this, rules, func))
		}.bind(this, conditions, func)


// debugger;
		for(var i in conditions) {
			this.owner.sub('change:' + _.values(conditions[i])[0].name, callback)
		}
		
	}
	
	return true;
};

gform.rules = function(rules,func){
return _.every(_.map(rules, function(rule, i){
	return _.every(_.map(rule, function(args,name,rule) {
		return gform.conditions[name](this.owner, this, args)
	}.bind(this)));
}.bind(this)))
}

gform.conditions = {
	requires: function(gform, args, func) {
		return gform.sub('change:' + args.name, function(args, local, topic, token) {
				func.call(this, local.find(args.path).satisfied(), token);
			}.bind(this, args)
		);
	},
	// valid_previous: function(gform, args) {},
	not_matches: function(gform , args, func) {
		return gform.sub('change:' + args.name, function(args, local, topic, token) {
				func.call(this, (args.value  !== local.value), token);
			}.bind(this, args)
		);
	},
	test: function(gform, args, func) {
		return gform.sub('change:' + args.name, function(args, local, topic, token) {
				func.call(this, args.callback(), token);
			}.bind( this, args)
		);
	},
	contains: function(gform , args, func) {
		return gform.sub('change:' + args.name, function(args, local, topic, token) {
				func.call(this, (typeof local.value !== 'undefined'  && local.value.indexOf(args.value) !== -1 ), token);
			}.bind( this, args)
		).lastToken;
	},
	matches: function(gform, field, args) {
		var val = args.value;
		var localval = gform.toJSON()[args.name];

		if(typeof val== "object" && localval !== null){
			return (val.indexOf(localval) !== -1);
		}else{
			return (val == localval);
		}
	}
}; 

