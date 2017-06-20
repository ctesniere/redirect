'use strict';

module.exports.promptPart1 = [{
        type: 'input',
        name: 'url',
        message: 'Your url ?'
    },
    {
        type: 'input',
        name: 'editUuid',
        message: 'Edit an existing uuid?',
        default: false
    }
];

module.exports.promptKey = [{
    type: 'input',
    name: 'key',
    message: 'What is last key?'
}];