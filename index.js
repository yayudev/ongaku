class Ongaku {
  constructor(onPlaybackEnd = () => {}) {
    if (!window.AudioContext) {
      throw new Error('[Ongaku] Web Audio API not supported.');
    }

    this._audioCtx = new (window.AudioContext)();
    this._onStopCallback = onPlaybackEnd || function() {};

    this._source;
    this._currentAudio;
    this._playbackTime;
    this._startTime;
    this._isPlaying;
    this._buffer;

    this._loadAudio = this._loadAudio.bind(this);
    this.playAudio = this.playAudio.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.seek = this.seek.bind(this);
    this.stop = this.stop.bind(this);
  }


  _loadAudio(fileUrl) {
    return fetch(fileUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => new Promise(resolve => {
        this._audioCtx.decodeAudioData(buffer,
          decodedBuffer => resolve(decodedBuffer)
        );
      }));
  }


  playAudio(fileUrl) {
    if (!fileUrl) {
      return console.error('[Ongaku] A file must be specified when using playAudio');
    }

    this.stop();
    this._currentAudio = fileUrl;
    this._isPlaying = false;
    this._playbackTime = 0;

    this._loadAudio(fileUrl)
      .then(buffer => {
        this._buffer = buffer;
        this.play();
      })
      .catch(e => console.error(e));
  }


  play() {
    if (this._isPlaying) return;
    if (!this._buffer) {
      return console.error('[Ongaku] You need to load an audio file before using play()');
    }


    this._source = this._audioCtx.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.connect(this._audioCtx.destination);
    this._source.onended = () => this.stop();

    this._isPlaying = true;
    this._startTime = Date.now();
    this._source.start(0, this._playbackTime); // Play at current offset (defaults to 0)
  }


  pause() {
    if (!this._isPlaying) return;

    this.stop();

    this._playbackTime = (Date.now() - this._startTime)/1000 + this._playbackTime;
  }


  seekPercentage(percentage) {
    if (percentage < 0 || percentage > 100) {
      return console.error('[Ongaku] Error, trying to seek to an invalid percentage')
    }

    this.seek(this.source.buffer.duration * (percentage/100));
  }


  seek(time) {
    if (time === undefined) return;
    if (!this._source) {
      return console.error('[Ongaku] Error, you should load an audio file before seeking');
    }
    if (time > this._source.buffer.duration) {
      console.error('[Ongaku] Error, trying to seek beyond the current audio duration');
      return;
    }


    if (this._isPlaying) {
      this.pause();
      this._playbackTime = time;
      this.play(); // <-- I'm not sure why this last line isn't working.
    } else {
      this._playbackTime = time;
    }
  }


  stop() {
    if (!this._isPlaying) return;
    if (!this._source) return;

    this._source.stop(0);
    this._onStopCallback();
    this._isPlaying = false;
  }
}
