window.App = {
	
	checkLogin: function () {

			if(this.checkToken()) {
				console.log("Estamos")
			} else {
				$('#loginModal').modal('show');
				console.log("Go Login")
			}
	
    },
	
	checkToken: function () {
		var token = localStorage.getItem('iotoken');
		if (!token)
			return false;
		else
			return true;
    },
	
	register: function () {

		    		var data = {};
					data.author = $( "#rnickname" ).val();
					data.mail = $( "#remail" ).val();
					data.password = $( "#rpass" ).val();
					
					$.ajax({
						type: 'POST',
						data: JSON.stringify(data),
				        contentType: 'application/json',
                        url: URLSERVER +'/register',						
                        success: function(data) {
                            $('#loginModal').modal('toggle');
                    		
							
                        }
                    }).done(function(data) {
						localStorage.setItem('iotoken', data.token);
						
						
					  })
					  .fail(function(err) {
						console.log(err);
					});
	
    },
	openWrite: function () {
		
			$("#summernote-root").summernote("reset");
			$('#newStory').modal('show')
			$('.note-image-btn').prop("disabled", false);
			/*
			if(this.checkToken()) {
				$("#summernote-root").summernote("reset");
				$('#newStory').modal('show')
			} else {
				$('#loginModal').modal('show')
			}*/
    },
	writeTmp : function(dataURL, texto){
		
		
		var data = {}
		var result = {}
		data.image = dataURL
		data.texto = texto
		data.root = rootBook
		
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
				  $( "#thetext-root" ).replaceWith( "<div id='thetext-root'></div>");
				  $( "#thetext-root" ).replaceWith( label );
				  
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
									/* 	
									beforeSend: function (xhr) {   //Include the bearer token in header
											xhr.setRequestHeader("Authorization", 'Bearer '+ iotoken);
										} */					
									success: function(data) {
										
										$('#uploadRoot').modal('toggle');
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
				newMessage.find(".date").text(msg.txid);
				
				$( "#message-list" ).append( newMessage );
			  
			});
		  
		})
		
	},
	goChapter: function (idBook) {
			$('.book-page').hide()
			$('.chapter-page').show()
			
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
                            
									App.goChapter(rootBook)
							
                        }
                    }).done(function(data) {
						
						
			})
	}
	
};