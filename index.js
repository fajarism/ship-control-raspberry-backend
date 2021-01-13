const app = require('express')();
const http = require('http').createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "http://127.0.0.1:3000",
        methods: ["GET", "POST"]
      }
})
const cors = require("cors");
const moment = require('moment');
const fs = require("fs")
const fileUtils = require("./utilities/File")

const PORT_NUMBER = 4000

let isRecording = false
let fileStream

app.use(cors())

app.get('/', (req, res) => {
  res.send('<h1>Hello worlds</h1>');
});

io.on("connection", (socket) => {
    let streamRoutine = null
    
    socket.on("disconnect", () => {
        console.log("disconnected")
        if(streamRoutine) clearInterval(streamRoutine)
    })

    socket.on("ship_control_stream_recording_start", (data) => {
        console.log("starting")
        console.log(data)

        let isFileExist = fileUtils.isFileExist(data.filename)
        if(isFileExist.success) {
            io.sockets.emit("ship_control_stream_recording_stopped_file_exists", {
                filename : data.filename
            })
        } else {
            fileStream = fileUtils.openFile(isFileExist.filename)
            
            // Create headers
            fileUtils.saveToFile(fileStream, "timestamp,rudder,yaw \n")
            isRecording = true
            io.sockets.emit("ship_control_stream_recording_started", {})
        }
    })

    socket.on("ship_control_stream_recording_stop", (data) => {
        console.log("stopping")
        console.log(data)
        isRecording = false
        io.sockets.emit("ship_control_stream_recording_stopped", {})
    })

    streamRoutine = setInterval(() => {
        let timestamp = moment().valueOf()
        let rudder = 20.0 + (Math.random() * 5)
        let yaw = 0.0 + (Math.random() * 5) 

        if(isRecording) fileUtils.saveToFile(fileStream, `${timestamp},${rudder},${yaw} \n`)

        socket.emit("ship_control_stream", {
            timestamp,
            rudder,
            yaw
        })
    }, 1000)

    console.log("a user connected")
})

http.listen(PORT_NUMBER, () => {
  console.log(`listening on *:${PORT_NUMBER}`);
});