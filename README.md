torrent-tracker-health
==============

Get health info for torrents. This library is based on torrent-tracker and returns the number of seeds and peers.

Based on [torrent-health](https://github.com/SlashmanX/torrent-health).

    var torrentHealth = require('torrent-tracker-health');
    var magnet = 'magnet:?xt=urn:btih:d2310f718eb02f98665266786f7d00b42a20f055&dn=Gone+Girl+(2014)+1080p&tr=udp://tracker.openbittorrent.com:80/announce&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.coppersurfer.tk:6969';

    torrentHealth(magnet, {
        timeout: 1000
    })
    .then(function (res) {
        console.log('seeds:', res.seeds);
        console.log('peers:', res.peers);
        console.log('ratio:', res.peers > 0 ? res.seeds / res.peers : +res.seeds);
    })
    .catch(function (err) {
        console.log('error:', err);
    });