_I_.TWO = {};

_I_.TWO.window = window.open("", "MONTAGE INTERDIT", "location=no,menubar=no,resizable=no,scrollbars=no,titlebar=no,status=no,toolbar=no,width=640,height=480");

_I_.TWO.window.document.body.innerHTML = "";

// _I_.TWO.window.onload = function() {

_I_.TWO.$canvas = _I_.TWO.window.document.createElement('canvas');
_I_.TWO.$canvas.setAttribute('width', 640);
_I_.TWO.$canvas.setAttribute('height', 480);
_I_.TWO.$canvas.style.width = "100%";
// _I_.TWO.$canvas.style.height = "100%";

_I_.TWO.$subs = _I_.TWO.window.document.createElement('div');
_I_.TWO.$subs.style.position = "absolute";
_I_.TWO.$subs.style.bottom = 30;
_I_.TWO.$subs.style.left = 30;
_I_.TWO.$subs.style.width = "80%";
_I_.TWO.$subs.style.fontFamily = "Arial, Helvetica, sans-serif";
_I_.TWO.$subs.style.textAlign = "left";
_I_.TWO.$subs.style.fontSize = "200%";
_I_.TWO.$subs.style.color = "white";
_I_.TWO.$subs.style.textShadow = "black 0.1em 0.1em 0.2em";

_I_.TWO.window.document.body.appendChild(_I_.TWO.$canvas);
_I_.TWO.window.document.body.appendChild(_I_.TWO.$subs);
_I_.TWO.window.document.body.style.margin=0;
var ctx = _I_.TWO.$canvas.getContext('2d');

ctx.fillStyle = "black";
function attach_to_teleputer() {
    if(teleputer !== undefined) {
        (function(ctx) {
            teleputer.bind("tick", function(spec) {
                _I_.TWO.$subs.innerHTML = spec.sub;

                var w = 640,
                h = 640 * teleputer.$video.offsetHeight / teleputer.$video.offsetWidth,
                y = (480 - h) / 2;

                ctx.drawImage(teleputer.$video,
                              0, y, w, h);
            });
            digest.bind("selected", function() {
                ctx.fillRect(0,0,640,480);
            });
        })(ctx);
    }
    else {
        window.setTimeout(attach_to_teleputer, 200)
    }
}
attach_to_teleputer();

// };
