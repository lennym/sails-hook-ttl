var async = require('async');

var sinceOptions = {
	create: 'createdAt',
	update: 'updatedAt'
};

module.exports = function ttl(sails) {

	function setTTL(model, ttl, since, callback) {
		sails.log.verbose('setting ttl on ' + model + ' collection to ' + ttl);

		since = since || 'updatedAt';

		//throw an error if the model does not exist
		if (!sails.models[model]) {
			return callback(new Error('Unknown model name: ' + model));
		}

		sails.models[model].native(function (err, collection) {
			if (err) { return callback(err); }
			var index = {};
			index[since] = 1;
			collection.dropIndex({ createdAt: 1 })
			.then(function () {
				return collection.dropIndex({ updatedAt: 1 });
			})
			.catch(function () {/* ignore index removal errors */})
			.then(function () {
				return collection.createIndex(index, { expireAfterSeconds: ttl });
			})
			.then(function () {
				callback();
			})
			.catch(callback);
		});
	}

	return {

		defaults: {
			__configKey__: {}
		},

		initialize: function (callback) {
			var config = sails.config[this.configKey];
			sails.after('hook:orm:loaded', function () {
				sails.log.verbose('initializing model ttl');
				async.each(Object.keys(config), function (key, cb) {
					var value = config[key],
						since = 'update',
						ttl;
					if (typeof value === 'number') {
						ttl = value;
					} else if (typeof value === 'object' && typeof value.ttl === 'number') {
						ttl = value.ttl
						since = value.since || 'update';
					} else {
						return cb(new Error('invalid ttl configuration for model ' + key));
					}
					setTTL(key, ttl, sinceOptions[since], cb);
				}, function (err) {
					sails.log.verbose('finished setting model ttl');
					callback(err);
				});
			});
		}

	};

}
