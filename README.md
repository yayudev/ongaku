# ongaku
A helper module for using the Web Audio API as an audio file player.


## Current state.
On development.
Currently only works on browsers that support AudioContext / WebkitAudioContext.


## Installation
```js
$ npm install ongaku
```

If you don't want to use npm, you can grab the browser global version at `dist/index.brower.js`.


## Usage
```js
import Ongaku from 'ongaku';

var opts = {
  onPlaybackEnd: function() {
    console.log('ended');
  }
};

const ongaku = new Ongaku(opts);
ongaku.playAudio('/sample/path/to/my-audio.mp3');
```


## Supported methods.
- playAudio(fileUrl: string) // url of the file to play
- play()
- pause()
- stop()
- seek(time: number) // destination time in ms
- seekPercentage(percentage: number) // 0 - 100
- setVolume(volumeLevel: number) // 0 - 100
- mute()
- unmute()

## Supported options
```js
{ volume: number
, onPlaybackStart: () => void // Called when buffer starts playing
, onPlaybackPause: () => void // Called when buffer is paused
, onPlaybackStopped: () => void // Called when buffer is stopped
, onPlaybackEnd: () => void // Called when the buffer ends
, onPlaybackSeek: (time: number) => void // Called after a seek
, onVolumeChange: (newLevel: number) => void // When the volume changes (not called on mute)
}
```


## TODO:
  - [ ] Add more browser support.
  - [ ] Documentation.
