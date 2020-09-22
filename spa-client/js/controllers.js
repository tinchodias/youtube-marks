

class MainController {

  constructor($scope, $state, MarksService, $document) {
  
    MarksService.summaryOfAllVideos()
      .then(list => {
        $scope.summaryOfAllVideos = list
      })

    $scope.selectedVideoChanged = () => {
      MarksService.videoDetail($scope.selectedVideo.youtubeId).then(video => {
        $scope.session = video
        $scope.thePlayer.loadVideoById(video.youtubeId, 0)
      })
    }

    $scope.refreshVideo = () => {
      console.log("refreshing", $scope.selectedVideo.youtubeId)
      MarksService.videoDetail($scope.selectedVideo.youtubeId).then(video => {
        $scope.session = video
      })
    }

    $scope.insertMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      MarksService.addEmptyMark(timestamp, $scope.session.youtubeId)
      $scope.refreshVideo()

      $scope.thePlayer.pauseVideo()
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

  constructor(MarksService, $scope, $state, $timeout, growl) {
    this.marksService = MarksService
    this.scope = $scope
    this.state = $state
    this.timeout = $timeout
    this.growl = growl
    this.descriptionToEdit = ''
    this.currentMark = null

    self = this

    var updateRegularly = function() {
      $timeout(function () {
        self.currentMark = self.getCurrentMark()
        updateRegularly()}, 500)
    } 
    updateRegularly()
  }

  getCurrentMark() {
    if(!this.scope.thePlayer || !this.scope.thePlayer.currentState) return(null)
    return(this.marksService.getMarkCorrespondingTo(this.scope.thePlayer.getCurrentTime(), this.scope.session.youtubeId))
  }

  currentMarkLabel() {
    let current = this.currentMark
    return current? current.description : 'No current mark'
  }

  seekTo(timestamp) {
    this.scope.thePlayer.seekTo(timestamp, true)
  }

  editMarkAt(timestamp) {
    this.scope.thePlayer.pauseVideo()
    this.state.go("editMarkState", {timestamp: timestamp})
  }

  removeMarkAt(timestamp) {
    if (confirm("DELETE?")) {
      let mark = this.marksService.getMarkCorrespondingTo(timestamp, this.scope.session.youtubeId)
      this.marksService.removeMark(mark)
    }
  }

}


class EditMarkController {

  constructor($stateParams, $state, $scope, MarksService) {

    if ($scope.session) {
      this.mark = MarksService.getMarkCorrespondingTo($stateParams.timestamp, $scope.session.youtubeId)
    }
    if (!this.mark) {
      $state.go("listMarksState")
      console.log("This should not happen")
      return
    } 

    this.state = $state
    this.$scope = $scope
    this.MarksService = MarksService

    this.descriptionToEdit = this.mark.description   

    console.log("MARK TO EDIT", this.mark)

  }

  acceptEdit() {
    console.log("acceptEdit")
    this.mark.description = this.descriptionToEdit
    this.MarksService.updateMark(this.mark, this.$scope.session.youtubeId)
    this.$scope.refreshVideo()
    this.state.go("listMarksState")
  }

}
