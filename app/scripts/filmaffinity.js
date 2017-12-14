import {
  log
} from './logger';
import {
  nlToArr,
  createHtml
} from './utils';

export const BASE_URL = 'https://www.filmaffinity.com'

export class FaApi {

  static getRating(film) {
    return fetch(`${BASE_URL}/es/search.php?stext=${film}`)
      .then(response => {
        if (!response.redirected) {
          return response.text()
            .then(createHtml)
            .then(body$ => FaApi._parseSearchResults(body$)[0]);
        } else {
          return response.text()
            .then(createHtml)
            .then(body$ => FaApi._parseDetails(body$, response.url));
        }
      });
  }

  static _parseSearchResults(body$) {
    return nlToArr(body$.querySelectorAll('.movie-card'))
      .map(card$ => {
        const title$ = card$.querySelector('.mc-title > a');
        const rating = parseFloat(card$.querySelector('.avgrat-box').textContent.replace(',', '.'));
        return {
          title: title$.getAttribute('title'),
          href: `${BASE_URL}${title$.getAttribute('href')}`,
          rating: isNaN(rating) ? '-' : rating,
        }
      });
  }

  static _parseDetails(body$, href) {
    const rating$ = body$.getElementById('movie-rat-avg');
    const title$ = body$.getElementById('main-title');
    return {
      rating: parseFloat(rating$.getAttribute('content')),
      href: href,
      title: title$.innerText.trim(),
    };
  }
}

export class FaNetflixDecorator {

  constructor() {
    this._cachedDetails = {};
  }

  decorate(card) {
    this._getDetails(card.title)
      .then((details) => {
        const overlay$ = card.element.querySelector('.bob-overlay');
        const addon$ = this._createElement(details);
        overlay$.appendChild(addon$);
      })
  }

  _createElement(details) {
    const div$ = document.createElement('div');
    div$.classList.add('filmaffinity-addon');
    div$.innerHTML = `
      <a href="${details.href}" target="_blank">
        <span class="filmaffinity-addon__label">Filmaffinity</span>
        <span class="filmaffinity-addon__rating">${details.rating}</span>
      </a>
    `;
    return div$;
  }

  _getDetails(title) {
    return FaApi.getRating(title);
  }
}
