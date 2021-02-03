const app = require('express')();
const http = require('http').createServer(app);
const io = require("socket.io")(http, {
    // cors: {
    //     origin: "http://127.0.0.1:3000",
    //     methods: ["GET", "POST"]
    //   }
})
const cors = require("cors");
const Readline = require("@serialport/parser-readline")
const ByteLine = require("@serialport/parser-byte-length")

const fileUtils = require("./utilities/File");
const SerialPort = require('serialport');
const moment = require('moment');
const e = require('cors');

const PORT_NUMBER = 4000

let isRecording = false
let fileStream
let serialPort

app.use(cors())


/*serialPort = new SerialPort("/dev/cu.usbmodem14101", {
    baudRate : 9600
})*/
//serialPort.pipe(byteLineParser)

serialPort = new SerialPort("/dev/ttyACM0", {
        baudRate : 9600
})
let serialReadlineParser = new Readline()
// let byteLineParser = new ByteLine({
//     length : 10
// })
serialPort.pipe(serialReadlineParser)


app.get('/download/:filename', (req, res) => {
    let filepath = `./data/${decodeURI(req.params.filename)}`
    if(fileUtils.isFileExist(filepath)) {
        res.download(filepath)
    } else {
        res.sendStatus(404)
    }
})

app.get('/', (req, res) => {
  res.send('<h1>Hello worlds</h1>');
});


app.get('/connection', (req, res) => {
    res.send('<h1>Hello worlds</h1>');
  });

serialReadlineParser.on("data", (data) => {
    //console.log(data)
    let [timestamp, yaw, rudder] = data.split(",")

    if(isRecording) fileUtils.saveToFile(fileStream, `${timestamp},${parseFloat(rudder)},${parseFloat(yaw)}\n`)
    io.sockets.emit("ship_control_stream", {
        timestamp,
        rudder : parseFloat(rudder),
        yaw : parseFloat(yaw),
    })
})

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
            io.sockets.emit("ship_control_stream_recording_started", {
                filename : data.filename
            })
        }
    })

    socket.on("ship_control_stream_recording_stop", (data) => {
        console.log("stopping")
        console.log(data)
        isRecording = false
        
        io.sockets.emit("ship_control_stream_recording_stopped", {
            filename : data.filename
        })

        io.sockets.emit("ship_control_file_list", {
            files : fileUtils.getAllRecordFiles()
        })
    })

    // streamRoutine = setInterval(() => {
    //     let timestamp = moment().valueOf()
    //     let rudder = 20.0 + Math.random() * 3
    //     let yaw = 20.0 + Math.random() * 2

    //     if(isRecording) fileUtils.saveToFile(fileStream, `${timestamp},${parseFloat(rudder)},${parseFloat(yaw)}\n`)
    //     io.sockets.emit("ship_control_stream", {
    //         timestamp,
    //         rudder,
    //         yaw,
    //     })
    // }, 1000)

    io.sockets.emit("ship_control_file_list", {
        files : fileUtils.getAllRecordFiles()
    })
 
    console.log("a user connected")
})

http.listen(PORT_NUMBER, () => {
  console.log(`listening on *:${PORT_NUMBER}`);
});
