// Packages
const fn = require('./helpers.js');
const moment = require('moment');
const crypto = require('crypto');
const fs = require('fs');
const database = require('./database.js');

// Configurables
const priv_encryption_key = 'TLvY#vz6C6K5XxTYE@=eY6@K8Uz?bW$DFdKfEyxhE^-KSr45DBXtPXEE#&GFuaJTeB@6&KymuhE=C=pc6cFJzCpNyLuX4sVXKh6rc7qXeF%!pLCghZnp6qjuvFgDD$HV';
const token_key = 'JZ8%NXkaAaGgMzgz6X7pGA4%#+NUu8@w';
const str_split = '|&#!*|';

// MySQL Database Connection
// Database.
let connection = database.init();



/**
 * findEngineStream -- Check to see if the stream is available within the Engine (Streamable and all that..)
 * @param {string} streamkey -- The streamkey to search for.
 * @param {string} type -- Streamtype to search for 'live'/'vod'.
 */
function findEngineStream(streamkey, type) {
  let sourceFolder;
  if (type === 'live') {
    sourceFolder = '/home/streaming/live';
  } else {
    sourceFolder = '/home/streaming/vod';
  }

  let files = fs.readdirSync(sourceFolder);
  files.forEach((item) => {
    if (fs.lstatSync(sourceFolder + '/' + item).isDirectory()) {
      if (item === streamkey) {

        // Get fileInfo
        let fileInfo, isPublished, publishedOn;
        if (type === 'live') {
          fileInfo = fn.getFileInfo(sourceFolder + '/' + item + '/index.m3u8');
        } else {
          fileInfo = fn.getFileInfo(sourceFolder + '/' + item + '/playlist.m3u8');
        }

        return fileInfo;
      } else {
        return false;
      }
    }
  });
}

/* GET '/web/streams'
 * Retrieve a list of available streams within the system.
 */
function get_streams(req, res) {
  const aStreams = [];
  connection.query('SELECT * FROM streams', (error, results, fields) => {
    if (error) {
      console.log('mysql fucked up');
      res.status(500).json({
        "code": 500,
        "failed": "MySQL Error Occurred."
      });
      return;
    }
    if (results.length > 0) {
      let streams = results;
      streams.forEach((stream) => {
        if (stream.type === 'live' || stream.type === 'vod') {
          // We need to fetch the engine data for this too.
          stream.fileInfo = findEngineStream(stream.streamkey, stream.type);
          aStreams.push(stream);
        } else {
          // No need to fetch the engine data, just add to return..
          aStreams.push(stream);
        }
      });
    }

    res.status(200).json({
      'streams': aStreams
    });
  });



}

/** POST '/web/streams'
 * Create a new streaming event.
 */
function create_stream(req, res) {
  // Store POST data into variables
  let eventname = String(req.body.name); // Human Readable Stream Name
  let streamkey = String(req.body.streamkey); // Maybe randomly generate one and check if it doesnt exist yet?
  let start = String(req.body.start); // DATETIME of the proposed start of the stream.
  let stop = String(req.body.stop); // DATETIME of the proposed stop of the stream.

  // TODO: Add more details and so on later...

  // Create Defaults
  let type = 'ready'; // Type of stream
  let status = 'OK'; // Status of stream

  // Check for inputs...
  if (!eventname || !start || !stop) {
    return res.status(400).json({
      'error': 'Invalid parameters received.'
    });
  }

  // Now add it into the database?
  connection.query('INSERT INTO streams (eventname, streamkey, type, status, start, stop) VALUES (?, ?, ?, ?, ?, ?)', [eventname, streamkey, type, status, start, stop], (err, result) => {
    if (err) {
      fn.log('Failed to create stream.');
      console.log(err);
      return res.status(500).json({
        "code": 500,
        "failed": "MySQL Error Occurred."
      });
    }

    return res.status(201).json({
      'status': 'Created',
      'eventname': eventname,
      'streamkey': streamkey,
      'type': type,
      'status': status,
      'start': start,
      'stop': stop
    });

  });
}

/** PATCH '/web/streams'
 * Modify a given stream when its not in_use (actively streaming/postprocessing)?
 */
function edit_stream(req, res) {
  return false;
}



// Exports
module.exports = {
  get_streams: get_streams,
  create_stream: create_stream,
  edit_stream: edit_stream
}