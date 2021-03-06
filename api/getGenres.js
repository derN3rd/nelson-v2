// @ts-check
const request = require('request')
const { spotifyBaseUrl } = require('../config')

module.exports = async ({ token }) =>
  new Promise((resolve, reject) => {
    const requestURL = spotifyBaseUrl + '/recommendations/available-genre-seeds'

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

      return resolve(body.genres)
    })
  })
