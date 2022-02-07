import '../styles/playback-rate-slider.css'

function PlaybackRateSlider(props) {
    let ratePercentage = Math.floor(props.playbackRate * 100)
    let displayRate = ratePercentage.toString() + '%'
    return (
        <div id='playback-rate-slider-div'>
            <div>
                <p id='display-rate-label'>{`Playback speed: ${displayRate}`}</p>
            </div>
            <div>
                <input
                    id="rateSlider" 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={ratePercentage}
                    onChange={props.handlePlaybackRateChange}
                />
            </div>
        </div>
    )
}


export {PlaybackRateSlider}