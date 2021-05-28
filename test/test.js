// Import the dependencies for testing
var chai = require('chai')
var chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.should()


describe("Server Integration Tests", () => {
    var server

    before(done => {
        server = require('../index')
        server.on('started!', done)
    })
    after(() => server.close());

    /* HTML */
    describe("Web page", () => {
        it("should answer a web page", (done) => {
            chai.request(server)
                 .get('/')
                 .end((err, res) => {
                     res.should.have.status(200)
                     res.should.be.html
                     done()
                  })
         })
    })

    /* VIDEOS */
    describe("Videos", () => {
        describe("GET", () => {
            it("should answer all videos", (done) => {
                const expectedVideos = require('./data/expected/get_videos.json')
                chai.request(server)
                     .get('/videos')
                     .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.json
                        res.body.should.be.a('array')
                        res.body.length.should.be.eql(2)
                        res.body.should.deep.equal(expectedVideos)
                        done()
                      })
             })
             it("should answer a specific video", (done) => {
                const expectedVideo = require('./data/expected/get_video.json')
                chai.request(server)
                     .get('/videos/' + expectedVideo.youtubeId)
                     .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.json
                        res.body.should.deep.equal(expectedVideo)
                         done()
                      })
             })
        })
        describe("POST", () => {
            it("should add a video with id only", (done) => {
                chai.request(server)
                    .post('/videos')
                    .send({
                        "youtubeId": "123"
                    })
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.text
                        res.text.should.equal('OK')
                        done()
                    })
             })
             it("should add a video with all properties", (done) => {
                chai.request(server)
                    .post('/videos')
                    .send({
                        "youtubeId": "789",
                        "title": "A title",
                        "marks": [ ]
                    })
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.text
                        res.text.should.equal('OK')
                        done()
                    })
             })
             it("should fail if video exists", (done) => {
                const existingVideo = require('./data/expected/get_video.json')
                chai.request(server)
                    .post('/videos')
                    .send({
                        "youtubeId": existingVideo.youtubeId
                    })
                    .end((err, res) => {
                        res.should.have.status(400)
                        done()
                    })
             })
        })
    })

    /* MARKS */
    describe("Marks", () => {

        describe("POST", () => {
            it("should answer all marks of several videos", (done) => {
                chai.request(server)
                    .post('/marks')
                    .send(['ymITEeAOtEA','aO4iYSNJxY4'])
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.json
                        res.body.should.deep.equal(require('./data/expected/get_grouped_marks_several_videos.json'))
                        done()
                    })
             })
             it("should answer grouped marks of a single video", (done) => {
                chai.request(server)
                     .post('/marks')
                     .send(['ymITEeAOtEA'])
                     .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.json
                        res.body.should.deep.equal(require('./data/expected/get_grouped_marks_single_video.json'))
                        done()
                      })
             })
             it("should fail if boody is not an array", (done) => {
                chai.request(server)
                    .post('/marks')
                    .end((err, res) => {
                        res.should.have.status(404)
                        done()
                    })
             })
        })
        
        describe("POST", () => {
            const existingVideo = require('./data/expected/get_video.json')
            it("should add a mark to a video", (done) => {
                chai.request(server)
                    .post(`/videos/${existingVideo.youtubeId}/marks`)
                    .send({
                        "timestamp": 12.34,
                        "description": "New mark",
                        "tagId": "meta"
                    })
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.text
                        res.text.should.equal('OK')
                        done()
                    })
            })
            it("should allow adding a mark with existing id (BUG?)", (done) => {
                const existingMarkId = existingVideo.marks[2].timestamp
                chai.request(server)
                    .post(`/videos/${existingVideo.youtubeId}/marks`)
                    .send({
                        "timestamp": existingMarkId,
                        "description": "New mark",
                        "tagId": "meta"
                    })
                    .end((err, res) => {
                        res.should.have.status(200)
                        done()
                    })
            })
        })
        describe("DELETE", () => {
            it("should delete a mark in a video", (done) => {
                const existingVideo = require('./data/expected/get_video.json')
                const existingMarkId = existingVideo.marks[2].timestamp
    
                chai.request(server)
                     .delete(`/videos/${existingVideo.youtubeId}/marks/${existingMarkId}`)
                     .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.text
                        res.text.should.equal('OK')
                         done()
                      })
             })
        })


    })


    /* TAGS */
    describe("Tags", () => {
        describe("GET", () => {
            it("should answer all tags", (done) => {
                chai.request(server)
                     .get('/tags')
                     .end((err, res) => {
                         res.should.have.status(200)
                         res.should.be.json
                         res.body.should.be.a('array')
                         res.body.length.should.be.eql(2)
                         res.body.should.deep.equal(require('./data/expected/get_tags.json'))
                         done()
                      })
             })
        })
        describe("POST", () => {
            it("should add a tag", (done) => {
                chai.request(server)
                    .post(`/tags`)
                    .send(    {
                        "id": "newForTest",
                        "description": "",
                        "keyBinding": "",
                        "color": "#00ffff"
                      })
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.should.be.text
                        res.text.should.equal('OK')
                        done()
                    })
            })
            it("should fail adding a tag with existing id", (done) => {
                chai.request(server)
                    .post(`/tags`)
                    .send(    {
                        "id": "ide",
                        "description": "",
                        "keyBinding": "",
                        "color": "#00ffff"
                      })
                    .end((err, res) => {
                        res.should.have.status(400)
                        done()
                    })
            })
        })
    })


    

})
