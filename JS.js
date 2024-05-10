var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var particles = [];

var img = new Image();
const resolution = 15;
const randomRatio = 0.3;
img.crossOrigin = "anonymous";
img.src = "https://raw.githubusercontent.com/Akejyo/imageForBlog/master/img/shan.jpg";

img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
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
                    sum += data[index];
                }
            }
            var average = Math.floor(sum / (resolution * resolution));
            if (average > 128) {
                particles.push(new Particles((x + Math.random() * randomRatio) * 7, (y + Math.random() * randomRatio) * 7));
            }
        }
    }
}

var mouseX = null;
var mouseY = null;
var forceRatio = 300;

function Particles(x, y) {
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;
    this.targetX = x;
    this.targetY = y;
    this.size = 3.5;
    this.speedX = 0;
    this.speedY = 0;
    this.alpha = 1 - Math.random() * randomRatio;
}

Particles.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
}

Particles.prototype.draw = function() {
    ctx.fillStyle = `rgba(173, 216, 230, ${this.alpha})`;
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
            var dToOriginalX = particle.x - particle.originalX;
            var dToOriginalY = particle.y - particle.originalY;
            particle.speedX = -dToOriginalX / 20;
            particle.speedY = -dToOriginalY / 20;

            var dx = particle.x - mouseX;
            var dy = particle.y - mouseY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var force = 1 / distance;
            force = Math.min(force, 5);

            particle.speedX += dx / distance * force * forceRatio;
            particle.speedY += dy / distance * force * forceRatio;
            particle.speedX = Math.min(particle.speedX, 5);
            particle.speedY = Math.min(particle.speedY, 5);
        }
        particle.update();
        particle.draw();
    }

    requestAnimationFrame(animateParticles);
}

animateParticles();