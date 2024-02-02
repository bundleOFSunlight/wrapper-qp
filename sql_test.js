let qp = require('./qp');
let dev;
qp.presetConnection(dev);
let moment = require('moment');


async function todo() {
    let con;
    try {
        con = await qp.connectWithTbegin();
        let productId = 16;
        let result;
        await qp.run(`insert into jsonresources set ?`, [{ type: 'test', json: { json: 123123 } }]);
        result = await qp.selectFirst(`select * from products where ? for update`, [{ idProducts: 16 }], con);

        result = await qp.select({ sql: `SELECT * FROM products p, receipts r`, timeout: 2000 }); //timeout after 2 secs

        result = await qp.selectCheckFirst(`product`, { idProducts: 16 }, con); //it will return the product
        result = await qp.selectCheckFirst(`product`, { idProducts: 16, name: `111` }, con); // it will throw error as "products not found #{"idProducts":16,"name":"111"}"
        result = await qp.selectCheckFirst(`product`, { idProducts: 16, name: `111` }, con, function () { // "it will throw error as described here" 
            throw new Error(`this is custom error handler`);
        });

        result = await qp.selectCheck(`product`, { idProducts: 16 }, con); //it will return the product
        result = await qp.selectCheck(`product`, { idProducts: 16, name: `111` }, con); // it will throw error as "products not found #{"idProducts":16,"name":"111"}"
        result = await qp.selectCheck(`product`, { idProducts: 16, name: `111` }, con, function () { // "it will throw error as described here" 
            throw new Error(`this is custom error handler`);
        });

        result = await qp.selectFirst(`select * from products where ?`, [{ idProducts: 16, name: 111 }], con);

        productId = `0 or 1 = 1 ;`;

        let result1 = await qp.select(`select * from products where idProducts = ${productId}`, [], con);
        console.log(`1. ${result1.length}`);
        let result2 = await qp.select(`select * from products where idProducts = :idProducts`, { idProducts: productId }, con);
        console.log(`2. ${result2.length}`);
        let result3 = await qp.select(`select * from products where idProducts = ?`, [productId], con);
        console.log(`3. ${result3.length}`);

        await qp.commitAndCloseConnection(con);
    } catch (err) {
        await qp.rollbackAndCloseConnection(err);
        console.log(err);
    }
}


todo();