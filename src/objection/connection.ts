import {Knex} from 'knex';
import cfg from 'config';

interface ShardedConnection {
    sharding: string;
}

export type ShardedConnectionConfig = Knex.ConnectionConfig & ShardedConnection;
export type DatabaseConfig = {
    connections: Array<Knex.ConnectionConfig & { name: string }>
    shardedConnections: Array<ShardedConnectionConfig>;
}

const shardingMap = new Map();

/*
* 1. define sharding property inside connection config
* 2. function will return suitable config
* 3. shardedConnection is locally cached.
* */
export const getShardedConnection = (config: DatabaseConfig, shard: number): ShardedConnectionConfig => {
    if (shardingMap.get(shard)) {
        return shardingMap.get(shard);
    }

    const shardedConnection = cfg.util.cloneDeep(
        config.shardedConnections.find(
            connection => {
                if (!connection.sharding) {
                    return;
                }

                const [from, to] = connection.sharding.split('-');
                return +from >= shard && +to >= shard;
            }
        )
    );

    if (!shardedConnection) {
        throw new Error(`Missing config for requested shard: ${shard}`);
    }

    shardingMap.set(shard, shardedConnection);
    return shardedConnection;
}

const connectionMap = new Map();
export const getKnexConnection = (name: string, config: DatabaseConfig) => {
    if (connectionMap.get(name)) {
        return connectionMap.get(name);
    }

    const connection = cfg.util.cloneDeep(
        config.connections.find(c => c.name === name),
    );
    connectionMap.set(name, connection);
    return connection;
}
