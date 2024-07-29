import {ShardedConnectionConfig} from './connection';
import {AbstractShardedModel} from './AbstractShardedModel';
import {knex} from 'knex';

// eslint-disable-next-line @typescript-eslint/ban-types
function createClassInheritor(className: string): Function {
    return new Function(
        'BaseClass',
        `
    'use strict';
    return class ${className} extends BaseClass {}
  `);
}

export const createDynamicModel = <T extends typeof AbstractShardedModel>(proto: T, tableName: string, connection: ShardedConnectionConfig): T => {
    console.log(proto.name);
    const inheritor = createClassInheritor(proto.name);
    const model = inheritor(proto);
    model['tableName'] = () => {return tableName};
    model.knex(knex(connection));
    return model;
}