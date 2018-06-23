    var nodes = null;
    var edges = null;
    var network = null;
    // randomly create some nodes and edges
    var data = [];
	var texto = ""
	var rootBook =""
	var dataImage = ""



    function destroy() {
      if (network !== null) {
        network.destroy();
        network = null;
      }
    }

    function draw(story) {
      destroy();
      nodes = [];
      edges = [];

      // create a network
      var container = document.getElementById('mynetwork');
      var options = {  
	 
        nodes: {
          borderWidth:4,
          size:30,
	      color: {
            border: '#406897',
            background: '#6AAFFF'
          },
          font:{color:'#eeeeee'},
          shapeProperties: {
            useBorderWithImage:true
          },
			"scaling": {
			  "min": 46,
			  "max": 83
			}
        },
        edges: {
             "color": {
			  "color": "rgba(85,58,132,1)",
			  "inherit": false
			}
        },
    
        manipulation: {
          addNode: function (data, callback) {
            // filling in the popup DOM elements
			$('#summernote').summernote("reset")
            //document.getElementById('node-operation').innerHTML = "Add Story";
            editNode(data, clearNodePopUp, callback);
          },
          editNode: function (data, callback) {
            // filling in the popup DOM elements
            document.getElementById('node-operation').innerHTML = "Edit Story";
            editNode(data, cancelNodeEdit, callback);
          },
          addEdge: function (data, callback) {
            if (data.from == data.to) {
              var r = confirm("Do you want to connect the node to itself?");
              if (r != true) {
                callback(null);
                return;
              }
            }
            document.getElementById('edge-operation').innerHTML = "Conectar";
            editEdgeWithoutDrag(data, callback);
          },
          editEdge: {
            editWithoutDrag: function(data, callback) {
              document.getElementById('edge-operation').innerHTML = "Editar Conexion";
              editEdgeWithoutDrag(data,callback);
            }
          }
        }
      };
	  
	  
      network = new vis.Network(container, story, options);
	  
	  network.on("beforeDrawing", function (ctx) {
		var nodeId = rootBook;
		var nodePosition = network.getPositions([nodeId]);
		ctx.strokeStyle = '#A6D5F7';
		ctx.fillStyle = '#294475';
		ctx.circle(nodePosition[nodeId].x, nodePosition[nodeId].y,50);
		ctx.fill();
		ctx.stroke();
	  });

	  network.on("afterDrawing", function (ctx) {
	      document.body.scrollTop = 0; // For Safari
		  document.documentElement.scrollTop = 0;
		  
		  			$('#viewport').attr('content', 'width=device-width, initial-scale=0.9');
					try {
					var scale = 'scale(0.9)';
					 document.body.style.webkitTransform = scale      // Chrome, Opera, Safari
					 document.body.style.msTransform =   scale       // IE 9
					 document.body.style.transform = scale; 
					}
					catch(err) {
					   console.log(err)
					}

		  
	  });	  
	  


	network.once('stabilized', function() {
		var scaleOption = { scale : 1.5 };
		network.moveTo(scaleOption);
	})
	  
	network.focus(rootBook)
	
 	network.on( 'click', function(properties) {
/* 		setTimeout(function(){ 

			  $(".vis-label")[0].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-pencil' aria-hidden='true'>&nbsp;Write</span>"
			  $(".vis-label")[1].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-link' aria-hidden='true'>&nbsp;Connect</span>"
			  $('.vis-edit').hide()
			  $('.vis-delete').hide()
			  $(".vis-manipulation").css("height", "100px");
			  $(".vis-add").css("height", "70px");
			  $(".vis-add").css("width", "45%");
			  $(".vis-connect").css("height", "70px");
			  $(".vis-connect").css("width", "45%");
			  $(".vis-separator-line").css("height", "100px");

		}, 100); */
	}); 

 	network.on( 'selectNode', function(properties) {
		return;
	});	
	
	  

/* 	  $(".vis-label")[0].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-pencil' aria-hidden='true'>&nbsp;Write</span>"
	  $(".vis-label")[1].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-link' aria-hidden='true'>&nbsp;Connect</span>"
	  $(".vis-manipulation").css("height", "100px");
	  $(".vis-add").css("height", "70px");
	  $(".vis-add").css("width", "45%");
	  $(".vis-connect").css("height", "70px");
	  $(".vis-connect").css("width", "45%");
	  $(".vis-separator-line").css("height", "100px"); */
	  
	  

	  //$('.vis-button.vis-edit.vis-edit-mode').trigger( "pointerdown" );
	  //$('.vis-button.vis-edit.vis-edit-mode').trigger( "pointerdown" );
    }

    function editNode(data, cancelAction, callback) {
      document.getElementById('summernote').value = data.label;
      document.getElementById('node-saveButton').onclick = saveNodeData.bind(this, data, callback);
      document.getElementById('node-cancelButton').onclick = cancelAction.bind(this, callback);
	  
	  $('#newChapter').modal('show')
	  $('.note-image-btn').prop("disabled", false);
	  $('.note-image-btn').blur(function() {
			$('.note-image-btn').prop("disabled", false);
	  });
		
      //document.getElementById('node-popUp').style.display = 'block';
    }

    // Callback passed as parameter is ignored
    function clearNodePopUp() {
      document.getElementById('node-saveButton').onclick = null;
      document.getElementById('node-cancelButton').onclick = null;
	  $('#newChapter').modal('hide')
      //document.getElementById('node-popUp').style.display = 'none';
    }

    function cancelNodeEdit(callback) {
      clearNodePopUp();
      callback(null);
    }

    function saveNodeData(data, callback) {
		
	  data.label = document.getElementById('summernote').value;
	  
				  $('#newChapter').modal('hide')
	  			  $('#uploadChapter').modal('show')
				  $( "#thetext" ).replaceWith( "<div id='thetext'>"+ data.label +"</div>");
				  //$( "#thetext" ).replaceWith( data.label );
	  
/* 				   setTimeout(function(){ 

						  $(".vis-label")[0].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-pencil' aria-hidden='true'>&nbsp;Write</span>"
						  $(".vis-label")[1].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-link' aria-hidden='true'>&nbsp;Connect</span>"
						  $('.vis-edit').hide()
						  $('.vis-delete').hide()
						  $(".vis-manipulation").css("height", "100px");
						  $(".vis-add").css("height", "70px");
						  $(".vis-add").css("width", "45%");
						  $(".vis-connect").css("height", "70px");
						  $(".vis-connect").css("width", "45%");
						  $(".vis-separator-line").css("height", "100px");

					}, 1000); */
	  

	  var el = document.getElementById("test");
	  
	    setTimeout(function(){
			html2canvas(el).then(canvas => {
					var dataURL = canvas.toDataURL("image/png")
					dataImage = dataURL
					
					$('#uploadChapter').modal('toggle');
					  $( "#thetext" ).replaceWith( "<div id='thetext'></div>");
					
					  book	= App.writeTmp(dataImage, data.label) //Evento asyncronico, Manejarlo
		  
					  texto = data.label
					  clearNodePopUp();
					  data["image"] = URLSERVER +'/img/'+ book.image
					  data["shape"] = 'image'
					  data["label"] = ''
					  data["id"] = book.id
					 
					$('#viewport').attr('content', 'width=device-width, initial-scale=0.9');
					try {
					var scale = 'scale(0.9)';
					 document.body.style.webkitTransform = scale      // Chrome, Opera, Safari
					 document.body.style.msTransform =   scale       // IE 9
					 document.body.style.transform = scale; 
					}
					catch(err) {
					   console.log(err)
					}
										  
					callback(data);
					
					
		  });
		},500);

    }

    function editEdgeWithoutDrag(data, callback) {
      // filling in the popup DOM elements
      saveEdgeData(data, callback)
	  //document.getElementById('edge-label').value = data.label;
      //document.getElementById('edge-saveButton').onclick = saveEdgeData.bind(this, data, callback);
      //document.getElementById('edge-cancelButton').onclick = cancelEdgeEdit.bind(this,callback);
      //document.getElementById('edge-popUp').style.display = 'block';
    }

    function clearEdgePopUp() {
      document.getElementById('edge-saveButton').onclick = null;
      document.getElementById('edge-cancelButton').onclick = null;
      document.getElementById('edge-popUp').style.display = 'none';
    }

    function cancelEdgeEdit(callback) {
      clearEdgePopUp();
      callback(null);
    }

    function saveEdgeData(data, callback) {
	
	var from = data.from
	var to = data.to

      if (typeof data.to === 'object')
        data.to = data.to.id
      if (typeof data.from === 'object')
        data.from = data.from.id
      data.label = '';//document.getElementById('edge-label').value;
      clearEdgePopUp();
	  
	  //App.writeChapter(texto,from,to)
	  
	  //Mine First to do this
	  App.writeChapter("",from,to,dataImage)
	  
/* 	  setTimeout(function(){ 

			  $(".vis-label")[0].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-pencil' aria-hidden='true'>&nbsp;Write</span>"
			  $(".vis-label")[1].innerHTML = "<span style='font-size: 45px;' class='glyphicon glyphicon-link' aria-hidden='true'>&nbsp;Connect</span>"
			  $('.vis-edit').hide()
			  $('.vis-delete').hide()
			  $(".vis-manipulation").css("height", "100px");
			  $(".vis-add").css("height", "70px");
			  $(".vis-add").css("width", "45%");
			  $(".vis-connect").css("height", "70px");
			  $(".vis-connect").css("width", "45%");
			  $(".vis-separator-line").css("height", "100px");

		}, 500); */
	  
	  
	  data["arrows"] = {middle:{scaleFactor:0.5},to:true}
      callback(data);
    }

    function initGraph(root,book) {
	  rootBook = root
	  data = book

      draw(book);
    }