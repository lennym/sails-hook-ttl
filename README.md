# sails-hook-ttl

Automatically set TTL properties on mongo models to expire records a certain time after creation.

## Installation

```shell
npm install --save sails-hook-ttl
```

Then the hook will automatically be bound into your project.

## Configuration

To add a ttl onto a model, simply provide the lifespan of the model (in seconds) as a property of the model

```javascript
module.exports = {
	connection: 'mongo',
	tableName: 'tokens',
	ttl: 3600,
	attributes: {
		...
	},
	...
}
```

The models will then have an index created to expire the record the configured time after the last update.

### Advanced Configuration

The ttl property on the model can also be set as an object to define if the lifesan of a record is measured from the last update or its creation.

```javascript
module.exports = {
	...
	ttl: {
		ttl: <ttl value in seconds>,
		since: 'create'
	},
	...
}
```

This will change the index to be based on the creation time of the record instead of the last updated. Available options are since `create` and `update`.
