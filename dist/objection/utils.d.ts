import { AbstractShardedModel } from './AbstractShardedModel';
import { Knex } from 'knex';
export declare const createDynamicModel: <T extends typeof AbstractShardedModel>(proto: T, tableName: string, connection: Knex) => T;
