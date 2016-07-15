angular.module('app.routes', [])
.config(['$routeProvider', function($routeProvider) {

  $routeProvider
  .when('/', {
    cache: false,
    templateUrl: "tpl/main.html"
  })
  .otherwise('/');
}]);
