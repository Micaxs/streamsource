const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const token_key = 'JZ8%NXkaAaGgMzgz6X7pGA4%#+NUu8@w';


function log(context) {
  console.log('[StreamAPI] ', context);
  return;
}


function kbits(bytes) {
  return (bytes / 1024).toFixed(2) + ' Kbits/s'
};


function getTSNumberFromURI(uri) {
  let tsParts = uri.split('/')
  let tsPart = tsParts[tsParts.length - 1];
  let a = tsPart.split('.')[0];
  let tsPartNr;
  if (!isNaN(a)) {
    tsPartNr = a;
  } else {
    tsPartNr = a.split('_')[1];
  }
  if (isNaN(tsPartNr)) {
    let numbers = tsPartNr.match(/\d+/g) ? tsPartNr.match(/\d+/g) : [];
    let rNr = '';
    numbers.forEach((nr) => {
      rNr = rNr + '' + nr;
    });
    tsPartNr = nr;
  }
  return Number(tsPartNr);
}


function fromDir(startPath, filter, callback) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter, callback); //recurse
    }
    else if (filter.test(filename)) callback(filename);
  };
};


function getFileInfo(fullfilepath) {
  try {
    let fileInfo = fs.lstatSync(fullfilepath);
    return fileInfo;
  } catch (error) {
    return false;
  }
}


function encrypt(text) {
  let cipher = crypto.createCipher('aes-256-ctr', token_key);
  let crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}


function decrypt(text) {
  let decipher = crypto.createDecipher('aes-256-ctr', token_key);
  let dec = decipher.update(text, 'hex', 'utf8')
  dec += decipher.final('utf8');
  return dec;
}

function handle_error(error, res) {
  console.log('MySQL Err', error);
  return res.status(500).json({
    "code": 500,
    "failed": "MySQL Error Occurred."
  });
}

function get_user_from_token(token) {
  if (token) {
    let un_token = decrypt(token);
    let tokenParts = un_token.split(str_split);
    let userData = JSON.parse(tokenParts[0]);
    return userData;
  } else {
    return false;
  }
}


module.exports = {
  log: log,
  kbits: kbits,
  getTS: getTSNumberFromURI,
  fromDir: fromDir,
  getFileInfo: getFileInfo,
  encrypt: encrypt,
  decrypt: decrypt,
  mysqlError: handle_error,
  get_user_from_token: get_user_from_token
}
