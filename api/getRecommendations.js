// @ts-check
const request = require('request')
const querystring = require('querystring')
const { spotifyBaseUrl } = require('../config')

module.exports = async ({ token, recommendationSettings }) =>
  new Promise((resolve, reject) => {
    const query = querystring.stringify({
      limit: 100,
      market: 'from_token',
      ...recommendationSettings,
    })
    const requestURL = `${spotifyBaseUrl}/recommendations?${query}`

    /** @type {request.UrlOptions & request.CoreOptions} */
    const options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token },
      json: true,
    }

    request.get(options, function (error, response, body) {
      if (error) {
        return reject(error)
      }

      return resolve(body)
    })
  })
