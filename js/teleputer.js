// A teleputer manages several videos, their metadata, & their overlays.
// As such, "metadata.js" must be imported prior to this file.

(function(_I_) {

    var DEFAULTS = {
        vheight: 240,
        volume: 1
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
            this[k] = (spec && spec[k] !== undefined) ? spec[k] : DEFAULTS[k];
        }

        this.setHeight(this.vheight);
        this.setVolume(this.volume);

        this.timeupdateEV = function () { that.ontimeupdate(); }
        this.$video.addEventListener("timeupdate", this.timeupdateEV, false);
        this.$video_off.addEventListener("timeupdate", this.timeupdateEV, false);
    };
    _I_.UI.Teleputer.prototype = new _I_.UI.Draggable;
    _I_.UI.Teleputer.prototype.loadSubs = function() {
        var that = this;
        this.subtitles = [];
        // load subs
        (function(extract) {
            that.extract.loadSubs(function(subs) { 
                if(that.extract === extract) {
                    that.subtitles = subs;
                }
            });
        })(this.extract);
    };
    _I_.UI.Teleputer.prototype.set = function(extract, cb) {
        var that = this;
        this.extract = extract;
        this.loadSubs();
        if(extract === this.next) {
            this.goToNext(cb);
        }
        else {
            this.randomAccess(extract, cb);
        }
    };
    _I_.UI.Teleputer.prototype.seek = function(spec) {
        var that = this;
        var t = spec.t || this.$video.currentTime + spec.offset;
        this.startSwitching();
        this.trigger("seek", {offset: t-this.$video.currentTime});
	_I_.UTIL.videoseek(this.$video, t, function() {
            that.stopSwitching();
            if(!that.ticking)
                that.tick();
        });
    };
    _I_.UI.Teleputer.prototype.play = function() {
        this.$video.play();
        this.trigger('play');
    };
    _I_.UI.Teleputer.prototype.pause = function() {
        this.$video.pause();
        this.trigger('pause');
    };
    _I_.UI.Teleputer.prototype.setVolume = function(v) {
        console.log("setVolume", v, this.$video);
        this.volume = v;
        this.$videoa.volume = v;
        this.$videob.volume = v;
    };
    _I_.UI.Teleputer.prototype.togglePlayback = function() {
        if(this.$video.paused) {
            this.play();
        }
        else {
            this.pause();
        }
    };

    _I_.UI.Teleputer.prototype.removeVideo = function() {
        // kill events, remove from DOM, return.
        this.$video.removeEventListener("timeupdate", this.timeupdateEV, false);
        this.$el.removeChild(this.$video);
        return this.$video;
    };
    _I_.UI.Teleputer.prototype.addVideo = function($v) {
        this.$video = $v;
        if(this.$video_off === this.$videoa) {
            this.$videob = $v;
        }
        else {
            this.$videoa = $v;
        }
        this.$video.addEventListener("timeupdate", this.timeupdateEV, false);

        this.setVolume(this.volume);
        this.setHeight(this.vheight);

        this.$el.appendChild(this.$video);
    };

    _I_.UI.Teleputer.prototype.swapVideos = function(TP2) {
        // ie. without interruption
        // ASSUMES EXTRACTS HAVE BEEN SWAPPED OUTSIDE

        this.startSwitching();
        TP2.startSwitching();

        var $a = this.removeVideo();
        var $b = TP2.removeVideo();

        // var a = this.extract;
        // this.extract = TP2.extract;
        // TP2.extract = a;

        // var s = this.subs;
        // this.subs = TP2.subs;
        // TP2.subs = s;

        TP2.addVideo($a);
        this.addVideo($b);

        TP2.next = undefined;
        this.next = undefined;

        this.stopSwitching();
        TP2.stopSwitching();

        this.play();
    };

    _I_.UI.Teleputer.prototype.goToNext = function(cb) {
        var $off = this.$video_off;
        var that = this;

        // SWAP BUFFERS
        this.$el.removeChild(this.$video);
        this.$video.pause();
        this.$video_off = this.$video;
        this.$video = $off;
        this.$video.play();
        this.$el.appendChild(this.$video);

        this.extract = this.next;
        this.next = undefined;

        // reset subs (XXX: duplicated code)
        this.loadSubs();

        if(cb)
            cb();
    };
    _I_.UI.Teleputer.prototype.setNext = function(extract) {
        this.next = extract;
        this.$video_off.src = this.next.get('source').getVideo();
        _I_.UTIL.videoseek(this.$video_off, this.next.start, function() {});
    };
    _I_.UI.Teleputer.prototype.randomAccess = function(extract, cb) {
        var that = this;
        if(extract.source !== this.$video.src) {
            this.startSwitching();
            this.$video.src = extract.get('source').getVideo();
            _I_.UTIL.videoseek(this.$video, extract.start, function() {
                that.$video.play();
                that.stopSwitching();
                that.setVolume(that.volume);
                if(cb)
                    cb();
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

            this.trigger("tick", {extract: this.extract, source: this.extract.get("source"), time: this.$video.currentTime, w: this.$video.offsetWidth, h: this.$video.offsetHeight});
            
        }
        else {
            this.ticking = false;
            this.timeout = undefined;
        }
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
            this.trigger("click", {tp: this});
        }
    };
    _I_.UI.Teleputer.prototype.setHeight = function(h) {
        this.vheight = h;
        this.$videoa.setAttribute("height", this.vheight);
        this.$videob.setAttribute("height", this.vheight);

        this.metadata.$el.style.width = this.$video.clientWidth || this.vheight*1.33;
    }
    _I_.UI.Teleputer.prototype.ondrag = function(x,y,px,py,ev) {
        this.trigger("drag", {dy: py-y, tp: this})
    };
    _I_.UI.Teleputer.prototype.makeRazor = function() {
        // XXX!!!
    };
    _I_.UI.Teleputer.prototype.position = function(digest, pt) {
        var pt = pt || digest.getWidget(this.extract).timeToPx(this.$video.currentTime);
        if(pt) {
            this.$el.style.left = pt.left;
            this.$el.style.top = pt.top + digest.$el.offsetTop - this.vheight;
         }
    };

})(_I_);
