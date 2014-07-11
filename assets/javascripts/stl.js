function _stl(id) {
 
   // About object is returned if there is no 'id' parameter
   var about = {
      Version: 0.1,
      Author: "Shashi Jain",
      Created: "Dec 2013",
      Updated: "12/9/2013"
   };

   var camera, scene, renderer, geometry, material, mesh, light1, stats, rangle, bg, color, stats, controls, hint = null;

   if (id) {
 
      // Avoid clobbering the window scope:
      // return a new _ object if we're in the wrong scope
      if (window === this) {
         return new _stl(id);
      }
 
      // We're in the correct object scope:
      // Init our element object and return the object
      this.e = document.getElementById(id);
      return this;
   } else {
      // No 'id' parameter was given, return the 'about' object
      return about;
   }

};

/* _ Prototype Functions
============================*/
_stl.prototype = {
   //Downloads new file, parses and animates
   //To Do: Specify ASCII/Binary, detect if ascii/binary (stream first few bytes?)
   init: function (file, color, hint) {

      //Detector.addGetWebGLMessage();

      //**** Initialize object variables
       this.setrot(0);
       this.setcolor(color);
       this.setbg(0xeeeeee);
       this.hint = hint;

       //**** Initialize Scene
       this.scene = new THREE.Scene();

       //**** Initialize Camera
       this.camera = new THREE.PerspectiveCamera( 75, this.e.offsetWidth / this.e.offsetHeight, 1, 10000 );
       this.camera.position.z = 200;
       this.camera.position.y = 200;
       this.camera.lookAt( this.scene.position );
       this.scene.add( this.camera );

       //**** Initialize Lighting
       var directionalLight = new THREE.DirectionalLight( 0xffffff );
       directionalLight.position.x = 1; 
       directionalLight.position.y = 1; 
       directionalLight.position.z = 1; 
       directionalLight.position.normalize();


       //**** Add camera and lighting to scene
       this.scene.add( directionalLight );

       //**** Prepare to load file using XHR
       var xhr = new XMLHttpRequest();
       var self=this;
       xhr.onreadystatechange = function () {
            stateChangeCallback(self);
       }

       //**** Callback for XHR file load request
       function stateChangeCallback(client) {
           if ( xhr.readyState == 4 ) {
               if ( xhr.status == 200 || xhr.status == 0 ) {
                   var rep = xhr.response; // || xhr.mozResponseArrayBuffer;
//                   console.log(rep);
//                   alert(rep);
                    if (client.hint == 'binary')
                      client.mesh = parseStlBinary(rep, client.color);
                    else if (client.hint =='ascii') {
                      client.mesh = parseStl(rep, client.color);
                    }
                    else if (is_binary(rep)) {
                      client.mesh = parseStlBinary(rep, client.color);
                    }
                    else {
                      var x = ab2str(rep);
                      client.mesh = parseStl(x, client.color);
                    }
                   //client.mesh.material.wireframe = true;
                   //client.mesh = parseStl(xhr.responseText);

                   //Center the geometry of the mesh, each time
                   THREE.GeometryUtils.center( client.mesh.geometry );
                   //Bring the object to the origin in the vertical direction
                   client.mesh.position.y = client.mesh.geometry.boundingBox.max.z;0;
                   client.mesh.rotation.x = -Math.PI / 2;

                   console.log('done parsing');
                   client.scene.add(client.mesh);                 
               }
           }
       }

       //**** Callback for errors in XHR file load
       xhr.onerror = function(e) {
           console.log(e);
       }
       
       //**** Make XHR call to load file (passed into init)
       if (hint == 'binary' || hint == undefined) {
          //     Uncomment this for BINARY STL
          xhr.responseType = "arraybuffer";
       };

       xhr.open( "GET", file, true );

       //     xhr.setRequestHeader("Accept","text/plain");
       //     xhr.setRequestHeader("Content-Type","text/plain");
       //     xhr.setRequestHeader('charset', 'x-user-defined');
       xhr.send( null );


      //**** Initialize a "build plane"
      //     To add a texture, need these lines
      //var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
      //floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
      //floorTexture.repeat.set( 10, 10 );
      //     DoubleSide: render texture on both sides of mesh
      var floorMaterial = new THREE.MeshBasicMaterial( { color: 0xabcdef, wireframe:true, side: THREE.DoubleSide } );
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(300, 300,10,10), floorMaterial);
      plane.position.y = -0.5;
      plane.rotation.x = Math.PI / 2;
      this.scene.add(plane);


       //**** Initialize Renderer
       this.renderer = new THREE.WebGLRenderer( ); //new THREE.CanvasRenderer();
       //     set background to neutral grey
       this.renderer.setClearColor(this.getbg(),1);
       //     fill the parent element
       this.renderer.setSize( this.e.offsetWidth, this.e.offsetHeight );

       //**** Add mouse and zoom controls to our window
       this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

       //**** Add Listeners for mouse events to change rate of rotation on mouseover
       this.e.addEventListener("mouseover", function() {self.setrot(0);}, false);
       this.e.addEventListener("mouseout", function() {self.setrot(0.02);}, false);

       //     Add renderer to the element we're attached to
       this.e.appendChild( this.renderer.domElement );

       //**** Add statistics pane to same element
       //this.stats = new Stats();
       //this.stats.domElement.style.position = 'left';
       //this.stats.domElement.style.top = '0px';
       //this.stats.domElement.style.zIndex = 100;
       //this.e.appendChild(this.stats.domElement);

       //**** Animate Immediately. Make this optional?
       this.animate();
   },
   animate: function() {
       requestAnimationFrame( this.animate.bind(this) );
       this.render();
       //this.stats.update();
       this.controls.update();
   },
   render: function() {
       if (this.mesh) {
         //Rotate as we render
         this.mesh.rotation.z += this.getrot();
         THREE.GeometryUtils.center( this.mesh.geometry );
      }
      //light1.position.z -= 1;

      this.renderer.render( this.scene, this.camera );  
   },
   setrot: function(angle) {
      //Rangle determines direction (+ for right, - for left) and speed (angles per step) of rotation
      //default to zero rotation.
      var defaultangle = 0.02;
      if (typeof angle !== 'undefined') {
         this.rangle = angle;
      }
      else {
            this.rangle = defaultangle;
       }
      //console.log("setrot" + this.rangle+angle);  
       return this.rangle;
   },
   getrot: function() {
      //console.log("getrot" + this.rangle);
      return this.rangle;
   },
   setcolor: function(color) {
      //Set Model default color, if that information is not in the file
      //To Do: read in color information from STL (currently skips)
      var defaultcolor = 0xabcdef;
      if (typeof color !== 'undefined') {
         this.color = color;
       }
      else {
            this.color = defaultcolor;
       } 
   },
   getcolor: function() {
      return this.color;
   },
   setbg: function(color) {
      //Set Model default color, if that information is not in the file
      //To Do: read in color information from STL (currently skips)
      var defaultcolor = 0xeeeeee;
      if (typeof color !== 'undefined') {
         this.bg = color;
       }
      else {
            this.bg = defaultcolor;
       } 
   },
   getbg: function() {
      return this.bg;
   }
};

// Notes:
// - STL file format: http://en.wikipedia.org/wiki/STL_(file_format)
// - 80 byte unused header
// - All binary STLs are assumed to be little endian, as per wiki doc
function parseStlBinary (stl, color) {
 var geo = new THREE.Geometry();
 var dv = new DataView(stl, 80); // 80 == unused header
 var isLittleEndian = true;
 var triangles = dv.getUint32(0, isLittleEndian); 

 // console.log('arraybuffer length:  ' + stl.byteLength);
 // console.log('number of triangles: ' + triangles);

 var offset = 4;
 for (var i = 0; i < triangles; i++) {
     // Get the normal for this triangle
     var normal = new THREE.Vector3(
         dv.getFloat32(offset, isLittleEndian),
         dv.getFloat32(offset+4, isLittleEndian),
         dv.getFloat32(offset+8, isLittleEndian)
     );
     offset += 12;

     // Get all 3 vertices for this triangle
     for (var j = 0; j < 3; j++) {
         geo.vertices.push(
             new THREE.Vector3(
                 dv.getFloat32(offset, isLittleEndian),
                 dv.getFloat32(offset+4, isLittleEndian),
                 dv.getFloat32(offset+8, isLittleEndian)
             )
         );
         offset += 12;
     }

     // there's also a Uint16 "attribute byte count" that we
     // don't need, it should always be zero.
     offset += 2;   

     // Create a new face for from the vertices and the normal             
     geo.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2, normal));
 }

 // The binary STL I'm testing with seems to have all
 // zeroes for the normals, unlike its ASCII counterpart.
 // We can use three.js to compute the normals for us, though,
 // once we've assembled our geometry. This is a relatively 
 // expensive operation, but only needs to be done once.
 geo.computeFaceNormals();

 mesh = new THREE.Mesh( 
     geo,
     // new THREE.MeshNormalMaterial({
     //     overdraw:true
     // }
     new THREE.MeshLambertMaterial({
         overdraw:true,
         ambient: 0xff0000,
         color: color,
         shading: THREE.FlatShading
     }
 ));
 stl=null;
 return mesh;
};

function trim(str) {
    str = str.replace(/^\s+/, '');
    for (var i = str.length - 1; i >= 0; i--) {
        if (/\S/.test(str.charAt(i))) {
            str = str.substring(0, i + 1);
            break;
        }
    }
    return str;
};


var parseStl = function(stl, color) {
    var state = '';
    var lines = stl.split('\n');
    var geo = new THREE.Geometry();
    var name, parts, line, normal, done, vertices = [];
    var vCount = 0;
    stl = null;

    for (var len = lines.length, i = 0; i < len; i++) {
        if (done) {
            break;
        }
        line = trim(lines[i]);
        parts = line.split(' ');
        switch (state) {
            case '':
                if (parts[0] !== 'solid') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "solid"');
                    return;
                } else {
                    name = parts[1];
                    state = 'solid';
                }
                break;
            case 'solid':
                if (parts[0] !== 'facet' || parts[1] !== 'normal') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "facet normal"');
                    return;
                } else {
                    normal = [
                        parseFloat(parts[2]), 
                        parseFloat(parts[3]), 
                        parseFloat(parts[4])
                    ];
                    state = 'facet normal';
                }
                break;
            case 'facet normal':
                if (parts[0] !== 'outer' || parts[1] !== 'loop') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "outer loop"');
                    return;
                } else {
                    state = 'vertex';
                }
                break;
            case 'vertex': 
                if (parts[0] === 'vertex') {
                    geo.vertices.push(new THREE.Vector3(
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ));
                } else if (parts[0] === 'endloop') {
                    geo.faces.push( new THREE.Face3( vCount*3, vCount*3+1, vCount*3+2, new THREE.Vector3(normal[0], normal[1], normal[2]) ) );
                    vCount++;
                    state = 'endloop';
                } else {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "vertex" or "endloop"');
                    return;
                }
                break;
            case 'endloop':
                if (parts[0] !== 'endfacet') {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "endfacet"');
                    return;
                } else {
                    state = 'endfacet';
                }
                break;
            case 'endfacet':
                if (parts[0] === 'endsolid') {
                    //mesh = new THREE.Mesh( geo, new THREE.MeshNormalMaterial({overdraw:true}));
                    mesh = new THREE.Mesh( 
                        geo, 
                        new THREE.MeshLambertMaterial({
                            overdraw:true,
                            color: color,
                            shading: THREE.FlatShading
                        }
                    ));
                    //scene.add(mesh);
                    done = true;
                } else if (parts[0] === 'facet' && parts[1] === 'normal') {
                    normal = [
                        parseFloat(parts[2]), 
                        parseFloat(parts[3]), 
                        parseFloat(parts[4])
                    ];
                    if (vCount % 1000 === 0) {
                        console.log(normal);
                    }
                    state = 'facet normal';
                } else if (parts[0] === '') {
                    // console.log("blank line in STL") -> throw this line out
                } else {
                    console.error(line);
                    console.error('Invalid state "' + parts[0] + '", should be "endsolid" or "facet normal"');
                    return;
                }
                break;
            default:
                console.error('Invalid state "' + state + '"');
                return;
        }
    }

    return mesh;
};

var is_binary = function(stl) {
  var dv = new DataView(stl); // 80 == unused header
  var str1="";

  for (var i = 0; i < 5; i++) {
      bit = dv.getUint8(i);
      str1 += String.fromCharCode(bit);
      //str2 += bit.toString(16)+".";
  }
  if (str1 == "solid" || str1 == "Solid")
    return false;
  else
    return true;
};

function ab2str(buf) {
  var binaryString = "";
  bytes = new Uint8Array(buf);
  length = bytes.length;
  for (var i = 0; i < length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  binaryString= binaryString.substring(0, binaryString.length - 1);
  return binaryString;
}