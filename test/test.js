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


    describe("GET /videos", () => {
        it("should answer an array of videos", (done) => {
            chai.request(server)
                 .get('/videos')
                 .end((err, res) => {
                     res.should.have.status(200)
                     res.should.be.json
                     res.body.should.be.a('array')
                     done()
                  })
         })
    })



    describe("GET /tags", () => {
        it("should answer an array of tags", (done) => {
            chai.request(server)
                 .get('/tags')
                 .end((err, res) => {
                     res.should.have.status(200)
                     res.should.be.json
                     res.body.should.be.a('array')
                     done()
                  })
         })
    })


})
