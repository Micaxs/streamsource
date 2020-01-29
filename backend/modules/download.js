
const allowedFiletypes = ['mp4', 'flv'];

function download_video(req, res) {
    let filename = req.params.name;
    let filetype = req.query.type;

    if (!filetype) {
        filetype = 'mp4';
    }

    if (!allowedFiletypes.includes(filetype)) {
        res.status(415).json({'error':'Filetype is not supported.', 'allowedFiletypes': allowedFiletypes });
    }

    let file = `/home/streaming/vod/${filename}/${filename}.${filetype}`;

    res.download(file);
}

module.exports = {
    download: download_video
}