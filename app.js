/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
var Client = require('coinbase').Client;
var restify = require('restify');
var builder = require('botbuilder');
var firebase = require("firebase");
var _ = require("underscore");
var coinbase = require('./coinbase.js');
var news = require('./helpers/getnews.js');
var client;

var config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

firebase.initializeApp(config);

var COINBASE_ACCESS_TOKEN = '';
var COINBASE_REFRESH_TOKEN = '';
var COINBASE_EXPIRY_TIME = 0;

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

// Listen to returning of Code from OAuth call
server.post('/api/code', codeToToken);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    //session.send("You said(AY): %s", session.message.text);
    var msg = session.message.text;
    if(msg == "a"){
        var card = coinbase.requestCoinbaseOAuthAccess(session);
        var message = new builder.Message(session).addAttachment(card);
        session.send(message);
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

function codeToToken (req, res, next){
    var options = {
        METHOD : 'POST',
        grant_type : 'authorization_code',
        code : req.query.code,
        client_id : process.env.COINBASE_CLIENT_ID,
        client_secret : process.env.COINBASE_CLIENT_SECRET,
        redirect_url : "https://www.cryptsie.com/"
    }
    request(options, "https://api.coinbase.com/oauth/token", function(error, response, body){
        COINBASE_ACCESS_TOKEN = body.access_token;
        COINBASE_EXPIRY_TIME = body.expires_in;
        COINBASE_REFRESH_TOKEN = body.refresh_token;
        client = new Client({'accessToken': COINBASE_ACCESS_TOKEN, 'refreshToken': COINBASE_REFRESH_TOKEN});
    });
};
