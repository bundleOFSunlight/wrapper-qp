# Flex-Solver Query Processor Library

## Table of Contents
-  [Introduction](#introduction)
-  [Important Notes](#important-notes)
-  [Getting Started](#getting-started)
-  [Basic Syntax](#basic-syntax)
-  [Transactions](#transactions)



## Introduction

### Objective
This library was built on top of the [Official MySQL Library](https://github.com/mysqljs/mysql#introduction), to create a clean and standardized format for MySQL queries, so as to ease the process of database interactions.

We recommend that you try out the Official MySQL Library before you start with this wrapper.

### Features
- Simplified connection to MySQL Database.
- Simplified queries to the database.
- Parsing of data from database for use in backend or frontend code.



## Important Notes

### Important Notes #1 - About Promises (Latest 20/05/2018)
Most, if not all, functions in this library return promises, hence it is important for developers be fluent it using [await-async (read me to find out why).](https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9)

### Important Notes #2 - About Returns (Latest 20/05/2018)
As mentioned, the library is written on top of the offical library, minimal changes were made to the returned data for ease of data parsing.

Apart from that, you may refer to 
1. [JSON Data Type](#json-data-type)
2. [Timestamp Data Type](#timestamp-data-type)


## Getting Started

### Installation
This is a Node.js modeule available through the [NPM registry](https://www.npmjs.com/).

Before installing, download and install Node.js. Node.js 8.0 or higher is required.

Installation is done using the npm install command:

```
$ npm install @cai_jinghong/wrapper-qp
```

## Defining a Connection
The recommended method of defining a connection is to create a JSON file:

```JSON
{
    "host" : "localhost",
    "user" : "admin",
    "password" : "p@55w0rd",
    "database" : "world"
}
```

Alternatively, it can be defined as a Javascript Object:

```Javascript
let config = {
    "host" : "localhost",
    "user" : "admin",
    "password" : "p@55w0rd",
    "database" : "world"
}
```

## Connecting to the Database
When using the flexqp library, a connection to the database must be preset upon running the server, after which the connection is no longer required to be defined for each individual SQL query. 

```Javascript
const qp = require('@cai_jinghong/wrapper-qp');
qp.presetConnection(require('./dbConfig.json'));
```

Note that when importing the flexqp library, an instance of the class is created for the entire project, meaning that a connection defined in the entry file will persist throughout the project.

### Connecting to multiple Schemas
Coming Soon.



## Basic Syntax

### MySQL Query Parameters
Most, if not all, functions require at least an SQL statemend and parameters, if any. In order to pass parameters into the SQL statement, the following methods are used:

1. Passing parameters as an Array

   `?`, denoting an unescaped paramenter and `??`, denoting and escaped parameter, symbols are expected within the SQL statements, with the number of symbols matching the number of array elements.

   ```Javascript
   // Actual SQL query processed: SELECT * FROM `table` WHERE date > 2019-01-01
   let params = ['table', '2019-01-01'];
   let result = await qp.select(`SELECT * FROM ?? WHERE date > ?`, params);
   ```


2. Passing parameters as an Object

   This method is useful if reusing the same parameter multiple times within a statement. In this case, the syntax used to denote the parameter in the query would be `:object_property`:

   ```Javascript
   // Actual SQL query processed: SELECT * FROM table WHERE name LIKE CONCAT('%', 'flex', '%') OR email LIKE CONCAT('%', 'flex', '%') or user LIKE CONCAT('%', 'flex', '%')
   let params = {
       search: 'flex'
   }
   let result = await qp.select(`SELECT * FROM table WHERE name LIKE CONCAT('%', :search, '%') OR email LIKE CONCAT('%', :search, '%') or user LIKE CONCAT('%', :search, '%')`, params);
   ```

### Data Retrieval
For simple data retrieval, use the following functions:

```Javascript
// returns an array of rowData, or empty array if no matches found
let arr = await qp.select(`SELECT * FROM table`);

// returns a first result found as an object, or null if no matches found
let result = await qp.selectFirst(`SELECT * FROM table`);

// returns a map from rowData, with specified column as key (key must be unique)
// the resulting map has the following functions: get, set, delete, keys, values, toJSON, toValuesArray, toKeysArray
let map = await qp.selectMap(`column`, `SELECT * FROM table`);

// returns a map from rowData, with specified column as key (results are grouped into arrays)
let arrMap = await qp.selectMapArray(`column`, `SELECT * FROM table`);

// returns array of values from a specific column in table
let array = await qp.scalar(`SELECT column FROM table`); 

// returns single value from specific column in table (similar to selectFirst, returns first result)
let value = await qp.scalarFirst(`SELECT column FROM table`);
```

### Data Manipulation
For simple data manipulation, use the following function:

```Javascript
let insert = await qp.run(`INSERT INTO table SET ?`, [dao]);
let update = await qp.run(`UPDATE table SET name = 'BLANK'`);
let delete = await qp.run(`DELETE FROM table WHERE name = 'BLANK`); 

// runs query and ignores error
let ignore = await qp.run(`INSERT INTO table SET ?`, [dao]);

// inserts an array of rows in 1 statement, updates selected columns if specified in colArr, ignore errors if specified by ignore parameter
let cols = [`column1`, `column2`];
let ignore = true;
let bulkInsert = await qp.bulkInsert(`table`, daoArr, ignore, con, colArr);

// insert or update of already exists
let upsert = await qp.upsert(`table`, dao, con, cols);

// insert or update an array of rows
let bulkUpsert = await qp.bulkUpsert(`table`, daoArr, con, cols);
```



## Transactions
For handling of multiple MySQL queries within a single transaction, follow the example below

```Javascript
let con;
try {

    // Create a temporary connection for the transaction
    con = await qp.connectWithTBegin();

    /*
    Multiple MySQL queries for the connection
    .
    .
    .
    */

   // Commit and closing the connection
   await qp.commitAndCloseConnection(con);

} catch (err){
    if (con) await qp.rollbackAndCloseConnection(con);
}
```

Note that it is important to define `let con` outside of the `try {}` code block, in order to rollback the connection when an error is caught.