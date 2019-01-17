#!/usr/bin/env node
var torrentHealth = require('./index.js'),
  argv = require('minimist')(process.argv.slice(2));

if (argv._.length !== 0 || !argv.torrent) {
  console.error([
    'Usage: torrent-tracker-health [options]',
    '  --torrent: the torrent file, magnet link, or torrent dir',
    '  --trackers= [Optional] {tracker1/announce, tracker2/announce}, uses a default list otherwise',
    '  --batchSize: [Optional] The number of torrents to include in the scrape request (Default 50)',
    '  --showAllFetches: [Optional] Shows all the scrapes, instead of choosing the one with the most seeders(Default false)',
    '  --debug: [Optional] (Default false)',
  ].join('\n'));
  process.exit(1);
} else {
  var opts = {
    batchSize: argv.batchSize,
    trackers: argv.trackers,
    showAllFetches: argv.showAllFetches,
    debug: argv.debug
  }
  if (argv.torrent) {
    torrentHealth(argv.torrent, opts).then(r => {
      console.log(JSON.stringify(r, null, 2));
    }).catch(function (err) {
      console.log('error:', err);
    });
  }
}

