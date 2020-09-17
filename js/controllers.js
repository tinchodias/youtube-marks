
class MainController {

  constructor($scope, $state, MarksService, $document) {
    $scope.session = MarksService.session
    
    $document.bind('keydown', function (e) {

      if ($state.current.name == "editMarkState") {
        return
      }

      // Space key: Toggle play/stop
      if (e.keyCode == 32) {
        // Source: https://developers.google.com/youtube/iframe_api_reference#Playback_status
        if ($scope.thePlayer.getPlayerState() == 1 /* playing */) {
          $scope.thePlayer.pauseVideo()
        } else {
          $scope.thePlayer.playVideo()
        }
      }

      // I key: Insert mark
      if (e.keyCode == 73) {
        let timestamp = $scope.thePlayer.getCurrentTime()
        MarksService.addNewMark(timestamp, "")

        $scope.thePlayer.pauseVideo()
        $state.go("editMarkState", {timestamp: timestamp})
      }

      // E key: Edit mark
      if (e.keyCode == 69) {
        let timestamp = $scope.thePlayer.getCurrentTime()

        $scope.thePlayer.pauseVideo()
        $state.go("editMarkState", {timestamp: timestamp})
     }

      $scope.$apply()
    })
  }

  }


class ListMarksController {

  constructor(MarksService, $scope, $state, download, $timeout, growl) {
    this.marksService = MarksService
    this.scope = $scope
    this.state = $state
    this.timeout = $timeout
    this.download = download
    this.growl = growl
    this.descriptionToEdit = ''
    this.captureKeys = false
    this.currentMark = null
    this.session = MarksService.session

    self = this

    var updateRegularly = function() {
      $timeout(function () {
        self.currentMark = self.getCurrentMark()
        updateRegularly()}, 100)
    } 
    updateRegularly()
  }

  getCurrentMark() {
    if(!this.scope.thePlayer || !this.scope.thePlayer.currentState) return(null)
    return(this.marksService.getMarkCorrespondingTo(this.scope.thePlayer.getCurrentTime()))
  }

  currentMarkLabel() {
    let current = this.getCurrentMark()
    return current? current.description : 'No current mark'
  }

  downloadMarks() {
    this.download.fromData(angular.toJson(this.marksService.session.marks, 2), "application/json", "marks.json");
  }

  toggleCapture() {
    if(this.captureKeys) {
      this.stopCapture()
    } else {
      this.startCapture()
    }
  }

  startCapture() {
    this.scope.thePlayer.playVideo()
    //this.scope.thePlayer.seekTo(0, true)
    this.captureKeys = true
    this.growl.info("CAPTURE STARTED");
  }

  stopCapture() {
    this.scope.thePlayer.pauseVideo()
    this.captureKeys = false
    this.growl.info("CAPTURE STOPPED");
  }

  seekTo(timestamp) {
    this.scope.thePlayer.seekTo(timestamp, true)
  }

  editMarkAt(timestamp) {
    this.stopCapture()
    this.state.go("editMarkState", {timestamp: timestamp})
  }

  removeMarkAt(timestamp) {
    if (confirm("¿BORRAR?")) {
      let mark = this.marksService.getMarkCorrespondingTo(timestamp)
      this.marksService.removeMark(mark)
    }
  }

}



class EditMarkController {

  constructor($stateParams, $state, MarksService) {

    this.mark = MarksService.getMarkCorrespondingTo($stateParams.timestamp)
    this.state = $state

    if (!this.mark) {
      $state.go("listMarksState")
      return
    } 

    this.descriptionToEdit = this.mark.description   
  }

  acceptEdit() {
    this.mark.description = this.descriptionToEdit
    this.state.go("listMarksState")
  }

}
