

class MainController {

  constructor($scope, $state, MarksService, $document) {
  
    $scope.thePlayerVideoId = "123"

    MarksService.summaryOfAllVideos()
      .then(list => $scope.summaryOfAllVideos = list)

    $scope.refreshVideo = () => {
      console.log("refreshing", $scope.selectedVideo.youtubeId)
      return MarksService.videoDetail($scope.selectedVideo.youtubeId)
        .then(video => {
          $scope.currentVideo = video
          return video
        })
    }

    $scope.selectedVideoChanged = () => {
      $scope.refreshVideo().then(video => {
        console.log(video)
        $scope.thePlayerVideoId = video.youtubeId
      })
    }

    $scope.insertMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      MarksService.addEmptyMark(timestamp, $scope.currentVideo.youtubeId)
      $scope.refreshVideo()

      $state.go("editMarkState", {timestamp: timestamp})
    }

    $scope.editMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      $state.go("editMarkState", {timestamp: timestamp})
    }

    $scope.togglePlay = () => {
      // Source: https://developers.google.com/youtube/iframe_api_reference#Playback_status
      if ($scope.thePlayer.getPlayerState() == 1 /* playing */) {
        $scope.thePlayer.pauseVideo()
      } else {
        $scope.thePlayer.playVideo()
      }
    }

    $document.bind('keydown', function (e) {

      if ($state.current.name == "editMarkState") {
        return
      }

      // Space key: Toggle play/stop
      if (e.keyCode == 32) {
        $scope.togglePlay()
      }

      // I key: Insert mark
      if (e.keyCode == 73) {
        $scope.insertMark()
      }

      // E key: Edit mark
      if (e.keyCode == 69) {
        $scope.editMark()
     }

      $scope.$apply()
    })
  }


}


class ListMarksController {

  constructor(MarksService, $scope, $state, $timeout) {

    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.currentMark = null

    const self = this

    var updateRegularly = function() {
      $timeout(function () {

        if ($scope.thePlayer && $scope.thePlayer.currentState) {
          MarksService.getMarkCorrespondingTo($scope.thePlayer.getCurrentTime(), $scope.currentVideo.youtubeId)
            .then(aMark => self.currentMark = aMark)
        }

        updateRegularly()}, 500)
    } 
    updateRegularly()
  }

  currentMarkLabel() {
    return this.currentMark ?
      this.currentMark.description :
      '---'
  }

  seekTo(timestamp) {
    this.$scope.thePlayer.seekTo(timestamp, true)
  }

  editMarkAt(timestamp) {
    console.log(self.MarksService)
    this.$scope.thePlayer.pauseVideo()
    this.$state.go("editMarkState", {timestamp: timestamp})
  }

  removeMarkAt(timestamp) {
    console.log(self.MarksService)
    if (confirm("DELETE?")) {
      console.log(self.MarksService)
      self.MarksService.getMarkCorrespondingTo(timestamp, this.$scope.currentVideo.youtubeId)
        .then(mark => self.MarksService.removeMark(mark))
    }
  }

}


class EditMarkController {

  constructor($stateParams, $state, $scope, MarksService) {

    const self = this

    MarksService.getMarkCorrespondingTo($stateParams.timestamp, $scope.currentVideo.youtubeId)
      .then(aMark => {
        self.mark = aMark
        self.descriptionToEdit = self.mark.description   
      })

    this.$state = $state
    this.$scope = $scope
    this.MarksService = MarksService
  }

  acceptEdit() {
    console.log("acceptEdit", this.mark, this.descriptionToEdit)
    this.mark.description = this.descriptionToEdit
    this.MarksService.updateMark(this.mark, this.$scope.currentVideo.youtubeId)
    this.$scope.refreshVideo()
    this.$state.go("listMarksState")
  }

}
