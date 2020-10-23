var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
const bluebird = require('bluebird');

var app = express();

const spotifyBaseUrl = 'https://api.spotify.com/v1/';

const chunkArray = (
  myArray,
  chunkSize
) => {
  const results = []

  const arrayCopy = [...myArray]
  while (arrayCopy.length) {
    results.push(arrayCopy.splice(0, chunkSize))
  }

  return results
}

const getTracks = async ({ token, trackIds }) => new Promise((resolve, reject) => {
  const requestURL = spotifyBaseUrl + 'tracks?' + 
  querystring.stringify({
    ids: trackIds.join(','),
    market: 'from_token'
  });

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    if(error) {
      return reject(error)
    }
    return resolve(body.tracks)
  });
})

/** 
  @returns {number} userId
*/
const getUserId = async ({ token }) => new Promise((resolve, reject) => {
  // 1. Get user ID
  let requestURL = spotifyBaseUrl + 'me';

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    if(error) {
      return reject(error)
    }
    const userId = body.id;
    
    return resolve(userId);
  })
})


/** 
  @returns {string} url of the playlist
*/
const createPlaylist = async ({ userId, token, genres, features }) => new Promise((resolve, reject) => {
  const requestURL = spotifyBaseUrl + 'users/' + userId + '/playlists';

  const options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    json: true,
    dataType: 'json',
    body: { "name": "Nelson Recommended Tracks", "description": "Recommended tracks based on " + genres + " with " + features }
  };

  request.post(options, function(error, response, body) {
    if(error){
      return reject(error)
    }
    
    const playlistUrl = body.tracks.href;
    
    return resolve(playlistUrl);
  })
})

const addTracksToPlaylist = async ({ token, playlistUrl, tracks }) => new Promise((resolve, reject) => {
  const requestURL = playlistUrl + '/?' +
      querystring.stringify({
        uris: tracks.join(',')
      });

  const options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.post(options, function(error, response, body) {
    if(error) {
      return reject(error)
    }
    
    return resolve();
  });
})


app.use(express.static(__dirname + '/'));

app.get('/user', function(req, res) {

  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'me';

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.json(body);
  });
});

app.get('/devices', function(req, res) {

  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'me/player/devices';

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.json(body.devices);
  });
});

app.post('/transfer', function(req, res) { 

  let device_id = req.query.device_id;
  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'me/player';
  
  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    json: true,
    dataType: 'json',
    body: { "device_ids": [device_id] }
  };
  
  request.put(options, function(error, response, body) {
    res.sendStatus(200);
  });
});

app.get('/genres', function(req, res) {

  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'recommendations/available-genre-seeds';

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    res.json(body.genres);
  });
});

app.get('/recommendations', function(req, res) {
  
  // Get token and remove from query object
  let token = req.query.token;
  delete req.query.token;

  let requestURL = spotifyBaseUrl + 'recommendations?' + 
  querystring.stringify({
    limit: 100,
    market: 'from_token'
  }) + '&' +
  querystring.stringify(req.query);
  
  //console.log(requestURL, token)

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };

  request.get(options, function(error, response, body) {
    //console.log(body)
    res.json(body);
  });
});

app.get('/tracks', function(req, res) {

  let ids = req.query.ids;
  let token = req.query.token;
  
  (async () => {
    const splitIds = ids.split(',')
    const chunkedIds = chunkArray(splitIds, 30)
    
    const tracksChunked = await bluebird.mapSeries(chunkedIds, ids => getTracks({ token, trackIds: ids }))
    const allTracks = tracksChunked.reduce((acc, curr) => [...acc,...curr] ,[])
    return res.json(allTracks)
  })().catch(e => res.sendStatus(500))
});

app.post('/playlist', function(req, res) {

  let tracks = req.query.tracks;
  let genres = req.query.genres;
  let token = req.query.token;
  let features = req.query.features;
  let userId, playlistUrl;
  
  (async () => {
    const userId = await getUserId({ token });
    const playlistUrl = await createPlaylist({ userId, token, genres, features });
    const splitTracks = tracks.split(',')
    
    const chunkedTracks = chunkArray(splitTracks, 30)
    
    await bluebird.mapSeries(chunkedTracks, async tracks => {
      return addTracksToPlaylist({ token, playlistUrl, tracks })
    })
    
  })().then(() => {
    res.sendStatus(200);
  }).catch(e => {
    res.sendStatus(500);
  })
});

app.post('/play', function(req, res) {
  let tracks = req.query.tracks;
  let device_id = req.query.device_id;
  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'me/player/play?' +
  querystring.stringify({
    device_id: device_id
  });

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    json: true,
    dataType: 'json',
    body: { "uris": tracks.split(',') }
  };

  request.put(options, function(error, response, body) {
    res.sendStatus(200);
  });
});

app.post('/pause', function(req, res) {
  let token = req.query.token;

  let requestURL = spotifyBaseUrl + 'me/player/pause';

  let options = {
    url: requestURL,
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    json: true,
    dataType: 'json',
  };

  request.put(options, function(error, response, body) {
    res.sendStatus(200);
  });
});

console.log('Listening on 8888');
app.listen(8888);
