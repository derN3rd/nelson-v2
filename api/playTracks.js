// @ts-check
const request = require('request')
const querystring = require('querystring')
const { spotifyBaseUrl } = require('../config')

module.exports = async ({ token, deviceId, tracks }) =>
  new Promise((resolve, reject) => {
    const query = querystring.stringify({
      device_id: deviceId,
    })
    const requestURL = `${spotifyBaseUrl}/me/player/play?${query}`

    /** @type {request.UrlOptions & request.CoreOptions} */
    const options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token },
      json: true,
      body: {
        body: { uris: tracks },
      },
    }

    request.put(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      console.log(response)

      return resolve()
    })
  })
