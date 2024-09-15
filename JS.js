var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var particles = [];
var imgs = [
    "https://raw.githubusercontent.com/Akejyo/Arknights_partical_animation/main/avatar.jpg",
    "https://raw.githubusercontent.com/Akejyo/imageForBlog/master/xi_gua_ka.jpg",
]
var particleCount = 0;
const blockSize = 10;
const randomRatio = 0.3;
const imgSize = 900
var imgIndex = 0;

var listItems = document.getElementsByClassName("listItem");
for (let i = 0; i < listItems.length; i++) {
    listItems[i].addEventListener('mouseenter', function() {
        if (i !== imgIndex) {
            imgIndex = i;
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgs[i];
            img.width = imgSize;
            img.height = imgSize;
            img.onload = function() {
                convertImageToParticles(img);
            }
        }
    })
}

function convertImageToParticles(img) {
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
    var blockX = Math.ceil(canvas.width / blockSize);
    var blockY = Math.ceil(canvas.height / blockSize);

    var newParticles = [];
    for (var y = 0; y < blockY; y++) {
        for (var x = 0; x < blockX; x++) {
            var sum = 0;
            for (var j = 0; j < blockSize; j++) {
                for (var i = 0; i < blockSize; i++) {
                    var index = ((y * blockSize + j) * canvas.width + x * blockSize + i) * 4;
                    sum += data[index];
                }
            }
            var average = Math.floor(sum / (blockSize * blockSize));
            if (average > 128) {
                newParticles.push(new Particle((x + Math.random() * randomRatio) * 7, (y + Math.random() * randomRatio) * 7));
            }
        }
    }

    for (particle of particles)
        particle.needed = false;
    shuffle(newParticles);
    shuffle(particles);
    for (var i = 0; i < newParticles.length; i++) {
        if (i >= particleCount) {
            particles.push(newParticles[i]);
        } else {
            particles[i].needed = true;
            particles[i].originalX = newParticles[i].originalX;
            particles[i].originalY = newParticles[i].originalY;
        }
    }
    particleCount = newParticles.length;
}

window.onload = function() { //load the first image
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgs[0];
    img.width = imgSize;
    img.height = imgSize;
    img.onload = function() {
        convertImageToParticles(img);
    }
}

var mouseX = null;
var mouseY = null;
var forceRatio = 170;
var dSpeedMax = 3;

function Particle(x, y) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.originalX = x;
    this.originalY = y;
    this.size = 3.5;
    this.speedX = 0;
    this.speedY = 0;
    this.alpha = 1 - Math.random() * randomRatio;
    this.alphaNow = 0;
    this.needed = true; //if the particle is needed in the new image
}

Particle.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
}

Particle.prototype.draw = function() {
    ctx.fillStyle = `rgba(173, 216, 230, ${this.alphaNow + 0.005 > this.alpha ? this.alpha : this.alphaNow += 0.005})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
}

Particle.prototype.disappear = function() {
    ctx.fillStyle = `rgba(173, 216, 230, ${this.alphaNow -= 0.01})`;
    ctx.fillRect(this.x, this.y, this.size, this.size);
}

window.addEventListener('mousemove', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

//img follow mouse
var imgSpeedRatio = 0.7;
var listItems = document.getElementsByClassName("listItem");
var aniId;
var imgX, imgY;
var lastX, laxtY;

function moveImg(img) {
    var rect = img.getBoundingClientRect(); //get the position of the img
    imgX = rect.left + img.width / 2;
    imgY = rect.top + img.height / 2;
    var distanceX = mouseX - imgX;
    var distanceY = mouseY - imgY;
    var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

    var speedX = distanceX / Math.sqrt(distance) * imgSpeedRatio;
    var speedY = distanceY / Math.sqrt(distance) * imgSpeedRatio;

    if (lastX != undefined && lastY != undefined && img.style.opacity == 0) {
        img.style.left = (lastX - img.width / 2) + 'px';
        img.style.top = (lastY - img.height / 2) + 'px';
    } else {
        img.style.left = (imgX + speedX - img.width / 2) + 'px';
        img.style.top = (imgY + speedY - img.height / 2) + 'px';
    }
    aniId = requestAnimationFrame(() => moveImg(img));
}

for (let i = 0; i < listItems.length; i++) {
    listItems[i].addEventListener('mousemove', () => {
        var img = listItems[i].getElementsByTagName('img')[0];
        img.style.opacity = 0.7;
        lastX = mouseX;
        lastY = mouseY;
        if (aniId === undefined) { //init
            for (let j = 0; j < listItems.length; j++) {
                var img = listItems[j].getElementsByTagName('img')[0];
                moveImg(img);
            }
        }
    });
    listItems[i].addEventListener('mouseleave', () => {
        var img = listItems[i].getElementsByTagName('img')[0];
        img.style.opacity = 0;
    });
}

animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (particle of particles) {
        var dToOriginalX = particle.x - particle.originalX;
        var dToOriginalY = particle.y - particle.originalY;
        particle.speedX = -dToOriginalX / 30;
        particle.speedY = -dToOriginalY / 30;
        if (mouseX !== null && mouseY !== null) {
            var dx = particle.x - mouseX + canvas.getBoundingClientRect().left;
            var dy = particle.y - mouseY + canvas.getBoundingClientRect().top;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var force = 1 / distance;
            var dSpeedX = dx / distance * force * forceRatio;
            var dSpeedY = dy / distance * force * forceRatio;
            particle.speedX += dSpeedX;
            particle.speedY += dSpeedY;
            particle.speedX += dSpeedX < 0 ? Math.max(dSpeedX, -dSpeedMax) : Math.min(dSpeedX, dSpeedMax);
            particle.speedY += dSpeedY < 0 ? Math.max(dSpeedY, -dSpeedMax) : Math.min(dSpeedY, dSpeedMax);
        }
        if (particle.needed) {
            particle.update();
            particle.draw();
        } else {
            particle.speedX = 0;
            particle.speedY = 0;
            particle.disappear();
            if (particle.alphaNow <= 0) {
                particles.splice(particles.indexOf(particle), 1);
            }
        }
    }

    requestAnimationFrame(animateParticles);
}


animateParticles();

function shuffle(arr) {
    var currentIndex = arr.length,
        randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}
