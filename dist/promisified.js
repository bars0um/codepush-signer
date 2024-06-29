"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stat = stat;
exports.open = open;
exports.read = read;
exports.readFile = readFile;
exports.readdir = readdir;
exports.writeFile = writeFile;
exports.write = write;
exports.exists = exists;
exports.mkdir = mkdir;
exports.mkTempDir = mkTempDir;
exports.cp = cp;
exports.cpDir = cpDir;
exports.cpFile = cpFile;
exports.unlink = unlink;
exports.close = close;
exports.openTempFile = openTempFile;
exports.fileExists = fileExists;
exports.directoryExists = directoryExists;
exports.access = access;
exports.walk = walk;
const fs = require("fs");
const path = require("path");
const temp = require("temp");
temp.track();
async function stat(path) {
    return (await callFs(fs.stat, path))[0];
}
async function open(path, flags, mode) {
    return (await callFs(fs.open, path, flags, mode))[0];
}
async function read(fd, buffer, offset, length, position) {
    const result = await callFs(fs.read, fd, buffer, offset, length, position);
    return { bytesRead: result[0], buffer: result[1] };
}
async function readFile(...args) {
    return (await callFs(fs.readFile, ...args))[0];
}
async function readdir(path) {
    return (await callFs(fs.readdir, path))[0];
}
async function writeFile(filename, data) {
    return (await callFs(fs.writeFile, filename, data))[0];
}
async function write(fd, data) {
    return (await callFs(fs.write, fd, data, 0, data.length))[0];
}
function exists(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err) => {
            if (err) {
                if (err.code === "ENOENT") {
                    resolve(false);
                }
                else {
                    reject(err);
                }
            }
            else {
                resolve(true);
            }
        });
    });
}
function mkdir(path) {
    return callFs(fs.mkdir, path).then(() => {
        return;
    });
}
function mkTempDir(affixes) {
    return callTemp(temp.mkdir, affixes);
}
async function cp(source, target) {
    const sourceStats = await stat(source);
    if (sourceStats.isDirectory()) {
        await cpDir(source, target);
    }
    else {
        await cpFile(source, target);
    }
}
async function cpDir(source, target) {
    if (!(await exists(target))) {
        createLongPath(target);
    }
    const files = await readdir(source);
    for (let i = 0; i < files.length; i++) {
        const sourceEntry = path.join(source, files[i]);
        const targetEntry = path.join(target, files[i]);
        await cp(sourceEntry, targetEntry);
    }
}
function cpFile(source, target) {
    return new Promise((resolve, reject) => {
        const targetFolder = path.dirname(target);
        if (!fs.existsSync(targetFolder)) {
            createLongPath(targetFolder);
        }
        const sourceStream = fs.createReadStream(source);
        const targetStream = fs.createWriteStream(target);
        targetStream.on("close", () => resolve());
        targetStream.on("error", (err) => reject(err));
        sourceStream.pipe(targetStream);
    });
}
// export function rmDir(source: string, recursive: boolean = true): Promise<void> {
//   console.log('not removing')
//   return new Promise<void>
// }
function unlink(filePath) {
    return callFs(fs.unlink, filePath).then(() => {
        return;
    });
}
function close(fd) {
    return callFs(fs.close, fd).then(() => {
        return;
    });
}
function openTempFile(...args) {
    return callTemp(temp.open, ...args);
}
async function fileExists(path) {
    return await pathExists(path, true);
}
async function directoryExists(path) {
    return await pathExists(path, false);
}
async function access(path, mode) {
    return callFs(fs.access, path, mode).then(() => {
        return;
    });
}
async function walk(dir) {
    const stats = await stat(dir);
    if (stats.isDirectory()) {
        let files = [];
        for (const file of await readdir(dir)) {
            files = files.concat(await walk(path.join(dir, file)));
        }
        return files;
    }
    else {
        return [dir];
    }
}
async function pathExists(path, isFile) {
    let stats = null;
    try {
        stats = await stat(path);
    }
    catch (err) {
        return false;
    }
    return isFile === stats.isFile();
}
function createLongPath(target) {
    let targetFolder = target;
    const notExistsFolder = [];
    while (!fs.existsSync(targetFolder)) {
        notExistsFolder.push(path.basename(targetFolder));
        targetFolder = path.resolve(targetFolder, "..");
    }
    notExistsFolder.reverse().forEach((element) => {
        targetFolder = path.resolve(targetFolder, element);
        fs.mkdirSync(targetFolder);
    });
}
function callFs(func, ...args) {
    return new Promise((resolve, reject) => {
        func.apply(fs, args.concat([
            (err, ...args) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(args);
                }
            },
        ]));
    });
}
function callTemp(func, ...args) {
    return new Promise((resolve, reject) => {
        func.apply(temp, args.concat([
            (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            },
        ]));
    });
}
