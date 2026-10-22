var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var particles = [];
var imgs = "asserts/sami.webp";

var particleCount = 0;
const blockSize = 8;
const randomRatio = 0.3;
const imgSize = 500;
var imgIndex = 0;

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
          var index =
            ((y * blockSize + j) * canvas.width + x * blockSize + i) * 4;
          sum += data[index];
        }
      }
      var average = Math.floor(sum / (blockSize * blockSize));
      var alpha = average / 255;
      alpha = Math.pow(alpha, 1.8);
      var alphaThreshold = 0.08;

      if (alpha > alphaThreshold) {
        var p = new Particle(
          (x + Math.random() * randomRatio) * 7,
          (y + Math.random() * randomRatio) * 7,
        );
        p.alpha = alpha;
        newParticles.push(p);
      }
    }
  }

  for (particle of particles) particle.needed = false;
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

window.onload = function () {
  //load the first image
  var img = new Image();
  img.src = imgs;
  img.width = imgSize;
  img.height = imgSize;
  img.crossOrigin = "anonymous";
  img.onload = function () {
    convertImageToParticles(img);
  };
  loadingElement.parentNode.removeChild(loadingElement);
};

var mouseX = null;
var mouseY = null;
var forceRatio = 170;
var dSpeedMax = 3;

function Particle(x, y) {
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height;
  this.originalX = x;
  this.originalY = y;
  this.size = 4.5;
  this.speedX = 0;
  this.speedY = 0;
  this.alpha = 1;
  this.alphaNow = 0;
  this.needed = true; //if the particle is needed in the new image
}

Particle.prototype.update = function () {
  this.x += this.speedX;
  this.y += this.speedY;
};

Particle.prototype.draw = function () {
  ctx.fillStyle = `rgba(173, 216, 230, ${this.alphaNow + 0.005 > this.alpha ? this.alpha : (this.alphaNow += 0.005)})`;
  ctx.fillRect(this.x, this.y, this.size, this.size);
};

Particle.prototype.disappear = function () {
  ctx.fillStyle = `rgba(173, 216, 230, ${(this.alphaNow -= 0.01)})`;
  ctx.fillRect(this.x, this.y, this.size, this.size);
};

window.addEventListener("mousemove", function (e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

//img follow mouse
var imgSpeedRatio = 0.7;
var listItems = document.getElementsByClassName("listItem");
var aniId;
var imgX, imgY;
var lastX, laxtY;
var lastTime = performance.now();
animateParticles = (now) => {
  var dt = (now - lastTime) / (1000 / 165);
  lastTime = now;
  if (dt > 3) dt = 3;
  var rect = canvas.getBoundingClientRect();
  var canvasLeft = rect.left;
  var canvasTop = rect.top;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = particles.length - 1; i >= 0; i--) {
    var particle = particles[i];
    var dToOriginalX = particle.x - particle.originalX;
    var dToOriginalY = particle.y - particle.originalY;
    particle.speedX = (-dToOriginalX / 30) * dt;
    particle.speedY = (-dToOriginalY / 30) * dt;
    if (mouseX !== null && mouseY !== null) {
      var dx = particle.x - mouseX + canvasLeft;
      var dy = particle.y - mouseY + canvasTop;
      var distance = Math.sqrt(dx * dx + dy * dy);
      var force = 1 / distance;
      var dSpeedX = (dx / distance) * force * forceRatio;
      var dSpeedY = (dy / distance) * force * forceRatio;
      var addX =
        dSpeedX +
        (dSpeedX < 0
          ? Math.max(dSpeedX, -dSpeedMax)
          : Math.min(dSpeedX, dSpeedMax));
      var addY =
        dSpeedY +
        (dSpeedY < 0
          ? Math.max(dSpeedY, -dSpeedMax)
          : Math.min(dSpeedY, dSpeedMax));
      particle.speedX += addX * dt;
      particle.speedY += addY * dt;
    }
    if (particle.needed) {
      particle.update();
      particle.draw(dt);
    } else {
      particle.speedX = 0;
      particle.speedY = 0;
      particle.disappear(dt);
      if (particle.alphaNow <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  requestAnimationFrame(animateParticles);
};

requestAnimationFrame(animateParticles);

function shuffle(arr) {
  var currentIndex = arr.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }
  return arr;
}
