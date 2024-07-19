"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKnexConnection = exports.createDynamicModel = void 0;
const knex_1 = require("knex");
const createDynamicModel = (proto, tableName, connection) => {
    const model = Object.create(proto);
    Object.assign(model, {
        tableName: () => {
            return tableName;
        },
    });
    model.knex((0, knex_1.knex)(connection));
    return model;
};
exports.createDynamicModel = createDynamicModel;
const createKnexConnection = (name, connections) => {
};
exports.createKnexConnection = createKnexConnection;
