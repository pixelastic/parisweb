(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var unalias = function(alias, loaderPath) {
    var result = aliases[alias] || aliases[alias + '/index.js'];
    return result || alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from ' + '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  require._cache = cache;
  globals.require = require;
})();
'use strict';

/* jshint ignore:start */
(function () {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = window.brunch || {};
  var ar = br['auto-reload'] = br['auto-reload'] || {};
  if (!WebSocket || ar.disabled) return;

  var cacheBuster = function cacheBuster(url) {
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'cacheBuster=' + date;
  };

  var browser = navigator.userAgent.toLowerCase();
  var forceRepaint = ar.forceRepaint || browser.indexOf('chrome') > -1;

  var reloaders = {
    page: function page() {
      window.location.reload(true);
    },

    stylesheet: function stylesheet() {
      [].slice.call(document.querySelectorAll('link[rel=stylesheet]')).filter(function (link) {
        var val = link.getAttribute('data-autoreload');
        return link.href && val != 'false';
      }).forEach(function (link) {
        link.href = cacheBuster(link.href);
      });

      // Hack to force page repaint after 25ms.
      if (forceRepaint) setTimeout(function () {
        document.body.offsetHeight;
      }, 25);
    }
  };
  var port = ar.port || 9486;
  var host = br.server || window.location.hostname || 'localhost';

  var connect = function connect() {
    var connection = new WebSocket('ws://' + host + ':' + port);
    connection.onmessage = function (event) {
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };
    connection.onerror = function () {
      if (connection.readyState) connection.close();
    };
    connection.onclose = function () {
      window.setTimeout(connect, 1000);
    };
  };
  connect();
})();
/* jshint ignore:end */
;require.register("app", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Search = {
  init: function init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: 'cb3f3d3a43a5996e9f5ba74003462a4f',
      indexName: 'parisweb',
      urlSync: true,
      searchFunction: function searchFunction(helper) {
        // Reset the lazyloadCounter
        Search.lazyloadCounter = 0;
        helper.search();
      }
    });

    this.showMoreTemplates = {
      inactive: '<a class="ais-show-more ais-show-more__inactive">Voir plus</a>',
      active: '<a class="ais-show-more ais-show-more__active">Voir moins</a>'
    };

    this.search.on('render', this.onRender);

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addTagsWidget();
    this.addAuthorsWidget();
    this.addTypeWidget();
    this.addYearWidget();
    this.addHitsWidget();
    this.addPaginationWidget();
    // this.addCurrentRefinedValues();

    this.search.start();
  },
  onRender: function onRender() {
    // Enable lazyloading of images below the fold
    var hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, function (hit) {
      inViewport(hit, { offset: 50 }, onVisible);
    });
  },

  // Check if the specified facet value is currently refined
  isRefined: function isRefined(facetName, facetValue) {
    var facetRefinements = Search.search.helper.getRefinements(facetName);
    return !!_.find(facetRefinements, { value: facetValue });
  },
  cloudinary: function cloudinary(url, options) {
    var baseUrl = 'https://res.cloudinary.com/pixelastic-parisweb/image/fetch/';
    var stringOptions = [];

    // Handle common Cloudinary options
    if (options.width) {
      stringOptions.push('w_' + options.width);
    }
    if (options.height) {
      stringOptions.push('h_' + options.height);
    }
    if (options.quality) {
      stringOptions.push('q_' + options.quality);
    }
    if (options.crop) {
      stringOptions.push('c_' + options.crop);
    }
    if (options.radius) {
      stringOptions.push('r_' + options.radius);
    }
    if (options.format) {
      stringOptions.push('f_' + options.format);
    }
    if (options.colorize) {
      stringOptions.push('e_colorize:' + options.colorize);
    }
    if (options.grayscale) {
      stringOptions.push('e_grayscale');
    }
    if (options.color) {
      stringOptions.push('co_rgb:' + options.color);
    }
    if (options.gravity) {
      stringOptions.push('g_' + options.gravity);
    }

    // Fix remote urls
    url = url.replace(/^\/\//, 'http://');

    return '' + baseUrl + stringOptions.join(',') + '/' + url;
  },
  transformItem: function transformItem(data) {
    // All items are defered loading their images until in viewport, except
    // the 4 first
    var inViewport = false;
    if (Search.lazyloadCounter === undefined || Search.lazyloadCounter < 4) {
      inViewport = true;
    }
    Search.lazyloadCounter++;

    // Conference / Workshop
    var isConference = data.type == 'Conférence';
    var isWorkshop = data.type == 'Atelier';

    // Description
    var description = data._snippetResult.description.value;
    description = description.replace(' …', '…');

    // Ressources
    var video = _.get(data, 'ressources.video');
    var slides = _.get(data, 'ressources.slides');

    // Thumbnail
    var thumbnail = data.thumbnail;
    if (thumbnail) {
      if (_.startsWith(thumbnail, './img')) {
        thumbnail = 'https://pixelastic.github.io/parisweb/' + thumbnail;
      }
      thumbnail = Search.cloudinary(thumbnail, {
        quality: 90,
        format: 'auto'
      });
    }
    var thumbnailLink = video || slides;

    // Authors
    var authors = _.map(data.authors, function (author, index) {
      var picture = Search.cloudinary(author.picture, {
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
        picture: picture
      };
    });

    // Tags
    var tags = _.map(data.tags, function (tag, index) {
      return {
        plainValue: tag,
        highlightedValue: data._highlightResult.tags[index].value,
        isRefined: Search.isRefined('tags', tag)
      };
    });

    var displayData = {
      uuid: data.objectID,
      inViewport: inViewport,
      isConference: isConference,
      isWorkshop: isWorkshop,
      title: Search.getHighlightedValue(data, 'title'),
      url: data.url,
      description: description,
      year: data.year,
      thumbnail: thumbnail,
      thumbnailLink: thumbnailLink,
      video: video,
      slides: slides,
      tags: tags,
      authors: authors,
      objectID: data.objectID
    };

    return displayData;
  },
  getHighlightedValue: function getHighlightedValue(object, property) {
    if (!_.has(object, '_highlightResult.' + property + '.value')) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  addSearchBoxWidget: function addSearchBoxWidget() {
    this.search.addWidget(instantsearch.widgets.searchBox({
      container: '#q',
      placeholder: 'Rechercher une conférence, un orateur, un thème...'
    }));
  },
  addStatsWidget: function addStatsWidget() {
    this.search.addWidget(instantsearch.widgets.stats({
      container: '#stats'
    }));
  },
  addTagsWidget: function addTagsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#tags',
      attributeName: 'tags',
      operator: 'and',
      limit: 10,
      showMore: {
        limit: 20,
        templates: Search.showMoreTemplates
      }
    }));
  },
  addAuthorsWidget: function addAuthorsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#authors',
      attributeName: 'authors.name',
      operator: 'or',
      sortBy: ['isRefined', 'name:asc', 'count:desc'],
      limit: 10,
      showMore: {
        limit: 20,
        templates: Search.showMoreTemplates
      }
    }));
  },
  addTypeWidget: function addTypeWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#type',
      attributeName: 'type'
    }));
  },
  addYearWidget: function addYearWidget() {
    this.search.addWidget(instantsearch.widgets.rangeSlider({
      container: '#year',
      attributeName: 'year',
      tooltips: {
        format: _.parseInt
      },
      pips: false,
      step: 1
    }));
  },
  addHitsWidget: function addHitsWidget() {
    var hitTemplate = $('#hitTemplate').html();
    var noResults = $('#noResults').html();
    this.search.addWidget(instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        item: hitTemplate,
        empty: noResults
      },
      transformData: {
        item: Search.transformItem
      }
    }));

    // Allow user to further select/deselect facets directly in the hits
    var hitContainer = $('#hits');
    hitContainer.on('click', '.js-facet-toggle', function (event) {
      var target = $(event.currentTarget);
      var facetName = target.data('facet-name');
      var facetValue = target.data('facet-value');
      Search.search.helper.toggleRefinement(facetName, facetValue).search();
      target.toggleClass('hit-facet__isRefined');
    });
  },
  addPaginationWidget: function addPaginationWidget() {
    this.search.addWidget(instantsearch.widgets.pagination({
      container: '#pagination',
      labels: {
        previous: '‹ Previous',
        next: 'Next ›'
      },
      showFirstLast: false
    }));
  },
  addCurrentRefinedValues: function addCurrentRefinedValues() {
    this.search.addWidget(instantsearch.widgets.currentRefinedValues({
      container: '#current-refined-values',
      clearAll: 'before'
    }));
  }
};

exports.default = Search;
});


//# sourceMappingURL=app.js.map