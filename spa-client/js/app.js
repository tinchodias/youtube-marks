
/**
 * the HTML5 autofocus property can be finicky when it comes to dynamically loaded
 * templates and such with AngularJS. Use this simple directive to
 * tame this beast once and for all.
 *
 * Usage:
 * <input type="text" autofocus>
 * 
 * License: MIT
 * 
 * SOURCE: https://gist.github.com/mlynch/dd407b93ed288d499778
 */
angular.module('utils.autofocus', [])

.directive('autofocus', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link : function($scope, $element) {
      $timeout(function() {
        $element[0].focus();
      });
    }
  }
}]);


function secondsToTime() {

  function padTime(t) {
      return t < 10 ? "0"+t : t;
  }

  return function(_seconds) {
      if (typeof _seconds !== "number" || _seconds < 0)
          return "invalid"

      let hours = Math.floor(_seconds / 3600),
          minutes = Math.floor((_seconds % 3600) / 60),
          seconds = Math.floor(_seconds % 60),
          ms = Math.floor((_seconds % 1) * 100)

      return padTime(hours) + ":" + padTime(minutes) + ":" + padTime(seconds) + '.' + padTime(ms)
  }
}


angular.module('marksApp', ['ui.router', 'utils.autofocus', 'xeditable', 'download'])
    .service("MarksService", function($http) { return new MarksService($http) })
    .controller('BodyController', BodyController)
    .controller('ProjectController', ProjectController)
    .controller('VideoController', VideoController)
    .controller('ListMarksController', ListMarksController)
    .controller('ImportMarksController', ImportMarksController)
    .run(['editableOptions', function(editableOptions) {
      editableOptions.theme = 'bs4'
    }])

    .filter('secondsToTime', secondsToTime)
    
    .directive('seekDeltaButton', function() {
      return {
        restrict: 'E',
        replace: true,
        template: (elem, attr) => `<a type="button" class="btn btn-outline-secondary" ng-click="seekDelta(${attr.delta})">${attr.delta}s</a>`
      }
    })


    .config(routes)
