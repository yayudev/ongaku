// @flow
type OngakuOptions =
    { volume?: number
    , onBufferLoaded?: () => void
    , onPlaybackStart?: () => void
    , onPlaybackPause?: () => void
    , onPlaybackStopped?: () => void
    , onPlaybackEnd?: () => void
    , onPlaybackSeek?: (time: number) => void
    , onVolumeChange?: (newLevel: number) => void
    }
;


window.Ongaku = class Ongaku {
    _audioCtx: AudioContext;
    _source: AudioBufferSourceNode;
    _buffer: AudioBuffer;
    _volumeGainNode: GainNode;

    _currentAudio: string;
    _onPausePlaybackTime: number;
    _startTime: number;
    _pauseTime: number;
    _isPlaying: boolean;
    _callbacks: OngakuOptions;
    _volume: number;

    _loadAudio: (fileUrl: string) => Promise<AudioBuffer>;
    _onEnd: () => void;
    _getUpdatedPlaybackTime: () => number;
    playAudio: (fileUrl: string) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    seekPercentage: (percentage: number) => void;
    setVolume: (volumeLevel: number) => void;
    mute: () => void;
    unmute: () => void;
    getPlaybackTime: () => number;
    isPlaying: () => boolean;
    getCurrentBufferDuration: () => number;


    constructor(opts?: OngakuOptions) {
        if (!window.AudioContext && !window.webkitAudioContext) {
            throw new Error('[Ongaku] Web Audio API not supported.');
        }

        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._callbacks = opts || {};
        this._volume = (opts && opts.volume !== undefined && opts.volume >= 0 && opts.volume <= 100)
            ? (opts.volume/100)
            : 1;

        this._source;
        this._currentAudio;
        this._onPausePlaybackTime;
        this._startTime;
        this._isPlaying;
        this._buffer;
        this._volumeGainNode = this._audioCtx.createGain();

        this._loadAudio = this._loadAudio.bind(this);
        this._onEnd = this._onEnd.bind(this);
        this._getUpdatedPlaybackTime = this._getUpdatedPlaybackTime.bind(this);

        this.playAudio = this.playAudio.bind(this);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.seekPercentage = this.seekPercentage.bind(this);
        this.seek = this.seek.bind(this);
        this.stop = this.stop.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.mute = this.mute.bind(this);
        this.getPlaybackTime = this.getPlaybackTime.bind(this);
        this.isPlaying = this.isPlaying.bind(this);
        this.getCurrentBufferDuration = this.getCurrentBufferDuration.bind(this);
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

    _onEnd(): void {
        this.stop();

        if (this._callbacks.onPlaybackEnd) {
            this._callbacks.onPlaybackEnd();
        }
    }

    _getUpdatedPlaybackTime(): number {
        return (Date.now() - this._startTime)/1000 + this._onPausePlaybackTime;
    }


    playAudio(fileUrl: string): void {
        if (!fileUrl) {
            return console.error('[Ongaku] A file must be specified when using playAudio');
        }

        this.stop();
        this._currentAudio = fileUrl;
        this._isPlaying = false;
        this._onPausePlaybackTime = 0;

        this._loadAudio(fileUrl)
            .then(buffer => {
                this._buffer = buffer;

                if (this._callbacks.onBufferLoaded) {
                    this._callbacks.onBufferLoaded();
                }

                this.play();
            })
            .catch(e => console.error(e));
    }


    play(): void {
        if (this._isPlaying) return;
        if (!this._buffer) {
           return console.error('[Ongaku] You need to load an audio file before using play()');
        }

        this._volumeGainNode.gain.value = this._volume;

        this._source = this._audioCtx.createBufferSource();
        this._source.buffer = this._buffer;
        this._source.connect(this._volumeGainNode);
        this._volumeGainNode.connect(this._audioCtx.destination);
        this._source.onended = () => this._onEnd();

        this._isPlaying = true;
        this._startTime = Date.now();
        this._source.start(0, this._onPausePlaybackTime); // Play at current offset (defaults to 0)

        if (this._callbacks.onPlaybackStart) {
            this._callbacks.onPlaybackStart();
        }
    }


    pause(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.onended = () => {};
        this._source.stop();
        this._isPlaying = false;
        this._pauseTime = Date.now();
        this._onPausePlaybackTime = this._getUpdatedPlaybackTime();

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
            this._onPausePlaybackTime = time;
            setTimeout(this.play, 100); // <-- Browser requires a little time to process the pause and seek.
        } else {
            this._onPausePlaybackTime = time;
        }

        if (this._callbacks.onPlaybackSeek) {
            this._callbacks.onPlaybackSeek(time);
        }
    }


    stop(): void {
        if (!this._isPlaying) return;
        if (!this._source) return;

        this._source.onended = () => {};
        this._source.stop(0);
        this._isPlaying = false;
        this._onPausePlaybackTime = 0;


        if (this._callbacks.onPlaybackStopped) {
            this._callbacks.onPlaybackStopped();
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


    getPlaybackTime(): number {
        if (!this._source) {
            console.error('[Ongaku] Error, you should load an audio file before getting the playback time');
            return 0;
        }

        if (this._isPlaying) {
            return this._getUpdatedPlaybackTime();
        }

        return this._onPausePlaybackTime;
    }

    isPlaying(): boolean {
        return this._isPlaying;
    }

    getCurrentBufferDuration(): number {
        if (!this._buffer) {
            console.error('[Ongaku] Error, you should load an audio file before getting the duration');
            return 0;
        }

        return this._buffer.duration;
    }
}