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
            controller: "VideoController as videoCtrl"
        })

        .state('video.listMarks', {
            url: "/video/:youtubeId",
            templateUrl: "partials/list_marks.html",
            controller: "ListMarksController as listMarksCtrl"
        })

        .state('video.editMark', {
            url: "/video/:youtubeId/mark/:timestamp",
            templateUrl: "partials/edit_mark.html",
            controller: "EditMarkController as editMarkCtrl"
        })

}