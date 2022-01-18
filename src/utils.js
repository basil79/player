/**
utils.js
 */

// IntersectionObserver
// Detect element visibility

function observeVisibility(el, callback) {
  const observer = new IntersectionObserver(callback, {
    root: null, // viewport
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] // every 10%
  });
  try {
    observer.observe(el);
  } catch (e) {
    console.log('IntersectionObserver setup failed', e);
  }
  return observer
}

function visible(intersectionRatio, threshold) {
  return intersectionRatio * 100 >= threshold
}

export {
  observeVisibility,
  visible
}
