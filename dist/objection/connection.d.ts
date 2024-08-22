import { Knex } from 'knex';
interface ShardedConnection {
    sharding: string;
}
export type ShardedConnectionConfig = Knex.ConnectionConfig & ShardedConnection;
export type DatabaseConfig = {
    connections: Array<Knex.ConnectionConfig & {
        name: string;
    }>;
    shardedConnections: Array<ShardedConnectionConfig>;
};
export declare const getShardedConnection: (config: DatabaseConfig, shard: number) => Knex;
export declare const getKnexConnection: (name: string, config: DatabaseConfig) => any;
export {};
