
let time = 0;
/*
let triggers = {};
let interval = null;
let updateTrigger = false;
*/
let timerWorkerHandlers = [];

const run = (callback) => {
  try {
    return new Worker(URL.createObjectURL(new Blob(['(' + callback + ')()'])));
  } catch (e) {
    console.log('time bus error', e);
  }
}

const timerWorker = run(function() {
  const stepInterval = 20;
  const messagingInterval = 200;
  let start = 0;
  let stepTimeout;

  function handleMessages(event) {
    if(!event || !event.data) return;

    switch(event.data.type) {
      case 'pause':
        pause();
        break;
      case 'resume':
        resume();
        break;
      default:
    }
  }

  self.onmessage = handleMessages;

  function pause() {
    if(stepTimeout) {
      clearTimeout(stepTimeout);
      stepTimeout = null;
      postMessage('timeBus paused');
    }
  }

  function resume() {
    if(stepTimeout === null) {
      stepTimeout = setTimeout(step, 0);
      postMessage('timeBus resumed');
    }
  }

  function step() {
    const timestamp = performance.now();
    if(!start) start = timestamp;
    const progress = timestamp - start;
    if(progress >= messagingInterval) {
      postMessage({ type: 'timeUpdate', time: timestamp });
      start = start + messagingInterval;
    }
    stepTimeout = setTimeout(step, stepInterval);
  }

  stepTimeout = setTimeout(step, 0);
  postMessage('timeBus initialized');

});

const getTime = () => time;
const pause = () => timerWorker.postMessage({ type: 'pause' });
const resume = () => timerWorker.postMessage({ type: 'resume' });
const reset = () => {
  time = 0;
}

const execHandlers = (time) => {
  timerWorkerHandlers.forEach((handler) => {
    if(time % handler.interval < 200) {
      handler.callback.call(null, time);
    }
  });
}

const handleTimeWorkerMessages = (event) => {
  switch (event.data.type) {
    case 'timeUpdate':
      time = event.data.time;
      execHandlers(time);
      break;
    default:
  }
}

timerWorker.onmessage = handleTimeWorkerMessages;

const addHandler = (callback, interval = 200) => {
  interval = parseInt(interval);
  timerWorkerHandlers.push({
    callback: callback,
    interval: interval
  })
}

const removeHandler = (excutable) => {
  timerWorkerHandlers = timerWorkerHandlers.filter(({ callback }) => callback !== excutable);
}

export {
  addHandler,
  removeHandler,
  getTime,
  pause,
  resume,
  reset
}
