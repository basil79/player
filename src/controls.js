import {toHHMMSS} from './utils';

function Header() {
  const header = document.createElement('div');
  header.classList.add('header');

  this.render = () => header;
  this.setTitle = (text, url) => {
    if(url) {
      const link = document.createElement('a');
      link.innerHTML = text;
      link.href = url;
      header.appendChild(link);
    } else {
      header.innerHTML = text;
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
  timeline.appendChild(timelineProgress);

  this.render = () => timeline;
  this.updateProgress = (value) => {
    value < 0 ? value = 0 : value > 1 && (value = 1), timelineProgress.style.width = 100 * value + '%'
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
  prevButton.innerHTML = 'Prev';

  this.render = () => prevButton;
  this.hide = () => {
    prevButton.style.display = 'none';
  }
  this.show = () => {
    prevButton.style.display = 'block';
  }
}

// TODO:
function PlayButton() {
  let isPlay = false;
  const playButton = document.createElement('button');
  playButton.classList.add('play');

  this.render = () => playButton;
  this.setState = (hasPlay) => {
    isPlay = hasPlay;
    if(isPlay) {
      playButton.classList.add('pause');
    } else {
      playButton.classList.remove('pause');
    }
  }
  this.onClick = function(callback) {
    playButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if(callback
        && typeof callback === 'function') {
        callback(isPlay);
      }
    }, false);
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
  nextButton.innerHTML = 'Next';

  this.render = () => nextButton;
  this.hide = () => {
    nextButton.style.display = 'none';
  }
  this.show = () => {
    nextButton.style.display = 'block';
  }
}

function VolumeButton() {
  const volumeButton = document.createElement('div');
  volumeButton.classList.add('volume');

  this.render = () => volumeButton;
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
  const fullscreenButton = document.createElement('button');
  fullscreenButton.classList.add('fullscreen');
  fullscreenButton.innerHTML = 'Fullscreen';

  this.render = () => fullscreenButton;
  this.hide = () => {
    fullscreenButton.style.display = 'none';
  }
  this.show = () => {
    fullscreenButton.style.display = 'block';
  }
}

export {
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
