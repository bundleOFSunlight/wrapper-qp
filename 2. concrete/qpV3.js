
function qpV3(Processor) {
    Processor.prototype.selectClassMap = function (ClassType, key, query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let results = await this.select(query, params, configOrDbCon);
                let customMap = {
                    map: new Map(),
                    get: (key) => {
                        return customMap.map.get(key);
                    },
                    set: (key, value) => {
                        customMap.map.set(key, value);
                    },
                    delete: (key) => {
                        customMap.map.delete(key);
                    },
                    keys: () => {
                        return customMap.map.keys();
                    },
                    values: () => {
                        return customMap.map.values();
                    },
                    toJSON: () => {
                        return Array.from(customMap.map.values());
                    },
                    toValuesArray: () => {
                        return Array.from(customMap.map.values());
                    },
                    toKeysArray: () => {
                        return Array.from(customMap.map.keys());
                    }
                }
                for (let data of results) {
                    let mapKey = data[key];
                    if (mapKey != null) {
                        if (customMap.get(mapKey)) {
                            throw new Error(`${key} must be unique !! ${JSON.stringify(data)}`);
                        } else {
                            let obj = new ClassType(data);
                            customMap.set(mapKey, obj);
                        }
                    } else {
                        throw new Error(`${key} must not be null !! ${JSON.stringify()}`);
                    }
                }
                resolve(customMap);
            } catch (err) {
                reject(err);
            }
        })
    }
    Processor.prototype.selectClass = function (ClassType, query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let arr = [];
                let results = await this.select(query, params, configOrDbCon);
                for (let data of results) {
                    let obj = new ClassType(data);
                    arr.push(obj);
                }
                resolve(arr);
            } catch (err) {
                reject(err);
            }
        })
    }
    Processor.prototype.selectClassFirst = function (ClassType, query, params, configOrDbCon) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await this.selectFirst(query, params, configOrDbCon);
                if (!result) {
                    //result is null
                } else {
                    result = new ClassType(result);
                }
                resolve(result);
            } catch (err) {
                reject(err);
            }
        })
    }

    Processor.prototype.selectCheckFirst = async function (table, dao, configOrDbCon, errorHandler) {
        let { query, params } = whereClauseBreaker(dao);
        params.unshift(table);
        let result = await this.selectFirst(`select * from ?? where ${query}`, params, configOrDbCon);
        if (!result) {
            if (errorHandler) {
                errorHandler();
            } else {
                throw new Error(`${table} not found #${JSON.stringify(dao)}`);
            }
        } else {
            return result;
        }
    }

    Processor.prototype.selectCheck = async function (table, dao, configOrDbCon, errorHandler) {
        let { query, params } = whereClauseBreaker(dao);
        params.unshift(table);
        let result = await this.select(`select * from ?? where ${query}`, params, configOrDbCon);
        if (!result.length) {
            if (errorHandler) {
                errorHandler();
            } else {
                throw new Error(`${table} not found #${JSON.stringify(dao)}`);
            }
        } else {
            return result;
        }
    }
}

function whereClauseBreaker(dao) {
    let query = ``;
    let params = [];
    for (const [key, value] of Object.entries(dao)) {
        query = query.replace(`;`, ` AND `);
        query += `?? = ?;`
        params.push(key);
        params.push(value);
    }
    return { query, params };
    // console.log(query);
    // console.log(params);
    // whereClauseBreaker({ a: 123123, b: `hehehe`, c: true })
}

module.exports = qpV3;
