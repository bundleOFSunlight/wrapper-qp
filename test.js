let qp = require('./qp');
let moment = require('moment');
moment.toString = () => {
    return this.format(`YYYY-MM-DD HH:mm:ss`);
}
// let local = { host: `localhost`, user: `root`, password: `admin`, database: `testdb`, limit: 2 };
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateArr(number) {
    let people = [];
    for (i = 0; i < number; i++) {
        people.push({
            name: makeid(7),
            height: Math.floor(Math.random() * 200),
            weight: Math.floor(Math.random() * 80)
        })
    }
    return people;
}

async function todo(schemaName) {
    let con;
    try {
        con = await qp.connectWithTbegin(prod);
        const result = await qp.selectFirst(`select * from table_b `, [], con);
        // result.push({ c1: `${result.length + 1}`, last_sync: new Date(), c1_c1: 8081 });
        // const s = await qp.bulkUpdate(`table_b`, result, con);
        delete result.c1;
        const s = await qp.update(`table_b`, result, { c1: 2 }, con);
        console.log(s);
        await qp.commitAndCloseConnection(con);
    } catch (err) {
        await qp.rollbackAndCloseConnection(con);
        if (err.sql)
            console.log(err.sql);
        console.log(err);
    }
}


class Queue {
    constructor(dao) {
        if (typeof dao === 'object') {
            for (let key of Object.keys(dao)) {
                this[key] = dao[key];
            }
        }
    }
}

todo();