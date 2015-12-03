var Sails = require('sails'),
	sinon = require('sinon'),
	chai = require('chai');

chai.should();
chai.use(require('sinon-chai'));

var Stubs = require('./utils/Stubs');

var hook = require('../');

describe('sails-hook-ttl', function () {

	it ('sails can start with hook installed without failure', function (done) {

		this.timeout(11000);

		Sails.lift({
			port: 1339,
			hooks: {
				ttl: hook,
				grunt: false
			},
			log: { level: 'silent' }
		}, function (err, sails) {
			if (!err) {
				sails.lower(done);
			} else {
				done(err);
			}
		});

	});

	describe ('hook', function () {

		var sails;

		beforeEach(function () {
			sails = {
				config: {
					ttl: {
						testmodel: 1000
					}
				},
				log: {
					verbose: sinon.stub()
				},
				models: {
					testmodel: new Stubs.Model()
				},
				after: sinon.stub().withArgs('hook:orm:loaded').yieldsAsync()
			};
		});

		it('calls callback if no ttls are configured', function (done) {
			sails.config.ttl = {};
			hook(sails).initialize.call({ configKey: 'ttl' }, done);
		});

		it('throws an error if configured with unknown model', function (done) {
			sails.config.ttl.unknown = 100;
			hook(sails).initialize.call({ configKey: 'ttl' }, function (e) {
				e.should.be.an.instanceOf(Error);
				done();
			});
		});

		it('throws an error if configured with non-numeric ttl', function (done) {
			sails.config.ttl.testmodel = 'foo';
			hook(sails).initialize.call({ configKey: 'ttl' }, function (e) {
				e.should.be.an.instanceOf(Error);
				done();
			});
		});

		it('throws an error if configured as object with non-numeric ttl', function (done) {
			sails.config.ttl.testmodel = {
				ttl: 'foo',
				since: 'create'
			};
			hook(sails).initialize.call({ configKey: 'ttl' }, function (e) {
				e.should.be.an.instanceOf(Error);
				done();
			});
		});

		it('creates an index with the configured properties on the table', function (done) {
			hook(sails).initialize.call({ configKey: 'ttl' }, function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 1000 });
				done();
			});
		});

		it('can handle objects as configuration', function (done) {
			sails.config.ttl.testmodel = {
				ttl: 5000
			};
			hook(sails).initialize.call({ configKey: 'ttl' }, function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 5000 });
				done();
			});
		});

		it('can be configured to use createdAt as index property', function (done) {
			sails.config.ttl.testmodel = {
				ttl: 10000,
				since: 'create'
			};
			hook(sails).initialize.call({ configKey: 'ttl' }, function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ createdAt: 1 }, { expireAfterSeconds: 10000 });
				done();
			});
		});

		it('removes any existing createdAt and updatedAt indexes', function (done) {
			hook(sails).initialize.call({ configKey: 'ttl' }, function () {
				sails.models.testmodel.collection.dropIndex.should.have.been.calledWith({ createdAt: 1 });
				sails.models.testmodel.collection.dropIndex.should.have.been.calledWith({ updatedAt: 1 });
				done();
			});
		});

		it('can handle multiple models', function () {
			sails.config.ttl.anothermodel = {
				ttl: 10000,
				since: 'create'
			};
			hook(sails).initialize.call({ configKey: 'ttl' }, function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 100 });
				sails.models.anothermodel.collection.createIndex.should.have.been.calledWith({ createdAt: 1 }, { expireAfterSeconds: 10000 });
				done();
			});
		});

	});

});