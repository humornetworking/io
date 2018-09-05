var express    = require('express');      
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var async = require('async'); 
var jwt = require('jsonwebtoken'); //lavidabellaentodassusformas
var WebSocketServer = require('ws').Server;
var fs = require("fs")
var cookieParser = require('cookie-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var session = require('express-session');
var jwt        = require("jsonwebtoken");
var bitcore = require("bitcore-lib")
var ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'}) // leaving out the arguments will default to these values
var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001')
var exec = require('child_process').exec;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mailgun = require("mailgun-js")({apiKey: 'key-219426aefec7c90432a505766e1888bf', domain: 'sandbox2576ebf851d144449cdb3023f5b14267.mailgun.org'});
var Rest = require('node-rest-client').Client;
var restClient = new Rest();

var setup = require('./setup'); 
var util = require('./util')(app, jwt, MongoClient, setup, fs, exec, ipfs)

//Setup
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;
var URLSERVER = setup.url_server;
var path=setup.path;
var datadir = setup.datadir;
var secret = setup.secret;
var urlDB = setup.database;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
	res.setHeader('Access-Control-Allow-Methods', '*');
	res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
	res.setHeader('Access-Control-Max-Age', '1000');
  next();
});
app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

  app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: false,
    resave: false
})); 

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));
var port = process.env.PORT || 80
app.listen(port);
console.log('IOIO is up');

//Passport setup
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new FacebookStrategy({
    clientID: "832861053471099",
    clientSecret: "91d269205409383d34d53429b441eaa7",
    callbackURL: "http://ioio.cl/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      return done(null, profile);
    });
  }
));

passport.use(new TwitterStrategy({
    consumerKey: "pO591S3sBKNYvXmM2rSmNA",
    consumerSecret: "5QtAZMVL24KMG0yR3X03Faex1Mp5LhWQwguWDEXMqVY",
    callbackURL: "http://ioio.cl/auth/twitter/callback"
  },       
  function(token, tokenSecret, profile, cb) {
    console.log("ID :"+ profile.id)
	return cb(null, profile);
  } 
));

//REST API
require('./rest.js')(app, jwt, MongoClient, util, setup, passport, fs, async, restClient, bitcore, ObjectId, exec, ipfs);


//Loop checking pending transactions
setInterval(function(){ 
	
	
	MongoClient.connect(urlDB, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("payment").find({}).toArray(function(err, payment) {
		for (i = 0; i < payment.length; i++) { 
		      var pay = payment[i]
		      console.log("Chequeando :"+ payment[i].balance +" -- "+  payment[i].address)
			  var apiUrl = "https://api.blockcypher.com/v1/btc/test3/addrs/"+ payment[i].address;
			  async.parallel([

				function(callback) {
									restClient.get(apiUrl, function (data, response) {
										
										var status = "NOK"
										console.log("PAYMENT "+JSON.stringify(payment))
										var balance = pay.balance
										if(Number(data.unconfirmed_balance) > Number(balance)) {
											status = "OK"
										}
										var result = {"status": status , "id" : pay.id, "idnode" : pay.idnode,'idimage' : pay.idimage, "author" : pay.author, "address" : pay.address}
										callback(false, result);

									});
				}
			  ],
				  function(err, results) {
					if(err) { console.log(err); return; }
					console.log("PAGO OK ? :"+ JSON.stringify(results[0]))
					if (results[0].status == "OK") {
						
						console.log("Eliminando el payment ID !"+ results[0].id)
						dbo.collection("payment").deleteOne({"id" : results[0].id});
						var trx = util.tokenizeStory(results[0].author, results[0].address, results[0].idnode,results[0].idimage)
						
						
						var myquery = { 'id' : results[0].idnode };
						var newvalues = { $set: { 'proof': trx } };
						dbo.collection("message").updateOne(myquery, newvalues, function(err, res) {
							if (err) throw err;
							console.log("Nodo actualizado");
							db.close();
							
						});
					}
					
				  }
			  )

			
		}
		
		
		
	  })
	})	  
	

 }, 20000);	

 
 