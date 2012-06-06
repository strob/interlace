(function(_I_) {
    _I_.SORT = {
        "name": function(extract) { return [extract.get('source').name, 
				            extract.start]; },
        "tag": function(extract) { return [extract.get('tag').name, 
		                           10000 - extract.get('source').year,
				           extract.get('source').name,
				           extract.start]; },
        "year": function(extract) { return [extract.get('source').year,
				            extract.get('source').name,
				            extract.start]; },
        "director": function(extract) { return [extract.get('source').director,
				                10000 - extract.get('source').year,
				                extract.get('source').name,
				                extract.start]; }
    };

    // var SORT_DEFAULTS = {extract: undefined,
    //                      sortby: undefined, cssclass;};
    var Sorting = function(spec) {
        _I_.Triggerable.call(this);

        if(spec === undefined)
            return

        this.$el = document.createElement("div");
         _I_.UTIL.classListAdd(this.$el,spec.cssclass || 'sorting');

        if(spec.extract)
            this.setExtract(spec.extract);
        this.setSortby(spec.sortby);
    };
    Sorting.prototype = new _I_.Triggerable;
    Sorting.prototype.setSortby = function(sortby) {
        this.sortby = sortby;
        if(this.extract)
            this.$el.innerHTML = this.sortby(this.extract)[0];
    }
    Sorting.prototype.setExtract = function(extract) {
        if(extract !== this.extract) {
            if(this.extract === undefined) {
                var that = this;
                this.$el.onclick = function() {
                    if(that.extract && that.extract.id)
                        that.trigger("select", {sortby: that.sortby, sortkey: that.sortkey, extract: that.extract});
                };
                this.$el.onmouseover = function() {
                    if(that.extract  && that.extract.id )
                        that.trigger("preview", {sortby: that.sortby, extract: that.extract});
                };
                this.$el.onmouseout = function() {
                    that.trigger("unpreview");
                };
            }
            this.extract = extract;
            if(this.sortby) {
                this.$el.innerHTML = this.sortby(this.extract)[0];
            }
        }
    };
    Sorting.prototype.position = function(digest) {
        var widg = digest.getWidget(this.extract);
        this.$el.style.left = Math.min(digest.width - this.$el.offsetWidth, widg.x);
        this.$el.style.top = widg.y + digest.EH - this.$el.offsetHeight - 5;
    };

    _I_.Sticky = function(spec) {
        spec.cssclass = "sticky";
        Sorting.call(this, spec);
    };
    _I_.Sticky.prototype = new Sorting;
    _I_.Sticky.prototype.expand = function(exts) {
        // XXX: compute stats
         _I_.UTIL.classListAdd(this.$el,'cur');
    };
    _I_.Sticky.prototype.contract = function(exts) {
        // XXX: compute stats
         _I_.UTIL.classListAdd(this.$el,'cur');
    };

    _I_.SubSticky = function(spec) {
        spec.cssclass = "substicky";
        Sorting.call(this, spec);
    }
    _I_.SubSticky.prototype = new Sorting;

})(_I_);
