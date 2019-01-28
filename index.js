var utils = require('./utils'),
  Client = require('bittorrent-tracker'),
  readTorrent = require('read-torrent');

function read(uri, options) {
  return new Promise(async (resolve, reject) => {

    // If its a torrent directory or infohash file, collect them up
    var uris = utils.collectUris(uri);

    options = utils.rearrange(options);

    // Get only the ones without read errors
    var allTorrents = await Promise.all(uris.map(p => singleRead(p, options).catch(e => e)));
    var torrents = allTorrents.filter(result => !(result instanceof Error));

    resolve({
      torrents: torrents,
      options: options
    });
  });
}

function singleRead(uri, options) {
  return new Promise((resolve, reject) => {
    readTorrent(uri, (err, info) => {
      if (!err) {
        // Make sure info.announce is an array
        if (!Array.isArray(info.announce)) {
          info.announce = info.announce ? [info.announce] : [];
        }

        // Removing some extra fields from files
        if (info.files) {
          info.files.forEach(f => {
            delete f.name;
            delete f.offset;
          });
        }
        var created = (info.created) ? info.created : new Date().toISOString();
        resolve({
          name: info.name,
          hash: info.infoHash,
          length: info.length,
          created: created,
          files: info.files
        });
      } else {
        utils.debug('Error in read-torrent: ' + err.message + ' for torrent uri: ' + uri);
        reject(err);
      }
    });
  });
}

async function scrapeAll(req) {

  // Loop over trackers and hashes in batches
  var hashes = req.torrents.map(t => t.hash);
  let slices = utils.chunk(hashes, req.options.batchSize);

  for (const subhashes of slices) {
    for (const trUri of req.options.trackers) {
      let data = await scrape(trUri, subhashes);

      // Add the peer counts to the req
      Object.entries(data).map(e => {
        var torrent = req.torrents.find(t => t.hash === e[0]);
        if (torrent) {
          if (!torrent.fetches) torrent.fetches = [];
          torrent.fetches.push({
            seeders: e[1].complete,
            completed: e[1].downloaded,
            leechers: e[1].incomplete,
            tracker: trUri,
          });
        }
      });
    }
  }

  return req;
}

function scrape(trUri, infohashes) {
  return new Promise((resolve, reject) => {
    Client.scrape({ announce: trUri, infoHash: infohashes }, (err, data) => {

      if (err) {
        if (err.message === 'timed out' || err.code === 'ETIMEDOUT') {
          utils.debug('Scrape timed out for ' + trUri);
        } else {
          utils.debug('Error in torrent-tracker: ' + err.message);
        }
        resolve({
          tracker: trUri,
          error: err.message
        });
      } else {
        utils.debug('Scrape successful for ' + trUri);

        // Coerce single fetch as same structure as multiple
        var firstHash = infohashes[0];
        if (data[firstHash] == undefined) {
          var map = {};
          map[firstHash] = data;
          data = map;
        }

        resolve(data);
      }
    });
  });
}

function calc(res) {
  var options = res.options;
  var torrents = res.torrents;

  // Early return if they want all the fetches
  if (options.showAllFetches) {
    return {
      results: torrents,
      options: options
    }
  }

  var maxes = torrents.map(f => {
    var maxFetch = f.fetches.reduce((a, b) => a.seeders > b.seeders ? a : b);
    return {
      name: f.name,
      hash: f.hash,
      length: f.length,
      created: f.created,
      files: f.files,
      tracker: maxFetch.tracker,
      seeders: maxFetch.seeders,
      leechers: maxFetch.leechers,
      completed: maxFetch.completed,
    }
  });

  return {
    results: maxes,
    options: options
  }
}

module.exports = function (uri, options) {
  return read(uri, options)
    .then(scrapeAll)
    .then(calc);
}