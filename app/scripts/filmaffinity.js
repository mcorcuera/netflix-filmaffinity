import {
  log
} from './logger';


export class FaApi {
  static getDetails(film) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({contentScriptQuery: 'FaApi.getDetails', film: film}, resolve)
    });
  }
}

export class FaNetflixDecorator {

  constructor() {
    this._cachedDetails = {};
  }

  decorate(card) {
    this._getDetails(card.title)
      .then((details) => {
        try {
          this._addFaRating(card, details);
          this._addBoyeroRating(card, details);
        } catch (e) {

        }
      })
  }

  _addFaRating(card, details) {
      const overlay$ = card.element.querySelector('.bob-overlay > .bob-play-hitzone');
      const addon$ = this._createElement(details);
      overlay$.insertBefore(addon$, overlay$.firstChild);
  }

  _addBoyeroRating(card, details) {
    const boyero = details.reviews.find(r => r.author.indexOf('Boyero') >= 0);
    if (!boyero) {
     return;
    }
    console.log('xxx boyer,', boyero);
    const buttonWrapper$ = card.element.querySelector('.filmaffinity-addon');
    const div$ = document.createElement('div');
    div$.classList.add('nf-svg-button-wrapper');
    div$.classList.add('filmaffinity-boyero');
    div$.classList.add(`filmaffinity-boyero--${boyero.rating}`)
    div$.innerHTML = `
      <a role="link" class="nf-svg-button simpleround filmaffinity-boyero__head" role="link">
      </a>
      <span class="filmaffinity-boyero__tooltip nf-svg-button-tooltip" role="status" aria-live="assertive">${boyero.content}</span>
    `;
    buttonWrapper$.appendChild(div$, buttonWrapper$.firstChild);
  }

  _createElement(details) {
    const div$ = document.createElement('div');
    div$.classList.add('filmaffinity-addon');
    let ratings = '';
    if (details.reviewSummary) {
      let summary = details.reviewSummary;
      ratings = `
        <div class="filmaffinity-ratings">
          ${summary.positive.count > 0
            ? `<div class="filmaffinity-rating filmaffinity-rating--positive" style="width: ${summary.positive.ratio * 100}%"></div>`
            : ''}
          ${summary.neutral.count > 0
            ? `<div class="filmaffinity-rating filmaffinity-rating--neutral" style="width: ${summary.neutral.ratio * 100}%"></div>`
            : ''}
          ${summary.negative.count > 0
            ? `<div class="filmaffinity-rating filmaffinity-rating--negative" style="width: ${summary.negative.ratio * 100}%"></div>`
            : ''}
        </div>
      `
    }
    div$.innerHTML = `
      <div class="filmaffinity-wrapper">
        <a href="${details.href}" target="_blank">
          <span class="filmaffinity-addon__label">Filmaffinity</span>
          <span class="filmaffinity-addon__rating">${details.rating}</span>
        </a>
        ${ratings}
      </div>
    `;
    div$.getElementsByTagName('a')[0].addEventListener('click', e => {
      e.cancelBubble = true;
      e.stopPropagation();
      return false;
    })
    return div$;
  }

  _getDetails(title) {
    return FaApi.getDetails(title);
  }
}
