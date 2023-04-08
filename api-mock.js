const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const txt = fs.readFileSync('./assets/test.txt', 'utf8')

app.use(bodyParser.json())

app.post('/ask', (req, res) => {
  const data = req.body
  console.log(data)

  // {"flag":int, "contents":[{"text":text, "voice":dir}], "playlist":[[dirs]]}
  let contents = []
  let playlist = []
  let flag = 0

  if (flag == 2) {
    contents.push({ text: txt })
  } else if (flag == 0) {
    contents.push({ text: '答案描述', voice: '../tmp/voice.wav' })
    playlist.push('../tmp/2s.mp4', '../tmp/5s.mp4', '../tmp/1s.mp4')

    contents = []
  }

  res.send({
    flag,
    contents,
    playlist,
  })
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
