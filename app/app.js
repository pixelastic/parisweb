let Search = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: 'cb3f3d3a43a5996e9f5ba74003462a4f',
      indexName: 'parisweb',
      urlSync: true,
      searchFunction: (helper) => {
        // Reset the lazyloadCounter
        Search.lazyloadCounter = 0;
        helper.search();
      }
    });

    this.search.on('render', this.onRender);

    this.addSearchBoxWidget();
    // this.addStatsWidget();
    // this.addTeamsWidget();
    // this.addAuthorsWidget();
    // this.addPowersWidget();
    // this.addSpeciesWidget();
    this.addHitsWidget();
    // this.addPaginationWidget();
    // this.addCurrentRefinedValues();

    this.search.start();
  },
  cloudinary(url, options) {
    let baseUrl = 'http://res.cloudinary.com/pixelastic-marvel/image/fetch/';
    let stringOptions = [];

    // Handle common Cloudinary options
    if (options.width) {
      stringOptions.push(`w_${options.width}`);
    }
    if (options.height) {
      stringOptions.push(`h_${options.height}`);
    }
    if (options.quality) {
      stringOptions.push(`q_${options.quality}`);
    }
    if (options.crop) {
      stringOptions.push(`c_${options.crop}`);
    }
    if (options.format) {
      stringOptions.push(`f_${options.format}`);
    }
    if (options.colorize) {
      stringOptions.push(`e_colorize:${options.colorize}`);
    }
    if (options.color) {
      stringOptions.push(`co_rgb:${options.color}`);
    }
    if (options.gravity) {
      stringOptions.push(`g_${options.gravity}`);
    }

    // Fix remote urls
    url = url.replace(/^\/\//, 'http://');


    return `${baseUrl}${stringOptions.join(',')}/${url}`;
  },
  transformItem(data) {
    // Thumbnail
    let thumbnail = _.get(data, 'images.thumbnail');
    if (thumbnail) {
      thumbnail = Search.cloudinary(thumbnail, {
        width: 200,
        quality: 90,
        crop: 'scale',
        format: 'auto'
      });
    } else {
      thumbnail = './img/hit-default.jpg';
    }

    // All items are defered loading their images until in viewport, except
    // the 4 first
    let inViewport = false;
    if (Search.lazyloadCounter === undefined || Search.lazyloadCounter < 4) {
      inViewport = true;
    }
    Search.lazyloadCounter++;

    let displayData = {
      uuid: data.objectID,
      title: data.title,
      description: data.description,
      highlightedTitle: Search.getHighlightedValue(data, 'title'),
      highlightedDescription: Search.getHighlightedValue(data, 'description'),
      year: data.year,
      type: data.type,
      inViewport
    };

    return displayData;
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  // Enable lazyloading of images below the fold
  onRender() {
    let hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, (hit) => {
      inViewport(hit, {offset: 50}, onVisible);
    });
  },
  addSearchBoxWidget() {
    this.search.addWidget(
      instantsearch.widgets.searchBox({
        container: '#q',
        placeholder: 'Rechercher une conférence, un orateur, un thème...'
      })
    );
  },
  addStatsWidget() {
    this.search.addWidget(
      instantsearch.widgets.stats({
        container: '#stats'
      })
    );
  },
  addTeamsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#teams',
        attributeName: 'teams',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addPowersWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#powers',
        attributeName: 'powers',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addAuthorsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#authors',
        attributeName: 'authors',
        operator: 'and',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc'],
        showMore: {
          limit: 20
        }
      })
    );
  },
  addSpeciesWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#species',
        attributeName: 'species',
        operator: 'or',
        limit: 10,
        sortBy: ['isRefined', 'count:desc', 'name:asc']
      })
    );
  },
  hitTemplate(data) {
    let hitTemplate = $('#hitTemplate').html();
    console.info(data);
    return "nope"
  },
  addHitsWidget() {
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 10,
        templates: {
          item: Search.hitTemplate
        }
      })
    );
  },
  addPaginationWidget() {
    this.search.addWidget(
      instantsearch.widgets.pagination({
        container: '#pagination',
        labels: {
          previous: '‹ Previous',
          next: 'Next ›'
        },
        showFirstLast: false
      })
    );
  },
  addCurrentRefinedValues() {
    this.search.addWidget(
      instantsearch.widgets.currentRefinedValues({
        container: '#current-refined-values',
        clearAll: 'before'
      })
    );
  }
};

export default Search;

