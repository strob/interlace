(function(_I_) {
    var DEFAULTS = {
        ExtractWidget: _I_.UI.Extract,
        extracts: [],
        EW: 120,
        EH: 96,
        width: 800
    };

    _I_.UI.Digest = function(spec) {
        _I_.Triggerable.call(this);
        this.$el = document.createElement('div');
        _I_.UTIL.classListAdd(this.$el, 'digest');
        for(var k in DEFAULTS) {
            this[k] = (spec && spec[k]) || DEFAULTS[k];
        }
        this.extractwidgets = {}; // id -> widget
        this.stickies = {};       // key -> widget
        var that = this;

        var preview = function(spec) { 
            that.setHighlightFn(function(ex) { return spec.sortby(ex)[0] === spec.sortby(spec.extract)[0]; });
        }
        var unpreview = function() { that.remHighlightFn(); }
        var select = function(spec) { 
            // simulate click on the first element
            that.sort(spec.sortby);
            that.getWidget(spec.extract).trigger("click", {extract: spec.extract, offset: 0});
            that.getWidget(spec.extract).expand();
        };

        this.extracts.forEach(function(extract) {
            that.extractwidgets[extract.id] = new that.ExtractWidget(extract);
            that.extractwidgets[extract.id].setDigestWidth(that.width);

            // var sticky = that.extractwidgets[extract.id].sticky;
            // sticky.bind("preview", preview);
            // sticky.bind("unpreview", unpreview);
            // sticky.bind("select", select);

            that.$el.appendChild(that.getWidget(extract).$el);
        });
    };
    _I_.UI.Digest.prototype = new _I_.Triggerable;
    _I_.UI.Digest.prototype.zoom = function(w,h) {
        var that = this;
        this.EW = w;
        this.EH = h;

        if(document.body.clientWidth) {
            this.width = document.body.clientWidth;
            this.EW = this.width / Math.floor(this.width / that.EW);
        }
        this.extracts.forEach(function(extract) {
            that.getWidget(extract).setDigestWidth(that.width);
            that.getWidget(extract).resize(that.EW,h);
        });
    };
    _I_.UI.Digest.prototype.flow = function() {
        var that = this,
        curx = 0,
        cury = 0;
        this.width = document.body.clientWidth;

        //console.log("START FLOW LOOP");

        this.extracts.forEach(function(ex) {
            var widg = that.getWidget(ex);
            widg.setDigestWidth(that.width);
            widg.reposition(curx, cury);
            curx = widg.x2;
            cury = widg.y2;
            if(curx + 0.8*that.EW > that.width) {
                curx = 0;
                cury += that.EH;
            }
        });

        //console.log("END FLOW LOOP");

        this.$el.style.height = cury + that.EH;

        //console.log("POSITION STICKIES");

        this.positionStickies();

        //console.log("TRIGGER FLOWED");

        this.trigger("flowed");
    };
    _I_.UI.Digest.prototype.positionStickies = function() {
        for(var id in this.stickies) {
            this.stickies[id].position(this);
        }
    };
    _I_.UI.Digest.prototype.getWidget = function(extract) {
        return this.extractwidgets[extract.id];
    };
    _I_.UI.Digest.prototype.getPosition = function(extract) {
        var $el = this.getWidget(extract).$el;
        return {left: $el.offsetLeft, top: $el.offsetTop};
    };
    _I_.UI.Digest.prototype.select = function(extract, dontflow) {
        //console.log("SELECT");
        if(this.selected) {
            this.getWidget(this.selected).contract();
        }

        //console.log("AQUAFYING");
        var currentseq = this.sortby(extract)[0];
        if(currentseq != this.currentseq) {
            var inseq = [];
            for(var id in this.extractwidgets) {
                var w = this.extractwidgets[id];
                if(this.sortby(w.extract)[0] === currentseq) {
                    _I_.UTIL.classListAdd(w.$el, 'cur');
                    inseq.push(w.extract);
                }
                else {
                    _I_.UTIL.classListRemove(w.$el, 'cur');
                }
            }

            if(this.currentseq && this.currentseq in this.stickies)
                this.stickies[this.currentseq].contract();

            this.currentseq = currentseq;
            this.stickies[currentseq].expand(inseq);
        }

        //console.log("DONE AQUAFYING");
        this.selected = extract;
        //console.log("SEL_EXPANDING?!");
        this.getWidget(this.selected).expand();
        //console.log("SEL_FLOWING?!");
        this.flow();
        this.trigger("selected", extract);
    };

    _I_.UI.Digest.prototype.setHighlightFn = function(fn) {
        var that = this;

        this.extracts
            .filter(fn)
            .forEach(function(ex) {
                that.getWidget(ex).highlight();
            });
    };
    _I_.UI.Digest.prototype.remHighlightFn = function() {
        var that = this;
        this.extracts
            .forEach(function(ex) {
                that.getWidget(ex).unhighlight();
            });
    };
    _I_.UI.Digest.prototype.sort = function(sortby, extract) {
        if(this.sortby !== sortby) {
            this.sortby = sortby;

            var that = this;

            for(var id in this.stickies) {
                this.$el.removeChild(this.stickies[id].$el);
                delete this.stickies[id];
            }

            this.extracts.sort(function(x,y) { return sortby(x) > sortby(y) ? 1 : -1; });

            var prev = undefined;
            this.extracts.forEach(function(ex) {
                var key = sortby(ex)[0];

                if(sortby === _I_.SORT['tag']) {
                    that.getWidget(ex).blueName();
                }
                else {
                    that.getWidget(ex).blueTag();
                }

                if(key !== prev) {
                    var sticky = new _I_.Sticky({sortby: sortby, extract: ex});

                    sticky.bind("preview", function(spec) { 
                        that.setHighlightFn(function(ex) { return spec.sortby(ex)[0] === spec.sortby(spec.extract)[0]; });
                    });
                    sticky.bind("unpreview", function() { that.remHighlightFn(); });
                    sticky.bind("select", function(spec) { 
                        // simulate click on the first element
                        that.getWidget(ex).trigger("click", {extract: ex, offset: 0});
                        that.getWidget(ex).expand();
                    });

                    that.$el.appendChild(sticky.$el);
                    that.stickies[key] = sticky;
                    prev = key;
                }
            });
            this.trigger("sorted");
        }
        if(extract !== undefined || this.selected !== undefined)
            this.select(extract || this.selected);
        else
            this.flow();
    };
})(_I_);
