export function nlToArr(nodeList) {
  return [].slice.call(nodeList);
}

export function createHtml(htmlText) {
  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = htmlText;
  return doc;
}
