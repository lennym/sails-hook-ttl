var sinon = require('sinon'),
	Promise = require('bluebird');

function Model() {
	this.collection = new Collection();
}

Model.prototype.native = function (callback) {
	callback(null, this.collection);
}

Model.prototype.mongo = {
	ObjectId: function() {}
}

function Collection() {
	this.dropIndex.reset();
	this.createIndex.reset();
}

Collection.prototype.dropIndex = sinon.stub().returns(Promise.resolve())
Collection.prototype.createIndex = sinon.stub().returns(Promise.resolve())

module.exports = {
	Model: Model,
	Collection: Collection
};
