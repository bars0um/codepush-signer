"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBinaryOrZip = isBinaryOrZip;
exports.isDirectory = isDirectory;
exports.copyFileToTmpDir = copyFileToTmpDir;
exports.moveReleaseFilesInTmpFolder = moveReleaseFilesInTmpFolder;
exports.getLastFolderInPath = getLastFolderInPath;
exports.generateRandomFilename = generateRandomFilename;
exports.fileDoesNotExistOrIsDirectory = fileDoesNotExistOrIsDirectory;
exports.createEmptyTmpReleaseFolder = createEmptyTmpReleaseFolder;
exports.removeReactTmpDir = removeReactTmpDir;
exports.normalizePath = normalizePath;
const fs = require("fs");
const path = require("path");
const os = require("os");
const rimraf = require("rimraf");
const temp = require("temp");
const pfs = require("./promisified");
function isBinaryOrZip(path) {
    return path.search(/\.zip$/i) !== -1 || path.search(/\.apk$/i) !== -1 || path.search(/\.ipa$/i) !== -1;
}
function isDirectory(path) {
    return fs.statSync(path).isDirectory();
}
function copyFileToTmpDir(filePath) {
    if (!isDirectory(filePath)) {
        const outputFolderPath = temp.mkdirSync("code-push");
        rimraf.sync(outputFolderPath);
        fs.mkdirSync(outputFolderPath);
        const outputFilePath = path.join(outputFolderPath, path.basename(filePath));
        fs.writeFileSync(outputFilePath, fs.readFileSync(filePath));
        return outputFolderPath;
    }
}
async function moveReleaseFilesInTmpFolder(updateContentsPath) {
    let tmpUpdateContentsPath = temp.mkdirSync("code-push");
    tmpUpdateContentsPath = path.join(tmpUpdateContentsPath, "CodePush");
    fs.mkdirSync(tmpUpdateContentsPath);
    if (isDirectory(updateContentsPath)) {
        await pfs.cp(normalizePath(updateContentsPath), normalizePath(tmpUpdateContentsPath));
    }
    else {
        const targetFileName = path.parse(updateContentsPath).base;
        await pfs.cpFile(normalizePath(updateContentsPath), path.join(tmpUpdateContentsPath, targetFileName));
    }
    return tmpUpdateContentsPath;
}
function getLastFolderInPath(path) {
    const splittedPath = normalizePath(path)
        .split("/")
        .filter((el) => {
        return el !== "";
    });
    if (isDirectory(path)) {
        return splittedPath[splittedPath.length - 1];
    }
    else {
        return splittedPath[splittedPath.length - 2];
    }
}
function generateRandomFilename(length) {
    let filename = "";
    const validChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        // eslint-disable-next-line no-restricted-properties
        filename += validChar.charAt(Math.floor(Math.random() * validChar.length));
    }
    return filename;
}
function fileDoesNotExistOrIsDirectory(path) {
    try {
        return isDirectory(path);
    }
    catch (error) {
        return true;
    }
}
function createEmptyTmpReleaseFolder(folderPath) {
    rimraf.sync(folderPath);
    fs.mkdirSync(folderPath);
}
function removeReactTmpDir() {
    rimraf.sync(`${os.tmpdir()}/react-*`);
}
function normalizePath(filePath) {
    //replace all backslashes coming from cli running on windows machines by slashes
    return filePath.replace(/\\/g, "/");
}
