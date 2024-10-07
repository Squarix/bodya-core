import knex, {Knex} from 'knex';
import cfg from 'config';
// import moment from 'moment';
//
// import pg from 'pg';
//
// const DATE_OID = 1082
// const TIMESTAMP_OID = 1114 // don't know if this is correct, just got it from jeff's response.
// pg.types.setTypeParser(DATE_OID, function(val: any) {
//     // For a DATE field, I only want the date
//     return val === null ? null : moment.utc(val).format('YYYY-MM-DD')
// });
//
// pg.types.setTypeParser(TIMESTAMP_OID, function(val: any) {
//     // Ensure no timezone
//     return val === null ? null : moment.utc(val).toDate()
// });




interface ShardedConnection {
    sharding: string;
}

export type ShardedConnectionConfig = Knex.ConnectionConfig & ShardedConnection;
export type DatabaseConfig = {
    connections: Array<Knex.ConnectionConfig & { name: string }>
    shardedConnections: Array<ShardedConnectionConfig>;
}


/*
* 1. define sharding property inside connection config
* 2. function will return suitable config
* 3. shardedConnection is locally cached.
* */
const shardingMap = new Map();
const shardingKnexMap = new Map<string, Knex>();
export const getShardedConnection = (config: DatabaseConfig, shard: number): Knex => {
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
                return +shard >= +from && +shard <= +to;
            }
        )
    );

    let shardedKnex;
    if (shardingKnexMap.has(shardedConnection.sharding)) {
        shardedKnex = shardingKnexMap.get(shardedConnection.sharding);
    } else {
        shardedKnex = knex(shardedConnection);
        shardingKnexMap.set(shardedConnection.sharding, shardedKnex);
    }

    if (!shardedConnection) {
        throw new Error(`Missing config for requested shard: ${shard}`);
    }

    shardingMap.set(shard, shardedKnex);
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
    const knexConnection = knex(connection);
    connectionMap.set(name, knexConnection);
    return knexConnection;
}
