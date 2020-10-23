// @ts-check
const request = require('request')
const { spotifyBaseUrl } = require('../config')

module.exports = async ({ token, deviceId }) =>
  new Promise((resolve, reject) => {
    const requestURL = `${spotifyBaseUrl}/me/player`

    /** @type {request.UrlOptions & request.CoreOptions} */
    const options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      json: true,
      dataType: 'json',
      body: {
        device_ids: [deviceId]
      },
    }

    request.put(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      return resolve()
    })
  })
