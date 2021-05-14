/**
 * Notes:
 * 
 * - This controller is the only that's always present because it's loaded from body element.
 * 
 * - the inline xeditable form element disables key bindings and 
 * may not re-enable them (for example, if user presses in import and project button).
 */
class BodyController {
  constructor($scope, $transitions) {

    $scope.listMarksControllerHackyList = []

    var tearDownListMarksController = function() {
      $scope.listMarksControllerHackyList.forEach(element => {
        element.tearDownThis()
      })
      $scope.listMarksControllerHackyList = []
    }

    $scope.enableVideoKeyBindings = (aBoolean) => {
      $scope.videoKeyBindingsEnabled = aBoolean
    }

    $transitions.onEnter({entering: "video.listMarks"}, function(){
      $scope.enableVideoKeyBindings(true)
    })

    $transitions.onExit({exiting: "video.listMarks"}, function(){
      tearDownListMarksController()
    })

  }
}



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

  hackySubmit(event, form) {
    if (event.keyCode == 13) {
      form.$submit() // Enter Key Processing
    } else if (event.keyCode == 27) {
      form.$cancel() // Escape key processing
    }
  }


  /* Video CRUD */

  addEmptyVideo() {
    var youtubeId = prompt("Please, enter the YouTube ID (for example: 'bCFQz5jvR4g'). Note: It won't be possible to edit this value from the tool.")
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

  updateVideo(data, youtubeId) {
    this.MarksService.videoDetail(youtubeId)
      .then(video => {
        video.description = data.description
        this.MarksService.updateVideo(video)
      })
      .then(_ => this.refresh())
  }


  /* Tag CRUD */

  addEmptyTag() {
    var id = prompt("Please, enter a short identifier for the new tag. Note: It won't be possible to edit this value from the tool.")
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

  constructor($scope, $stateParams, MarksService, youtubeEmbedAPI) {


    
    // Create an <iframe> (and YouTube player)
    $scope.thePlayer = new YT.Player('ytPlayer', {
        height: '800',
        width: '100%',
        videoId: $stateParams.youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1
        }
      })



    $scope.refreshVideo = () => {
      return MarksService.videoDetail($stateParams.youtubeId)
        .then(video => {
          $scope.currentVideo = video
          return video
        })
    }
    $scope.refreshVideo()

    $scope.seekDelta = (delta) => {
      const current = $scope.thePlayer.getCurrentTime()
      $scope.thePlayer.seekTo(current + delta, true)
    }

  }

}


class ListMarksController {

  constructor(MarksService, $scope, $state, $stateParams, $filter, download, $timeout, $document) {
    this.MarksService = MarksService
    this.$scope = $scope
    this.$state = $state
    this.$stateParams = $stateParams
    this.$filter = $filter
    this.download = download
    this.$document = $document

    // Hacky: we assume that tags don't change while this controller lives
    this.MarksService.allTags().then(list => this.allTags = list)

    $scope.addMark = (tag) => {
      const currentTime = $scope.thePlayer.getCurrentTime()
      const youtubeId = $scope.currentVideo.youtubeId

      MarksService.getMarkCorrespondingTo(currentTime, youtubeId)
        .then(existingMark => {
          // Especially when video is paused, unintended keypress repetitions produce 
          // multiple marks with the same timestamp and tag, which we will avoid here
          if (existingMark.timestamp != currentTime || existingMark.tagId != tag.id) {
            MarksService.addEmptyMark(
              currentTime,
              youtubeId,
              tag.id)
            $scope.refreshVideo()
          }
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

    this.tearDown = false
    var self = this
    var updateRegularly = function () {
      $timeout(function () {
        if ($scope.thePlayer && $scope.thePlayer.currentState && $scope.currentVideo) {
          MarksService.getMarkCorrespondingTo($scope.thePlayer.getCurrentTime(), $scope.currentVideo.youtubeId)
            .then(aMark => $scope.currentMark = aMark)
        }
        // console.log("updateRegularly")
        if (!self.tearDown) {
          updateRegularly()
        } else {
          // console.log("Stop updateRegularly")
        }
      }, 200)
    }
    updateRegularly()

    const keyHandler = (e) => {
//      console.log(e.key, $scope.thePlayer)

      // Ignore key, it's editing mode.
      if (!$scope.videoKeyBindingsEnabled) {
        return
      }

      // Toggle play/stop
      if (e.key == " ") {
        $scope.togglePlay()
        e.preventDefault()
      }

      // Add mark with a tag, if key matches
      if (self.allTags) {
        const found = self.allTags.find(each => each.keyBinding == e.key)
        if (found) {
          $scope.addMark(found)
          e.preventDefault()
        }
      }

      $scope.$apply()
    }
    $document.bind('keypress', keyHandler)

    $scope.listMarksControllerHackyList.push(this)

  }

  tearDownThis() {
    // Remove all current listeners (dangerous)
    // to avoid multiple bind due to router transitions
    this.$document.unbind('keypress')
    this.tearDown = true
  }

  hackySubmit(event, form) {
    if (event.keyCode == 13) {
      form.$submit() // Enter Key Processing
    } else if (event.keyCode == 27) {
      form.$cancel() // Escape key processing
    }
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
      return selected.length ? selected[0].color : ''
    } else {
      return '';
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