import { Model } from 'objection';
import { ShardedConnectionConfig } from '../sharding/sharding';
import { AbstractShardedModel } from './AbstractShardedModel';
export declare const createDynamicModel: (proto: typeof AbstractShardedModel, tableName: string, connection: ShardedConnectionConfig) => typeof Model;
