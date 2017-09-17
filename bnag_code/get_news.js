var request = require("request");
var _ = require("underscore");

function get_news(crypto_currency, no_articles, callback) {
  var options = { method: 'GET',
    url: 'https://api.cognitive.microsoft.com/bing/v5.0/news/search',
    qs: { q: crypto_currency },
    headers: { 'ocp-apim-subscription-key': '86984344e78141338f75c3af1d558485' }};

    request(options, function (error, response, body) {
    if (error) throw new Error(error);
    //console.log(body);
    body = JSON.parse(body);
    var filtered_articles=[];
    var count = 0;
    _.each(_.first(body.value, no_articles), function(article) {
      count++;
      var article_object = { 'title': article.name,
                             'url': article.url,
                             'image': { 'url': article.image.thumbnail.contentUrl,
                                        'width': article.image.thumbnail.width,
                                        'height': article.image.thumbnail.height },
                             'description': article.description,
                             'source': article.provider[0].name };
      //console.log(article_object);
      filtered_articles.push(article_object);
      if(count === no_articles) {
        callback(filtered_articles);
      }
    });
  });
}

// Example: get_news("bitcoin", 1, function(stuff) {console.log(stuff);});
