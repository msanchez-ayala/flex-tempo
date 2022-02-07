import React from 'react';
import '../styles/buttons.css';


function Button(props) {
  return (
    <button className={props.className} onClick={props.onClick}>{props.text}</button>
  )
}
  

// A label with file input disguised as a regular buttons
function FileSelectionButton(props) {
  return (
    <label className="custom-file-upload">
      <input type="file" accept="audio/*" onChange={props.onFileChanged}/>
      {props.text}
    </label>
  )
}

export {FileSelectionButton, Button}