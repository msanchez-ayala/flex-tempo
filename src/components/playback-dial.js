import React from 'react';
import '../styles/playback-dial.css'


// ---- Data objects ---- //

const _canvasDimension = 500
const Dimensions = {
    canvas: _canvasDimension,
    triangleLength: Math.floor(_canvasDimension / 20),
    textSizeTotalTime: Math.floor(_canvasDimension / 13),
    textSizeLoopTime: Math.floor(_canvasDimension / 20)
}

const Colors = {
  black: '#000000',
  darkPurple: '#9e0dff',
  lightPurple: '#deb1fc',
  lightGray: '#f4f4f4',
  lightGrayHover: '#e0e0e0',
  darkGray: '#504F4F',
}


const _primaryArcWidth = Math.floor(_canvasDimension / 18)
const LineWidths = {
    arcWidth: _primaryArcWidth,
    loopArcWidth: _primaryArcWidth/3
}



// The canvas 0 radians is at 45 degrees clockwise from vertical.
// All angles in the canvas should thus be calculated relative
// to this "zero"
const _zero = (-1/2)*Math.PI
const _twoPI = _zero + 2*Math.PI
const RadianAngles = {
  zero: _zero,
  twoPI: _twoPI
}


const LoopStates = {
  noLoopMarkers: 'Open Loop',
  oneLoopMarker: 'Close Loop',
  twoLoopMarkers: 'Clear loop'
}


// ---- Parameter objects ---- //


class ArcParameters {
    constructor(lineWidth, strokeStyle, radius) {
      this.lineWidth = lineWidth
      this.strokeStyle = strokeStyle
      this.radius = radius
    }
  }


// ---- Data classes ---- //


class Coordinate {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    // Roate the coordinate by angle theta
    rotate(theta, cx, cy) {
        let sin = Math.sin(theta)
        let cos = Math.cos(theta)

        // Translate to origin
        this.x -= cx
        this.y -= cy
        
        // Rotate
        let newX = (this.x * cos) - (this.y * sin)
        let newY = (this.y * cos) + (this.x * sin)

        // translate point back:
        this.x = newX + cx;
        this.y = newY + cy;
    }
}


class Triangle {
    constructor(coordA, coordB, coordC) {
      this.coordA = coordA
      this.coordB = coordB
      this.coordC = coordC
      this.coords = [this.coordA, this.coordB, this.coordC]
    }

    // Rotate all coords by the same angle
    rotate(theta, cx, cy) {
        if (theta < 0 | theta > 2*Math.PI) {
            console.error(`Theta ${theta} is outside of acceptable range`)
        }
        this.coords.forEach((coord) => {
            coord.rotate(theta, cx, cy)
        })
    }
}


// ---- Helper functions ---- //


// Up-facing means the tip faces up with no rotation relative to the vertical.
function makeUpFacingTriangle(originDistance, length, centerPos) {
  let coordA = new Coordinate(centerPos, centerPos - originDistance)
  let coordB = new Coordinate(coordA.x + length / 2, coordA.y + Math.sqrt(3)/2*length)
  let coordC = new Coordinate(coordA.x - length / 2, coordA.y + Math.sqrt(3)/2*length)
  return new Triangle(coordA, coordB, coordC)
}


// Return a display time always rounded to 2 digits for seconds
function convertSecondsToDisplayTime(currentTime) {
    let minutes = Math.floor(currentTime / 60)
    let seconds = Math.round(currentTime % 60).toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false})
    return `${minutes}:${seconds}`
}


const PlaybackDial = props => {
    
    const canvasRef = React.createRef()
    const centerPos = props.dimension/2

    let outlineRadius = props.dimension/2 - (LineWidths.arcWidth/2)
    let loopArcRadius = outlineRadius - (LineWidths.loopArcWidth)
    const handleRadius = outlineRadius - LineWidths.arcWidth

    let outlineColor = Colors.lightGray
    if (props.mouseInCanvas) {
      outlineColor = Colors.lightGrayHover
    }
    
    const outlineArcParams = new ArcParameters(
      LineWidths.arcWidth, outlineColor, outlineRadius)
    const playbackArcParams = new ArcParameters(
      LineWidths.arcWidth, Colors.darkPurple, outlineRadius)
    const loopArcParams = new ArcParameters(
      LineWidths.loopArcWidth, Colors.lightPurple, loopArcRadius)
    
    // Clear the canvas of all drawings
    const clearCanvas = () => {
      const curCanvas = canvasRef.current
      const ctx = curCanvas.getContext("2d")
      ctx.clearRect(0, 0, props.dimension, props.dimension)
    }
  
    // Adjust scaling to render in high def on all displays
    const adjustScaling = (ctx) => {
      let dim = props.dimension
      canvasRef.current.style.width = dim + 'px'
      canvasRef.current.style.height = dim + 'px'
  
      let dpr = window.devicePixelRatio
      canvasRef.current.width = dim * dpr
      canvasRef.current.height = dim * dpr
      ctx.scale(dpr, dpr)
    }
  
    // Define an arc from the center of the canvas
    const defineArc = (ctx, radius, start, end) => {
      ctx.arc(centerPos, centerPos, radius, start, end)
    }
  
    // Draw and style an arc
    const drawArc = (ctx, start, end, arcParams) => {
      ctx.beginPath()
      defineArc(ctx, arcParams.radius, start, end)
      ctx.lineWidth = arcParams.lineWidth
      ctx.strokeStyle = arcParams.strokeStyle
      ctx.stroke()
    }
    
    // Draw the main outline for the dial
    const drawOutlineArc = (ctx) => {
      drawArc(ctx, RadianAngles.zero, RadianAngles.twoPI, outlineArcParams)
    }
    
    // Draw the arc indicating playback progress
    const drawPlaybackArc = (ctx) => {
      let fraction = props.currentTime / props.duration
      let endAngle = RadianAngles.zero + (fraction * 2 * Math.PI)
      drawArc(ctx, RadianAngles.zero, endAngle, playbackArcParams)
    }
    
    // Draw the arc indicating loop progress
    const drawLoopArc = (ctx) => {
      if (props.loopState === LoopStates.noLoopMarkers) {
        return
      }
      let startTimeFraction = props.loopStartTime / props.duration
      let startAngle = RadianAngles.zero + (startTimeFraction * 2 * Math.PI) 
      let endTimeFraction
      if (props.loopState === LoopStates.oneLoopMarker) {
        endTimeFraction = props.currentTime / props.duration
      } else if (props.loopState === LoopStates.twoLoopMarkers) {
        endTimeFraction = props.loopEndTime / props.duration
      }
      let endAngle = RadianAngles.zero + (endTimeFraction * 2 * Math.PI)
      drawArc(ctx, startAngle, endAngle, loopArcParams)
    }

    // Draw a triangular handle
    const drawHandle = (ctx, triangle, time) => {
      let timeFraction = time / props.duration
      if (!isNaN(timeFraction)) {
          let angle = timeFraction * 2 * Math.PI
          triangle.rotate(angle, centerPos, centerPos)
      }
      ctx.beginPath();
      ctx.moveTo(triangle.coordA.x, triangle.coordA.y);
      ctx.lineTo(triangle.coordB.x, triangle.coordB.y);
      ctx.lineTo(triangle.coordC.x, triangle.coordC.y);
      ctx.closePath();
      ctx.fillStyle = Colors.darkGray;
      ctx.fill();
    }

    const drawLoopStartHandle = (ctx) => {
      if (props.loopState === LoopStates.noLoopMarkers) {
        return
      }
      let triangle = makeUpFacingTriangle(
        handleRadius, Dimensions.triangleLength, centerPos)
      drawHandle(ctx, triangle, props.loopStartTime)
    }

    const drawLoopEndHandle = (ctx) => {
      if (props.loopState !== LoopStates.twoLoopMarkers) {
        return
      }
      let triangle = makeUpFacingTriangle(
        handleRadius, Dimensions.triangleLength, centerPos)
      drawHandle(ctx, triangle, props.loopEndTime)
    }
    
    // Draw the label displaying current time progress
    const drawTimeLabels = ctx => {
      ctx.font = Dimensions.textSizeTotalTime.toString() + 'px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      let curTime = convertSecondsToDisplayTime(props.currentTime)
      let duration = convertSecondsToDisplayTime(props.duration)
      let totalDisplayTime = `${curTime} / ${duration}`
      ctx.fillText(
        totalDisplayTime, centerPos, centerPos - Dimensions.textSizeTotalTime);
      
      if (props.loopState === LoopStates.noLoopMarkers) {
        return
      }

      let loopStartTime = convertSecondsToDisplayTime(props.loopStartTime)
      let loopEndTime = ''
      if (props.loopState === LoopStates.twoLoopMarkers) {
        loopEndTime = convertSecondsToDisplayTime(props.loopEndTime)
      }
      let loopDisplayTime = `Loop: ${loopStartTime} - ${loopEndTime}`
      ctx.font = Dimensions.textSizeLoopTime.toString() + 'px Arial'
      ctx.fillStyle = Colors.darkPurple
      ctx.fillText(loopDisplayTime, centerPos, centerPos)
    }
    
    // Update
    React.useEffect(() => {
      let ctx = canvasRef.current.getContext("2d")
      clearCanvas(ctx)
      adjustScaling(ctx)
      drawOutlineArc(ctx)
      drawPlaybackArc(ctx)
      drawLoopStartHandle(ctx)
      drawLoopEndHandle(ctx)
      drawLoopArc(ctx)
      drawTimeLabels(ctx)
    })
  
    return(
      <div id='playback-dial-container'>
        <canvas 
          id='canvas'
          ref={canvasRef} 
          width={props.dimension} 
          height={props.dimension}
          onMouseMove={props.handleMouseEvent}
          onMouseDown={props.handleMouseEvent}
          onMouseEnter={props.handleMouseEnter}
          onMouseLeave={props.handleMouseLeave}
        />
      </div>
    )
  }

export {Dimensions, LoopStates, PlaybackDial}