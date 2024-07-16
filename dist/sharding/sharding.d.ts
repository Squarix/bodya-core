import { Knex } from 'knex';
interface ShardedConnection {
    sharding: string;
}
export type ShardedConnectionConfig = Knex.ConnectionConfig & ShardedConnection;
export type ShardedConfig = {
    connections: ShardedConnectionConfig[];
};
export {};
