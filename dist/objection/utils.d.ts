import { ShardedConnectionConfig } from './connection';
import { AbstractShardedModel } from './AbstractShardedModel';
export declare const createDynamicModel: <T extends typeof AbstractShardedModel>(proto: T, tableName: string, connection: ShardedConnectionConfig) => T;
