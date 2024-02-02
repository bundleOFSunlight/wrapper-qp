const mysql = require('mysql');
const moment = require('moment');

function Processor() {
    this.databaseMap = new Map();
    this.poolCluster = mysql.createPoolCluster({ restoreNodeTimeout: 50 }); // retry
    this.defaultKey = null;
    this.activeTransactions = new Map();
    this.transactionThreshold = null;
    this.builderMap = new Map();
    this.debug = false;
    this.TYPE_CAST = (field, next) => {
        if (field.type == 'JSON') {
            return JSON.parse(field.string());
        }
        if (field.type == 'TIMESTAMP' || field.type == 'DATETIME') {
            let str = field.string();
            if (str != null)
                return moment(str).format('YYYY-MM-DD HH:mm:ss');
            else
                return str;
        }
        if (field.type == 'DATE') {
            let str = field.string();
            if (str != null)
                return moment(str).format('YYYY-MM-DD');
            else
                return str;
        }
        return next();
    };
}

Processor.prototype.console = function (message = ``) {
    if (this.debug) {
        if (message instanceof Object) {
            console.log(`[${moment().format(`YYYY-MM-DD HH:mm:ss`)}] - ${JSON.stringify(message)}`);
        } else {
            console.log(`[${moment().format(`YYYY-MM-DD HH:mm:ss`)}] - ${message}`);
        }
    }
}

/**
 * 
 */
Processor.prototype.presetTypeCast = function (typeCast) {
    this.TYPE_CAST = typeCast;
}


/**
 * protected
 * @param {*} config 
 */
Processor.prototype.createConnectionPool = function (config, forceOverwrite) {
    if (!config) {
        throw new Error(`Please provide DB configuration`)
    }
    let connectionCre = {
        connectionLimit: config.connectionLimit || config.limit || this.limit || 5,
        host: config.host || this.host,
        user: config.user || this.user,
        password: config.password || this.password,
        port: config.port || this.port || `3306`,
        connectTimeout: config.connectTimeout || this.connectTimeout || 60 * 1000,
        acquireTimeout: config.acquireTimeout || this.acquireTimeout || 60 * 1000,
        timeout: config.timeout || this.timeout || 60 * 1000,
        insecureAuth: config.insecureAuth || this.insecureAuth || false,
        debug: config.debug || this.debug || false,
        multipleStatements: config.multipleStatements || this.multipleStatements || false,
        queueLimit: config.queueLimit || this.queueLimit || 1500
    };

    config.charset || this.charset ? connectionCre.charset = config.charset || this.charset : null;
    config.ssl || this.ssl ? connectionCre.ssl = config.ssl || this.ssl : null;
    let key = getDbKey(config);
    if (!config.database) {
        this.console('database are suggested be provided in to QP');
    } else {
        // we actually allowed no database given but warnning message wont stop
        connectionCre.database = config.database
    }
    if (!this.databaseMap.get(key) || forceOverwrite) {
        if (!this.poolCluster['_nodes'][key]) {
            this.poolCluster.add(key, connectionCre);
        }
    }
    this.databaseMap.set(key, true)
    return null;
}
/**
 * public
 * @param {Object} config - host!, user!, password!, database!  
 */
Processor.prototype.presetConnection = function (configOrHost, user, password, database, limit, port) {
    if (this.defaultPool) {
    }
    this.host = configOrHost.host || configOrHost || this.host;
    this.user = configOrHost.user || user || this.user;
    this.password = configOrHost.password || password || this.password;
    this.limit = configOrHost.connectionLimit || configOrHost.limit || limit || 5;
    this.port = configOrHost.port || port || `3306`;
    this.insecureAuth = configOrHost.insecureAuth || false;
    this.debug = configOrHost.debug || false;
    this.multipleStatements = configOrHost.multipleStatements || false;
    this.charset = configOrHost.charset;
    this.ssl = configOrHost.ssl;
    this.transactionThreshold = configOrHost.transactionThreshold || 60 * 1000;
    this.connectTimeout = configOrHost.connectTimeout;
    this.acquireTimeout = configOrHost.acquireTimeout;
    this.timeout = configOrHost.timeout;
    if (configOrHost.database || database) {
        this.database = configOrHost.database || database
    } else {
        delete this.database;
    }

    this.defaultPool = this.createConnectionPool(this);
    let key = getDbKey(this)
    this.defaultKey = key;
}


/**
 * protected
 * @param {Object=} dbConfig 
 */
Processor.prototype.connectToDb = async function (dbConfig) {
    let con;
    //if specific db connection is given, it will not pull connection from the pool, it will establish a new one and destory at the end
    let key = this.defaultKey;
    if (dbConfig) {
        key = getDbKey(dbConfig);
        this.createConnectionPool(dbConfig);
    } else if (!key) {
        throw new Error(`connection pool required to be preset`);
    }
    con = await new Promise((resolve, reject) => {
        this.poolCluster.getConnection(key, (err, con) => {
            if (err) {
                if (dbConfig) {
                    this.createConnectionPool(dbConfig, `forceOverwrite`);
                    setTimeout(() => {
                        this.poolCluster.getConnection(key, (err2, con) => {
                            if (err2) {
                                reject(err2);
                            } else {
                                resolve(con);
                            }
                        })
                    }, 1000)
                }else{
                    this.createConnectionPool(this, `forceOverwrite`);
                    setTimeout(() => {
                        this.poolCluster.getConnection(key, (err2, con) => {
                            if (err2) {
                                reject(err2);
                            } else {
                                resolve(con);
                            }
                        })
                    }, 1000)
                }
            } else {
                return resolve(con);
            }
        })
    });
    con.config.queryFormat = function (query, values) {
        if (!values) return query;

        if (Array.isArray(values)) {
            let offset = 0;

            return query.replace(
                /(\?{1,2})/g,
                function (text, match) {
                    offset++;

                    if (offset > values.length) return text;

                    if (match.length === 2) return this.escapeId(values[offset - 1]);
                    else return this.escape(values[offset - 1]);
                }.bind(this),
            );
        } else {
            const escaped = query.replace(
                /:(\w+)/g,
                function (text, key) {
                    if (values.hasOwnProperty(key)) {
                        return this.escape(values[key]);
                    }

                    return text;
                }.bind(this),
            );

            return escaped.replace(/\[(\w+)\]/g, function (text, key) {
                if (values.hasOwnProperty(key)) {
                    return this.escapeId(values[key]);
                }

                return text;
            });
        }
    }
    return con;
}

/**
 * protected
 * @param {Object} con 
 * @param {String} queryOrOption 
 * @param {Object[]=} params 
 */
Processor.prototype.query = function (con, queryOrOption, params) {
    return new Promise((resolve, reject) => {
        con.query(queryOrOption, params, (err, result) => {
            try {
                if (con._pool) {
                    con.release();
                }
                else {
                    this.console(`Connection is destroy instead of released!`);
                    con.destroy();
                }
                if (err) {
                    err.status = 409;
                    return reject(err);
                }
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    });
}


Processor.prototype.end = function () {
    return new Promise((resolve, reject) => {
        this.poolCluster.end((err) => {
            if (err) {
                console.log(`unable to end pool cluster`);
                console.error(err);
                return reject(err);
            }
            this.defaultKey = null;
            this.databaseMap = new Map();
            this.activeTransactions = new Map();
            this.builderMap = new Map();
            this.poolCluster = mysql.createPoolCluster({ restoreNodeTimeout: 50 });
            return resolve();
        });
    });
}

function getDbKey(dbConfig) {
    let host = dbConfig.host || this.host || '';
    let database = dbConfig.database || this.database || '';
    return host + database;
}
module.exports = Processor;
