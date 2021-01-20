const fs = require("fs")

module.exports = {
    isFileExist : (filename) => {
        filename += filename.indexOf(".txt") > -1 ? "" : ".txt"

        try {
            if(fs.existsSync(`./data/${filename}`)){
                return {
                    success : true
                }
            } else {
                return {
                    success : false,
                    error : 1,
                    message : "File not found",
                    filename
                }
            }            
        } catch(e) {
            return {
                success : false,
                error : 2,
                message : e
            }
        }
    },

    openFile : (filename) => {
        return fs.createWriteStream(`./data/${filename}`, {
            flags : "a"
        })
    },

    closeFile : (stream) => {
        stream.destroy()
    },

    saveToFile : (stream, data) => {
        stream.write(data)
    },

    getAllRecordFiles : () => {
        let files = fs.readdirSync("./data/")

        let returnFilteredFiles = []
        files.forEach((item, index) => {
            let file = fs.statSync(`./data/${item}`)
            if(file.isFile()) returnFilteredFiles.push({
                filename : item,
                date : file.atimeMs
            })    
        })

        returnFilteredFiles.sort((a, b) => {
            return b.date - a.date
        })

        return returnFilteredFiles
    }
}