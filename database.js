const mysql=require('mysql');
///DATA TO ACCESS THE DATABASE
const pool =mysql.createPool({
    host:'127.0.0.1',
    user:'mouadetta',
    password:'mouadetta1234',
    database:'project1',
    port: 3306,
    connectionLimit: 100,
    multipleStatements: false
});
 
module.exports = {
    pool
};