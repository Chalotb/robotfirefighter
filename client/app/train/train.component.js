'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './train.routes';

export class TrainComponent {
  /*@ngInject*/
  constructor($http, $scope, socket, sharedProperties, $rootScope, $interval) {

// TODO TODO TODO TODO setInterval-> $interval
// clear intervals
// rotation roue, push button, fix leaks
// autonomy
// display
// game over
    'ngInject';
   
    // water management
    $scope.xrobinet = 42;
    $scope.watlevelContainer = 80; // pourquoi revient-il a zero?
    // constants
    var decal = 4;
    var coeffXrob = 10;
    var constXrob = 50;
    // control of x axis
    $scope.faucetcontrol = 0;
    // cross
    $scope.crossSize = 0;
    
    // leaks
    var leakPlacesNb = 12;
    $scope.leakPlaces = [];
    $scope.noleakat = [];
    var leakCounter = 0;
    for (var i=0; i<leakPlacesNb; i++) {
      $scope.leakPlaces.push(leakCounter);
      leakCounter++;
      $scope.noleakat.push(true);
    }


    //=====================================================
    // water management part: 
    //=====================================================
    var pivalue = 3.1415;
    var coeffspeed = 25;
    var faucetxaxis = 2 * 10 / 40;



    var waterManagementInterval = $interval(function() {
      if(($scope.xrobinet <= 80) && ($scope.xrobinet >= 0)) {
        $scope.xrobinet = $scope.xrobinet + coeffspeed * (pivalue / 80) * Math.sin(pivalue * $scope.xrobinet / 40 - pivalue) + $scope.faucetcontrol;
      } else if($scope.xrobinet > 80) {
        $scope.xrobinet = 80;
      } else if($scope.xrobinet < 0) {
          $scope.xrobinet = 0;
      }
      $scope.xrobinetwater = $scope.xrobinet + decal;
      var fxa = ($scope.xrobinet - 40) * 10 / 40;
      faucetxaxis = fxa;
      $scope.yrobinet = coeffXrob * Math.cos(faucetxaxis*3.1415*2 / 20) + constXrob;
    }, 200);



    var waterFlowInterval = $interval(function() {
      var leaksSum = 0;
      for(var i = 0; i<leakPlacesNb; i++) {
        if(!$scope.noleakat[i]){
          leaksSum = leaksSum + 1;
        }
      }
      if((faucetxaxis < 2) && (faucetxaxis > -2) && $scope.watlevelContainer < 99) {
        $scope.watlevelContainer = $scope.watlevelContainer + $scope.waterwidth/7 - leaksSum/(2*leakPlacesNb); 
      } else if ($scope.watlevelContainer > 1){
        $scope.watlevelContainer = $scope.watlevelContainer - leaksSum/leakPlacesNb;
      }
    }, 200);





    var leaksInterval = $interval(function() {
      var leaksNotEverywhere = false;
      if(Math.random()<0.5) {
        var myInt = Math.floor(Math.random()*leakPlacesNb);
        $scope.noleakat[myInt] = false;
        for(var i = 0; i<leakPlacesNb; i++){
          leaksNotEverywhere = leaksNotEverywhere || $scope.noleakat[i];
        }
        if(!leaksNotEverywhere) {
          $scope.brokenContainer = true;
          $scope.crossSize = 25;
        }
      }
    }, 5000);



   // control
$scope.faucetctrlfctplus = function(){
  if($scope.faucetcontrol < 3) {
    $scope.faucetcontrol = $scope.faucetcontrol + 1;
  }
}
$scope.faucetctrlfctminus = function(){
  if($scope.faucetcontrol > -3) {
    $scope.faucetcontrol = $scope.faucetcontrol - 1;
  }
}

$scope.waterPushButton = function(){
  $scope.waterwidth = 7;
  var callCount = 1;
  clearInterval(repeater);
  repeater = setInterval(function () {
    if (callCount < 8) {
      $scope.waterwidth = 7 - callCount;
      callCount += 1;
    } else {
      clearInterval(repeater);
    }
  }, 1000);
}

$scope.wrenchOnOff = function(){
  $scope.wrenchmode = !$scope.wrenchmode;
}

$scope.newContainer = function(){

}


/*else if(req.body.button == 'clickLeak') { // CLICK AT LEAK
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
*/
  }
}

export default angular.module('robotfirefighterApp.train', [uiRouter])
  .config(routes)
  .component('train', {
    template: require('./train.html'),
    controller: TrainComponent,
    controllerAs: 'trainCtrl'
  })
  .name;
