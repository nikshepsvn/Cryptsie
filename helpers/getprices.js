var request = require("request");


function getPrice(crypto_currency, user_currency) {
var ret = -1;
var options = {method: 'GET',
  url: `https://api.coinbase.com/v2/prices/${crypto_currency}-USD/buy`,
};
request(options, function (error, response, body) {
  if (error) throw new Error(error);
  body = JSON.parse(body);
  var options = { method: 'GET',
    url: 'https://xecdapi.xe.com/v1/convert_from/',
    qs: { to: user_currency, from: 'usd', amount: body.data.amount },
    headers:
     { authorization: 'Basic aGFja3RoZW5vcnRoOTE3OTI3MTMyOmsyNGM5aHFqaW5jdThmZGxtOWdxZjVpNzJr' } };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    body = JSON.parse(body);
    // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
    ret = body;
  });
});
return ret;
}

//console.log("P:" + getPrice('ETH', 'GBP'));
// Example: get_price('LTC', 'INR');

module.exports = {
  getPriceFunc: getPrice
};