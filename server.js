const express = require('express')
const bodyParser = require('body-parser')
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
var _ = require('lodash');
var cors = require('cors')

const port = 8080

const app = express()
app.use(bodyParser.json())
app.use(cors())

// Setting up the public directory
app.use('/node_modules', express.static('node_modules'))
app.use(express.static('spa-client'))


class VideosDB {

    constructor(db) {
      this.db = db
    }

    async ready() {
      return this.db.defaults({ videos: [] }).write()
    }

    async videoById(id) {
      const videoOrUndefined = this.db.get('videos').find({ youtubeId: id }).value()

console.log(videoOrUndefined)

      if (!videoOrUndefined) {
        throw new Error('That youtubeId does not exist')
      }

      return videoOrUndefined
    }

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

    async markCorrespondingTo(timestamp, youtubeId) {
      const markOrUndefined = await this.videoById(youtubeId).then(video => 
        video.marks
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp)
          .find(mark => mark.timestamp <= timestamp))

      if (!markOrUndefined) {
        throw new Error('There is no mark for that timestamp')
      }

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

        oldMark.desciption = mark.description
        console.log("updating", mark, oldMark)

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

  }

// Create database instance and start server
low(new FileAsync('db.json'))
  .then(db => new VideosDB(db))
  .then(videosDB => {

    app.get('/videos', (req, res) => {
      videosDB.summaryOfAllVideos()
        .then(list => res.send(list))
    })

    app.post('/videos', (req, res) => {
      videosDB.addVideo(req.body).then(
        _ => res.sendStatus(200),
        error => res.status(400).send(error.message))
    })

    app.get('/videos/:youtubeId', (req, res) => {
      videosDB.videoById(req.params.youtubeId).then(
        video => res.send(video),
        error => res.status(404).send(error.message))
    })

    app.post('/videos/:youtubeId/marks', (req, res) => {
      videosDB.addMark(req.body, req.params.youtubeId).then(
        _ => res.sendStatus(200),
        error => res.status(400).send(error.message))
    })

    app.put('/videos/:youtubeId/marks/:timestamp', (req, res) => {
      videosDB.updateMark(req.body, req.params.youtubeId).then(
        _ => res.sendStatus(200),
        error => res.status(400).send(error.message))
    })

    app.get('/videos/:youtubeId/marks/:timestamp', (req, res) => {
      videosDB.markCorrespondingTo(req.params.timestamp, req.params.youtubeId).then(
        mark => res.send(mark),
        error => res.status(404).send(error.message))
    })

    app.delete('/videos/:youtubeId/marks/:timestamp', (req, res) => {
      videosDB.deleteMark(req.params.timestamp, req.params.youtubeId).then(
        mark => res.send(mark),
        error => res.status(404).send(error.message))
    })

    return videosDB.ready()
  })
  .then(() => {
    app.listen(port, () => console.log(`listening on http://localhost:${port}/`))
  })


