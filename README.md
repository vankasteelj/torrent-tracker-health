# Torrent-Tracker-Health

Get health info for torrents. This module is based on [torrent-tracker](https://github.com/vankasteelj/torrent-tracker) and returns the seeds, peers, completed, and information about torrents, given a file, magnet link, or directory.

## Quickstart

`$ npm install -g torrent-tracker-health`

## Usage

### Code

```js
var torrentHealth = require('torrent-tracker-health');
var uri = // Could be a magnet link, torrent file location, or torrent directory.
torrentHealth(uri, options).then(res => {
    console.log(res);
});
```

### Global / CLI and options

```sh
$ npm i -g torrent-tracker-health
$ torrent-tracker-health -h
Usage: torrent-tracker-health [options]
  --torrent: the torrent file, magnet link, or torrent dir
  --trackers= [Optional] {tracker1/announce, tracker2/announce}, uses a default list otherwise
  --batchSize: [Optional] The number of torrents to include in the scrape request (Default 50)
  --showAllFetches: [Optional] Shows all the scrapes, instead of choosing the one with the most seeders(Default false)
  --debug: [Optional] (Default false)
```

### Output

```json
$ torrent-tracker-health --torrent test_torrent_dir
{
  "results": [
    {
      "name": "Lenin - The State and Revolution [audiobook] by dessalines",
      "hash": "bf60338d499a40e4e99ca8edffda9447402a29de",
      "length": 293313300,
      "created": "2016-10-14T07:03:14.000Z",
      "files": [...],
      "tracker": "udp://tracker.coppersurfer.tk:6969/announce",
      "seeders": 12,
      "leechers": 2,
      "completed": 2598
    },
    {
      "name": "Trotsky - Fascism - What it is and How to Fight it [audiobook] by dessalines",
      "hash": "d1f28f0c1b89ddd9a39205bef0be3715d117f91b",
      "length": 134145561,
      "created": "2016-11-13T13:12:47.000Z",
      "files": [...],
      "tracker": "udp://exodus.desync.com:6969/announce",
      "seeders": 3,
      "leechers": 0,
      "completed": 73
    }
  ],
  "options": {
    "batchSize": 50,
    "trackers": [
      "udp://tracker.coppersurfer.tk:6969/announce",
      "udp://tracker.internetwarriors.net:1337/announce",
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://exodus.desync.com:6969/announce",
      "udp://explodie.org:6969/announce"
    ],
    "showAllFetches": false
  }
}
```

### Testing

`npm test`