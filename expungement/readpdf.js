const fs = require('fs')
const path = require('path')
console.log(__dirname)

const courthouses_path = path.join(__dirname, 'courthouses')

const filenames = fs.readdirSync(courthouses_path)

console.log(filenames[0])
