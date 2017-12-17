import { nlToArr } from './utils';


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
            decorator.decorate(card);
          } catch(e) {
          }
        })
      })
    }
  }

  _createCardObject(card$) {
    const title = card$.querySelector('.bob-title').textContent.trim();
    const watchedTitle$ = card$.querySelector('.watched-title');
    const watchedTitle = watchedTitle$ ? watchedTitle$.textContent.trim() : undefined;
    return {
      title,
      watchedTitle,
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
