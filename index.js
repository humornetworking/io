var express    = require('express');      
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var async = require('async'); 
var jwt = require('jsonwebtoken'); //lavidabellaentodassusformas
var WebSocketServer = require('ws').Server;
var fs = require("fs")
var cookieParser = require('cookie-parser');
passport = require('passport');
FacebookStrategy = require('passport-facebook').Strategy;
var redis   = require("redis");
var session = require('express-session');
var jwt        = require("jsonwebtoken");
var secret = "lavidalibre"
var bitcore = require("bitcore-lib")
bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;

// Login

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new FacebookStrategy({
    clientID: "832861053471099",
    clientSecret: "91d269205409383d34d53429b441eaa7",
    callbackURL: "http://myway.network:8080/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      return done(null, profile);
    });
  }
));


//var bitcore = require('bitcore');

//var URLSERVER = "http://localhost:8080"
var URLSERVER = "http://104.251.213.18:8080"

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

//MongoDB
//var url = "mongodb://localhost:27017/";
var url = "mongodb://andres:unodos3@ds047612.mongolab.com:47612/explguru"

//MailGun
var mailgun = require("mailgun-js")({apiKey: 'key-219426aefec7c90432a505766e1888bf', domain: 'sandbox2576ebf851d144449cdb3023f5b14267.mailgun.org'});

//REST client ...
var Client = require('node-rest-client').Client;
var client = new Client();

//Express
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
var port = process.env.PORT || 8080
app.listen(port);
console.log('Magic happens ');



app.post('/setUserName', ensureAuthorized, function(req, res){
	var author = req.body.author
	console.log("AUTHOR 2 :"+ author)
	
	var user = getUserFromToken(req)
	
	console.log("USER 2 :"+ user)
	
				var newUser = {'author': author,'id' : user.id,  'keys' : {} };
				MongoClient.connect(url, function(err, db) {
				  if (err) throw err;
				  var dbo = db.db("explguru");
				  dbo.collection("user").insertOne(newUser, function(err, res) {
					if (err) throw err;
					
					db.close();
					
					
				  });
				});
				
				var user = getUserFromToken(req)
			    var token = jwt.sign({"author": author, "id" : user.id ,"displayName" : user.displayName}, secret, {
                                expiresIn: '24h'// expires in 24 hours
                });
				
				res.send({"token" : token})
			
});

app.post('/search', function(req, res){
	var txt = ".*"+ req.body.search.toLowerCase() +"*";
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("message").find({"txt" : {$regex : txt},"root" : 1}).toArray(function(err, messages) {
		res.send(messages);
	  });
	});
			
});

app.get('/get-books', function(req, res){
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("message").find({'root' : 1}).toArray(function(err, messages) {
		res.send(messages);
	  });
	});
			
});


app.get('/get-chapters/:id', function(req, res){
	var idBook = req.params.id
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("matrix").find({"root" : idBook}).toArray(function(err, edges) {
		

		var s = new Set();  

		var arrayLength = edges.length;
		for (var i = 0; i < arrayLength; i++) {
			
			if(edges[i].root != ''){
				s.add(ObjectId(edges[i].root));
			}

			if(edges[i].to != ''){
				s.add(ObjectId(edges[i].to));
			}
			
			if(edges[i].from != ''){
				s.add(ObjectId(edges[i].from));
			}
		}
		
		let nodes = [];
		s.forEach(v => nodes.push(v));
		
		dbo.collection("message").find({"_id" : {$in : nodes} }).toArray(function(err, messages) {
			
			var chapters = {
				"nodes" : messages,
				"edges" : edges
			}
			
			var nNodes = [];
			for (var i = 0; i < messages.length; i++) {
				//nNodes.push({ 'id': messages[i]._id, 'image' : URLSERVER +'/img/'+ messages[i].image, 'shape': 'image'})
				
				if (messages[i]._id == idBook) {
					nNodes.push({ 'id': messages[i]._id, 'image' : URLSERVER +'/img/'+ messages[i].image, 'x' :-250, 'y' : -600})
				} else {
					nNodes.push({ 'id': messages[i]._id, 'image' : URLSERVER +'/img/'+ messages[i].image, 'x' : messages[i].x, 'y':messages[i].y})
				}
				
				
			}
			
			
			var nEdges = [];
			for (var i = 0; i < edges.length; i++) {

				nEdges.push({ 'from': edges[i].from, 'to': edges[i].to, 'length':300, arrows:{middle:{scaleFactor:0.5},to:true}})
			}
			
			var chapters = {
				"nodes" : nNodes,
				"edges" : nEdges
			}
			
			res.send(chapters);
			
		});

	  });
	});
			
});

app.post('/register', function(req, res){
	var obj = {};
	var author = req.body.author;
	var mail = req.body.mail;
	var password = req.body.password;
				
				//Get new keys for each chain
			 var that = this;
			 var saveUser = function(req, res, author, mail, passsword) {
			 
			  async.parallel([
				/*
				 * First external endpoint
				 */
				function(callback) {
									client.post("https://api.blockcypher.com/v1/eth/main/addrs", {}, function (data, response) {
										callback(false, data);

									});
				},
				/*
				 * Second external endpoint
				 */
				function(callback) {
									client.post("https://api.blockcypher.com/v1/dash/main/addrs", {}, function (data, response) {
										callback(false, data);

									});
				},
			  ],
			  /*
			   * Collate results
			   */
			  function(err, results) {
				if(err) { console.log(err); res.send(500,"Server Error"); return; }
				var keys = {"eth":results[0], "btc":results[1]};
				
				
				var newUser = {'author': author,'mail' : mail, 'hash' : password, 'keys' : keys };
				MongoClient.connect(url, function(err, db) {
				  if (err) throw err;
				  var dbo = db.db("explguru");
				  dbo.collection("user").insertOne(newUser, function(err, res) {
					if (err) throw err;
					
					db.close();
					var pruneUser = {'author': author,'mail' : mail};
					var token = jwt.sign(pruneUser, "lavidabellaentodassusformas", {
					});
					
					//NO funciona ????? WHY, res viene con menos metodos
					//res.send({'token' : token});
					
				  });
				});
				
			  }
			  )

			 };
				
				
			saveUser(req, res, author, mail, password);
				
	
	res.send({"token" :"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRob3IiOiJhbmRycyJ9.1cSuE-00MnvUjfooBV0dE77zPZu_GfRkJf1JBXWMowQ"})
});

app.post('/write-chap', ensureAuthorized, function(req, res){
	
	
	var obj = {};
	var user = getUserFromToken(req)
	var txt = req.body.texto.substring(0, 100);
	var root = req.body.root
	var image = req.body.image
	var x = req.body.x
	var y = req.body.y
	
	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	
	
	fs.writeFile('public/img/'+imgName, buf, function(err) { console.log(err) });
	
	
	 			MongoClient.connect(url, function(err, db) {
				var dbo = db.db("explguru");
					
					async.seq(


						function(callback) {
							
								var newMessage = {'txid': '123','author' : user.author, 'txt' : txt, 'image' : imgName, 'timestamp' : Date.now(), 'x' : Number(x),'y' : Number(y), 'root' : 0};
								dbo.collection("message").insertOne(newMessage, function(err, res) {
											if (err) throw err;					
											//pointto = res.insertedId.toString()
											newMessage["id"] = res.insertedId.toString()
											callback(null,newMessage);
											
								});

						},
						function(newMessage,callback) {
							
										var row = {'root': root,'to' : '', 'from' : newMessage.id, 'metadata' :  {"coordinates" : {
																															"x" : 0,
																															"y" : 0
																														}
																												 }};

										  dbo.collection("matrix").insertOne(row, function(err, res) {
											if (err) throw err;					
											db.close();
											
											callback(newMessage, null);
										  });
							
						}
					)(function(newMessage, err) {
						res.send({"data" : newMessage})
					});
	
				});
	
	
	
	
});	


app.post('/write-link', function(req, res){
	
	
	var obj = {};
	var author = "Andrs"//user.author;
	//var bigAuthor = getAuthor(author);
	
	var txt = req.body.texto.substring(0, 100);
	var chain = req.body.chain;
	var root = req.body.root
	var from = req.body.from
	var to = req.body.to

	
	var ahora = Date.now()	
	
	
	    var txid = "321";

			
				var that = this
 				MongoClient.connect(url, function(err, db) {
				var dbo = db.db("explguru");
					async.seq(

						function(callback) {
							
										var row = {'root': root,'to' : to, 'from' : from, 'metadata' :  {"coordinates" : {
																															"x" : 0,
																															"y" : 0
																														}
																												 }};

										  dbo.collection("matrix").insertOne(row, function(err, res) {
											if (err) throw err;					
											db.close();
											
											callback(null, null);
										  });
							
						}
					)(function(err, data) {
						res.send(req.body);
					});
					

			});			

			
	
});


app.post('/write-root', ensureAuthorized, function(req, res){
	
	
	var obj = {};
	var author = "andrs"//user.author;
	var bigAuthor = {
    "_id" : ObjectId("5b0c227ce8bf8628187be2e1"),
    "author" : "andrs",
    "mail" : "andres.vasquez.perez@gmail.com",
    "hash" : "123",
    "keys" : {
        "eth" : {
            "private" : "c9fa24ca7d69b04f8adf57ee80bd581169fd0783986f292cbc984596a5f4b8ba",
            "public" : "04beb6e7f216e8430cf1a92792b4a4ad438c2403460bddc78c2729bf62364ee1b8f1ef2c20f021d47bb309ad115564c0a67db83ce8962c4b80c75d6af4ead020df",
            "address" : "e9ee047b55b694bca67f0dd842a747f79c284683"
        },
        "btc" : {
            "private" : "2e7681e14a829b17d8914bfa45e7262c4bf6e087a0d2bf0a44f06631d85daf23",
            "public" : "026ae39c3a1700a21c85e217ea207312393c764eefc34fefbf80e46fb660664c14",
            "address" : "XpSFMofX5iMmfrUfzxJACpgTPCGTJ327BU",
            "wif" : "XCqx59cijPA59dLgSehPVBjRUPprDWBaS6Hj3wqxieztCa5MgGNL"
        }
    }
};//getAuthor(author); Proiblemas con las asyncronia
	var user = getUserFromToken(req)
	var txt = req.body.texto.substring(0, 100);
	var chain = req.body.chain;
	var ahora = Date.now()	
	var image = req.body.image

	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	fs.writeFile('public/img/'+imgName, buf, function(err) { console.log(err) });
		
		        var newMessage = {'txid': '321','author' : user.author, 'txt' : txt, 'image' : imgName, 'timestamp' : ahora,'x' : 0, 'y': 0, 'root' : 1};
				//data.push(newBook); // Save to the DB
				MongoClient.connect(url, function(err, db) {
				  if (err) throw err;
				  var dbo = db.db("explguru");
				  dbo.collection("message").insertOne(newMessage, function(err, res) {
					if (err) throw err;		
					 var id = res.insertedId.toString();
					 var row = {'root': id,'to' : '', 'from' : '', 'metadata' :  {"coordinates" : {
																										"x" : 0,
																										"y" : 0
																									}
																						     }};
					  dbo.collection("matrix").insertOne(row, function(err, res) {
						if (err) throw err;					
						db.close();
					  });
					
					
				  });
				  
				  
				  
				});
			

		

	//return the new list of posts
	res.send(req.body);
});

	
app.post('/checkPayment', function(req, res){
	
	var texto = req.body.texto;
	//Addres para recivir los pagos,Get thee addres from the DB
		var privKey = "5629a28efeb21585d9bdd406d6d3337faadd8d1f8eba8d689decce6ca2301a44"
		var pubKey = "0377cd7a0b46e2e0d47a1b16675297b4f18f8d7d893887e779b42f143505fa4d0a"
		var address = "mrwZvPf4KF2vNCrHPrucZoSvo33Ywfg6kn"

    //Check the payment ....

	
	//Oficial MYWAY account
		var myWayPrivate = "724f21aacd9730973379f43e9c60a8b0cf1da56d62e2a6dccf3ca3327ca0dadf"
		var myWayPublic = "0204d3e6cbeb0d159445871db7888714431b2c608cbe054d1fc8a1a115d942693d"
		var myWayAddress = "n28H16SyNnGAkpU5wudJJW9iNpoFg69kf1"
		
		//Once checked, get UTXO index & script
		var txId = "1d29c28fba1e2d1d8677045779ae92ce7af1ba38cf7a47ec5c8740ea562eb014"
		var outputIndex = 1
		var script = "76a914e210b0cec61767d72e223812a16d19875fa3ddce88ac" // ??? Realmente va
	
	var privateKey = new bitcore.PrivateKey(myWayPrivate);
	var utxo = {
	  "txId" : txId,
	  "outputIndex" : outputIndex,
	  "address" : myWayAddress,
	  "script" : script,
	  "satoshis" : 50000
	};

var transaction = new bitcore.Transaction()
    .from(utxo)
    .addData(texto) // Add OP_RETURN data
    .sign(privateKey);
	
	//Pasos, send a small amount a la nueva direccion
	//Ocupar el UTXO de la nueva direccion para agregar el texto 
	
//Broadcast this transaction
console.log("Broadcast !"+ texto);
console.log(transaction);
	
})


app.get('/checkSession', function(req, res) {
  console.log("Session :"+ req.sessionID)
  if (req.sessionID !== 'undefined' && req.sessionID != null)
	res.send("OK");
  else
	res.send("NOK");
});


app.get('/policy', function(req, res) {
     res.redirect('policy.html');
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});


app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login.html' }),
  function(req, res) {
    res.redirect('/account');
});

app.get('/account',  function(req, res) {
  
  //console.log(req.user); 
  
  //Check if exists in the DB, donde tendra almacenado su historial, preferencias e storias
  var token = jwt.sign({"id" : req.user.id +"fb" ,"displayName" : req.user.displayName}, secret, {
                                expiresIn: '24h' // expires in 24 hours
                            });
  
  console.log("TOKEN 1 :"+ token)
	
  //find in the DB if the user exist if not got to account, if it exist index and show username
  res.redirect('account.html?token=' + token);
});



function getAuthor(author) {
	
			var that = this;
			  async.parallel([
				/*
				 * First external endpoint
				 */
				function(callback) {
					
					
						 MongoClient.connect(url, function(err, db) {
							  if (err) throw err;
							  var dbo = db.db("explguru");
							  dbo.collection("user").find({'author': author}).toArray(function(err, messages) {
								callback(false, messages);
							  });
							});
											

				}
			  ],
			  /*
			   * Collate results
			   */
			  function(err, results) {
				  
				  if(err) { console.log(err); res.send(500,"Server Error"); return; }
				  
				  return results[0];
				
			  }
			  )
	
}	


function decodeBase64Image(dataString) {
	  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
		response = {};

	  if (matches.length !== 3) {
		return new Error('Invalid input string');
	  }

	  response.type = matches[1];
	  response.data = new Buffer(matches[2], 'base64');

	  return response;
	}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('login.html');
}

function ensureAuthorized(req, res, next) {

        var bearerToken;
        var bearerHeader = req.headers["authorization"];
		console.log("TOKEN AUTH :"+ bearerHeader)
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];

            // verifies secret and checks exp
            jwt.verify(bearerToken, secret, function (err, decoded) {
                if (err) {
                    //return res.json({ success: false, message: 'Failed to authenticate token.' });
                    res.send(403);
                } else {
                    // if everything is good, save to request for use in other routes
                    req.token = bearerToken;
                    next();
                }
            });


        } else {
            res.send(403);
        }
    }

    function getUserFromToken(req) {

        var bearerHeader = req.headers["authorization"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            var bearerToken = bearer[1];

            var user = jwt.decode(bearerToken, secret);
            return user;
        } else {
            return null;
        }

    }
