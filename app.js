/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
var Client = require('coinbase').Client;
var client;

var restify = require('restify');
var builder = require('botbuilder');
var firebase = require("firebase");
var pricetools = require('./helpers/getprices.js');
var coinbase = require('./coinbase.js');
var request = require('request');
var bodyParser = require('body-parser');
var express = require('express');
var _ = require("underscore");
var news = require('./helpers/getnews.js');
//Setup Firebase
var firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

firebase.initializeApp(firebaseConfig);
var defaultDatabase = firebase.database(); //Initialize firebase database
var dbRef = defaultDatabase.ref();
//var firebaseURL = 'https://bitbot-a45b9.firebaseio.com/.json?print=pretty';


var COINBASE_ACCESS_TOKEN = '';
var COINBASE_REFRESH_TOKEN = '';
var COINBASE_EXPIRY_TIME = 0;

function giveFirebaseURL(path){
  return 'https://bitbot-a45b9.firebaseio.com/' + path + '.json';
}

/////*** Global server variables [START]
let oneDay = 24*3600*1000; //Milliseconds a day
let thirtyMin = 3600*1000/2; //Thirty mins
var currentTime = Date.now();
var updateTime = currentTime + thirtyMin;
var prices = {
  eth: 0,
  btc: 0,
  ltc: 0
}
var updatedToday = false;
////*** Global server variables [END]

//////-------------

////**** Update Daily time settings [START]
setInterval(function(){
             currentTime = Date.now();
             updateTime = currentTime + thirtyMin;
             //Everything should be updated.
             pricetools.updateAppPriceFunc("eth", prices);
             pricetools.updateAppPriceFunc("btc", prices);
             pricetools.updateAppPriceFunc("ltc", prices);

}, oneDay); //Updating time

///**** Update Daily time settings [END]

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

server.use(restify.plugins.queryParser());

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

server.get('/api/test', function (req, res) {
  dbRef.once('value').then((snapshot)=>{
    res.send(snapshot.val().UID.toString());
  });
});

server.get('/global', function (req, res) {
    res.json(prices);
})


// Listen to returning of Code from OAuth call
server.get('/api/code', function (req, res){

  var urlVar = "https://api.coinbase.com/oauth/token?code=" + req.query.code + "&grant_type=authorization_code" +
        "&client_id=76048590e4cfcd34f3ebd4d3b01f8566447c8dc991f07a74c62e06124e011bed" +
        "&client_secret=dc9024c8e3e5b672f1e3852e4b6d33b16095003b75db0eeab84fcc66879b3e30" +
        "&redirect_uri=https%3A%2F%2Fcryptsie.azurewebsites.net%2Fapi%2Fcoinbase%2Fsuccess"
    var options = {
        url : "https://api.coinbase.com/oauth/token&code=" + req.query.code + "&",
        grant_type : 'authorization_code',
        code : req.query.code,
        client_id : "76048590e4cfcd34f3ebd4d3b01f8566447c8dc991f07a74c62e06124e011bed",
        client_secret : "dc9024c8e3e5b672f1e3852e4b6d33b16095003b75db0eeab84fcc66879b3e30",
        redirect_uri : "https://cryptsie.azurewebsites.net/api/coinbase/success/"
    }

    var options2 = {
      url: urlVar,
      method: "POST",
      json: true
    }

    //res.send(urlVar);

    request(options2, function(error, response, body){
        if(error) res.json(error);
        if(body) res.json(body);
        COINBASE_ACCESS_TOKEN = body.access_token;
        COINBASE_EXPIRY_TIME = body.expires_in;
        COINBASE_REFRESH_TOKEN = body.refresh_token;
        client = new Client({'accessToken': COINBASE_ACCESS_TOKEN, 'refreshToken': COINBASE_REFRESH_TOKEN});

    });
});


server.get('/api/coinbase/success', function(req, res){
    res.send("SUCCESS");
});


server.get('/api/test/2', function(req, res){
    res.send(req.query.code.toString());
});


// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    //session.send("You said(AY): %s", session.message.text);
    var msg = session.message.text;
    msg = session.message.text.trim().toLowerCase();
    if(msg == "c"){
        session.send("Yo");
    }
    else if(msg == "a"){
        var card = coinbase.requestCoinbaseOAuthAccess(session);
        var message = new builder.Message(session).addAttachment(card);
        session.send(message);
    } else if(msg == "!eth"){
    	pricetools.getPriceFunc('ETH', 'USD', session);
    } else if(msg == "!btc"){
      pricetools.getPriceFunc('BTC', 'USD', session);
    } else if(msg == "!ltc"){
      pricetools.getPriceFunc('LTC', 'USD', session);
    } else if(msg == "b"){
        client.getAccounts({}, function(err, accounts) {
            accounts.forEach(function(acct) {
             session.send('my bal: ' + acct.balance.amount + ' for ' + acct.name);
            });
        });
    }
    else if (msg == "news") {
      var holdings = ["Bitcoin", "Ethereum", "Litecoin"];
      _.each(holdings, function(holding) {
        news.getNewsFunc(holding, 3, function(news_data){
          var send_message = "Latest news regarding "+holding+":-\n";
          _.each(news_data, function(a_news) {
            send_message += "\n"+a_news.title + " ("+a_news.source+")";
          });
          session.send(send_message);
        });
      });
    }
});

server.get('/api/test3', function (req, res) {
    dbRef.on("value", function(snapshot){
        res.send(snapshot.val().Users.fakeUID.Currencies);
    }, function(error){
        res.send("Error : " + error.code);
    })
});
