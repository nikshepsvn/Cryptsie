var request = require("request");
var restify = require('restify');
var builder = require('botbuilder');


function updateAppPrice(crypto_currency, obj){
	var options = {method: 'GET',
  url: `https://api.coinbase.com/v2/prices/${crypto_currency}-USD/buy`
};
request(options, function (error, response, body) {
  if (error) throw new Error(error);
  body = JSON.parse(body);
  //session.send(`1 ${crypto_currency} = ${body.amount} ${body.to[0].quotecurrency}`);
  obj[crypto_currency.trim().toLowerCase()] = parseInt(body.data.amount);
  //Currency is in USD
  // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
});
}

function updatePrevPrice(crypto_currency, obj){
	var options = {method: 'GET',
  url: 'https://min-api.cryptocompare.com/data/pricehistorical',
  qs: { fsym: crypto_currency.toUpperCase(), tsyms: 'USD' }
};
request(options, function (error, response, body) {
  if (error) throw new Error(error);
  body = JSON.parse(body);
  //session.send(`1 ${crypto_currency} = ${body.amount} ${body.to[0].quotecurrency}`);
  obj[crypto_currency.trim().toLowerCase()] = parseInt(body[crypto_currency.toUpperCase()].USD);
  //Currency is in USD
  // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
});
}

function getPrice(crypto_currency, user_currency, session) {
var ret = -1;
var options = {method: 'GET',
  url: `https://api.coinbase.com/v2/prices/${crypto_currency}-USD/buy`,
};
request(options, function (error, response, body) {
  if (error) throw new Error(error);
  body = JSON.parse(body);
  var options = { method: 'GET',
    url: 'https://xecdapi.xe.com/v1/convert_to/',
    qs: { to: 'usd', from: user_currency, amount: body.data.amount },
    headers:
     { authorization: 'Basic aGFja3RoZW5vcnRoOTE3OTI3MTMyOmsyNGM5aHFqaW5jdThmZGxtOWdxZjVpNzJr' } };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    //console.log(body);
    body = JSON.parse(body);

    session.send(`1 ${crypto_currency} = ${body.from[0].mid} ${body.from[0].quotecurrency}`);
    // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
  });
});
}


function gPrice(crypto_currency, amount, locale, session) {
var ret = -1;
var options = {method: 'GET',
  url: `https://api.coinbase.com/v2/prices/${crypto_currency}-USD/buy`,
};
request(options, function (error, response, body) {
  if (error) throw new Error(error);
  body = JSON.parse(body);
  var options = { method: 'GET',
    url: 'https://xecdapi.xe.com/v1/convert_to/',
    qs: { to: 'usd', from: locale.toUpperCase(), amount: body.data.amount },
    headers:
     { authorization: 'Basic aGFja3RoZW5vcnRoOTE3OTI3MTMyOmsyNGM5aHFqaW5jdThmZGxtOWdxZjVpNzJr' } };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    //console.log(body);
    body = JSON.parse(body);
     var eth = `ETH: ${amount} = ${(parseInt(body.from[0].mid)*amount).toString()} ${body.from[0].quotecurrency}`
    session.send(eth.toString());
    // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
  });
});
}


// Example:get_price('ETH', 'GBP');
// Example: get_price('LTC', 'INR');

module.exports = {
  getPriceFunc: getPrice,
  updateAppPriceFunc: updateAppPrice,
  updatePrevPriceFunc: updatePrevPrice,
  gprice: gPrice
};
