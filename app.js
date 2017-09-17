/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/
var Client = require('coinbase').Client;

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
var oneDay = 24*3600*1000; //Milliseconds a day
var thirtyMin = 3600*1000/2; //Thirty mins
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
           //  updateFirebase('ETH', 'USD', session);
           //  updateFirebase('BTC', 'USD', session);
            // updateFirebase('LTC', 'USD', session);

}, oneDay); //Updating time

  updateFirebase('ETH', 'USD', session);
  updateFirebase('BTC', 'USD', session);
             updateFirebase('LTC', 'USD', session);

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

  var baseURL = "https://api.coinbase.com/oauth/token";
  var urlVar = "https://api.coinbase.com/oauth/token?grant_type=authorization_code&code=" + req.query.code +
        "&client_id=76048590e4cfcd34f3ebd4d3b01f8566447c8dc991f07a74c62e06124e011bed" +
        "&client_secret=dc9024c8e3e5b672f1e3852e4b6d33b16095003b75db0eeab84fcc66879b3e30" +
        "&redirect_uri=https%3A%2F%2Fcryptsie.azurewebsites.net%2Fapi%2Fcode"
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
        COINBASE_ACCESS_TOKEN = body.access_token;
        COINBASE_EXPIRY_TIME = body.expires_in;
        COINBASE_REFRESH_TOKEN = body.refresh_token;
        


        var obj = {
          access: COINBASE_ACCESS_TOKEN,
          refresh: COINBASE_REFRESH_TOKEN,
          expiry: COINBASE_EXPIRY_TIME
          }
          pushTokens(obj.access, obj.refresh);
          //listAccounts(obj.access, obj.refresh);
          res.json(obj);

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
         dbRef.on("value", function(snapshot){
        res.send(snapshot.val().Currencies);
         }, function(error){
          res.send("Error : " + error.code);
       });
      
    }
    else if (msg == "!news") {
      var holdings = ["Bitcoin", "Ethereum", "Litecoin"];
      _.each(holdings, function(holding) {
        news.getNewsFunc(holding, 3, function(news_data){
          var send_message = "Latest news regarding "+holding+":-\n";
          _.each(news_data, function(a_news) {
            send_message += "\n\n"+a_news.title + " ("+a_news.source+")";
          });
          session.send(send_message);
        });
      });
    }
});

server.get('/api/test3', function (req, res) {
    dbRef.on("value", function(snapshot){
        res.send(snapshot.val().Currencies);
    }, function(error){
        res.send("Error : " + error.code);
    });
});

server.get('/api/tokens', function(req, res){
  var obj = {
     access: COINBASE_ACCESS_TOKEN,
     refrsh: COINBASE_REFRESH_TOKEN,
     expiry: COINBASE_EXPIRY_TIME
  }
  res.json(obj);
});

server.get('/check/client', function(req, res) {
  if(client == null) res.send("NULL PTR");
  else res.send("NOT NULL PTR");
});

server.get('/check/prices', function(req, res){
  res.json(prices);
});


function pushTokens(access, refresh){
    var obj = {
    'accessToken': access,
    'refreshToken': refresh
    };

    dbRef.update({
      "accessToken": access,
      "refreshToken": refresh
    });
    return;

}

function listAccounts(access, refresh){
  var obj = {
    'accessToken': access,
    'refreshToken': refresh
  }

  var client = new Client({'accessToken': COINBASE_ACCESS_TOKEN, 'refreshToken': COINBASE_REFRESH_TOKEN});
  client.getAccounts({}, function(err, accounts) {
          session.send(typeof accounts);
            accounts.forEach(function(acct) {
             session.send('my bal: ' + acct.balance.amount + ' for ' + acct.name);
            });
        });
}



function checkForSpike(){
    
        var currentPrice = {
            btc: 0,
            eth: 0,
            ltc: 0
        };
    
        var prevDayPrice = {
            btc: 0,
            eth: 0,
            ltc: 0
        };
    
        pricetools.updateAppPriceFunc("btc", currentPrice);
        pricetools.updateAppPriceFunc("eth", currentPrice);
        pricetools.updateAppPriceFunc("ltc", currentPrice);
        
        pricetools.updatePrevPriceFunc("btc", prevDayPrice);
        pricetools.updatePrevPriceFunc("eth", prevDayPrice);
        pricetools.updatePrevPriceFunc("ltc", prevDayPrice);
        
        setTimeout(function(){    
            var BTCcurrentprice = currentPrice.btc;
            var ETHcurrentprice = currentPrice.eth;
            var LTCcurrentprice = currentPrice.ltc;
            
            var BTCprevdayprice = prevDayPrice.btc;
            var ETHprevdayprice = prevDayPrice.eth;
            var LTCprevdayprice = prevDayPrice.ltc;
        
            var BTCdaychange = (BTCcurrentprice-BTCprevdayprice)/BTCprevdayprice;
            var ETHdaychange = (ETHcurrentprice-ETHprevdayprice)/ETHprevdayprice;
            var LTCdaychange = (LTCcurrentprice-LTCprevdayprice)/LTCprevdayprice;
            
            if(Math.abs(BTCdaychange)>0.05){
               session.send(`BTC PRICE SPIKE DETECTED, Change of ${BTCdaychange*100} in the past day`);
            }
            if(Math.abs(ETHdaychange)>0.05){
               session.send(`ETH PRICE SPIKE DETECTED, Change of ${ETHdaychange*100} in the past day`);
            }
            if(Math.abs(LTCdaychange)>0.05){
                session.send(`LTC PRICE SPIKE DETECTED, Change of ${LTCdaychange*100} in the past day`);
            }
        }, 5000);
    }
    

var networthcounter = 0;



setInterval(function(){
                  var netWorth = getNetworthFromCoinbase();
                  dbRef.set({
                     networthcounter: {
                        worth : netWorth
                   }
                });
              ++networthcounter;
}, 3600);


setInterval(function(){
    
        var currentPrice = {
            btc: 0,
            eth: 0,
            ltc: 0
        };
    
        var prevDayPrice = {
            btc: 0,
            eth: 0,
            ltc: 0
        };
    
        pricetools.updateAppPriceFunc("btc", currentPrice);
        pricetools.updateAppPriceFunc("eth", currentPrice);
        pricetools.updateAppPriceFunc("ltc", currentPrice);
        
        pricetools.updatePrevPriceFunc("btc", prevDayPrice);
        pricetools.updatePrevPriceFunc("eth", prevDayPrice);
        pricetools.updatePrevPriceFunc("ltc", prevDayPrice);
        
        setTimeout(function(){    
            var BTCcurrentprice = currentPrice.btc;
            var ETHcurrentprice = currentPrice.eth;
            var LTCcurrentprice = currentPrice.ltc;
            
            var BTCprevdayprice = prevDayPrice.btc;
            var ETHprevdayprice = prevDayPrice.eth;
            var LTCprevdayprice = prevDayPrice.ltc;
        
            var BTCdaychange = (BTCcurrentprice-BTCprevdayprice)/BTCprevdayprice;
            var ETHdaychange = (ETHcurrentprice-ETHprevdayprice)/ETHprevdayprice;
            var LTCdaychange = (LTCcurrentprice-LTCprevdayprice)/LTCprevdayprice;
            
            if(Math.abs(BTCdaychange)>0.05){
               session.send(`BTC PRICE SPIKE DETECTED, Change of ${BTCdaychange*100} in the past day`);
            }
            if(Math.abs(ETHdaychange)>0.05){
               session.send(`ETH PRICE SPIKE DETECTED, Change of ${ETHdaychange*100} in the past day`);
            }
            if(Math.abs(LTCdaychange)>0.05){
                session.send(`LTC PRICE SPIKE DETECTED, Change of ${LTCdaychange*100} in the past day`);
            }
        }, 5000);
    }
    , 1800);




function updateFirebase(crypto_currency, user_currency, session) {
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
    //console.log(body);
    body = JSON.parse(body);
    session.send(`1 ${crypto_currency} = ${body.amount} ${body.to[0].quotecurrency}`);
    // Use body to do whatever stuff (return from function or send to user etc...). I'm just logging it for now.
    dbRef.update({
      crypto_currency: body.amount
    });

  });
});
}





