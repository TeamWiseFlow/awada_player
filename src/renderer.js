document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    canRecord: false,
    recording: false,
    requesting: false,
    playing: false,
    audioURL: '',
    playlist: [],
    playhead: -1, // playing index in playlist
    playingEl: null,
    cachingEl: null,
    get playingURL() {
      return this.playlist.length > 0 && this.playhead >= 0
        ? this.playlist[this.playhead]
        : ''
    },
    get cachingURL() {
      return this.playlist.length > 0 &&
        this.playhead >= 0 &&
        this.playhead < this.playlist.length - 1
        ? this.playlist[this.playhead + 1]
        : ''
    },
    get video1playing() {
      return this.$refs['video-1'] === this.playingEl
    },
    get video2playing() {
      return this.$refs['video-2'] === this.playingEl
    },
    get video1url() {
      if (this.video1playing) {
        return this.playingURL
      }
      return this.cachingURL
    },
    get video2url() {
      if (this.video2playing) {
        return this.playingURL
      }
      return this.cachingURL
    },
    captionText: '',
    flashText: '',
    flashTextVisible: false,
    async init() {
      window.config = await node.getConfig()
      console.log('CONFIG', JSON.stringify(window.config, '', 2))
      await _waitFor(500)
      await this.showFlashText(window.config.content['flash_ask_start'])
      this.canRecord = true
      this.captionText = window.config.content['caption_start']
      this.canRecord = true
    },
    async onSpaceKeyDown() {
      if (!this.canRecord) return
      if (!this.recording) {
        this.recording = true
        this.captionText = ''
        await _startRecord()
      }
    },
    async onSpaceKeyUp() {
      if (!this.canRecord) return
      if (this.recording) {
        this.recording = false
        this.captionText = window.config.content['caption_wait']
        await _stopRecord()
        this.askRemote()
      }
    },
    skipAnswer() {},
    async showFlashText(text) {
      let can = this.canRecord
      this.canRecord = false
      this.flashText = text
      this.flashTextVisible = true
      await _waitFor(3000)
      this.flashTextVisible = false
      await _waitFor(500)
      if (can) this.canRecord = true
    },
    _stopVideo() {
      this.$refs['video-1'].pause()
      this.$refs['video-2'].pause()
      this.playhead = -1
      this.playingURL = ''
      this.cachingURL = ''
      this.playingEl = null
      this.cachingEl = null
      this.canRecord = true
      this.playing = false
    },
    audioEnded() {
      // audio ended before video, should stop video
      this._stopVideo()
      this.canRecord = true
      this.playing = false
    },
    videoLoaded(e) {
      // play only first video
      if (this.playhead == 0 && this.playingEl) {
        this.canRecord = false
        this.playing = true
        this.playingEl.play()
      }
    },
    videoEnded() {
      if (this.playhead >= this.playlist.length - 1) {
        this._stopVideo()
        return
      }

      // swap playing and caching video elements
      let el = this.playingEl
      this.playingEl = this.cachingEl
      this.cachingEl = el
      this.playingEl.style.zIndex = 99
      this.cachingEl.style.zIndex = 98

      this.playhead += 1
      this.playingEl.currentTime = 0
      this.playingEl.play()
    },
    exit() {
      node.exit()
    },
    askRemote() {
      this.requesting = true
      let that = this
      let path = window.config.wav_file_path

      // TEST
      // path = '/home/dsw/player/assets/test.wav'

      _post(window.config.api_ask, {
        user_id: 'local-koisk',
        type: 'voice',
        content: path,
      }).then(data => {
        this.requesting = false
        //console.log(data)
        const { flag, contents, playlist } = data
        if (flag == 1) {
          // no answer
          that.captionText = config.content['caption_no_answer']
          that.playlist = ['../assets/' + config.content['video_no_answer']]
          that.playingEl = that.$refs['video-2']
          that.cachingEl = that.$refs['video-1']
          that.playhead = 0
          // that.showFlashText(window.config.content['flash_no_answer'])
        } else if (flag == 2) {
          that.captionText = contents[0].text
        } else if (flag == 0) {
          that.captionText = contents[0].text
          that.audioURL = contents[0].voice
          that.playlist = playlist

          // start playing
          that.playingEl = that.$refs['video-2']
          that.cachingEl = that.$refs['video-1']
          that.playhead = 0
        } else {
          // errors
          that.captionText = config.content['caption_retry']
          that.playlist = ['../assets/' + config.content['video_retry']]
          that.playingEl = that.$refs['video-2']
          that.cachingEl = that.$refs['video-1']
          that.playhead = 0
          // that.showFlashText(window.config.content['flash_retry'])
        }
      })
    },
  }))
})

let recorder

const _startRecord = async () => {
  try {
    let stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    })
    recorder = new RecordRTCPromisesHandler(stream, {
      type: 'audio',
      recorderType: RecordRTC.StereoAudioRecorder,
    })
    recorder.startRecording()
  } catch (e) {
    console.log('ERROR', e)
  }
}

const _stopRecord = async () => {
  await recorder.stopRecording()
  let blob = await recorder.getBlob()
  console.log('blob type', blob.type)
  //console.log('blob arrayBuffer', await blob.arrayBuffer())
  //let buffer = await new Response(blob).arrayBuffer()
  //node.saveAudio(buffer)
  node.saveAudio(await blob.arrayBuffer())
  recorder.destroy()
}

const _waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))

async function _post(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  })
  return response.json() // parses JSON response into native JavaScript objects
}
