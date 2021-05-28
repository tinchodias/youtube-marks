
const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')

const app = express()

app.use(bodyParser.json())
app.use(cors())

// Setting up the public directory
app.use('/node_modules', express.static('node_modules'))
app.use(express.static('spa-client'))



/* TAGS */

app.get('/tags', (req, res) => {
  app.videosDB.allTags()
    .then(list => res.send(list))
})

app.post('/tags', (req, res) => {
  app.videosDB.addTag(req.body).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.put('/tags', (req, res) => {
  app.videosDB.updateTag(req.body).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.delete('/tags/:id', (req, res) => {
  app.videosDB.deleteTag(req.params.id).then(
    _ => res.sendStatus(200),
    error => res.status(404).send(error.message))
})


/* VIDEOS */

app.get('/videos', (req, res) => {
  app.videosDB.summaryOfAllVideos()
    .then(list => res.send(list))
})

app.post('/videos', (req, res) => {
  app.videosDB.addVideo(req.body).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.put('/videos', (req, res) => {
  app.videosDB.updateVideo(req.body).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.get('/videos/:youtubeId', (req, res) => {
  app.videosDB.videoById(req.params.youtubeId).then(
    video => res.send(video),
    error => res.status(404).send(error.message))
})

app.delete('/videos/:youtubeId', (req, res) => {
  app.videosDB.deleteVideo(req.params.youtubeId).then(
    _ => res.sendStatus(200),
    error => res.status(404).send(error.message))
})

/* MARKS */

app.post('/videos/:youtubeId/marks', (req, res) => {
  app.videosDB.addMark(req.body, req.params.youtubeId).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.put('/videos/:youtubeId/marks/:timestamp', (req, res) => {
  app.videosDB.updateMark(req.body, req.params.youtubeId).then(
    _ => res.sendStatus(200),
    error => res.status(400).send(error.message))
})

app.get('/videos/:youtubeId/marks/:timestamp', (req, res) => {
  app.videosDB.markCorrespondingTo(req.params.timestamp, req.params.youtubeId).then(
    mark => res.send(mark),
    error => res.status(404).send(error.message))
})

app.delete('/videos/:youtubeId/marks/:timestamp', (req, res) => {
  app.videosDB.deleteMark(req.params.timestamp, req.params.youtubeId).then(
    _ => res.sendStatus(200),
    error => res.status(404).send(error.message))
})

app.post('/marks', (req, res) => {
  app.videosDB.groupedMarks(req.body).then(
    list => res.send(list),
    error => res.status(404).send(error.message))
})


app.post('/uniform', (req, res) => {
  app.videosDB.uniformMarks(req.body).then(
    _ => res.sendStatus(200),
    error => res.status(404).send(error.message))
})


module.exports = app
