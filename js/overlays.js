// manages Teleputer children ...

(function(_I_) {
    _I_.UI.Overlays = function() {
        _I_.Triggerable.call(this);

        this.$el = document.createElement('div');
         _I_.UTIL.classListAdd(this.$el,'overlays');

        this.overlays = {};     // id -> TelePuter

        this.available_teleputers = []; // we keep a fixed number of
                                        // TPS to avoid use of more
                                        // than 6 <video> elements...
        var that = this;
        for(var i=0; i<3; i++) {
            var tp = new _I_.UI.Teleputer({vheight: 96, volume: 0});
            tp.bubble(this);
            tp.bind("done", function() {that.remove(ovl.id);});
            this.available_teleputers.push(tp);
        }
    };
    _I_.UI.Overlays.prototype = new _I_.Triggerable;

    _I_.UI.Overlays.prototype.tick = function(source, time) {
        var newoverlays = {};
        source.getOverlaysAt(time).forEach(function(ovl) {
            newoverlays[ovl.id] = ovl;
        });
        for(var nid in newoverlays) {
            if(!(nid in this.overlays)) {
                this.add(newoverlays[nid], source, time);
            }
        }
        for(var oid in this.overlays) {
            if(!(oid in newoverlays)) {
                this.remove(oid);
            }
        }
    };

    _I_.UI.Overlays.prototype.pause = function() {
        for(var oid in this.overlays) {
            this.overlays[oid].pause();
        }
    };
    _I_.UI.Overlays.prototype.play = function() {
        for(var oid in this.overlays) {
            this.overlays[oid].play();
        }
    };

    _I_.UI.Overlays.prototype.seek = function(spec) {
        for(var oid in this.overlays) {
            this.overlays[oid].seek(spec);
        }
    };

    _I_.UI.Overlays.prototype.add = function(ovl, source, time) {
        // don't exceed 3!
        if(this.available_teleputers.length == 0) {
            return;
        }

        var tp = this.available_teleputers.pop();
        tp.set(ovl.asExtractFromTime(source, time));
        this.overlays[ovl.id] = tp;
        this.$el.appendChild(tp.$el);
        this.position();
    };
    _I_.UI.Overlays.prototype.position = function() {
        var i=0;
        for(var id in this.overlays) {
            this.overlays[id].$el.style.left = i*150;
            i+= 1;
        }
    };
    _I_.UI.Overlays.prototype.remove = function(ovlid) {
        var tp = this.overlays[ovlid];
        tp.$videoa.src = "";
        tp.$videob.src = "";
        this.$el.removeChild(tp.$el);
        this.available_teleputers.push(tp);
        delete this.overlays[ovlid];

        this.position();
    };

})(_I_);
