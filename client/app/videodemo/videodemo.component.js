'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './videodemo.routes';

export class VideodemoComponent {
  /*@ngInject*/
  constructor($scope, $rootScope) {
    'ngInject';
    this.message = 'Hello';
    $scope.language = $rootScope.language || 'english';
  }
}

export default angular.module('robotfirefighterApp.videodemo', [uiRouter])
  .config(routes)
  .component('videodemo', {
    template: require('./videodemo.html'),
    controller: VideodemoComponent,
    controllerAs: 'videodemoCtrl'
  })
  .name;
