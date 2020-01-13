import { nlToArr } from './utils';
import { NetflixApi } from './netflix-api';

const netflixApi = new NetflixApi();
export class NetflixDecoratorManager {
  constructor() {
    this._cardDecorators = [];
    this._createObserver();
  }

  start() {
    this._observer.observe(document, {
      childList: true,
      subtree: true,
    });
  }

  registerCardDecorator(cardDecorator) {
    if (this._cardDecorators.indexOf(cardDecorator) < 0) {
      this._cardDecorators.push(cardDecorator);
    }
  }

  _createObserver() {
    this._observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          this._handleAddedNodes(mutation.addedNodes);
        }
      })
    })
  }

  _handleAddedNodes(addedNodes) {
    const cards$ = (nlToArr(addedNodes)).filter(isBobCard);
    this._handleAddedCards(cards$);
  }

  _handleAddedCards(cards$) {
    if (cards$.length > 0) {
      const cards = cards$.map(this._createCardObject);
      this._cardDecorators.forEach(decorator => {
        cards.forEach(card => {
          try {
            netflixApi.getVideoDetails(card.id).then(video => {
              card.video = video;
              decorator.decorate(card);
            });
          } catch(e) {
          }
        })
      })
    }
  }

  _createCardObject(card$) {
    const title = card$.querySelector('.bob-title').textContent.trim();
    const id = parseInt(card$.querySelector('.bob-jaw-hitzone').href.split('/').reverse()[0]);
    return {
      id,
      title,
      element: card$,
    };
  }
}

function isBobCard(node) {
  return node.classList && node.classList.contains('bob-card');
}

export function getBlobCards() {
  return document.querySelectorAll('.bob-card');
}
