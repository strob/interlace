(function(_I_) {

    var DEFAULTS = {
        nsteps: 10,
        width: 20,
        height: 152,
        percentage: 0.5
    };
        
    _I_.UI.Zoom = function(spec) {
        _I_.UI.Draggable.call(this, "canvas");
         _I_.UTIL.classListAdd(this.$el,'zoom');

        for(var k in DEFAULTS) {
            this[k] = (spec && spec[k]) || DEFAULTS[k];
        }
        this.$el.style.width = this.width;
        this.$el.style.height = this.height;

        var that = this;

        this.bind("zoom", function(percentage) {
            that.redraw(percentage);
        });
        this.setZoom(this.percentage);
    };
    _I_.UI.Zoom.prototype = new _I_.UI.Draggable;
    _I_.UI.Zoom.prototype.onclick = function(x,y) {
        var percentage;
        if(y<this.width) {
            // +
            percentage = Math.min(1, this.percentage + 1/this.nsteps);
        }
        else if(y>this.height-this.width) {
            // -
            percentage = Math.max(0, this.percentage - 1/this.nsteps);
        }
        else {
            percentage = (y-this.width) / (this.$el.clientHeight-2*this.width);
	    percentage = 1-Math.min(1, Math.max(0, percentage));
        }
        this.setZoom(percentage);
    };
    _I_.UI.Zoom.prototype.ondrag = function(x,y,px,py) {
        y = y-this.$el.offsetTop;

        percentage = (y-this.width) / (this.$el.clientHeight-2*this.width);
        this.percentage = 1-Math.min(1, Math.max(0, percentage));
        this.redraw();
    };
    _I_.UI.Zoom.prototype.onup = function() {
        this.setZoom(this.percentage);
    };
    _I_.UI.Zoom.prototype.setZoom = function(percentage) {
        this.percentage = percentage;
        this.trigger("zoom", percentage);
    };
    _I_.UI.Zoom.prototype.redraw = function() {
        var heavy = 5;

        this.$el.setAttribute('width', this.width);
        this.$el.setAttribute('height', this.height);
        var ctx = this.$el.getContext('2d');
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";

        // top & bottom boxes
        ctx.fillRect(0,0,this.width,this.width);
        ctx.strokeRect(0,0,this.width,this.width);
        ctx.fillRect(0,this.height-this.width,this.width,this.width);
        ctx.strokeRect(0,this.height-this.width,this.width,this.width);

        // accent
        ctx.fillStyle= "black";
        ctx.fillRect(0,this.width,this.width,heavy);
        ctx.fillRect(0,this.height-this.width-heavy,this.width,heavy);

        // line
        ctx.fillStyle= "white";
        ctx.fillRect(this.width/2 - heavy/2, this.width-heavy, heavy, this.height-2*this.width + 2*heavy);

        // lines around the line
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.width/2 - heavy/2, this.width-heavy/2);
        ctx.lineTo(this.width/2 - heavy/2, this.height-this.width+heavy/2);
        ctx.moveTo(this.width/2 + heavy/2, this.width-heavy/2);
        ctx.lineTo(this.width/2 + heavy/2, this.height-this.width+heavy/2);
        ctx.stroke();
        // edges

        // + / -
        ctx.strokeStyle= "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width/4, this.width/2);
        ctx.lineTo(3*this.width/4, this.width/2);
        ctx.moveTo(this.width/2, this.width/4);
        ctx.lineTo(this.width/2, 3*this.width/4);

        ctx.moveTo(this.width/4,this.height-this.width/2);
        ctx.lineTo(3*this.width/4,this.height-this.width/2);
        ctx.stroke();

        // percent
        var y = this.width + heavy/2 + (1-this.percentage)*(this.height-2*this.width-3*heavy);
        ctx.fillStyle= "white";
        ctx.lineWidth = 2;
        ctx.fillRect(0, y, this.width, heavy*2);
        ctx.strokeRect(0, y, this.width, heavy*2);
    };

})(_I_);
