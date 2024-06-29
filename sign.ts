import sign from "./sign-cli"
import * as fs from "fs"

const [bundleHashPath, privateKeyPath] = process.argv.slice(2);

const main = async () => {

    console.log('removing old hash')
    fs.rm(bundleHashPath + '.codepushrelease', (err) => console.log(err))
    console.log('signing package')
    await sign(privateKeyPath, bundleHashPath)

}

main()
