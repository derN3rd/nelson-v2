// @ts-check

const express = require('express')
const request = require('request')
const querystring = require('querystring')
const bluebird = require('bluebird')
const asyncHandler = require('express-async-handler')

const chunkArray = require('./utils/chunkArray')
const getTracks = require('./api/getTracks')
const getUserId = require('./api/getUserId')
const createPlaylist = require('./api/createPlaylist')
const addTracksToPlaylist = require('./api/addTracksToPlaylist')
const getOwnUser = require('./api/getOwnUser')
const getDevices = require('./api/getDevices')
const switchDevice = require('./api/switchDevice')
const getGenres = require('./api/getGenres')
const getRecommendations = require('./api/getRecommendations')
const playTracks = require('./api/playTracks')
const pausePlayer = require('./api/pausePlayer')

const { spotifyBaseUrl } = require('./config')

const app = express()

app.use(express.static(__dirname + '/static/'))

app.get(
  '/user',
  asyncHandler(async (req, res) => {
    const token = req.query.token
    const me = await getOwnUser({ token })

    return res.json(me)
  })
)

app.get(
  '/devices',
  asyncHandler(async (req, res) => {
    const token = req.query.token
    const devices = await getDevices({ token })

    return res.json(devices)
  })
)

app.post(
  '/transfer',
  asyncHandler(async (req, res) => {
    const { device_id: deviceId, token } = req.query
    await switchDevice({ deviceId, token })

    return res.end()
  })
)

app.get(
  '/genres',
  asyncHandler(async (req, res) => {
    const token = req.query.token
    const availableGenres = await getGenres({ token })

    return res.json(availableGenres)
  })
)

app.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const { token, ...recommendationSettings } = req.query
    const recommendations = await getRecommendations({
      token,
      recommendationSettings,
    })

    return res.json(recommendations)
  })
)

app.get(
  '/tracks',
  asyncHandler(async (req, res) => {
    const { ids, token } = req.query
    const tracks = await getTracks({ token, trackIds: ids })

    return res.json(tracks)
  })
)

app.post(
  '/playlist',
  asyncHandler(async (req, res) => {
    const { tracks: _tracks, genres, token, features } = req.query
    const tracks = `${_tracks}`.split(',')

    const userId = await getUserId({ token })
    const playlistUrl = await createPlaylist({
      userId,
      token,
      genres,
      features,
    })
    await addTracksToPlaylist({ token, playlistUrl, tracks })

    return res.end()
  })
)

app.post(
  '/play',
  asyncHandler(async (req, res) => {
    const { tracks: _tracks, device_id: deviceId, token } = req.query
    const tracks = `${_tracks}`.split(',')

    await playTracks({ tracks, deviceId, token })

    return res.end()
  })
)

app.post(
  '/pause',
  asyncHandler(async (req, res) => {
    const token = req.query.token

    await pausePlayer({ token })

    return res.end()
  })
)

const port = Number(process.env.PORT) || 8888

console.log(
  `Listening on http://localhost:${port} or https://nelson-v2.glitch.me`
)
app.listen(port)
