'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './welcome.routes';

export class WelcomeComponent {
  /*@ngInject*/
  constructor($http, $scope, socket, sharedProperties, $rootScope) {
    'ngInject';
    this.$http = $http;
    this.socket = socket;
    //this.$scope = $scope;

    // display the appropriate interface?
    $http.get('/api/auth').then(response => {
      console.log(response);
      $scope.emptySlot=response.data;
      console.log("emptySlot:")
      console.log(response.data);
    })

    // test authorization for playing
//    var token = "";
    $rootScope.token = "";
    var myToken = $rootScope.token;
    $scope.play = function(){
      $http.get('/api/auth/play').then(response => {
        console.log("response!")
        console.log(response);
        if(response.status === 200){
          console.log("give token");
          // ok, I give a token to you
          $rootScope.token = response.data;
          myToken = $rootScope.token;
          console.log("welcome - play() -- I JUST GOT A TOKEN: ");
          console.log($rootScope.token);
          console.log("welcome - play() -- myToken : ");
          console.log(myToken);

          // launch MORSE & co
          $http.post('/api/control/start', {token: myToken}).then(response => {
            console.log("control/start response:");
            console.log(response);
            if(response.status === 200){
              console.log("game launched!");
            }
            else{
              console.log("game not launched");
            }
          });
        }
        else{
          // no token, display appropriate home
          $scope.emptySlot=false;
          console.log("no token available!")
        }
      })
    }; // play
  } // constructor
} // component

export default angular.module('videogameApp.welcome', [uiRouter])
  .config(routes)
  .component('welcome', {
    template: require('./welcome.html'),
    controller: WelcomeComponent,
    controllerAs: 'welcomeCtrl'
  })
  .name;
