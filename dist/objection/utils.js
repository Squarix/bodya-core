"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDynamicModel = void 0;
const knex_1 = require("knex");
// eslint-disable-next-line @typescript-eslint/ban-types
function createClassInheritor(className) {
    return new Function('BaseClass', `
    'use strict';
    return class ${className} extends BaseClass {}
  `);
}
const createDynamicModel = (proto, tableName, connection) => {
    console.log(proto.name);
    const inheritor = createClassInheritor(proto.name);
    const model = inheritor(proto);
    model['tableName'] = () => { return tableName; };
    model.knex((0, knex_1.knex)(connection));
    return model;
};
exports.createDynamicModel = createDynamicModel;
