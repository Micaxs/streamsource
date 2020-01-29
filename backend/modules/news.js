// Packages
const fn = require('./helpers.js');
const fs = require('fs');
const database = require('./database.js');
const moment = require('moment');
/* News Table 
- id
- title
- content
- datetime
- author
- likes
*/



// MySQL Database Connection
// Database.
let connection = database.init();


// Retrieve all news items
function get_news(req, res) {
    connection.query('SELECT * FROM news', (error, result, fields) => {
        if (error) { return fn.mysqlError(error, res); }
        if (result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ 'error': 'No news exists in database.' });
        }
    });
}

// Retrieve a single news items and all its details (including reactions or so maybe?)
function get_newsitem(req, res) {
    const newsId = Number(req.params.id);
    connection.query('SELECT * FROM news WHERE id = ?', [newsId], (error, result, fields) => {
        if (error) { return fn.mysqlError(error, res); }
        if (result) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ 'error': 'News item does not exist.' });
        }
    });
}

// Create a new news item post.
function create_news(req, res) {

    const title = String(req.body.title);
    const content = String(req.body.content);
    const datetime = moment().format("YYYY-MM-DD HH:mm:ss");
    const likes = 0;
    const author = String("Administrator");

    // TODO: check if title exists and error out as duplicate.
    // TODO: add some authentication / authorization check for accesslevel stuff.

    connection.query('INSERT INTO streams (title, content, datetime, likes, author) VALUES (?, ?, ?, ?, ?)', [title, content, datetime, likes, author], (err, result) => {
        if (err) { return fn.mysqlError(err, res); }
        return res.status(201).json(eventData);
    });

}

// Edit a news item
function edit_news(req, res) {
    const newsId = req.params.id;
    let newsData = {};

    connection.query('SELECT * FROM news WHERE id = ?', [newsId], (error, result) => {
        if (error) { return fn.mysqlError(error); }

        if (result.length === 1) {
            newsData = result[0];
        }

        // Modify each field with specified update data
        if ( req.body.title ) newsData.title = req.body.title;
        if ( req.body.content ) newsData.content = req.body.content;
        if ( req.body.author ) newsData.author = req.body.author;
        if ( req.body.likes ) newsData.likes = req.body.likes;

        newsData.datetime = moment().format("YYYY-MM-DD HH:mm:ss");

        // Actually update the database record
        connection.query('UPDATE news SET title = ?, content = ?, datetime = ?, likes = ?, author = ? WHERE id = ?', [newsData.title, newsData.content, newsData.datetime, newsData.likes, newsData.author, newsId], (error, result) => {
            if (error) { return fn.mysqlError(error, res); }
            return res.status(202).json({ 'status': 'OK', 'message': result.affectedRows + ' record(s) updated.' });
        });
    });
}


// Add like to news post
function like_news(req, res) {
    const newsId = Number(req.params.id);
    connection.query('UPDATE news SET likes = likes + 1 WHERE id = ?', [newsId], (error, result) => {
        if (error) { return fn.mysqlError(error, res); }
        return res.status(202).json({ 'status': 'OK', 'message': 'Liked the news item successfully.' });
    });
}



module.exports = {
    get_news: get_news,
    get_newsitem: get_newsitem,
    create_news: create_news,
    edit_news: edit_news,
    like: like_news
}