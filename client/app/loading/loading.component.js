'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './loading.routes';

export class LoadingComponent {
  $http;
  socket;
  /*@ngInject*/
  constructor($http, $scope, socket, $interval, $timeout, sharedProperties, $rootScope) {
    'ngInject';
    var myToken = $rootScope.token; // does nothing, usually $rootScope.token isn't filled yet.
    $scope.playEnabled = false;
    $scope.lostGame = false;
    this.$http = $http;
    this.socket = socket;
    $scope.dot = 0;
    var servercall = $interval(function() {
      myToken = $rootScope.token;
      console.log("$rootScope.token");
      console.log($rootScope.token);
      $http.post('/api/auth/gameready', {token: myToken}).then(response => {  //POST TOKEN TO AVOID AN OTHER VISITOR TO GET THE INFORMATION (MAKING THE PLAYER UNABLE TO CLICK)
        if(response.status === 200) {
          console.log(response.data.isgameready);
          console.log(response.data.istoolate);
          if(response.data.isgameready || $scope.playEnabled){
            $scope.playEnabled = true;            
          }
          if(response.data.istoolate || $scope.lostGame) {
            $scope.lostGame = true;
            $scope.playEnabled = false;  
          }
        }
      });
      $scope.dot = ($scope.dot + 1)%4;
    }, 1000);


    $scope.$on("$destroy", function() {
      if (servercall) {
        console.log("SERVERCALL INTERVAL KILL:");
        var cancelServerCall = $interval.cancel(servercall);
        console.log(cancelServerCall);
      }
    });

    console.log("LOADING!");
    console.log("$rootScope.token:");
    console.log($rootScope.token);
    console.log("myToken:");
    console.log(myToken);
    
    // LETS PLAY
    $scope.letsplay = function() { 
      myToken = $rootScope.token;
      console.log("letsplay!");
      console.log("myToken:");
      console.log(myToken);
      console.log("$rootScope.token:");
      console.log($rootScope.token);
      
      
      // launch game TODO a mettre au début de main.component.js si ça se lance pas
      console.log("post token to control/launchgame");
      $http.post('/api/control/launchgame', {token: myToken}).then(response => {         
        console.log("letsplay -- control/launchgame -- response: ");   
        console.log(response);
        if(response.status === 200){
          console.log("le token est ok, la partie js du jeu est lancée");
          // kill timeout TODO a mettre au début de main.component.js si ça se lance pas
          console.log("post token to auth/killTimeout");
          $http.post('/api/auth/killtimeout', {token: myToken}).then(response => {      
            console.log("letsplay -- auth/killTimeout -- response: ");
            console.log(response);
            if(response.status === 200){
              console.log("le token est ok, timeout annulé dans auth");
            } else{
              console.log('nok');
            }
          });
        } else{
          console.log('nok');
        }
      });

    }
  }

/*
  $scope.letsplay = function() {
    $http.get('/api/control/launchgame').then(response => {
        console.log(response);
        if(response.status === 200){
		
        }
    })
  }
*/
}

export default angular.module('robotfirefighterApp.loading', [uiRouter])
  .config(routes)
  .component('loading', {
    template: require('./loading.html'),
    controller: LoadingComponent,
    controllerAs: 'loadingCtrl'
  })
  .name;
