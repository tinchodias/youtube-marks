// Import the dependencies for testing
var chai = require('chai')
var chaiHttp = require('chai-http')
chai.use(chaiHttp)
chai.should()


describe("Server", () => {
    var server

    before(done => {
        server = require('../index')
        server.on('started!', done)
    })
    after(() => server.close());

    /* HTML */
    describe("GET /", () => {
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
    describe("GET /videos", () => {
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
    describe("POST /videos", () => {
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
    })


    /* TAGS */
    describe("GET /tags", () => {
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


})
