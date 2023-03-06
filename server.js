const http = require('http');
const url = require("url");
const PORT = 3000;
const path = require("path");
const fs = require("fs");

const { createReadStream } = require('fs');

function handleLog(req, statusCode, msg) {
    let time = new Date().toDateString();
    let { method } = req;
    let clientIp = req.socket.remoteAddress;
    let requestUrl = req.url;
    let logMessage = time + "\t\t" + method + "\t\t" + statusCode + "\t\t" + clientIp + "\t\t" + requestUrl + "\t\t" + msg + "\n";
    fs.appendFile('log.txt', logMessage, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("successfully logged")
        }
    })
};

function getContentType(ext) {
    switch (ext) {
        case 'txt':
            return 'text/plain';
        case 'html':
            return 'text/html';
        case 'js':
            return 'text/javascript';
        case 'css':
            return 'text/css';
        case 'png':
            return 'image/png';
        case 'jpg':
            return 'image/jpg';
        case 'jpeg':
            return 'image/jpeg';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'mp4':
            return 'video/mp4';
        default:
            return 'application/octet-stream';
    }
}

function readDirectory(filePath, url) {
    if (url == "/")
        url = "";
    let s = `<h1>List of Files:</h1>`;
    try {
        s += `<ol>`
        const res = fs.readdirSync(filePath);
        res.forEach(file => {
            s += `<li><p> <a style="text-decoration:none" href= "http://localhost:${PORT}${url}/${file}">${file}</a></li>`
        });
        s += `</ol`;
    } catch (err) {
        return [0, err];
    }
    return [1, s];
}

const server = http.createServer((request, response) => {
    const { headers, method, url } = request;
    console.log(method + ", " + url);

    if (method !== "GET") {
        response.statusCode = 405;
        response.end("Method Not Allowed");
        handleLog(req, response.statusCode, "Method Not Allowed");
    };

    const filePath = __dirname + url;
    console.log("directory: " + __dirname);
    console.log("file path : " + filePath);

    let arr = url.split('/');
    let reqContent = arr[arr.length - 1];
    console.log("requested : ", reqContent);

    if (!fs.existsSync(filePath)) {
        response.writeHead(404, {
            "Content-Type": "text/plain"
        });
        handleLog(request, response.statusCode, `${reqContent} file does not exists`);
        response.end(`${reqContent} file does not exists\n` + "404 Not Found");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            response.statusCode = 505;
            handleLog(request, 500, " Internal Server Error");
            return
        }
        if (stats.isFile()) {
            console.log("#requested url is a file");
            fs.access(filePath, fs.constants.R_OK, function (err) {
                if (err) {
                    response.writeHead(404, {
                        "Content-Type": "text/plain"
                    });
                    response.end(`${reqContent} file cannot be accessed`);
                    handleLog(request, 403, "Forbidden");
                    return;
                }
                let ext = reqContent.split('.')[1];
                const contentType = getContentType(ext);
                
                console.log("extension: " + ext);
                console.log("con-type: ", contentType);

                response.writeHead(200, {
                    'Content-Type': contentType
                });

                const fileStream = createReadStream(filePath);
                fileStream.on('error', (e) => {
                    console.log(e);
                    handleLog(request, 500, " Internal Server Error");
                })
                    .pipe(response)
                    .on('error', (err) => {
                        console.log(e);
                        handleLog(request, 500, " Internal Server Error");

                    });

                fileStream.on('close', () => {
                    response.statusCode = 200;
                    handleLog(request, 200, "OK, file has successfully streamed");
                    console.log("file streaming has been closed");
                });
            });

        } else if (stats.isDirectory()) {
            let fileList = readDirectory(filePath, url);
            if (!fileList[0]) {
                response.statusCode = 500;
                res.end("Error while reading the directory \n Internal server error");
                handleLog(request, 500, " Internal Server Error");
                return;
            }
            console.log("#requested url is a a directory");
            console.log(fileList);
            response.end(fileList[1]);
            handleLog(request, 200, "OK");
            return;
        }
    });
}).listen(PORT, () => {
    console.log(`Server has started at http://localhost:${PORT}`);
});
