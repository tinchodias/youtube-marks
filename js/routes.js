function routes($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/")

    $stateProvider

        .state('listMarksState', {
            url: "/",
            templateUrl: "partials/list_marks.html",
            controller: "ListMarksController as listMarksCtrl"
        })

        .state('editMarkState', {
            url: "/mark/:timestamp",
            templateUrl: "partials/edit_mark.html",
            controller: "EditMarkController as editMarkCtrl"
        })

}