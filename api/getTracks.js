// @ts-check
const request = require('request')
const querystring = require('querystring')
const BPromise = require('bluebird')
const { spotifyBaseUrl } = require('../config')
const chunkArray = require('../utils/chunkArray')

const getTracks = ({ trackIds, token }) =>
  new Promise((resolve, reject) => {
    const query = querystring.stringify({
      ids: trackIds.join(','),
      market: 'from_token',
    })
    const requestURL = `${spotifyBaseUrl}/tracks?${query}`

    let options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token },
      json: true,
    }

    request.get(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }
      return resolve(body.tracks)
    })
  })

module.exports = async ({ token, trackIds }) => {
  const chunkedTracks = chunkArray(trackIds, 50)
  const tracksChunked = await BPromise.mapSeries(chunkedTracks, (ids) =>
    getTracks({ token, trackIds: ids })
  )
  const allTracks = tracksChunked.reduce((acc, curr) => [...acc, ...curr], [])

  return allTracks
}
