/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var firebase = require("firebase");
var pricetools = require('./helpers/getprices.js');

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
var lastETHPrice = 0;
var lastBTCPrice = 0;
var lastLTCPrice = 0;
////*** Global server variables [END]

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

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot.
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    //session.send("You said(AY): %s", session.message.text);
    var msg = session.message.text;
   	//session.send(test(msg));
   session.send("Hi");
   //session.send(pricetools.getPriceFunc("ETH", "GBP"));
});


function updateCurrentTime(){
	currentTime = Date.now();
}

function updateNextTime(){
	updateTime = currentTime + thirtyMin;
}


