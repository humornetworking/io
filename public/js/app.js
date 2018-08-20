window.App = {
	
	checkLogin: function () {

			if(this.checkToken()) {
				console.log("Estamos")
			} else {
				$('#loginModal').modal('show');
				console.log("Go Login")
			}
	
    },
	
	pay : function() {
		
		
							    $.ajax({
									type: 'GET',
									url: URLSERVER +'/getAddressByUser',
									headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},				
									success: function(data) {
										
										var mywaypk = data.address
										$('#qrcode').qrcode(mywaypk);
										$('#payment').modal('show');
									}
								})
		
		
	},
	paymentSent : function() {
		
	  data.label = document.getElementById('summernote').value;
	  
	  $('#newChapter').modal('hide')
	  $('#uploadChapter').modal('show')
	  $( "#thetext" ).replaceWith( "<div id='thetext' style='margin-top: 20px ; margin-left: 25px; margin-right: 10px' >"+ data.label +"</div>");

	  var el = document.getElementById("test");
	  
	    setTimeout(function(){
			html2canvas(el).then(canvas => {
					var dataURL = canvas.toDataURL("image/png")
					dataImage = dataURL
					
					$('#uploadChapter').modal('toggle');
					  $( "#thetext" ).replaceWith( "<div id='thetext'></div>");
					
					  book	= App.writeTmp(dataImage, data.label, actualPointer.canvas.x, actualPointer.canvas.y) //Evento asyncronico, Manejarlo
		  
					  
		  
					  texto = data.label
					  clearNodePopUp();
					  data["image"] = URLSERVER +'/img/'+ book.image
					  data["shape"] = 'circularImage'
					  data["label"] = ''
					  data["id"] = book.id
					  data["x"] = actualPointer.canvas.x
					  data["y"] = actualPointer.canvas.y
					  
					  nodes.add(data);

		            var dataPay = {};
					//var texto = data.label;
					dataPay.texto = texto.replace(/<[^>]*>/g, '')
					dataPay.idNode = book.id
					
					$.ajax({
						type: 'POST',
						data: JSON.stringify(dataPay),
				        contentType: 'application/json',
                        url: URLSERVER +'/checkPayment',
						headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},						
                        success: function(data) {
                            //$('#payment').modal('toggle');
                    		
							
                        }
                    })
					  
					  $('#payment').modal('show');
					  
		  });
		},500);
		

		
	},
	checkToken: function () {
		var token = localStorage.getItem('iotoken');
		if (!token)
			return false;
		else
			return true;
    },
	
	setNickName: function () {

		    		var data = {};
					data.author = $( "#author" ).val();

					$.ajax({
						type: 'POST',
						data: JSON.stringify(data),
				        contentType: 'application/json',
                        url: URLSERVER +'/setUserName',	
						headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},						
                        success: function(data) {
							localStorage.removeItem("token")
							localStorage.setItem("token",data.token)
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
	openWrite: function () {

			var token = localStorage.getItem("token")

			if (token !== null && token !== "undefined"){
				$("#summernote-root").summernote("reset");
				$('#newStory').modal('show')
				$('.note-image-btn').prop("disabled", false);
				
		    } else {
				window.location.href = "login.html";
			}

			

    },
	writeTmp : function(dataURL, texto, x,y){
		
		
		var data = {}
		var result = {}
		data.image = dataURL
		data.texto = texto
		data.root = rootBook
		data.x = x
		data.y = y
		
		
		
					async.seq(
						function(callback) {
									$.ajax({
										type: 'POST',
										data: JSON.stringify(data),
										contentType: 'application/json',
										url: URLSERVER +'/write-chap',
										headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},	
										async : false,
										success: function(dat) { callback(dat) }
									})
							
						}
					)(function( dat, err) {
						result = dat.data;
					});
		
		return result;

		
	},
	write: function () {
		
/* 			if(!this.checkToken()) {
				$('#loginModal').modal('show')
				return
			} */
			
				  var label = document.getElementById('summernote-root').value;
				  var title = $("#title").val();
				  
				  $('#newStory').modal('toggle');
				  $('#uploadRoot').modal('show')
				  $('#mainContainer').waitMe({})
				  $( "#thetext-root" ).replaceWith( " <div id='thetext-root' style='width:300px ; display: inline-block;flex-direction: column' >"+ label +"</div>");
				  var el = document.getElementById("test-root");
				  
				    setTimeout(function(){
					  html2canvas(el, {
						  width: 300
						}).then(canvas => {
						  
								var dataURL = canvas.toDataURL("image/png")
								var iotoken = localStorage.getItem("iotoken");
								var data = {};
								data.texto = label;
								data.image = dataURL
								data.chain = "ETH"//$( "#chain" ).val();
								data.title = title
								
								
								$.ajax({
									type: 'POST',
									data: JSON.stringify(data),
									contentType: 'application/json',
									url: URLSERVER +'/write-root',
									headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},				
									success: function(data) {
										
										$('#uploadRoot').modal('toggle');
										$('#mainContainer').waitMe("hide")
										$( "#thetext-root" ).replaceWith( "<div id='thetext-root'></div>");
										
										
										App.refreshList();
									}
								}).done(function(data) {
									
									
								  })
								  
						});
					},500);
				  

    },
	refreshList : function() {
		
		$.ajax({
			type: 'GET',
		  url: URLSERVER +"/get-books",
		  context: document.body
		}).done(function(data) {
		  
		    $( "#message-list" ).empty();
			data.forEach(function(msg) {
				var newMessage = $( "#new-message" ).clone();
				newMessage.find(".message").replaceWith( "<div style=\"cursor: pointer\" class=\"mb-1 message\" onclick=\"App.goChapter(\'"+ msg._id +"\')\"><img src=\""+ URLSERVER +"/img/"+ msg.image +"\"></div>");

				newMessage.find(".author").text(msg.author);
				newMessage.find(".date").text(new Date(msg.timestamp*1000));
				
				$( "#message-list" ).append( newMessage );
			  
			});
		  
		})
		
	},
	search : function() {
		
		var data = {};
		data.search = $("#search").val();
		
		$.ajax({
			type: 'POST',
		  url: URLSERVER +"/search",
		  data: JSON.stringify(data),
		  contentType: 'application/json',
		  context: document.body
		}).done(function(data) {
		  
		    $( "#message-list" ).empty();
			data.forEach(function(msg) {
				var newMessage = $( "#new-message" ).clone();
				newMessage.find(".message").replaceWith( "<div style=\"cursor: pointer\" class=\"mb-1 message\" onclick=\"App.goChapter(\'"+ msg._id +"\')\"><img src=\""+ URLSERVER +"/img/"+ msg.image +"\"></div>");

				newMessage.find(".author").text(msg.author);
				newMessage.find(".date").text(new Date(msg.timestamp*1000));
				
				$( "#message-list" ).append( newMessage );
			  
			});
		  
		})
		
	},
	goChapter: function (idBook) {
			
			$('.navbar1').show()
			$('#centerButton').show()
			
			$('.book-page').hide()
			
			$('.chapter-page').show()
			$('#mainContainer').waitMe({})
			
		$.ajax({
		  type: 'GET',
		  url: URLSERVER +"/get-chapters/"+ idBook,
		  async: false
		}).done(function(data) {
		  
			  var nodes = data.nodes
			  var edges = data.edges

			  
			  var container = document.getElementById('mynetwork');
			  var data = {
				nodes: nodes,
				edges: edges
			  };
			  
			  window.initGraph(idBook,data);
			  $('#mainContainer').waitMe("hide")
			  

		})
			
			
    },	
	
	
	openChapter: function () {
			if(this.checkToken()) {
				$("#summernote").summernote("reset");
				$('#newChapter').modal('show')
				$('.note-image-btn').prop("disabled", false);

			} else {
				$('#loginModal').modal('show')
				
			}
	},
	writeChapter : function(texto,from,to,image){
			/*if(!this.checkToken()) {
				$('#loginModal').modal('show')
				return
			}
			var iotoken = localStorage.getItem("iotoken");*/
		    		
					
					var data = {};
					data.texto = window.texto;
					data.chain = "ETH"//$( "#chain" ).val();
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
                        url: URLSERVER +'/write-link',
						headers: {"Authorization": "Bearer "+ localStorage.getItem('token')},					
                        success: function(data) {
                            
									//App.goChapter(rootBook)
							
                        }
                    }).done(function(data) {
						
						
			})
	},
	share: function(sn) {
		
		var node = nodes._data[rootBook]
		
		let url = 'http://myway.network:8080/?book='+ rootBook
		let title = node.title
		let description = node.txt.replace(/<[^>]*>/g, '')
		let image = 'http://myway.network:8080/img/ioio.png'
		
		
		if (sn == "facebook")
			App.shareFacebook(url, title,description, image)
	    else if (sn == "twitter")
			App.shareTwitter(url, title,description, image)
		else if (sn == "whatsapp")
			App.shareWhatsapp(url, title,description, image)

	},
	shareWhatsapp : function (overrideLink, overrideTitle, overrideDescription, overrideImage)
	{
		var url = "whatsapp://send?text="+ overrideLink
		window.open(url, '_blank');
	},
	shareTwitter : function (overrideLink, overrideTitle, overrideDescription, overrideImage)
	{
		var url = "http://twitter.com/share?text="+ overrideTitle +"&url="+ overrideLink +"&hashtags=ioio"
		window.open(url, '_blank');
	},
	shareFacebook: function (overrideLink, overrideTitle, overrideDescription, overrideImage)
	{
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
		function (response) {
		// Action after response
		});
	},
	centerBook : function(){
		
		var optionsx = {
			scale: 2,
			offset: {x:0,y:0},
			animation: {
			  duration: 1000,
			  easingFunction: "easeInOutQuad"
			}
		  };

		network.focus(rootBook, optionsx);
		
		network.moveTo({
			position: {x: -250, y: -480},
			offset: {x: 0, y: 0}
		})
	},
	updateNodesPosition : function() {
	
	    var chapters = []
		for (var key in nodes._data) {
			if (nodes._data.hasOwnProperty(key)) {
				
				var node = network.getPositions(key)
				var x = node[key].x
				var y = node[key].y
				var chapter = {"id": key, "x" : x, "y" : y}
				chapters.push(chapter)
				//console.log(key + " -> " + nodes._data[key]);
			}
		}
		
		var data = {"chapters" : chapters}
		
		
		$.ajax({
						type: 'POST',
						data: JSON.stringify(data),
				        contentType: 'application/json',
                        url: URLSERVER +'/updatePositionByBook',
						/* 	
						beforeSend: function (xhr) {   //Include the bearer token in header
								xhr.setRequestHeader("Authorization", 'Bearer '+ iotoken);
							} */					
                        success: function(data) {
                            
									//App.goChapter(rootBook)
							
                        }
                    }).done(function(data) {
						
						
			})
		
		
	
	}
};