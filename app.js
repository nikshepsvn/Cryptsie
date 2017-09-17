/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var firebase = require("firebase");
var pricetools = require('./helpers/getprices.js');
var coinbase = require('./coinbase.js');

//Setup Firebase
var firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};
firebase.initializeApp(firebaseConfig);
var defaultDatabase = firebase.database(); //Initialize firebase database


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

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

server.get('/api/rest', function (req, res) {
  res.send("hey)");
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
    }
});
