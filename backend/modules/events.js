// Packages
const fn = require('./helpers.js');
const fs = require('fs');
const database = require('./database.js');

// MySQL Database Connection
// Database.
let connection = database.init();


// Check if the stream is available on the Streaming Engine
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


// GET '/events' -- Retrieve all available events
function get_streams(req, res) {
    const aStreams = [];
    connection.query('SELECT * FROM streams', (error, results, fields) => {
        if (error) {
            res.status(500).json({
                "code": 500,
                "failed": "MySQL Error Occurred."
            });
            console.log('MySQL Err', error);
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

        return res.status(200).json({
            'streams': aStreams
        });
    });
}


// GET '/events/:id' -- Retrieve a single event
function get_stream(req, res) {
    let id = req.params.id;
    connection.query('SELECT * FROM streams WHERE id = ?', [id], (error, result, fields) => {
        if (error) { return fn.mysqlError(error, res); }
        if (result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ 'error': 'Not found!' });
        }
    });
}


// GET '/events/owned' -- Retrieve all events for the current requesting user.
function get_for_user(req, res) {
    let userToken = req.headers.authorization;
    let userData = fn.get_user_from_token(userToken);

    if (userData) {
        connection.query('SELECT * FROM streams WHERE created_by = ?', [userData.id], (error, result, fields) => {
            if (error) { return fn.mysqlError(error, res); }
            if (result.length > 0) {
                return res.status(200).json(result);
            } else {
                return res.status(404).json({ 'error': 'Not found.' });
            }
        });
    } else {
        return res.status(401).json({
            'error': 'Unauthorized'
        });
    }
}


// POST '/events' -- Create a new event.
function create_event(req, res) {
    // Preset Data from Request
    let userData = fn.get_user_from_token(req.headers.authorization);
    let eventdata = {
        eventname: String(req.body.name),
        streamkey: String(req.body.streamkey),
        start: String(req.body.start),
        stop: String(req,body.stop),
        type:'ready',
        status: 'OK',
        created_by: userData.id
    }

    // Validation
    if ( !eventdata.eventname || !eventdata.streamkey || !eventdata.start || !eventdata.stop || !eventdata.created_by ) {
        return res.status(400).json({
            'error': 'Invalid parameters received.'
        });
    }

    // Create the event in the database.
    connection.query('INSERT INTO streams (eventname, streamkey, type, status, start, stop, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [eventdata.eventname, eventdata.streamkey, eventdata.type, eventdata.status, eventdata.start, eventdata.stop, eventdata.created_by], (err, result) => {
        if (err) { return fn.mysqlError(err, res); }
        return res.status(201).json(eventData);
    });
}


// POST '/events/:id' -- Edit a specific event (identified by id).
function edit_event(req, res) {
    // Retrieve data
    let userData = fn.get_user_from_token(req.headers.authorization);
    let streamId = parseInt(req.params.id);
    let eventdata = {};

    connection.query('SELECT * FROM streams WHERE id = ?', [streamId], (error, result) => {
        if (error) { return fn.mysqlError(error); }

        if (result.length === 1) {
            eventdata = result[0];
        }

        if (eventdata.type !== 'ready') {
            return res.status(409).json({
                'error': 'Stream is not editable at this time.'
            });
        }

        // Modify each field with specified update data
        if ( req.body.eventname ) eventdata.eventname = req.body.eventname;
        if ( req.body.streamkey ) eventdata.streamkey = req.body.streamkey;
        if ( req.body.start ) eventdata.start = req.body.start;
        if ( req.body.stop ) eventdata.stop = req.body.stop;

        // Actually update the database record
        connection.query('UPDATE streams SET eventname = ?, streamkey = ?, start = ?, stop = ? WHERE id = ?', [eventdata.eventname, eventdata.streamkey, eventdata.start, eventdata.stop, streamId], (error, result) => {
            if (error) { return fn.mysqlError(error, res); }
            return res.status(202).json({ 'status': 'OK', 'message': result.affectedRows + ' record(s) updated.' });
        });

    });
}


module.exports = {
    get_streams: get_streams,
    get_stream: get_stream,
    get_for_user: get_for_user,
    create_event: create_event,
    edit_event: edit_event
}