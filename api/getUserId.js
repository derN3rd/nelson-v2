// @ts-check
const request = require('request')
const { spotifyBaseUrl } = require('../config')

/** 
  @returns {Promise<number>} userId
*/
module.exports = async ({ token }) =>
  new Promise((resolve, reject) => {
    const requestURL = `${spotifyBaseUrl}/me`

    const options = {
      url: requestURL,
      headers: { Authorization: 'Bearer ' + token },
      json: true,
    }

    request.get(options, (error, response, body) => {
      if (error) {
        return reject(error)
      }
      const userId = body.id

      return resolve(userId)
    })
  })
