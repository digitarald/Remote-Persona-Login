# Remote Persona Login

Persona in packaged apps, using an iframe and `postMessage`.

## Install

1. Host the single static HTML page from `/remote` on your server (default is `http://localhost:8080`).
2. Change `REMOTE_ORIGIN` in `/package/index.js` and `/remote/index.html` according to your app `origin` and remote host.
3. Install `/package` folder as packaged app via [App Manager](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/Using_the_App_Manager).

## Relevant Issues

- https://github.com/mozilla/persona/issues/3205