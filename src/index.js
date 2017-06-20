'use strict';

const CryptoAes = require('crypto-js/aes');
const CryptoCore = require('crypto-js/core');

const params = {};

if (location.search) {
    const parts = location.search.substring(1).split('&');

    for (let i = 0; i < parts.length; i++) {
        const nv = parts[i].split('=');
        if (!nv[0]) continue;
        params[nv[0]] = nv[1] || true;
    }
}

fetch(`https://ctesniere.github.io/redirect/data/${params.uuid}.json`)
    .then(response => response.json())
    .then(reponse => {
        console.log('reponse', reponse);
        const bytes  = CryptoAes.decrypt(reponse.encryption, params.key);
        const url = bytes.toString(CryptoCore.enc.Utf8);

        // similar behavior as an HTTP redirect
        window.location.replace(url);

        // else, execute similar behavior as clicking on a link
        window.location.href = url;
    })
    .catch(err => console.error('Error : ', err))
