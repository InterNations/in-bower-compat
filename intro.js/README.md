# Intro.js

> Better introductions for websites and features with a step-by-step guide for your projects.

This is my personal take on the original intro.js code, built for [InterNations](http://internations.github.io/). Original idea and implementation by [Afshin Mehrabani](https://github.com/afshinm).

## How to use

**1)** Include `intro.js` and `introjs.css` (or the minified version for production) in your page.

**2)** Create the markup for the tooltip of each step and point to which HTML element should be highlighted using `data-intro-element` and `data-step`. For example:

```html
<a class="js-google-link" href='http://google.com/'></a>

<div data-intro-element="js-google-link" data-step="1">
    <h1>Click this link to go to google</h1>
    <p>Try it out!</p>
</div>
````

<!-- You can also pass the configuration for the steps programmatically. See:  -->

**3)** Call this JavaScript function:
```javascript
introJs().start();
````

Optionally, pass one parameter to `introJs` function to limit the presentation section.

**For example** `introJs(".introduction-farm").start();` runs the introduction only for elements with `class='introduction-farm'`.

## Configuring steps programmatically
Instead of using DOM elements and `data-` attributes, you may choose to configure the steps programmatically. Just pass a `step` option when creating the introJs object
```javascript
introJs().setOptions({
    steps: [
        {
            step: 1,
            template: '.js-intro-step-1',
            element: '.js-header'
        },
        {
            step: 2,
            template: '.js-intro-step-1',
            element: '#js-wire-container'
        }
    ]
}).start();
```
Each step's object should look like this:
```javascript
    {
        // {Number} Number of this step
        step: 1,
        // {String/Function} Selector to get the tooltip content from a DOM element, or a function to
        // call that should return a string to use as content.
        template: '',
        // {String} Selector to the HTMLElement to highlight
        element: '',
        // {Number} (optional) Window scroll position to be set for this step
        scrollTo: 120,
        // {String} (optional) position of the tooltip. Possible values:
        // 'top', 'right', 'left', 'bottom-right', 'bottom-middle', 'bottom-left'
        // If none is provided, defaults to 'right'
        tooltipPosition: 'top'
    }

```

## API

###introJs([targetElm])

Creating an introJs object.

**Available since**: v0.1.0

**Parameters:**
 - targetElm : String (optional)
   Should be defined to start introduction for specific element, for example: `#intro-farm`.

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs() // without selector, start introduction for whole page
introJs("#intro-farm") // start introduction for element id='intro-farm'
````

-----

###introJs.start()

Start the introduction for defined element(s).

**Available since**: v0.1.0

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().start()
````
-----

###introJs.goToStep(step)

Go to specific step of introduction.

**Available since**: v0.3.0

**Parameters:**
 - step : Number

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().goToStep(2).start(); //starts introduction from step 2
````

-----

###introJs.exit()

Exit the introduction.

**Available since**: v0.3.0

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().exit()
````

-----

###introJs.setOption(option, value)

Set a single option to introJs object.

**Available since**: v0.3.0

**Parameters:**
 - option : String
   Option key name.

 - value : String/Number
   Value of the option.

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().setOption("skipLabel", "Exit");
````

----

###introJs.setOptions(options)

Set a group of options to the introJs object.

**Available since**: v0.3.0

**Parameters:**
 - options : Object
   Object that contains option keys with values.

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().setOptions({ skipLabel: "Exit", tooltipPosition: "right" });
````

----

###introJs.oncomplete(providedCallback)

Set callback for when introduction completed.

**Available since**: v0.2.0

**Parameters:**
 - providedCallback : Function

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().oncomplete(function() {
  alert("end of introduction");
});
````

-----

###introJs.onexit(providedCallback)

Set callback to exit of introduction. Exit also means pressing `ESC` key and clicking on the overlay layer by the user.

**Available since:** v0.2.0

**Parameters:**
 - providedCallback : Function

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().onexit(function() {
  alert("exit of introduction");
});
````

-----

###introJs.onchange(providedCallback)

Set callback to change of each step of introduction. Given callback function will be called after completing each step.

**Available since:** v0.3.0

**Parameters:**
 - providedCallback : Function

**Returns:**
 - introJs object.

**Example:**
```javascript
introJs().onchange(function() {
  alert("new step");
});
````

## Browser support
Recent versions of Chrome and Firefox, IE9+

## Build

First you should install `nodejs` and `npm`, then first run this command: `npm install` to install all dependencies.

Now you can run this command to minify all static resources:

    npm run build

Before commiting, make sure eslint is passing:

    npm run lint

## Author
**This version modified by Vitor Balocco for [InterNations](http://internations.github.io/)**.

**Original idea and implementation by [Afshin Mehrabani](https://github.com/afshinm)**

## License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
