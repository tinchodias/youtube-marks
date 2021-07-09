var _ = require('lodash')

class VideosDB {

    constructor(db) {
      this.db = db
    }

    async migrateTagId2TagIds() {
      await this.db.read()

      let allVideos = this.db.get('videos').value()
      allVideos.forEach(video => {
        video.marks.forEach(mark => {
          if (_.has(mark, "tagId")) {
            mark.tagIds = [ mark.tagId ]
            _.unset(mark, "tagId")
          }
        })
        this.updateVideo(video)
      })

      this.db.write()
    }

    async ready() {
      return this.db.defaults({ videos: [], tags: [] }).write()
    }

    async videoById(id) {
      const videoOrUndefined = this.db.get('videos').find({ youtubeId: id }).value()

      if (!videoOrUndefined) {
        throw new Error('That youtubeId does not exist')
      }

      return videoOrUndefined
    }


    /* TAGS */

    async tagById(theId) {
      const tagOrUndefined = this.db.get('tags').find({ id: theId }).value()

      if (!tagOrUndefined) {
        throw new Error('There is no tag with that id')
      }
      return tagOrUndefined
    }

    async allTags() {
      return Promise.resolve(
        this.db.get('tags').value())
    }

    async addTag(tag) {
      return this.tagById(tag.id).then(
        _ => Promise.reject(new Error('A tag with that id already exists')),
        _ => Promise.resolve(this.db.get('tags').push(tag).write()))
    }

    async updateTag(aTag) {
      return this.db.get('tags')
          .find({ id: aTag.id })
          .assign(aTag)
          .write()
    }

    async deleteTag(theId) {
      return this.db.get('tags')
          .remove({ id: theId })
          .write()
    }


    /* VIDEOS */

    summaryOf(video) {
      return (({ marks, ...other }) => other)(video)
    }

    async summaryOfAllVideos() {
      return Promise.resolve(
        this.db.get('videos')
          .map(video => this.summaryOf(video))
          .value())
    }

    async addVideo(video) {
      return this.videoById(video.youtubeId).then(
        _ => Promise.reject(new Error('That youtubeId already exists')),
        _ => Promise.resolve(this.db.get('videos').push(video).write()))
    }

    async updateVideo(video) {
      return this.db.get('videos')
          .find({ youtubeId: video.youtubeId })
          .assign(video)
          .write()
    }

    async deleteVideo(id) {
      return this.db.get('videos')
        .remove({ youtubeId: id })
        .write()
      
    }


    /* MARKS */

    async markCorrespondingTo(timestamp, youtubeId) {
      const markOrUndefined = await this.videoById(youtubeId).then(video => 
        video.marks
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp)
          .find(mark => mark.timestamp <= timestamp))

      // if (!markOrUndefined) {
      //   throw new Error('There is no mark for that timestamp')
      // }

      return markOrUndefined
    }

    async addMark(mark, youtubeId) {
      return this.videoById(youtubeId).then(video => {
        var marks = video.marks

        marks.push(mark)

        this.db.get('videos')
          .find({ youtubeId: youtubeId })
          .assign({ marks: marks })
          .write()
      })
    }

    async updateMark(mark, youtubeId) {
      return this.videoById(youtubeId).then(video => {
        var marks = video.marks

        let oldMark = _.find(marks, { timestamp: mark.timestamp })
        if (!oldMark) {
          throw new Error('There is no mark for that timestamp')
        }

        oldMark.description = mark.description
        oldMark.tagIds = mark.tagIds

        this.db.get('videos')
          .find({ youtubeId: youtubeId })
          .assign({ marks: marks })
          .write()
      })
    }

    async deleteMark(timestamp, youtubeId) {
      return this.videoById(youtubeId).then(video => {
        let newMarks = _.reject(video.marks, mark => mark.timestamp == timestamp)

        this.db.get('videos')
          .find({ youtubeId: youtubeId })
          .assign({ marks: newMarks })
          .write()
      })
    }

    async uniformMarks(data) {
      data.groupedMarks.forEach(groupedMark => {
        groupedMark.marks.forEach(mark => {
          const newMark = {
            timestamp: mark.timestamp,
            tagIds: mark.tagIds,
            description: data.newDescription
          }
          this.updateMark(newMark, mark.youtubeId)
        })
      })
    }


    /* QUERY: Grouped marks */

    async groupedMarks(arrayOfYoutubeIds) {

      if (!_.isArray(arrayOfYoutubeIds)) {
        throw new Error('Argument must be an array of youtubeIds to filter videos')
      }
      
      const filteredVideos = _.filter(this.db.get('videos').value(), video => _.includes(arrayOfYoutubeIds, video.youtubeId) ) 
      const marksWithYoutubeId = _.flatMap(
        filteredVideos, 
        video => _.map(video.marks, mark => {
          const clone = _.clone(mark)
          clone.youtubeId = video.youtubeId
          return clone
        }))

      const groups = _(marksWithYoutubeId)
        .groupBy(mark => mark.description)
        .toPairs()
        .sortBy(group => group[1].length)
        .reverse()
        .value()

      const complexResult = groups.map(group => { 
        return {
          "description": group[0],
          "occurrencesByYoutubeId": this.occurrencesByYoutubeId(group[1]),
          "occurrencesByTagId": this.occurrencesByTagId(group[1]),
          "total": group[1].length,
          "marks": group[1]
        }
      })

      // Useful to extract as expected results of test, when something in the model changed:
      //
      // console.log(JSON.stringify(complexResult))

      return complexResult
    }

    occurrencesByYoutubeId(data) {
      const groups = _.groupBy(data, each => each.youtubeId)
      return Object.entries(groups).map(group => {
        return {
          "youtubeId": group[0],
          "count": group[1].length
        }
      })
    }

    occurrencesByTagId(data) {
      const groups = _.groupBy(data, each => each.tagIds)
      return Object.entries(groups).map(group => {
        return {
          "tagId": group[0],
          "count": group[1].length
        }
      })
    }


    /* Statistics 

    Let's assume videos==participant (true on our GH analysis)

    * Number of occurences
    * Number of participants
    * Per participant:
      * average number of occurences
      * time to answer
      * maximum time to answer 
      * minimum time to answer 
    */
    async statistics(arrayOfYoutubeIds) {


      const groupedMarks = await this.groupedMarks(arrayOfYoutubeIds) 



      return {
        "groupedMarks": groupedMarks,
        "statistics": {
          "numberOfGroups": groupedMarks.length,
          "numberOfVideos": arrayOfYoutubeIds.length,
        }
      }
    }


}

module.exports = VideosDB