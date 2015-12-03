# sails-hook-ttl

Automatically set TTL properties on mongo models to expire records a certain time after creation.

## Installation

```shell
npm install --save sails-hook-ttl
```

Then the hook will automatically be bound into your project.

## Configuration

Create a config file at ./config/ttl.js containing the following:

```javascript
module.exports.ttl = {
	<modelname>: <ttl value in seconds>
}
```

The configured tables will then have an index created to expire the record the configured time after the last update.

### Advanced configuration

```javascript
module.exports.ttl = {
	<modelname>: {
		ttl: <ttl value in seconds>,
		since: 'create'
	}
}
```

This will change the index to be based on the creation time of the record instead of the last updated. Available options are since `create` and `update`.
