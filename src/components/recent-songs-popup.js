
import React from 'react';
import '../styles/recent-songs-popup.css';


function ListItem(props) {
    return <li onClick={props.onClick}>{props.value}</li>
}


const RecentSongsPopUp = (props) => {
  const showHideClassName = props.show ? "popup display-block" : "popup display-none";
  let listItems = props.songNames.map((file) => 
      <ListItem key={file} onClick={props.handleListItemClick} value={file}/>
  )
  return (
    <div className={showHideClassName}>
      <section className="popup-main">
        <h1>Select a recent song to play</h1>
        <ul>{listItems}</ul>
        {/* <button onClick={props.clearSongDB}>Clear all songs</button> */}
        <button onClick={props.handleClose}>Close</button>
      </section>
    </div>
  );
};

export {RecentSongsPopUp}