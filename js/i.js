var _I_ = {};

(function(_I_) {

    _I_.CONFIG = _I_.CONFIG || {};

    _I_.CONFIG.ADB = "data/";        // analysis store
    _I_.CONFIG.SDB = "subs/";        // subtitles
    _I_.CONFIG.WDB = "webm/";        // webms
    _I_.CONFIG.MDB = "mov/";         // movs

    _I_.Triggerable = function () {
        "half-baked signals"
        this._signals = {};         // name of signal -> list of listeners
    };
    _I_.Triggerable.prototype.bind = function (signal, cb) {
        if (this._signals[signal] === undefined) {
            this._signals[signal] = [cb];
        }
        else {
            this._signals[signal].push(cb);
        }
    };
    _I_.Triggerable.prototype.trigger = function (signal, ev) {
        //console.log("(TRIGGER)", signal, this);
        if (this._signals[signal] !== undefined) {
            this._signals[signal].forEach(function (cb) {
                cb(ev);
            });
        }
        if( this._bubbleto !== undefined) {
            this._bubbleto.trigger(signal, ev);
        }
    };
    _I_.Triggerable.prototype.bubble = function (bubbleto) {
        this._bubbleto = bubbleto;
    };


    _I_.DataModel = function(id, doc) {
        "lightweight database emulation"
        _I_.Triggerable.call(this);
        this.id = id;
        for(key in doc) {
            this[key] = doc[key];
        }
    };
    _I_.DataModel.prototype = new _I_.Triggerable;
    _I_.DataModel.prototype.get = function(key) {
        "foreign key"
        return _I_.SuperEgo.obj[this[key]];
    };
    _I_.DataModel.prototype.getAll = function(key) {
        "one-to-many"
        return this[key].map(function(id) { return _I_.SuperEgo.obj[id]; });
    };

    // Auto-generate naive subclasses

    _I_.DATA_TYPES = ['Source', 'Extract', 'Tag', 'Overlay'];
    _I_.DATA_TYPES.forEach(function(key) {
        _I_[key] = function(id, doc) { _I_.DataModel.call(this, id, doc); };
        _I_[key].prototype = new _I_.DataModel;
        _I_[key].prototype.type = key;
    });
    _I_.Extract.prototype.getCuts = function() {
        var that = this;
        var starts = this.get('source').cutStarts;

        var cuts = [];
        for(var i=0; i<starts.length-1; i++) {
            if(starts[i+1]>this.start) {
                var offset = Math.max(0, that.start - starts[i]);
                var trim = Math.max(0, starts[i+1] - (that.start+that.duration));

                cuts.push({idx: i,
                           offset: offset,
                           trim: trim,
                           start: starts[i]+offset,
                           duration: starts[i+1] - starts[i] - offset - trim,
                           composite: _I_.CONFIG.ADB + this.source + ".analysis/" + i + '/composite.png',
                           first: _I_.CONFIG.ADB + this.source + ".analysis/" + i + '/first_frame.png',
                           slitscan: _I_.CONFIG.ADB + this.source + ".analysis/" + i + '/slitscan.png'
                          });
                if(starts[i+1]>=this.start+this.duration) {
                    return cuts;
                }
            }
        }
        return cuts;
    };
    _I_.Source.prototype.tagsAt = function(t) {

        var items = this.getExtracts()
	    .filter(function(x) {
	        return x.start < t && x.start + x.duration > t;
            });

        items.sort(function(x,y) { return x.get('tag').name.toLowerCase() > y.get('tag').name.toLowerCase() ? 1 : -1; });
        return items;

    };

    _I_.Extract.prototype.getIntersections = function() {
        "return other extracts from the same source that overlap, sorted by tag name"
        var extract = this;
        var items = _I_.SuperEgo.all(_I_.Extract)
	    .filter(function(x) {
	        return x.source === extract.source &&
                    _I_.UTIL.intersects(x, extract);
            });

        items.sort(function(x,y) { return x.get('tag').name.toLowerCase() > y.get('tag').name.toLowerCase() ? 1 : -1; });
        return items;
    };

    _I_.Source.prototype.getOverlays = function() {
        "return all overlay objects implicating this source"
        var that = this;
        return _I_.SuperEgo.all(_I_.Overlay)
            .filter(function(x) { return x.source0===that.id || x.source1===that.id; });
    };
    _I_.Source.prototype.getOverlaysAt = function(t) {
        "return all overlay objects implicating this source"
        var that = this;
        return _I_.SuperEgo.all(_I_.Overlay)
            .filter(function(x) { return (x.source0===that.id && x.start0 < t && (x.start0 + x.duration > t)) || 
                                  (x.source1===that.id && x.start1 < t && (x.start1 + x.duration > t));
                                });
    };

    _I_.Source.prototype.getExtracts = function() {
        "sorted by start time"
        var that = this;
        var extracts = _I_.SuperEgo.all(_I_.Extract)
            .filter(function(x) { return x.source === that.id; });
        extracts.sort(function(a,b) { return a.start > b.start ? 1 : -1; });
        return extracts;
    };
    _I_.Extract.prototype.getOverlays = function() {
        "return all overlay objects for this extract"
        var that = this;
        return this.get('source').getOverlays()
            .filter(function(x) { 
                return (x.source0==that.source && x.start0+x.duration>that.start && x.start0<that.start+that.duration) ||
                    (x.source1==that.source && x.start1+x.duration>that.start && x.start1<that.start+that.duration);
            });
    };
    _I_.Extract.prototype.getOverlayExtracts = function() {
        var that = this;
        return this.getOverlays().map(function(ovl) { return ovl.asExtract(that); });
    };
    _I_.Overlay.prototype.asMap = function() {
        // {source_id : start}
        out = {};
        out[this["source0"]] = this.start0;
        out[this["source1"]] = this.start1;
        return out;
    };
    _I_.Overlay.prototype.asExtracts = function() {
        return [new _I_.Extract(null, {source: this.source0, start: this.start0, duration: this.duration}),
                new _I_.Extract(null, {source: this.source1, start: this.start1, duration: this.duration})];
    };

    _I_.Overlay.prototype.asExtractFromTime = function(source, time) {
        return this.asExtract(new _I_.Extract(null, {source:source.id, start:time, duration:99999999}));
    };
    _I_.Overlay.prototype.asExtract = function(fromExtract) {
        "returns the appropriately truncated other clip in the overlay as an extract"
        "a `delay' key (>=0) is added to indicate offset before the overlay starts"

        var fromIdx = this.source0 === fromExtract.source ? 0 : 1;
        var idx = (fromIdx + 1) % 2;
        
        var fromOffset = this['start'+fromIdx] - fromExtract.start;
        var fromEnd = Math.min(this['start'+fromIdx] + this.duration, fromExtract.start + fromExtract.duration);

        var startEnd = fromEnd + this['start'+idx] - this['start'+fromIdx];

        var delay = fromOffset > 0 ? fromOffset : 0;

        var trimOverlayBeginning = fromOffset < 0 ? -fromOffset : 0;

        var start = this['start'+idx] + trimOverlayBeginning;

        var duration = startEnd - start;

        return new _I_.Extract(null, {source: this["source"+idx],
                                     delay: delay,
                                     start: start,
                                     overlay: this,
                                     duration: duration});
    };

    _I_.Source.prototype.loadSubs = function(cb) {
        "asynchronous w/naive caching -- hits callback subtitles as a json payload"
        if(this._subs) { 
            cb(this._subs); 
            return;
        }

        var that = this;
        _I_.UTIL.load_json(_I_.CONFIG.SDB + this.id + ".json", function(subs) {
            that._subs = subs;
            cb(subs);
        });
    };
    _I_.Extract.prototype.loadSubs = function(cb) {
        "subtitles intersecting with this extract"
        var that = this;
        this.get("source").loadSubs(function(subs) {
            cb(subs.filter(function(x) { return _I_.UTIL.intersects(x, that); }));
        });
    };
    _I_.Source.prototype.getVideo = function() {
        "figures out which to return automatically"
        if(_I_.Source.prototype._getVideo === undefined) {
            var $v = document.createElement('video');
            if($v.canPlayType('video/webm')) {
                // console.log("WEBM SELECTED");
                _I_.Source.prototype._getVideo = _I_.Source.prototype.getWebm;
            }
            else if($v.canPlayType('video/mp4')) {
                // console.log("MP4 SELECTED");
                _I_.Source.prototype._getVideo = _I_.Source.prototype.getMov;
            }
            else {
                alert("Your web browser does not seem to support HTML5 video. Firefox and Chrome seem to be alright.");
                // console.log("_I_DEO PLAYBACK NOT SUPPORTED");
            }
        }
        return this._getVideo();
    };
    _I_.Source.prototype.getWebm = function() {
        return _I_.CONFIG.WDB + this.id + '.webm';
    };
    _I_.Source.prototype.getMov = function() {
        return _I_.CONFIG.MDB + this.id + '.mp4';
    };
    _I_.Source.prototype.getExtractTotalTime = function() {
        var extracts = this.getExtracts();
        var acc = 0;
        var til = 0;
        extracts.forEach(function(e) {
            acc += e.duration - Math.max(0, (til - e.start));
            til = Math.max(til, e.start + e.duration);
        });
        return acc;
    };

    _I_.SuperEgo = {
        obj: {}
    };
    _I_.SuperEgo.all = function(dtype) {
        // cache
        if(this['all_'+dtype.prototype.type] === undefined) {
            this['all_'+dtype.prototype.type] = [];
            var out = this['all_'+dtype.prototype.type];
            for(var key in _I_.SuperEgo.obj) {
                if(_I_.SuperEgo.obj[key] instanceof dtype) {
                    out.push(_I_.SuperEgo.obj[key]);
                }
            }
        }
        return this['all_'+dtype.prototype.type];
    };
    _I_.SuperEgo.load = function(cb) {
        "assumes a json file for each data-type (eg. Source.json) is in cwd"
        var nrem = _I_.DATA_TYPES.length;
        _I_.DATA_TYPES.forEach(function(name) {
            _I_.UTIL.load_json(name+".json", function(res) {
                for(key in res) {
                    _I_.SuperEgo.obj[key] = new _I_[name](key, res[key]);
                }
                nrem -= 1;

                if(nrem === 0) {
                    cb();
                }
            })
        });
    };


    // ...
    _I_.UTIL = _I_.UTIL || {};
    _I_.UTIL.load = function (uri, cb) {
        var req = new XMLHttpRequest();
        req.open("GET", uri, true);

        req.onreadystatechange = function() { 
            if(req.readyState == 4) {
                if(req.status == 200) {
                    cb(req.responseText);
                }
                else {
                    console.log("error loading " + uri, req.status);
                }
            }
        };
        req.send();
    };
    _I_.UTIL.load_json = function (uri, cb) {
        _I_.UTIL.load(uri, function(txt) { cb(JSON.parse(txt)); });
    };
    _I_.UTIL.intersects = function(a,b) {
        "assumes a and b have `start' and `duration' meaningfully defined"
        return a.start + a.duration > b.start &&
            a.start < b.start + b.duration;
    };
    _I_.UTIL.classList = function($el) {
        return $el.className.split(' ');
    };
    _I_.UTIL.classListAdd = function($el, cls) {
        var list = _I_.UTIL.classList($el);
        for(var i=0; i<list.length; i++) {
            if(list[i] === cls)
                return
        }
        $el.className += ' '+cls;
    };
    _I_.UTIL.classListRemove = function($el, cls) {
        var list = _I_.UTIL.classList($el);
        for(var i=0; i<list.length; i++) {
            if(list[i] === cls) {
                var acc = '';
                list.splice(i, 1);
                list.forEach(function(x) { 
                    acc += ' '+x;
                });
                $el.className = acc;
            }
        }
    };

})(_I_);
