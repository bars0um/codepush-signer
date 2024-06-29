"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sign_cli_1 = require("./sign-cli");
const fs = require("fs");
const [bundleHashPath, privateKeyPath] = process.argv.slice(2);
const main = async () => {
    console.log('removing old hash');
    fs.rm(bundleHashPath + '.codepushrelease', (err) => console.log(err));
    console.log('signing package');
    await (0, sign_cli_1.default)(privateKeyPath, bundleHashPath);
};
main();
