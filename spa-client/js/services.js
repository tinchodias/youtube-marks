
class Mark {
	constructor(timestamp, description) {
		this.timestamp = timestamp
		this.description = description
	}
}

class Video {
  constructor(youtubeId, title, marks) {
    this.youtubeId = youtubeId
    this.title = title
    this.marks = marks
  }
}


class MarksService {

  constructor($http) {
    this.$http = $http
  }

  allTags() {
    return this.$http.get('tags').then(result => result.data)
  }

  summaryOfAllVideos() {
    return this.$http.get('videos').then(result => result.data)
  }

  addVideo(youtubeId, title) {
    return this.$http.post('videos', new Video(youtubeId, title, []))
  }

  updateVideo(youtubeId, title) {
    return this.$http.put('videos', new Video(youtubeId, title))
  }

  deleteVideo(youtubeId) {
    return this.$http.delete(`videos/${youtubeId}`)
  }

  videoDetail(youtubeId) {
    return this.$http.get(`videos/${youtubeId}`).then(result => Object.setPrototypeOf(result.data, Video.prototype))
  }

  addEmptyMark(timestamp, youtubeId) {
    return this.$http.post(`videos/${youtubeId}/marks`, new Mark(timestamp, ""))
  }

  updateMark(mark, youtubeId) {
    return this.$http.put(`videos/${youtubeId}/marks/${mark.timestamp}`, mark)
  }

  getMarkCorrespondingTo(timestamp, youtubeId) {
    return this.$http.get(`videos/${youtubeId}/marks/${timestamp}`).then(
      result => result.data)
  }

  removeMark(mark, youtubeId) {
    return this.$http.delete(`videos/${youtubeId}/marks/${mark.timestamp}`)
  }

}
