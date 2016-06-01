class Ongaku {
  constructor(onStop = () => {}) {
    if (!window.AudioContext) {
      throw new Error('Web Audio API not supported.');
    }

    this.audioCtx = new (window.AudioContext)();
    this.source = null;
    this.playing = false;
    this.onStopCallback = onStop || function() {};
    this.currentSong;

    this.loadAudio = this.loadAudio.bind(this);
    this.playSong = this.playSong.bind(this);
    this.stop = this.stop.bind(this);
  }

  loadAudio(fileUrl) {
    return fetch(fileUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => new Promise(resolve => {
        this.audioCtx.decodeAudioData(buffer,
          decodedBuffer => resolve(decodedBuffer)
        )
      }))
  }

  playSong(fileUrl) {
    this.currentSong = fileUrl;

    this.loadAudio(fileUrl)
      .then(buffer => {
        this.source = this.audioCtx.createBufferSource();
        this.source.connect(this.audioCtx.destination);

        this.source.buffer = buffer;
        this.source.onended = () => this.stop();
        this.source.start(0);
        this.playing = true;
        this.source.loop = false;
      })
      .catch(e => console.log(e));
  }

  stop() {
    this.source.stop();
    this.onStopCallback();
    this.playing = false;
  }
}
