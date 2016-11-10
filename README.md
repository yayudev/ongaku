# ongaku
A helper module for using the Web Audio API as an audio file player.


## Current state.
On development.
Currently only works on browsers that support AudioContext / WebkitAudioContext. Support for `<audio>` tag upcoming.


## Installation
```js
$ npm install ongaku
```

If you don't want to use npm, you can grab the browser global version from (here)[https://github.com/datyayu/ongaku/blob/master/dist/index.browser.js].


## Usage
```js
import Ongaku from 'ongaku';

const opts = {
  onPlaybackEnd: function() {
    console.log('ended');
  },
  volume: 50,
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
- getPlaybackTime() // current track playing time (in seconds)

## Supported options
```js
{ volume: number // The default volume, 0-100
, onPlaybackStart: () => void // Called when buffer starts playing
, onPlaybackPause: () => void // Called when buffer is paused
, onPlaybackStopped: () => void // Called when buffer is stopped
, onPlaybackEnd: () => void // Called when the buffer ends
, onPlaybackSeek: (time: number) => void // Called after a seek
, onVolumeChange: (newLevel: number) => void // When the volume changes (not called on mute)
, getPlaybackTime: () => (time: number) // Current playback time
}
```


## TODO:
  - [ ] Add more browser support.
  - [ ] Documentation.
