"use strict";
/**
 * NOTE!!! This utility file is duplicated for use by the CodePush service (for server-driven hashing/
 * integrity checks) and Management SDK (for end-to-end code signing), please keep them in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManifest = void 0;
exports.generatePackageHashFromDirectory = generatePackageHashFromDirectory;
exports.generatePackageManifestFromDirectory = generatePackageManifestFromDirectory;
exports.hashFile = hashFile;
exports.hashStream = hashStream;
const crypto = require("crypto");
const fs = require("fs");
const pfs = require("./promisified");
const path = require("path");
const _ = require("lodash");
const file_utils_1 = require("./file-utils");
// Do not throw an exception if either of these modules are missing, as they may not be needed by the
// consumer of this file.
const HASH_ALGORITHM = "sha256";
class PackageManifest {
    constructor(map) {
        if (!map) {
            map = new Map();
        }
        this._map = map;
    }
    toMap() {
        return this._map;
    }
    computePackageHash() {
        let entries = [];
        this._map.forEach((hash, name) => {
            entries.push(name + ":" + hash);
        });
        // Make sure this list is alphabetically ordered so that other clients
        // can also compute this hash easily given the update contents.
        entries = entries.sort();
        return crypto.createHash(HASH_ALGORITHM).update(JSON.stringify(entries)).digest("hex");
    }
    serialize() {
        const obj = {};
        this._map.forEach(function (value, key) {
            obj[key] = value;
        });
        return JSON.stringify(obj);
    }
    static deserialize(serializedContents) {
        try {
            const obj = JSON.parse(serializedContents);
            const map = new Map();
            for (const key of Object.keys(obj)) {
                map.set(key, obj[key]);
            }
            return new PackageManifest(map);
        }
        catch (e) {
            // Eat it
            return;
        }
    }
    static normalizePath(filePath) {
        //replace all backslashes coming from cli running on windows machines by slashes
        return filePath.replace(/\\/g, "/");
    }
    static isIgnored(relativeFilePath) {
        const __MACOSX = "__MACOSX/";
        const DS_STORE = ".DS_Store";
        const CODEPUSH_METADATA = ".codepushrelease";
        return (_.startsWith(relativeFilePath, __MACOSX) ||
            relativeFilePath === DS_STORE ||
            _.endsWith(relativeFilePath, "/" + DS_STORE) ||
            relativeFilePath === CODEPUSH_METADATA ||
            _.endsWith(relativeFilePath, "/" + CODEPUSH_METADATA));
    }
}
exports.PackageManifest = PackageManifest;
async function generatePackageHashFromDirectory(directoryPath, basePath) {
    try {
        if (!(0, file_utils_1.isDirectory)(directoryPath)) {
            throw new Error("Not a directory. Please either create a directory, or use hashFile().");
        }
    }
    catch (error) {
        throw new Error("Directory does not exist. Please either create a directory, or use hashFile().");
    }
    const manifest = await generatePackageManifestFromDirectory(directoryPath, basePath);
    return manifest.computePackageHash();
}
function generatePackageManifestFromDirectory(directoryPath, basePath) {
    return new Promise(async (resolve, reject) => {
        const fileHashesMap = new Map();
        const files = await pfs.walk(directoryPath);
        if (!files || files.length === 0) {
            reject("Error: Can't sign the release because no files were found.");
            return;
        }
        // Hash the files sequentially, because streaming them in parallel is not necessarily faster
        const generateManifestPromise = files.reduce((soFar, filePath) => {
            return soFar.then(() => {
                const relativePath = PackageManifest.normalizePath(path.relative(basePath, filePath));
                if (!PackageManifest.isIgnored(relativePath)) {
                    return hashFile(filePath).then((hash) => {
                        fileHashesMap.set(relativePath, hash);
                    });
                }
            });
        }, Promise.resolve(null));
        generateManifestPromise.then(() => {
            resolve(new PackageManifest(fileHashesMap));
        }, reject);
    });
}
function hashFile(filePath) {
    const readStream = fs.createReadStream(filePath);
    return hashStream(readStream);
}
function hashStream(readStream) {
    return new Promise((resolve, reject) => {
        const hashStream = crypto.createHash(HASH_ALGORITHM);
        readStream
            .on("error", (error) => {
            hashStream.end();
            reject(error);
        })
            .on("end", () => {
            hashStream.end();
            const buffer = hashStream.read();
            const hash = buffer.toString("hex");
            resolve(hash);
        });
        readStream.pipe(hashStream);
    });
}