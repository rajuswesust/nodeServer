const http = require('http');
const url = require("url");
const PORT = 3000;
const path = require("path");
const fs = require("fs");

const { createReadStream } = require('fs');

function handleLog(msg) {
    fs.appendFile('log.txt', msg + "\n\n", function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("successfully logged");
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

const server = http.createServer((request, response) => {
    console.log(`Server has started at  http://localhost:${PORT}/`);

    const { headers, method, url } = request;
    console.log(method + ", " + url);

    if (method !== "GET") {
        response.statusCode = 405;
        response.end(
            "Operation is not supported!"
        )
    };

    const filePath = __dirname + url;
    console.log("file path : " + filePath);

    let s = "", ok = 0;
    let ans = new Promise((resolve, reject) => {
        fs.readdir(__dirname, (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                files.forEach(file => {
                    s = s + file + "\n";
                    // console.log("->" + file);
                });
                resolve(s);
            }
        });
    });

    ans.then(x => {
        console.log(x);
        if (url == '/') {

            handleLog("list of files are requested");
            handleLog(x);

            response.end(x);
        }
    }).catch(err => {
        console.log(err);
    });


    let arr = url.split('/');
    let reqContent = arr[arr.length - 1];

    console.log("requested : ", reqContent);


  if (!fs.existsSync(filePath)) {
        response.writeHead(404, {
            "Content-Type": "text/plain"
        });
        handleLog(`${reqContent} file does not exists`);
        response.end(`${reqContent} file does not exists\n` + "404 Not Found");
        return;
    }

    fs.access(filePath, fs.constants.R_OK,function (err) {
        if (err) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.end(`${reqContent} file cannot be accessed`);
        } else {
            let ext = reqContent.split('.')[1];

            console.log("extension: " + ext);

            const contentType = getContentType(ext);

            console.log("con-type: ", contentType);

            if (ext == "mp4") {
                response.writeHead(200, {
                    'Content-Type': 'video/mp4'
                });
                createReadStream(filePath).pipe(response);
            } else {

                // Setting the headers
                response.writeHead(200, {
                    "Content-Type": contentType
                });

                // Reading the file
                fs.readFile(filePath,
                    function (err, content) {
                        if (err) {
                            response.end(
                                `Error while reading ${reqContent} file`
                            );
                            return;
                        }
                        // Serving the image
                        response.end(content);
                    });
            }
        };
    });

    // response.end("This is a server...");
}).listen(PORT, () => {
    console.log(`Server has started at http://localhost:${PORT}`);
});
