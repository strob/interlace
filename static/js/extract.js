(function(_I_) {

    var SLIT_FPS = 25,
    SUBSTICKY_WIDTH = 75;

    _I_.UI.Extract = function(extract) {
        _I_.Triggerable.call(this);
        this.extract = extract;
        this.$el = document.createElement('div');
        _I_.UTIL.classListAdd(this.$el, 'extract');

        this.x=0;
        this.y=0;
        this.x2=100;
        this.y2=0;
        this.w=100;
        this.h=100;

        this.digest_width = 800;

        this.$icon = document.createElement('img');
        this.$icon.src = this.extract.getCuts()[0].composite;
        _I_.UTIL.classListAdd(this.$icon,'icon');
        this.$el.appendChild(this.$icon);

        if(extract.getOverlays().length > 0) {
            this.$hasoverlays = document.createElement('div');
            _I_.UTIL.classListAdd(this.$hasoverlays,'hasoverlays');
            this.$el.appendChild(this.$hasoverlays);
        }

        this.$slits = document.createElement('div');
        _I_.UTIL.classListAdd(this.$slits,'slits');
        this.$el.appendChild(this.$slits);

        this.sticky = new _I_.SubSticky({extract:extract, sortby:_I_.SORT['name']});
        this.$el.appendChild(this.sticky.$el);

        var that = this;
        this.$icon.onclick = function() {
            that.trigger("click", {extract: extract, offset: 0});
            that.expand();
        };
    };
    _I_.UI.Extract.prototype = new _I_.Triggerable;
    _I_.UI.Extract.prototype.blueTag = function() {
        this.sticky.setSortby(_I_.SORT['tag']);
    };
    _I_.UI.Extract.prototype.blueName = function() {
        this.sticky.setSortby(_I_.SORT['name']);
    };
    _I_.UI.Extract.prototype.setDigestWidth = function(w) {
        this.digest_width = w;
    }
    _I_.UI.Extract.prototype.reposition = function(x, y) {
        this.x = x;
        this.y = y;
        // x2 & y2 indicate where the next extract should start
        this.x2 = this.x + this.w;
        this.y2 = this.y;
        this.$el.style.left = x;
        this.$el.style.top = y;
        if(this.expanded) {
            this.expand();
        }
    };
    _I_.UI.Extract.prototype.resize = function(w, h) {
        this.w = w;
        this.h = h;
        this.$el.style.width = w;
        this.$el.style.height = h;
        this.x2 = this.x + this.w;
        this.y2 = this.y;

        if(w > SUBSTICKY_WIDTH) {
            _I_.UTIL.classListRemove(this.sticky.$el,'hidden');
        }
        else {
            _I_.UTIL.classListAdd(this.sticky.$el,'hidden');
        }

        if(this.expanded) {
            this.expand();
        }
    };
    _I_.UI.Extract.prototype.highlight = function() {
        _I_.UTIL.classListAdd(this.$el,'highlight');
    };
    _I_.UI.Extract.prototype.unhighlight = function() {
        _I_.UTIL.classListRemove(this.$el,'highlight');
    };

    var getTimeRects = function(extract, startx, slit_height, width) {
        "[[x1, y1, x2, y2]]"
        out = [];
        var extractw = Math.round(extract.duration*SLIT_FPS),
        curx = startx,
        cury = 0,
        acc = 0;
        while(extractw > 0) {
            var rw = Math.min(extractw, width-curx);
            out.push({left:curx,
                      top:cury,
                      right:curx+rw,
                      bottom:cury+slit_height,
                      offset:acc,
                      inset:(cury===0 && curx===startx) ? 0 : curx // initial condition
                     });
            acc += rw;
            extractw -= rw;
            curx = 0;
            cury += slit_height;
        }
        return out;
    };

    // Expansion is a bit tricky. We make one <div> for each linebreak
    // containing that section of the slitscan, and positioned
    // relatively to the top left coordinate of the extract. However,
    // since this must wrap within the digest, the slitscans must
    // *appear* as if flowing within the digest.

    _I_.UI.Extract.prototype.expand = function() {
        this.expanded = true;
        var that = this;

        getSlitscan(this.extract, function($slit) {
            that.$slits.innerHTML = "";

            getTimeRects(that.extract, that.x, that.h, that.digest_width).forEach(function(r) {
                var $canvas = document.createElement('canvas');
                _I_.UTIL.classListAdd($canvas,'slitscan');
                $canvas.setAttribute('width', r.right-r.left);
                $canvas.setAttribute('height', r.bottom-r.top);

                (function($canvas) {
                    $canvas.onclick = function(ev) {
                        var x = ev.clientX - _I_.UTIL.offset($canvas).left;
                        that.trigger("click", {extract: that.extract,
                                               offset: (r.offset + x) / SLIT_FPS});
                    }
                })($canvas);

                $canvas.style.top = r.top;
                $canvas.style.left = r.left - that.x;

                that.x2 = r.right;
                that.y2 = that.y + r.top;

                var ctx = $canvas.getContext('2d');
                ctx.drawImage($slit,
                              r.offset, 0, r.right-r.left, 96,
                              r.inset, 0, r.right-r.left, r.bottom-r.top);

                $canvas.style.height = that.h;
                that.$slits.appendChild($canvas);
            });

            that.trigger("expanded", {extract: that.extract});
        })

        _I_.UTIL.classListAdd(this.$el,'expanded');
        // this.$icon.style.opacity = 0;
        this.$slits.style.display = "block";
        // this.$slits.style.opacity = 1;
    };
    _I_.UI.Extract.prototype.contract = function() {
        this.expanded = false;
        _I_.UTIL.classListRemove(this.$el,'expanded');
        this.$slits.style.display = "none";
        // this.$slits.style.opacity = 0;
        // this.$icon.style.opacity = "inherit";
        var that = this;
        this.trigger("contracted", {extract: that.extract});
    };
    _I_.UI.Extract.prototype.timeToPx = function(t) {
        "t is absolute, px is absolute"
        if(this.expanded) {
            var rects = getTimeRects(this.extract, this.x, this.h, this.digest_width);
            var xoffset = (t - this.extract.start)*SLIT_FPS;
            for(var i=0; i<rects.length; i++) {
                var r = rects[i];
                if (xoffset < r.offset + r.right - r.left) {
                    return {top: this.y + r.top, left: r.left + (xoffset - r.offset)};
                }
            }
        }
    };

    function makeImage(uri, cb) {
        var $img = document.createElement('img');
        $img.addEventListener("load", function() {
            cb($img);
        }, false);
        $img.src = uri;
        return $img;
    };

    function getImage(uri, cb) {
        // caches an image; only returns (to cb) when img is loaded.
        var $incache = getCache(uri);
        if($incache) {
            if($incache.complete) {
                cb($incache);
            }
            else {
                $incache.addEventListener("load", function() {
                    cb($incache);
                }, false);
            }
        }
        else {
            setCache(uri, makeImage(uri, cb));
        }
    };

    function makeSlitscan(extract, cb) {
        var $canvas = document.createElement('canvas');
        $canvas.setAttribute('width', Math.ceil(extract.duration * SLIT_FPS));
        $canvas.setAttribute('height', 96);
        var ctx = $canvas.getContext('2d'),
        cuts = extract.getCuts(),
        nrem = cuts.length;
        cuts.forEach(function(cut) {
            (function(time) {
                getImage(cut.slitscan, function($img) {
                    nrem -= 1;
                    ctx.drawImage($img, Math.round((time-extract.start)*SLIT_FPS), 0);
                    if(nrem==0) {

                        // draw overlays
                        var overlays = extract.getOverlayExtracts();

                        ctx.fillStyle = "orange";
                        overlays.forEach(function(oext, idx) {
                            ctx.fillRect(oext.delay*SLIT_FPS, 5+(idx%3)*10,
                                         oext.duration*SLIT_FPS, 5);
                        });

                        cb($canvas);
                    }
                });
            })(cut.start - cut.offset); // closure
        });
        return $canvas;
    };
    function getSlitscan(extract, cb) {
        var $incache = getCache(extract.id+'slitscan');
        if($incache) {
            cb($incache);           // XXX: how to know if it's done?
        }
        else {
            setCache(extract.id+'slitscan', makeSlitscan(extract, cb));
        }
    };
    var _cache = {};
    // XXX: presumably we could perform garbage collection, etc., here ... 
    function setCache(key,value) {
        _cache[key] = value;
    };
    function getCache(key) {
        return _cache[key];
    };
})(_I_);
