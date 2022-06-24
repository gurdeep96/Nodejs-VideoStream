const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const request = require("request");

const publicDirectoryPath = path.join(__dirname,'/public')
app.use(express.static(publicDirectoryPath))

app.get("/",(req, res)=> {
    res.sendFile(__dirname + "/public/index.html");
});

 app.get("/video",(req, res)=> {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoPath = publicDirectoryPath +"/bunny_video.mp4"
    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": CHUNK_SIZE,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
})

app.get("/video-online",(req,res)=>{

    var fileUrl = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
    //var fileUrl = 'https://ia800300.us.archive.org/1/items/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4'
    var range = req.headers.range;
    //console.log(range)
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    var positions, start, end, total, chunksize;

    // HEAD request for file metadata
    request({url: fileUrl,method: 'HEAD' }, function(error, response, body){
        setResponseHeaders(response.headers);
        pipeToResponse();
    })

    function setResponseHeaders(headers){
        positions = range.replace(/bytes=/, "").split("-");
        //console.log(range)
        start = parseInt(positions[0], 10); 
        total = headers['content-length'];
        end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        chunksize = (end-start)+1;

        res.writeHead(206, { 
            "Content-Range": "bytes " + start + "-" + end + "/" + total, 
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type":"video/mp4"
        });
    }

    function pipeToResponse() {
    var options = {
        url: fileUrl,
        headers: {
        range: "bytes=" + start + "-" + end,
        connection: 'keep-alive'
        }
    };

    request(options).pipe(res);
    }
})

app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port 3000!");
});