// @ts-check
const request = require('request')
const querystring = require('querystring')
const BPromise = require('bluebird')
const { spotifyBaseUrl } = require('../config')
const chunkArray = require('../utils/chunkArray')

const addTracksToPlaylist = async ({ token, playlistUrl, tracks }) =>
  new Promise((resolve, reject) => {
    const requestURL = playlistUrl

    /** @type {request.UrlOptions & request.CoreOptions} */
    const options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token },
      json: true,
      body: {
        uris: tracks,
      },
    }

    request.post(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      return resolve()
    })
  })

module.exports = async ({ token, playlistUrl, tracks }) => {
  const chunkedTracks = chunkArray(tracks, 50)
  await BPromise.mapSeries(chunkedTracks, (tracks) =>
    addTracksToPlaylist({ token, tracks, playlistUrl })
  )
}
