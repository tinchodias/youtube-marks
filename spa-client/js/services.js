
class Mark {
	constructor(timestamp, description, tagId) {
		this.timestamp = timestamp
    this.description = description
    this.tagId = tagId
	}
}

class Tag {
	constructor(id, description, keyBinding, color) {
		this.id = id
    this.description = description
    this.keyBinding = keyBinding
    this.color = color
	}
}

class Video {
  constructor(youtubeId, description, marks) {
    this.youtubeId = youtubeId
    this.description = description
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

  addEmptyTag(id) {
    return this.$http.post('tags', new Tag(id, "", "", "#0000ff"))
  }

  deleteTag(id) {
    return this.$http.delete(`tags/${id}`)
  }

  updateTag(aTag) {
    return this.$http.put('tags', aTag)
  }


  summaryOfAllVideos() {
    return this.$http.get('videos').then(result => result.data)
  }

  addEmptyVideo(youtubeId) {
    return this.$http.post('videos', new Video(youtubeId, "", []))
  }

  updateVideo(video) {
    return this.$http.put('videos', video)
  }

  deleteVideo(youtubeId) {
    return this.$http.delete(`videos/${youtubeId}`)
  }

  videoDetail(youtubeId) {
    return this.$http.get(`videos/${youtubeId}`).then(result => Object.setPrototypeOf(result.data, Video.prototype))
  }

  addEmptyMark(timestamp, youtubeId, tagId) {
    return this.$http.post(`videos/${youtubeId}/marks`, new Mark(timestamp, "", tagId))
  }

  updateMark(mark, youtubeId) {
    return this.$http.put(`videos/${youtubeId}/marks/${mark.timestamp}`, mark)
  }

  getMarkCorrespondingTo(timestamp, youtubeId) {
    return this.$http.get(`videos/${youtubeId}/marks/${timestamp}`).then(
      result => result.data)
  }

  deleteMark(mark, youtubeId) {
    return this.$http.delete(`videos/${youtubeId}/marks/${mark.timestamp}`)
  }

}
