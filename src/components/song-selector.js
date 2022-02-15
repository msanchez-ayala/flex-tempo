import {FileSelectionButton, Button} from './buttons.js'
import {RecentSongsPopUp} from './recent-songs-popup.js'

function SongSelector(props) {
    return (
        <div id='song-sel-container'>
            <FileSelectionButton onFileChanged={props.importSong} text={'Import a song'}/>
            <RecentSongsPopUp 
              show={props.showRecentSongPopUp} 
              handleClose={props.hideRecentSongPopUp}
              handleListItemClick={props.handleImportedSongRequest}
              songNames={props.loadedSongNames}
              clearSongDB={props.clearSongDB}
            />
            <Button onClick={props.selectImportedSong} text={'Imported songs...'}/>
        </div>
    )
}

export {SongSelector}