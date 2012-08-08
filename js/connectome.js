var extracts, digest, zoom, teleputer, overlays;
var preview, unpreview, sort;

_I_.SuperEgo.load(function() {
    extracts = _I_.SuperEgo.all(_I_.Extract);
    digest = new _I_.UI.Digest({extracts: extracts});
    document.body.appendChild(digest.$el);

    zoom = new _I_.UI.Zoom();
    document.body.appendChild(zoom.$el);
    zoom.bind("zoom", function(percent) {
        var h = Math.max(16, 150*percent);
        digest.zoom(1.33*h,h);
        digest.flow();
        teleputer.position(digest);
    });

    teleputer = new _I_.UI.Teleputer();
    document.body.appendChild(teleputer.$el);
    teleputer.bind("done", function() {
        digest.select(teleputer.extract);
        teleputer.setNext(
            digest.extracts[(digest.extracts.indexOf(teleputer.extract) + 1) % digest.extracts.length]);
    });

    digest.bind("sorted", function() {
        var extract = teleputer.extract || digest.extracts[0];
        teleputer.setNext(
            digest.extracts[(digest.extracts.indexOf(extract) + 1) % digest.extracts.length]);
    });

    function onclick(spec) {
        if(spec.extract === teleputer.extract) {
            spec.offset = spec.offset - teleputer.$video.currentTime + spec.extract.start;
            teleputer.seek(spec)
        }
        else {
            digest.select(spec.extract);
            teleputer.set(spec.extract, function() {
                if(spec.offset) {
                    teleputer.seek(spec);
                }
            });
        }
        teleputer.setNext(
            digest.extracts[(digest.extracts.indexOf(spec.extract) + 1) % digest.extracts.length]);
    }
    overlays = new _I_.UI.Overlays();
    teleputer.bind("tick", function(spec) {
        overlays.tick(spec.source, spec.time);
        var pt = digest.getWidget(teleputer.extract).timeToPx(spec.time);
        if(pt) {
            var left = teleputer.position(digest, pt);
            var ovls = [];
            var curx = 0;
            for(var key in overlays.overlays) {
                ovls.push(overlays.overlays[key].vheight);
                overlays.overlays[key].$el.style.left = curx;
                overlays.overlays[key].$el.style.top = 0;
                curx += overlays.overlays[key].$el.offsetWidth + 20;
            }
            if(left)
                overlays.$el.style.left = left;
            var max_height = ovls.reduce(function(x,y) { return Math.max(x,y); }, 0);
            overlays.$el.style.top = pt.top + digest.$el.offsetTop - teleputer.vheight - max_height;
        }

    });
    document.body.appendChild(overlays.$el);

    preview = function (spec) {
        digest.setHighlightFn(function(ex) { return spec.sortby(ex)[0] === spec.sortby(spec.extract)[0]; });
    }
    unpreview = function(spec) {
        digest.remHighlightFn();
    }
    sort = function(spec) {
        teleputer.extract = spec.extract;

        //digest.select(spec.extract, true);
        digest.sort(spec.sortby, spec.extract);

        teleputer.position(digest);
    }

    extracts.forEach(function(extract) {
        digest.getWidget(extract).bind("click", onclick);

        digest.getWidget(extract).sticky.bind("preview", preview);
        digest.getWidget(extract).sticky.bind("unpreview", unpreview);
        digest.getWidget(extract).sticky.bind("select", function(spec) {
            digest.sort(spec.sortby, spec.extract);
            teleputer.set(spec.extract, function() {
                teleputer.setNext(
                    digest.extracts[(digest.extracts.indexOf(spec.extract) + 1) % digest.extracts.length]);
            });
        });
    });

    teleputer.bind("click", function() {
        teleputer.togglePlayback();
    });

    teleputer.bind("play", function() {
        overlays.play();
    });
    teleputer.bind("pause", function() {
        overlays.pause();
    });
    teleputer.bind("seek", function(spec) {
        overlays.seek(spec);

        var extractwidget = digest.getWidget(teleputer.extract);
        var pt = extractwidget.timeToPx(teleputer.$video.currentTime + spec.offset);
        if(pt){
            // console.log("seek to pt", pt);
            teleputer.position(digest, pt);
        }
    });

    overlays.bind("click", function(spec) {
        var intersects = spec.tp.extract.get('source').tagsAt(spec.tp.$video.currentTime);
        if(intersects.length > 0){ 
            digest.select(intersects[0]);
            spec.tp.extract = teleputer.extract;
            teleputer.extract = intersects[0];
            teleputer.swapVideos(spec.tp);
            teleputer.setNext(
                digest.extracts[(digest.extracts.indexOf(teleputer.extract) + 1) % digest.extracts.length]);

            // scroll to new position
            document.body.scrollTop = digest.getWidget(intersects[0]).y;

        }
        else {
            console.log("no extract to swap with!"); // XXX:
        }
    });
    overlays.bind("loaded", function(spec) {
        // check that initial state matches teleputer
        if(teleputer.$video.paused) {
            spec.tp.pause();
        }
    });
    digest.bind("flowed", function() {
        // scroll to new position
        if(digest.selected)
            document.body.scrollTop = digest.getWidget(digest.selected).y;
    });

    teleputer.bind("preview", preview);
    overlays.bind("preview", preview);
    teleputer.bind("unpreview", unpreview);
    overlays.bind("unpreview", unpreview);
    teleputer.bind("select", sort);
    overlays.bind("select", sort);


    teleputer.bind("drag", function(spec) {

        var h = Math.min(320, Math.max(220, teleputer.vheight + spec.dy));
        var offset = 320 - h;
        var percentage = offset / 100;
        spec.tp.setHeight(h);
        spec.tp.setVolume(1-percentage);

        // overlays.tpOffset(offset);
    });
    overlays.bind("drag", function(spec) {

        // XXX: MOVE EVERYTHING (?)

        var h = Math.min(196, Math.max(96, spec.tp.vheight - spec.dy));
        spec.tp.setHeight(h);
        spec.tp.setVolume((h - 96) / 100);
    });

    digest.sort(_I_.SORT['tag']);

    document.body.appendChild(_I_.make_credits());

    zoom.setZoom(0.3);
    zoom.trigger(0.3);

    window.addEventListener("resize", function() {
        digest.flow();
        teleputer.position(digest);
    }, false);

});
