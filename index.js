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

app.get('/getAddressByUser', ensureAuthorized,  function(req, res){
	var user = getUserFromToken(req)
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("user").find({"id" : user.id}).toArray(function(err, user) {
		console.log("USER :"+ JSON.stringify(user))
		res.send({"address": user[0].keys.btc.address});
	  });
	});
	
})


app.post('/updatePositionByBook', function(req, res){

	  var chapters = req.body.chapters
	  console.log(" JSON : "+ JSON.stringify(chapters))
			
	  MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
						
						
						for(var i = 0; i < chapters.length; i++){
							let chapter = chapters[i]
							var myquery = { '_id' : ObjectId(chapter.id) };
							var newvalues = { $set: { 'x': chapter.x, 'y': chapter.y } };
							dbo.collection("message").updateOne(myquery, newvalues, function(err, res) {
								if (err) throw err;
							});
							
						}
						
						db.close();
						

		});

	});
			
app.post('/setUserName', ensureAuthorized, function(req, res){
	var author = req.body.author
	
	var user = getUserFromToken(req)
	
	var randomText = getRandomText();
	var value = Buffer.from(randomText);
	var hash = bitcore.crypto.Hash.sha256(value);
	var bn = bitcore.crypto.BN.fromBuffer(hash);
    var privateKey = new bitcore.PrivateKey(bn).toString();
	var address = new bitcore.PrivateKey(bn).toAddress().toString();
	
		var newUser = {'author': author,'id' : user.id,  'keys' : {"btc" : {
            "private" : privateKey,
            "address" : address
        }}};
				MongoClient.connect(url, function(err, db) {
				  if (err) throw err;
				  var dbo = db.db("explguru");
				  dbo.collection("user").insertOne(newUser, function(err, res) {
					if (err) throw err;
					
					db.close();
					
					
				  });
				});
				
				var user = getUserFromToken(req)
			    var token = jwt.sign({"address": address, "author": author, "id" : user.id ,"displayName" : user.displayName}, secret, {
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
					nNodes.push({ 'id': messages[i]._id, 'image' : URLSERVER +'/img/'+ messages[i].image, 'x' :-250, 'y' : -600, 'proof' : messages[i].proof, 'title' : messages[i].title, 'txt' : messages[i].txt })
				} else {
					nNodes.push({ 'id': messages[i]._id, 'image' : URLSERVER +'/img/'+ messages[i].image, 'x' : messages[i].x, 'y':messages[i].y, 'proof' : messages[i].proof})
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
	
	console.log("USUARIO : "+  JSON.stringify(user))
	
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
							
								var newMessage = {'txid': '123','author' : user.author, 'txt' : txt, 'image' : imgName, 'timestamp' : Date.now(), 'x' : Number(x),'y' : Number(y), 'root' : 0 ,'proof' : ''};
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
	var title = req.body.title

	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	fs.writeFile('public/img/'+imgName, buf, function(err) { console.log(err) });
		
		        var newMessage = {'txid': '321','author' : user.author, 'title': title, 'txt' : txt, 'image' : imgName, 'timestamp' : ahora,'x' : 0, 'y': 0, 'root' : 1,'proof' : ''};
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

	
app.post('/checkPayment', ensureAuthorized , function(req, res){
	
	var texto = req.body.texto
	var idnode = req.body.idNode
	var user = getUserFromToken(req)
	
	
	var apiUrl = "https://api.blockcypher.com/v1/btc/test3/addrs/"+ user.address;
	client.get(apiUrl, function (data, response) {
                console.log("BALANCE :"+ JSON.stringify(data))
				var payment = {'address': user.address,'idnode' : idnode, 'texto' : texto,'author' : user.author, 'id' : user.id,  'balance' : data.balance};
				MongoClient.connect(url, function(err, db) {
				  if (err) throw err;
				  var dbo = db.db("explguru");
				  dbo.collection("payment").insertOne(payment, function(err, res) {
					if (err) throw err;
					
					db.close();
					
					
				  });
				});
	
	
	});
    

	
	//Create function to every 30 sec check payment table
	//Insert into payment table, with user ID
	//Check with the api balance by address
	//If change, register the text update node info with the link & remove item from table
	//Send WS message "success"
	
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
  
  var id = req.user.id +"fb"
  var token = jwt.sign({"id" : req.user.id +"fb" ,"displayName" : req.user.displayName}, secret, {
                                expiresIn: '24h' 
                            });
  	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("user").find({"id" : id}).toArray(function(err, user) {
		if (user.length == 0){
			    var token = jwt.sign({"id" : req.user.id +"fb" ,"displayName" : req.user.displayName}, secret, {
                                expiresIn: '24h' 
                            });
			
			  res.redirect('account.html?token=' + token);
		} else {
				var token = jwt.sign({"address": user[0].keys.btc.address,"author": user[0].author, "id" : user[0].id ,"displayName" : user[0].displayName}, secret, {
                                expiresIn: '24h'
                });
			
			  res.redirect('index.html?token=' + token);
		}
		//res.send(messages);
	  });
	});
  

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
	
function getRandomText() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

app.get('/test',  function(req, res){

    var tx = registerText("Pepe")
	res.send(tx)
	
})

function registerText(texto){

	//Oficial MYWAY account. KEEP SAVE
		var myWayPrivate = "724f21aacd9730973379f43e9c60a8b0cf1da56d62e2a6dccf3ca3327ca0dadf"
		var myWayPublic = "0204d3e6cbeb0d159445871db7888714431b2c608cbe054d1fc8a1a115d942693d"
		var myWayAddress = "n28H16SyNnGAkpU5wudJJW9iNpoFg69kf1"
		
		//Find this by API
		var txId = "14f6df3137c7b2662c12fde9d8128adad02fbd5f2aac6d001358b245aa32abcb"
		var outputIndex = 0
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
	
	var data = {"tx" : transaction.toString()}
	console.log("TRX obj :"+ JSON.stringify(data))
	console.log("TRX :"+ transaction)
	var apiUrl = "https://api.blockcypher.com/v1/bcy/test/txs/push?token=d858e999978944499fcaf6f5408790d0";

	  		  async.parallel([

				function(callback) {
									client.post(apiUrl, data, function (data1, response) {
										
										console.log(JSON.stringify(data1))
										
										callback(false, data1);

									}).on('error', function (err) {
										console.log('something went wrong on the request', err.request.options);
									});
				}
			  ],
				  function(err, results) {
					if(err) { console.log(err); res.send(500,"Server Error"); return; }
					
					return results[0];
					
				  }
			  )
	
	
	
}

//Loop checking pending transactions
setInterval(function(){ 
	
	
	MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("explguru");
	  dbo.collection("payment").find({}).toArray(function(err, payment) {
		for (i = 0; i < payment.length; i++) { 
		      var pay = payment[i]
		      console.log("Chequeando :"+ payment[i].balance +" -- "+  payment[i].address)
			  var apiUrl = "https://api.blockcypher.com/v1/btc/test3/addrs/"+ payment[i].address;
			  async.parallel([

				function(callback) {
									client.get(apiUrl, function (data, response) {
										
										var status = "NOK"
										console.log("PAYMENT "+JSON.stringify(payment))
										var balance = pay.balance
										if(Number(data.balance) > Number(balance)) {
											status = "OK"
										}
										var result = {"status": status , "id" : pay.id, "idnode" : pay.idnode, "texto" : pay.texto, "author" : pay.author}
										callback(false, result);

									});
				}
			  ],
				  function(err, results) {
					if(err) { console.log(err); return; }
					console.log("PAGO OK ? :"+ JSON.stringify(results[0]))
					if (results[0].status == "OK") {
						console.log("Eliminando el payment ID !"+ results[0].id)
						dbo.collection("payment").remove({"id" : results[0].id});
						var trx = registerText(results[0].author + " dice : "+ results[0].texto)
						console.log("La TRX "+ JSON.stringify(trx));
						
						var myquery = { 'id' : results[0].idnode };
						var newvalues = { $set: { 'proof': 'https://tchain.btc.com/'+ trx } };
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
