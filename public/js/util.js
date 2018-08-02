    var nodes = null;
    var edges = null;
    var network = null;
    // randomly create some nodes and edges
    var data = [];
	var texto = ""
	var rootBook =""
	var dataImage = ""
    var actualPointer = {}
	var addChapter = false


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

	  
	  var dsoptions = {
		  physics: {
			  enabled: false
			},
		  nodes: {
		  shape: 'circularImage',
          borderWidth:4,
          size:30,
	      color: {
            border: '#406897',
            background: '#6AAFFF'
          },
          font:{color:'#eeeeee'},
          shapeProperties: {
            useBorderWithImage:true
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
              addNode: function (data, callback) {
                  // filling in the popup DOM elements
                  console.log('add', data);
              },
              editNode: function (data, callback) {
                  // filling in the popup DOM elements
                  console.log('edit', data);
              },
              addEdge: function (data, callback) {
                  console.log('add edge', data);
                  if (data.from == data.to) {
					  
					  return;
/*                       var r = confirm("Do you want to connect the node to itself?");
                      if (r === true) {
                          callback(data);
                      } */
                  }
                  else {
					  
					  //saveEdge(data)
					  data["arrows"] = {middle:{scaleFactor:0.5},to:true}
                      callback(data);
					  saveEdge(data)
                  }
                  // after each adding you will be back to addEdge mode
                  //network.addEdgeMode();
              }
          }};
	  
	  nodes = new vis.DataSet(story.nodes);
	  
	  var data = {
              nodes: nodes,
              edges: story.edges
          };
		  

	  
      network = new vis.Network(container, data, dsoptions);
	  
	  
		network.moveTo({
			position: {x: -250, y: -200},
			offset: {x: 0, y: 0},
			scale: 1,
		})
	  
      network.disableEditMode()
	  
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
		  /*
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
			
			*/
		  
	  });	  
	  


/* 	network.once('stabilized', function() {
		var scaleOption = { scale : 1.5 };
		network.moveTo(scaleOption);
		
	}) */
	  
	network.on("click", function (params) {
        params.event = "[original event]";
		actualPointer = params.pointer
        var selection = params.nodes;
        var clickedNode = nodes.get([selection])[0];
		
		if (addChapter) {
			$("#summernote").summernote("reset");
			$('#newChapter').modal('show')
			addChapter = false;
		} else {
		
		   if (clickedNode.proof != '') {
			
				toastr.options = {
				  "debug": false,
				  "positionClass": "toast-bottom-full-width",
				  "onclick": null,
				  "fadeIn": 300,
				  "fadeOut": 1000,
				  "timeOut": 5000,
				  "extendedTimeOut": 1000
				}
				
				toastr.success('<a href="'+ clickedNode.proof +'" target="_blank">Yo escribí esta historia</a>')
		   }
		}
    });  
	  

      var optionsx = {
        scale: 3,
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
		

    }

    function editNode(data, cancelAction, callback) {
      document.getElementById('summernote').value = data.label;
      //document.getElementById('node-saveButton').onclick = saveNodeData.bind(this, data, callback);
      //document.getElementById('node-cancelButton').onclick = cancelAction.bind(this, callback);
	  
	  $('#newChapter').modal('show')
	  $('.note-image-btn').prop("disabled", false);
	  $('.note-image-btn').blur(function() {
			$('.note-image-btn').prop("disabled", false);
	  });
		
      //document.getElementById('node-popUp').style.display = 'block';
    }

    // Callback passed as parameter is ignored
    function clearNodePopUp() {
      //document.getElementById('node-saveButton').onclick = null;
      //document.getElementById('node-cancelButton').onclick = null;
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
				  $('#mainContainer').waitMe({})
	  			  $('#uploadChapter').modal('show')
				  $( "#thetext" ).replaceWith( "<div id='thetext'>"+ data.label +"</div>");

	  

	  var el = document.getElementById("test");
	  
	    setTimeout(function(){
			html2canvas(el).then(canvas => {
					var dataURL = canvas.toDataURL("image/png")
					dataImage = dataURL
					
					$('#uploadChapter').modal('toggle');
					$('#mainContainer').waitMe("hide")
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
	  
	  
	  //Mine First to do this
	  App.writeChapter("",from,to,dataImage)
	  

	  
	  
	  data["arrows"] = {middle:{scaleFactor:0.5},to:true}
      callback(data);
    }

    function initGraph(root,book) {
	  rootBook = root
	  data = book

      draw(book);
    }
	
	function addNode() {
		
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
					
		  });
		},500);
		
		

    }
	
	function saveEdge(data) {
	
	var from = data.from
	var to = data.to

      if (typeof data.to === 'object')
        data.to = data.to.id
      if (typeof data.from === 'object')
        data.from = data.from.id
      data.label = '';//document.getElementById('edge-label').value;
      clearEdgePopUp();
	  

	  App.writeChapter("",from,to)
	  network.disableEditMode()

	  
    }

	
	
		function newChapter() {
			toastr.options = {
			  "debug": false,
			  "positionClass": "toast-top-full-width",
			  "onclick": null,
			  "fadeIn": 300,
			  "fadeOut": 1000,
			  "timeOut": 5000,
			  "extendedTimeOut": 1000
			}
			
			toastr.info('Haga click en algún punto de la pantalla para escribir')
			addChapter = true;
			
		}
		
		function newCon() {
			
			toastr.options = {
			  "debug": false,
			  "positionClass": "toast-top-full-width",
			  "onclick": null,
			  "fadeIn": 300,
			  "fadeOut": 1000,
			  "timeOut": 5000,
			  "extendedTimeOut": 1000
			}
			toastr.info('Selecciona una historia y conectala con otra')
			network.addEdgeMode();
			
		}