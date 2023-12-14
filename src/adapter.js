// @ts-check
// the JSON adapter is much different from other adapters, as a command and respective arguments aren't used, everything is done within this program rather than
// being expected to be sent to a database server. Therefore, many of the types will be casted and what is returned from each of the serialization functions
// will not reflect what would actually be sent.
import _ from 'lodash-es';

/**
 * Structure for a model that needs to be passed into the adapter when instantiating a `KinshipContext` class object connected to the `json-adapter`.
 * @typedef {object} JsonDatabase
 * @prop {Record<string, Record<string, import("@kinshipjs/core/adapter").SchemaColumnDefinition>>} $schema
 * Schema of the database
 * @prop {Record<string, object[]>} $data
 * Actual data itself, stored as an array of objects representing the corresponding schema for the table.
 */

/**
 * Uses `Kinship`'s WHERE clause properties (built from `.where()`) to recursively check if the object should stay or not within the context of the "command".  
 * Unlike SQL, this function short circuits if an OR condition has been met and the last condition was true (or if an AND condition is met and the last condition was false)
 * @param {any} m
 * Model that is being checked if it should stay in the array.
 * @param {any} props
 * Properties that are being checked for filtering (this is received from `Kinship`'s where clause built)
 * @prop {boolean} stays
 * Boolean handled recursively to keep track of whether the object should stay or not.
 */
function filterFn(m, props, stays=true) {
    if(props) {
        for(const prop of props) {
            // short circuit
            if(!stays && (prop.chain === "WHERE" || prop.chain === "WHERE NOT" || prop.chain === "AND" || prop.chain === "AND NOT")) {
                return stays;
            }
            if(stays && (prop.chain === "OR" || prop.chain === "OR NOT")) {
                return stays;
            }
            if(Array.isArray(prop)) {
                stays = filterFn(m, prop, stays);
            } else {
                switch(prop.operator) {
                    case "<": {
                        if(prop.value === null) {
                            stays = false;
                            break;
                        }
                        stays = m[prop.property] < prop.value;
                        break;
                    }
                    case "<=": {
                        if(prop.value === null) {
                            stays = false;
                            break;
                        }
                        stays = m[prop.property] <= prop.value;
                        break;
                    }
                    case ">": {
                        if(prop.value === null) {
                            stays = false;
                            break;
                        }
                        stays = m[prop.property] > prop.value;
                        break;
                    }
                    case ">=": {
                        if(prop.value === null) {
                            stays = false;
                            break;
                        }
                        stays = m[prop.property] >= prop.value;
                        break;
                    }
                    case "<>": {
                        stays = m[prop.property] !== prop.value;
                        break;
                    }
                    case "=": {
                        stays = m[prop.property] === prop.value;
                        break;
                    }
                    case "BETWEEN": {
                        if(prop.value === null) {
                            stays = false;
                            break;
                        }
                        stays = m[prop.property] <= prop.value && m[prop.property] >= prop.value;
                        break;
                    }
                    case "IN": {
                        if(prop.value === null || !Array.isArray(prop.value)) {
                            stays = false;
                            break;
                        }
                        stays = prop.value.includes(m[prop.property]);
                        break;
                    }
                    case "IS": {
                        stays = m[prop.property] === null;
                        break;
                    }
                    case "IS NOT": {
                        stays = m[prop.property] !== null;
                        break;
                    }
                    case "LIKE": {
                        if(prop.value === null || typeof prop.value !== "string") {
                            stays = false;
                            break;
                        }
                        stays = new RegExp(prop.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\%/g, ".*"), "g").test(m[prop.property]);
                        break;
                    }
                }
            }
        }
        return stays;
    }
    return true;
};

const groupBy = keys => array =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = keys.map(key => obj[key]).join('-');
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

/** 
 * Adapter for `Kinship` with intended use on JavaScript objects.
 * @type {import('@kinshipjs/core/adapter').InitializeAdapterCallback<JsonDatabase>} 
 */
export function adapter(configuration) {
    return {
        syntax: {
            dateString: (date) => /** @type {any} */ (date)
        },
        aggregates: {
            avg: (table, col) => ``,
            count: (table, col) => ``,
            max: (table, col) => ``,
            min: (table, col) => ``,
            sum: (table, col) => ``,
            total: ``
        },
        execute(scope) {
            return {
                async forQuery(cmd, args) {
                    return /** @type {any} */ (args);
                },
                async forInsert(cmd, args) {
                    const [commit] = /** @type {[(cnn: JsonDatabase) => number[]]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forUpdate(cmd, args) {
                    const [commit] = /** @type {[(cnn: JsonDatabase) => number]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forDelete(cmd, args) {
                    const [commit] = /** @type {[(cnn: JsonDatabase) => number]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forTruncate(cmd, args) {
                    const [commit] = /** @type {[(cnn: JsonDatabase) => number]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forDescribe(cmd, args) {
                    return /** @type {any} */ (args);
                },
                forTransaction() {
                    const r = {
                        begin() {
                            return JSON.parse(JSON.stringify(configuration));
                        },
                        commit(transaction) {
                            configuration.$data = _.merge(transaction?.$data, configuration.$data);
                        },
                        rollback(transaction) {
                            // nothing happens.
                        }
                    };
                    return r;
                }
            }
        },
        serialize() {
            return {
                forQuery(data) {
                    let { where, group_by, order_by, limit, offset, select, from } = data;
                    let [mainTable, ...remainingTables] = from;

                    // @TODO: apply from (look for like primary keys then map property names to the aliased versions.)


                    // apply where
                    /** @type {any[]} */
                    let results = configuration.$data[mainTable.realName].filter(v => filterFn(v, where));

                    // apply group by
                    if(group_by) {
                        results = groupBy(group_by.map(col => col.alias))(results);
                    }

                    // apply sort by
                    if(order_by) {
                        for(const prop of order_by) {
                            results = results.sort((a,b) => {
                                if(prop.direction === "DESC") {
                                    [b,a] = [a,b];
                                }
                                switch(typeof a[prop.alias]) {
                                        case "string": {
                                            return a[prop.alias].localeCompare(b[prop.alias]);
                                        }
                                        case "boolean": {
                                            return a[prop.alias] - b[prop.alias];
                                        }
                                        case "object": {
                                            if(a[prop.alias] instanceof Date) {
                                                return a[prop.alias].getTime() - b[prop.alias].getTime();
                                            } else {
                                                throw Error(`Unexpected datatype.`);
                                            }
                                        }
                                        case "bigint": {
                                            return a[prop.alias] - b[prop.alias];
                                        }
                                        case "number": {
                                            return a[prop.alias] - b[prop.alias];
                                        }
                                        default: {
                                                throw Error(`Unexpected datatype.`);
                                        }
                                    }
                            });
                        }
                    }

                    // apply offset and limit
                    if(offset) {
                        if(limit) {
                            results = results.slice(offset, offset+limit);
                        } else {
                            results = results.slice(offset);
                        }
                    } else {
                        if(limit) {
                            results = results.slice(0, limit);
                        }
                    }
                    
                    // apply select (map)
                    if(select[0].alias === '$$count') {
                        results = [{ $$count: results.length }];
                    } else {
                        results = results.map(r => {
                            let o = {};
                            for(const column of select) {
                                if("aggregate" in column) continue;
                                o[column.alias] = r[column.alias];
                            }
                            return o;
                        });
                    }

                    return {
                        cmd: `No command available.`,
                        args: results
                    }
                },
                forInsert(data) {
                    /** @param {JsonDatabase} configuration */
                    const commit = (configuration) => {
                        try {
                            const { columns, table, values } = data;
                            const startLen = configuration.$data[table].length + 1;
                            const newRecords = values.map((v,n) => ({
                                // start with all columns from schema, so any columns that did not exist in `columns` (from the records inserted) will exist then, defaulted with null or insert id.
                                ...Object.fromEntries(Object.values(configuration.$schema[table]).map(c => {
                                    if(configuration.$schema[table][c.field].isIdentity) {
                                        return [c.field, startLen+n];
                                    }
                                    return [c.field, null];
                                })),
                                // remaining columns that did exist in `columns` (from the records) inserted.
                                ...Object.fromEntries(columns.map((c,m) => {
                                    if(configuration.$schema[table][c].isIdentity) {
                                        return [c, startLen+n];
                                    }
                                    return [c, v[m]];
                                }))
                            }));
                            const newTable = configuration.$data[table].concat(newRecords);
        
                            const uniques = new Set();
                            const uniqueKeys = Object.keys(configuration.$schema[table]).filter(k => configuration.$schema[table][k].isPrimary || configuration.$schema[table][k].isUnique);
                            for(const r of newTable) {
                                const fullKey = uniqueKeys.map(k => r[k]).join('_');
                                if(uniques.has(fullKey)) {
                                    throw Error('NON_UNIQUE_KEY');
                                    // throw ErrorTypes.NON_UNIQUE_KEY();
                                }
                                uniques.add(fullKey);
                            }
                            
                            configuration.$data[table] = newTable;

                            const affectedRows = values.length;
                            const insertId = startLen;
                            return Array.from(Array(affectedRows).keys()).map((_, n) => n + /** @type {number}*/ (insertId));
                        } catch(err) {
                            throw err;
                        }
                    }

                    return {
                        cmd: `No command available.`,
                        args: [(/** @type {any} */ (commit))]
                    };
                },
                forUpdate(data) {
                    /** @param {JsonDatabase} configuration */
                    const commit = (configuration) => {
                        try {
                            let numAffected = 0;
                            const { table, columns, where, explicit, implicit } = data;
                            if(implicit) { 
                                const { primaryKeys, objects } = implicit;
                                configuration.$data[table] = configuration.$data[table].map(o => {
                                    if(filterFn(o, where)) {
                                        // loop through all objects to be updated.
                                        objectsToUpdateLoop: 
                                        for(const record of objects) {
                                            let same = true;
                                            for(const pKey of primaryKeys) {
                                                same = record[pKey] === o[pKey];
                                                if(!same) break objectsToUpdateLoop;
                                            }
                                            numAffected++;
                                            return record;
                                        }
                                    }
                                    return o;
                                });
                            }
                            if(explicit) {
                                const { values } = explicit;
                                configuration.$data[table].forEach(r => {
                                    if(filterFn(r, where)) {
                                        for(let i = 0; i < columns.length; ++i) {
                                            const col = columns[i];
                                            const val = values[i];
                                            r[col] = val;
                                        }
                                        numAffected++;
                                    }
                                });
                            }
                            return numAffected;
                        } catch(err) {
                            throw err;
                        }
                    }
                    return {
                        cmd: `No command available.`,
                        args: [(/** @type {any} */ (commit))]
                    };
                },
                forDelete(data) {
                    /** @param {JsonDatabase} configuration */
                    const commit = (configuration) => {
                        try {
                            const { table, where } = data;
                            const startLen = configuration.$data[table].length;
                            configuration.$data[table] = configuration.$data[table].filter(r => !filterFn(r, where));
                            return startLen - configuration.$data[table].length;
                        } catch(err) {
                            throw err;
                        }
                    }
                    return {
                        cmd: `No command available.`,
                        args: [(/** @type {any} */ (commit))]
                    };
                },
                forTruncate({ table }) {
                    /** @param {JsonDatabase} configuration */
                    const commit = (configuration) => {
                        try {
                            const len = configuration.$data[table].length;
                            configuration.$data[table] = [];
                            return len;
                        } catch(err) {
                            throw err;
                        }
                    }
                    return {
                        cmd: `No command available.`,
                        args: [(/** @type {any} */ (commit))]
                    };
                },
                forDescribe(table) {
                    return { 
                        cmd: `No command available.`,
                        args: /** @type {any[]} */ (/** @type {unknown} */ (configuration.$schema[table]))
                    };
                }
            }
        }
    }
}