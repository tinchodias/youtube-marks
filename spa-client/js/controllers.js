

class MainController {

  constructor($scope, $state, MarksService, $document, $timeout) {
  
    $scope.thePlayerVideoId = "123"

    MarksService.summaryOfAllVideos()
      .then(list => $scope.summaryOfAllVideos = list)

    $scope.refreshVideo = () => {
      return MarksService.videoDetail($scope.selectedVideoYoutubeId)
        .then(video => {
          $scope.currentVideo = video
          return video
        })
    }

    $scope.selectedVideoChanged = (selectedVideoYoutubeId) => {
      $scope.selectedVideoYoutubeId = selectedVideoYoutubeId

      $scope.refreshVideo().then(video => {
        $scope.thePlayerVideoId = video.youtubeId

        $state.go("video.listMarks", { youtubeId: video.youtubeId })
      })
    }

    $scope.insertMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      MarksService.addEmptyMark(timestamp, $scope.currentVideo.youtubeId)
      $scope.refreshVideo()

      $state.go("video.editMark", { youtubeId: $scope.currentVideo.youtubeId, timestamp: timestamp })
    }

    $scope.editMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      $state.go("video.editMark", { youtubeId: $scope.currentVideo.youtubeId, timestamp: timestamp})
    }

    $scope.togglePlay = () => {
      // Source: https://developers.google.com/youtube/iframe_api_reference#Playback_status
      if ($scope.thePlayer.getPlayerState() == 1 /* playing */) {
        $scope.thePlayer.pauseVideo()
      } else {
        $scope.thePlayer.playVideo()
      }
    }

    var updateRegularly = function() {
      $timeout(function () {
        if ($scope.thePlayer && $scope.thePlayer.currentState && $scope.currentVideo) {
          MarksService.getMarkCorrespondingTo($scope.thePlayer.getCurrentTime(), $scope.currentVideo.youtubeId)
            .then(aMark => $scope.currentMark = aMark)
        }
        updateRegularly()}, 200)
    } 
    updateRegularly()


    $document.bind('keydown', function (e) {

      if ($state.current.name == "video.editMark") {
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

  constructor(MarksService, $scope, $state, $stateParams) {
    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.$stateParams = $stateParams
  }

  seekTo(timestamp) {
    this.$scope.thePlayer.seekTo(timestamp, true)
  }

  editMarkAt(mark) {
    this.$scope.thePlayer.pauseVideo()
    this.$state.go("video.editMark", {youtubeId: this.$stateParams.youtubeId, timestamp: mark.timestamp})
  }

  removeMarkAt(mark) {
    if (confirm("DELETE?")) {
      this.MarksService.removeMark(mark, this.$stateParams.youtubeId)
      this.$scope.refreshVideo()
    }
  }

}


class EditMarkController {

  constructor($stateParams, $state, $scope, MarksService) {

    const self = this

    MarksService.getMarkCorrespondingTo($stateParams.timestamp, $stateParams.youtubeId)
      .then(aMark => {
        self.mark = aMark
        self.descriptionToEdit = self.mark.description   
      })

    this.$state = $state
    this.$stateParams = $stateParams
    this.$scope = $scope
    this.MarksService = MarksService
  }

  acceptEdit() {
    this.mark.description = this.descriptionToEdit
    this.MarksService.updateMark(this.mark, this.$stateParams.youtubeId)
    this.$scope.refreshVideo()
    this.$state.go("video.listMarks", { youtubeId: this.$stateParams.youtubeId })
  }

  cancelEdit() {
    this.$state.go("video.listMarks", { youtubeId: this.$stateParams.youtubeId })
  }

}
