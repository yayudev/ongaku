function Ongaku($audioElement) {
  this._player = $audioElement;
  this._isPlaying = false;
  this._onEndedCallback = function() {};

  this._player.addEventListener('ended', function () {
      _playerIsPlaying = false;
      this._onEndedCallback();
  }.bind(this), false);
}

Ongaku.prototype.getCurrentTime = function() {
  return this._player.currentTime;
};

Ongaku.prototype.getDuration = function() {
  return this._player.duration;
};

Ongaku.prototype.isPlaying = function() {
  return this._isPlaying;
};

Ongaku.prototype.isPaused = function() {
  return !this._isPlaying;
};

Ongaku.prototype.setTime = function(time) {
  this._player.pause();
  this._isPlaying = false;
  this._player.currentTime = time;

  this._player.addEventListener('canplay', function() {
    this._player.play();
    this._isPlaying = true;
  }.bind(this), false);

};

Ongaku.prototype.play = function() {
  this._player.play();
};

Ongaku.prototype.pause = function() {
  this._player.pause();
};

Ongaku.prototype.setOnEndedEvent = function (cb) {
  this._onEndedCallback = cb;
};

Ongaku.prototype.loadAudio = function(audioUrl) {
  this._player.pause();
  this._player.src = audioUrl; // Make sure it has the right song.
  this._player.load();
  this._player.addEventListener('canplay', function() {
    this._player.play();
    this._isPlaying = true;
  }.bind(this), false);
}


module.exports = Ongaku;
