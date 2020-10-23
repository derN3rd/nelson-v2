// @ts-check
const request = require('request')
const { spotifyBaseUrl } = require('../config')

/** 
  @returns {Promise<string>} url of the playlist
*/
module.exports = async ({ userId, token, genres, features }) =>
  new Promise((resolve, reject) => {
    const requestURL = `${spotifyBaseUrl}/users/${userId}/playlists`

    const options = {
      url: requestURL,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      json: true,
      dataType: 'json',
      body: {
        name: 'Nelson Recommended Tracks',
        description: `Recommended tracks based on ${genres} with ${features}`,
      },
    }

    request.post(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      const playlistUrl = body.tracks.href

      return resolve(playlistUrl)
    })
  })
