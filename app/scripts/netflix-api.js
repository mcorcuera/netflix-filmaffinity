var port = chrome.runtime.connect();

const injectJs = `
  window.addEventListener("message", e => {
    if (e.data.type === 'FA.evaluatePath') {
      path = e.data.path;
      netflix.appContext.state.pathEvaluator.get(path).subscribe(
        response => {
          window.postMessage({type: 'FA.pathResult', path, json: response.json}, '*')
        },
        error => window.postMessage({type: 'FA.pathResult', path, error: error}, '*'),
      )
    }
  })
`

const script = document.createElement("script");
script.innerHTML = injectJs;
document.head.appendChild(script);

const isPathEqual = (p1, p2) => {
  if (p1 === p2) return true;
  if (p1 == null || p2 == null) return false;
  if (p1.length != p2.length) return false;

  for (let i = 0; i < p1.length; i++) {
    if (typeof p1[i] != typeof p2[i]) {
      return false;
    }
    if (Array.isArray(p1[i]) && Array.isArray(p2[i])) {
      if (!isPathEqual(p1[i], p2[i])) {
        return false;
      }
    } else if(p1[i] != p2[i]) {
      return false;
    }
  }

  return true;
}

export class NetflixApi {
  constructor() {
  }

  getVideoDetails(videoId) {
    return this._getPath(["videos", videoId, ["summary", "title", "releaseYear"]]).then(
      json => {
        const video = json.videos[videoId];

        return {
          id: videoId,
          type: video.summary.type,
          title: video.title,
          releaseYear: video.releaseYear,
        };
      });
  }

  _getPath(path) {
    return new Promise((resolve, reject) => {
      const listener = function (event) {
        if (event.data.type == 'FA.pathResult' && isPathEqual(path, event.data.path)) {
          if (event.data.json) {
            resolve(event.data.json)
          } else {
            reject(event.data.error);
          }
          window.removeEventListener('message', listener);
        }
      };
      window.addEventListener('message', listener);
      window.postMessage({ type: 'FA.evaluatePath', path });
    })
  }

}

