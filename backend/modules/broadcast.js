const fs = require('fs');
const shell = require('shelljs');
const database = require('./database.js');

/**
 * Publish a Stream
 * Make it accessible to the general public.
 *
 * @param {object} req HTTP Request Object
 * @param {object} res HTTP Response Object
 */
function publish(req, res) {

    // Grab params
    let app = req.params.app;
    let name = req.params.name;

    // Compute the link
    let link = `/home/streaming/published/${app}/${name}`;
    let streampath = `/home/streaming/${app}/${name}`;

    // Check if already published
    let symlinkExists = false;
    try {
        symlinkExists = fs.lstatSync(link);
    } catch(error) {
        symlinkExists = false;
    }

    if (symlinkExists && symlinkExists.isSymbolicLink()) {
        res.status(409).json({ 'error': 'Stream is already published.' });
        return;
    }

    // Create the subpath
    shell.mkdir('-p', `/home/streaming/published/${app}`);

    // Create the symlink (Simulate publish basicly...)
    shell.ln('-sf', streampath, link);


    res.status(200).json({
        'status': 'published'
    });

    return;
}


/**
 * Unpublish a Stream
 * Make it unaccessible to the general public.
 *
 * @param {object} req HTTP Request Object
 * @param {object} res HTTP Response Object
 */
function unpublish(req, res) {

    // Grab params
    let app = req.params.app;
    let name = req.params.name;

    // Compute the link
    let link = `/home/streaming/published/${app}/${name}`;
    let streampath = `/home/streaming/${app}/${name}`;

    let symlinkExists = false;
    try {
        symlinkExists = fs.lstatSync(link);
    } catch(error) {
        symlinkExists = false;
    }
    if (!symlinkExists || !symlinkExists.isSymbolicLink()) {
        res.status(409).json({ 'error': 'Stream is already unpublished.' });
        return;
    }

    shell.rm('-rf', link);

    res.status(200).json({
        'status': 'unpublished'
    });

    return;
}


/**
 * Check if Stream is published
 * @param {string} app Appname (live|vod)
 * @param {string} stream Streamname
 */
function checkIfPublished(app, stream) {
    // Compute the link
    let link = `/home/streaming/published/${app}/${stream}`;

    let symlinkExists = false;
    try {
        symlinkExists = fs.lstatSync(link);
        if (symlinkExists || symlinkExists.isSymbolicLink()) {
            return symlinkExists;
        } else {
            return false;
        }
    } catch(error) {
        return false;
    }
}


// Exports
module.exports = {
    publish: publish,
    unpublish: unpublish,
    checkState: checkIfPublished
}
