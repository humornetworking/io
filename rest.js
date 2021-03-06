module.exports = function(app, jwt, MongoClient, util, setup, passport,fs,async, restClient,bitcore, ObjectId, exec, ipfs, mailgun) {
    app.get('/getAddressByUser', util.ensureAuthorized, function(req, res) {
        
		
		var user = util.getUserFromToken(req)

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").find({
                "id": user.id
            }).toArray(function(err, user) {
                console.log("USER :" + JSON.stringify(user))
                res.send({
                    "address": user[0].keys.btc.address
                });
            });
        });

    })

	
	app.post('/getUserByToken',  function(req, res) {
        
		var token = req.body.token;
		
		user = util.getUserByToken(token)
		
        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").find({
                "id": user.id
            }).toArray(function(err, user) {
                console.log("USER :" + JSON.stringify(user))
                res.send({
                    "author": user[0].author
                });
            });
        });

    })

    app.post('/updatePositionByBook', function(req, res) {

        var chapters = req.body.chapters
        console.log(" JSON : " + JSON.stringify(chapters))

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");


            for (var i = 0; i < chapters.length; i++) {
                let chapter = chapters[i]
                var myquery = {
                    '_id': ObjectId(chapter.id)
                };
                var newvalues = {
                    $set: {
                        'x': chapter.x,
                        'y': chapter.y
                    }
                };
                dbo.collection("message").updateOne(myquery, newvalues, function(err, res) {
                    if (err) throw err;
                });

            }

            db.close();


        });

    });

    app.post('/setUserName', util.ensureAuthorized, function(req, res) {
        var author = req.body.author

        var user = util.getUserFromToken(req)

        var randomText = util.getRandomText();
        var value = Buffer.from(randomText);
        var hash = bitcore.crypto.Hash.sha256(value);
        var bn = bitcore.crypto.BN.fromBuffer(hash);
        var privateKey = new bitcore.PrivateKey(bn).toString();
        var address = new bitcore.PrivateKey(bn).toAddress().toString();

        var newUser = {
            'author': author,
            'id': user.id,
            'keys': {
                "btc": {
                    "private": privateKey,
                    "address": address
                }
            }
        };
        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").insertOne(newUser, function(err, res) {
                if (err) throw err;

                db.close();


            });
        });

        var user = util.getUserFromToken(req)
        var token = jwt.sign({
            "address": address,
            "author": author,
            "id": user.id,
            "displayName": user.displayName
        }, setup.secret, {
            expiresIn: '24h' // expires in 24 hours
        });

        res.send({
            "token": token,
            "authorID": user.id
        })

    });

    app.post('/search', function(req, res) {
        var txt = ".*" + req.body.search.toLowerCase() + "*";

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("message").find({
                "txt": {
                    $regex: txt
                },
                "root": 1
            }).sort( { timestamp: -1 } ).toArray(function(err, messages) {
                res.send(messages);
            });
        });

    });

    app.get('/get-books', function(req, res) {

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("message").find({
                'root': 1
            }).sort( { timestamp: -1 } ).toArray(function(err, messages) {
                res.send(messages);
            });
        });

    });


    app.post('/get-chapters', function(req, res) {
        //var idBook = req.params.id
		var idBook = req.body.idBook
		var token = req.body.token
		
		var userID = ""
		var owner = false
		if(token) {
			user = util.getUserByToken(token)
			userID = user.id
		}
		
        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("matrix").find({
                "root": idBook
            }).toArray(function(err, edges) {


                var s = new Set();

                var arrayLength = edges.length;
                for (var i = 0; i < arrayLength; i++) {

                    if (edges[i].root != '') {
                        s.add(ObjectId(edges[i].root));
                    }

                    if (edges[i].to != '') {
                        s.add(ObjectId(edges[i].to));
                    }

                    if (edges[i].from != '') {
                        s.add(ObjectId(edges[i].from));
                    }
                }

                let nodes = [];
                s.forEach(v => nodes.push(v));

                dbo.collection("message").find({
                    "_id": {
                        $in: nodes
                    }
                }).toArray(function(err, messages) {

                    var chapters = {
                        "nodes": messages,
                        "edges": edges
                    }

                    var nNodes = [];
                    for (var i = 0; i < messages.length; i++) {
                        //nNodes.push({ 'id': messages[i]._id, 'image' : setup.url_server +'/img/'+ messages[i].image, 'shape': 'image'})

						if(messages[i].root === 1 && messages[i].authorID === userID){
								owner = true;
						}
						
                        if (messages[i]._id == idBook) {
                            nNodes.push({
                                'id': messages[i]._id,
                                'image': setup.url_server + '/img/' + messages[i].image,
                                'x': -250,
                                'y': -600,
                                'proof': messages[i].proof,
                                'title': messages[i].title,
                                'txt': messages[i].txt,
                                'authorID': messages[i].authorID
                            })
                        } else {
                            nNodes.push({
                                'id': messages[i]._id,
                                'image': setup.url_server + '/img/' + messages[i].image,
                                'x': messages[i].x,
                                'y': messages[i].y,
                                'proof': messages[i].proof,
                                'authorID': messages[i].authorID
                            })
                        }


                    }


                    var nEdges = [];
                    for (var i = 0; i < edges.length; i++) {

                        nEdges.push({
                            'from': edges[i].from,
                            'to': edges[i].to,
                            'length': 300,
                            arrows: {
                                middle: {
                                    scaleFactor: 0.5
                                },
                                to: true
                            }
                        })
                    }

                    var chapters = {
                        "nodes": nNodes,
                        "edges": nEdges,
						"owner" : owner,
						"userID" : userID
                    }

                    res.send(chapters);

                });

            });
        });

    });


    app.post('/write-chap',  function(req, res) {

        
        var obj = {};
		var token = req.body.token;
		console.log("TOKEN :"+ token)
		user = {}
		if (!token)
			user = {"author" : "Anonymous","id" : "123"}
		else 
			user = util.getUserByToken(token)

        var txt = req.body.texto.substring(0, 100);
        var root = req.body.root
        var image = req.body.image
        var x = req.body.x
        var y = req.body.y
		
		
		//Search the root author by write-chap and send a email
		//Busco por el id , obtengo el author y ese lo busco en la tabla users de donde saco el email y le envio un correo

		util.sendNotification(root,user)
		
        var img = util.decodeBase64Image(image)
        var buf = new Buffer(img.data, 'base64')
        var imgName = Math.floor((Math.random() * 1000000000000000) + 1) + ".png"


        fs.writeFile('public/img/' + imgName, buf, function(err) {
            console.log(err)
        });


        MongoClient.connect(setup.database, function(err, db) {
            var dbo = db.db("explguru");

            async.seq(


                function(callback) {

                    var newMessage = {
                        'txid': '123',
                        'authorID': user.id,
                        'author': user.author,
                        'txt': txt,
                        'image': imgName,
                        'timestamp': Date.now(),
                        'x': Number(x),
                        'y': Number(y),
                        'root': 0,
                        'proof': '',
						'rootBook' : root
                    };
                    dbo.collection("message").insertOne(newMessage, function(err, res) {
                        if (err) throw err;
                        //pointto = res.insertedId.toString()
                        newMessage["id"] = res.insertedId.toString()
                        callback(null, newMessage);

                    });

                },
                function(newMessage, callback) {

                    var row = {
                        'root': root,
                        'to': '',
                        'from': newMessage.id,
                        'metadata': {
                            "coordinates": {
                                "x": 0,
                                "y": 0
                            }
                        }
                    };

                    dbo.collection("matrix").insertOne(row, function(err, res) {
                        if (err) throw err;
                        db.close();

                        callback(newMessage, null);
                    });

                }
            )(function(newMessage, err) {
                res.send({
                    "data": newMessage
                })
            });

        });




    });


    app.post('/write-link', function(req, res) {


        var obj = {};
        var author = "Andrs" //user.author;
        //var bigAuthor = util.util.util.getAuthor(author);

        var txt = req.body.texto.substring(0, 100);
        var chain = req.body.chain;
        var root = req.body.root
        var from = req.body.from
        var to = req.body.to


        var ahora = Date.now()


        var txid = "321";


        var that = this
        MongoClient.connect(setup.database, function(err, db) {
            var dbo = db.db("explguru");
            async.seq(

                function(callback) {

                    var row = {
                        'root': root,
                        'to': to,
                        'from': from,
                        'metadata': {
                            "coordinates": {
                                "x": 0,
                                "y": 0
                            }
                        }
                    };

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


    app.post('/write-root',  function(req, res) {


        var obj = {};

        //var user = util.getUserFromToken(req)
		var token = req.body.token;
		console.log("TOKEN :"+ token)
		user = {}
		if (!token)
			user = {"author" : "Anonymous"}
		else 
			user = util.getUserByToken(token)
		
		var author = user.author;
		var txt = req.body.texto.substring(0, 100);
        var chain = req.body.chain;
        var ahora = Date.now()
        var image = req.body.image
        var title = req.body.title

        var img = util.decodeBase64Image(image)
        var buf = new Buffer(img.data, 'base64')
        var imgName = Math.floor((Math.random() * 1000000000000000) + 1) + ".png"
        fs.writeFile('public/img/' + imgName, buf, function(err) {
            console.log(err)
        });

        var newMessage = {
            'txid': '321',
            'authorID': user.id,
            'author': user.author,
            'title': title,
            'txt': txt,
            'image': imgName,
            'timestamp': ahora,
            'x': 0,
            'y': 0,
            'root': 1,
            'proof': ''
        };
        //data.push(newBook); // Save to the DB
        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("message").insertOne(newMessage, function(err, res) {
                if (err) throw err;
                var id = res.insertedId.toString();
                var row = {
                    'root': id,
                    'to': '',
                    'from': '',
                    'metadata': {
                        "coordinates": {
                            "x": 0,
                            "y": 0
                        }
                    }
                };
                dbo.collection("matrix").insertOne(row, function(err, res) {
                    if (err) throw err;
                    db.close();
                });


            });



        });

        res.send(req.body);
    });


    app.post('/tokenizeStory', util.ensureAuthorized, function(req, res) {

        var idnode = req.body.idNode
        var idimage = req.body.idImage
        var user = util.getUserFromToken(req)

		util.tokenizeStory(user.author, user.address, idnode, idimage)
		
/*
        var apiUrl = "https://api.blockcypher.com/v1/btc/test3/addrs/" + user.address;
        restClient.get(apiUrl, function(data, response) {
            console.log("BALANCE :" + JSON.stringify(data))
            var payment = {
                'address': user.address,
                'idnode': idnode,
                'idimage': idimage,
                'author': user.author,
                'id': user.id,
                'balance': data.balance
            };
			
			
            MongoClient.connect(setup.database, function(err, db) {
                if (err) throw err;
                var dbo = db.db("explguru");
                dbo.collection("payment").insertOne(payment, function(err, res) {
                    if (err) throw err;

                    db.close();
					

                });
            });

        });
*/
		
		
		res.send("OK")
		
    })


    app.get('/checkSession', function(req, res) {
        console.log("Session :" + req.sessionID)
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
        function(req, res) {
            // The request will be redirected to Facebook for authentication, so this
            // function will not be called.
        });


    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            failureRedirect: '/login.html'
        }),
        function(req, res) {
			console.log("Llamando al redirect")
            res.redirect('/account/fb');
        });

    app.get('/auth/twitter',
        passport.authenticate('twitter'),
        function(req, res) {
            // The request will be redirected to Facebook for authentication, so this
            // function will not be called.
        });

    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            failureRedirect: '/login.html'
        }),
        function(req, res) {
            res.redirect('/account/tw');
        });


    app.get('/account/:sn', function(req, res) {
        var sn = req.params.sn

        var id = req.user.id

        console.log("EL SN :" + sn)

        if (sn == "fb") {
            id = id + "fb"
        } else if (sn == "tw") {
            id = id + "tw"
        } else if (sn == "go") {
            id = id + "go"
        }

		
		console.log("EL ID :" + id)

        var token = jwt.sign({
            "id": id,
            "displayName": req.user.displayName
        }, setup.secret, {
            expiresIn: '24h'
        });

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").find({
                "id": id
            }).toArray(function(err, user) {
                if (user.length == 0) {
					console.log("NO ENCONTRADO :")
					
                    var token = jwt.sign({
                        "id": id,
                        "displayName": req.user.displayName
                    }, setup.secret, {
                        expiresIn: '24h'
                    });

                    res.redirect(setup.url_server + '/account.html?token=' + token);
                } else {
					console.log("ENCONTRADO :")
					
                    var token = jwt.sign({
                        "address": user[0].keys.btc.address,
                        "author": user[0].author,
                        "id": user[0].id,
                        "displayName": user[0].displayName
                    }, setup.secret, {
                        expiresIn: '24h'
                    });

                    res.redirect(setup.url_server + '/index.html?token=' + token + '&authorID=' + user[0].id);
                }
                //res.send(messages);
            });
        });


    });
	
	
	app.post('/signUpLightUser', function(req, res) {
        
		var username = req.body.username
        var password = req.body.password
		var email = req.body.email

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").find({
                "author": username
            }).toArray(function(err, user) {
                if (user.length == 0) {
					console.log("NO ENCONTRADO :")
					
					var id = Math.floor((Math.random() * 1000000000000000) + 1)
					
                    var token = jwt.sign({
                        "id": id,
                        "author": username
                    }, setup.secret, {
                        expiresIn: '24h'
                    });

					var randomText = util.getRandomText();
					var value = Buffer.from(randomText);
					var hash = bitcore.crypto.Hash.sha256(value);
					var bn = bitcore.crypto.BN.fromBuffer(hash);
					var privateKey = new bitcore.PrivateKey(bn).toString();
					var address = new bitcore.PrivateKey(bn).toAddress().toString();

					
					
					var newUser = {
						'author': username,
						'id': id,
						'password' : password,
						'email': email,
						'keys': {
							"btc": {
								"private": privateKey,
								"address": address
							}
						}
					};
					MongoClient.connect(setup.database, function(err, db) {
						if (err) throw err;
						var dbo = db.db("explguru");
						dbo.collection("user").insertOne(newUser, function(err, res) {
							if (err) throw err;

							db.close();


						});
					});
					
                    res.send({"status" :"OK","token": token});
                } else {

                    res.send({"status" :"NOK"});
                }
                
            });
        });


    });

	app.post('/signInLightUser', function(req, res) {
        
		var username = req.body.username
        var password = req.body.password
		

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("user").find({
                "author": username,
				"password": password
            }).toArray(function(err, user) {
                if (user.length == 0) {
					
					res.send({"status" :"NOK"});
                } else {

				    var token = jwt.sign({
                        "author": user[0].author,
                        "id": user[0].id
                    }, setup.secret, {
                        expiresIn: '24h'
                    });
				
                    res.send({"status" :"OK","token": token});
                }
                
            });
        });


    });
	
	app.post('/getBooksByUser', function(req, res) {
        var token = req.body.token;
		
		user = util.getUserByToken(token)

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("message").find({
                "authorID": user.id
            }).toArray(function(err, messages) {
                res.send(messages);
            });
        });

    });

	
/* app.post('/account/goog',  function(req, res) {
  
	  var id = req.body.id
	  id = id +"go"
	  
	  console.log("EL ID :"+ id)
	  
	  var token = jwt.sign({"id" : id ,"displayName" : "pepe"}, setup.secret, {
									expiresIn: '24h' 
								});
								
								
		
		MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var dbo = db.db("explguru");
		  dbo.collection("user").find({"id" : id}).toArray(function(err, user) {
			  console.log(err)
					var token = jwt.sign({"id" : id ,"displayName" : "pepe"}, setup.secret, {
			if (user.length == 0){
									expiresIn: '24h' 
								});
				res.send({"token" : token, "active" : false})
			} else {
					var token = jwt.sign({"address": user[0].keys.btc.address,"author": user[0].author, "id" : user[0].id ,"displayName" : user[0].displayName}, secret, {
									expiresIn: '24h'
					});
					
				res.send({"token" : token, "active" : true})
			}
			//res.send(messages);
		  });
		});
  
 }); */
	
    app.post('/profile', util.ensureAuthorized, function(req, res) {
	
	var user = util.getUserFromToken(req)
	console.log("Usuario :"+ JSON.stringify(user))

        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("token").find({
                'address': user.address
            }).toArray(function(err, messages) {
                res.send(messages);
            });
        });

    });
	
	
	app.post('/getInfoToken', util.ensureAuthorized, function(req, res) {
	var trx = req.body.trx
	var user = util.getUserFromToken(req)
	var address = user.address
	
	    MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("token").find({
                'trx': trx
            }).toArray(function(err, messages) {
				
				var message = messages[0]
				console.log(JSON.stringify(messages))
				var command = setup.path + "/omnicore-cli -datadir=" + setup.datadir + " --testnet omni_getbalance_nft "+ address
				console.log("LLAMADA OMNI :" + command)
				var buyObj = "";
				exec(command, function(error, stdout, stderr) {
					if (error === null) {
						
						//Buscar el ipfs hash en la respuesta, si esta  se imitio, sino no se emitio
						var tokens = JSON.parse(stdout)
						console.log(JSON.stringify(tokens))
						
						var output = {}
						for (let element of tokens) {
							if (element["ipfs hash"] == message.hash){
							  output = {"address" : address,"trx": trx, "hash": message.hash}
							  break;
							}
						}
						
						
						res.send(output)
						
					} else {
						console.log("Error :" + error + " " + stderr)
						res.send({})
					}
				});				
				
                
            });
        });
	
	
    });
	
	
	app.get('/test', function(req, res) {
    var hash = "QmTYrFZDcsVZNxuHN5TAvSwHHqQ4R6BYi9NsZMzJ6yMZz2",
    address = "myeEPsCkiGr6km4Hc9CzStUu6E6fpgUSHd",
	trx = "123";
	
	    MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("token").find({
                'trx': trx
            }).toArray(function(err, messages) {
				
				var message = messages[0]
				var command = setup.path + "/omnicore-cli -datadir=" + setup.datadir + " --testnet omni_get_balance_nft "+ address
				console.log("LLAMADA OMNI :" + command)
				var buyObj = "";
				exec(command, function(error, stdout, stderr) {
					if (error === null) {
						
						//Buscar el ipfs hash en la respuesta, si esta  se imitio, sino no se emitio
						var tokens = JSON.parse(stdout)
						
						var output = {}
						for (let element of tokens) {
							if (element["ipfs hash"] == message.hash){
							  output = {"address" : address,"trx": trx, "hash": message.hash}
							  break;
							}
						}
						
						
						res.send(output)
						
					} else {
						console.log("Error :" + error + " " + stderr)
						res.send({})
					}
				});				
				
                
            });
        });
	
	
    });
	
	app.post('/sendToken', function(req, res) {
	
 	var code = req.body.code;
	var sexo = req.body.sexo;
	var talla = req.body.talla;
	var correo = req.body.correo;	
	var modelo = req.body.modelo; 

	
	        var newUser = {
            'code': code,
            'sexo': sexo,
            'talla': talla,
			'correo' : correo,
			'modelo' : modelo
            }
        
        MongoClient.connect(setup.database, function(err, db) {
            if (err) throw err;
            var dbo = db.db("explguru");
            dbo.collection("asciishop").insertOne(newUser, function(err, res) {
                if (err) throw err;

                db.close();



            });
        });
		
						res.send({
								"status": "OK"
							})


    }); 
	
}