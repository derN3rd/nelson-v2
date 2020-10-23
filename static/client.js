// Check hash for token
const hash = window.location.hash
  .substring(1)
  .split('&')
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split('=');
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = '';

// Set token
let _token = hash.access_token;

const authEndpoint = 'https://accounts.spotify.com/authorize';

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = 'e78aa3de75eb40cb8cf14f460c314773';
const redirectUri = 'https://nelson-v2.glitch.me';
const scopes = [
  'streaming',
  'user-read-birthdate',
  'user-read-email',
  'user-read-private',
  'playlist-modify-public',
  'user-modify-playback-state',
  'user-read-playback-state',
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    '%20'
  )}&response_type=token`;
} else {
  let deviceId;
  let playbackSetting;

  // Page setup
  genreLimitAlert('off');
  getGenresList();
  setUpSliders();
  showUser();
  getDevices();
  setPlaybackSetting(1);
}

// Initialise Web Playback SDK
function onSpotifyPlayerAPIReady() {
  let player = new Spotify.Player({
    name: 'Nelson',
    getOAuthToken: function (cb) {
      cb(_token);
    },
    volume: 0.8,
  });

  player.on('ready', function (data) {
    deviceId = data.device_id;
    localStorage.setItem('nelsonBrowserDeviceID', data.device_id);
  });

  player.on('player_state_changed', function (data) {
    if (data) {
      let currentTrack = data.track_window.current_track.uri;
      updateCurrentlyPlaying(currentTrack);
    }
  });

  player.connect();
}

function genreLimitAlert(state) {
  if (state == 'on') {
    $('#genreLimitAlert').show();
  } else {
    $('#genreLimitAlert').hide();
  }
}

function exists(input) {
  return typeof input !== 'undefined';
}

function getExistingAudioSettings() {
  const stringifiedCurrentNelsonFeatures = localStorage.getItem(
    'currentNelsonFeatures'
  );
  if (!stringifiedCurrentNelsonFeatures) {
    return undefined;
  }
  const genres = localStorage.getItem('currentNelsonGenres') || '';

  const currentNelsonFeatures = JSON.parse(stringifiedCurrentNelsonFeatures);
  return {
    min_valence: exists(currentNelsonFeatures.min_valence)
      ? currentNelsonFeatures.min_valence
      : 0,
    max_valence: exists(currentNelsonFeatures.max_valence)
      ? currentNelsonFeatures.max_valence
      : 1,
    min_energy: exists(currentNelsonFeatures.min_energy)
      ? currentNelsonFeatures.min_energy
      : 0,
    max_energy: exists(currentNelsonFeatures.max_energy)
      ? currentNelsonFeatures.max_energy
      : 1,
    min_acousticness: exists(currentNelsonFeatures.min_acousticness)
      ? currentNelsonFeatures.min_acousticness
      : 0,
    max_acousticness: exists(currentNelsonFeatures.max_acousticness)
      ? currentNelsonFeatures.max_acousticness
      : 1,
    min_danceability: exists(currentNelsonFeatures.min_danceability)
      ? currentNelsonFeatures.min_danceability
      : 0,
    max_danceability: exists(currentNelsonFeatures.max_danceability)
      ? currentNelsonFeatures.max_danceability
      : 1,
    min_instrumentalness: exists(currentNelsonFeatures.min_instrumentalness)
      ? currentNelsonFeatures.min_instrumentalness
      : 0,
    max_instrumentalness: exists(currentNelsonFeatures.max_instrumentalness)
      ? currentNelsonFeatures.max_instrumentalness
      : 1,
    min_liveness: exists(currentNelsonFeatures.min_liveness)
      ? currentNelsonFeatures.min_liveness
      : 0,
    max_liveness: exists(currentNelsonFeatures.max_liveness)
      ? currentNelsonFeatures.max_liveness
      : 1,
    min_speechiness: exists(currentNelsonFeatures.min_speechiness)
      ? currentNelsonFeatures.min_speechiness
      : 0,
    max_speechiness: exists(currentNelsonFeatures.max_speechiness)
      ? currentNelsonFeatures.max_speechiness
      : 1,
    min_popularity: exists(currentNelsonFeatures.min_popularity)
      ? currentNelsonFeatures.min_popularity
      : 0,
    max_popularity: exists(currentNelsonFeatures.max_popularity)
      ? currentNelsonFeatures.max_popularity
      : 100,
    min_tempo: exists(currentNelsonFeatures.min_tempo)
      ? currentNelsonFeatures.min_tempo
      : 40,
    max_tempo: exists(currentNelsonFeatures.max_tempo)
      ? currentNelsonFeatures.max_tempo
      : 200,
    target_mode: exists(currentNelsonFeatures.target_mode)
      ? currentNelsonFeatures.target_mode
      : undefined,
    genres,
  };
}

function setUpSliders() {
  const sliderConfig = {
    range: true,
    min: 0,
    max: 1,
    step: 0.01,
    stop: () => saveSliderValues(),
  };
  const existingSettings = getExistingAudioSettings();

  $('#valence-slider').slider({
    ...sliderConfig,
    values: [existingSettings.min_valence, existingSettings.max_valence],
  });
  $('#energy-slider').slider({
    ...sliderConfig,
    values: [existingSettings.min_energy, existingSettings.max_energy],
  });
  $('#acousticness-slider').slider({
    ...sliderConfig,
    values: [
      existingSettings.min_acousticness,
      existingSettings.max_acousticness,
    ],
  });
  $('#danceability-slider').slider({
    ...sliderConfig,
    values: [
      existingSettings.min_danceability,
      existingSettings.max_danceability,
    ],
  });
  $('#instrumentalness-slider').slider({
    ...sliderConfig,
    values: [
      existingSettings.min_instrumentalness,
      existingSettings.max_instrumentalness,
    ],
  });
  $('#liveness-slider').slider({
    ...sliderConfig,
    values: [existingSettings.min_liveness, existingSettings.max_liveness],
  });
  $('#speechiness-slider').slider({
    ...sliderConfig,
    values: [
      existingSettings.min_speechiness,
      existingSettings.max_speechiness,
    ],
  });

  $('#popularity-slider').slider({
    range: true,
    min: 0,
    max: 100,
    step: 1,
    values: [existingSettings.min_popularity, existingSettings.max_popularity],
    stop: () => saveSliderValues(),
  });

  $('#tempo-slider').slider({
    range: true,
    min: 40,
    max: 200,
    step: 1,
    values: [existingSettings.min_tempo, existingSettings.max_tempo],
    stop: () => saveSliderValues(),
  });

  if (exists(existingSettings.target_mode)) {
    if (existingSettings.target_mode === 0) {
      $('#mode-minor').prop('checked', true);
      $('#mode-major').prop('checked', false);
    } else if (existingSettings.target_mode === 1) {
      $('#mode-minor').prop('checked', false);
      $('#mode-major').prop('checked', true);
    }
  }
}

function showUser() {
  $.get('/user?token=' + _token, function (user) {
    $('#current-user').text(user.id);
  });
}

function logout() {
  _token = null;
  window.open('https://accounts.spotify.com/logout');
  location.reload();
}

function setPlaybackSetting(setting) {
  playbackSetting = setting;

  if (setting == 0) {
    deviceId = null;
    pause();
    $('#current-playback').text('None');
  }

  if (setting == 1) {
    setDevice(localStorage.getItem('nelsonBrowserDeviceID'));
    $('#current-playback').text('In Browser');
  }

  if (setting == 2) {
    $('#device-select').modal('show');
  }
}

function setDevice(id, name) {
  deviceId = id;
  $('#current-playback').text(name);
  $.post('/transfer?device_id=' + deviceId + '&token=' + _token);
}

function getDevices() {
  $('#devices-list').empty();
  $.get('/devices?token=' + _token, function (devices) {
    devices.forEach(function (device) {
      let deviceRadioElement =
        '<div class="radio" onclick="setDevice(\'' +
        device.id +
        "','" +
        device.name +
        '\')"><label><input type="radio" name="device">' +
        device.name +
        '<span class="control-indicator"></span></label></div>';
      $('#devices-list').append(deviceRadioElement);
    });
  });
}

function getGenresList() {
  $('#genres-list').empty();
  $.get('/genres?token=' + _token, function (genres) {
    const existingSettings = getExistingAudioSettings();
    $('#current-genres').text(existingSettings.genres);
    genres.forEach(function (genre) {
      const isSelectedInSettings = existingSettings.genres.includes(genre);
      let genreButtonElement = `<label class="btn btn-salmon btn-sm${
        isSelectedInSettings ? ' active' : ''
      }"><input type="checkbox" value="${genre}"${
        isSelectedInSettings ? ' checked' : ''
      }>${genre}</label>`;
      $('#genres-list').append(genreButtonElement);
    });
  });

  $('#genres-list').on('change', 'input', function () {
    if ($('#genres-list input:checked').length > 5) {
      $(this).parent().removeClass('active');
      this.checked = false;
      genreLimitAlert('on');
    } else {
      genreLimitAlert('off');
    }
  });
}

function getSliderValues() {
  let values = {};

  let min_valence = $('#valence-slider').slider('values', 0);
  let max_valence = $('#valence-slider').slider('values', 1);
  let min_energy = $('#energy-slider').slider('values', 0);
  let max_energy = $('#energy-slider').slider('values', 1);
  let min_acousticness = $('#acousticness-slider').slider('values', 0);
  let max_acousticness = $('#acousticness-slider').slider('values', 1);
  let min_danceability = $('#danceability-slider').slider('values', 0);
  let max_danceability = $('#danceability-slider').slider('values', 1);
  let min_instrumentalness = $('#instrumentalness-slider').slider('values', 0);
  let max_instrumentalness = $('#instrumentalness-slider').slider('values', 1);
  let min_liveness = $('#liveness-slider').slider('values', 0);
  let max_liveness = $('#liveness-slider').slider('values', 1);
  let min_speechiness = $('#speechiness-slider').slider('values', 0);
  let max_speechiness = $('#speechiness-slider').slider('values', 1);
  let min_popularity = $('#popularity-slider').slider('values', 0);
  let max_popularity = $('#popularity-slider').slider('values', 1);
  let min_tempo = $('#tempo-slider').slider('values', 0);
  let max_tempo = $('#tempo-slider').slider('values', 1);

  if ($('#mode-minor').is(':checked') && !$('#mode-major').is(':checked')) {
    values['target_mode'] = 0;
  }
  if ($('#mode-major').is(':checked') && !$('#mode-minor').is(':checked')) {
    values['target_mode'] = 1;
  }

  if (min_valence > 0) {
    values['min_valence'] = min_valence;
  }
  if (max_valence < 1) {
    values['max_valence'] = max_valence;
  }
  if (min_energy > 0) {
    values['min_energy'] = min_energy;
  }
  if (max_energy < 1) {
    values['max_energy'] = max_energy;
  }
  if (min_acousticness > 0) {
    values['min_acousticness'] = min_acousticness;
  }
  if (max_acousticness < 1) {
    values['max_acousticness'] = max_acousticness;
  }
  if (min_danceability > 0) {
    values['min_danceability'] = min_danceability;
  }
  if (max_danceability < 1) {
    values['max_danceability'] = max_danceability;
  }
  if (min_instrumentalness > 0) {
    values['min_instrumentalness'] = min_instrumentalness;
  }
  if (max_instrumentalness < 1) {
    values['max_instrumentalness'] = max_instrumentalness;
  }
  if (min_liveness > 0) {
    values['min_liveness'] = min_liveness;
  }
  if (max_liveness < 1) {
    values['max_liveness'] = max_liveness;
  }
  if (min_speechiness > 0) {
    values['min_speechiness'] = min_speechiness;
  }
  if (max_speechiness < 1) {
    values['max_speechiness'] = max_speechiness;
  }
  if (min_popularity > 0) {
    values['min_popularity'] = min_popularity;
  }
  if (max_popularity < 100) {
    values['max_popularity'] = max_popularity;
  }
  if (min_tempo > 40) {
    values['min_tempo'] = min_tempo;
  }
  if (max_tempo < 200) {
    values['max_tempo'] = max_tempo;
  }

  return values;
}

function saveSliderValues() {
  let audioFeatures = getSliderValues();
  localStorage.setItem('currentNelsonFeatures', JSON.stringify(audioFeatures));
}

function updateSelectedGenres() {
  // Get selected genres
  let genres = [];
  $('#genres-list input:checked').each(function () {
    genres.push($(this).val());
  });
  const genresString = genres.join();
  localStorage.setItem('currentNelsonGenres', genresString);
  $('#current-genres').text(genresString);
  return genresString;
}

function getRecommendations() {
  const genresString = updateSelectedGenres();
  // Get slider values
  let audioFeatures = getSliderValues();
  localStorage.setItem('currentNelsonFeatures', JSON.stringify(audioFeatures));

  // Send the request
  $.get(
    '/recommendations?seed_genres=' +
      genresString +
      '&' +
      $.param(audioFeatures) +
      '&token=' +
      _token,
    function (data) {
      $('#tracks').empty();
      let trackIds = [];
      let trackUris = [];
      if (data.tracks) {
        if (data.tracks.length > 0) {
          data.tracks.forEach(function (track) {
            trackIds.push(track.id);
            trackUris.push(track.uri);
          });
          localStorage.setItem('currentNelsonTracks', trackUris.join());
          renderTracks(trackIds);
          play(trackUris.join());
        } else {
          $('#tracks').append('<h2>No results. Try a broader search.</h2>');
        }
      } else {
        $('#tracks').append('<h2>No results. Select some genres first.</h2>');
      }
    }
  );
}

function renderTracks(ids) {
  $.get('/tracks?ids=' + ids.join() + '&token=' + _token, function (tracks) {
    tracks.forEach(function (track) {
      let image = track.album.images
        ? track.album.images[0].url
        : 'https://upload.wikimedia.org/wikipedia/commons/3/3c/No-album-art.png';
      let trackElement =
        '<div class="track-element" id="' +
        track.uri +
        '" onclick="play(\'' +
        track.uri +
        '\');"><div><img class="album-art" src="' +
        image +
        '"/><div><a href="https://open.spotify.com/track/' +
        track.id +
        '">' +
        track.name +
        '</a><p>' +
        track.artists[0].name +
        '</p></div></div><img class="remove-icon" src="https://cdn.glitch.com/9641d2b3-59eb-408e-ab02-0b9bbd49b069%2Fremove-icon.png?1508341583541" onclick="remove(\'' +
        track.uri +
        '\');"/></div>';
      $('#tracks').append(trackElement);
    });
  });
}

function updateCurrentlyPlaying(track) {
  $('.track-element').removeClass('current-track');
  if (document.getElementById(track)) {
    document.getElementById(track).className += ' current-track';
  }
}

function makePlaylist() {
  if (localStorage.getItem('currentNelsonTracks')) {
    $.post(
      '/playlist?tracks=' +
        localStorage.getItem('currentNelsonTracks') +
        '&genres=' +
        localStorage.getItem('currentNelsonGenres') +
        '&features=' +
        localStorage.getItem('currentNelsonFeatures') +
        '&token=' +
        _token
    );
    $('#notice').html(
      '<div class="alert alert-success alert-dismissable" role="alert"><b>Sweet!</b> You just created a new Spotify playlist with recommendations from Nelson.<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>'
    );
  }
}

function play(track) {
  if (playbackSetting != 0) {
    $.post(
      '/play?tracks=' + track + '&device_id=' + deviceId + '&token=' + _token
    );
  }
}

function pause() {
  $.post('/pause?token=' + _token);
}

function remove(track) {
  let trackList = localStorage.getItem('currentNelsonTracks').split(',');
  trackList = trackList.filter((item) => item != track);
  localStorage.setItem('currentNelsonTracks', trackList.join());
  let elementId = '#' + track;
  var element = document.getElementById(track);
  element.outerHTML = '';
  delete element;
}
