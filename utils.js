var fs = require('fs'),
  path = require('path');

var _debug = false;
function debug() {
  if (!_debug) return;
  console.debug.apply(console, arguments);
}

const defaultTrackers = [
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.internetwarriors.net:1337/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://explodie.org:6969/announce'
];

function rearrange(options) {
  if (!options) options = {};

  _debug = (!options.debug) ? false : true;

  if (!options.trackers) {
    options.trackers = defaultTrackers;
  }

  // Make sure options.trackers is an array
  if (!Array.isArray(options.trackers)) {
    options.trackers = options.trackers ? [options.trackers] : [];
  }

  if (!options.batchSize) {
    options.batchSize = 50;
  }

  if (!options.showAllFetches) {
    options.showAllFetches = false;
  }

  return options;
}

function isDir(path) {
  try {
    var stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}

function torrentFilesInDir(dir) {
  return fs.readdirSync(dir).map(file => path.join(dir, file)).filter(f => f.endsWith('.torrent'));
}

module.exports = { rearrange, torrentFilesInDir, isDir, debug, defaultTrackers };