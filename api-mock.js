const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.post('/ask', (req, res) => {
  const data = req.body
  console.log(data)

  let flag = Math.floor(4 * Math.random()) - 1 // -1, 2
  let content = []
  let playlist = []
  flag = 0

  if (flag == 2) {
    content.push({ text: '参考答案1<br/>参考答案2<br/>参考答案3' })
  } else if (flag == 0) {
    content.push({ text: '答案描述', voice: '../tmp/voice.wav' })
    playlist.push('../tmp/2s.mp4', '../tmp/5s.mp4', '../tmp/1s.mp4')
  }

  res.send({
    flag,
    content,
    playlist,
  })
})

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
