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
                    var announce = info.announce[i];
                    if (announce.indexOf('/announce') === -1) {
                        announce += '/announce';
                    }

                    if (!options.blacklist.some(function (regex) {
                        if (util.isString(regex)) {
                            regex = new RegExp(regex);
                        }
                        return regex.test(announce);
                    })) {
                        trackers.push(announce);
                    }
                }

                // Add the "forced" trackers to the list
                for (var i = 0; i < options.force.length; i++) {
                    if (trackers.indexOf(options.force[i]) === -1) {
                        trackers.push(options.force[i]);
                    }
                }

                resolve({
                    name: info.name,
                    hash: info.infoHash,
                    length: info.length,
                    created: info.created,
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
                        name: req.name,
                        hash: req.hash,
                        length: req.length,
                        created: req.created,
                        tracker: trUri,
                        error: err.message
                    });
                } else {
                    debug('Scrape successful for ' + trUri);
                    resolve({
                        name: req.name,
                        hash: req.hash,
                        length: req.length,
                        created: req.created,
                        tracker: trUri,
                        response_time: Date.now() - begin,
                        seeds: data[req.hash].seeders,
                        peers: data[req.hash].leechers,
                        completed: data[req.hash].completed
                    });
                }
            });
        });
    }));
}

function calc (res) {
    var maxSeeds = 0,
        maxPeers = 0,
        maxCompleted = 0;

    var name = res[0].name;
    var hash = res[0].hash;
    var length = res[0].length;
    var created = res[0].created;

    for (var i = 0; i < res.length; i++) {
        if (!res[i].error) {
            maxSeeds = Math.max(res[i].seeds,maxSeeds);
            maxPeers = Math.max(res[i].peers,maxPeers);
            maxCompleted = Math.max(res[i].completed,maxCompleted);
        }
        delete res[i].name;
        delete res[i].hash;
        delete res[i].length;
        delete res[i].created;
    };

    return {
        name: name,
        hash: hash,
        length: length,
        created: created,
        seeds: maxSeeds,
        peers: maxPeers,
        completed: maxCompleted,
        results: res
    };
}

module.exports = function (uri, options, debug) {
    return read(uri, options, debug)
        .then(scrape)
        .then(calc)
};