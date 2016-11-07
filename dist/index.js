'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ongaku = function () {
    function Ongaku(opts) {
        _classCallCheck(this, Ongaku);

        if (!window.AudioContext) {
            throw new Error('[Ongaku] Web Audio API not supported.');
        }

        this._audioCtx = new window.AudioContext();
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

    _createClass(Ongaku, [{
        key: '_loadAudio',
        value: function _loadAudio(fileUrl) {
            var _this = this;

            return fetch(fileUrl).then(function (response) {
                return response.arrayBuffer();
            }).then(function (buffer) {
                return new Promise(function (resolve) {
                    _this._audioCtx.decodeAudioData(buffer, function (decodedBuffer) {
                        return resolve(decodedBuffer);
                    });
                });
            });
        }
    }, {
        key: 'playAudio',
        value: function playAudio(fileUrl) {
            var _this2 = this;

            if (!fileUrl) {
                return console.error('[Ongaku] A file must be specified when using playAudio');
            }

            this.stop();
            this._currentAudio = fileUrl;
            this._isPlaying = false;
            this._playbackTime = 0;

            this._loadAudio(fileUrl).then(function (buffer) {
                _this2._buffer = buffer;
                _this2.play();
            }).catch(function (e) {
                return console.error(e);
            });
        }
    }, {
        key: 'play',
        value: function play() {
            var _this3 = this;

            if (this._isPlaying) return;
            if (!this._buffer) {
                return console.error('[Ongaku] You need to load an audio file before using play()');
            }

            this._source = this._audioCtx.createBufferSource();
            this._source.buffer = this._buffer;
            this._source.connect(this._audioCtx.destination);
            this._source.onended = function () {
                return _this3.onEnd();
            };

            this._isPlaying = true;
            this._startTime = Date.now();
            this._source.start(0, this._playbackTime); // Play at current offset (defaults to 0)

            this._callbacks.onPlaybackStart();
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (!this._isPlaying) return;
            if (!this._source) return;

            this._source.stop();
            this._isPlaying = false;

            this._playbackTime = (Date.now() - this._startTime) / 1000 + this._playbackTime;

            this._callbacks.onPlaybackPause();
        }
    }, {
        key: 'seekPercentage',
        value: function seekPercentage(percentage) {
            if (percentage < 0 || percentage > 100) {
                return console.error('[Ongaku] Error, trying to seek to an invalid percentage');
            }

            if (!this._source) {
                return console.error('[Ongaku] Error, you should load an audio file before seeking');
            }

            var time = this._source.buffer.duration * (percentage / 100);

            this.seek(time);
            this._callbacks.onPlaybackSeek(time);
        }
    }, {
        key: 'seek',
        value: function seek(time) {
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
                setTimeout(this.play, 100); // <--
            } else {
                this._playbackTime = time;
            }

            this._callbacks.onPlaybackSeek(time);
        }
    }, {
        key: 'stop',
        value: function stop() {
            if (!this._isPlaying) return;
            if (!this._source) return;

            this._source.stop(0);
            this._callbacks.onPlaybackStopped();
            this._isPlaying = false;
        }
    }, {
        key: 'onEnd',
        value: function onEnd() {
            this._callbacks.onPlaybackEnd();
        }
    }]);

    return Ongaku;
}();

window.ongaku = new Ongaku({ onPlaybackStart: function onPlaybackStart() {
        return console.log('playback started');
    },
    onPlaybackPause: function onPlaybackPause() {
        return console.log('playback paused');
    },
    onPlaybackStopped: function onPlaybackStopped() {
        return console.log('playback stopped');
    },
    onPlaybackEnd: function onPlaybackEnd() {
        return console.log('playback ended');
    },
    onPlaybackSeek: function onPlaybackSeek(time) {
        return console.log('playback seek', time);
    }
});
