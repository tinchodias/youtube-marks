
class Mark {
	constructor(timestamp, description) {
		this.timestamp = timestamp
		this.description = description
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

  videoDetail(youtubeId) {
    return this.$http.get(`videos/${youtubeId}`).then(result => result.data)
  }

  addEmptyMark(timestamp, youtubeId) {
    return this.$http.post(`videos/${youtubeId}/marks`, new Mark(timestamp, ""))
  }

  updateMark(mark, youtubeId) {
    return this.$http.put(`videos/${youtubeId}/marks/${mark.timestamp}`, mark)
  }

  getMarkCorrespondingTo(timestamp, youtubeId) {
    return this.$http.get(`videos/${youtubeId}/marks/${timestamp}`).then(
      result => result.data,
      _ => null)
  }

  removeMark(mark, youtubeId) {
    return this.$http.delete(`videos/${youtubeId}/marks/${mark.timestamp}`)
  }

}
