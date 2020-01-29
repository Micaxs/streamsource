const mysql = require('mysql');
const moment = require('moment');
let connection;

function handleDisconnect() {

  connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'YW!jjFp5b*-J$X!=3xuZ',
    database : 'streaming'
  });

  connection.connect(function(err) {
    if(err) {
      // console.log('Database Conenction Error:', err);
      setTimeout(handleDisconnect, 2000);
    }
  });

  connection.on('error', function(err) {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} [Error] MYSQL Lost Connection, reconnecting!`);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });

  return connection;
}


module.exports = {
  init: handleDisconnect,
  con: connection
};
