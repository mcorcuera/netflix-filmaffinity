
import { FaApi } from './filmaffinity-api';

const api = new FaApi();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.contentScriptQuery === 'FaApi.getDetails') {
    api.getDetails(request.video).then(result => sendResponse(result));
    return true;
  }
})
