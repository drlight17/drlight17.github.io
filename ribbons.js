/*global document, window, console, Ribbons*/

/**
 * Ribbons Class File.
 * Creates low-poly ribbons background effect inside a target container.
 */
(function (name, factory) {
    
    "use strict";
    
    if (typeof window === "object") {
        window[name] = factory();
    }

})("Ribbons", function () {
    
    "use strict";
    
    var _w = window,
        _b = document.body,
        _d = document.documentElement;

    // random helper
    var random = function () {
        if (arguments.length === 1) { // only 1 argument
            
            if (Array.isArray(arguments[0])) { // extract index from array
                var index = Math.round(random(0, arguments[0].length - 1));
                return arguments[0][index];
            }
            return random(0, arguments[0]); // assume numeric
            
        } else if (arguments.length === 2) { // two arguments range
            return Math.random() * (arguments[1] - arguments[0]) + arguments[0];
        }
        return 0; // default
    };

    // screen helper
    var screenInfo = function (e) {
        var width = Math.max(0, _w.innerWidth || _d.clientWidth || _b.clientWidth || 0),
            height = Math.max(0, _w.innerHeight || _d.clientHeight || _b.clientHeight || 0),
            scrollx = Math.max(0, _w.pageXOffset || _d.scrollLeft || _b.scrollLeft || 0) - (_d.clientLeft || 0),
            scrolly = Math.max(0, _w.pageYOffset || _d.scrollTop || _b.scrollTop || 0) - (_d.clientTop || 0);
        
        return {
            width: width,
            height: height,
            ratio: width / height,
            centerx: width / 2,
            centery: height / 2,
            scrollx: scrollx,
            scrolly: scrolly
        };
    };

    // mouse/input helper
    var mouseInfo = function (e) {
        var screen = screenInfo(e),
            mousex = e ? Math.max(0, e.pageX || e.clientX || 0) : 0,
            mousey = e ? Math.max(0, e.pageY || e.clientY || 0) : 0;

        return {
            mousex: mousex,
            mousey: mousey,
            centerx: mousex - (screen.width / 2),
            centery: mousey - (screen.height / 2)
        };
    };

    // point object
    var Point = function (x, y) {
        this.x = 0;
        this.y = 0;
        this.set(x, y);
    };
    Point.prototype = {
        constructor: Point,

        set: function (x, y) {
            this.x = (x || 0);
            this.y = (y || 0);
        },
        copy: function (point) {
            this.x = (point.x || 0);
            this.y = (point.y || 0);
            return this;
        },
        multiply: function (x, y) {
            this.x *= (x || 1);
            this.y *= (y || 1);
            return this;
        },
        divide: function (x, y) {
            this.x /= (x || 1);
            this.y /= (y || 1);
            return this;
        },
        add: function (x, y) {
            this.x += (x || 0);
            this.y += (y || 0);
            return this;
        },
        subtract: function (x, y) {
            this.x -= (x || 0);
            this.y -= (y || 0);
            return this;
        },
        clampX: function (min, max) {
            this.x = Math.max(min, Math.min(this.x, max));
            return this;
        },
        clampY: function (min, max) {
            this.y = Math.max(min, Math.min(this.y, max));
            return this;
        },
        flipX: function () {
            this.x *= -1;
            return this;
        },
        flipY: function () {
            this.y *= -1;
            return this;
        }
    };

    // class constructor
    var Factory = function (options) {
        this._canvas = null;
        this._context = null;
        this._sto = null;
        this._width = 0;
        this._height = 0;
        this._scroll = 0;
        this._ribbons = [];
        this._saved_color_index = 0;
        this._options = {
            // ribbon color HSL saturation amount
            colorSaturation: "80%",
            // ribbon color HSL brightness amount
            colorBrightness: "60%",
            // ribbon color opacity amount
            colorAlpha: 0.65,
            // how fast to cycle through colors in the HSL color space
            colorCycleSpeed: 6,
            // where to start from on the Y axis on each side (top|min, middle|center, bottom|max, random)
            verticalPosition: "center",
            // how fast to get to the other side of the screen
            horizontalSpeed: 150,
            delay: 4, //set delay
            phase: 0.014, //set phase
            // how many ribbons to keep on screen at any given time
            ribbonCount: 3,
            // add stroke along with ribbon fill colors
            strokeSize: 0,
            // move ribbons vertically by a factor on page scroll
            parallaxAmount: -0.5,
            // add animation effect to each ribbon section over time
            animateSections: true,
            // add blur shadow effect to each ribbon with radius
            ribbonBlur: 10,
            // single color default is off (random ribbons colors)
            singleColor: false
        };
        this._onDraw = this._onDraw.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this.setOptions(options);
        this.init();
    };

    // class prototype
    Factory.prototype = {
        constructor: Factory,

        // Set and merge local options
        setOptions: function (options) {
            
            var key;
            
            if (typeof options === "object") {
                for (key in options) {
                    if (options.hasOwnProperty(key)) {
                        this._options[key] = options[key];
                    }
                }
            }
        },

        // Initialize the ribbons effect
        init: function () {
            try {
                this._canvas = document.createElement("canvas");
                this._canvas.style["display"] = "block";
                this._canvas.style["position"] = "fixed";
                this._canvas.style["margin"] = "0";
                this._canvas.style["padding"] = "0";
                this._canvas.style["border"] = "0";
                this._canvas.style["outline"] = "0";
                this._canvas.style["left"] = "0";
                this._canvas.style["top"] = "-20px";
                this._canvas.style["width"] = "100%";
                this._canvas.style["height"] = "100%";
                this._canvas.style["z-index"] = "-1";
                this._onResize();

                this._context = this._canvas.getContext("2d");
                this._context.clearRect(0, 0, this._width, this._height);
                this._context.globalAlpha = this._options.colorAlpha;

                window.addEventListener("resize", this._onResize);
                window.addEventListener("scroll", this._onScroll);
                
                var demo=document.querySelector("#demo");
                var hide_btn = document.createElement("button");
                var fs_btn = document.createElement("button");
                hide_btn.id = 'hideDemo_btn';
                fs_btn.id = 'fullscreen_btn';
                hide_btn.textContent = '×';
                hide_btn.title = 'Close';
                fs_btn.textContent = '⛶';
                
                hide_btn.style["font-size"] = "33px";
                fs_btn.title = 'Fullscreen';
                hide_btn.style["z-index"] = "9999";
                hide_btn.style["display"] = "none";
                hide_btn.style["position"] = "relative";
                hide_btn.style["top"] = "-7px";
                hide_btn.style["left"] = "-10px";
                hide_btn.style["float"] = "right";
                hide_btn.style["background"] = "none";
                hide_btn.style["border"] = "none";
                hide_btn.style["padding"] = 0;
                hide_btn.style["margin"] = 0;

                fs_btn.style["z-index"] = "9999";
                fs_btn.style["display"] = "none";
                fs_btn.style["position"] = "relative";
                if (navigator.userAgent.toLowerCase().includes("firefox")) {
                    fs_btn.style["font-size"] = "19px";
                    fs_btn.style["top"] = "2px";
                } else {
                    fs_btn.style["font-size"] = "21px";
                    fs_btn.style["top"] = "0px";
                }
                
                fs_btn.style["left"] = "-30px";
                fs_btn.style["float"] = "right";
                fs_btn.style["background"] = "none";
                fs_btn.style["border"] = "none";
                fs_btn.style["padding"] = 0;
                fs_btn.style["margin"] = 0;

                hide_btn.onclick = function () {
                  //console.log(this);
                  //this.style["display"] = "block";
                  hideDemo();
                };

                fs_btn.onclick = function () {
                  //console.log(this);
                  //this.style["display"] = "block";
                  //hideDemo(this);
                  fsDemo();
                };

                demo.appendChild(hide_btn);
                demo.appendChild(fs_btn);

                demo.appendChild(this._canvas);
                //document.body.appendChild(this._canvas);
            } catch (e) {
                console.warn("Canvas Context Error: " + e.toString());
                return;
            }
            this._onDraw();
        },

        // Create a new random ribbon and to the list
        addRibbon: function() {
            // tricolor
            if (this._options.singleColor === 667 ) {
                this._options.ribbonCount = 3;
            }
            // movement data
            var dir = (Math.round(random(1, 9)) > 5) ? "right" : "left",
                stop = 1000,
                hide = 400,
                min = 0 - hide,
                max = this._width + hide,
                movex = 0,
                movey = 0,
                startx = (dir === "right") ? min : max,
                starty = Math.round(random(0, this._height));

            // asjust starty based on options
            if (/^(top|min)$/i.test(this._options.verticalPosition)) {
                starty = 0 + hide;
            } else if (/^(middle|center)$/i.test(this._options.verticalPosition)) {
                starty = (this._height / 2);
            } else if (/^(bottom|max)$/i.test(this._options.verticalPosition)) {
                starty = this._height - hide;
            }
            //console.log(this._options.singleColor)
            // ribbon sections data
            // tricolor
            if (this._options.singleColor === 667 ) {
                var hues = [667, 240, 360];
                if (this._saved_color_index >= hues.length) {
                    this._saved_color_index = 0;
                }
                var color = hues[this._saved_color_index]
            } else if (this._options.singleColor) {
                var color = this._options.singleColor
            } else {
                var color = Math.round(random(0, 360));
            }


            var ribbon = [],
                point1 = new Point(startx, starty),
                point2 = new Point(startx, starty),
                point3 = null,
                //color = this._options.singleColor ? this._options.singleColor : Math.round(random(0, 360)),
                //color = Math.round(random(0, 360)),
                // randomize delay between each ribbon appearance
                delay = Math.random() * 4;



            // buils ribbon sections

            while (true) {
                if (stop <= 0) break;
                stop--;

                movex = Math.round((Math.random() * 1 - 0.2) * this._options.horizontalSpeed);
                movey = Math.round((Math.random() * 1 - 0.5) * (this._height * 0.35));

                point3 = new Point();
                point3.copy(point2);

                if (dir === "right") {
                    point3.add(movex, movey);
                    if (point2.x >= max) break;
                } else if (dir === "left") {
                    point3.subtract(movex, movey);
                    if (point2.x <= min) break;
                }
                // point3.clampY( 0, this._height );

                ribbon.push({ // single ribbon section
                    point1: new Point(point1.x, point1.y),
                    point2: new Point(point2.x, point2.y),
                    point3: point3,
                    color: color,
                    delay: delay,
                    dir: dir,
                    alpha: 0,
                    phase: 0,
                });

                point1.copy(point2);
                point2.copy(point3);

                // affects ribbon appear speed
                //delay += 4;
                //delay += 0.2;
                delay += this._options.delay;
                color += this._options.colorCycleSpeed;
                
            }
            // tricolor
            if (this._options.singleColor === 667 ) {
                this._saved_color_index++;
            }
            this._ribbons.push(ribbon);
        },

        _drawRibbonSection: function (section) {
            if (section) {
                if (section.phase >= 1 && section.alpha <= 0) {
                    return true; // done
                }
                if (section.delay <= 0) {
                    // section.phase affects animation speed 
                    //section.phase += 0.014;
                    section.phase += this._options.phase;
                    section.alpha = Math.sin(section.phase) * 1;
                    section.alpha = (section.alpha <= 0) ? 0 : section.alpha;
                    section.alpha = (section.alpha >= 1) ? 1 : section.alpha;

                    if (this._options.animateSections) {
                        var mod = (Math.sin(1 + section.phase * Math.PI / 2) * 0.1);

                        if (section.dir === "right") {
                            section.point1.add(mod, 0);
                            section.point2.add(mod, 0);
                            section.point3.add(mod, 0);
                        } else {
                            section.point1.subtract(mod, 0);
                            section.point2.subtract(mod, 0);
                            section.point3.subtract(mod, 0);
                        }
                        section.point1.add(0, mod);
                        section.point2.add(0, mod);
                        section.point3.add(0, mod);
                    }
                } else {
                    // affects ribbon dissapear speed
                    section.delay -= 0.5;
                }
                
                if (section.color === 667) {
                    var s = "0%";
                    var l = "100%"  
                } else {
                    var s = this._options.colorSaturation;
                    var l = this._options.colorBrightness;
                }
                var //s = this._options.colorSaturation,
                    //l = this._options.colorBrightness,
                    c = "hsla(" + section.color + ", " + s + ", " + l + ", " + section.alpha + " )";

                this._context.save();

                if (this._options.parallaxAmount !== 0) {
                    this._context.translate(0, this._scroll * this._options.parallaxAmount);
                }

                this._context.beginPath();
                this._context.moveTo(section.point1.x, section.point1.y);
                this._context.lineTo(section.point2.x, section.point2.y);
                this._context.lineTo(section.point3.x, section.point3.y);

                // set blur
                this._context.shadowBlur = this._options.ribbonBlur;
                this._context.shadowColor = c;

                this._context.fillStyle = c;
                this._context.fill();

                if (this._options.strokeSize > 0) {
                    this._context.lineWidth = this._options.strokeSize;
                    this._context.strokeStyle = c;
                    this._context.lineCap = "round";
                    this._context.stroke();
                }
                this._context.restore();
            }
            return false; // not done yet
        },

        // Draw ribbons
        _onDraw: function () {

            for (var i = 0; i < this._ribbons.length; ++i) {                
                if (!this._ribbons[i]) {
                    this._ribbons.splice(i, 1);
                    i--;
                }
            }
            
            this._context.clearRect(0, 0, this._width, this._height);

            
            for (var a = 0; a < this._ribbons.length; ++a) {

                var ribbon = this._ribbons[a];

                if (!ribbon || !Array.isArray(ribbon) || ribbon.length === 0) {
                    this._ribbons[a] = null;
                    continue;
                }

                var numSections = ribbon.length;
                var numDone = 0;

                for (var b = 0; b < numSections; ++b) {
                    if (this._drawRibbonSection(ribbon[b])) {
                        numDone++;
                    }
                }

                if (numDone >= numSections) {
                    this._ribbons[a] = null;
                }
            }

            while (this._ribbons.length < this._options.ribbonCount) {
                this.addRibbon();
            }

            AnimationId = requestAnimationFrame(this._onDraw.bind(this));
        },


        // Update container size info
        _onResize: function(e) {
            var screen = screenInfo(e);
            this._width = screen.width;
            this._height = screen.height;

            if (this._canvas) {
                this._canvas.width = this._width;
                this._canvas.height = this._height;

                if (this._context) {
                    this._context.globalAlpha = this._options.colorAlpha;
                }
            }
        },

        // Update container size info
        _onScroll: function(e) {
            var screen = screenInfo(e);
            this._scroll = screen.scrolly;
        },

    };

    // export
    return Factory;
});

var AnimationId = null;

// ribbon appearance section
Ribbons_instance = new Ribbons({
    colorSaturation: "60%", // set saturation
    colorBrightness: "50%", // set brightness
    colorAlpha: 1, // set semitransparency
    verticalPosition: "random", // make vertical position random
    horizontalSpeed: 400, // set speed
    ribbonCount: 3, // max onscreen visible ribbons
    strokeSize: 1, // add stroke
    parallaxAmount: -0.3, // lightn parallax
    animateSections: true, // section animation
    ribbonBlur: 30 // set ribbon blur intensity
});


