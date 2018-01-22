'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './howto.routes';

export class HowtoComponent {
  /*@ngInject*/
  constructor($scope,$rootScope) {
    'ngInject';
    this.message = 'Hello';
    $scope.language = $rootScope.language;
  }
}

export default angular.module('robotfirefighterApp.howto', [uiRouter])
  .config(routes)
  .component('howto', {
    template: require('./howto.html'),
    controller: HowtoComponent,
    controllerAs: 'howtoCtrl'
  })
  .name;
