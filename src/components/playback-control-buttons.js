import {Button} from './buttons.js'

function PlaybackButtons(props) {
    const playButtonText = props.play ? 'Pause' : 'Play'
    return (
        <div id='music-container'>
            <Button onClick={props.toggleLoopState} text={props.loopState}/>
            <Button classname={'primary-button'} onClick={props.togglePlay} text={playButtonText}/>
            <Button onClick={props.restartSong} text={'Restart'}/>
        </div>
    )
}

export {PlaybackButtons}