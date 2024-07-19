import { Model } from 'objection';
import { ShardedConnectionConfig } from './connection';
import { AbstractShardedModel } from './AbstractShardedModel';
import { Knex } from 'knex';
export declare const createDynamicModel: (proto: typeof AbstractShardedModel, tableName: string, connection: ShardedConnectionConfig) => typeof Model;
export declare const createKnexConnection: (name: string, connections: Array<Knex.ConnectionConfig | ShardedConnectionConfig>) => void;
