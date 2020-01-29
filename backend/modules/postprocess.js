const fs = require('fs');
const { spawn, exec } = require('child_process');
const activeProcessing = [];
const fn = require('./helpers.js');
const shell = require('shelljs');

// Trim Video File by API POST request.
function trim_video(req, res) {
  // POST Params
  let video = req.body.video;
  let from = req.body.from || 0;
  let to = req.body.to || 0;

  // Specify the Paths
  let vodpath = `/home/streaming/vod/`;
  let videopath = `/home/streaming/vod/${video}/`;

  // Validate some inputs for successfull trim.
  if (!video || video === "") {
    res.json({'error': 'Invalid video specified.'});
    return;
  }
  if (isNaN(from) || isNaN(to)) {
    res.json({'error': 'Invalid from and/or to position specified.'});
    return;
  }
  if (activeProcessing.includes(video)) {
    res.json({'error': 'Already processing this video file.'});
    return;
  }

  // Find .flv file and start the process...
  fn.fromDir(videopath, /\.flv$/, (flvfile) => {
    fn.log(`(Post-Process) Video Trim Process Started`);

    // Grab the filename from the full path.
    let flvfileParts = flvfile.split('/');
    let fileflv = flvfileParts[flvfileParts.length-1];

    // Start the FFMPEG TRIM process (should take like a second).
    let ffmpeg_args = ['-ss', from, '-i', flvfile, '-c', 'copy', '-t', to, vodpath+'/'+ fileflv];
    let ffmpeg = spawn('ffmpeg', ffmpeg_args);

    // When finished, remux to MP4, HLS and make POSTER JPG.
    ffmpeg.on('exit', function (code, signal) {
      // Check if Success
      if (Number(code) === 0) {
        shell.exec(`sh /home/streaming/vod.sh ${video}`, {silent:true});
        fn.log(`(Post-Process) SUCCESS - Successfully trimmed ${video} to specified size.`);

        // Remove this postprocess from activeProcessing list.
        let idx = activeProcessing.indexOf(video)
        if (idx > -1) { activeProcessing.splice(idx, 1); }
      } else {
        // Failed.. and remove from activeProcessing list.
        let idx = activeProcessing.indexOf(video)
        if (idx > -1) { activeProcessing.splice(idx, 1); }
        fn.log(`(Post-Process) ERROR - Failed to trim ${video}!`);
      }
    });

    // Store in activeProcessing
    activeProcessing.push(video);

    // Simply respond that it was accepted.
    res.status(202).json({
      'postprocess': 'STARTED'
    });

  });
}


module.exports = {
  active: activeProcessing,
  trim: trim_video
}
