//==================================//
//              Variables           //
//==================================//


var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")

var canvasCircle = document.getElementById("canvasCircle")
var ctxCircle = canvasCircle.getContext("2d")

var width = canvas.width
var height = canvas.height

window.addEventListener('resize',
    function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvasCircle.width = window.innerWidth;
        canvasCircle.height = window.innerHeight;

        width = window.innerWidth;
        height = window.innerHeight;
    })


var flocksArray

var p = {
    align: 0.5,
    cohesion: 0.5,
    avoidance: 0.5,
    maxSpeed: 3,
    maxForce: 0.5,
    perceptionRadius: 100,
    flockNb: 400,
    showTail: true,
    color: 'rgb(255,255,255)',
    flockSize: 2.5
};

function randomRange(min, max, except) {
    var r = Math.floor(Math.random() * (max - min + 1) + min)
    return (r === except) ? randomRange(min, max) : r;
}



//==================================//
//              DAT GUI             //
//==================================//

var gui = new dat.GUI();
const parametersFolder = gui.addFolder("Parameters")
const rulesFolder = gui.addFolder("Reynolds Rules")
const AestheticFolder = gui.addFolder("Aesthetic")


parametersFolder.add(p, 'maxSpeed', 2, 6).name("Max Speed")
parametersFolder.add(p, 'maxForce', .05, 1).name("Max Force")
parametersFolder.add(p, 'perceptionRadius', 1, 300).name("Perception Radius")
parametersFolder.add(p, 'flockNb', 1, 2000).name("Flock Number").onChange(function() {
    init()
})


rulesFolder.add(p, 'align', 0, 1).name("Alignement")
rulesFolder.add(p, 'cohesion', 0, 1).name("Cohesion")
rulesFolder.add(p, 'avoidance', 0, 1).name("Avoidance")

AestheticFolder.add(p, "showTail").name("Show Tail")
AestheticFolder.addColor(p, "color").name("Color")
AestheticFolder.add(p, "flockSize", 1, 10).name("Flocks Size")


gui.__folders["Parameters"].open()
gui.__folders["Reynolds Rules"].open()
gui.__folders["Aesthetic"].open()


var stats;

$(document).ready(function() {
    init();
    animate();
});

//==================================//
//              SETUP               //
//==================================//

function init() {
    setupStats();
    setupCanvas();
    setupFlocks();



}

function setupStats() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.left = '0px';
    stats.domElement.style.zIndex = '2';
    document.body.appendChild(stats.domElement);
}

function setupCanvas() {

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width
    canvas.height = height;

    canvasCircle.width = width
    canvasCircle.height = height;
}

function setupFlocks() {
    flocksArray = []

    for (let index = 0; index < p.flockNb; index++) {
        var x = Math.random() * width
        var y = Math.random() * height
        flocksArray[index] = new Flock(x, y);
    }
}

function animate() {
    if (!p.showTail)
        ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(20,20, 20, 0.1)'
    ctx.fillRect(0, 0, width, height)

    flocksArray.forEach(flock => {
        flock.show()
        flock.calculateMove(flocksArray)
        flock.update()
    });


    drawPerceptioRadius()
    requestAnimationFrame(animate);
    stats.update();
}

function drawPerceptioRadius() {
    ctxCircle.clearRect(0, 0, width, height)
    ctxCircle.beginPath()
    ctxCircle.arc(flocksArray[0].position.x, flocksArray[0].position.y, p.perceptionRadius, 0, 2 * Math.PI)
    ctxCircle.strokeStyle = "#aaa"
    ctxCircle.strokeWidth = 2
    ctxCircle.stroke()
    ctxCircle.closePath();
}


//==================================//
//              CLASS               //
//==================================//

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    };

    add(otherVector) {
        this.x = this.x + otherVector.x
        this.y = this.y + otherVector.y
    }
    div(n) {
        this.x /= n;
        this.y /= n;
        return this;
    }
    sub(otherVector) {
        this.x = this.x - otherVector.x
        this.y = this.y - otherVector.y
        return this;
    }
    magSq() {
        var x = this.x;
        var y = this.y;
        return x * x + y * y;
    }
    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    limit(l) {
        var mSq = this.magSq();
        if (mSq > l * l) {
            this.div(Math.sqrt(mSq));
            this.mult(l);
        }
        return this;
    }

    mag() {
        return Math.sqrt(this.magSq());

    }
    normalize() {
        return this.div(this.mag());
    }

    setMag(n) {
        return this.normalize().mult(n);
    }



}


class Flock {
    constructor(_x, _y) {
        this.position = new Vector(_x, _y)
        this.velocity = new Vector(Math.random() - 0.5, Math.random() - 0.5)
        this.acceleration = new Vector(0, 0)
        this.nearFlocks = []
    }

    update() {
        this.velocity.add(this.acceleration)
        this.velocity.limit(p.maxSpeed)

        this.position.add(this.velocity)
        this.acceleration.set(0, 0)
        if (this.position.x < 0)
            this.position.x = width
        else if (this.position.x > width)
            this.position.x = 0

        if (this.position.y < 0)
            this.position.y = height
        else if (this.position.y > height)
            this.position.y = 0

    }

    align() {
        var desired = new Vector(0, 0)
        var total = 0
        for (let flock of this.nearFlocks) {
            desired.add(flock.velocity)
            total++
        };
        if (total > 0) {
            desired.div(total)
            desired.setMag(p.maxSpeed)
            desired.sub(this.velocity)
            desired.limit(p.maxForce)
        }
        return desired;
    }
    cohesion() {
        var desired = new Vector(0, 0)
        var total = 0
        for (let flock of this.nearFlocks) {
            let distance = dist(this.position, flock.position);

            desired.add(flock.position)
            total++
        };
        if (total > 0) {
            desired.div(total)
            desired.sub(this.position)
            desired.setMag(p.maxSpeed)
            desired.sub(this.velocity)
            desired.limit(p.maxForce)
        }
        return desired;
    }
    avoidance() {
        var desired = new Vector(0, 0)
        var total = 0
        for (let flock of this.nearFlocks) {
            let distance = dist(this.position, flock.position);
            let diff = new Vector(this.position.x - flock.position.x,
                this.position.y - flock.position.y
            )
            diff.div(Math.pow(distance, 2))
            desired.add(diff)
            total++
        };
        if (total > 0) {
            desired.div(total)
            desired.setMag(p.maxSpeed)
            desired.sub(this.velocity)
            desired.limit(p.maxForce)
        }
        return desired;
    }
    getNearFlocks(flocks) {
        this.nearFlocks = []
        for (let flock of flocks) {
            let distance = dist(this.position, flock.position);
            if (flock != this && (distance < p.perceptionRadius)) {
                this.nearFlocks.push(flock)
            }
        }
    }

    calculateMove(flocks) {
        this.getNearFlocks(flocks)
        let alignment = this.align().mult(p.align)
        let cohesion = this.cohesion().mult(p.cohesion)
        let avoidance = this.avoidance().mult(p.avoidance)

        this.acceleration.add(alignment)
        this.acceleration.add(cohesion)
        this.acceleration.add(avoidance)
    }


    show() {
        ctx.beginPath()
        ctx.arc(this.position.x, this.position.y, p.flockSize, 0, 2 * Math.PI)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.closePath();
    }
}




function dist(pos1, pos2) {
    var a = pos1.x - pos2.x;
    var b = pos1.y - pos2.y;

    return Math.sqrt(a * a + b * b);
}