// @flow
type OngakuOptions =
    { volume: number
    , onPlaybackStart: () => void
    , onPlaybackPause: () => void
    , onPlaybackStopped: () => void
    , onPlaybackEnd: () => void
    , onPlaybackSeek: (time: number) => void
    , onVolumeChange: (newLevel: number) => void
    }
;


window.Ongaku = class Ongaku {
    _audioCtx: AudioContext;
    _source: AudioBufferSourceNode;
    _buffer: AudioBuffer;
    _volumeGainNode: GainNode;

    _currentAudio: string;
    _playbackTime: number;
    _startTime: number;
    _isPlaying: boolean;
    _callbacks: OngakuOptions;
    _volume: number;

    _loadAudio: (fileUrl: string) => Promise<AudioBuffer>;
    playAudio: (fileUrl: string) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    seekPercentage: (percentage: number) => void;
    setVolume: (volumeLevel: number) => void;
    mute: () => void;


    constructor(opts: OngakuOptions) {
        if (!window.AudioContext && !window.webkitAudioContext) {
            throw new Error('[Ongaku] Web Audio API not supported.');
        }

        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._callbacks = opts || {};
        this._volume = (opts && opts.volume >= 0 && opts.volume <= 100) ? opts.volume : 100;

        this._source;
        this._currentAudio;
        this._playbackTime;
        this._startTime;
        this._isPlaying;
        this._buffer;
        this._volumeGainNode = this._audioCtx.createGain();

        this._loadAudio = this._loadAudio.bind(this);
        this.playAudio = this.playAudio.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.stop = this.stop.bind(this);
        this.seek = this.seek.bind(this);
        this.seekPercentage = this.seekPercentage.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.mute = this.mute.bind(this);
    }


    _loadAudio(fileUrl: string): Promise<AudioBuffer> {
        return fetch(fileUrl)
            .then(response => response.arrayBuffer())
            .then(buffer => new Promise(resolve => {
                this._audioCtx.decodeAudioData(buffer,
                    decodedBuffer => resolve(decodedBuffer)
                );
            }));
    }


    playAudio(fileUrl: string): void {
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


    play(): void {
        if (this._isPlaying) return;
        if (!this._buffer) {
           return console.error('[Ongaku] You need to load an audio file before using play()');
        }


        this._source = this._audioCtx.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.connect(this._volumeGainNode);
        this._volumeGainNode.connect(this._audioCtx.destination);
        this._source.onended = () => this.onEnd();

        this._isPlaying = true;
        this._startTime = Date.now();
        this._source.start(0, this._playbackTime); // Play at current offset (defaults to 0)

        if (this._callbacks.onPlaybackStart) {
            this._callbacks.onPlaybackStart();
        }
    }


    pause(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.stop();
        this._isPlaying = false;

        this._playbackTime = (Date.now() - this._startTime)/1000 + this._playbackTime;

        if (this._callbacks.onPlaybackPause) {
            this._callbacks.onPlaybackPause();
        }
    }


    seekPercentage(percentage: number): void {
        if (percentage < 0 || percentage > 100) {
            return console.error('[Ongaku] Error, trying to seek to an invalid percentage')
        }

        if (!this._source) {
            return console.error('[Ongaku] Error, you should load an audio file before seeking');
        }

        const time = this._source.buffer.duration * (percentage/100);

        this.seek(time);
    }


    seek(time: number): void {
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
            setTimeout(this.play, 100); // <-- Browser requires a little time to process the pause and seek.
        } else {
            this._playbackTime = time;
        }

        if (this._callbacks.onPlaybackSeek) {
            this._callbacks.onPlaybackSeek(time);
        }
    }


    stop(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.stop(0);
        this._isPlaying = false;

        if (this._callbacks.onPlaybackStopped) {
            this._callbacks.onPlaybackStopped();
        }
    }


    onEnd(): void {
        if (this._callbacks.onPlaybackEnd) {
            this._callbacks.onPlaybackEnd();
        }
    }


    setVolume(volumeLevel: number): void {
        if (volumeLevel < 0 || volumeLevel > 100) {
            return console.error('[Ongaku] Error, volume can be set only with values between 0 and 100');
        }

        this._volume = (volumeLevel / 100);
        this._volumeGainNode.gain.value = this._volume;

        if (this._callbacks.onVolumeChange) {
            this._callbacks.onVolumeChange(volumeLevel);
        }
    }


    mute(): void {
        this._volumeGainNode.gain.value = 0;
    }

    unmute(): void {
        this._volumeGainNode.gain.value = this._volume;
    }
}