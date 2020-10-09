

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
        video.description = data.description
        this.MarksService.updateVideo(video)
      })
      .then(_ => this.refresh())
  }


  /* Tag CRUD */

  addEmptyTag() {
    var id = prompt('Please, enter an ID for the new tag (for example: "obs")')
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

  updateTag(data, id) {
    data.id = id
    this.MarksService.updateTag(data)
      .then(_ => this.refresh())
  }

}


class VideoController {

  constructor($scope, $stateParams, MarksService, $document, $timeout) {

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

      const tagId = tag ? tag.id : null

      MarksService.addEmptyMark(timestamp, $scope.currentVideo.youtubeId, tagId)
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

  constructor(MarksService, $scope, $state, $stateParams, $filter, download) {
    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.$stateParams = $stateParams
    this.$filter = $filter
    this.download = download

    this.MarksService.allTags()
      .then(list => this.allTags = list)
  }

  updateMark(data, timestamp) {
    const youtubeId = this.$scope.currentVideo.youtubeId
    this.MarksService.getMarkCorrespondingTo(timestamp, youtubeId)
      .then(aMark => {
        Object.assign(aMark, data)
        this.MarksService.updateMark(aMark, youtubeId)
      })
  }

  downloadCSV() {
    this.$scope.refreshVideo().then(json => {
      const csvContents = Papa.unparse(json.marks)
      this.download.fromData(csvContents, "text/csv", `marks-${this.$stateParams.youtubeId}.csv`)
    })
  }

  downloadJson() {
    this.$scope.refreshVideo().then(json => {
      this.download.fromData(angular.toJson(json.marks, 2), "application/json", `marks-${this.$stateParams.youtubeId}.json`)
    })
  }

  goToImportMarks() {
    this.$scope.thePlayer.pauseVideo()
    this.$state.go("video.importMarks", {
      youtubeId: this.$stateParams.youtubeId
    })
  }

  seekTo(timestamp) {
    this.$scope.thePlayer.seekTo(timestamp, true)
  }

  deleteMarkAt(mark) {
    if (confirm("DELETE?")) {
      this.MarksService.deleteMark(mark, this.$stateParams.youtubeId)
      this.$scope.refreshVideo()
    }
  }

  tagStringFor(mark) {
    return mark.tagId
  }

  tagColorFor(mark) {
    if (mark.tagId && this.allTags && this.allTags.length) {
      var selected = this.$filter('filter')(this.allTags, {id: mark.tagId})
      return selected.length ? selected[0].color : 'white'
    } else {
      return 'white';
    }
  }

}

class ImportMarksController {
  constructor(MarksService, $scope, $state, $stateParams) {
    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.$stateParams = $stateParams
  }

  importedMarksStatus() {
    if (this.importedMarks) {
      return `Found ${this.importedMarks.length} marks`
    } else {
      if (this.hasChoosenFile()) {
        return this.choosenFile().name
      } else {
        return "Choose a JSON or CSV file"
      }
    }
  }

  doImportRemovingCurrenttMarks(mustReplaceCurrentMarks) {
    this.MarksService.videoDetail(this.$stateParams.youtubeId)
      .then(video => {
        video.marks = mustReplaceCurrentMarks?
          this.importedMarks :
          video.marks.concat(this.importedMarks)

        this.MarksService.updateVideo(video)
        this.$scope.refreshVideo()
        this.goToListMarks()
      })
  }

  hasChoosenFile() {
    return document.getElementById('fileImport').files.length > 0
  }

  choosenFile() {
    return document.getElementById('fileImport').files[0]
  }

  processFile() {
    const file = this.choosenFile()
    const reader = new FileReader()

    reader.onloadend = e => {
      var raw = e.target.result

      if (file.name.endsWith(".json")) {
        this.processJson(raw)
      } else {
        this.processCSV(raw)
      }  
    }
    reader.readAsText(file)
  }

  processJson(string) {
    console.log("Processing JSON")
    
    this.importedMarks = angular.fromJson(string)
  }

  processCSV(string) {
    console.log("Processing CSV")

    const results = Papa.parse(string, {
      dynamicTyping: true,
      header: true
    })

    this.importedMarks = results.data
  }

  goToListMarks() {
    this.$state.go("video.listMarks", {
      youtubeId: this.$stateParams.youtubeId
    })
  }

}