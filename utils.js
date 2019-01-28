var fs = require('fs'),
  path = require('path');

var _debug = false;
function debug() {
  if (!_debug) return;
  console.debug.apply(console, arguments);
}

const defaultTrackers = [
  "udp://tracker.coppersurfer.tk:6969/announce",
  "udp://tracker.open-internet.nl:6969/announce",
  "udp://tracker.leechers-paradise.org:6969/announce",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://tracker.internetwarriors.net:1337/announce",
  "udp://9.rarbg.to:2710/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker1.itzmx.com:8080/announce",
  "udp://explodie.org:6969/announce"
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
    return false;
  }
}

function isFile(path) {
  try {
    var stat = fs.lstatSync(path);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

function collectUris(uri) {
  if (isDir(uri)) {
    return torrentFilesInDir(uri);
  } 
  // If its a file that doesn't end in .torrent
  else if (isFile(uri) && uri.split('.').pop() !== 'torrent') {
    return fs.readFileSync(uri).toString().trim().split('\n').map(f => 'magnet:?xt=urn:btih:' + f);
  }
  // If its a magnet link or single torrent file
  else {
    return [uri];
  }
}

function torrentFilesInDir(dir) {
  return fs.readdirSync(dir).map(file => path.join(dir, file)).filter(f => f.endsWith('.torrent'));
}

function chunk(inputArray, perChunk) {
  return inputArray.reduce((all, one, i) => {
    const ch = Math.floor(i / perChunk);
    all[ch] = [].concat((all[ch] || []), one);
    return all
  }, []);
}

module.exports = { rearrange, torrentFilesInDir, isDir, isFile, collectUris, chunk, debug, defaultTrackers };