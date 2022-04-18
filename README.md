# player

> HTML5 Video Player

This README is for developers who want to use and/or contribute to player.

**Table of Contents**

- [Usage](#Usage)
- [Install](#Install)
- [Build](#Build)
- [Run](#Run)
- [Contribute](#Contribute)


## Documentation

For the full documentation:

* [Player](docs/PLAYER.md)

### Pre-bundled versions

#### Browser script

A pre-bundled version of player is available: [`player.js`](dist/player.js) [minified].

You can add the script directly to your page and access the library's components through the `adserve.tv` object.

```html
<script src="player.js"></script>
```

```javascript
// Define player
const player = new adserve.tv.Player(document.getElementById('player'));
```

## Install

### Get Started

player is available as an NPM package and can be easily installed with:

    $ npm i player

### Using Git

    $ git clone https://github.com/basil79/player
    $ cd player
    $ npm ci


## Build

To build the project for development:

    $ npm run build:dev

To build the project for production:

    $ npm run build:prod

This will generate the following file:

+ `./dist/player.js` - Minified browser production code

## Run

    $ npm start

Then navigate to: http://localhost:8084 in your browser

### Supported Browsers

player is supported all modern browsers.

## Contribute

See [CONTRIBUTING](./CONTRIBUTING.md)
