(function(_I_) {
    _I_.UI = {};
    _I_.UI.Draggable = function(div) {
        "base class for drag-aware mouse subclasses"

        _I_.Triggerable.call(this);
        this.$el = document.createElement(div || "div");
        _I_.UTIL.classListAdd(this.$el,'draggable');
        var that = this;
        this.$el.onmousedown = function(ev) {
	    ev.preventDefault();

	    var el_offset = _I_.UTIL.offset(that.$el);

	    that.ondown(ev.clientX - el_offset.left,
		        ev.clientY - el_offset.top,
		        ev);

	    var px = ev.clientX;
	    var py = ev.clientY;
	    var click = true;

            window.onmousemove = function(ev) {
	        click = false;
	        that.ondrag(ev.clientX, ev.clientY, px, py, ev);
	        px = ev.clientX;
	        py = ev.clientY;
	    };
            window.onmouseup = function(ev) {
	        if(click) {
		    that.onclick(ev.clientX - el_offset.left,
			         ev.clientY - el_offset.top,
			         ev);
	        }
                else {
                    that.onup();
                }
                window.onmousemove = undefined;
                window.onmouseup = undefined;
	    };
        };
    };
    _I_.UI.Draggable.prototype = new _I_.Triggerable;
    _I_.UI.Draggable.prototype.ondown = function(x, y, ev) {
    };
    _I_.UI.Draggable.prototype.onup = function() {
    };
    _I_.UI.Draggable.prototype.onclick = function(x, y, ev) {
    };
    _I_.UI.Draggable.prototype.ondrag = function(x, y, px, py, ev) {
        this.$el.style.left = this.$el.offsetLeft + x - px;
        this.$el.style.top = this.$el.offsetTop + y - py;
    };

    _I_.UTIL = _I_.UTIL || {};

    _I_.UTIL.offset = function( el ) {
        // http://stackoverflow.com/questions/442404/dynamically-retrieve-html-element-x-y-position-with-javascript
        var _x = 0;
        var _y = 0;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
            _x += el.offsetLeft - el.scrollLeft;
            _y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    }

    _I_.UTIL.videoseek = function($v, t, cb) {
        var _seek = function() {
            $v.removeEventListener("loadedmetadata", _seek, false);
            $v.currentTime = t;
            if($v.seeking) {
                var _callback = function() {
                    $v.removeEventListener("seeked", _callback, false);
                    cb();
                }
                $v.addEventListener('seeked', _callback, false); 
            }
            else {
                cb();
            }
        };
        if($v.readyState === 0)
            $v.addEventListener("loadedmetadata", _seek, false);
        else
            _seek();
    };

})(_I_);
