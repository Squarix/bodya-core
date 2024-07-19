"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractShardedModel = void 0;
const connection_1 = require("./connection");
const utils_1 = require("./utils");
const objection_1 = require("objection");
const shardedModelMap = new Map();
class AbstractShardedModel extends objection_1.Model {
    static get idColumn() {
        return 'id';
    }
    static getTableNameTemplate() {
        throw new Error('Tablename template must be implemented');
    }
    static getShardedTableName(shard) {
        return `${this.getTableNameTemplate()}_${shard}`;
    }
    static useShard(config, shard) {
        const tableName = this.getShardedTableName(shard);
        const cachedModel = shardedModelMap.get(tableName);
        if (cachedModel) {
            return cachedModel;
        }
        const connection = (0, connection_1.getShardedConnection)(config, shard);
        const model = (0, utils_1.createDynamicModel)(this, tableName, connection);
        shardedModelMap.set(tableName, model);
        return model;
    }
}
exports.AbstractShardedModel = AbstractShardedModel;
