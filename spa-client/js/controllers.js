

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

  
  /* Video CRUD */

  addEmptyVideo() {
    var youtubeId = prompt('Please, enter the YouTube ID (for example: bCFQz5jvR4g)')
    if (youtubeId && youtubeId.length > 0) {
      this.MarksService.addEmptyVideo(youtubeId).then(
        _ => this.refresh()
      )
    } else {
      alert("Invalid Youtube ID")
    }
  }

  deleteVideo(aVideo) {
    if (confirm("DELETE?")) {
      this.MarksService.deleteVideo(aVideo.youtubeId)
        .then(_ => this.refresh())
    }
  }

  saveVideo(data, youtubeId) {
    this.MarksService.videoDetail(youtubeId)
      .then(video => {
          video.title = data.title
          this.MarksService.updateVideo(video)
        })
      .then(_ => this.refresh())
  }


  /* Tag CRUD */

  addEmptyTag() {
    var id = prompt('Please, enter an ID for the new tag (for example: t1)')
    if (id && id.length > 0) {
      this.MarksService.addEmptyTag(id).then(
        _ => this.refresh()
      )
    } else {
      alert("Invalid ID")
    }
  }

  deleteTag(aTag) {
    if (confirm("DELETE?")) {
      this.MarksService.deleteTag(aTag.id)
        .then(_ => this.refresh())
    }
  }

  saveTag(data, id) {
    data.id = id
    this.MarksService.updateTag(data)
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

    $scope.addMark = (tag) => {
      let timestamp = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.pauseVideo()

      MarksService.addEmptyMark(timestamp, $scope.currentVideo.youtubeId, tag.id)
      $scope.refreshVideo()
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


    var self = this
    MarksService.allTags()
      .then(list => {
        self.allTags = list
      })

    $document.bind('keypress', function (e) {

      if ($scope.markRowForm) {
        console.log("Ignore key, it's editing mode.", $scope.markRowForm.$visible)
        return
      }

      // Toggle play/stop
      if (e.key == " ") {
        $scope.togglePlay()
        e.preventDefault();
      }

      // Add mark without tag
      if (e.key == 'i') {
        $scope.addMark()
        e.preventDefault();
      }

      // Add mark with a tag, if matches
      if (self.allTags) {
        const found = self.allTags.find(each => each.keyBinding == e.key)
        if (found) {
          $scope.addMark(found)
        }
      } else {
        console.log("allTags empty")
      }

      $scope.$apply()
    })
  }

}


class ListMarksController {

  constructor(MarksService, $scope, $state, $stateParams, $filter) {
    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.$stateParams = $stateParams
    this.$filter = $filter

    this.MarksService.allTags()
      .then(list => this.allTags = list)
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

  deleteMarkAt(mark) {
    if (confirm("DELETE?")) {
      this.MarksService.deleteMark(mark, this.$stateParams.youtubeId)
      this.$scope.refreshVideo()
    }
  }

  tagDescriptionFor(id) {
    return id
    // if (id && this.allTags && this.allTags.length) {
    //   var selected = this.$filter('filter')(this.allTags, {id: id})
    //   //console.log(selected)
    //   return selected.length ? selected[0].description : '?'
    // } else {
    //   return '-';
    // }
  }

}

