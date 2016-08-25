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
require.register("app", function(exports, require, module) {
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
    // this.addStatsWidget();
    this.addTypeWidget();
    this.addYearWidget();
    this.addTagsWidget();
    this.addAuthorsWidget();
    this.addHitsWidget();
    // this.addPaginationWidget();
    // this.addCurrentRefinedValues();

    this.search.start();
  },
  cloudinary: function cloudinary(url, options) {
    var baseUrl = 'http://res.cloudinary.com/pixelastic-parisweb/image/fetch/';
    var stringOptions = [];

    // http://res.cloudinary.com/pixelastic-parisweb/image/fetch/h_50,q_90,c_scale,r_max,f_auto/https://www.paris-web.fr/2015/assets_c/2015/05/Martin%20Naumann-thumb-143x143-487.jpg
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

    var isConference = data.type == 'Conférence';
    var isWorkshop = data.type == 'Atelier';

    var description = data._snippetResult.description.value;
    description = description.replace(' …', '…');

    // Get only authors name and pictures
    // TODO: It should be possible to further select/unselect on clicking on
    // authors
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
        name: data._highlightResult.authors[index].name.value,
        picture: picture
      };
    });

    // TODO: Thumbnails
    // If there is a dailymotion/youtube video, we can try to get the thumbnail
    // Check if possible to get one from slideshare and other hosting
    // webservices
    // Otherwise, downloading the PDF, extracting the first page and pushing it
    // along the content

    // TODO: Tags
    // - We should be able to click on tags to further select/unselect them
    // - If a selection is currently made on a tag, it should be visible

    var displayData = {
      uuid: data.objectID,
      inViewport: inViewport,
      isConference: isConference,
      isWorkshop: isWorkshop,
      title: Search.getHighlightedValue(data, 'title'),
      description: description,
      year: data.year,
      tags: data.tags,
      authors: authors
    };

    return displayData;
  },
  getHighlightedValue: function getHighlightedValue(object, property) {
    if (!_.has(object, '_highlightResult.' + property + '.value')) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },

  // Enable lazyloading of images below the fold
  onRender: function onRender() {
    var hits = $('.hit');
    function onVisible(hit) {
      $(hit).addClass('hit__inViewport');
    }
    _.each(hits, function (hit) {
      inViewport(hit, { offset: 50 }, onVisible);
    });
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
  addAuthorsWidget: function addAuthorsWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#authors',
      attributeName: 'authors.name',
      operator: 'or',
      sortBy: ['isRefined', 'count:desc', 'name:asc'],
      limit: 10,
      showMore: {
        limit: 20,
        templates: Search.showMoreTemplates
      }
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
  addHitsWidget: function addHitsWidget() {
    var hitTemplate = $('#hitTemplate').html();
    this.search.addWidget(instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 10,
      templates: {
        item: hitTemplate
      },
      transformData: {
        item: Search.transformItem
      }
    }));
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