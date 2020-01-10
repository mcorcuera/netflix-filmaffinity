import {
  nlToArr as nodeListToArray,
  createHtml
} from './utils';

export const BASE_URL = 'https://www.filmaffinity.com'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.contentScriptQuery === 'FaApi.getDetails') {
    FaApiBackground.getDetails(request.film).then(result => sendResponse(result));
    return true;
  }
})

export class FaApiBackground {
  static getDetails(film) {
    return fetch(`${BASE_URL}/es/search.php?stext=${film}`)
      .then(response => {
        if (!response.redirected) {
          return response.text()
            .then(createHtml)
            .then(body$ => FaApiBackground._parseSearchResults(body$)[0])
            .then(result => fetch(`${result.href}`))
            .then(r => {
              return r.text()
                .then(createHtml)
                .then(body$ => FaApiBackground._parseDetails(body$, r.url));
            });
        } else {
          return response.text()
            .then(createHtml)
            .then(body$ => FaApiBackground._parseDetails(body$, response.url));
        }
      });
  }

  static _parseSearchResults(body$) {
    return nodeListToArray(body$.querySelectorAll('.movie-card'))
      .map(card$ => {
        const title$ = card$.querySelector('.mc-title > a');
        const rating = parseFloat(card$.querySelector('.avgrat-box').textContent.replace(',', '.'));
        return {
          title: title$.getAttribute('title'),
          href: `${title$.getAttribute('href')}`,
          rating: isNaN(rating) ? '-' : rating,
        }
      });
  }

  static _parseDetails(body$, href) {
    const rating$ = body$.getElementById('movie-rat-avg');
    const title$ = body$.getElementById('main-title');
    const reviews$ = body$.querySelectorAll('.pro-review');
    const reviewsSummary$ = body$.querySelector('.legend-wrapper');
    return {
      rating: rating$ ? parseFloat(rating$.getAttribute('content')) : '-',
      href: href,
      title: title$.innerText.trim(),
      reviews: FaApiBackground._parseReviews(reviews$),
      reviewSummary: FaApiBackground._parseReviewSummary(reviewsSummary$),
    };
  }

  static _parseReviews(reviews$) {
    return nodeListToArray(reviews$).map(review$ => {
      const content = review$.querySelector('[itemprop="reviewBody"]').innerText;
      const critMed = review$.querySelector('.pro-crit-med').innerText.split(':');
      const author = critMed[0].trim();
      const medium = critMed[1] ? critMed[1].trim() : undefined;
      const rating$ = review$.querySelector('.fas.fa-circle');
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

  static _parseReviewSummary(reviewsSummary$) {
    if (!reviewsSummary$) {
      return undefined;
    }
    let total = 0;
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    const ratings = nodeListToArray(reviewsSummary$.querySelectorAll('.leg'));

    for (let rating of ratings) {
      const count = parseInt(rating.textContent.trim());
      if (rating.querySelector('.pos')) {
        positive += count;
      }
      if (rating.querySelector('.neu')) {
        neutral += count;
      }
      if (rating.querySelector('.neg')) {
        negative += count;
      }

      total += count;
    }

    return {
      positive: {
        count: positive,
        ratio: positive / total,
      },
      neutral: {
        count: neutral,
        ratio: neutral / total,
      },
      negative: {
        count: negative,
        ratio: negative / total,
      },
    }
  }
}
