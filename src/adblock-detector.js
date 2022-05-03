import {fetchWithTimeout} from './utils';

export function checkUrlsByAdBlock([url, method, mode], callback) {
  fetchWithTimeout(new Request(url, { method: method, mode: mode ? mode : 'no-cors' }), {}, 20000)
    .then(res => res)
    .then(() => {
      if(typeof callback === 'function') {
        callback(url, false);
      }
    })
    .catch(() => {
      if(typeof callback === 'function') {
        callback(url, true);
      }
    });
}
