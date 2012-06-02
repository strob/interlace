(function(_I_) {
    _I_.SORT = {
        "name": function(extract) { return [extract.get('source').name, 
				            extract.start]; },
        "tag": function(extract) { return [extract.get('tag').name, 
				           extract.get('source').year,
				           extract.get('source').name,
				           extract.start]; },
        "year": function(extract) { return [extract.get('source').year,
				            extract.get('source').name,
				            extract.start]; },
        "director": function(extract) { return [extract.get('source').director,
				                extract.get('source').year,
				                extract.get('source').name,
				                extract.start]; }
    };

    var SORT_DEFAULTS = {extract: undefined,
                         sortby: undefined,
                         csstype: "div",
                         cssclass: "sorting"};
    var Sorting = function(spec) {
        _I_.Triggerable.call(this);

        if(spec === undefined)
            return
        for(var key in SORT_DEFAULTS) {
            this[key] = (spec && spec[key]) || SORT_DEFAULTS[key];
        }

        this.$el = document.createElement(this.csstype);
        this.$el.classList.add(this.cssclass);
        if(this.extract) {
            this.$el.innerHTML = this.sortby(this.extract)[0];
        }
        var that = this;

        this.$el.onclick = function() {
            if(that.extract)
                that.trigger("select", {sortby: that.sortby, extract: that.extract});
        };
        this.$el.onmouseover = function() {
            if(that.extract)
                that.trigger("preview", {sortby: that.sortby, extract: that.extract});
        };
        this.$el.onmouseout = function() {
            that.trigger("unpreview");
        };
    };
    Sorting.prototype = new _I_.Triggerable;
    Sorting.prototype.setExtract = function(extract) {
        if(extract != this.extract) {
            this.extract = extract;
            this.$el.innerHTML = this.sortby(this.extract)[0];
        }
    };
    Sorting.prototype.position = function(digest) {
        this.$el.style.left = digest.getWidget(this.extract).x;
        this.$el.style.top = digest.getWidget(this.extract).y;
    };

    _I_.Sticky = function(spec) {
        spec.cssclass = "sticky";
        Sorting.call(this, spec);
    };
    _I_.Sticky.prototype = new Sorting;

    _I_.SubSticky = function(spec) {
        spec.cssclass = "substicky";
        Sorting.call(this, spec);
    }
    _I_.SubSticky.prototype = new Sorting;

})(_I_);
