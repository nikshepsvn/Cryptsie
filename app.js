/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
var Client = require('coinbase').Client;
var client;
var restify = require('restify');
var builder = require('botbuilder');
var firebase = require("firebase");

var config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

var coinbase = require('./coinbase.js');
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
server.get('/api/code', codeToToken);

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
});

function codeToToken (req, res){
    var options = {
        METHOD : 'POST',
        url : "https://api.coinbase.com/oauth/token",
        grant_type : 'authorization_code',
        code : req.query.code,
        client_id : "76048590e4cfcd34f3ebd4d3b01f8566447c8dc991f07a74c62e06124e011bed",
        client_secret : "dc9024c8e3e5b672f1e3852e4b6d33b16095003b75db0eeab84fcc66879b3e30",
        redirect_url : "https://www.cryptsie.com/"
    }
    request(options, function(error, response, body){
        COINBASE_ACCESS_TOKEN = body.access_token;
        COINBASE_EXPIRY_TIME = body.expires_in;
        COINBASE_REFRESH_TOKEN = body.refresh_token;
        client = new Client({'accessToken': COINBASE_ACCESS_TOKEN, 'refreshToken': COINBASE_REFRESH_TOKEN});
        res.send(response.toString());
    });
};


