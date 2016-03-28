'use strict'

var readTorrent = require('read-torrent'),
    Tracker = require('torrent-tracker'),
    util = require('util');

var _debug = false;
function debug () {
    if (!_debug) return;
    console.log.apply(console, arguments);
}

function rearrange (uri, options, debug) {
    if (!options) options = {};

    // debug
    _debug = (debug === true || options.debug) ? true : false;

    // Make sure options.uri is there
    if (util.isObject(uri)) {
        options = uri;
    } else {
        options.uri = uri;
    }

    // Make sure options.blacklist is an array
    if (!util.isArray(options.blacklist)) {
        options.blacklist = options.blacklist ? [options.blacklist] : [];
    }

    // Make sure options.force is an array
    if (!util.isArray(options.force)) {
        options.force = options.force ? [options.force] : [];
    }

    // Set a timeout
    if (!options.timeout && options.timeout !== false || options.timeout === true) {
        options.timeout = 400;
    }

    if (!options.uri) {
        throw 'No torrent URI specified';
    }

    return options;
}

function read (uri, options, debug) {
    return new Promise(function (resolve, reject) {
        options = rearrange(uri, options, debug);

        readTorrent(options.uri, function (err, info) {
            if (!err) {
                var trackers = [];

                // Make sure info.announce is an array
                if (!util.isArray(info.announce)) {
                    info.announce = info.announce ? [info.announce] : [];
                }

                // Remove the "blacklisted" trackers from the list
                for (var i = 0; i < info.announce.length; i++) {
                    if (!options.blacklist.some(function (regex) {
                        if (util.isString(regex)) {
                            regex = new RegExp(regex);
                        }
                        return regex.test(info.announce[i]);
                    })) {
                        trackers.push(info.announce[i]);
                    }
                }

                // Add the "forced" trackers to the list
                for (var i = 0; i < options.force.length; i++) {
                    if (trackers.indexOf(options.force[i]) === -1) {
                        trackers.push(options.force[i]);
                    }
                }

                resolve({
                    hash: info.infoHash,
                    trackers: trackers,
                    timeout: options.timeout
                });
            } else {
                debug('Error in read-torrent: ' + err.message);
                reject(err);
            }
        });
    });
}

function scrape (req) {
    return Promise.all(req.trackers.map(function (trUri) {
        return new Promise(function (resolve, reject) {
            debug('Obtaining tracker for ' + trUri);
            var tracker = new Tracker(trUri);
            var begin = Date.now();
            tracker.scrape([req.hash], {
                timeout: req.timeout
            }, function (err, data) {
                if (err) {
                    if (err.message === 'timed out' || err.code === 'ETIMEDOUT') {
                        debug('Scrape timed out for ' + trUri);
                    } else {
                        debug('Error in torrent-tracker: ' + err.message);
                    }
                    resolve({
                        tracker: trUri,
                        error: err.message
                    });
                } else {
                    debug('Scrape successful for ' + trUri);
                    resolve({
                        tracker: trUri,
                        response_time: Date.now() - begin,
                        seeds: data[req.hash].seeders,
                        peers: data[req.hash].leechers
                    });
                }
            });
        });
    }));
}

function calc (res) {
    var totalSeeds = 0,
        totalPeers = 0,
        total = 0;

    for (var i = 0; i < res.length; i++) {
        if (!res[i].error) {
            totalSeeds += res[i].seeds | 0;
            totalPeers += res[i].peers | 0;
            total++;
        }
    };

    // Avoid divide-by-zero issues
    if (total === 0) total = 1;

    return {
        seeds: Math.round(totalSeeds / total),
        peers: Math.round(totalPeers / total),
        results: res
    };
}

module.exports = function (uri, options, debug) {
    return read(uri, options, debug)
        .then(scrape)
        .then(calc);
};