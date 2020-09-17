
class Mark {
	constructor(timestamp, description) {
		this.timestamp = timestamp
		this.description = description
	}
}

class MarksService {

  addNewMark(timestamp, description) {
    this.session.marks.push(new Mark(timestamp, description))
  }

  getMarkCorrespondingTo(timestamp) {
    let sorted = this.session.marks.slice().sort(function(a, b){return b.timestamp - a.timestamp})
    return sorted.find((mark) => mark.timestamp <= timestamp)
  }

  removeMark(mark) {
    let index = this.session.marks.indexOf(mark)
    if (index > -1) { 
      console.log("removing mark at index ", index)
      this.session.marks.splice(index, 1);
    } else {
      console.log("could not remove ", mark)
    }
  }


  constructor() {

    "Imported in index.html"
    this.allSessions = {
      s1: s1
    }

    this.session = this.allSessions.s1

  }

}
