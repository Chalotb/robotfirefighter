import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';


//"use strict";

export class MainController {
  $http;
  socket;
  awesomeThings = [];
  newThing = '';
//  var pending = false;

  /*@ngInject*/
  constructor($http, $scope, socket, hotkeys, $timeout, $interval) {
    $scope.nbfighted = 0;
    this.$http = $http;
    this.socket = socket;
    var debug = true;

    // map management
    var translationX = 19;
    var normalizationX = 38;
    var translationY = 19;
    var normalizationY = 38;
    $scope.realToCssPoseX = function(realPose) {
      return (-5 + (realPose + translationX) * 100.0 / normalizationX).toString() + '%';
    };
    $scope.realToCssPoseY = function(realPose) {
      return (95 - (realPose + translationY) * 100.0 / normalizationY).toString() + '%';
    };
    // trees locations
    var treeslocations;
    $scope.trees = [];
    $scope.firesloc = [];
    $scope.opacityfire = [];
    $http.get('/api/control').then(response => {
      if(response.status === 200) {
        treeslocations = JSON.parse(response.data);
        $scope.trees = treeslocations;
        //$scope.firesloc = treeslocations;
        for(var i = 0; i < treeslocations.length; i++) {
          var xVal = $scope.realToCssPoseX(parseFloat(treeslocations[i].x));
          var yVal = $scope.realToCssPoseY(parseFloat(treeslocations[i].y));
          $scope.trees[i].x = xVal;
          $scope.trees[i].y = yVal;
          $scope.firesloc.push({x: xVal, y: (parseFloat(yVal.slice(0, -1)) - 3.8).toString() + '%'});
          $scope.opacityfire.push(0);
        }
      }
    });
    // blabla
    var pending = false;
    $scope.battlevel = 24;
    $scope.watlevel = 160;
    $scope.batteryZoneFromTop = $scope.realToCssPoseY(16.1);
    $scope.batteryZoneFromLeft = $scope.realToCssPoseX(16.2);
    // fire states and number of fighted fires update
    $scope.nbonfire = 0;
    $interval(function() {
      $http.get('/api/control/fires').then(response => {
        if(response.status === 200) {
          var sum = 0;
          for(var i = 0; i < response.data.length; i++) {
            if(response.data[i]) {
              $scope.opacityfire[i] = 1;
              sum++;
            } else {
              $scope.opacityfire[i] = 0;
            }
          }
          $scope.nbonfire = sum;
        }
      });
      $http.get('/api/control/fightedfires').then(response => {
        if(response.status === 200) {
          $scope.nbfighted = response.data;
        }
      });
    }, 300);

    // gives a nice effect on flames in the map
    $scope.fireflip = false;
    $interval(function() {
      $scope.fireflip = !$scope.fireflip;
    }, 500);

    var waterZone = { top: -9, bottom: -11, right: 1, left: -1};
    $scope.waterZoneFromTop = $scope.realToCssPoseY(-10);
    $scope.waterZoneFromLeft = $scope.realToCssPoseX(0);

    $scope.totheleft = function() {
      if(debug) {
        console.log('totheleft');
      }
      if(!pending) {
        pending = true;
        $http.post('/api/control', {key: 'left'}).then(response => {
          pending = false;
          if(response.status === 200) {
            $scope.propFromTop = $scope.realToCssPoseY(response.data.posY[0]);
            $scope.propFromLeft = $scope.realToCssPoseX(response.data.posX[0]);
            $scope.rotindeg = 180 - (response.data.orientation[0] + 3.14) * 360 / (2 * 3.14);
            if(debug) {
              console.log(response.data.posX[0]);
              console.log(response.data.posY[0]);
              console.log(response.data.orientation[0]);
            }
            if((response.data.posY[0] < waterZone.top) && (response.data.posY[0] > waterZone.bottom) && (response.data.posX[0] < waterZone.right) && (response.data.posX[0] > waterZone.left)) {
              fillingWater();
            } else {
              stopFillingWater();
            }
          } else if(debug) {
            console.log('nok');
          }
        });
      }
    };

    $scope.totheright = function() {
      if(debug) {
        console.log('totheright');
      }
      if(!pending) {
        pending = true;
        $http.post('/api/control', {key: 'right'}).then(response => {
          pending = false;
          if(response.status === 200) {
            $scope.propFromTop = $scope.realToCssPoseY(response.data.posY[0]);
            $scope.propFromLeft = $scope.realToCssPoseX(response.data.posX[0]);
            $scope.rotindeg = 180 - (response.data.orientation[0] + 3.14) * 360 / (2 * 3.14);
            if(debug) {
              console.log(response.data.posX[0]);
              console.log(response.data.posY[0]);
              console.log(response.data.orientation[0]);
            }
            if((response.data.posY[0] < waterZone.top) && (response.data.posY[0] > waterZone.bottom) && (response.data.posX[0] < waterZone.right) && (response.data.posX[0] > waterZone.left)) {
              fillingWater();
            } else {
              stopFillingWater();
            }
          } else if(debug) {
            console.log('nok');
          }
        });
      }
    };

    $scope.backward = function() {
      if(debug) {
        console.log('backward');
      }
      if(!pending) {
        pending = true;
        $http.post('/api/control', {key: 'back'}).then(response => {
		//response.data
          if(response.status === 200) {
            $scope.propFromTop = $scope.realToCssPoseY(response.data.posY[0]);
            $scope.propFromLeft = $scope.realToCssPoseX(response.data.posX[0]);
            $scope.rotindeg = 180 - (response.data.orientation[0] + 3.14) * 360 / (2 * 3.14);
            if(debug) {
              console.log(response.data.posX[0]);
              console.log(response.data.posY[0]);
              console.log(response.data.orientation[0]);
            }
            if((response.data.posY[0] < waterZone.top) && (response.data.posY[0] > waterZone.bottom) && (response.data.posX[0] < waterZone.right) && (response.data.posX[0] > waterZone.left)) {
              fillingWater();
            } else {
              stopFillingWater();
            }
            pending = false;
          } else if(debug) {
            console.log('nok');
          }
        });
      }
    };

    $scope.forward = function() {
      if(debug) {
        console.log('forward');
      }
      if(!pending) {
        pending = true;
        $http.post('/api/control', {key: 'front'}).then(response => {
          pending = false;
          if(response.status === 200) {
            $scope.propFromTop = $scope.realToCssPoseY(response.data.posY[0]);
            $scope.propFromLeft = $scope.realToCssPoseX(response.data.posX[0]);
            $scope.rotindeg = 180 - (response.data.orientation[0] + 3.14) * 360 / (2 * 3.14);
            if(debug) {
              console.log(response.data.posX[0]);
              console.log(response.data.posY[0]);
              console.log(response.data.orientation[0]);
            }
            if((response.data.posY[0] < waterZone.top) && (response.data.posY[0] > waterZone.bottom) && (response.data.posX[0] < waterZone.right) && (response.data.posX[0] > waterZone.left)) {
              fillingWater();
              robotTankEmpty = false;
            } else {
              stopFillingWater();
            }
          } else if(debug) {
            console.log('nok');
          }
        });
      }
    };

    var myVar2;
    var fillingWater = function() {
      $interval.cancel(myVar2);
      myVar2 = $interval(function() {
        if($scope.watlevel > 160) {
          $scope.watlevel = $scope.watlevel - 2;
        }
      }, 1000);
    };
    var stopFillingWater = function() {
      $interval.cancel(myVar2);
    };


    $scope.xrobinet = 42;
    var decal = 4;
    $scope.xrobinetwater = $scope.xrobinet + decal;
    $scope.valveopening = 1;
    var vlvop = 1;
    $scope.widthwaterflow = 10 - Math.abs(vlvop);
    var pivalue = 3.1415;
    var coeffspeed = 25;
    var coeffspeedopening = 0.1;
    $scope.faucetxaxis = 2 * 10 / 40;
    $interval(function() {
      if(($scope.xrobinet <= 80) && ($scope.xrobinet >= 0)) {
        $scope.xrobinet = $scope.xrobinet + coeffspeed * (pivalue / 80) * Math.sin(pivalue * $scope.xrobinet / 40 - pivalue) + $scope.faucetcontrol;
      } else if($scope.xrobinet > 80) {
        $scope.xrobinet = 80;
      } else if($scope.xrobinet < 0) {
        $scope.xrobinet = 0;
      }
      var fxa = ($scope.xrobinet - 40) * 10 / 40;
      $scope.faucetxaxis = fxa.toPrecision(3);
      $scope.xrobinetwater = $scope.xrobinet + decal;
      if((vlvop <= 10) && (vlvop >= 0)) {
        vlvop = vlvop + coeffspeedopening * (pivalue / 10) * Math.sin(pivalue * vlvop / 5 - pivalue) + coeffspeedopening * $scope.openingcontrol;
      } else if(vlvop > 10) {
        vlvop = 10;
      } else if(vlvop < 0) {
        vlvop = 0;
      }
      var temp = (vlvop - 5) * 10 / 5;
      $scope.valveopening = temp.toPrecision(3);
      $scope.widthwaterflow = 10 - Math.abs(temp);
      //console.log($scope.widthwaterflow);
    }, 200);

    $scope.watlevelContainer = 10;
    $interval(function() {
      if($scope.watlevelContainer < 94) {
        $scope.watlevelContainer = $scope.watlevelContainer + 1;
      }
      if(($scope.faucetxaxis < 2) && ($scope.faucetxaxis > -2) && $scope.watlevelContainer > 0) {
        $scope.watlevelContainer = $scope.watlevelContainer - $scope.widthwaterflow / 3;
      }
    }, 200);

//TODO
    var robotTankEmpty = false;
    $scope.water = function() {
      if(debug) {
        console.log('WATER');
      }
      if(!robotTankEmpty) {
        $scope.waterize = true;
        // SERVER SIDE
        if(!pending) {
          pending = true; // TODO
          $http.post('/api/control', {key: 'space'}).then(response => {
            pending = false;
            if(response.status === 200) {
              $scope.propFromTop = $scope.realToCssPoseY(response.data.posY[0]);
              $scope.propFromLeft = $scope.realToCssPoseX(response.data.posX[0]);
              if(debug) {
                console.log(response.data.posX[0]);
                console.log(response.data.posY[0]);
              }
              if((response.data.posY[0] < waterZone.top) && (response.data.posY[0] > waterZone.bottom) && (response.data.posX[0] < waterZone.right) && (response.data.posX[0] > waterZone.left)) {
                fillingWater();
                robotTankEmpty = false;
              } else {
                stopFillingWater();
              }
            } else if(debug) {
              console.log('nok');
            }
          });
        }
      // END SERVER SIDE
        $timeout(function() {
          $scope.waterize = false;
        }, 100);
      }
      if($scope.watlevel < 215) {
        $scope.watlevel = $scope.watlevel + 3;
      } else {
        robotTankEmpty = true;
      }
    };

    $scope.faucetcontrol = 0;
    $scope.faucetctrlfctplus = function() {
      if($scope.faucetcontrol < 3) {
        $scope.faucetcontrol = $scope.faucetcontrol + 1;
      }
    };
    $scope.faucetctrlfctminus = function() {
      if($scope.faucetcontrol > -3) {
        $scope.faucetcontrol = $scope.faucetcontrol - 1;
      }
    };
    $scope.openingcontrol = 0;
    $scope.openingctrlfctplus = function() {
      if($scope.openingcontrol < 3) {
        $scope.openingcontrol = $scope.openingcontrol + 1;
      }
    };
    $scope.openingctrlfctminus = function() {
      if($scope.openingcontrol > -3) {
        $scope.openingcontrol = $scope.openingcontrol - 1;
      }
    };

    hotkeys.add('left', 'totheleft', $scope.totheleft);
    hotkeys.add('right', 'totheright', $scope.totheright);
    hotkeys.add('down', 'backward', $scope.backward);
    hotkeys.add('up', 'forward', $scope.forward);
    hotkeys.add('space', 'water', $scope.water);

   /* window.setInterval(function(){
	console.log(pending)
  	 $scope.waterize = false;
    }, 100);
    */

    $interval(function() {
      if($scope.battlevel > 0) {
        $scope.battlevel = $scope.battlevel - 0.1;
      }
    }, 1000);

    var tictac = false;
    $scope.remainingtime = 600;
    $scope.hotscreen = 0;
    $interval(function() {
      if($scope.remainingtime > 0) {
        $scope.remainingtime = $scope.remainingtime - 1;
      }
      if(tictac) {
        $scope.mercurelevel = '50px';
        tictac = false;
        $scope.hotscreen = 0;
      } else {
        $scope.mercurelevel = '300px';
        tictac = true;
        $scope.hotscreen = 1;
      }
    }, 1000);
  }


  $onInit() {
    this.$http.get('/api/things')
      .then(response => {
        this.awesomeThings = response.data;
        this.socket.syncUpdates('thing', this.awesomeThings);
      });
  }

  addThing() {
    if(this.newThing) {
      this.$http.post('/api/things', {
        name: this.newThing
      });
      this.newThing = '';
    }
  }

  deleteThing(thing) {
    this.$http.delete(`/api/things/${thing._id}`);
  }

}

export default angular.module('videogameApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    template: require('./main.html'),
    controller: MainController
  })
  .name;
