var utils = require('./utils'),
  Client = require('bittorrent-tracker'),
  readTorrent = require('read-torrent');

function read(uri, options) {
  return new Promise(async (resolve, reject) => {

    // If its a torrent directory, collect them up
    var uris = utils.collectUris(uri);

    options = utils.rearrange(options);

    // Get only the ones without read errors
    var allTorrents = await Promise.all(uris.map(p => singleRead(p, options).catch(e => e)));
    var torrents = allTorrents.filter(result => !(result instanceof Error));

    utils.debug(torrents);

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
        utils.debug('Error in read-torrent: ' + err.message +  ' for torrent uri: ' + uri);
        reject(err);
      }
    });
  });
}

function scrape(req) {
  var promises = [];

  // Loop over trackers
  req.options.trackers.map(trUri => {
    var hashes = req.torrents.map(t => t.hash);

    // Do in 50 torrent batches
    for (var i = 0; i < hashes.length; i += req.options.batchSize) {
      promises.push(new Promise((resolve, reject) => {
        var subhashes = hashes.slice(i, i + req.options.batchSize);
        Client.scrape({ announce: trUri, infoHash: subhashes }, (err, data) => {
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
            var firstHash = subhashes[0];
            if (data[firstHash] == undefined) {
              var map = {};
              map[firstHash] = data;
              data = map;
            }

            let list = Object.entries(data).map(e => {
              var torrent = Object.assign({}, req.torrents.find(t => t.hash === e[0]));
              torrent.seeders = e[1].complete;
              torrent.completed = e[1].downloaded;
              torrent.leechers = e[1].incomplete;
              torrent.tracker = trUri;
              return torrent;
            });
            resolve({
              torrents: list,
              options: req.options
            });
          }
        });
      }));
    }
  });

  return Promise.all(promises);
}

function calc(res) {
  var options = res[0].options;
  var torrents = res.map(t => t.torrents).filter(Boolean);

  var flattened = torrents.reduce((a, b) => a.concat(b), []);

  var groupedByHash = flattened.reduce(
    (result, i) => ({
      ...result,
      [i.hash]: [
        ...(result[i.hash] || []),
        i,
      ],
    }), {},
  );

  var grouped = Object.entries(groupedByHash).map(e => {
    let first = e[1].find(h => h.hash !== undefined);
    let fetches = e[1].map(f => {
      return {
        tracker: f.tracker,
        seeders: f.seeders,
        leechers: f.leechers,
        completed: f.completed,
        error: f.error
      }
    });

    return {
      name: first.name,
      hash: first.hash,
      length: first.length,
      created: first.created,
      files: first.files,
      fetches: fetches
    }
  });

  // Early return if they want all the fetches
  if (options.showAllFetches) {
    return {
      results: grouped,
      options: options
    }
  }

  var maxes = grouped.map(f => {
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

  utils.debug(`lengths\n-------\nflattened: ${flattened.length}\nmaxes: ${maxes.length}`);

  return {
    results: maxes,
    options: options
  }
}

module.exports = function (uri, options) {
  return read(uri, options)
    .then(scrape)
    .then(calc)
};