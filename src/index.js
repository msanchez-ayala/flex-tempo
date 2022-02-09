import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {importSongToDB, getURLFromSongName, getAllImportedSongNames} from "./services/indexed-db.js";
import {Dimensions, LoopStates, PlaybackDial} from './components/playback-dial.js'
import {SongSelector} from './components/song-selector.js'
import {PlaybackControls} from './components/playback-controls'


function getMousePos(event) {
  let canvas = document.getElementById('canvas')
  let rect = canvas.getBoundingClientRect()
  return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
  }
}

// Return the file name without extension
function dropExtension(filename) {
  let extIdx = filename.lastIndexOf('.')
  let name = filename.slice(0, extIdx)
  return name
}


// Return angle between the two vectors. Account for the fact that
// we treat the origin the center of the coordinate system rather
// than the top left corner
function getAngleBetweenVectors(v1, v2) {
  let dotProd = v1.x*v2.x + v1.y*v2.y
  let normV1 = Math.sqrt(v1.x**2 + v1.y**2)
  let normV2 = Math.sqrt(v2.x**2 + v2.y**2)
  let angle = Math.acos(dotProd / (normV1 * normV2))
  if (v2.x < 0) {
    angle = 2*Math.PI - angle
  }
  return angle
}


function getMouseAngleFromVertical(event, centerPos) {
  let mousePos = getMousePos(event)
  let vertVect = {x: 0, y: -centerPos}
  let mousePosVect = {x: mousePos.x - centerPos, y: mousePos.y - centerPos}
  return getAngleBetweenVectors(vertVect, mousePosVect)

}


class MainComponent extends React.Component {


  // ---- Initialization ---- //


  constructor(props) {
    super(props)

    // Inits on first import
    this.audio = null

    this.state = {
      currentURL: '',
      loadedSongNames: [],
      songDisplayName: 'Select a song...',
      play: false,
      dimension: Dimensions.canvas,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      loopState: LoopStates.noLoopMarkers,
      loopStartTime: 0,
      loopEndTime: 0,
      mouseInCanvas: false,
      showRecentSongPopUp: false,
    }
  }

  initializeAudio = () => {
    this.audio = new Audio(this.state.currentURL)
    
    this.audio.ontimeupdate = (event) => {
      this.setState({currentTime: this.audio.currentTime})
    }

    // Song has changed
    this.audio.ondurationchange = (event) => {
      this.setState(
        {duration: this.audio.duration})
      this.resetLoopState()
    }

    this.audio.onratechange = (event) => {
      this.setState({playbackRate: this.audio.playbackRate})
    }
  }


  // ---- Lifetime cycle ---- //


  componentWillUnmount() {
    if (!this.audioIsAvailable()) {
      return
    }
    window.URL.revokeObjectURL(this.state.currentURL)
    this.audio.removeEventListener('ended', () => this.setState({
      play: false,
      loopState: LoopStates.noLoopMarkers,
      loopStartTime: 0,
      loopEndTime: 0
     }))
  }

  componentDidUpdate = () => {
    if (this.state.loopState === LoopStates.twoLoopMarkers) {
      this.enforceLoop()
    }
    if (!this.audioIsAvailable() && this.state.currentURL !== '') {
      this.initializeAudio()
      
    }
    if (this.state.currentURL === '') {
      return
    }
    if (this.audio.src !== this.state.currentURL) {
      this.audio.src = this.state.currentURL
    }
  }


  // ---- Handlers ---- //
  

  togglePlay = () => {
    if (!this.audioIsAvailable()) {
      return
    }
    this.setState({ play: !this.state.play }, () => {
      this.state.play ? this.audio.play() : this.audio.pause();
    });
  }

  // Update loop state and associated times. currentTime must be updated
  // to ensure current time is never out of sync with loop times
  toggleLoopState = () => {
    if (!this.audioIsAvailable()) {
      return
    }
    switch (this.state.loopState) {
      case LoopStates.noLoopMarkers:
        this.setState({ 
          loopState: LoopStates.oneLoopMarker,
          loopStartTime: this.audio.currentTime,
          currentTime: this.audio.currentTime
         })

        break
      case LoopStates.oneLoopMarker:
        this.setState({ 
          loopState: LoopStates.twoLoopMarkers,
          loopEndTime: this.audio.currentTime,
          currentTime: this.audio.currentTime
         })
        break
      default:
        this.resetLoopState()
        break
    }
  }

  restartSong = () => {
    if (!this.audioIsAvailable()) {
      return
    }
    this.audio.currentTime = 0
    this.resetLoopState()
  }

  handleCanvasMouseEvent = event => {
    if (!this.audioIsAvailable()) {
      return
    }
    if (event.buttons !== 1) {
        return
    }
    let centerPos = this.state.dimension/2
    let angle = getMouseAngleFromVertical(event, centerPos)
    let newCurrentTime = (angle / (2*Math.PI)) * this.audio.duration
    this.audio.currentTime = newCurrentTime
  }

  handleCanvasMouseEnterLeave = event => {
    let mouseInCanvas = (event.type === 'mouseenter')
    this.setState({mouseInCanvas: mouseInCanvas})
  }

  // Prompt the user to import a song. Loads it into the audio element
  // if successful.
  importSong = event => {
    let file = event.target.files[0]
    if (file === null) {
      return
    }
    importSongToDB(file)
    this.setCurrentSong(file.name)
  }

  handlePlaybackRateChange = event => {
    if (!this.audioIsAvailable()) {
      return
    }
    let playbackRate = Math.max(event.target.valueAsNumber / 100, 0.1)
    console.log(playbackRate)
    this.audio.playbackRate = playbackRate

  }

  // Show the user all uploaded songs and allow them to select one
  selectImportedSong = event => {
    getAllImportedSongNames()
      .then(songNames => this.setState({loadedSongNames: songNames}))
      .catch(() => console.error('Could not get all song names from DB'))
    this.showRecentSongPopUp()
  }

  // Load the selected pre-imported song into the audio element
  handleImportedSongRequest = event => {
    let songName = event.target.textContent
    this.setCurrentSong(songName)
  }


  // ---- Helpers ---- //


  showRecentSongPopUp = () => {
    this.setState({showRecentSongPopUp: true})
  }

  hideRecentSongPopUp = () => {
    this.setState({showRecentSongPopUp: false})
  }

  audioIsAvailable = () => {
    return this.audio !== null
  }

  enforceLoop = () => {
    if (this.state.currentTime > this.state.loopEndTime) {
      this.audio.currentTime = this.state.loopStartTime
    }
  }

  resetLoopState = () => {
    this.setState({
      loopState: LoopStates.noLoopMarkers,
      loopStartTime: 0,
      loopEndTime: 0
    })
  }

  setCurrentSong = (songName) => {
    getURLFromSongName(songName)
      .then(songURL => {
        // Allow browser to forget about the old URL now that it's replaced
        window.URL.revokeObjectURL(this.currentURL)
        this.setState({
          currentURL: songURL.toString(),
          songDisplayName: dropExtension(songName)
        })
      })
      .then(() => this.hideRecentSongPopUp())
      .catch(() => console.error('Could get a URL from the selected song'))
  }


  render() {
    return (
      <div id='root-div'>
        <header><h1>Flex Tempo</h1></header>
        <div>
          <SongSelector
            loadedSongNames={this.state.loadedSongNames}
            showRecentSongPopUp={this.state.showRecentSongPopUp}
            importSong={this.importSong}
            hideRecentSongPopUp={this.hideRecentSongPopUp}
            handleImportedSongRequest={this.handleImportedSongRequest}
            selectImportedSong={this.selectImportedSong}
          />
          <div id='song-display-container'>
            <p id='current-song-name'>{this.state.songDisplayName}</p>
          </div>
          <PlaybackDial 
              id='playback-dial'
              dimension={this.state.dimension} 
              currentTime={this.state.currentTime}
              duration={this.state.duration}
              loopState={this.state.loopState}
              loopStartTime={this.state.loopStartTime}
              loopEndTime={this.state.loopEndTime}
              mouseInCanvas={this.state.mouseInCanvas}
              handleMouseEvent={this.handleCanvasMouseEvent}
              handleMouseEnter={this.handleCanvasMouseEnterLeave}
              handleMouseLeave={this.handleCanvasMouseEnterLeave}
          />
          <PlaybackControls
            loopState={this.state.loopState}
            toggleLoopState={this.toggleLoopState}
            play={this.state.play}
            togglePlay={this.togglePlay}
            restartSong={this.restartSong}
            handlePlaybackRateChange={this.handlePlaybackRateChange}
            playbackRate={this.state.playbackRate}
          />
        </div>
      </div>
    )
  }
}


ReactDOM.render(
  <MainComponent />,
  document.getElementById('root')
);
