// @ts-check
// the JSON adapter is much different from other adapters, as a command and respective arguments aren't used, everything is done within this program rather than
// being expected to be sent to a database server. Therefore, many of the types will be casted and what is returned from each of the serialization functions
// will not reflect what would actually be sent.
import { KinshipNonUniqueKeyError, KinshipValueCannotBeNullError } from '@kinshipjs/core/errors';
import { clone, merge, groupBy, extend } from 'lodash-es';

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
                const isNegated = prop.chain.endsWith("NOT");
                let evaluated;
                switch(prop.operator) {
                    case "<": {
                        if(prop.value === null) {
                            evaluated = false;
                            break;
                        }
                        evaluated = (m[prop.property] < prop.value);
                        break;
                    }
                    case "<=": {
                        if(prop.value === null) {
                            evaluated = false;
                            break;
                        }
                        evaluated = (m[prop.property] <= prop.value);
                        break;
                    }
                    case ">": {
                        if(prop.value === null) {
                            evaluated = false;
                            break;
                        }
                        evaluated = m[prop.property] > prop.value;
                        break;
                    }
                    case ">=": {
                        if(prop.value === null) {
                            evaluated = false;
                            break;
                        }
                        evaluated = m[prop.property] >= prop.value;
                        break;
                    }
                    case "<>": {
                        evaluated = m[prop.property] !== prop.value;
                        break;
                    }
                    case "=": {
                        evaluated = m[prop.property] === prop.value;
                        break;
                    }
                    case "BETWEEN": {
                        if(prop.value === null) {
                            evaluated = false;
                            break;
                        }
                        evaluated = m[prop.property] >= prop.value[0] && m[prop.property] <= prop.value[1];
                        break;
                    }
                    case "IN": {
                        if(prop.value === null || !Array.isArray(prop.value)) {
                            evaluated = false;
                            break;
                        }
                        evaluated = prop.value.includes(m[prop.property]);
                        break;
                    }
                    case "IS": {
                        evaluated = m[prop.property] === null;
                        break;
                    }
                    case "IS NOT": {
                        evaluated = m[prop.property] !== null;
                        break;
                    }
                    case "LIKE": {
                        if(prop.value === null || typeof prop.value !== "string") {
                            evaluated = false;
                            break;
                        }
                        evaluated = new RegExp(prop.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\%/g, ".*"), "g").test(m[prop.property]);
                        break;
                    }
                    default: {
                        evaluated = false;
                    }
                }
                if(isNegated) {
                    evaluated = !evaluated;
                }
                stays = evaluated;
            }
        }
        return stays;
    }
    return true;
};

/** 
 * Adapter for `Kinship` with intended use on JavaScript objects.
 * @param {_JsonDatabase<SchemaColumnDefinition>} configuration
 * @returns {import('@kinshipjs/core/adapter').KinshipAdapterConnection}
 */
export function adapter(configuration) {
    return _adapter(/** @type {any} */ (configuration));
}

/** 
 * Adapter for `Kinship` with intended use on JavaScript objects.
 * @param {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} configuration
 * @returns {import('@kinshipjs/core/adapter').KinshipAdapterConnection}
 */
function _adapter(configuration) {
    configuration = /** @type {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} */ (configuration);
    for(const tableKey in configuration.$schema) {
        const table = configuration.$schema[tableKey];
        for(const fieldKey in table) {
            configuration.$schema[tableKey][fieldKey] = {
                alias: "",
                commandAlias: "",
                datatype: configuration.$schema[tableKey][fieldKey].datatype,
                defaultValue: configuration.$schema[tableKey][fieldKey].defaultValue ?? (() => undefined),
                table: tableKey,
                isPrimary: configuration.$schema[tableKey][fieldKey].isPrimary ?? false,
                isIdentity: configuration.$schema[tableKey][fieldKey].isIdentity ?? false,
                isVirtual: false,
                isNullable: configuration.$schema[tableKey][fieldKey].isNullable ?? false,
                isUnique: configuration.$schema[tableKey][fieldKey].isUnique ?? configuration.$schema[tableKey][fieldKey].isPrimary,
                field: fieldKey,
            };
        }
    }
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
                    const [commit] = /** @type {[(cnn: _JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>) => number[]]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forUpdate(cmd, args) {
                    const [commit] = /** @type {[(cnn: _JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>) => number]} */ (/** @type {unknown} */ (args));
                    return commit(scope.transaction ?? configuration);
                },
                async forDelete(cmd, args) {
                    const [commit] = /** @type {[(cnn: _JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>) => number]} */ (/** @type {unknown} */ (args));
                    const result = commit(scope.transaction ?? configuration);
                    return result;
                },
                async forTruncate(cmd, args) {
                    const [commit] = /** @type {[(cnn: _JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>) => number]} */ (/** @type {unknown} */ (args));
                    const result = commit(scope.transaction ?? configuration);
                    return result;
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
                            configuration.$data = merge(configuration.$data, transaction?.$data);
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

                    // include tables
                    function joinTables(results, tables=remainingTables) {
                        const table = tables.shift();
                        if(!table) {
                            return results;
                        }
                        const refererKey = table.refererTableKey.alias;
                        const referenceKey = table.referenceTableKey.column;
                        const foreignTable = configuration.$data[table.realName];
                        
                        let newResults = [];
                        for(const result of results) {
                            const relatedRows = foreignTable.filter(r => r[referenceKey] === result[refererKey]);
                            if(relatedRows.length > 0) {
                                newResults = newResults.concat(relatedRows.map(row => {
                                    return {
                                        ...result,
                                        ...Object.fromEntries(select
                                            .filter(col => col.table === table.alias)
                                            .map(col => [col.alias, row[col.column]])),
                                    }
                                }));
                            } else {
                                newResults.push(result);
                            }
                        }
                        return joinTables(newResults, tables);
                    }
                    let results = joinTables(configuration.$data[mainTable.realName]);

                    // apply where
                    /** @type {any[]} */
                    results = results.filter(v => filterFn(v, where));

                    // apply group by
                    if(group_by) {
                        const grouped = groupBy(results, r => group_by?.map(col => r[col.alias]));

                        // create a new object for each group, where only the keys in `group_by` are retained, as well as all aggregates.
                        // any unnecessary aggregates will be filtered our at the `select` stage.
                        let newResults = [];
                        for(const groupKey in grouped) {
                            const groupedRecords = grouped[groupKey];
                            let record = {
                                $total: groupedRecords.length
                            };
                            for(const key in groupedRecords[0]) {
                                if(group_by.findIndex(col => col.alias === key) !== -1) {
                                    record[key] = groupedRecords[0][key];
                                } else {
                                    if(['number', 'bigint'].includes(typeof groupedRecords[0][key])) {
                                        record[`$sum_${key}`] = groupedRecords.reduce((acc, gr) => acc + gr[key], 0);
                                        record[`$avg_${key}`] = record[`$sum_${key}`] / record['$total'];
                                        record[`$min_${key}`] = Math.min(...groupedRecords.map(gr => gr[key]));
                                        record[`$max_${key}`] = Math.max(...groupedRecords.map(gr => gr[key]));
                                    }
                                }
                            }
                            newResults.push(record);
                        }
                        results = newResults;
                    }

                    // apply sort by
                    if(order_by) {
                        const sortFn = (a, b, idx=0) => {
                            if(!order_by || idx < 0 || idx >= order_by.length) {
                                return 0;
                            }
                            const prop = order_by[idx];
                            const direction = prop.direction === "DESC" ? -1 : 1;
                            let sortValue = 0;
                            switch(typeof a[prop.alias]) {
                                case "string": {
                                    sortValue = a[prop.alias].localeCompare(b[prop.alias]) * direction;
                                    break;
                                }
                                case "boolean": {
                                    sortValue = (a[prop.alias] - b[prop.alias]) * direction;
                                    break;
                                }
                                case "object": {
                                    if(a[prop.alias] instanceof Date) {
                                        sortValue = (a[prop.alias].getTime() - b[prop.alias].getTime()) * direction;
                                        break;
                                    } else {
                                        throw Error(`Unexpected datatype.`);
                                    }
                                }
                                case "bigint": {
                                    sortValue = (a[prop.alias] - b[prop.alias]) * direction;
                                    break;
                                }
                                case "number": {
                                    sortValue = (a[prop.alias] - b[prop.alias]) * direction;
                                    break;
                                }
                                default: {
                                    throw Error(`Unexpected datatype.`);
                                }
                            }
                            if(sortValue === 0) {
                                return sortFn(a,b,idx + 1);
                            }
                            return sortValue;
                        };
                        results.sort((a,b) => sortFn(a,b,0));
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
                    /** @param {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} configuration */
                    const commit = (configuration) => {
                        try {
                            const { columns, table, values } = data;
                            const startLen = configuration.$data[table].length + 1;
                            const newRecords = values.map((v,n) => ({
                                // start with all columns from schema, so any columns that did not exist in `columns` (from the records inserted) will exist then, defaulted with null or insert id.
                                ...Object.fromEntries(Object.values(configuration.$schema[table]).map(c => {
                                    if(configuration.$schema[table][c.field]?.isIdentity) {
                                        return [c.field, startLen+n];
                                    }
                                    return [c.field, null];
                                })),
                                // remaining columns that did exist in `columns` (from the records) inserted.
                                ...Object.fromEntries(columns.map((c,m) => {
                                    if(configuration.$schema[table][c].isIdentity) {
                                        return [c, startLen+n];
                                    }
                                    if(!configuration.$schema[table][c].isNullable && v[m] == null) {
                                        throw new KinshipValueCannotBeNullError(2, ``);
                                    }
                                    return [c, v[m]];
                                }))
                            }));
                            const newTable = configuration.$data[table].concat(newRecords);
        
                            const uniques = new Set();
                            const uniqueKeys = Object.keys(configuration.$schema[table])
                                .filter(k => configuration.$schema[table][k].isPrimary || configuration.$schema[table][k].isUnique);
                            if(uniqueKeys.length > 0) {
                                for(const r of newTable) {
                                    const fullKey = uniqueKeys.map(k => r[k]).join('_');
                                    if(uniques.has(fullKey)) {
                                        throw new KinshipNonUniqueKeyError(1, `${fullKey}`);
                                        // throw ErrorTypes.NON_UNIQUE_KEY();
                                    }
                                    uniques.add(fullKey);
                                }
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
                    /** @param {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} configuration */
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
                    /** @param {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} configuration */
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
                    /** @param {_JsonDatabase<import('@kinshipjs/core/adapter').SchemaColumnDefinition>} configuration */
                    const commit = (configuration) => {
                        try {
                            const len = configuration.$data[table].length;
                            configuration.$data[table] = [];
                            return len;
                        } catch(err) {
                            throw err;
                        }
                    };
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

/**
 * @typedef {_JsonDatabase<SchemaColumnDefinition>} JsonDatabase 
 */

/**
 * @typedef {object} SchemaColumnDefinition
 * @prop {boolean=} isPrimary
 * True if the column is a primary key for the table. (default: false)
 * @prop {boolean=} isIdentity
 * True if the column is an identity key for the table. [the column auto increments] (default: false)
 * @prop {boolean=} isNullable
 * True if the column is nullable for the table. (default: false)
 * @prop {boolean=} isUnique
 * True if the column has a unique constraint, meaning no other rows can have this value. (default: this.isPrimary)
 * @prop {"string" | "boolean" | "int" | "float" | "date"} datatype
 * Datatype that this column stores
 * @prop {(() => string | boolean | number | Date | undefined)=} defaultValue
 * Function that calculates the default value
 */

/**
 * Structure for a model that needs to be passed into the adapter when instantiating a `KinshipContext` class object connected to the `json-adapter`.
 * @template T
 * @typedef {object} _JsonDatabase
 * @prop {Record<string, Record<string, T>>} $schema
 * Schema of the database, where each key is a different table, and for each table, an object where every key is a different field.
 * @prop {Record<string, object[]>} $data
 * Actual data itself, stored as an array of objects representing the corresponding schema for the table.
 */
