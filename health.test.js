var torrentHealth = require('./index.js'),
  Client = require('bittorrent-tracker'),
  utils = require('./utils');

const hashes = [
  'bf60338d499a40e4e99ca8edffda9447402a29de',
  'd1f28f0c1b89ddd9a39205bef0be3715d117f91b'
];

const magnetLink = 'magnet:?xt=urn:btih:bf60338d499a40e4e99ca8edffda9447402a29de&dn=Lenin%20-%20The%20State%20and%20Revolution%20[audiobook]%20by%20dessalines&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://tracker.internetwarriors.net:1337/announce&tr=udp://9.rarbg.to:2710/announce&tr=udp://exodus.desync.com:6969/announce&tr=udp://tracker1.itzmx.com:8080/announce&tr=http://tracker3.itzmx.com:6961/announce&tr=udp://explodie.org:6969/announce';

const dir = 'test_torrent_dir';
const torrentFile = 'test_torrent_dir/Lenin - The State and Revolution [audiobook] by dessalines~20161013-170437.torrent';
const infoHashesFile = dir + '/infohashes.txt';

jest.setTimeout(60000);

test('Tracker Scrape', () => {
  Client.scrape({ announce: utils.defaultTrackers[0], infoHash: hashes }, function (err, data) {
    expect(data[hashes[0]].infoHash).toEqual(hashes[0]);
    expect(data[hashes[1]].infoHash).toEqual(hashes[1]);
  });
});

test('Torrent directory', async () => {
  let res = await torrentHealth(dir);
  expect(res.results.length == 2);
  expect(res.results[0].name).toEqual('Lenin - The State and Revolution [audiobook] by dessalines');
  expect(res.results[1].name).toEqual('Trotsky - Fascism - What it is and How to Fight it [audiobook] by dessalines');
  expect(res.results[0].seeders).toBeGreaterThan(1);
});

test('Infohashes file', async () => {
  let res = await torrentHealth(infoHashesFile);
  expect(res.results.length == 2);
  expect(res.results[0].seeders).toBeGreaterThan(1);
  expect(res.results[1].seeders).toBeGreaterThan(1);
});

test('Torrent directory show all fetches', async () => {
  let res = await torrentHealth(dir, { showAllFetches: true });
  expect(res.results[0].fetches.length).toBeGreaterThan(3);
});

test('Magnet link', async () => {
  let res = await torrentHealth(magnetLink);
  expect(res.results[0].name).toEqual('Lenin - The State and Revolution [audiobook] by dessalines');
});

test('Single File', async () => {
  let res = await torrentHealth(torrentFile);
  expect(res.results[0].name).toEqual('Lenin - The State and Revolution [audiobook] by dessalines');
});
