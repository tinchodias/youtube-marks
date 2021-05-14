function routes($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/")

    $stateProvider

        .state('project', {
            url: "/",
            templateUrl: "partials/project.html",
            controller: "ProjectController as projectCtrl"
        })

        .state('video', {
            abstract: true,
            templateUrl: "partials/video.html",
            controller: "VideoController as videoCtrl",

            // This is a hackky fast fix because VideoController needs YT.Player
            // I didn't know how to implement this more correctly.
            // According to docs, YT is ready after onYouTubeIframeAPIReady is announced.
            // See: https://github.com/tinchodias/youtube-notes/issues/1
            resolve: {
                youtubeEmbedAPI: function($q, $timeout){
                    var deferred = $q.defer();

                    var pollYoutubeEmbedAPILoaded = function () {
                        $timeout(function () {
                          if (YT) {
                            deferred.resolve('Loaded');
                          }
                          pollYoutubeEmbedAPILoaded()
                        }, 50)
                      }

                    pollYoutubeEmbedAPILoaded()

                    return deferred.promise;
                }
            }
        })

        .state('video.listMarks', {
            url: "/video/:youtubeId",
            templateUrl: "partials/list_marks.html",
            controller: "ListMarksController as listMarksCtrl"
        })

        .state('video.importMarks', {
            url: "/video/:youtubeId/import",
            templateUrl: "partials/import_marks.html",
            controller: "ImportMarksController as importMarksCtrl"
        })

        

}