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
					models: { migrate: 'drop' }
				},
				log: {
					verbose: sinon.stub()
				},
				models: {
					testmodel: new Stubs.Model()
				},
				after: sinon.stub().withArgs('hook:orm:loaded').yieldsAsync()
			};
			sails.models.testmodel.ttl = 100;
		});

		it('calls callback if no ttls are configured', function (done) {
			hook(sails).initialize(done);
		});

		it('parse ttls as duration strings', function (done) {
			sails.models.testmodel.ttl = '1h';
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 3600 });
				done();
			});
		});

		it('throws an error if configured with non-numeric ttl', function (done) {
			sails.models.testmodel.ttl = 'foo';
			hook(sails).initialize(function (e) {
				e.should.be.an.instanceOf(Error);
				done();
			});
		});

		it('throws an error if configured as object with non-numeric ttl', function (done) {
			sails.models.testmodel.ttl = {
				ttl: 'foo',
				since: 'create'
			};
			hook(sails).initialize(function (e) {
				e.should.be.an.instanceOf(Error);
				done();
			});
		});

		it('creates an index with the configured properties on the table', function (done) {
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 100 });
				done();
			});
		});

		it('can handle objects as configuration', function (done) {
			sails.models.testmodel.ttl = {
				ttl: 5000
			};
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 5000 });
				done();
			});
		});

		it('can be configured to use createdAt as index property', function (done) {
			sails.models.testmodel.ttl = {
				ttl: 10000,
				since: 'create'
			};
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledOnce;
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ createdAt: 1 }, { expireAfterSeconds: 10000 });
				done();
			});
		});

		it('removes any existing createdAt and updatedAt indexes', function (done) {
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.dropIndex.should.have.been.calledWith({ createdAt: 1 });
				sails.models.testmodel.collection.dropIndex.should.have.been.calledWith({ updatedAt: 1 });
				done();
			});
		});

		it('can handle multiple models', function (done) {
			sails.models.anothermodel = new Stubs.Model();
			sails.models.anothermodel.ttl = {
				ttl: 10000,
				since: 'create'
			};
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.createIndex.should.have.been.calledWith({ updatedAt: 1 }, { expireAfterSeconds: 100 });
				sails.models.anothermodel.collection.createIndex.should.have.been.calledWith({ createdAt: 1 }, { expireAfterSeconds: 10000 });
				done();
			});
		});

		it('does nothing if model config is set to "safe"', function (done) {
			sails.config.models.migrate = 'safe';
			hook(sails).initialize(function () {
				sails.models.testmodel.collection.dropIndex.should.not.have.been.called;
				sails.models.testmodel.collection.createIndex.should.not.have.been.called;
				done();
			});
		});

	});

});