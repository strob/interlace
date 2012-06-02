// A teleputer manages several videos, their metadata, & their overlays.
// As such, "metadata.js" must be imported prior to this file.

(function(_I_) {

    var DEFAULTS = {
        vheight: 240,
    };

    _I_.UI.Teleputer = function(spec) {
        _I_.UI.Draggable.call(this);
        this.$el.classList.add('teleputer');

        this.$videoa = document.createElement('video');
        this.$videob = document.createElement('video'); // DOUBLE BUFFER!

        this.$video = this.$videoa;
        this.$video_off = this.$videob;

        this.$subtitles = document.createElement('div');
        this.$subtitles.classList.add('subtitles');
        this.$el.appendChild(this.$subtitles);
        this.$el.appendChild(this.$video);

        var that = this;

        this.metadata = new _I_.UI.Metadata();
        this.bind("tick", function(spec) {
            that.metadata.tick(spec.extract, spec.source, spec.time);
        })
        this.metadata.bubble(this); // relay events
        this.$el.appendChild(this.metadata.$el);

        for(var k in DEFAULTS) {
            this[k] = (spec && spec[k]) || DEFAULTS[k];
        }

        this.$videoa.setAttribute("height", this.vheight);
        this.$videob.setAttribute("height", this.vheight);

        this.$video.addEventListener("timeupdate", function() {
	    that.ontimeupdate();
        }, false);
        this.$video_off.addEventListener("timeupdate", function() {
	    that.ontimeupdate();
        }, false);
    };
    _I_.UI.Teleputer.prototype = new _I_.UI.Draggable;

    _I_.UI.Teleputer.prototype.set = function(extract) {
        var that = this;
        this.subtitles = [];
        // load subs
        extract.loadSubs(function(subs) { 
            if(that.extract === extract) {
                that.subtitles = subs;
            }
        });

        if(extract === this.next) {
            this.goToNext();
        }
        else {
            this.randomAccess(extract);
        }
    };
    _I_.UI.Teleputer.prototype.seek = function(t) {
        var that = this;
        this.startSwitching();
	_I_.UTIL.videoseek(this.$video, t, function() {
            that.stopSwitching();
            if(!that.ticking)
                that.tick();
        });
    };


    _I_.UI.Teleputer.prototype.goToNext = function() {
        var $off = this.$video_off;

        // SWAP BUFFERS
        this.$el.removeChild(this.$video);
        this.$video.pause();
        this.$video_off = this.$video;
        this.$video = $off;
        this.$video.play();
        this.$el.appendChild(this.$video);

        this.extract = this.next;
        this.next = undefined;
    };
    _I_.UI.Teleputer.prototype.setNext = function(extract) {
        this.next = extract;
        this.$video_off.src = this.next.get('source').getVideo();
        _I_.UTIL.videoseek(this.$video_off, this.next.start, function() {});
    };
    _I_.UI.Teleputer.prototype.randomAccess = function(extract) {
        var that = this;
        if(extract.source !== this.$video.src) {
            this.startSwitching();
            this.$video.src = extract.get('source').getVideo();
            _I_.UTIL.videoseek(this.$video, extract.start, function() {
                that.$video.play();
                that.stopSwitching();
            });
        }
        else if(extract.start > $v.currentTime || extract.start + extract.duration < $v.currentTime) {
            // only seek if out of range, while within the same source (eg. for tag clicks)
            this.startSwitching();
            _I_.UTIL.videoseek(this.$video, extract.start, function() {
                that.$video.play();
                that.stopSwitching();
            });
        }
        this.extract = extract;
        this.next = undefined;
    };
    _I_.UI.Teleputer.prototype.startSwitching = function() {
        this.switching = true;
    };
    _I_.UI.Teleputer.prototype.stopSwitching = function() {
        this.switching = false;
    };
    _I_.UI.Teleputer.prototype.ontimeupdate = function() {
        // use the $video's core timeupdate function for primary control flow,
        // which can manage a faster setTimeout for tick.
        var that = this;

        var $v = this.$video;

        if(this.switching || !this.extract) {        // something is loading
            return;
        }

        if($v.currentTime < this.extract.start + this.extract.duration) {
	    if(!$v.paused) {
                // draw subtitle, if relevant
                this.$subtitles.innerHTML = "";
                var subnow = this.subtitles
                    .filter(function(x) { return (x.start + x.duration > $v.currentTime) && (x.start < $v.currentTime); });
                if(subnow.length > 0) {
                    this.$subtitles.innerHTML = subnow[0].text;
                }
	    }
            if(!this.ticking) {
                this.tick();
            }
        }
        else {
	    $v.src = "";
            if(this.next) {
                this.set(this.next);
            }
	    this.trigger("done");
        }
    };
    _I_.UI.Teleputer.prototype.tick = function() {
        this.ticking = true;
        var that = this;
        if(!(this.switching || this.$video.src=="" || this.$video.paused)) {
            if(this.timeout) {
                window.clearTimeout(this.timeout);
            }
            this.timeout = window.setTimeout(function() { that.tick(); }, 1000/25);
        }
        else {
            this.ticking = false;
            this.timeout = undefined;
        }
        this.trigger("tick", {extract: this.extract, source: this.extract.get("source"), time: this.$video.currentTime, w: this.$video.offsetWidth, h: this.$video.offsetHeight});
    };
    _I_.UI.Teleputer.prototype.ondown = function(x,y,ev) {
        if(ev.target === this.$el) {
	    this._resize = this.$video.offsetHeight;
        }
        else {
	    this._resize = undefined;
        }
    };
    _I_.UI.Teleputer.prototype.onclick = function(x,y,ev) {
        if(ev.target === this.$video) {
            if(this.$video.paused) {
	        this.$video.play();
            }
            else {
	        this.$video.pause();
            }
        }
    };
    _I_.UI.Teleputer.prototype.ondrag = function(x,y,px,py,ev) {
        this.vheight += py-y;
        this.vheight = Math.max(96, this.vheight);

        this.$videoa.setAttribute("height", this.vheight);
        this.$videob.setAttribute("height", this.vheight);
    };

})(_I_);
