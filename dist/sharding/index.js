"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShardedConnection = void 0;
const shardingMap = new Map();
/*
* 1. define sharding property inside connection config
* 2. function will return suitable config
* 3. shardedConnection is locally cached.
* */
const getShardedConnection = (config, shard) => {
    if (shardingMap.get(shard)) {
        return shardingMap.get(shard);
    }
    const shardedConnection = config.connections.find(connection => {
        if (!connection.sharding) {
            return;
        }
        const [from, to] = connection.sharding.split('-');
        return +from >= shard && +to >= shard;
    });
    if (!shardedConnection) {
        throw new Error(`Missing config for requested shard: ${shard}`);
    }
    shardingMap.set(shard, shardedConnection);
    return shardedConnection;
};
exports.getShardedConnection = getShardedConnection;
