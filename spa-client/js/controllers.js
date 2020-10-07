

class ProjectController {

  constructor($state, MarksService) {
    this.$state = $state
    this.MarksService = MarksService

    this.refresh()
  }

  refresh() {
    this.MarksService.summaryOfAllVideos()
      .then(list => this.summaryOfAllVideos = list)

    this.MarksService.allTags()
      .then(list => this.allTags = list)
  }

  selectedVideoChanged(youtubeId) {
    this.$state.go("video.listMarks", { youtubeId: youtubeId })
  }

  insertVideo() {
    var youtubeId = prompt('Please, enter the YouTube ID (for example: bCFQz5jvR4g)')
    this.MarksService.addVideo(youtubeId, "").then(
      _ => this.selectedVideoChanged(youtubeId)
    )
  }

  deleteVideo(aVideo) {
    if (confirm("DELETE?")) {
      this.MarksService.deleteVideo(aVideo.youtubeId)
        .then(_ => this.refresh())
    }
  }

  saveVideo(data, youtubeId) {
    console.log(youtubeId, data.title)

    this.videoDetail(youtubeId)
      .then(video => {
          video.title = title
          this.MarksService.updateVideo(video)
        })
      .then(_ => this.refresh())
      
  }

}


class VideoController {

  constructor($scope, $state, $stateParams, MarksService, $document, $timeout) {

    $scope.thePlayerVideoId = $stateParams.youtubeId

    $scope.refreshVideo = () => {
      return MarksService.videoDetail($stateParams.youtubeId)
        .then(video => {
          $scope.currentVideo = video
          return video
        })
    }
    $scope.refreshVideo()

    $scope.insertMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      MarksService.addEmptyMark(timestamp, $scope.currentVideo.youtubeId)
      $scope.refreshVideo()

      $state.go("video.editMark", {
        youtubeId: $scope.currentVideo.youtubeId,
        timestamp: timestamp
      })
    }

    $scope.editMark = () => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      $state.go("video.editMark", {
        youtubeId: $scope.currentVideo.youtubeId,
        timestamp: timestamp
      })
    }

    $scope.togglePlay = () => {
      // Source: https://developers.google.com/youtube/iframe_api_reference#Playback_status
      if ($scope.thePlayer.getPlayerState() == 1 /* playing */) {
        $scope.thePlayer.pauseVideo()
      } else {
        $scope.thePlayer.playVideo()
      }
    }

    var updateRegularly = function () {
      $timeout(function () {
        if ($scope.thePlayer && $scope.thePlayer.currentState && $scope.currentVideo) {
          MarksService.getMarkCorrespondingTo($scope.thePlayer.getCurrentTime(), $scope.currentVideo.youtubeId)
            .then(aMark => $scope.currentMark = aMark)
        }
        updateRegularly()
      }, 200)
    }
    updateRegularly()


    $document.bind('keydown', function (e) {

      if ($state.current.name == "video.editMark") {
        return
      }

      // Space key: Toggle play/stop
      if (e.keyCode == 32) {
        $scope.togglePlay()
        e.preventDefault();
      }

      // I key: Insert mark
      if (e.keyCode == 73) {
        $scope.insertMark()
        e.preventDefault();
      }

      // E key: Edit mark
      if (e.keyCode == 69) {
        $scope.editMark()
        e.preventDefault()
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
    this.$state.go("video.editMark", {
      youtubeId: this.$stateParams.youtubeId,
      timestamp: mark.timestamp
    })
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
