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

    this.showMoreTemplates = {
      inactive:'<a class="ais-show-more ais-show-more__inactive">Voir plus</a>',
      active:'<a class="ais-show-more ais-show-more__active">Voir moins</a>'
    }

    this.search.on('render', this.onRender);

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addTagsWidget();
    this.addAuthorsWidget();
    this.addTypeWidget();
    this.addRessourcesWidget();
    this.addYearWidget();
    this.addHitsWidget();
    this.addPaginationWidget();

    this.search.start();
  },
  onRender() {
    // Enable lazyloading of images below the fold
    let hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, (hit) => {
      inViewport(hit, {offset: 50}, onVisible);
    });
  },
  // Check if the specified facet value is currently refined
  isRefined(facetName, facetValue) {
    let facetRefinements = Search.search.helper.getRefinements(facetName);
    return !!_.find(facetRefinements, { value: facetValue });
  },
  cloudinary(url, options) {
    let baseUrl = 'https://res.cloudinary.com/pixelastic-parisweb/image/fetch/';
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
    if (options.radius) {
      stringOptions.push(`r_${options.radius}`);
    }
    if (options.format) {
      stringOptions.push(`f_${options.format}`);
    }
    if (options.colorize) {
      stringOptions.push(`e_colorize:${options.colorize}`);
    }
    if (options.grayscale) {
      stringOptions.push(`e_grayscale`);
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
    // All items are defered loading their images until in viewport, except
    // the 4 first
    let inViewport = false;
    if (Search.lazyloadCounter === undefined || Search.lazyloadCounter < 4) {
      inViewport = true;
    }
    Search.lazyloadCounter++;

    // Conference / Workshop
    let isConference = data.type == 'Conférence';
    let isWorkshop = data.type == 'Atelier';

    // Description
    let description = data._snippetResult.description.value;
    description = description.replace(' …', '…');

    // Ressources
    let video = _.get(data, 'ressources.video');
    let slides = _.get(data, 'ressources.slides');

    // Thumbnail
    let thumbnail = data.thumbnail;
    if (thumbnail) {
      if (_.startsWith(thumbnail, './img')) {
        thumbnail = `https://pixelastic.github.io/parisweb/${thumbnail}`;
      }
      thumbnail = Search.cloudinary(thumbnail, {
        quality: 90,
        format: 'auto'
      });
    }
    let thumbnailLink = video || slides;

    // Authors
    let authors = _.map(data.authors, (author, index) => {
      let picture = Search.cloudinary(author.picture, {
        height: 50,
        width: 50,
        quality: 90,
        grayscale: true,
        crop: 'scale',
        radius: 'max',
        format: 'auto'
      });
      return {
        plainName: author.name,
        highlightedName: data._highlightResult.authors[index].name.value,
        isRefined: Search.isRefined('authors.name', author.name),
        picture
      }
    });

    // Tags
    let tags = _.map(data.tags, (tag, index) => {
      return {
        plainValue: tag,
        highlightedValue: data._highlightResult.tags[index].value,
        isRefined: Search.isRefined('tags', tag),
      }
    });

    let displayData = {
      uuid: data.objectID,
      inViewport,
      isConference,
      isWorkshop,
      title: Search.getHighlightedValue(data, 'title'),
      url: data.url,
      description,
      year: data.year,
      thumbnail,
      thumbnailLink,
      video,
      slides,
      tags,
      authors,
      objectID: data.objectID
    };

    return displayData;
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      return object[property];
    }
    return object._highlightResult[property].value;
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
  addTagsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#tags',
        attributeName: 'tags',
        operator: 'and',
        limit: 10,
        showMore: {
          limit: 20,
          templates: Search.showMoreTemplates
        }
      })
    );
  },
  addAuthorsWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#authors',
        attributeName: 'authors.name',
        operator: 'or',
        sortBy: ['isRefined', 'name:asc', 'count:desc'],
        limit: 10,
        showMore: {
          limit: 20,
          templates: Search.showMoreTemplates
        }
      })
    );
  },
  addTypeWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#type',
        attributeName: 'type'
      })
    );
  },
  addRessourcesWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#ressources',
        attributeName: 'availableRessources',
        operator: 'and'
      })
    );
  },
  addYearWidget() {
    this.search.addWidget(
      instantsearch.widgets.rangeSlider({
        container: '#year',
        attributeName: 'year',
        tooltips: {
          format: _.parseInt
        },
        pips: false,
        step: 1
      })
    );
  },
  addHitsWidget() {
    let hitTemplate = $('#hitTemplate').html();
    let noResults = $('#noResults').html();
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 10,
        templates: {
          item: hitTemplate,
          empty: noResults
        },
        transformData: {
          item: Search.transformItem
        }
      })
    );

    // Allow user to further select/deselect facets directly in the hits
    let hitContainer = $('#hits');
    hitContainer.on('click', '.js-facet-toggle', (event) => {
      var target = $(event.currentTarget);
      var facetName = target.data('facet-name');
      var facetValue = target.data('facet-value');
      Search.search.helper.toggleRefinement(facetName, facetValue).search();
      target.toggleClass('hit-facet__isRefined');
    });
  },
  addPaginationWidget() {
    this.search.addWidget(
      instantsearch.widgets.pagination({
        container: '#pagination',
        labels: {
          previous: '‹ Précédent',
          next: 'Suivant ›'
        },
        showFirstLast: false
      })
    );
  }
};

export default Search;
