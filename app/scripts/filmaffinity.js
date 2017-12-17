import {
  log
} from './logger';
import {
  nlToArr,
  createHtml
} from './utils';

export const BASE_URL = 'https://www.filmaffinity.com'

export class FaApi {

  static getDetails(film) {
    return fetch(`${BASE_URL}/es/search.php?stext=${film}`)
      .then(response => {
        if (!response.redirected) {
          return response.text()
            .then(createHtml)
            .then(body$ => FaApi._parseSearchResults(body$)[0])
            .then(result => fetch(`${result.href}`))
            .then(r => {
              return r.text()
                .then(createHtml)
                .then(body$ => FaApi._parseDetails(body$, r.url));
            });
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
    const reviews$ = body$.querySelectorAll('.pro-review');
    return {
      rating: rating$ ? parseFloat(rating$.getAttribute('content')) : '-',
      href: href,
      title: title$.innerText.trim(),
      reviews: FaApi._parseReviews(reviews$),
    };
  }

  static _parseReviews(reviews$) {
    return nlToArr(reviews$).map(review$ => {
      const content = review$.querySelector('[itemprop="reviewBody"]').innerText;
      const critMed = review$.querySelector('.pro-crit-med').innerText.split(':');
      const author = critMed[0].trim();
      const medium = critMed[1] ? critMed[1].trim() : undefined;
      const rating$ = review$.querySelector('.fa.fa-circle');
      const ratingClasses = rating$.classList;
      let rating = '';
      if (ratingClasses.contains('pos')) {
        rating = 'positive';
      } else if (ratingClasses.contains('neu')) {
        rating = 'neutral';
      } else if (ratingClasses.contains('neg')) {
        rating = 'negative';
      } else {
        rating = 'none';
      }
      return {
        author,
        medium,
        content,
        rating,
      };
    })
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
    const buttonWrapper$ = card.element.querySelector('.bob-button-wrapper');
    const div$ = document.createElement('div');
    div$.classList.add('nf-svg-button-wrapper');
    div$.classList.add('filmaffinity-boyero');
    div$.classList.add(`filmaffinity-boyero--${boyero.rating}`)
    div$.innerHTML = `
      <a role="link" class="nf-svg-button simpleround filmaffinity-boyero__head" role="link">
      </a>
      <span class="filmaffinity-boyero__tooltip nf-svg-button-tooltip" role="status" aria-live="assertive">${boyero.content}</span>
    `;
    buttonWrapper$.insertBefore(div$, buttonWrapper$.firstChild);
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
