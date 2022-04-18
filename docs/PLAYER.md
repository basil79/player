# Player

**Table of Contents**

- [Constructor](#constructor)
- [Options](#options)
  - [width](#width-string--number)
  - [height](#height-string--number)
  - [poster](#poster)
  - [src](#src)
  - [preload](#preload)
  - [autoplay](#autoplay-boolean--string)
  - [title](#title)
  - [url](#url)
  - [muted](#muted)
  - [volume](#volume)
  - [controls](#controls)
  - [loop](#loop)
  - [aspectRatio](#aspectratio)

    
## Constructor

The constructor signature is:

```Javascript
constructor(el, options, callback)
```

#### Parameters

- **`el: HTMLElement`** - (required) HTML element of the player
- **`options: Object`** - (optional) An optional Object to configure the player
- **`callback: Function`** - (optional) Callback - player ready


## Options

### width: String | Number

Player width (default `'auto'`)

### height: String | Number

Player height (default `'auto'`)

### autoplay: Boolean | String

Autoplay

- a boolean value of `false`: the same as having no attribute on the video element, won't `autoplay`
- a boolean value of `true`: the same as having attribute on the video element, will use browsers `autoplay`
- a string value of `'muted'`: will mute the video element and then manually call `play()` on `loadstart`. This is likely to work.
- a string value of `'play'`: will call `play()` on `loadstart`, similar to browsers `autoplay`
- a string value of `'any'`: will call `play()` on `loadstart` and if the promise is rejected it will mute the video element then call `play()`.

