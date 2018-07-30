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
		
		localStorage.setItem("myway-pk", "mrwZvPf4KF2vNCrHPrucZoSvo33Ywfg6kn");
		var mywaypk = localStorage.getItem("myway-pk")
		$('#qrcode').qrcode(mywaypk);
		$('#payment').modal('show');
		
		
		
	},
	paymentSent : function() {
		
				    var data = {};
					data.author = "andrs";
					var texto = document.getElementById('summernote').value;
					data.texto = texto.replace(/<[^>]*>/g, '');
					
					$.ajax({
						type: 'POST',
						data: JSON.stringify(data),
				        contentType: 'application/json',
                        url: URLSERVER +'/checkPayment',						
                        success: function(data) {
                            $('#loginModal').modal('toggle');
                    		
							
                        }
                    }).done(function(data) {
						localStorage.setItem('iotoken', data.token);
						
						
					  })
		
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
										async: false,
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
				  
				  $('#newStory').modal('toggle');
				  $('#uploadRoot').modal('show')
				  $('#mainContainer').waitMe({})
				  $( "#thetext-root" ).replaceWith( " <div id='thetext-root' ><div id='thetext-root' style='margin: 25px;'>"+ label +"</div></div>");
				  
				  var el = document.getElementById("test-root");
				  
				    setTimeout(function(){
					  html2canvas(el).then(canvas => {
						  
								var dataURL = canvas.toDataURL("image/png")
								var iotoken = localStorage.getItem("iotoken");
								var data = {};
								data.texto = label;
								data.image = dataURL
								data.chain = "ETH"//$( "#chain" ).val();
								
								
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

				//newMessage.find(".author").text(msg.author);
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

				//newMessage.find(".author").text(msg.author);
				newMessage.find(".date").text(new Date(msg.timestamp*1000));
				
				$( "#message-list" ).append( newMessage );
			  
			});
		  
		})
		
	},
	goChapter: function (idBook) {
			
			
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