


function Builder_Cache(Processor) {

    Processor.prototype.getBuilderSingleton = async function (table, con) {
        let builder = this.builderMap.get(table);
        if (!builder) {
            builder = await this.getNewBuilder(table, con);
            this.builderMap.set(table, builder);
        }
        return builder;
    }
    // not public
    Processor.prototype.getNewBuilder = async function (table, con) {
        try {
            let descMap = await this.selectMap(`Field`, `describe ??`, [table], con);
            let builder = {
                table: table,
                columns: descMap,
                construct: (dto, allowNull) => {
                    dto = dto || {};
                    let columnMap = builder.columns;
                    let mainObject = {};
                    for (let key of columnMap.keys()) {
                        let desc = columnMap.get(key);
                        if (desc[`Extra`] != `auto_increment` && desc[`Null`] === `NO` && dto[key] == null && desc[`Default`] == null) {
                            throw new Error(`${key} cannot be absent from dto`)
                        }
                        if (desc[`Type`] == `json` && dto[key] != null && typeof dto[key] !== `string`) {
                            mainObject[key] = JSON.stringify(dto[key]);
                        } else if (allowNull || dto[key] != null) {
                            if (desc[`Extra`] != `auto_increment`) {
                                mainObject[key] = dto[key];
                            }
                        }


                    }
                    return (mainObject);
                },
                getPk() {
                    let pkList = [];
                    for (let col of builder.columns.values()) {
                        if (col.Key == `PRI`) {
                            pkList.push(col.Field);
                        }
                    }
                    return pkList;
                }
            }
            return builder;
        } catch (err) {
            throw err;
        }
    }

    Processor.prototype.printConstructor = async function (table, con) {
        return new Promise(async (resolve, reject) => {
            let descriptionArr = await this.select(`describe ??`, [table], con);
            let result = ``;
            for (let desc of descriptionArr) {
                if (desc.Extra === `auto_increment`) {
                    continue;
                }
                let property = desc[`Field`];
                result += `this[\`${property}\`] = dto[\`${property}\`]; //${desc.Type} & ${desc.Null} Null - ${desc.Extra}\n`
            }
            console.log(result);
            resolve();
        });
    }

    Processor.prototype.printBuilder = async function (table, con) {
        return new Promise(async (resolve, reject) => {
            let descriptionArr = await this.select(`describe ??`, [table], con);
            let result = `let dao = {\n`;
            for (let desc of descriptionArr) {
                if (desc.Extra === `auto_increment`) {
                    continue;
                }
                let property = desc[`Field`];
                result += `${property}: body[\`${property}\`], //${desc.Type} & ${desc.Null} Null - ${desc.Extra}\n`
            }
            result += `}\n`;
            console.log(result);
            resolve();
        });
    }

    Processor.prototype.printClass = async function (table, con) {
        const className = table.charAt(0).toUpperCase() + table.slice(1);
        let descriptionArr = await this.select(`describe ??`, [table], con);
        let result = `class ${className}{\n`;

        result += `constructor(dto){\n`
        for (let desc of descriptionArr) {
            let property = desc[`Field`];
            result += `\tthis[\`${property}\`] = dto[\`${property}\`]; //${desc.Type} & ${desc.Null} Null - ${desc.Extra}\n`
        }
        result += `}\n` //constructor

        result += `}\n` //class
        result += `module.exports.${className} = ${className};`
        console.log(result);
        return result;
    }
}






module.exports = Builder_Cache;