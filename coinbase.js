var builder = require('botbuilder');

function requestCoinbaseOAuthAccess(session){
    var CLIENTID = `76048590e4cfcd34f3ebd4d3b01f8566447c8dc991f07a74c62e06124e011bed`;
    var SCOPE = `wallet:accounts:read&
                 wallet:addresses:read&
                 wallet:buys:read&
                 wallet:buys:create&
                 wallet:checkouts:read&
                 wallet:deposits:read&
                 wallet:deposits:create&
                 wallet:orders:create&
                 wallet:payment-methods:read&
                 wallet:payment-methods:limits&
                 wallet:sells:read&
                 wallet:sells:create&
                 wallet:transactions:read&
                 wallet:transactions:send&
                 wallet:transactions:transfer&
                 wallet:user:email&
                 wallet:withdrawals:read`;  
    return createSigninCard(session, `https://google.com`)
}

function createSigninCard(session, URL) {
    return new builder.SigninCard(session)
        .text('BotFramework Sign-in Card')
        .button('Sign-in', URL)
}

module.exports = {
    requestCoinbaseOAuthAccess: requestCoinbaseOAuthAccess,
    createSigninCard : createSigninCard
}