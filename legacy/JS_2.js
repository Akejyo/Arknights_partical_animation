//这是个抽象的实现，虽然没有达成目的但是挺帅的（雾

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var particles = [];

var img = new Image();
const resolution = 15;
img.crossOrigin = "anonymous";
img.src = "https://raw.githubusercontent.com/Akejyo/imageForBlog/master/img/shan.jpg";

img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var blockX = Math.ceil(canvas.width / resolution);
    var blockY = Math.ceil(canvas.height / resolution);
    for (var y = 0; y < blockY; y++) {
        for (var x = 0; x < blockX; x++) {
            var sum = 0;
            for (var j = 0; j < resolution; j++) {
                for (var i = 0; i < resolution; i++) {
                    var index = ((y * resolution + j) * canvas.width + x * resolution + i) * 4;
                    sum += data[index]; // use red channel as grayscale value
                }
            }
            var average = Math.floor(sum / (resolution * resolution));
            if (average > 128) {
                particles.push(new Particles(x * 10, y * 10));
            }
        }
    }
}

var mouseX = null;
var mouseY = null;

function Particles(x, y) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.size = 5;
    this.speedX = 0;
    this.speedY = 0;
}

Particles.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
}

Particles.prototype.draw = function() {
    ctx.fillStyle = 'rgba(173, 216, 230, 1)';
    ctx.strokeStyle = 'rgba(173, 216, 230, 0.8)';
    ctx.lineWidth = 2;
    ctx.fillRect(this.x, this.y, this.size, this.size);
}

canvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (particle of particles) {
        if (mouseX !== null && mouseY !== null) {
            var dToMouseX = particle.x - mouseX;
            var dToMouseY = particle.y - mouseY;
            var dToMouse = Math.sqrt(dToMouseX * dToMouseX + dToMouseY * dToMouseY);
            //dToMouse = Math.max(dToMouse, 0.7);
            if (dToMouse !== 0) {
                //var gravityMouse = 1 / (dToMouse * dToMouse);
                var gravityMouse = 5 / dToMouse;
                particle.speedX += dToMouseX / dToMouse * gravityMouse;
                particle.speedY += dToMouseY / dToMouse * gravityMouse;
            }
            // var dToOriginalX = particle.x - particle.originalX;
            // var dToOriginalY = particle.y - particle.originalY;
            // var dToOriginal = Math.sqrt(dToOriginalX * dToOriginalX + dToOriginalY * dToOriginalY);
            // if (dToOriginal !== 0) {
            //     //var gravityOriginal = Math.min(0.0005, 1 / (dToOriginal * dToOriginal));
            //     var gravityOriginal = 5 / dToOriginal;
            //     particle.speedX -= dToOriginalX / dToOriginal * gravityOriginal;
            //     particle.speedY -= dToOriginalY / dToOriginal * gravityOriginal;
            // }

        }
        particle.update();
        particle.draw();

    }

    requestAnimationFrame(animateParticles);
}

animateParticles();