import {findPosition, getPointerPosition, toHHMMSS} from './utils';
import * as browser from './browser';

function Spinner() {
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');

  this.render = () => spinner;
}

function Header() {
  const header = document.createElement('div');
  header.classList.add('header');

  this.render = () => header;
  this.setTitle = (text, url) => {
    if(url) {
      const link = document.createElement('a');
      link.innerHTML = text;
      link.href = url;
      link.target = '_blank';
      link.classList.add('title');
      header.appendChild(link);
    } else {
      const title = document.createElement('span');
      title.classList.add('title');
      title.innerHTML = text;
      header.appendChild(title);
    }
  }
  this.hide = () => {
    header.style.display = 'none';
  }
  this.show = () => {
    header.style.display = 'block';
  }
}

function Gradient() {
  const gradient = document.createElement('div');
  gradient.classList.add('gradient');

  const gradientTop = document.createElement('div');
  gradientTop.classList.add('gradient-top');
  gradient.appendChild(gradientTop);

  const gradientBottom = document.createElement('div');
  gradientBottom.classList.add('gradient-bottom');
  gradient.appendChild(gradientBottom);

  this.render = () => gradient;
  this.hide = () => {
    gradient.style.display = 'none';
  }
  this.show = () => {
    gradient.style.display = 'block';
  }
}

function Timeline() {
  const timeline = document.createElement('div');
  timeline.classList.add('timeline');

  // Timeline buffer
  const timelineBuffer = document.createElement('div');
  timelineBuffer.classList.add('timeline-buffer');
  timeline.appendChild(timelineBuffer);

  // Timeline progress
  const timelineProgress = document.createElement('div');
  timelineProgress.classList.add('timeline-progress');
  const timeTooltip = document.createElement('div');
  timeTooltip.innerHTML = toHHMMSS(0);
  timeTooltip.classList.add('time-tooltip');
  timelineProgress.appendChild(timeTooltip);

  timeline.appendChild(timelineProgress);

  // Events
  this.onmousedown = null;
  this.onmousemove = null;
  this.onmouseup = null;

  let totalDuration = 0;
  // Seek
  let newTime = 0;
  let canMove = false;

  const calculateDistance = (event) => {
    const position = getPointerPosition(timeline, event);
    return position.x;
  }

  const handleMouseUp = (event) => {
    const doc = timeline.ownerDocument;

    // Slider inactive
    timeline.classList.remove('sliding');
    if(this.onmouseup
      && typeof this.onmouseup === 'function') {
      this.onmouseup();
    }

    canMove = false;

    doc.removeEventListener('mousemove', handleMouseMove);
    doc.removeEventListener('mouseup', handleMouseUp);
    doc.removeEventListener('touchmove', handleMouseMove);
    doc.removeEventListener('touchend', handleMouseUp);

  }

  const handleMouseMove = (event) => {
    if(canMove) {
      const distance = calculateDistance(event);
      newTime = distance * totalDuration;
      // Trigger onmousemove
      if(this.onmousemove
        && typeof this.onmousemove === 'function') {
        // newTime > 0 ? (newTime > totalDuration ? totalDuration : newTime) : 0
        this.onmousemove(newTime);
      }
    }
  }

  const handleMouseDown = (event) => {

    const doc = timeline.ownerDocument;

    if(event.type === 'mousedown') {
      event.preventDefault();
    }
    // Stop event propagation to prevent double fire
    //event.stopPropagation();
    if(event.type === 'touchstart' && !browser.IS_CHROME) {
      if(event.cancelable) event.preventDefault();
    }

    // Slider active
    timeline.classList.add('sliding');
    if(this.onmousedown
      && typeof this.onmousedown === 'function') {
      this.onmousedown();
    }

    canMove = true;

    doc.addEventListener('mousemove', handleMouseMove);
    doc.addEventListener('mouseup', handleMouseUp);
    doc.addEventListener('touchmove', handleMouseMove);
    doc.addEventListener('touchend', handleMouseUp);

    // Trigger mouseMove
    handleMouseMove(event);
  }

  timeline.addEventListener('mousedown', handleMouseDown);
  timeline.addEventListener('touchstart', handleMouseDown);
  timeline.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
  });

  this.render = () => timeline;
  this.setDuration = (duration= 0) => {
    totalDuration = duration;
  }
  this.updateProgress = (value) => {
    value < 0 ? value = 0 : value > 1 && (value = 1), timelineProgress.style.width = 100 * value + '%'
  }
  this.updateTimeTooltip = (value) => {
    timeTooltip.innerHTML = toHHMMSS(value);
  }
  this.updateBuffer = (value) => {
    value < 0 ? value = 0 : value > 1 && (value = 1), timelineBuffer.style.width = 100 * value + '%'
  }
  this.hide = () => {
    timeline.style.display = 'none';
  }
  this.show = () => {
    timeline.style.display = 'block';
  }
}

function PrevButton() {
  const prevButton = document.createElement('button');
  prevButton.classList.add('prev');

  this.render = () => prevButton;
  this.hide = () => {
    prevButton.style.display = 'none';
  }
  this.show = () => {
    prevButton.style.display = 'block';
  }
}

function PlayButton() {
  let isPlay = false;
  const playButton = document.createElement('button');
  playButton.classList.add('play');

  // Events
  this.onclick = null;

  // Click
  playButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Trigger onclick
    if(this.onclick
      && typeof this.onclick === 'function') {
      this.onclick(isPlay);
    }
  });

  this.render = () => playButton;
  this.setState = (hasPlay) => {
    isPlay = hasPlay;
    if(isPlay) {
      playButton.classList.add('pause');
    } else {
      playButton.classList.remove('pause');
    }
  }
  this.hide = () => {
    playButton.style.display = 'none';
  }
  this.show = () => {
    playButton.style.display = 'block';
  }
}

function NextButton() {
  const nextButton = document.createElement('button');
  nextButton.classList.add('next');

  this.render = () => nextButton;
  this.hide = () => {
    nextButton.style.display = 'none';
  }
  this.show = () => {
    nextButton.style.display = 'block';
  }
}

function VolumeButton() {
  let isMuted = false;
  const volumeButton = document.createElement('div');
  volumeButton.classList.add('volume');

  // Events
  this.onclick = null;

  // Click
  volumeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Trigger onclick
    if(this.onclick
      && typeof this.onclick === 'function') {
      this.onclick(isMuted);
    }
  });

  this.render = () => volumeButton;
  this.setState = (hasMuted) => {
    isMuted = hasMuted;
    if(isMuted) {
      volumeButton.classList.add('muted');
    } else {
      volumeButton.classList.remove('muted');
    }
  }
  this.hide = () => {
    volumeButton.style.display = 'none';
  }
  this.show = () => {
    volumeButton.style.display = 'block';
  }
}

function Timer() {
  const timer = document.createElement('div');
  timer.classList.add('timer');
  timer.innerHTML = toHHMMSS(0);

  this.render = () => timer;
  let totalDuration = 0;
  let currentTimeElapsed = 0;
  this.setDuration = (duration= 0) => {
    totalDuration = duration;
    timer.innerHTML = toHHMMSS(currentTimeElapsed) + ' / ' + toHHMMSS(totalDuration);
  }
  this.updateTimeElapsed = (timeElapsed = 0) => {
    currentTimeElapsed = timeElapsed;
    timer.innerHTML = toHHMMSS(currentTimeElapsed) + ' / ' + toHHMMSS(totalDuration);
  }
  this.hide = () => {
    timer.style.display = 'none';
  }
  this.show = () => {
    timer.style.display = 'show';
  }
}

function BigPlayButton() {
  const bigPlayButton = document.createElement('div');
  bigPlayButton.classList.add('big-play');

  this.render = () => bigPlayButton;
  this.hide = () => {
    bigPlayButton.style.display = 'none';
  }
  this.show = () => {
    bigPlayButton.style.display = 'block';
  }
}

function FullscreenButton() {
  let isFullscreen = false;
  const fullscreenButton = document.createElement('button');
  fullscreenButton.classList.add('fullscreen');

  // Events
  this.onclick = null;

  // Click
  fullscreenButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Trigger onclick
    if(this.onclick
      && typeof this.onclick === 'function') {
      this.onclick(isFullscreen);
    }
  });

  this.render = () => fullscreenButton;
  this.setState = (hasFullscreen) => {
    isFullscreen = hasFullscreen;
    if(isFullscreen) {
      fullscreenButton.classList.add('off');
    } else {
      fullscreenButton.classList.remove('off');
    }
  }
  this.hide = () => {
    fullscreenButton.style.display = 'none';
  }
  this.show = () => {
    fullscreenButton.style.display = 'block';
  }
}

export {
  Spinner,
  Header,
  Gradient,
  Timeline,
  PrevButton,
  PlayButton,
  NextButton,
  VolumeButton,
  Timer,
  BigPlayButton,
  FullscreenButton
}
