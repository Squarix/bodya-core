import {ShardedConfig, ShardedConnectionConfig} from "./sharding";

const shardingMap = new Map();

/*
* 1. define sharding property inside connection config
* 2. function will return suitable config
* 3. shardedConnection is locally cached.
* */
export const getShardedConnection = (config: ShardedConfig, shard: number): ShardedConnectionConfig => {
    if (shardingMap.get(shard)) {
        return shardingMap.get(shard);
    }

    const shardedConnection = config.connections.find(
        connection => {
            if (!connection.sharding) {
                return;
            }

            const [from, to] = connection.sharding.split('-');
            console.log('f: ', from, 't: ', to, 's: ', shard);
            return +from >= shard && +to >= shard;
        }
    );

    if (!shardedConnection) {
        throw new Error(`Missing config for requested shard: ${shard}`);
    }

    shardingMap.set(shard, shardedConnection);
    return shardedConnection;
}
