/**
 * Intro.js v0.7.3
 * MIT licensed
 *
 * Original idea and implementation by Afshin Mehrabani (@afshinmeh)
 */
(function(root, factory) {
    'use strict';

    if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else {
        // Browser globals
        factory(root);
    }
})(this, function(exports) {
    'use strict';
    // Default config/variables
    var VERSION = '0.7.3';

    /**
      * IntroJs main class
      *
      * @class IntroJs
      */
    function IntroJs(rootElement) {
        this._rootElement = rootElement;

        this._options = {
            overlayOpacity: 0.5,
            nextButton: '.introjs-next',
            prevButton: '.introjs-prev',
            skipButton: '.introjs-skip',
            // could be a class instead, for example
            stepIdentifier: '*',
            // close introduction when clicking on overlay layer
            exitOnOverlayClick: true,
            // disable any interaction with the element being highlighted
            disableInteraction: false,
            // possible values:
            // 'top', 'right', 'left', 'bottom', 'bottom-right', 'bottom-middle', 'bottom-left'
            tooltipPosition: 'right',
            // Forces smooth scrolling to target element even when it's already in view
            forceScroll: true
        };
    }

    /**
     * @api private
     * @param {HTMLElement} stepElement an element from which to extract data of a single step
     * @returns {Object} The object representation of a single intro step
     */
    function _getStepDataFromElement(stepElement) {
        // use default position if none was provided
        var tooltipPosition = stepElement.getAttribute('data-intro-tooltip-position') || this._options.tooltipPosition;

        return {
            // the element to highlight
            element: this._rootElement.querySelector(stepElement.getAttribute('data-intro-element')),
            // content of the intro tooltip
            content: _getElementHTML(stepElement),
            step: parseInt(stepElement.getAttribute('data-intro-step'), 10),
            // custom scrolling offset for this step
            scrollTo: parseInt(stepElement.getAttribute('data-intro-scroll-to'), 10),
            tooltipPosition: tooltipPosition
        };
    }

    /**
     * @api private
     *
     * @param {Object} stepObject
     * JSON object that represents a single step
     * @param {String/Function} stepObject.template
     * Can be a selector to get the tooltip content from a DOM element, or a function to call that should
     * return a string to use as content.
     *
     * @returns {Object} The object representation of a single intro step
     */
    function _getStepDataFromObject(stepObject) {
        var tooltipContent, element, tooltipPosition;

        if (typeof stepObject.template === 'function') {
            tooltipContent = stepObject.template({ step: stepObject.step });
        } else {
            tooltipContent = _getElementHTML(this._rootElement.querySelector(stepObject.template));
        }

        if (stepObject.element) {
            element = this._rootElement.querySelector(stepObject.element);
            tooltipPosition = stepObject.tooltipPosition || this._options.tooltipPosition;
        } else {
            element = this._rootElement;
            tooltipPosition = 'center';
        }

        return {
            // the element to highlight
            element: element,
            // content of the intro tooltip
            content: tooltipContent,
            step: stepObject.step,
            // custom scrolling offset for this step
            scrollTo: stepObject.scrollTo === undefined ? null : stepObject.scrollTo,
            tooltipPosition: tooltipPosition
        };
    }

    /**
      * Initiate a new introduction/guide from an element in the page
      *
      * @api private
      * @method _introForElement
      * @returns {Boolean} Success or not
      */
    function _introForElement() {
        var introItems = [];
        var i, steps, step, getStepDataFn;

        if (this._options.steps) {
            // use steps passed programmatically
            steps = this._options.steps;
            getStepDataFn = _getStepDataFromObject.bind(this);
        } else {
            // use steps from data-* annotations
            steps = this._rootElement.querySelectorAll(this._options.stepIdentifier + '[data-intro-step]');
            getStepDataFn = _getStepDataFromElement.bind(this);
        }

        if (steps.length === 0) {
            return false;
        }

        for (i = 0; i < steps.length; i++) {
            step = getStepDataFn(steps[i]);
            introItems.push(step);
        }

        // Ok, sort all items with given steps
        introItems.sort(function(a, b) {
            return a.step - b.step;
        });

        // set it to the introJs object
        this._introItems = introItems;

        // then, start the show
        _nextStep.call(this);

        // Save a bound version of the function so we can call removeEventListener on it later
        this._onKeyDown = _onKeyDown.bind(this);
        window.addEventListener('keydown', this._onKeyDown, true);

        return false;
    }

    function _onKeyDown(e) {
        if (e.keyCode === 27) {
            // escape key pressed, exit the intro
            _exitIntro.call(this);
        } else if (e.keyCode === 37) {
            // left arrow
            _previousStep.call(this);
        } else if (e.keyCode === 39 || e.keyCode === 13) {
            // right arrow or enter
            _nextStep.call(this);
        }
    }

    /*
      * Get the HTML of a DOM element including the element itself
      * http://stackoverflow.com/questions/1763479/how-to-get-the-html-for-a-dom-element-in-javascript
      *
      * @api private
      * @method _getElementHTML
      * @param {Object} el
      * @returns {String} The HTML
      */
    function _getElementHTML(el) {
        var wrap = document.createElement('div');
        wrap.appendChild(el.cloneNode(true));

        return wrap.innerHTML;
    }

    /**
      * Go to specific step of introduction
      *
      * @api private
      * @method _goToStep
      */
    function _goToStep(step) {
        //because steps starts with zero
        this._currentStep = step - 2;
        if (this._introItems !== undefined) {
            _nextStep.call(this);
        }
    }

    /**
      * Go to next step on intro
      *
      * @api private
      * @method _nextStep
      */
    function _nextStep() {
        if (this._currentStep === undefined) {
            this._currentStep = 0;
        } else {
            ++this._currentStep;
        }

        if (this._introItems.length <= this._currentStep) {
            // because we've just passed the total number of steps with the previous increment
            this._currentStep = this._currentStep - 1;

            // end of the intro. Check if any callback is defined
            if (typeof this._introCompleteCallback === 'function') {
                this._introCompleteCallback.call(this);
            }
            _exitIntro.call(this);
            return;
        }

        var currentItem = this._introItems[this._currentStep];
        _showElement.call(
            this, currentItem.element, currentItem.content, currentItem.scrollTo, currentItem.tooltipPosition
        );
    }

    /**
      * Go to previous step on intro
      *
      * @api private
      * @method _nextStep
      */
    function _previousStep() {
        if (this._currentStep === 0) {
            return false;
        }

        var currentItem = this._introItems[--this._currentStep];
        _showElement.call(
            this, currentItem.element, currentItem.content, currentItem.scrollTo, currentItem.tooltipPosition
        );
    }

    /**
      * Exit from intro
      *
      * @api private
      * @method _exitIntro
      */
    function _exitIntro() {

        // remove overlay layer from the page
        var overlayLayer = this._rootElement.querySelector('.introjs-overlay');
        // for fade-out animation
        overlayLayer.style.opacity = 0;
        setTimeout(function() {
            if (overlayLayer.parentNode) {
                overlayLayer.parentNode.removeChild(overlayLayer);
            }
        }, 500);

        // remove all tooltip layers
        var tooltipLayer = this._rootElement.querySelector('.introjs-tooltipLayer');
        if (tooltipLayer) {
            tooltipLayer.parentNode.removeChild(tooltipLayer);
        }

        // remove `introjs-showElement` class from the element
        var showElement = document.querySelector('.introjs-showElement');
        if (showElement) {
            // this is a manual trim.
            showElement.className = showElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');
        }

        // remove disable-interaction layer
        var disableInteractionLayer = this._rootElement.querySelector('.introjs-disableInteraction');
        if (disableInteractionLayer) {
            disableInteractionLayer.parentNode.removeChild(disableInteractionLayer);
        }

        // clean listeners
        window.removeEventListener('keydown', this._onKeyDown, true);

        // check if any callback is defined
        if (this._introExitCallback !== undefined) {
            this._introExitCallback.call(this, this._currentStep + 1);
        }

        // set the step to zero
        this._currentStep = undefined;
    }

    /**
     * Add disableinteraction layer and adjust the size and position of the layer
     *
     * @api private
     * @method _disableInteraction
     * @param {Object} targetElement the currently highlighted element
     */
    function _disableInteraction(targetElement) {
        var disableInteractionLayer = document.querySelector('.introjs-disableInteraction');

        if (disableInteractionLayer === null) {
            disableInteractionLayer = document.createElement('div');
            disableInteractionLayer.className = 'introjs-disableInteraction';
            this._rootElement.appendChild(disableInteractionLayer);
        }

        var elementPosition = _getOffset(targetElement);

        // set new position for the 'disableInteraction' layer
        disableInteractionLayer.setAttribute('style', 'width: ' + elementPosition.width + 'px; ' +
                                                      'height:' + elementPosition.height + 'px; ' +
                                                      'top:'    + elementPosition.top + 'px;' +
                                                      'left: '  + elementPosition.left + 'px;');
    }

    /**
      * Show an element on the page
      *
      * @api private
      * @method _showElement
      * @param {HTMLElement} targetElement the element to highlight
      * @param {String} content the content of this intro step
      * @param {Number} scrollTo if set, forces a scroll to position (element - scrollTo) for this intro step
      * @param {String} tooltipPosition string representing what positioning strategy to use
      */
    function _showElement(targetElement, content, scrollTo, tooltipPosition) {
        if (typeof this._introChangeCallback === 'function') {
            this._introChangeCallback.call(this, this._currentStep + 1, targetElement, content);
        }

        // add overlay layer to the page
        _createOrUpdateOverlayLayer.call(this, targetElement);

        var tooltipLayer = document.querySelector('.introjs-tooltipLayer');

        if (tooltipLayer !== null) {
            // remove old classes from targetElement of previous step
            var oldShowElement = document.querySelector('.introjs-showElement');
            oldShowElement.className = oldShowElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');

            // hide old tooltip
            tooltipLayer.innerHTML = '';
            // create new tooltip
            tooltipLayer.innerHTML = content;
            _bindButtons.call(this, tooltipLayer);
            // set new position to tooltip layer
            _positionTooltipLayer(tooltipPosition, targetElement, tooltipLayer);

        } else {
            tooltipLayer = document.createElement('div');

            tooltipLayer.className = 'introjs-tooltipLayer';

            // add tooltip layer to target element
            this._rootElement.appendChild(tooltipLayer);
            tooltipLayer.innerHTML = content;
            _bindButtons.call(this, tooltipLayer);

            _positionTooltipLayer(tooltipPosition, targetElement, tooltipLayer);
        }

        // disable interaction
        if (this._options.disableInteraction === true) {
            _disableInteraction.call(this, targetElement);
        }

        _highlightElement(targetElement);
        _scrollToElement.call(this, targetElement, tooltipLayer, scrollTo);
    }

    /**
     * Positions the tooltip according to the position of the element that is currently being highlighted
     *
     * @api private
     * @method _positionTooltipLayer
     * @param {String} tooltipPosition string representing what positioning strategy to use
     * @param {HTMLElement} targetElement the element that is currently highlighted
     * @param {HTMLElement} tooltipLayer reference to the tooltip layer
     */
    function _positionTooltipLayer(tooltipPosition, targetElement, tooltipLayer) {
        var targetElementOffset = _getOffset(targetElement);
        var tooltipOffset = _getOffset(tooltipLayer);
        var tooltipHeight = tooltipOffset.height;

        // reset the old style
        tooltipLayer.style.top = null;
        tooltipLayer.style.left = null;
        tooltipLayer.style.transform = '';
        tooltipLayer.style['-ms-transform'] = '';
        tooltipLayer.style['-webkit-transform'] = '';
        tooltipLayer.className = tooltipLayer.className.replace(/introjs-arrow[a-zA-Z-]*/g, '')
                                                       .replace(/^\s+|\s+$/g, '');

        switch (tooltipPosition) {
            case 'center':
                tooltipLayer.style.left = '50%';
                tooltipLayer.style.top = '20%';
                tooltipLayer.style.transform = 'translateX(-50%)';
                tooltipLayer.style['-ms-transform'] = 'translateX(-50%)';
                tooltipLayer.style['-webkit-transform'] = 'translateX(-50%)';
                break;
            // show to the top, center vertically
            case 'top':
                tooltipLayer.style.left = targetElementOffset.left -
                                            (tooltipOffset.width / 2 - targetElementOffset.width / 2) + 'px';
                tooltipLayer.style.top = (targetElementOffset.top - tooltipHeight - 20) + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-bottom';
                break;
            // show to the top-right
            case 'right':
                tooltipLayer.style.left = (targetElementOffset.left + targetElementOffset.width + 20) + 'px';
                tooltipLayer.style.top = targetElementOffset.top + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-left-top';
                break;
            // show to the top-left
            case 'left':
                tooltipLayer.style.left = (targetElementOffset.left - tooltipOffset.width - 20) + 'px';
                tooltipLayer.style.top = targetElementOffset.top + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-right-top';
                break;
            case 'bottom':
            case 'bottom-middle':
                tooltipLayer.style.left = targetElementOffset.left -
                                            (tooltipOffset.width / 2 - targetElementOffset.width / 2) + 'px';
                tooltipLayer.style.top = targetElementOffset.top + targetElementOffset.height + 20 + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-top-middle';
                break;
            case 'bottom-right':
                tooltipLayer.style.left = targetElementOffset.left -
                                            (tooltipOffset.width - targetElementOffset.width) + 'px';
                tooltipLayer.style.top = targetElementOffset.top + targetElementOffset.height + 20 + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-top-right';
                break;
            case 'bottom-left':
            default:
                tooltipLayer.style.left = targetElementOffset.left + 'px';
                tooltipLayer.style.top = targetElementOffset.top + targetElementOffset.height + 20 + 'px';

                tooltipLayer.className += ' introjs-arrow introjs-arrow-top-left';
                break;
        }
    }

    /**
     * Adds a 'highlighted' effect to the element specified
     *
     * @api private
     * @method _highlightElement
     * @param {HTMLElement} targetElement the element to be highlighted
     */
    function _highlightElement(targetElement) {
        // add target element position style
        targetElement.className += ' introjs-showElement';

        // thanks to JavaScript Kit: http://www.javascriptkit.com/dhtmltutors/dhtmlcascade4.shtml
        var currentElementPosition = '';
        if (targetElement.currentStyle) { // IE
            currentElementPosition = targetElement.currentStyle.position;
        } else if (document.defaultView && document.defaultView.getComputedStyle) { // Firefox
            currentElementPosition = document.defaultView.getComputedStyle(targetElement, null).getPropertyValue('position');
        }

        // I don't know is this necessary or not, but I clear the position for better comparing
        currentElementPosition = currentElementPosition.toLowerCase();
        if (currentElementPosition !== 'absolute' && currentElementPosition !== 'relative') {
            // so the tooltip can be positioned relative to this element
            targetElement.className += ' introjs-relativePosition';
        }
    }

    /**
     * Scrolls the viewport to the position specified or, if not specified, just enough
     * so that the currently highlighted element and its tooltip are inside the viewport
     *
     * @api private
     * @method _scrollToElement
     * @param {HTMLElement} targetElement the element that is currently being highlighted
     * @param {HTMLElement} tooltipElement the tooltip for the current step
     * @param {Number} scrollTo if set, forces a scroll to the position specified
     */
    function _scrollToElement(targetElement, tooltipElement, scrollTo) {
        var tooltipOffset = _getOffset(tooltipElement);

        // Accept custom data-intro-scroll-to param
        if (scrollTo || scrollTo === 0) {
            _smoothScroll(scrollTo);
            return;
        }

        if (this._options.forceScroll || !_elementInViewport(tooltipElement)) {
            _smoothScroll(tooltipOffset.top - 40);
        }
    }

    /*
     * Scrolls to a destination on the Y axis, with an InOut easing animation.
     * @api private
     * @param {Number} destinationYPosition Y-position to scroll to
     */
    function _smoothScroll(destinationYPosition) {
        var duration = 1000;
        var startTime = Date.now();
        var currentYPosition = _getCurrentYPosition();
        var min = function(a, b) {
            return a < b ? a : b;
        };

        var requestAnimationFrame = function(fn) {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(fn);
            } else {
                window.setTimeout(fn, 10);
            }
        };

        // acceleration until halfway, then deceleration
        // based on: http://gizma.com/easing/#quint3
        var easeInOutFunction = function(t) {
            return t < 0.5 ? (16 * t * t * t * t * t) : (1 + 16 * (--t) * t * t * t * t);
        };

        var stepFunction = function() {
            var currentTime = Date.now();
            var time = min(1, ((currentTime - startTime) / duration));
            var easedTime = easeInOutFunction(time);

            window.scrollTo(0, (easedTime * (destinationYPosition - currentYPosition)) + currentYPosition);

            if (time < 1) {
                requestAnimationFrame(stepFunction);
            }
        };

        requestAnimationFrame(stepFunction);
    }

    /**
      * Calculates the current Y scroll position of the body
      *
      * @api private
      * @return {Number} Y position of the body scroll
      */
    function _getCurrentYPosition() {
        if (document.body && document.body.scrollTop) {
            return document.body.scrollTop;
        }

        if (document.documentElement && document.documentElement.scrollTop) {
            return document.documentElement.scrollTop;
        }

        if (window.pageYOffset) {
            return window.pageYOffset;
        }

        return 0;
    }

    /**
      * Finds and binds the next, previous and skip buttons of the current tour step
      *
      * @api private
      * @method _bindButtons
      * @param {Object} container to search for buttons
      */
    function _bindButtons(container) {
        var that = this;
        var nextTooltipButton = container.querySelector(this._options.nextButton);
        var prevTooltipButton = container.querySelector(this._options.prevButton);
        var skipTooltipButton = container.querySelector(this._options.skipButton);

        if (nextTooltipButton) {
            nextTooltipButton.onclick = function() {
                _nextStep.call(that);
            };
        }

        if (prevTooltipButton) {
            prevTooltipButton.onclick = function() {
                _previousStep.call(that);
            };
        }

        if (skipTooltipButton) {
            /* eslint-disable no-script-url */
            skipTooltipButton.href = 'javascript:void(0);';
            /* eslint-enable no-script-url */
            skipTooltipButton.onclick = function() {
                _exitIntro.call(that);
            };
        }
    }

    /**
      * Checks if an element is visible in the current viewport
      * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
      *
      * @api private
      * @method _elementInViewport
      * @param {Object} el
      * @return {Boolean} Is the element visible or not
      */
    function _elementInViewport(el) {
        var rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            (rect.bottom + 80) <= window.innerHeight && // add 80 to get the text right
            rect.right <= window.innerWidth
        );
    }

    /**
      * Add overlay layer to the page.
      * The overlay gets inserted right after the targetElement so we can avoid new stacking contexts set by parents
      * of the targetElement
      *
      * @api private
      * @method _addOverlayLayer
      * @param {HTMLElement} targetElement the element to highlight for this step
      */
    function _createOrUpdateOverlayLayer(targetElement) {
        var overlayLayer = this._rootElement.querySelector('.introjs-overlay');
        var styleText = '';
        var rootElementIsBody = this._rootElement.tagName.toLowerCase() === 'body';
        var targetElementIsBody = targetElement.tagName.toLowerCase() === 'body';

        // Create overlay layer if not existing yet
        if (overlayLayer === null) {
            overlayLayer = document.createElement('div');

            // set css class name
            overlayLayer.className = 'introjs-overlay';

            // check if the target element is body, we should calculate the size of overlay layer in a better way
            if (rootElementIsBody) {
                styleText += 'top: 0; bottom: 0; left: 0; right: 0; position: fixed;';
                overlayLayer.setAttribute('style', styleText);
            } else {
                // set overlay layer position
                var elementPosition = _getOffset(this._rootElement);
                if (elementPosition) {
                    styleText += 'width: ' + elementPosition.width + 'px; ' +
                                 'height:' + elementPosition.height + 'px; ' +
                                 'top:' + elementPosition.top + 'px; ' +
                                 'left: ' + elementPosition.left + 'px;';
                    overlayLayer.setAttribute('style', styleText);
                }
            }

            if (this._options.exitOnOverlayClick) {
                overlayLayer.onclick = function() {
                    _exitIntro.call(this);
                }.bind(this);
            }

            setTimeout(function() {
                styleText += 'opacity: ' + this._options.overlayOpacity + ';';
                overlayLayer.setAttribute('style', styleText);
            }.bind(this), 10);
        }

        if (targetElementIsBody) {
            targetElement.appendChild(overlayLayer);
        } else {
            targetElement.parentNode.appendChild(overlayLayer);
        }
    }


    /**
      * Get an element position on the page
      * Thanks to `meouw`: http://stackoverflow.com/a/442474/375966
      *
      * @api private
      * @method _getOffset
      * @param {Object} element
      * @returns Element's position info
      */
    function _getOffset(element) {
        var elementPosition = {};

        // set width
        elementPosition.width = element.offsetWidth;

        // set height
        elementPosition.height = element.offsetHeight;

        // calculate element top and left
        var _x = 0;
        var _y = 0;
        while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
            _x += element.offsetLeft;
            _y += element.offsetTop;
            element = element.offsetParent;
        }
        // set top
        elementPosition.top = _y;
        // set left
        elementPosition.left = _x;

        return elementPosition;
    }

    /**
      * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
      *
      * @api private
      * @method _mergeOptions
      * @param {Object} obj1
      * @param {Object} obj2
      * @returns {Object} a new object based on obj1 and obj2
      */
    function _mergeOptions(obj1, obj2) {
        var obj3 = {};
        var attrname;

        for (attrname in obj1) {
            obj3[attrname] = obj1[attrname];
        }
        for (attrname in obj2) {
            obj3[attrname] = obj2[attrname];
        }
        return obj3;
    }

    /**
     * @param [rootElm] optional root element to scope the intro to just that part of the DOM
     */
    var introJs = function(rootElm) {
        if (typeof rootElm === 'object') {
            // Ok, create a new instance
            return new IntroJs(rootElm);

        } else if (typeof rootElm === 'string') {
            // select the target element with query selector
            var rootElement = document.querySelector(rootElm);

            if (rootElement) {
                return new IntroJs(rootElement);
            } else {
                throw new Error('There is no element with given selector.');
            }
        } else {
            return new IntroJs(document.body);
        }
    };

    /**
      * Current IntroJs version
      *
      * @property version
      * @type String
      */
    introJs.version = VERSION;

    // Prototype
    introJs.fn = IntroJs.prototype = {
        clone: function() {
            return new IntroJs(this);
        },
        setOption: function(option, value) {
            this._options[option] = value;
            return this;
        },
        setOptions: function(options) {
            this._options = _mergeOptions(this._options, options);
            return this;
        },
        start: function() {
            _introForElement.call(this);
            return this;
        },
        goToStep: function(step) {
            _goToStep.call(this, step);
            return this;
        },
        exit: function() {
            _exitIntro.call(this);
        },
        onchange: function(providedCallback) {
            if (typeof providedCallback === 'function') {
                this._introChangeCallback = providedCallback;
            } else {
                throw new Error('Provided callback for onchange was not a function.');
            }
            return this;
        },
        oncomplete: function(providedCallback) {
            if (typeof providedCallback === 'function') {
                this._introCompleteCallback = providedCallback;
            } else {
                throw new Error('Provided callback for oncomplete was not a function.');
            }
            return this;
        },
        onexit: function(providedCallback) {
            if (typeof providedCallback === 'function') {
                this._introExitCallback = providedCallback;
            } else {
                throw new Error('Provided callback for onexit was not a function.');
            }
            return this;
        }
    };

    exports.introJs = introJs;
    return introJs;
});
