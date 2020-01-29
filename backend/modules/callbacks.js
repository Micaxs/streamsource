const mysql = require('mysql');
const fn = require('./helpers.js');
const moment = require('moment');
const database = require('./database.js');
// MySQL Database Connection
// Database.
let connection = database.init();

// POST (on_publish) - Basicly when start to stream.
function push(req, res) {
  let streamname = req.body.name;
  let streamer_ip = req.body.addr;
  let start_datetime = moment().format("YYYY-MM-DD HH:mm:ss");

  fn.log(`Publish request for ${streamname} from ${streamer_ip}`);

  // Check if streamname/key is actually valid.
  connection.query('SELECT * FROM streams WHERE streamkey = ?', [streamname], (error, results, fields) => {
    if (error) {
      res.status(500).send({
        "code":500,
        "failed":"MySQL Error Occurred."
      });
      return;
    }
    if (results.length > 0) {
      let streamId = results[0].id;
      let updateData = {
        type: 'live',                   // Set the stream to LIVE
        status: 'ENCODING',             // Set that its currently ENCODING (basicly it is now stream is available kinda deal)
        actual_start: start_datetime    // Set the actual_start datetime.
      };
      connection.query('UPDATE streams SET ? WHERE id = ?', [updateData, streamId], (error, result) => {
        if (error) {
          console.log('MYSQL Error when Updating fields: ', error);
          res.status(500).send({
            "code": 500,
            "failed":"MySQL Error Occurred."
          });
        } else {
          fn.log(`Publish started for ${streamname} from ${streamer_ip}`);
          res.status(200).json({
            "code": 200
          });
        }
      });
    } else {
      // Does not exist. No streaming on this streamkey allowed!
      fn.log(`Publish denied for ${streamname} from ${streamer_ip}`);
      res.status(404).json({
        "code": 404,
        "error": "Not found"
      });
      return;
    }
  });
}

module.exports = {
  push: push
};
