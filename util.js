module.exports = function(app, jwt, MongoClient, setup, fs, exec, ipfs) {
	
return {
	
    getAuthor: function(author) {
        var that = this;
        async.parallel([
                /*
                 * First external endpoint
                 */
                function(callback) {


                    MongoClient.connect(setup.database, function(err, db) {
                        if (err) throw err;
                        var dbo = db.db("explguru");
                        dbo.collection("user").find({
                            'author': author
                        }).toArray(function(err, messages) {
                            callback(false, messages);
                        });
                    });


                }
            ],
            /*
             * Collate results
             */
            function(err, results) {

                if (err) {
                    console.log(err);
                    res.send(500, "Server Error");
                    return;
                }

                return results[0];

            }
        )
    },

    decodeBase64Image: function(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};

        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
    },
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('login.html');

    },
    ensureAuthorized: function(req, res, next) {
        var bearerToken;
        var bearerHeader = req.headers["authorization"];
        console.log("TOKEN AUTH :" + bearerHeader)
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];

            // verifies setup.setup.secret and checks exp
            jwt.verify(bearerToken, setup.secret, function(err, decoded) {
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

    },
    getUserFromToken: function(req) {
        var bearerHeader = req.headers["authorization"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            var bearerToken = bearer[1];

            var user = jwt.decode(bearerToken, setup.secret);
            return user;
        } else {
            return null;
        }
    },
	getUserByToken: function(token) {

        var bearerToken = token;
        var user = jwt.decode(bearerToken, setup.secret);
        return user;

    },
    getRandomText: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    tokenizeStory: function(author, address, idnode, idimage) {
        idimage = idimage.substr(idimage.lastIndexOf("/") + 1)
        var file = "./public/img/" + idimage
        console.log("El File :" + file)
        var data = fs.readFileSync(file)

        var buf = new Buffer(data, 'base64');

        ipfs.util.addFromStream(buf, (err, result) => {
            if (err) {
                throw err
            }
            var hash = result[0].hash;
            console.log("HASH :" + hash)
            //callOmniRpc(hash, author, address, idnode)
			    var link = "https://gateway.ipfs.io/ipfs/" + hash;
				var command = setup.path + "/omnicore-cli -datadir=" + setup.datadir + " --testnet omni_create_nft mxPpb6TPZXWCFxtooQW1jyR9wF55yyk79d " + address + " 1 1 0 " + author + " " + link + " " + hash
				console.log("LLAMADA OMNI :" + command)
				var buyObj = "";
				exec(command, function(error, stdout, stderr) {
					if (error === null) {
						console.log("TRX OMNI :" + stdout)
						let trx = stdout.substring(0, stdout.length - 2);
						//Insert TRX into token table
						var nft = {
							"author": author,
							"address": address,
							"trx": trx,
							"hash": hash
						}
						
						MongoClient.connect(setup.database, function(err, db) {
							var dbo = db.db("explguru");
							dbo.collection("token").insertOne(nft, function(err, res) {
								if (err) throw err;
								db.close();
							});
						});


					} else {
						console.log("Error :" + error + " " + stderr)
					}
				});
			
			

        })
    },
    callOmniRpc: function(hash, author, address, idnode) {
        var link = "https://gateway.ipfs.io/ipfs/" + hash;
        var command = setup.path + "/omnicore-cli -datadir=" + setup.datadir + " --testnet omni_create_nft mxPpb6TPZXWCFxtooQW1jyR9wF55yyk79d " + address + " 1 1 0 " + author + " " + link + " " + hash
        console.log("LLAMADA OMNI :" + command)
        var buyObj = "";
        exec(command, function(error, stdout, stderr) {
            if (error === null) {
                console.log("TRX OMNI :" + stdout)
                //Insert TRX into token table
                var nft = {
                    "author": author,
                    "address": address,
                    "trx": stdout,
					"hash": hash
                }
				
				MongoClient.connect(setup.database, function(err, db) {
					var dbo = db.db("explguru");
					dbo.collection("token").insertOne(nft, function(err, res) {
						if (err) throw err;
						db.close();
					});
				});


            } else {
                console.log("Error :" + error + " " + stderr)
            }
        });

    }
  }
}