## Intro

This code was mostly extracted from [app-center cli](https://github.com/microsoft/appcenter-cli) to properly hash a bundled package.

I found that I had to do this when attempting to sign using the [@shm-open/code-push-cli](https://github.com/shm-open/code-push-cli) library. It is unfortunately based on an older code-push branch which hashed the packaged in a form that is no longer recognized by the client side SDK code.

I've found that you simply need to run it against a folder called "CodePush" which should contain your bundle and assets.

It is supposed to delete the .codepushrelease file from there before hashing otherwise the old hash may throw off the new hash computation.

Note: The actual JWT string will always look different because it contains a timestamp, to check if the has was generated properly, you must decode the JWT and see what is in it.

compile the signing code if necessary
```
npx tsc
```

run it:

```
node dist/sign.js <bundle path> <private key.pem>
```

* Note you will have to modify the code-push cli code to avoid deleting the .codepushrelease file with the signature if you need to use this.