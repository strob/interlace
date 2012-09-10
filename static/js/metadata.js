(function(_I_) {
    _I_.UI.Metadata = function() {
        _I_.Triggerable.call(this);
        this.$el = document.createElement('div');
        _I_.UTIL.classListAdd(this.$el,'metadata');

        this.$source = document.createElement('div');
        _I_.UTIL.classListAdd(this.$source,'source');

        var that = this;
        ["name", "director", "year"].forEach(function(k) {
            var sticky = new _I_.Sticky({sortby: _I_.SORT[k]});
            that.$source.appendChild(sticky.$el);
            _I_.UTIL.classListAdd(sticky.$el,k);

            sticky.bubble(that);

            that[k+'sticky'] = sticky;
        });
        this.$timecode = document.createElement('div');
        _I_.UTIL.classListAdd(this.$timecode,'sticky');
        _I_.UTIL.classListAdd(this.$timecode,'timecode');
        this.$source.appendChild(this.$timecode);

        this.$el.appendChild(this.$source);

        this.$tags = document.createElement('div');
         _I_.UTIL.classListAdd(this.$tags,'tags');
        this.$el.appendChild(this.$tags);

        this.tags = {};         // id -> sticky
    };
    _I_.UI.Metadata.prototype = new _I_.Triggerable;
    _I_.UI.Metadata.prototype.tick = function(extract, source, time) {
        var that = this;
        if(this.source !== source) {
            this.source = source;
            ["name", "director", "year"].forEach(function(k) {
                that[k+'sticky'].setExtract(extract);
            });
            // XXX: force reflow in Chrome.
            this.$source.style.display = "none";
            window.setTimeout(function() {
                that.$source.style.display = "block";
            }, 50, false);
        }
        this.$timecode.innerHTML = format_time(time);
        var newtags = {};
        source.tagsAt(time).forEach(function(extract) {
            newtags[extract.id] = extract;
        });
        for(var eid in newtags) {
            if(!(eid in this.tags)) {
                // ADD
                var sticky = new _I_.Sticky({sortby: _I_.SORT.tag, extract: newtags[eid]});
                 _I_.UTIL.classListAdd(sticky.$el,'tag');

                // relay events ...
                sticky.bubble(that);

                this.$tags.appendChild(sticky.$el);
                this.tags[eid] = sticky;
            }
        }
        for(var tid in this.tags) {
            if(!(tid in newtags)) {
                this.$tags.removeChild(this.tags[tid].$el);
                delete this.tags[tid];
            }
        }
    };

    function zeropad (number, length) {
        var pad = "";
        for (var i=0; i<length-String(number).length; i++) {
	    pad += "0";
        }
        pad += String(number);
        return pad;
    };

    function format_time(t) {
        var s = t % 60;
        var ms = Math.floor((s % 1) * 100);
        s = Math.floor(s);
        var m = Math.floor(t / 60) % 60;
        var h = Math.floor(t / 3600);
        var str = h + ":" + zeropad(m, 2) + ":" + zeropad(s, 2) + "." + zeropad(ms, 2);
        return str;
    };
})(_I_);
