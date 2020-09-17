
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

angular.module('tareasListApp', ['ui.router', 'youtube-embed', 'download', 'angular-growl', 'ngAnimate', 'utils.autofocus'])
    .service("MarksService", MarksService)
    .controller('MainController', MainController)
    .controller('ListMarksController', ListMarksController)
    .controller('EditMarkController', EditMarkController)
    .config(routes)
    .config(['growlProvider', function(growlProvider) {
        growlProvider.onlyUniqueMessages(false)
        growlProvider.globalTimeToLive(1500)
        growlProvider.globalDisableCountDown(true)
        growlProvider.globalDisableIcons(true)
        growlProvider.globalDisableCloseButton(true)
        growlProvider.globalPosition('top-center')
    }])
    .filter('secondsToTime', function() {

        function padTime(t) {
            return t < 10 ? "0"+t : t;
        }
    
        return function(_seconds) {
            if (typeof _seconds !== "number" || _seconds < 0)
                return "00:00:00"

            let hours = Math.floor(_seconds / 3600),
                minutes = Math.floor((_seconds % 3600) / 60),
                seconds = Math.floor(_seconds % 60),
                ms = Math.floor((_seconds % 1) * 100)
    
            return padTime(hours) + ":" + padTime(minutes) + ":" + padTime(seconds) + '.' + padTime(ms)
        }
    })