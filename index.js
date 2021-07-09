require('dotenv').config()

const port = process.env.app_PORT || 8080
const dbPath = process.env.DB_PATH || 'db.json'

const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

const VideosDB = require('./VideosDB')
const app = require('./app')


low(new FileAsync(dbPath))
  .then(db => new VideosDB(db))
  .then(videosDB => {
    app.videosDB = videosDB
    return videosDB.ready()
  })
  .then(() => {

    //Temporary, to migrate db:
    //app.videosDB.migrateTagId2TagIds()

    const server = app.listen(
        port, 
        () => {
            console.log(`db path: ${dbPath}; listening on http://localhost:${port}/`)
            app.close = () => server.close()
            app.emit('started!')
        })
  })


  module.exports = app