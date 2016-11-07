// @flow
type OngakuOptions =
    { onPlaybackStart: () => void
    , onPlaybackPause: () => void
    , onPlaybackStopped: () => void
    , onPlaybackEnd: () => void
    , onPlaybackSeek: (time: number) => void
    }
;


class Ongaku {
    _audioCtx: AudioContext;
    _source: AudioBufferSourceNode;
    _buffer: AudioBuffer;

    _currentAudio: string;
    _playbackTime: number;
    _startTime: number;
    _isPlaying: boolean;
    _callbacks: OngakuOptions;

    _loadAudio: (fileUrl: string) => Promise<AudioBuffer>;
    playAudio: (fileUrl: string) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    seekPercentage: (percentage: number) => void;


    constructor(opts: OngakuOptions) {
        if (!window.AudioContext) {
            throw new Error('[Ongaku] Web Audio API not supported.');
        }

        this._audioCtx = new (window.AudioContext)();
        this._callbacks = opts || {};

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
        this.stop = this.stop.bind(this);
        this.seek = this.seek.bind(this);
        this.seekPercentage = this.seekPercentage.bind(this);
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
        this._source.connect(this._audioCtx.destination);
        this._source.onended = () => this.onEnd();

        this._isPlaying = true;
        this._startTime = Date.now();
        this._source.start(0, this._playbackTime); // Play at current offset (defaults to 0)

        this._callbacks.onPlaybackStart();
    }


    pause(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.stop();
        this._isPlaying = false;

        this._playbackTime = (Date.now() - this._startTime)/1000 + this._playbackTime;

        this._callbacks.onPlaybackPause();
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
        this._callbacks.onPlaybackSeek(time);

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

        this._callbacks.onPlaybackSeek(time);
    }


    stop(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.stop(0);
        this._callbacks.onPlaybackStopped();
        this._isPlaying = false;
    }


    onEnd(): void {
        this._callbacks.onPlaybackEnd();
    }
}


// Test purposes
//
// window.ongaku = new Ongaku(
//     { onPlaybackStart: () => console.log('playback started')
//     , onPlaybackPause: () => console.log('playback paused')
//     , onPlaybackStopped: () => console.log('playback stopped')
//     , onPlaybackEnd: () => console.log('playback ended')
//     , onPlaybackSeek: (time: number) => console.log('playback seek', time)
//     }
// );