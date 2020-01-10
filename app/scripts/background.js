// Enable chromereload by uncommenting this line:
import 'chromereload/devonly'
import './filmaffinity-background';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion)
})
