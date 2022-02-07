import {PlaybackRateSlider} from './playback-rate-slider.js'
import {PlaybackButtons} from './playback-control-buttons.js'


function PlaybackControls(props) {
    return (
        <div>
            <PlaybackRateSlider
                handlePlaybackRateChange={props.handlePlaybackRateChange}
                playbackRate={props.playbackRate}
            />
            <PlaybackButtons
                loopState={props.loopState}
                toggleLoopState={props.toggleLoopState}
                play={props.play}
                togglePlay={props.togglePlay}
                restartSong={props.restartSong}
            />
        </div>
    )
}

export {PlaybackControls}