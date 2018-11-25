#!/usr/bin/env node

var fs = require('fs');
var torrentHealth = require('./index.js');
// var torrentHealth = require('torrent-tracker-health');

var argv = require('minimist')(process.argv.slice(2));

if (argv._.length !== 0 || !argv.torrent) {
  console.error([
    'Usage: torrent-tracker-health [options]',
    '  --torrent: the torrent file or magnet link',
    '  --timeout: millisecond timeout',
    '  --addTrackers={tracker1/announce, tracker2/announce} or --addTrackers=tracker1/announce',
  ].join('\n'));
  process.exit(1);
} else {
  var timeout = (!argv.timeout) ? 400 : argv.timeout;
  var opts = {};
  opts.timeout = argv.timeout;
  opts.force = argv.addTrackers;

  if (argv.torrent) {
    torrentHealth(argv.torrent, opts).then(function (res) {
      console.log(JSON.stringify(res, null, 2));
    }).catch(function (err) {
      console.log('error:', err);
    }).then(() => {
      process.exit(1);
    });
  }
}

