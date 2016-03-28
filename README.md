torrent-tracker-health
==============

Get health info for torrents. This module is based on [torrent-tracker](https://github.com/vankasteelj/torrent-tracker) and returns the number of seeds and peers.

## Quickstart

    npm install torrent-tracker-health

## Usage

```js
var torrentHealth = require('torrent-tracker-health');
var magnet = 'magnet:?xt=urn:btih:9A7290F4021048D2C176A84828E441FCB5400FB1&dn=charlie+chaplin+15+short+films+1914+1917+dvdrip&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.openbittorrent.com:80/announce';

torrentHealth(magnet).then(function (res) {
    console.log('seeds:', res.seeds);
    console.log('peers:', res.peers);
    console.log('ratio:', +(Math.round((res.peers > 0 ? res.seeds / res.peers : res.seeds) +'e+2') + 'e-2'));
}).catch(function (err) {
    console.log('error:', err);
});
```

## Options

- `blacklist`: prevent forcefully to connect to the said tracker(s)
  - a String, a RegExp, an Array of Strings or an Array of RegExps
  - example: _prevents connection to any tracker on openbittorrent.com and any tracker using port 80_
    ```js
    torrentHealth(magnet, {
        blacklist: ['openbittorrent.com', ':80']
    });
    ```
- `timeout`: timeout in milliseconds before a call to the tracker ends. Defaults on 400.
  - example: _don't try to connect to tracker for more than 10 seconds_
    ```js
    torrentHealth(magnet, {
        timeout: 10000
    });
    ```

- `force`: force a tracker to be added to the magnet's list of trackers.
  - a String, an Array of Strings
  - example: _add udp://mycustomtracker.com:6969/announce to the list of trackers_
    ```js
    torrentHealth(magnet, {
        force: ['udp://mycustomtracker.com:6969/announce']
    });
    ```

- `debug`: print various messages to `console.log`. Default to `false`
  - example:
    ```js
    torrentHealth(magnet, {
        debug: true
    });
    ```

## Going further
- The module can accept different inputs.
  - By default, it is: `torrentHealth(magnet [, options, debug])`
  - An object can be used alone: 
    ```js
    torrentHealth({
        uri: magnet,
        timeout: 1000,
        force: ['udp://mycustomtracker.com:6969/announce'],
        blacklist: ['openbittorrent'],
        debug: true
    });
    ```

- If the module couldn't contact any of the trackers, it will give an output of: 
```js
{
    seeds: 0,
    peers: 0
}
```

- The output contains a `results` Array, which has information on specific trackers that were called, and their respective responses.


--------

## License
    The MIT License (MIT)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

This is a complete rewrite of torrent-health by Slashmanx.