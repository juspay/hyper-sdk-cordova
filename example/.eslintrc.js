module.exports = {
    "parser": "@babel/eslint-parser",
    "parserOptions": {
        "requireConfigFile": false,
        "ecmaVersion": "latest",
        "sourceType": "module",
        "babelOptions": {
            "plugins": [
                '@babel/plugin-syntax-import-assertions'
            ],
        },
    },
    "env": {
        "es2021": true
    },
    "extends": "eslint:recommended",
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "rules": {
        "no-case-declarations": "off"
    },
    "globals": {
        "window": true,
        "document": true,
        "console": true,
        "cordova": true
    }
}
