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
                        url: 'http://localhost/register',						
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
			/*
			if(this.checkToken()) {
				$("#summernote-root").summernote("reset");
				$('#newStory').modal('show')
			} else {
				$('#loginModal').modal('show')
			}*/
    },
	writeTmp : function(dataURL){
		
		
		var data = {};
		var id = ""
		data.image = dataURL
		
						async.seq(
						function(callback) {
									$.ajax({
										type: 'POST',
										data: JSON.stringify(data),
										contentType: 'application/json',
										url: 'http://localhost/write-tmp',
										async: false,
										success: function(dat) { callback(dat) }
									})
							
						}
					)(function( dat, err) {
						id = dat.id;
					});
		
		return id;
		
/* 		var id = "";
		$.when(function ajax1() {

			return 	$.ajax({
										type: 'POST',
										data: JSON.stringify(data),
										contentType: 'application/json',
										url: 'http://localhost/write-tmp',
										async: false,
										success: function(data) { return data }
									})
		}).done(function(data){
			
			return data.id;
			
		}); */
		
/* 		$.ajax({
										type: 'POST',
										data: JSON.stringify(data),
										async: false,
										contentType: 'application/json',
										url: 'http://localhost/write-tmp',
										success: function(data) { 
											return data.id; 
										}
									}) */

		
	},
	write: function () {
		
/* 			if(!this.checkToken()) {
				$('#loginModal').modal('show')
				return
			} */
			
				  var label = document.getElementById('summernote-root').value;
				  
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
									url: 'http://localhost/write-root',
									/* 	
									beforeSend: function (xhr) {   //Include the bearer token in header
											xhr.setRequestHeader("Authorization", 'Bearer '+ iotoken);
										} */					
									success: function(data) {
										
										$('#uploadRoot').modal('toggle');
										$( "#thetext-root" ).replaceWith( "<div id='thetext-root'></div>");
										$('#newStory').modal('toggle');
										
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
		  url: "http://localhost/get-books",
		  context: document.body
		}).done(function(data) {
		  
		    $( "#message-list" ).empty();
			data.forEach(function(msg) {
				var newMessage = $( "#new-message" ).clone();
				newMessage.find(".message").replaceWith( "<div class=\"mb-1 message\" onclick=\"App.goChapter(\'"+ msg._id +"\')\"><img src=\"http://localhost/img/"+ msg.image +"\"></div>");

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
		  url: "http://localhost/get-chapters/"+ idBook,
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
                        url: 'http://localhost/write-chapter',
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