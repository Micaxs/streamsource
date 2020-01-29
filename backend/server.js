const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const OS = require('os');
let HLSConn = [];

// CORS ? Yeeeet
app.use(cors());
app.options('*', cors());


// JSON body things in POST.
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


// Modules
const database = require('./modules/database.js');
const fn = require('./modules/helpers.js');
const postProcess = require('./modules/postprocess.js');
const dl = require('./modules/download.js');
const broadcast = require('./modules/broadcast.js');
const cb = require('./modules/callbacks.js');
const web = require('./modules/web.js');

const users = require('./modules/users.js');
const events = require('./modules/events.js');



function cpuAverage() {
  let totalIdle = 0, totalTick = 0;
  let cpus = OS.cpus();
  for (let i = 0, len = cpus.length; i < len; i++) {
    let cpu = cpus[i];
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

function percentageCPU() {
  return new Promise(function (resolve, reject) {
    let startMeasure = cpuAverage();
    setTimeout(() => {
      let endMeasure = cpuAverage();
      let idleDifference = endMeasure.idle - startMeasure.idle;
      let totalDifference = endMeasure.total - startMeasure.total;
      let percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
      resolve(percentageCPU);
    }, 100);
  });
}

// Database.
database.init();
let connection = database.con;

// Stats Management
app.all(['*.m3u8', '*.ts'], (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let uri = req.url;
  // Attempt to make it somehow 1 unique viewer per ip per stream.
  // TODO: Improve!!
  ip = Buffer.from('$*#!' + ip).toString('base64');
  let data = { ip, url: uri };
  if (!uri.includes('.m3u8')) {
    HLSConn.push(data);
    setTimeout(() => {
      if (HLSConn.includes(data)) {
        let idx = HLSConn.indexOf(data);
        if (idx !== -1) {
          HLSConn.splice(idx, 1);
        }
      }
    }, 35000);
  }
  if (uri.includes('.ts')) {
    HLSConn.forEach((item, idx) => {
      if (fn.getTS(item.url)+1 === fn.getTS(uri)) {
        if (item.ip === ip) {
          HLSConn.splice(idx, 1);
        }
      }
    });
  }
  next();
});

// Serve the public the published live & vod streams.
app.use('/vod', express.static('/home/streaming/published/vod'));
app.use('/live', express.static('/home/streaming/published/live'));


// CORS Management and all that.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


/**  ---- API ROUTES ---- */
// GET '/'
app.get('/', (req, res) => {
  res.json({'version': '1.0.0', 'status': true});
});

// GET '/stats'
app.get('/stats', (req, res) => {
  let viewers = {
    live: 0,
    vod: 0,
    total: 0
  };
  let streamConn = {
    vod: {},
    live: {}
  };
  let sysinfo = {};

  // Connections..
  HLSConn.forEach((viewer) => {
    let parts = viewer.url.split('/'); // ["", "vod", "mica", "stream_00000.ts"]
    let app = parts[1];
    let stream = parts[2];
    viewers.total++;
    if (app === 'vod') {
      viewers.vod++;
    }
    if (app === 'live') {
      viewers.live++;
    }
    if (streamConn[app].hasOwnProperty(stream)) {
      streamConn[app][stream]++;
    } else {
      streamConn[app][stream] = 1;
    }
  });

  let usedMem = OS.totalmem() - OS.freemem();

  percentageCPU().then((cpuload) => {
    sysinfo.cpu = cpuload.toFixed(2);
    sysinfo.ram = Math.round(usedMem /  OS.totalmem() * 100).toFixed(2);

    let stats = { sysinfo, viewers, streamViews: streamConn, connections: HLSConn };
    return res.status(200).json(stats);

  }).catch((err) => {
    return res.status(500).end();
  });

});



// GET '/streams'
app.get('/streams', (req, res) => {
  let streams = {
    'live': [],
    'vod': [],
    'total': {
      'live': 0,
      'vod': 0
    }
  }

  // Retrieve all available VOD's
  const vodSource = '/home/streaming/vod';
  let vods = fs.readdirSync(vodSource);
  vods.forEach((item) => {
    if (fs.lstatSync(vodSource + '/' + item).isDirectory()) {
      let returnObjVod = {
        'name': item,
        'download': {
          'mp4': `/download/vod/${item}`,
          'flv': `/download/vod/${item}?type=flv`
        }
      };

      // Get creation date of VOD
      let fileInfo = fn.getFileInfo(vodSource + '/' + item);
      if (fileInfo) {
        returnObjVod.createdOn = fileInfo.birthtime;
      }

      let checkifPub = broadcast.checkState('vod', item);
      if (checkifPub) {
        returnObjVod.published = true;
        returnObjVod.publishedOn = checkifPub.birthtime;
        returnObjVod.streams = {
          'hls': `/vod/${item}/playlist.m3u8`
        };
      } else {
        returnObjVod.published = false;
      }

      streams.vod.push(returnObjVod);
    }
  });

  // Retrieve all available LIVE's
  const liveSource = '/home/streaming/live';
  let lives = fs.readdirSync(liveSource);
  lives.forEach((item) => {
    if (fs.lstatSync(liveSource + '/' + item).isDirectory()) {
      let returnObjLive = {'name': item };

      // Get creation date of VOD
      let fileInfo = fn.getFileInfo(liveSource + '/' + item + '/playlist.m3u8');
      if (fileInfo) {
        returnObjVod.createdOn = fileInfo.birthtime;
      }

      let checkifPub = broadcast.checkState('live', item);
      if (checkifPub) {
        returnObjLive.published = true;
        returnObjLive.publishedOn = checkifPub.birthtime;
        returnObjLive.streams = {
          'hls': `/live/${item}/${item}.m3u8`
        };
      } else {
        returnObjLive.published = false;
      }
      streams.live.push(returnObjLive);
    }
  });

  streams.total.vod = streams.vod.length;
  streams.total.live = streams.live.length;

  res.status(200).json(streams);
  return;
});

// POST '/manage/:app/:name/publish' && '/manage/:app/:name/unpublish'
app.post('/manage/:app/:name/publish', broadcast.publish);
app.post('/manage/:app/:name/unpublish', broadcast.unpublish);

// POST '/video/trim'
app.post('/video/trim', postProcess.trim);

// GET '/download/:name?type=mp4'
app.get('/download/:name', dl.download);




// Route: '/login, /register, /userdata' (No Authentication Required)
app.post('/login', cors(), users.login);                // POST '/login'
app.post('/register', cors(), users.register);          // POST '/register'
app.get('/userdata', users.userdata);                   // GET '/userdata'


// Route: '/cb' (No Authentication Required)
app.post('/cb/push', cb.push);                          // POST '/cb/push'


// Route: '/events' (Authentication Required)
app.all('/events/*', users.check_token);

app.get('/events', events.get_streams);                 // GET '/events'
app.get('/events/:streamkey', events.get_stream);       // GET '/events/:streamkey'
app.get('/events/owned', events.get_for_user);          // GET '/events/owned'
app.post('/events', events.create_event);               // POST '/events'
app.put('/events/:id', events.edit_event);              // PUT '/events/:id'









app.listen(port, () => fn.log(`Running on port: ${port}`));
