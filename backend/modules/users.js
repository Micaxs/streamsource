// Packages
const fn = require('./helpers.js');
const moment = require('moment');
const fs = require('fs');
const database = require('./database.js');
const crypto = require('crypto');

// Configurables
const priv_encryption_key = 'TLvY#vz6C6K5XxTYE@=eY6@K8Uz?bW$DFdKfEyxhE^-KSr45DBXtPXEE#&GFuaJTeB@6&KymuhE=C=pc6cFJzCpNyLuX4sVXKh6rc7qXeF%!pLCghZnp6qjuvFgDD$HV';
const str_split = '|&#!*|';

// MySQL Database Connection
// Database.
let connection = database.init();

/**
 * Login handler
 */
function login(req, res) {
    let email = req.body.email;
    let password = req.body.password;
    let hashed_password = crypto.createHmac('sha256', priv_encryption_key).update(password).digest('hex');
    connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, hashed_password], (error, results, fields) => {
        if (error) {
            res.status(500).send({
                "code": 500,
                "failed": "MySQL Error Occurred."
            });
            return;
        }
        if (results.length > 0) {
            let user = results[0];
            let now = moment().format("YYYY-MM-DD HH:mm:ss");
            let un_token = JSON.stringify(user) + str_split + now;
            let token = fn.encrypt(un_token);

            res.status(200).json({
                'token': token
            });
        } else {
            res.status(401).json({
                'error': 'Invalid credentials.'
            });
        }
    });
}


function register(req, res) {
    // Registration fields
    let email = String(req.body.email);
    let password = req.body.password;
    let token = req.body.token;
    let hashed_password = crypto.createHmac('sha256', priv_encryption_key).update(password).digest('hex');
    let firstname = req.body.firstname || '';
    let lastname = req.body.lastname || '';
    let phone = req.body.phone || '';
    let country = req.body.country || '';
    let last_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Check required fields being filled in.
    if (!email || !password || !token || !last_ip) {
        return res.status(400).json({
            'error': 'Invalid fields specified.'
        });
    }

    // check if account exists with email
    connection.query('SELECT * FROM streaming.users WHERE email = ?', [email], (error, results, fields) => {
        if (error) { return fn.mysqlError(error, res); }
        if (results.length > 0) {
            console.log('Account exsits!', results, results.length);
            return res.status(400).json({
                'error': 'Account with email already exists!'
            });
        } else {
            // Process Registration
            connection.query('SELECT * FROM streaming.authorization WHERE registration_key = ?', [token], (error, results, fields) => {
                if (error) { return fn.mysqlError(error, res); }
                if (results.length > 0) {
                    // Check if registration token is valid.
                    const authorization = results[0];
                    if (moment(authorization.valid_until) < moment()) {
                        return res.status(403).json({
                            'error': 'Your registration token has expired!'
                        });
                    } else {
                        connection.query('INSERT INTO users (email, password, first_name, last_name, phone, country, last_ip, authid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [email, hashed_password, firstname, lastname, phone, country, last_ip, authorization.id], (error, result) => {
                            if (error) { return fn.mysqlError(error, res); }
                            return res.status(201).json({
                                "message": "Successfully created your account! Your license is valid until " + moment(authorization.valid_until).format()
                            });
                        });
                    }
                } else {
                    return res.status(401).json({
                        'error': 'Invalid registration token specified.'
                    });
                }
            });
        }
    });
}


function userdata(req, res) {
    let token = req.headers.authorization;
    if (token) {
        let un_token = fn.decrypt(token);
        let tokenParts = un_token.split(str_split);
        let userData = JSON.parse(tokenParts[0]);
        delete userData.password;
        return res.status(200).json({
            'data': userData
        });
    } else {
        return res.status(401).json({
            'error': 'Unauthorized'
        });
    }
}



/**
 * Check for a valid token within the Authorization header.
 */
function check_token(req, res, next) {
    let token = req.headers.authorization;
    if (token) {
        let un_token = fn.decrypt(token);
        let tokenParts = un_token.split(str_split);
        let now = moment();
        let end = moment(tokenParts[tokenParts.length - 1]);
        let duration = moment.duration(now.diff(end));
        let nrOfHoursSince = duration.asHours();
        if (nrOfHoursSince > 6) {
            return res.status(401).json({
                'error': 'Token expired, tokens are only valid for 6 hours after login before timed out!',
                'type': 'timedout'
            });
        } else {
            next();
        }
    } else {
        return res.status(401).json({
            'error': 'Unauthorized'
        });
    }
}

module.exports = {
    login: login,
    register: register,
    check_token: check_token,
    userdata: userdata
}