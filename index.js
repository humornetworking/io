var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var async = require('async'); 
var jwt = require('jsonwebtoken'); //lavidabellaentodassusformas
var WebSocketServer = require('ws').Server;
var fs = require("fs")


var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

//MongoDB
var url = "mongodb://localhost:27017/";
//var url = "mongodb://andres:unodos3@ds047612.mongolab.com:47612/explguru"

//MailGun
var mailgun = require("mailgun-js")({apiKey: 'key-219426aefec7c90432a505766e1888bf', domain: 'sandbox2576ebf851d144449cdb3023f5b14267.mailgun.org'});

//REST client ...
var Client = require('node-rest-client').Client;
var client = new Client();


//Express
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
var port = process.env.PORT || 8080
app.listen(port);
console.log('Magic happens ');


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
				nNodes.push({ 'id': messages[i]._id, 'image' : 'http://localhost:8080/img/'+ messages[i].image, shape: 'image'})
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

app.post('/write-tmp', function(req, res){
	
	
	var obj = {};
	var author = "Andrs"//user.author;
	//var bigAuthor = getAuthor(author);
	
	var image = req.body.image
	
	
	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	fs.writeFile('public/tmp/'+imgName, buf, function(err) { console.log(err) });
	
	res.send({"id" : imgName})
});	


app.post('/write-chapter', function(req, res){
	
	
	var obj = {};
	var author = "Andrs"//user.author;
	//var bigAuthor = getAuthor(author);
	
	var txt = req.body.texto.substring(0, 100);
	var chain = req.body.chain;
	var root = req.body.root
	var from = req.body.from
	var to = req.body.to
	var image = req.body.image
	
	
	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	fs.writeFile('public/img/'+imgName, buf, function(err) { console.log(err) });
	
	var ahora = Date.now()	
	
	
	    var txid = "321";
		if(chain == "ETH"){
			
		}
			
				var newMessage = {'txid': txid,'author' : author, 'txt' : txt, 'image' : imgName, 'timestamp' : ahora, 'root' : 0};
				var that = this
 				MongoClient.connect(url, function(err, db) {
				var dbo = db.db("explguru");
					async.seq(
						function(callback) {
										var newMessage = {'txid': txid,'author' : author, 'txt' : txt, 'image' : imgName, 'timestamp' : ahora, 'root' : 0};
										  dbo.collection("message").insertOne(newMessage, function(err, res) {
											if (err) throw err;					
											pointto = res.insertedId.toString()
											callback(null, pointto);
										  });
							
						},
						function(pointto, callback) {
							
										var row = {'root': root,'to' : pointto, 'from' : from, 'metadata' :  {"coordinates" : {
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


app.post('/write-root', function(req, res){
	
	
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

	var txt = req.body.texto.substring(0, 100);
	var chain = req.body.chain;
	var ahora = Date.now()	
	var image = req.body.image

	var img = decodeBase64Image(image)
	var buf = new Buffer(img.data, 'base64')
	var imgName = Math.floor((Math.random() * 1000000000000000) + 1) +".png"
	fs.writeFile('public/img/'+imgName, buf, function(err) { console.log(err) });
		
		        var newMessage = {'txid': '321','author' : bigAuthor.author, 'txt' : txt, 'image' : imgName, 'timestamp' : ahora, 'root' : 1};
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

	


function getUserFromToken(req) {

        var bearerHeader = req.headers["authorization"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            var bearerToken = bearer[1];

            var user = jwt.decode(bearerToken, "lavidabellaentodassusformas");
            return user;
        } else {
            return null;
        }

}


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


