'use strict';
var express = require('express');
var router = express.Router();

// GET LOCAL IP ADDRESS FOR STREAMING
var IPaddress =""; 
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  console.log('addr: '+add);
  IPaddress = add;
})

router.get('/ipaddress', function(req, res) {
  res.json(IPaddress);
  console.log("ip address sent");
  console.log(IPaddress);
});

//=====================================================
// define trees locations using treeslocs.json
//=====================================================
var fs = require('fs');
//var chaine = fs.readFileSync('/home/drougard/driving-human-robots-interaction/treeslocs.json', 'UTF-8');
var chaine = fs.readFileSync('../driving-human-robots-interaction/treeslocs.json', 'UTF-8');
var treeslocations = JSON.parse(chaine);
console.log('TREES LOCATIONS');
console.log(treeslocations[0].x);
router.get('/', function(req, res) {
  res.json(chaine);
});

//=====================================================
// define zones locations using zones.json
//=====================================================
//var chaine2 = fs.readFileSync('/home/drougard/driving-human-robots-interaction/zones.json', 'UTF-8');
var chaine2 = fs.readFileSync('../driving-human-robots-interaction/zones.json', 'UTF-8');
var zoneslocations = JSON.parse(chaine2);
console.log('ZONES LOCATIONS');
console.log(zoneslocations[0].x);
router.get('/zones', function(req, res) {
  res.json(chaine2);
});




// declare intervals
var waterManagementInterval;
var leaksInterval;
var waterFlowInterval;
var timeInterval;
var batteryInterval;
var treeBurningInterval;
var fillWaterInterval;
var fillBatteryInterval;

var autonomyInterval;

// declare variables
var xrobinet = 42;
var mercurelevelfloat = 10;
var mercurelevel = '0.1vw';
var hotscreen = 0;
var firesStatesOfTrees = [];
for(var i=0; i<treeslocations.length;i++) {
  firesStatesOfTrees.push(false);
}
var watlevel = 50;
var robotTankEmpty = false;
var isFillingWater = false;

var crossSize = 0;
var leakPlacesNb = 12;
var leakPlaces = [];
var noleakat = [];
var leakCounter = 0;
for (var i=0; i<leakPlacesNb; i++) {
  leakPlaces.push(leakCounter);
  leakCounter++;
  noleakat.push(true);
}
var vlvop = 1;
var watlevelContainer = 0;
var remainingtime = 600;
var batteryLevel = 24;
var numFightedFires = 0;


router.post('/killall', killall); // kill morse, + init js
router.post('/start',start); // launch morse
router.post('/launchgame',launchgame); // launch js

var sys = require('sys');
var exec = require('child_process').exec;

function killall(req, res) {
  if(req.body.token) {
    var decoded = jwt.decode(req.body.token, secret);
    console.log(decoded);
    if(decoded.auth && decoded.exp === global.expires){
      exec('bash ~/driving-human-robots-interaction/killAll.sh');
      xrobinet = 42;
      mercurelevelfloat = 10;
      mercurelevel = '0.1vw';
      hotscreen = 0;
      firesStatesOfTrees = [];
      for(var i=0; i<treeslocations.length;i++) {
        firesStatesOfTrees.push(false);
      }
      watlevel = 50;
      robotTankEmpty = false;
      isFillingWater = false;
      crossSize = 0;
      leakPlacesNb = 12;
      leakPlaces = [];
      noleakat = [];
      leakCounter = 0;
      for (var i=0; i<leakPlacesNb; i++) {
        leakPlaces.push(leakCounter);
        leakCounter++;
        noleakat.push(true);
      }
      vlvop = 1;
      watlevelContainer = 0;
      remainingtime = 600;
      batteryLevel = 24;
      numFightedFires = 0;

      // clear intervals 
      clearInterval(waterManagementInterval);
      clearInterval(leaksInterval);
      clearInterval(waterFlowInterval);
      clearInterval(timeInterval);
      clearInterval(batteryInterval);
      clearInterval(treeBurningInterval);
      clearInterval(fillWaterInterval);
      clearInterval(fillBatteryInterval);

      clearInterval(autonomyInterval);

      res.status(200).json("everything killed")
    }
    else{
      res.status(401).json("Invalid token");
    }
  }
  else{
    res.status(401).json("No token");
  }
}

function start(req, res) {
  if(req.body.token) {
    var decoded = jwt.decode(req.body.token, secret);
    console.log(decoded);
    if(decoded.auth && decoded.exp === global.expires){
      exec('bash ~/driving-human-robots-interaction/killall.sh');
      exec('bash ~/driving-human-robots-interaction/restart.sh');
      res.status(200).json("restart");
    }
    else{
      res.status(401).json("Invalid token");
    }
  }
  else{
    res.status(401).json("No token given");
  }
}




//=====================================================
// get position/orientation from orocos
//=====================================================

var PORT = 9000;
var PORTGET = 9010;
var HOST = 'localhost'; // TODO real address
var dgram = require('dgram');
var serverGet = dgram.createSocket('udp4');
serverGet.on('listening', function() {
  var address = serverGet.address();
  console.log('UDP Server listening on ' + address.address + ':' + address.port);
});
var robotx = 0.0;
var roboty = 0.0;
var roboto = 0.0;
var pastRobotx = 0.0;
var pastRoboty = 0.0;
var counter = 0;
//var thecounter = 0;
var currentAutoMvt = false;

serverGet.on('message', function(message, remote) {

  pastRobotx = robotx;
  pastRoboty = roboty;

  var byteArray = new Int8Array(4);
  for(var i = 0; i < 4; i++) {
    byteArray[i] = message[8 + 6 * 4 + i];
  }
  var posY = new Float32Array(byteArray.buffer);

  var byteArray2 = new Int8Array(4);
  for(var j = 0; j < 4; j++) {
    byteArray2[j] = message[8 + 7 * 4 + j];
  }
  var posX = new Float32Array(byteArray2.buffer);

  var byteArray3 = new Int8Array(4);
  for(var k = 0; k < 4; k++) {
    byteArray3[k] = message[8 + 8 * 4 + k];
  }
  var orientation = new Float32Array(byteArray3.buffer);
  
  var byteArray4 = new Int8Array(2);
  for(var l = 0; l < 2; l++) {
    byteArray4[l] = message[8 + 50 * 4 + IND_ENDGOTO*2 + l];
  }
  var noMvt = new Int16Array(byteArray4.buffer);

  if(false) {
    console.log(remote.address + ':' + remote.port + ' - ' + posX + '  ' + posY + '  ' + orientation + '  ' + noMvt);
  }
  robotx = posX;
  roboty = posY;
  roboto = orientation;

  
// AVOIDTREES // TODO may put it in "autonomous robot" part (interval)
// TODO en tout cas signaler quand abort pour continuer le process autonome
  if(autonomousRobot==1) {

    var vectorRobotX = Math.cos(roboto);
    var vectorRobotY = Math.sin(roboto);
    var nextRobotoXaxis = [];
    var nextRobotoYaxis = [];
    nextRobotoXaxis[0] = parseFloat(robotx) + Math.cos(roboto);
    nextRobotoYaxis[0] = parseFloat(roboty) + Math.sin(roboto);
    nextRobotoXaxis[1] = parseFloat(robotx) + Math.cos(roboto) * 1.2;
    nextRobotoYaxis[1] = parseFloat(roboty) + Math.sin(roboto) * 1.2;
    nextRobotoXaxis[2] = parseFloat(robotx) + Math.cos(roboto) * 1.4;
    nextRobotoYaxis[2] = parseFloat(roboty) + Math.sin(roboto) * 1.4;

    var manoeuvre = false;
    for(var q = 0; q < treeslocations.length; q++) {
      if( Math.sqrt( Math.pow(treeslocations[q].x - nextRobotoXaxis[0], 2) + Math.pow(treeslocations[q].y - nextRobotoYaxis[0], 2) ) < 0.5 ){
        udpMess = abortMoveToUdpMess();
        buffer = new Buffer(udpMess);
        client = dgram.createSocket('udp4');
        console.log("!!!!!!!!!!!! send abort to robot !!!!!!!!!!!!");
        client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
        if(err) throw err;
          console.log('abort send to ' + HOST +':'+ PORT);
          client.close();
	});
      }
    }
  }

// TODO TODO TODO TODO IDEE: mettre les valeurs de position en global, 
// et tout décider à la fréquence d'autonomous robot (2sec)

  // TODO ici, si autonomousRobot==1 (déjà, keys inactives)
  // checker si c'est dans la zone d'un arbre
  // si oui, avec la position précédente, calculer le vecteur vitesse (ou juste avec l'angle calculer le vecteur orientation du robot)
  // calculer le vecteur robot -> arbre
  // calculer prodvec(arbre,robot)
  // si negatif, lancer une commande à gauche
  // si positif, lancer une commande à droite
  // TODO aller chercher l'arbre le plus proche plutot que arbitrairement
  // TODO un seul lancé d'eau !! (côté client?, perte d'eau?)
  // TODO se retirer du feu si temp trop grande: 
  // calculer tous les vecteurs robot->arbres pour lesquels le robot est dans la zone de l'arbre. en faire la moyenne. si prodscal(moyenne, vecteur orientation) > 0 on recule, < 0 on avance
  //
  if(noMvt==1) {
    currentAutoMvt = false;
  } else{
    currentAutoMvt = true;
  }
//  console.log("currentAutoMvt " + currentAutoMvt);
//  console.log("noMvt " + noMvt);
  // use fill/stop fill water functions
  if((roboty[0] < parseFloat(zoneslocations[0].y)+1) && (roboty[0] > parseFloat(zoneslocations[0].y)-1) && (robotx[0] < parseFloat(zoneslocations[0].x) + 1) && (robotx[0] > parseFloat(zoneslocations[0].x)-1)) {
    if(!isFillingWater) {
      fillingWater();
      robotTankEmpty = false;
    }
  } else {
    stopFillingWater();
  }
  if((roboty[0] < parseFloat(zoneslocations[1].y)+1) && (roboty[0] > parseFloat(zoneslocations[1].y)-1) && (robotx[0] < parseFloat(zoneslocations[1].x) + 1) && (robotx[0] > parseFloat(zoneslocations[1].x)-1)) {
    if(!isFillingBattery) {
      fillingBattery();
    }
  } else {
    stopFillingBattery();
  }
  // heat simulation
  var equilibriumDist = 3.0;
  var itNbBeforeChange = 1;
  if(counter > itNbBeforeChange) {
    var minDistance = 3.5;
    for(var q = 0; q < treeslocations.length; q++) {
      if(firesStatesOfTrees[q]) {
        var distance = Math.sqrt(Math.pow(treeslocations[q].x - robotx[0], 2) + Math.pow(treeslocations[q].y - roboty[0], 2));
        minDistance = Math.min(minDistance, distance);
      }
    }
    var heatIncrement = (equilibriumDist - minDistance)*10 / equilibriumDist;
    mercurelevelfloat = mercurelevelfloat + heatIncrement;
    if(mercurelevelfloat > 300) {
      mercurelevelfloat = 300;
    }
    if(mercurelevelfloat < 10) {
      mercurelevelfloat = 10;
    }
    mercurelevel = mercurelevelfloat.toString()/70 + 'vw';
    hotscreen = mercurelevelfloat/300;
    counter = 0;
  }
/*
  console.log("=====================");
  console.log(" OBS RTTLUA COUNTER:  ");
  console.log(thecounter);
  console.log("=====================");
*/
  counter++;
//  thecounter++;
});
serverGet.bind(PORTGET, HOST);


//=====================================================
// heat simulation part 
//=====================================================

// give temp/screen effect to client
router.get('/temperature', function(req, res) {
  res.json([mercurelevel,hotscreen]);
});


//=====================================================
// create udp message for orocos containing angular/linear speed
//=====================================================
function speedToUdpMess(as, ls) {
  var NB_INTS = 50;
  var NB_FLOATS = 50;
  //var LGTH_BYTES = 8 + NB_FLOATS * 4 + NB_INTS * 2;
  var timestamp = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
  var speed = new Float32Array(2);
  speed[0] = as;
  speed[1] = ls;
  var floats = new Float32Array(NB_FLOATS);
  floats[0] = speed[0];
  floats[1] = speed[1];
  for(var l = 2; l < NB_FLOATS; l++) {
    floats[l] = 0.0;
  }
  var floatsBytes = new Int8Array(floats.buffer);
  var integers = new Int16Array(50);
  for(var m = 0; m < NB_INTS; m++) {
    integers[m] = 0;
  }
  var integersBytes = new Int8Array(integers.buffer);
  var udpMess = new Int8Array(8 + 4*NB_FLOATS + 2*NB_INTS);
  for(var n = 0; n < 8; n++) {
    udpMess[n] = timestamp[n];
  }
  for(var o = 0; o < 4*NB_FLOATS; o++) {
    udpMess[o + 8] = floatsBytes[o];
  }
  for(var p = 0; p < 2*NB_INTS; p++) {
    udpMess[p + 8 + 4*NB_FLOATS] = integersBytes[p];
  }
  return udpMess;
}

//=====================================================
// controls (MOVES ~ speedToUdpMess & WATER ~ exec)
//=====================================================
//var sys = require('sys');
//var exec = require('child_process').exec;
function puts(error, stdout) {
  sys.puts(stdout);
}

router.get('/fires', function(req, res) {
  res.json(firesStatesOfTrees);
});
router.get('/fightedfires', function(req, res) {
  res.json(numFightedFires);
});


var udpMess;
var buffer;
var client;
var jwt = require('jwt-simple');
var secret = Buffer.from('fe1a1915a379f3be5394b64d14794932', 'hex');
var currentsplatch = false;
router.post('/', function(req, res/*, next*/) {
  console.log(req.body)
  if(req.body.token) {
    var decoded = jwt.decode(req.body.token, secret);
    if(decoded.auth && decoded.exp === global.expires){
      console.log(decoded);
      if(req.body.key == 'front') {
        udpMess = speedToUdpMess(0.0, 0.6);
        buffer = new Buffer(udpMess);
        client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
          if(err) throw err;
          //console.log('UDP message sent to ' + HOST +':'+ PORT);
          client.close();
        });
      } else if(req.body.key == 'left') {
        udpMess = speedToUdpMess(0.3, 0.0);
        buffer = new Buffer(udpMess);
        client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
          if(err) throw err;
          //console.log('UDP message sent to ' + HOST +':'+ PORT);
          client.close();
        });
      } else if(req.body.key == 'right') {
        udpMess = speedToUdpMess(-0.3, 0.0);
        buffer = new Buffer(udpMess);
        client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
          if(err) throw err;
          //console.log('UDP message sent to ' + HOST +':'+ PORT);
          client.close();
        });
      } else if(req.body.key == 'back') {
        udpMess = speedToUdpMess(0.0, -0.6);
        buffer = new Buffer(udpMess);
        client = dgram.createSocket('udp4');
        client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
          if(err) throw err;
          //console.log('UDP message sent to ' + HOST +':'+ PORT);
          client.close();
        });
      } else if(req.body.key == 'space') {
        throwWater();
      }
      res.json({
        posX: robotx,
        posY: roboty,
        orientation: roboto,
        waterlevel: watlevel,
	splatch: currentsplatch
      });
      setTimeout(function() {
          currentsplatch = false;
      }, 100);
    }
    else{
      res.status(401).json("Invalid token");
    }
  }
  else{
    res.status(401).json("No token given");
  }
});

// give pos/orientation/splatch to client
router.get('/robot', function(req, res) {
  res.json([robotx[0],roboty[0],roboto[0],currentsplatch]);
});


//=====================================================
// SPLATCH
//=====================================================
function throwWater() {
  if(watlevel > 4) {
    watlevel = watlevel - 3;
    currentsplatch = true;
  } else {
    watlevel = 0;
    robotTankEmpty = true;
    currentsplatch = false;
  }
  for(var i = 0; i < treeslocations.length; i++) {
    // close enough + good orientation
    var diffX = treeslocations[i].x - robotx[0];
    var diffY = treeslocations[i].y - roboty[0];
    var normDiff = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    diffX = diffX / normDiff;
    diffY = diffY / normDiff;
    var robotoX = Math.cos(roboto);
    var robotoY = Math.sin(roboto);
    var scalprod = robotoX * diffX + robotoY * diffY;
    if((normDiff < 3) && (scalprod > 0.9) && firesStatesOfTrees[i] && !robotTankEmpty) {
      console.log('USEFULL');
      numFightedFires++;
      var indexTree = i + 1;
      var command1 = 'echo \'' + treeslocations[i].x.toString() + ' ' + treeslocations[i].y.toString() + ' -10\' | yarp write /data/out /morse/treeonfire' + indexTree.toString() + '/teleporttf' + indexTree.toString() + '/in';
      var command2 = 'echo \'' + treeslocations[i].x.toString() + ' ' + treeslocations[i].y.toString() + ' -0.1\' | yarp write /data/out /morse/tree' + indexTree.toString() + '/teleport' + indexTree.toString() + '/in';
      console.log(command1 + ' && ' + command2);
      exec(command1 + ' && ' + command2, puts);
      firesStatesOfTrees[i] = false;
    }
  }
  setTimeout(function() {
          currentsplatch = false;
  }, 500);
}



//=====================================================
// create udp message for orocos position to reach
//=====================================================
function positionToUdpMess(x, y) {
  var NB_INTS = 50;
  var NB_FLOATS = 50;
  //var LGTH_BYTES = 8 + NB_FLOATS * 4 + NB_INTS * 2;
  var timestamp = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
  var floats = new Float32Array(NB_FLOATS);
  floats[0] = 0.0;
  floats[1] = 0.0;
  floats[2] = x;
  floats[3] = y;
  for(var l = 4; l < NB_FLOATS; l++) {
    floats[l] = 0.0;
  }
  var floatsBytes = new Int8Array(floats.buffer);
  var integers = new Int16Array(NB_INTS);
  for(var m = 0; m < NB_INTS; m++) {
    if(m==IND_MODE) {
      integers[m] = autonomousRobot;
    } else{
      integers[m] = 0;
    }
  }
  var integersBytes = new Int8Array(integers.buffer);
  var udpMess = new Int8Array(8 + 4*NB_FLOATS + 2*NB_INTS);
  for(var n = 0; n < 8; n++) {
    udpMess[n] = timestamp[n];
  }
  for(var o = 0; o < 4*NB_FLOATS; o++) {
    udpMess[o + 8] = floatsBytes[o];
  }
  for(var p = 0; p < 2*NB_INTS; p++) {
    udpMess[p + 8 + 4*NB_FLOATS] = integersBytes[p];
  }
  return udpMess;
}


function abortMoveToUdpMess() {
  var NB_INTS = 50;
  var NB_FLOATS = 50;
  //var LGTH_BYTES = 8 + NB_FLOATS * 4 + NB_INTS * 2;
  var timestamp = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
  var floats = new Float32Array(NB_FLOATS);
  for(var l = 0; l < NB_FLOATS; l++) {
    floats[l] = 0.0;
  }
  var floatsBytes = new Int8Array(floats.buffer);
  var integers = new Int16Array(NB_INTS);
  for(var m = 0; m < NB_INTS; m++) {
    if(m==IND_MODE) {
      integers[m] = autonomousRobot;
    } else if(m==IND_ABORTMOVE){
      integers[m] = 1;
    }
  }
  var integersBytes = new Int8Array(integers.buffer);
  var udpMess = new Int8Array(8 + 4*NB_FLOATS + 2*NB_INTS);
  for(var n = 0; n < 8; n++) {
    udpMess[n] = timestamp[n];
  }
  for(var o = 0; o < 4*NB_FLOATS; o++) {
    udpMess[o + 8] = floatsBytes[o];
  }
  for(var p = 0; p < 2*NB_INTS; p++) {
    udpMess[p + 8 + 4*NB_FLOATS] = integersBytes[p];
  }
  return udpMess;
}



var waterwidth = 0;
var wrenchmode = false;
var openingcontrol = 0;
var faucetcontrol = 0;
// send new state of control of water management to client
router.post('/watercontrol', function(req, res/*, next*/) {
  console.log(req.body);
  var repeater;
  if(req.body.token) {
    var decoded = jwt.decode(req.body.token, secret);
    console.log(decoded);
    if(decoded.auth && decoded.exp === global.expires){
      if(req.body.button == 'plusT') {
        if(faucetcontrol < 3) {
	  faucetcontrol = faucetcontrol + 1;
        }
      } else if(req.body.button == 'minusT') {
        if(faucetcontrol > -3) {
          faucetcontrol = faucetcontrol - 1;
        }
      } else if(req.body.button == 'pushButton') { // WATER PUSH BUTTON
        waterwidth = 7;
        var callCount = 1;
        clearInterval(repeater);
        repeater = setInterval(function () {
        if (callCount < 8) {
          waterwidth = 7 - callCount;
          callCount += 1;
        } else {
          clearInterval(repeater);
        }
      }, 1000);
      } else if(req.body.button == 'wrenchButton') { // WRENCH 
        wrenchmode = !wrenchmode;
      } else if(req.body.button == 'clickLeak') { // CLICK AT LEAK
        if(wrenchmode) {
          noleakat[req.body.leakid] = true;
          wrenchmode = false;
        }
      } else if(req.body.button == 'newContainer') { // AND FINALLY "NEW CONTAINER"
        brokenContainer = false;
        for (var i=0; i<leakPlacesNb; i++) {
          noleakat[i] = true;
        }
        crossSize = 0;
      }
      res.json({
        tapControl: faucetcontrol,
        wrenchMode: wrenchmode,
        noLeakAt: noleakat,
        brokenContainer: brokenContainer,
        crossSize: crossSize
      });
    }
    else{
      res.status(401).json("Invalid token");
    }
  }
  else{
    res.status(401).json("No token given");
  }
});

// give tap position, valve opening and water level of the container to client
router.get('/watermanagement', function(req, res) {
  res.json([xrobinet,waterwidth,watlevelContainer]);
});





var fillBatteryInterval;
var batteryEmpty = false;
var isFillingBattery = false;
var fillingBattery = function() {
  isFillingBattery = true;
  clearInterval(fillBatteryInterval);
  fillBatteryInterval = setInterval(function() {
    if(batteryLevel < 24) {
      batteryLevel = batteryLevel + 0.5;
    }
  }, 500);
};
var stopFillingBattery = function() {
  clearInterval(fillBatteryInterval);
  isFillingBattery = false;
};




//=====================================================
// TODO IF autonomous robot, then keys are not responding!
//=====================================================
// + fight fires
// + when is it autonomous/manual? (print it on the screen)

// MODE (AUTONOMOUS/MANUAL)

var autonomousRobot = 0; 	// toutes les minutes, on tire au sort si autonome ou pas
				// + dans une zone bien définie, c'est toujours manuel
// UDP indexes
var IND_MODE = 1
var IND_ENDGOTO = 2
var IND_ABORTMOVE = 3
/*
si batterie=temps pour go batery -> go battery
sinon si trop chaud -> s'écarter des arbres
sinon si plus d'eau -> go eau
sinon si pres d'un arbre en feu -> tirer
sinon: go arbre en feu
*/
var ixe = zoneslocations[0].x;
var igrec = zoneslocations[0].y;
var firstTime = false;
var tempxy = 1.0;





var brokenContainer = false;
router.get('/leaks', function(req, res) {
  res.json([leakPlaces,noleakat,brokenContainer,crossSize]);
});
router.get('/battery', function(req, res) {
  res.json(batteryLevel);
});
router.get('/time', function(req, res) {
  res.json(remainingtime);
});

export function launchgame(req, res) {
  console.log("!! CONTROL -- LAUNCHGAME !!")
  if(req.body.token) {
    var decoded = jwt.decode(req.body.token, secret);
    console.log(decoded);
    if(decoded.auth && decoded.exp === global.expires ){

      // make sure the initialization is correct 
      xrobinet = 42;
      mercurelevelfloat = 10;
      mercurelevel = '0.1vw';
      hotscreen = 0;
      firesStatesOfTrees = [];
      for(var i=0; i<treeslocations.length;i++) {
        firesStatesOfTrees.push(false);
      }
      watlevel = 50;
      robotTankEmpty = false;
      isFillingWater = false;
      crossSize = 0;
      leakPlacesNb = 12;
      leakPlaces = [];
      noleakat = [];
      leakCounter = 0;
      for (var i=0; i<leakPlacesNb; i++) {
        leakPlaces.push(leakCounter);
        leakCounter++;
        noleakat.push(true);
      }
      vlvop = 1;
      watlevelContainer = 0;
      remainingtime = 600;
      batteryLevel = 24;
      numFightedFires = 0;

      // clear intervals 
      clearInterval(waterManagementInterval);
      clearInterval(leaksInterval);
      clearInterval(waterFlowInterval);
      clearInterval(timeInterval);
      clearInterval(batteryInterval);
      clearInterval(treeBurningInterval);
      clearInterval(fillWaterInterval);
      clearInterval(fillBatteryInterval);

      clearInterval(autonomyInterval);
      firstTime = false;

      setTimeout(function() {
          firstTime = true;
      }, 5000);



      //=====================================================
      // Robot Autonomy
      //=====================================================
      var sens = 1;
      var tempCounter = 0;
      autonomyInterval = setInterval(function() {
        console.log("currentAutoMvt: ");
        console.log(currentAutoMvt);
        if( (autonomousRobot==1) && (!currentAutoMvt || firstTime) ){
          firstTime = false;
          throwWater(); // TODO why two throws sometimes?
          console.log("!!!!!!!!!!!! I THROW WATER !!!!!!!!!!!!");
         
          // TODO gérer le premier cas! 
          // (+1 pour éviter division par zero)
          var gotoX = robotx[0] + 1; 
          var gotoY = roboty[0] + 1;

          // define arrival as a tree on fire
          // TODO select the closest one
          for(var i=0;i<firesStatesOfTrees.length;i++) {
            if (firesStatesOfTrees[i]){
              var gotoX = treeslocations[i].x;
              var gotoY = treeslocations[i].y;
            }
          }
	  // TODO les destinations sont parfois les zones de recharge
          // var gotoX = zoneslocations[1].x;
          // var gotoY =  zoneslocations[1].y;

          // vector departure -> arrival computation
          var vecteurX = gotoX - robotx[0];
          var vecteurY = gotoY - roboty[0];
          var normDirection = Math.sqrt(Math.pow(vecteurX, 2) + Math.pow(vecteurY, 2));
          vecteurX = vecteurX/normDirection;
          vecteurY = vecteurY/normDirection;

          // TODO a revoir parceque le robot tire légèrement à coté
          // maybe plutot un abort avant d'arriver
          // + rotation pour bien cadrer?
          ixe = gotoX- vecteurX*1.5;
          igrec = gotoY- vecteurY*1.5;

          udpMess = positionToUdpMess(ixe,igrec);
          buffer = new Buffer(udpMess);
          client = dgram.createSocket('udp4');

          console.log("!!!!!!!!!!!! send GOTO to robot !!!!!!!!!!!!");
          console.log("======= " + ixe + "======= " + igrec );
          client.send(buffer, 0, buffer.length, PORT, HOST, function(err) {
            if(err) throw err;
            console.log('position to reach sent to ' + HOST +':'+ PORT);
            client.close();
          });
        }
      }, 2000);


      //=====================================================
      // tree burning randomization 
      //=====================================================
      console.log("CONTROL: tree burning randomization");
      var alea1 = -1;
      var alea2 = -1;
      var treenumber = -1;
      var onfire = false;
      var timerStart = 0;
      treeBurningInterval = setInterval(function() {
        alea1 = Math.random();
        alea2 = Math.random();
        treenumber = Math.floor(alea1 * treeslocations.length);
        onfire = false;
        if(alea2 < 0.33333) {
          onfire = true;
        }
        if(onfire && (treenumber != -1) && !firesStatesOfTrees[treenumber]) {
          firesStatesOfTrees[treenumber] = true;
          // update states of fires to show them on the map
          var indexTree = treenumber + 1;
          var command1 = 'echo \'' + treeslocations[treenumber].x.toString() + ' ' + treeslocations[treenumber].y.toString() + ' -0.1\' | yarp write /data/out /morse/treeonfire' + indexTree.toString() + '/teleporttf' + indexTree.toString() + '/in';
          var command2 = 'echo \'' + treeslocations[treenumber].x.toString() + ' ' + treeslocations[treenumber].y.toString() + ' -10\' | yarp write /data/out /morse/tree' + indexTree.toString() + '/teleport' + indexTree.toString() + '/in';
          var command = command2 + ' && ' + command1;
          console.log(command);
          exec(command, puts);
        }
        console.log('new fire ? ' + treenumber + ' ' + onfire);
      }, 3000);


      //=====================================================
      // water management part: 
      //=====================================================
      console.log("CONTROL: water management part: ");
      var pivalue = 3.1415;
      var valveopening = 1;
      var widthwaterflow = 10 - Math.abs(vlvop);
      var coeffspeed = 25;
      var coeffspeedopening = 0.1;
      var faucetxaxis = 2 * 10 / 40;
      waterManagementInterval = setInterval(function() {
        if((xrobinet <= 80) && (xrobinet >= 0)) {
          xrobinet = xrobinet + coeffspeed * (pivalue / 80) * Math.sin(pivalue * xrobinet / 40 - pivalue) + faucetcontrol;
        } else if(xrobinet > 80) {
          xrobinet = 80;
        } else if(xrobinet < 0) {
            xrobinet = 0;
        }
        var fxa = (xrobinet - 40) * 10 / 40;
        faucetxaxis = fxa.toPrecision(1);
        if((vlvop <= 10) && (vlvop >= 0)) {
          vlvop = vlvop + coeffspeedopening * (pivalue / 10) * Math.sin(pivalue * vlvop / 5 - pivalue) + coeffspeedopening * openingcontrol;
          var tempvar = vlvop.toPrecision(1);
        } else if(vlvop > 10) {
          vlvop = 10;
        } else if(vlvop < 0) {
          vlvop = 0;
        }
        var temp = (vlvop - 5) * 10 / 5;
        valveopening = temp.toPrecision(1);
        widthwaterflow = 10 - Math.abs(temp);
      }, 200);


      waterFlowInterval = setInterval(function() {
        var leaksSum = 0;
        for(var i = 0; i<leakPlacesNb; i++) {
          if(!noleakat[i]){
            leaksSum = leaksSum + 1;
          }
        }
        if((faucetxaxis < 2) && (faucetxaxis > -2) && watlevelContainer < 99) {
          watlevelContainer = watlevelContainer + waterwidth/7 - leaksSum/(2*leakPlacesNb); 
        } else if (watlevelContainer > 1){
          watlevelContainer = watlevelContainer - leaksSum/leakPlacesNb;
        }
      }, 200);


  //=====================================================
  // remaining time part
  //=====================================================
      console.log("CONTROL: remaining time part");
      timeInterval = setInterval(function() {
        if(remainingtime > 0) {
          remainingtime = remainingtime - 1;
        }
        console.log("oooooooooooooooooooooooooooooooooo");
        console.log('  REMAINING TIME: ' + remainingtime);
        console.log("oooooooooooooooooooooooooooooooooo");
      }, 1000);
      // give remaining time to client
  


  //=====================================================
  // battery part 
  // TODO: discharging rate higher when moving/using water
  //=====================================================
      console.log("CONTROL: battery part ");
      batteryInterval = setInterval(function() {
        if(batteryLevel > 0) {
          batteryLevel = batteryLevel - 0.1;
        }
      }, 1000);
      // give battery level to client
  

  //=====================================================
  // leaks/container part
  //=====================================================

    
  // RANDOM LEAKS
      console.log("CONTROL: RANDOM LEAKS");
      leaksInterval = setInterval(function() {
        var leaksNotEverywhere = false;
        if(Math.random()<0.5) {
          var myInt = Math.floor(Math.random()*leakPlacesNb);
          noleakat[myInt] = false;
          for(var i = 0; i<leakPlacesNb; i++){
            leaksNotEverywhere = leaksNotEverywhere || noleakat[i];
          }
          if(!leaksNotEverywhere) {
            brokenContainer = true;
            crossSize = 25;
          }
        }
      }, 5000);


      res.status(200).json("launched!");
    } else{
      res.status(401).json("Invalid token");
    }
  }
  else{
    res.status(401).json("No token given");
  }
}

















//=====================================================
// robot tank
//=====================================================
// define fill/stopfill water functions
var fillWaterInterval;
var robotTankEmpty = false;
var isFillingWater = false;
var fillingWater = function() {
  isFillingWater = true;
  clearInterval(fillWaterInterval);
  fillWaterInterval = setInterval(function() {
    if( (watlevel < 100) && (watlevelContainer > 11) ) {
      watlevel = watlevel + 10;
      watlevelContainer = watlevelContainer - 10;
    }
  }, 500);
};
var stopFillingWater = function() {
  clearInterval(fillWaterInterval);
  isFillingWater = false;
};
// give watlevel to client
router.get('/robotwater', function(req, res) {
  res.json([watlevel,robotTankEmpty]);
});


// used in auth
global.stopGame = function() { 
  exec('bash ~/driving-human-robots-interaction/killAll.sh');
  xrobinet = 42;
  mercurelevelfloat = 10;
  mercurelevel = '0.1vw';
  hotscreen = 0;
  firesStatesOfTrees = [];
  for(var i=0; i<treeslocations.length;i++) {
    firesStatesOfTrees.push(false);
  }
  watlevel = 50;
  robotTankEmpty = false;
  isFillingWater = false;
  crossSize = 0;
  leakPlacesNb = 12;
  leakPlaces = [];
  noleakat = [];
  leakCounter = 0;
  for (var i=0; i<leakPlacesNb; i++) {
    leakPlaces.push(leakCounter);
    leakCounter++;
    noleakat.push(true);
  }
  vlvop = 1;
  watlevelContainer = 0;
  remainingtime = 600;
  batteryLevel = 24;
  numFightedFires = 0;

  // clear intervals 
  clearInterval(waterManagementInterval);
  clearInterval(leaksInterval);
  clearInterval(waterFlowInterval);
  clearInterval(timeInterval);
  clearInterval(batteryInterval);
  clearInterval(treeBurningInterval);
  clearInterval(fillWaterInterval);
  clearInterval(fillBatteryInterval);

  clearInterval(autonomyInterval);
}
// déja dans auth
// check expiration of tokens
/*
var checkExpiration = setInterval(function() {
  if( global.expires <= Date.now() ) {
    emptySlot = true;
    console.log("Auth -- expiration of current token, creation of a new one. ")
    global.expires = moment().add('minutes', 11).valueOf();
    payload = { auth: true,
              exp: global.expires };
    global.token = jwt.encode(payload, secret);
    console.log('Auth -- kill game.')
    exec('bash ~/driving-human-robots-interaction/killAll.sh');
  }
}, 3000);
*/
module.exports = router;
