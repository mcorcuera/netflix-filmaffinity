
import {
  nlToArr as nodeListToArray,
  createHtml
} from './utils';

export const BASE_URL = 'https://www.filmaffinity.com'

export class FaApi {
  getDetails(video) {
    return fetch(`${BASE_URL}/es/search.php?stext=${video.title}&stype=title`)
      .then(response => {
        if (!response.redirected) {
          return response.text()
            .then(createHtml)
            .then(body$ => this._parseSearchResults(body$))
            .then(results => this._getFilmFromResults(video, results))
            .then(result => fetch(`${result.href}`))
            .then(r => {
              return r.text()
                .then(createHtml)
                .then(body$ => this._parseDetails(body$, r.url));
            });
        } else {
          return response.text()
            .then(createHtml)
            .then(body$ => this._parseDetails(body$, response.url));
        }
      });
  }

  _parseSearchResults(body$) {
    return nodeListToArray(body$.querySelectorAll('.z-search .se-it'))
      .map(card$ => {
        const title$ = card$.querySelector('.mc-title > a');
        const rating = parseFloat(card$.querySelector('.avgrat-box').textContent.replace(',', '.'));
        const releaseYear = parseInt(card$.querySelector('.ye-w').textContent.trim());
        let title = title$.getAttribute('title').trim();
        let type = 'movie';

        if (title.indexOf('(Serie de TV)') > 0 || title.indexOf('(Miniserie de TV)') > 0) {
          title = title.replace('(Serie de TV)', '').trim();
          title = title.replace('(Miniserie de TV)', '').trim();
          type = 'show';
        }

        return {
          title: title,
          href: `${title$.getAttribute('href')}`,
          rating: isNaN(rating) ? '-' : rating,
          type,
          releaseYear,
        }
      });
  }

  _getFilmFromResults(video, results) {
    const eligibleResults = results.filter(r => r.type == video.type && r.releaseYear === video.releaseYear);
    const normalizedFilmName = video.title.toLowerCase();
    const exactMatch = eligibleResults.find(v => v.title.trim().toLowerCase() == normalizedFilmName);

    if (!exactMatch) {
      return eligibleResults[0];
    }

    return exactMatch;
  }

  _parseDetails(body$, href) {
    const rating$ = body$.getElementById('movie-rat-avg');
    const title$ = body$.getElementById('main-title');
    const reviews$ = body$.querySelectorAll('.pro-review');
    const reviewsSummary$ = body$.querySelector('.legend-wrapper');
    return {
      rating: rating$ ? parseFloat(rating$.getAttribute('content')) : '-',
      href: href,
      title: title$.innerText.trim(),
      reviews: this._parseReviews(reviews$),
      reviewSummary: this._parseReviewSummary(reviewsSummary$),
    };
  }

  _parseReviews(reviews$) {
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

  _parseReviewSummary(reviewsSummary$) {
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
