//Globals
var nodes = null;
var edges = null;
var network = null;
var data = [];
var texto = ""
var rootBook = ""
var dataImage = ""
var actualPointer = {}
var addChapter = false
var nodeSelected = {}
var URLSERVER = "http://ioio.cl"

window.App = {

    checkLogin: function() {

        if (this.checkToken()) {
            console.log("Estamos")
        } else {
            $('#loginModal').modal('show');
            console.log("Go Login")
        }

    },

    pay: function() {
	
	    var token = localStorage.getItem("token")
	
        if (token !== null && token !== "undefined") {

			$.ajax({
				type: 'GET',
				url: URLSERVER + '/getAddressByUser',
				headers: {
					"Authorization": "Bearer " + localStorage.getItem('token')
				},
				success: function(data) {

					var mywaypk = data.address
					$('#qrcode').qrcode(mywaypk);
					$('#payment').modal('show');
				}
			})
		
        } else {
            window.location.href = "login.html";
        }
	




    },
    paymentSent: function() {

        var dataPay = {};
        dataPay.idNode = nodeSelected.id
        dataPay.idImage = nodeSelected.image

        $.ajax({
            type: 'POST',
            data: JSON.stringify(dataPay),
            contentType: 'application/json',
            url: URLSERVER + '/tokenizeStory',
            headers: {
                "Authorization": "Bearer " + localStorage.getItem('token')
            },
            success: function(data) {
                $('#payment').modal('toggle');
                

            }
        })


    },
    checkToken: function() {
        var token = localStorage.getItem('iotoken');
        if (!token)
            return false;
        else
            return true;
    },

    setNickName: function() {

        var data = {};
        data.author = $("#author").val();

        $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: URLSERVER + '/setUserName',
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('token')
                },
                success: function(data) {
                    localStorage.removeItem("token")
                    localStorage.removeItem("authorID")
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("authorID", data.authorID)
                    window.location.href = "index.html";


                }
            }).done(function(data) {
                window.location.href = "index.html"


            })
            .fail(function(err) {
                console.log(err);
                window.location.href = "login.html"
            });

    },
	   signUpLightUser: function() {

        var data = {};
        data.username = $("#author").val();
		data.password = $("#password").val();
		data.email = $("#email").val();

		if( data.username == "" || data.password == "" || data.email == "") {
			alert("Debe ingresar todos los datos")
		}
		
        $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: URLSERVER + '/signUpLightUser',
                /*headers: {
                    "Authorization": "Bearer " + localStorage.getItem('token')
                },*/
                success: function(data) {
					
					if (data.status == "OK") {
					
						localStorage.removeItem("token")
						localStorage.setItem("token", data.token)
						window.location.href = "index.html";
					} else {
							
						toastr.options = {
							"debug": false,
							"positionClass": "toast-top-full-width",
							"onclick": null,
							"fadeIn": 300,
							"fadeOut": 1000,
							"timeOut": 2000,
							"extendedTimeOut": 1000
						}
						toastr.info('El nombre de usuario ya existe')
						
					}


                }
            })

    },
	signInLightUser: function() {

        var data = {};
        data.username = $("#authorIn").val();
		data.password = $("#passwordIn").val();

		
		if( data.username == "" || data.password == "") {
			alert("Debe ingresar todos los datos")
		}
		
        $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: URLSERVER + '/signInLightUser',
                /*headers: {
                    "Authorization": "Bearer " + localStorage.getItem('token')
                },*/
                success: function(data) {
					
					if (data.status == "OK") {
					
						localStorage.removeItem("token")
						localStorage.setItem("token", data.token)
						window.location.href = "index.html";
					} else {
					
						toastr.options = {
							"debug": false,
							"positionClass": "toast-top-full-width",
							"onclick": null,
							"fadeIn": 300,
							"fadeOut": 1000,
							"timeOut": 2000,
							"extendedTimeOut": 1000
						}
						toastr.info('Credenciales no validas')
						
					}


                }
            })

    }
	
	,
    openWrite: function() {

        var token = localStorage.getItem("token")
		//var token = "ABC"
			
        if (token !== null && token !== "undefined") {
            $("#summernote-root").summernote("reset");
            $('#newStory').modal('show')
            $('.note-image-btn').prop("disabled", false);
			
			$( ".note-btn.btn.btn-default.btn-sm" ).click(function() {
			  $(".in").css("position","absolute");
			  $(".in").css("left","0px");
			  $(".in").css("top","0px");
			  $( ".in > .modal-dialog > .modal-content" ).eq(1).css("left","0px");
			  
			});

        } else {
            window.location.href = "login.html";
        }



    },
    writeTmp: function(dataURL, texto, x, y) {


        var data = {}
        var result = {}
        data.image = dataURL
        data.texto = texto
        data.root = rootBook
        data.x = x
        data.y = y
		data.token = localStorage.getItem('token')



        async.seq(
            function(callback) {
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/write-chap',/* 
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem('token')
                    }, */
                    async: false,
                    success: function(dat) {
                        callback(dat)
                    }
                })

            }
        )(function(dat, err) {
            result = dat.data;
        });

        return result;


    },
    write: function() {

        var label = document.getElementById('summernote-root').value;
        var title = $("#title").val();
		
		if (!label || label == "<p><br></p>" || !title) {
			toastr.options = {
				"debug": false,
				"positionClass": "toast-top-full-width",
				"onclick": null,
				"fadeIn": 300,
				"fadeOut": 1000,
				"timeOut": 2000,
				"extendedTimeOut": 1000
			}
			toastr.info('Debe ingresar el titulo y el contenido de la historia')
			return
        
		}
			

        $('#newStory').modal('toggle');
        $('#uploadRoot').modal('show')
        $('#mainContainer').waitMe({})
		
        $("#thetext-root").replaceWith(" <div id='thetext-root' class='thetext-root' >" + label + "</div>");
        var el = document.getElementById("test-root");

		
        setTimeout(function() {
            html2canvas(el, {
                width: 300
            }).then(canvas => {

                var dataURL = canvas.toDataURL("image/png")
                var iotoken = localStorage.getItem("iotoken");
                var data = {};
                data.texto = label;
                data.image = dataURL
                data.chain = "ETH" //$( "#chain" ).val();
                data.title = title
				data.token = localStorage.getItem('token')


                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/write-root',/* 
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem('token')
                    }, */
                    success: function(data) {

                        $('#uploadRoot').modal('toggle');
                        $('#mainContainer').waitMe("hide")
                        $("#thetext-root").replaceWith("<div id='thetext-root'></div>");


                        App.refreshList();
                    }
                }).done(function(data) {


                })

            });
        }, 500);


    },
    refreshList: function() {

        $.ajax({
            type: 'GET',
            url: URLSERVER + "/get-books",
            context: document.body
        }).done(function(data) {

            $("#message-list").empty();
            data.forEach(function(msg) {
                var newMessage = $("#new-message").clone();
				newMessage.find(".message").replaceWith("<div style=\"cursor: pointer\" id=\"" + msg._id + "\"  class=\"mb-1 message\" onclick=\"App.goChapter(\'" + msg._id + "\')\"><img width=\"300\" src=\"" + URLSERVER + "/img/" + msg.image + "\"></div>");				
                newMessage.find(".title").text(msg.title);
				newMessage.find(".title").click(function() {App.goChapter(msg._id)})
				newMessage.find(".author").text("Autor : "+ msg.author);
				newMessage.find(".author").click(function() {App.goChapter(msg._id)})
                newMessage.find(".date").text(new Date(msg.timestamp));
				newMessage.find(".date").click(function() {App.goChapter(msg._id)})
                $("#message-list").append(newMessage);
				$("#message-list").append('<br>')

            });

			
        })

    },
    search: function() {

        var data = {};
        data.search = $("#search").val();

        $.ajax({
            type: 'POST',
            url: URLSERVER + "/search",
            data: JSON.stringify(data),
            contentType: 'application/json',
            context: document.body
        }).done(function(data) {

            $("#message-list").empty();
            data.forEach(function(msg) {
                var newMessage = $("#new-message").clone();
				newMessage.find(".message").replaceWith("<div style=\"cursor: pointer\" id=\"" + msg._id + "\"  class=\"mb-1 message\" onclick=\"App.goChapter(\'" + msg._id + "\')\"><img width=\"300\" src=\"" + URLSERVER + "/img/" + msg.image + "\"></div>");				
                newMessage.find(".title").text(msg.title);
				newMessage.find(".title").click(function() {App.goChapter(msg._id)})
				newMessage.find(".author").text("Autor : "+ msg.author);
				newMessage.find(".author").click(function() {App.goChapter(msg._id)})
                newMessage.find(".date").text(new Date(msg.timestamp));
				newMessage.find(".date").click(function() {App.goChapter(msg._id)})
                $("#message-list").append(newMessage);
				$("#message-list").append('<br>')

            });

        })

    },
	   goChapterByUrl: function(idBook) {
		   window.location.href = "http://ioio.cl/?book="+ idBook;
	   },
	
    goChapter: function(idBook) {
	
	$('#mainContainer').waitMe({})
	
	setTimeout(function(){
	
			$('.navbar1').show()
			$('#centerButton').show()
			$('.book-page').hide()
			$('.chapter-page').show()		
        
		        var data = {};
                data.idBook = idBook
				data.token = localStorage.getItem('token')
		
        $.ajax({
            type: 'POST',
			data: JSON.stringify(data),
            contentType: 'application/json',
            url: URLSERVER + "/get-chapters",
            async: false
        }).done(function(data) {
		
		/*
			if(!data.owner) {
				$("#savePosition").hide()
			}
		*/
		
            var nodes = data.nodes
            var edges = data.edges

			localStorage.setItem('userID', data.userID) 
            var container = document.getElementById('mynetwork');
            var data = {
                nodes: nodes,
                edges: edges
            };

            App.initGraph(idBook, data);
            $('#mainContainer').waitMe("hide")


        })	
	
	
	
	
	}, 400)
	
			
			



    },


    openChapter: function() {
		
		var token = localStorage.getItem("token")
		//var token = "ABC"

        if (token !== null && token !== "undefined") {
            $("#summernote").summernote("reset");
            $('#newChapter').modal('show')
            $('.note-image-btn').prop("disabled", false);
			
			

        } else {
            window.location.href = "login.html";
        }
		
    },
    writeChapter: function(texto, from, to, image) {
        /*if(!this.checkToken()) {
        	$('#loginModal').modal('show')
        	return
        }
        var iotoken = localStorage.getItem("iotoken");*/


        var data = {};
        data.texto = window.texto;
        data.chain = "ETH" //$( "#chain" ).val();
        data.root = window.rootBook;
        data.from = from;
        data.to = to;

        if (typeof image != 'undefined')
            data.image = image
        else
            data.image = ""

        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: URLSERVER + '/write-link',/* 
            headers: {
                "Authorization": "Bearer " + localStorage.getItem('token')
            }, */
            success: function(data) {

                //App.goChapter(rootBook)

            }
        }).done(function(data) {


        })
    },
    share: function(sn) {

        var node = nodes._data[rootBook]

        let url = 'http://ioio.cl/?book=' + rootBook
        let title = node.title
        let description = node.txt.replace(/<[^>]*>/g, '')
        let image = node.image


        if (sn == "facebook")
            App.shareFacebook(url, title, description, image)
        else if (sn == "twitter")
            App.shareTwitter(url, title, description, image)
        else if (sn == "whatsapp")
            App.shareWhatsapp(url, title, description, image)

    },
    shareWhatsapp: function(overrideLink, overrideTitle, overrideDescription, overrideImage) {
        var url = "whatsapp://send?text=" + overrideLink
        window.open(url, '_blank');
    },
    shareTwitter: function(overrideLink, overrideTitle, overrideDescription, overrideImage) {
        var url = "http://twitter.com/share?text=" + overrideTitle + "&url=" + overrideLink + "&hashtags=ioio"
        window.open(url, '_blank');
    },
    shareFacebook: function(overrideLink, overrideTitle, overrideDescription, overrideImage) {
        FB.ui({
                method: 'share_open_graph',
                action_type: 'og.likes',
                action_properties: JSON.stringify({
                    object: {
                        'og:url': overrideLink,
                        'og:title': overrideTitle,
                        'og:description': overrideDescription,
                        'og:image': overrideImage
                    }
                })
            },
            function(response) {
                // Action after response
            });
    },
    centerBook: function() {

        var optionsx = {
            scale: 2,
            offset: {
                x: 0,
                y: 0
            },
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad"
            }
        };

        network.focus(rootBook, optionsx);

        network.moveTo({
            position: {
                x: -250,
                y: -480
            },
            offset: {
                x: 0,
                y: 0
            }
        })
    },
    updateNodesPosition: function() {

        var chapters = []
        for (var key in nodes._data) {
            if (nodes._data.hasOwnProperty(key)) {

                var node = network.getPositions(key)
                var x = node[key].x
                var y = node[key].y
                var chapter = {
                    "id": key,
                    "x": x,
                    "y": y
                }
                chapters.push(chapter)
                //console.log(key + " -> " + nodes._data[key]);
            }
        }

        var data = {
            "chapters": chapters
        }


        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: URLSERVER + '/updatePositionByBook',
            /* 	
            beforeSend: function (xhr) {   //Include the bearer token in header
            		xhr.setRequestHeader("Authorization", 'Bearer '+ iotoken);
            	} */
            success: function(data) {

                //App.goChapter(rootBook)

            }
        }).done(function(data) {


        })



    },

    destroy: function() {
        if (network !== null) {
            network.destroy();
            network = null;
        }
    },

    draw: function(story) {
        App.destroy();
        nodes = [];
        edges = [];

        // create a network
        var container = document.getElementById('mynetwork');


        var dsoptions = {
            physics: {
                enabled: false
            },
            nodes: {
                shape: 'image',
                borderWidth: 3,
                size: 30,
                color: {
                    border: '#A6D5F7',
                    background: '#6AAFFF'
                },
                font: {
                    color: '#eeeeee'
                },
                shapeProperties: {
                    useBorderWithImage: true
                }

            },
            edges: {
                "color": {
                    "color": "rgba(85,58,132,1)",
                    "inherit": false
                },
                smooth: {
                    type: 'cubicBezier'
                }
            },
            manipulation: {
                enabled: false,
                addNode: function(data, callback) {
                    // filling in the popup DOM elements
                    console.log('add', data);
                },
                editNode: function(data, callback) {
                    // filling in the popup DOM elements
                    console.log('edit', data);
                },
                addEdge: function(data, callback) {
                    console.log('add edge', data);
                    if (data.from == data.to) {

                        return;

                    } else {

                        //saveEdge(data)
                        data["arrows"] = {
                            middle: {
                                scaleFactor: 0.5
                            },
                            to: true
                        }
                        callback(data);
                        App.saveEdge(data)
                    }
                    // after each adding you will be back to addEdge mode
                    //network.addEdgeMode();
                }
            }
        };

        nodes = new vis.DataSet(story.nodes);

        var data = {
            nodes: nodes,
            edges: story.edges
        };



        network = new vis.Network(container, data, dsoptions);


        network.moveTo({
            position: {
                x: -250,
                y: -200
            },
            offset: {
                x: 0,
                y: 0
            },
            scale: 1,
        })

        network.disableEditMode()
/*
	   network.on("beforeDrawing", function (ctx) {
		//716 - 962
		
		for (var i = 0; i < story.nodes.length; i++) {
			let obj = story.nodes[i];
			var nodeId = obj.id;
			var nodePosition = network.getPositions([nodeId]);
			var bounding = network.getBoundingBox(nodeId);
			ctx.strokeStyle = '#A6D5F7';
			ctx.fillStyle = '#ffffff';
			//ctx.circle(nodePosition[nodeId].x, nodePosition[nodeId].y,50);
			//ctx.rect(bounding.top,bounding.left,bounding.right,bounding.bottom);
			ctx.rect(nodePosition[nodeId].x,nodePosition[nodeId].y,bounding.left,50);
			//ctx.rect(bounding.right,bounding.left,50,50);
			ctx.fill();
			ctx.stroke();
		}
		
	  });*/
		
        network.on("afterDrawing", function(ctx) {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0;

        });
		



        network.on("click", function(params) {
            params.event = "[original event]";
            actualPointer = params.pointer
            var selection = params.nodes;
            var clickedNode = nodes.get([selection])[0];
            nodeSelected = clickedNode

            if (addChapter) {
                $("#summernote").summernote("reset");
                $('#newChapter').modal('show')
				
				$( ".note-btn.btn.btn-default.btn-sm" ).click(function() {
					  $(".in").css("position","absolute");
					  $(".in").css("left","0px");
					  $(".in").css("top","0px");
					  $( ".in > .modal-dialog > .modal-content" ).eq(1).css("left","0px");
					  
				});
				
                addChapter = false;
            } else {

                var userID = localStorage.getItem("userID")

                if (clickedNode.authorID == userID && clickedNode.proof == '') {

                    toastr.options = {
                        "debug": false,
                        "positionClass": "toast-top-full-width",
                        "onclick": null,
                        "fadeIn": 300,
                        "fadeOut": 1000,
                        "timeOut": 2000,
                        "extendedTimeOut": 1000
                    }

                    toastr.success('<a href="#" onclick="App.pay()">Tokeniza esta historia</a>')
              
			   }


            }
        });


        var optionsx = {
            scale: 2,
            offset: {
                x: 0,
                y: 0
            },
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad"
            }
        };

        network.focus(rootBook, optionsx);

        network.moveTo({
            position: {
                x: -250,
                y: -480
            },
            offset: {
                x: 0,
                y: 0
            }
        })


    },

    editNode: function(data, cancelAction, callback) {
        document.getElementById('summernote').value = data.label;

        $('#newChapter').modal('show')
        $('.note-image-btn').prop("disabled", false);
        $('.note-image-btn').blur(function() {
            $('.note-image-btn').prop("disabled", false);
        });


    },

    clearNodePopUp: function() {

        $('#newChapter').modal('hide')

    },

    cancelNodeEdit: function(callback) {
        App.clearNodePopUp();
        callback(null);
    },

    saveNodeData: function(data, callback) {

        data.label = document.getElementById('summernote').value;

        $('#newChapter').modal('hide')
        $('#mainContainer').waitMe({})
        $('#uploadChapter').modal('show')
        $("#thetext").replaceWith("<div id='thetext'>" + data.label + "</div>");



        var el = document.getElementById("test");

        setTimeout(function() {
            html2canvas(el).then(canvas => {
                var dataURL = canvas.toDataURL("image/png")
                dataImage = dataURL

                $('#uploadChapter').modal('toggle');
                $('#mainContainer').waitMe("hide")
                $("#thetext").replaceWith("<div id='thetext'></div>");

                book = App.writeTmp(dataImage, data.label) //Evento asyncronico, Manejarlo

                texto = data.label
                App.clearNodePopUp();
                data["image"] = URLSERVER + '/img/' + book.image
                data["shape"] = 'image'
                data["label"] = ''
                data["id"] = book.id



                $('#viewport').attr('content', 'width=device-width, initial-scale=0.9');
                try {
                    var scale = 'scale(0.9)';
                    document.body.style.webkitTransform = scale // Chrome, Opera, Safari
                    document.body.style.msTransform = scale // IE 9
                    document.body.style.transform = scale;
                } catch (err) {
                    console.log(err)
                }

                callback(data);


            });
        }, 500);

    },

    editEdgeWithoutDrag: function(data, callback) {

        saveEdgeData(data, callback)

    },

    clearEdgePopUp: function() {
        document.getElementById('edge-saveButton').onclick = null;
        document.getElementById('edge-cancelButton').onclick = null;
        document.getElementById('edge-popUp').style.display = 'none';
    },

    cancelEdgeEdit: function(callback) {
        clearEdgePopUp();
        callback(null);
    },

    saveEdgeData: function(data, callback) {

        var from = data.from
        var to = data.to

        if (typeof data.to === 'object')
            data.to = data.to.id
        if (typeof data.from === 'object')
            data.from = data.from.id
        data.label = ''; //document.getElementById('edge-label').value;
        App.clearEdgePopUp();


        //Mine First to do this
        App.writeChapter("", from, to, dataImage)

        data["arrows"] = {
            middle: {
                scaleFactor: 0.5
            },
            to: true
        }
        callback(data);
    },

    initGraph: function(root, book) {
        rootBook = root
        data = book

        App.draw(book);
    },

    addNode: function() {

        data.label = document.getElementById('summernote').value;
		
			if (!data.label || data.label == "<p><br></p>") {
			toastr.options = {
				"debug": false,
				"positionClass": "toast-top-full-width",
				"onclick": null,
				"fadeIn": 300,
				"fadeOut": 1000,
				"timeOut": 2000,
				"extendedTimeOut": 1000
			}
			toastr.info('Debe ingresar el contenido de la historia')
			return
        
		}
		

        $('#newChapter').modal('hide')
        $('#uploadChapter').modal('show')
        //$("#thetext").replaceWith("<div id='thetext' style='margin-top: 20px ; margin-left: 25px; margin-right: 10px' >" + data.label + "</div>");
$("#thetext").replaceWith("<div id='thetext' >" + data.label + "</div>");
		
        var el = document.getElementById("test");

		setTimeout(function(){$('#mainContainer').waitMe({})}, 1)
		
        setTimeout(function() {
            html2canvas(el).then(canvas => {
                var dataURL = canvas.toDataURL("image/png")
                dataImage = dataURL

				$('#mainContainer').waitMe("hide")
                $('#uploadChapter').modal('toggle');
                $("#thetext").replaceWith("<div id='thetext'></div>");

                book = App.writeTmp(dataImage, data.label, actualPointer.canvas.x, actualPointer.canvas.y) //Evento asyncronico, Manejarlo



                texto = data.label
                App.clearNodePopUp();
                data["image"] = URLSERVER + '/img/' + book.image
                data["shape"] = 'image'
                data["label"] = ''
                data["id"] = book.id
                data["x"] = actualPointer.canvas.x
                data["y"] = actualPointer.canvas.y

                nodes.add(data);

            });
        }, 500);



    },

    saveEdge: function(data) {

        var from = data.from
        var to = data.to

        if (typeof data.to === 'object')
            data.to = data.to.id
        if (typeof data.from === 'object')
            data.from = data.from.id
        data.label = ''; //document.getElementById('edge-label').value;
        App.clearEdgePopUp();


        App.writeChapter("", from, to)
        network.disableEditMode()


    },

    newChapter: function() {
		
		var token = localStorage.getItem("token")

        if (token !== null && token !== "undefined") {
			toastr.options = {
				"debug": false,
				"positionClass": "toast-top-full-width",
				"onclick": null,
				"fadeIn": 300,
				"fadeOut": 1000,
				"timeOut": 2000,
				"extendedTimeOut": 1000
			}

			toastr.info('Haga click en algún punto de la pantalla para escribir')
        addChapter = true;			

        } else {
            window.location.href = "login.html";
        }
		


    },

    newCon: function() {

        toastr.options = {
            "debug": false,
            "positionClass": "toast-top-full-width",
            "onclick": null,
            "fadeIn": 300,
            "fadeOut": 1000,
            "timeOut": 2000,
            "extendedTimeOut": 1000
        }
        toastr.info('Selecciona una historia y conectala con otra')
        network.addEdgeMode();

    },
	
	getTokenList: function(){
		        
				var data = {}
				$.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/profile',
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem('token')
                    },
                    success: function(data) {

						$("#token-list").empty();
						data.forEach(function(msg) {
							var newToken = $("#new-token").clone();
							newToken.find(".message").replaceWith("<div style=\"cursor: pointer\" class=\"mb-1 message\" ><a href=\"http://ioio.cl/token.html?trx="+ msg.trx +"\">"+ msg.trx  +"</a></div>");
							$("#token-list").append(newToken);

						});
					
                    }
                }).done(function(data) {


                })
	},
	
	getBooksByUser: function(){
		        
				var data = {}
				
				data.token = localStorage.getItem('token')
				
				$.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/getBooksByUser',
                    success: function(data) {

						$("#book-list").empty();
						$("#colab-list").empty();
						
						data.forEach(function(msg) {
							var newMessage = $("#new-message").clone();
							newMessage.find(".message").replaceWith("<div style=\"cursor: pointer\" class=\"mb-1 message\" onclick=\"App.goChapterByUrl(\'" + msg.rootBook + "\')\"><img width=\"300\" src=\"" + URLSERVER + "/img/" + msg.image + "\"></div>");				
							newMessage.find(".title").text(msg.title);
							newMessage.find(".title").click(function() {App.goChapterByUrl(msg.rootBook)})
							newMessage.find(".author").text(msg.author);
							newMessage.find(".author").click(function() {App.goChapterByUrl(msg.rootBook)})
							newMessage.find(".date").text(new Date(msg.timestamp));
							newMessage.find(".date").click(function() {App.goChapterByUrl(msg.rootBook)})
							
							if(msg.root == 1)
								$("#book-list").append(newMessage);
							else
								$("#colab-list").append(newMessage);
							
							$("#colab-list").append('<br>')

						});
					
                    }
                }).done(function(data) {


                })
	},
	getUserByToken: function(){
		        
				var data = {}
				
				data.token = localStorage.getItem('token')
				
				$.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/getUserByToken',
                    success: function(data) {

						$("#author").text(data.author);
					
                    }
                })
	},
	getInfoToken: function(trx){
		        
				var data = {}
				data.trx = trx
				
				$.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: URLSERVER + '/getInfoToken',
					headers: {
                        "Authorization": "Bearer " + localStorage.getItem('token')
                    },
                    success: function(data) {

						if($.isEmptyObject(data)){
							$("#no-token").show();	
						} else {
							$("#info-token").show();
							$("#address").val(data.address);
							$("#trx").val(data.trx);
							$("#hash").val(data.hash);
						}
					
                    }
                }).done(function(data) {


                })
	},
	logout: function(){
		
		    localStorage.removeItem("token")
            window.location.href = "index.html";
		
	}
};