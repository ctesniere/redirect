'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const mkdirp = Promise.promisify(require('mkdirp'));
const generatorUuid = require('uuid');
const path = require('path');
const crypto = require('crypto-js');
const moment = require('moment');
const generatePassword = require('generate-password');
const inquirer = require('inquirer');
const prompt = require('./prompt');
const pkg = require('../package.json');

const PATH_TMP = path.resolve('tmp');
const PATH_DATA = path.resolve('data');

Promise.all([mkdirp(PATH_DATA), mkdirp(PATH_TMP)])
    .then(() => inquirer.prompt(prompt.promptPart1))
    .tap(answers => {
        if (answers.editUuid) {
            const pathFile = path.join(PATH_DATA, answers.editUuid + '.json');
            return fs.openAsync(pathFile, 'r+')
                .catch(() => {
                    console.log('(!) L\'uuid n\'existe pas');
                    process.exit(1);
                })
        }
    })
    .then(answers => generateKey(answers))
    .then(answers => {
        const uuid = answers.editUuid || generatorUuid.v1();
        const redirect = generateUrl(uuid, answers.key);
        return {
            uuid,
            createdAt: moment(),
            key: answers.key,
            url: answers.url,
            redirect,
            encryption: crypto.AES.encrypt(answers.url, answers.key).toString(),
        };
    })
    .tap(value => checkEncryption(value))
    .tap(value => {
        const data = JSON.stringify(_.pick(value, 'uuid', 'createdAt', 'encryption'));
        const pathFile = path.join(PATH_DATA, value.uuid + '.json');
        return fs.writeFileAsync(pathFile, data);
    })
    .tap(value => saveTmp(value))
    .then(v => console.log(v))

/**
 * Generation de la clé pour crypter l'url
 * @param {Object} answers Contient les informations saisie par l'utilisateur
 */
function generateKey(answers) {
    let generateKeyPromise;
    if (answers.editUuid) {
        const tmpFile = path.join(PATH_TMP, answers.editUuid + '.json');
        generateKeyPromise = fs.readFileAsync(tmpFile, 'utf8')
            .then(cache => JSON.parse(cache).key)
            .catch(() => {
                return inquirer
                    .prompt(prompt.promptKey)
                    .then(answerKey => answerKey.key);
            });
    } else {
        generateKeyPromise = Promise.resolve(generatePassword.generate({length: 64, numbers: true}));
    }

    return generateKeyPromise.then(key => _.assign(answers, {key}));
}

function generateUrl(uuid, key) {
    return `${pkg.website}/?uuid=${uuid}&key=${key}`;
}

function checkEncryption(value) {
    const bytes = crypto.AES.decrypt(value.encryption, value.key);
    const plaintext = bytes.toString(crypto.enc.Utf8);

    if (plaintext !== value.url) {
        console.log('(!) Problème avec l\'encryption de l\'url');
        process.exit(1);
    }
}

function saveTmp(value) {
    const tmpFile = path.resolve(PATH_TMP, value.uuid + '.json');

    return mkdirp(path.dirname(tmpFile))
        .then(() => fs.writeFileAsync(tmpFile, JSON.stringify(value, null, 4)));
}
