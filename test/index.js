var Sails = require('sails').Sails,
	chai = require('chai');

chai.should();

describe('Basic tests ::', function () {

	it ('can start sails without failure', function (done) {

		this.timeout(11000);

		Sails().lift({
			port: 1339,
			hooks: {
				ttl: require('../'),
				grunt: false
			},
			log: { level: 'silent' }
		}, function (err, sails) {
			sails.lower(function () {
				return done(err);
			});
		});

	});

	it ('throws an error if invoked with an unknown model', function (done) {

		this.timeout(11000);

		Sails().lift({
			port: 1339,
			hooks: {
				ttl: require('../'),
				grunt: false
			},
			ttl: {
				modelname: 1000
			},
			log: { level: 'silent' }
		}, function (err) {
			err.should.not.be.null;
			done();
		});

	});

});