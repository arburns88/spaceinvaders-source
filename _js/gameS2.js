// Built off of the code from last semester CS Principles 2021
// theres a lot of stuff thats commented out bcuz im not using it so sorry if its hard to read comments

/*      TO DO LIST
    # fix continued movement after death if key was down
    # multiple inputs capabilities
    * reset enemies on death
    - random asteroid spawn as score increases
    - increasing enemy health
    ? semi auto (shoot as fast as you can click)
    ? power ups
    ? all enemies shoot || stronger enemy that shoots
#bug    *important mechanics    -planned mechanics    ?potential features
*/

// global variables
let canvas;
let ctx;
let TILESIZE = 64;
let WIDTH = TILESIZE * 22;
let HEIGHT = TILESIZE * 13;
let score = 0;
let lives = 3;
let delayShoot = 500;
let delayShield = 5000;
let timerShield = 2000;
let bossFireDelayVar = 50;

// booleans
let showStats = false;
let frBuffNotif = false;
let mvmtNerfNotif = false;

// arrays
let allSprites = [];
let allEnemies = [];
let walls = [];
let enemies = [];
let bosses = [];
let megaBosses = [];
let goodProjectiles = [];
let badProjectiles = [];
let veryBadProjectiles = [];
let players = [];
let shields = [];

// images
// background image from https://hdwallpaperim.com/space-pixel-art-horizon-stars/
let background = new Image();
background.src = "./_images/background.jpg"
// player image from http://pixelartmaker.com/art/d9c710d4c7e1ae6
let playerImage = new Image();
playerImage.src = "./_images/player3.png"
let playerActive = new Image();
playerActive.src = "./_images/player3.png"
// photoshop edit of player image
let playerDamaged = new Image();
playerDamaged.src = "_images/player3damaged.png";
// left this black to blend in with the background and make the game look windowed
let blockImage = new Image();
blockImage.src = "./_images/black.jpg"
// the image you gave us for the game last year
let pewImage = new Image();
pewImage.src = "./_images/pew.png"
// the same image as above except rotated 180*
let badPewImage = new Image();
badPewImage.src = "./_images/lazer.png"
// enemy image used from https://williamrobinson.artstation.com/projects/ARKZX
let enemyImage = new Image();
enemyImage.src = "./_images/minion.gif"
// boss image used from https://williamrobinson.artstation.com/projects/ARKZX
let bossImage = new Image();
bossImage.src = "./_images/boss.gif"
// mega boss image used from https://williamrobinson.artstation.com/projects/ARKZX
let megaBossImage = new Image();
megaBossImage.src = "./_images/megaBoss.gif"
// not gonna link anything cuz this will change
let shieldImage = new Image();
shieldImage.src = "./_images/shield.png"

// map design
let gamePlan = `
#....................#
#..@..@..@..@..@..@..#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
######################`;

// arrays for user inputs
let keysDown = {};
let keysUp = {};

// gets user inputs from keyboard
addEventListener("keydown", function (event) {
    keysDown[event.key] = true;
    // console.log(event);
}, false);

addEventListener("keyup", function (event) {
    keysUp[event.key] = true;
    delete keysDown[event.key];
    // console.log(event);
}, false);

// drawtext function which allows me to place text anywhere on the screen and customize it
function drawText(r, g, b, a, font, align, base, text, x, y) {
    ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.fillText(text, x, y);
}

// setup the canvas and context
// this function will be called in the HTML document in body onload = ""
// we also append the body with a new canvas element
function init() {
    canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
    gameLoop();
}

// sprite class that all other sprites will build off of
class Sprite {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.spliced = false;
        allSprites.push(this);
    }
    // getters that get the position of the sprite. useful for debugging
    get cx() {
        return this.x + this.w * 0.5;
    }
    get cy() {
        return this.y + this.h * 0.5;
    }
    get left() {
        return this.x
    }
    get right() {
        return this.x + this.w
    }
    get top() {
        return this.y
    }
    get midtop() {
        return this.y + this.w * 0.5;
    }
    get bottom() {
        return this.y + this.h
    }
    get midbottom() {
        return (this.y + this.h) + this.w * 0.5
    }
    get type() {
        return "sprite";
    }

    create(x, y, w, h, color) {
        return new Sprite(x, y, w, h, color);
    }
    // if statement that returns true when the current object collides with the specified object
    collideWith(obj, buffer) {
        if (this.right >= obj.left + buffer &&
            this.left <= obj.right - buffer &&
            this.bottom >= obj.top + buffer &&
            this.top <= obj.bottom - buffer
        ) {
            return true;
        }
    }
    // draws the sprite
    // modified from https://github.com/pothonprogramming/pothonprogramming.github.io/blob/master/content/rectangle-collision/rectangle-collision.html
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    };
}

// main character sprite. has a lot of attributes that are not currently used
class Player extends Sprite {
    constructor(x, y, speed, w, h, color, hitpoints) {
        super(x, y, w, h, color);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.dx = 0;
        this.dy = 0;
        this.speed = speed;
        this.w = w;
        this.h = h;
        this.gravity = 0;
        this.coFriction = 0.1;
        this.color = color;
        this.hitpoints = hitpoints;
        // booleans used for cooldowns
        this.damaged = false;
        this.canShield = true;
        this.shielded = false;
        this.canShoot = true;
    }
    // function to create a bullet when player shoots
    pewpew() {
        let p = new PewPew(this.x + this.w * 0.333, this.y, TILESIZE / 4, TILESIZE / 4);
    }
    // function that creates a shield *finally works
    shield() {
        let s = new Shield(this.x + this.w - 95, this.y - 40, TILESIZE, TILESIZE / 2);
    }
    get type() {
        return "player";
    }
    input() {
        // checks for user input and does what is specified
        // moves left
        if ("a" in keysDown && !gameOver) {
            this.vx = -this.speed;
        }
        // moves right
        else if ("d" in keysDown && !gameOver) {
            this.vx = this.speed;
        }
        // cheat button that sets all delays to 1 so you can infinitely shoot and shield
        else if ("{" in keysDown && !gameOver) {
            delayShoot = 1;
            delayShield = 1;
        }
        // shoots
        else if ("w" in keysDown && !gameOver) {
            if (this.canShoot && !this.shielded) {
                this.pewpew();
                this.canShoot = false;
                setTimeout(() => this.canShoot = true, delayShoot);
            }
        }
        // deploys shield
        else if ("s" in keysDown && !gameOver) {
            if (this.canShield) {
                if (shields.length < 1) {
                    this.shield();
                    this.canShield = false;
                    this.shielded = true;
                    // timeouts for deploying shield again
                    setTimeout(() => this.shielded = false, timerShield);
                    setTimeout(() => this.canShield = true, delayShield);
                }
            }
        }
        // toggles the more info stats for debugging
        else if ("x" in keysDown && !gameOver) {
            if (showStats == true) {
                setTimeout(() => showStats = false, 100);
            } else if (showStats == false) {
                setTimeout(() => showStats = true, 100);
            }
        }
        // tool for testing events at certain scores
        else if ("*" in keysDown && !gameOver){
            scored(1);
        }
        else if ("&" in keysDown && !gameOver){
            bossesKilled += 1;
        }
    }
    // friction funciton that makes movement more fluid
    frictionX() {
        if (this.vx > 0.5) {
            this.vx -= this.coFriction;
        } else if (this.vx < -0.5) {
            this.vx += this.coFriction;
        } else {
            this.vx = 0;
        }
    }
    draw() {
        ctx.drawImage(playerActive, 0, 0, 1028, 1028, this.x, this.y, 72, 72);
    }
    update() {
        this.vy += this.gravity;
        this.input();
        this.frictionX();
        this.x += this.vx;
        this.y += this.vy;
        // collision
        for (i of allSprites) {
            if (i.type == "wall") {
                if (this.collideWith(i, 1)) {
                    let diff = Math.abs(this.cx - i.cx);
                    if (diff <= 32) {
                        this.y = i.top - this.h;
                        this.vy = 0
                    }
                    if (this.cy > i.cy) {
                        if (this.vx > 0) {
                            this.x = i.left - this.w;
                        } else if (this.vx < 0) {
                            this.x = i.right
                        }
                    }
                }
            }
        }
        // speed and collision checker
        if (this.x + this.w > (WIDTH - 64)) {
            this.x = (WIDTH - 64) - this.w;
        }
        if (this.x <= 65) {
            this.x = 65;
        }
        if (this.y + this.h > HEIGHT) {
            this.y = HEIGHT - this.h;
        }
        if (this.y <= 0) {
            this.y = 0;
        }
    }
}

class Enemy extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.vx = 1;
        this.vy - 0;
        this.w = w;
        this.h = h;
        this.damaged = false;
        this.dropped = false;
        // slowly increases enemy movement speed based on score
        this.speed = mvmtScore();
        this.color = "blue";
        enemies.push(this);
        allEnemies.push(this);
    }

    create(x, y, w, h) {
        return new Enemy(x, y, w, h);
    }
    get type() {
        return "enemy";
    }

    draw() {
        ctx.drawImage(enemyImage, 0, 0, 400, 400, this.x, this.y, TILESIZE, TILESIZE);
    }

    update() {
        this.x += this.vx * this.speed;
        for (i of allSprites) {
            if (i.type == "wall") {
                if (this.collideWith(i, 1)) {
                    if (this.cx < i.cx) {
                        if (!this.dropped) {
                            this.speed = (-mvmtScore());
                            this.y += TILESIZE * 2;
                            this.dropped = true;
                            setTimeout(() => this.dropped = false, 10);
                        }
                    }
                    else {
                        if (!this.dropped) {
                            this.speed = mvmtScore();
                            this.y += TILESIZE * 2;
                            this.dropped = true;
                            setTimeout(() => this.dropped = false, 10);
                        }
                    }
                }
            }
        }
    }
}

// boss class that I used from the enemy class and modified
class Boss extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.vx = 1;
        this.vy - 0;
        this.w = TILESIZE * 4;
        this.h = TILESIZE * 4;
        this.speed = 2;
        this.canShoot = true;
        this.damaged = false;
        this.color = "blue";
        this.health = 25;
        bosses.push(this);
        allEnemies.push(this);
    }
    badpewpew() {
        let p = new BadPewPew(this.x + this.w * 0.12, this.y + 170, TILESIZE / 4, TILESIZE / 4);
        let p2 = new BadPewPew(this.x + this.w * 0.79, this.y + 170, TILESIZE / 4, TILESIZE / 4);
    }
    create(x, y, w, h) {
        return new Boss(x, y, w, h);
    }
    get type() {
        return "boss";
    }

    draw() {
        ctx.drawImage(bossImage, 0, 0, 400, 400, this.x, this.y, TILESIZE * 4, TILESIZE * 4);
    }
    // input(){
    //     if ("l" in keysDown){
    //         this.badpewpew();
    //     }
    // }
    update() {
        // console.log ("the boss is at:" + this.x, this.y)
        // console.log("height:" + this.h);
        // this.input();
        if (this.canShoot) {
            this.badpewpew();
            this.canShoot = false;
            // set the shoot cooldown to its health that way it shoots faster the less health it has
            setTimeout(() => this.canShoot = true, bossFireDelayVar * 40);
        }
        // console.log(this.isShooting);
        this.x += this.vx * this.speed;
        // this.rotate();
        for (i of allSprites) {
            if (i.type == "wall") {
                if (this.collideWith(i, 1)) {
                    if (this.cx < i.cx) {
                        this.speed = -2;
                    } else {
                        this.speed = 2;
                    }
                }
            }
        }

    }
}

class megaBoss extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.vx = 1;
        this.vy - 0;
        this.w = TILESIZE * 5;
        this.h = TILESIZE * 5;
        this.speed = 2;
        this.canShoot = true;
        this.damaged = false;
        this.color = "blue";
        this.health = 60;
        this.goLeft = false;
        this.goRight = true;
        megaBosses.push(this);
        allEnemies.push(this);
    }
    verybadpewpew() {
        let p = new veryBadPewPew(this.x + this.w * 0.6, this.y + 200, TILESIZE, TILESIZE);
    }
    create(x, y, w, h) {
        return new megaBoss(x, y, w, h);
    }
    get type() {
        return "megaBoss";
    }

    draw() {
        ctx.drawImage(megaBossImage, 0, 0, 512, 512, this.x, this.y, TILESIZE * 5, TILESIZE * 5);
    }
    // input(){
    //     if ("l" in keysDown){
    //         this.badpewpew();
    //     }
    // }
    update() {
        // console.log ("the boss is at:" + this.x, this.y)
        // console.log("height:" + this.h);
        // this.input();
        if (this.canShoot) {
            this.verybadpewpew();
            this.canShoot = false;
            // set the shoot cooldown to its health that way it shoots faster the less health it has
            setTimeout(() => this.canShoot = true, bossFireDelayVar * 40);
        }
        // console.log(this.isShooting);
        this.x += this.vx * this.speed;
        for (i of allSprites){
            if (this.goLeft){
                this.speed = -1;
                this.goLeft = false;
                // allows the mega boss to randomly change directions
                setTimeout(() => this.goRight = true, randNumb(5000, 3000));
            }
            // changeright
            if (this.goRight){
                this.speed = 1;
                this.goRight = false;
                setTimeout(() => this.goLeft = true, randNumb(5000, 3000));
            }
            if (i.type == "wall") {
                if (this.collideWith(i, 1)) {
                    if (this.cx < i.cx) {
                        this.goLeft = true;
                    } else {
                        this.goRight = true;
                    }
                }
            }
        }
        // console.log(this.goLeft);
        // console.log(this.goRight);
    }
}


// copy of badpewpew that behaves like an enemy
class veryBadPewPew extends Enemy {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = "red";
        veryBadProjectiles.push(this);
        badProjectiles.push(this);
        allEnemies.push(this);
        // console.log('a verybadpewpew was created...');
        // console.log(veryBadProjectiles);
    }
    update() {
        this.y += 2;
        // console.log("bullet is moving" + this.y)
    }
    draw() {
        ctx.drawImage(enemyImage, 0, 0, 400, 400, this.x, this.y, TILESIZE, TILESIZE);
    }
}

class Wall extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = "red";
    }
    get type() {
        return "wall";
    }
    create(x, y, w, h) {
        return new Wall(x, y, w, h);
    }
    draw() {
        ctx.drawImage(blockImage, 0, 0, 279, 285, this.x, this.y, TILESIZE, TILESIZE);
    }
}

class PewPew extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = "red";
        goodProjectiles.push(this);
        // console.log('a pewpew was created...');
        // console.log(goodProjectiles);
    }

    update() {
        this.y -= 10;
        // console.log("bullet is moving" + this.y)
    }
    draw() {
        ctx.drawImage(pewImage, 0, 0, TILESIZE / 2, TILESIZE / 2, this.x, this.y, TILESIZE, TILESIZE);
    }
}
// copy of pewpew that literally just goes down instead of up for the bosses shooting
class BadPewPew extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = "red";
        badProjectiles.push(this);
        allEnemies.push(this);
        // console.log('a badpewpew was created...');
        // console.log(badProjectiles);
    }
    update() {
        this.y += 5;
        // console.log("bullet is moving" + this.y)
    }
    draw() {
        ctx.drawImage(pewImage, 0, 0, TILESIZE / 2, TILESIZE, this.x, this.y, TILESIZE, TILESIZE);
    }
}

// wip doesnt work yet
class Shield extends Sprite {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.x = x;
        this.y = y;
        this.w = TILESIZE * 2;
        this.h = TILESIZE / 4;
        shields.push(this);
    }
    update() {
        this.x = player1.x - 32;
    }
    draw() {
        ctx.drawImage(shieldImage, 0, 0, 2600, 500, this.x, this.y, TILESIZE * 2, TILESIZE / 4);
    }
}


const levelChars = {
    ".": "empty",
    "#": Wall,
    "@": Enemy,
    "B": Boss,
    "M": megaBoss,
};

// makes the grid based on what we define it as at the top
function makeGrid(plan, width) {
    let newGrid = [];
    let newRow = [];
    for (i of plan) {
        if (i != "\n") {
            newRow.push(i);
        }
        if (newRow.length % width == 0 && newRow.length != 0) {
            newGrid.push(newRow);
            newRow = [];
        }
    }
    return newGrid;
}

// console.log("here's the grid...\n" + makeGrid(gamePlan, 22));

function readLevel(grid) {
    let startActors = [];
    // note the change from i to x and y
    for (y in grid) {
        for (x in grid[y]) {
            /*              crate a variable based on the current
            item in the two dimensional array being read
             */
            let ch = grid[y][x];
            /* if the character is not a new line character
            create a variable from the value attached to the
            key in the object, e.g.

            const levelChars = {
                ".": "empty",
                "#": Square,
            };

            where "." is the key and the value is "empty"
            In the case of "#", the key is "#" and the value
            is the Square class.

            */
            if (ch != "\n") {
                let type = levelChars[ch];
                if (typeof type == "string") {
                    startActors.push(type);
                } else {
                    // let t = new type;
                    // let id = Math.floor(100*Math.random());
                    /*  Here we can use the x and y values from reading the grid,
                        then adjust them based on the tilesize
                         */
                    startActors.push(new type(x * TILESIZE, y * TILESIZE, TILESIZE, TILESIZE))
                }
            }
        }
    }
    return startActors;
}

let currentLevel = readLevel(makeGrid(gamePlan, 22));
// console.log("here's the current level");

// for (i of currentLevel) {
//     // console.log(i);               **VERY WIP** Multiple Levels
// }

// instntiations and more variables
let player1 = new Player(WIDTH / 2, HEIGHT - TILESIZE, 6, TILESIZE, TILESIZE, 'rgb(100, 100, 100)', 100);
let maxEnemies = 6;
let maxPlayers = 1;
let maxBosses = 1;
let canShieldDelay = 2000;
let bossesKilled = 0;
// lots more booleans
let gameOver = false;
let runSSpliceTmrOnce = true;
let runFrBuffOnce = true;
let healthDropRunOnce = true;
let runAddEnemiesOnce = true;
let newBossAdded = false;
let newMegaBossAdded = false;
let spliceShield = false;

// random functions. a lot of which arent used

function myRange() {
    return (Math.floor(Math.random() * 500) + TILESIZE * 3);
}

function randNumb(min, max){
    return (Math.floor(Math.random() * max) + min);
}

function mvmtScore() {
    return ((Math.sqrt(score) / 2) + 1);
    // return 15;
}

function getScore() {
    return score;
}

function buffFr(reduction) {
    if (delayShoot > 0){
        delayShoot = delayShoot - reduction;
    frBuffNotif = true;
    }
    else {
        delayShoot = 0;
    }
}

function nerfMvmt(reduction) {
    if (player1.speed > 0){
        player1.speed = player1.speed - reduction;
        mvmtNerfNotif = true;
    }
}

function scored(points){
    score += points;
    if (varChanged(score)){
        console.log("score was increased by more than 1");
    }
    runAddEnemiesOnce = true;
    runFrBuffOnce = true;
    newBossAdded = false;
}

function varChanged(variable){
    variableOld = variable;
    if (variableOld != variable){
        return true;
    }
}

// test function to clear the game
function wipe() {
    allSprites = [];
    allEnemies = [];
    walls = [];
    enemies = [];
    bosses = [];
    goodProjectiles = [];
    badProjectiles = [];
    players = [];
    shields = [];
}

// think i needed this for a settimeout that was acting weird
function bDamagedFalse(){
    b.damaged = false;
}
function mDamagedFalse(){
    m.damaged = false;
}

// changes the player image between itself and a red tinted version of itself to show that it was hit
function hitAnimation(){
    playerActive = playerDamaged;
    setTimeout(() => playerActive = playerImage, 200);
    setTimeout(() => playerActive = playerDamaged, 400);
    setTimeout(() => playerActive = playerImage, 600);
    setTimeout(() => playerActive = playerDamaged, 800);
    setTimeout(() => playerActive = playerImage, 1000);
}

// massive update function that is essentially the heart of the game. has a lot in it that could be in the specific classes they pertain to but it aint broke so i wont fix it
function update() {

    // constantly updates the player
    player1.update();
    // spams alerts once dead. not very "professional" but gets the job done
    if (lives <= 0) {
        gameOver = true;
        player1.spliced = true;
    }
    // increases player fire rate every time score hits a multiple of 10 (doesnt work if passed over)
    if (score % 10 == 0 && score != 0 ) {
        if (runFrBuffOnce == true) {
            buffFr(20);
            runFrBuffOnce = false;
        }
    }
    // adds an enemy every 50 points passed
    if (score % 50 == 0 && score != 0 && runAddEnemiesOnce == true) {
        runAddEnemiesOnce = false;
        maxEnemies += 1;
    }
    // if there is less than 6 enemies, keeps spawning more until there are 6
    if (enemies.length < maxEnemies) {
        for (i = 0; i < maxEnemies - enemies.length; i++) {
            let e = new Enemy(myRange(), TILESIZE, TILESIZE, TILESIZE);
        }
    }
    // spawns a boss every 25 score (suffers same problem as fire rate increase)
    if (score % 25 == 0 && score != 0) {
        if (!newBossAdded) {
            let b = new Boss(myRange(), TILESIZE, TILESIZE, TILESIZE);
            newBossAdded = true;
        }
        // console.log("score was a multiple of 25 (boss spawn)");

    if (bossesKilled % 3 == 0 && bossesKilled != 0){
        if (!newMegaBossAdded) {
            // console.log("this became true");
            let m = new megaBoss(myRange(), 0, TILESIZE, TILESIZE);
            newMegaBossAdded = true;
        }
    }


    }
    for (b in bosses){
        // increases boss fire rate (decreases delay between shots) every 2 hp it loses
        if (b.health % 2 == 0 && b.health != 50 && healthDropRunOnce == true){
            healthDropRunOnce = false;
            bossFireDelayVar = bossFireDelayVar - 1;
            // console.log("boss health was reduced to a multiple of 2");
        }
    }
    // for loop for everything in shields array. not very efficient way of splicing shield but works
    for (s of shields) {
        // if the shield is active
        if (shields.length == 1) {
            // if this hasnt been run yet (works because it sets itself to become false in itself)
            if (runSSpliceTmrOnce == true) {
                // runs spliceShield after timerShield ends
                setTimeout(() => {spliceShield = true;}, timerShield);
                // sets itself to false before needing so its only run that first time
                runSSpliceTmrOnce = false;
            }
        }
        // if the sheild needs to be spliced
        if (spliceShield == true) {
            // splices the shield
            s.spliced = true;
            // also sets itself to false before ending to ensure it only runs once
            spliceShield = false;
            // resets the runOnce bool
            runSSpliceTmrOnce = true;
        }
        // splices enemy projectiles when they hit the sheild
        for (g of badProjectiles) {
            if (g.collideWith(s, 1)) {
                g.spliced = true;
                // console.log("g should have been spliced");
            }
        }
        s.update();
    }
    // for loop for everything badprojectiles related
    for (g of badProjectiles) {
        // splices enemy projectiles when they hit the bottom of the map
        if (g.y >= HEIGHT - TILESIZE) {
            g.spliced = true;
        }
        // collision checker for the boss shots hitting player
        if (g.collideWith(player1, 1)) {
            // if the player is not already currently "damaged", player loses a life
            if (!player1.damaged) {
                // player1 becomes "damaged" to prevent mass genocide of players
                player1.damaged = true;
                lives -= 1;
                hitAnimation();
                // nerfs movement for every life lost
                nerfMvmt(1);
                // if the player was shot, it is not already currently "damaged", and it has more than 0 lives, displays the hit message
                // if (lives > 0) {
                //     alert("YOUVE BEEN HIT \n" + lives + " LIVES REMAINING");
                // }
                g.spliced = true;
                // player cant become damaged again after being damaged for 1 second
                setTimeout(() => {
                    player1.damaged = false;
                }, 1000);
            }
        }
        g.update();
    }
    // for loop for everything enemies related (enemies refers to the "useless" minions that spawn)
    for (e of enemies) {
        // if the enemy is not in the map, it splices
        if (e.y >= HEIGHT || e.x <= 0 || e.x >= WIDTH + 1) {
            e.spliced = true;
        }
        // if the enemy collides with the player, and it is not already currently damaged, player loses a life
        if (player1.collideWith(e, 1)) {
            if (!player1.damaged) {
                player1.damaged = true;
                // splices the enemy once it hits player
                e.spliced = true;
                lives -= 1;
                hitAnimation();
                // movement also gets nerfed for every life lost
                nerfMvmt(1);
                // next 2 items work the same as above
                // if (lives > 0) {
                //     alert("YOUVE BEEN HIT \n" + lives + " LIVES REMAINING");
                // }
                setTimeout(() => {
                    player1.damaged = false;
                }, 100);
            }

        }
        //
        for (p of goodProjectiles) {
            // if players shots hit an enemy, splices enemy, projectile, increases score, and resets frBuff runOnce
            if (p.collideWith(e, 0)) {
                e.alive = false;
                p.spliced = true;
                e.spliced = true;
                scored(1);
            }
        }
        e.update();
    }
    for (v of veryBadProjectiles){
        if (v.y + v.h >= HEIGHT - TILESIZE) {
            v.spliced = true;
        }
    }
    for (b of bosses) {
        // splices boss when he runs out of health, adds a life, and reduces fire rate cooldown by 20
        if (b.health <= 0) {
            b.spliced = true;
            bossesKilled += 1;
            lives += 1;
            // potential rewards for killing boss
            // scored(10);  cant bcuz passing scores issue
            // buffFr(20);
            // nerfMvmt(-1);    dont feel like making a buffMvmt so ima just subtract a negative
        }
        for (p of goodProjectiles) {
            // if a player projectile hits the boss
            if (p.collideWith(b, 1)) {
                // console.log("p collided with b");
                // if the boss is not already "damaged"
                if (!b.damaged) {
                    // it becomes damaged
                    b.damaged = true;
                    // console.log(b.damaged);
                    // splices the projectile
                    p.spliced = true;
                    // boss loses 1 hp
                    b.health -= 1;
                    healthDropRunOnce = true;
                    // timeout for boss becoming not damaged
                    // console.log("set timeout should have started");
                    setTimeout(bDamagedFalse(), 1000);
                }
            }
        }
        b.update();
    }
    for (m of megaBosses) {
        // splices boss when he runs out of health, adds a life, and reduces fire rate cooldown by 20
        if (m.health <= 0) {
            m.spliced = true;
            megabossKilled = true;
            // potential rewards for killing boss
            // scored(10);  cant bcuz passing scores issue
            // buffFr(20);
            // nerfMvmt(-1);    dont feel like making a buffMvmt so ima just subtract a negative
        }
        for (p of goodProjectiles) {
            // if a player projectile hits the boss
            if (p.collideWith(m, 1)) {
                // console.log("p collided with b");
                // if the boss is not already "damaged"
                if (!m.damaged) {
                    // it becomes damaged
                    m.damaged = true;
                    // splices the projectile
                    p.spliced = true;
                    // boss loses 1 hp
                    m.health -= 1;
                    // timeout for boss becoming not damaged
                    // console.log("set timeout should have started");
                    setTimeout(mDamagedFalse(), 1000);
                }
            }
        }
        m.update();
    }
    // if the player projectie leaves the map it is spliced
    for (p of goodProjectiles) {
        if (p.y < 0) {
            p.spliced = true;
        }
        p.update();
    }

    // all of these essentially work the same. if the object.spliced is set to true, these splice it
    for (p in goodProjectiles) {
        if (goodProjectiles[p].spliced) {
            goodProjectiles.splice(p, 1);
        }
    }
    for (e in enemies) {
        if (enemies[e].spliced) {
            enemies.splice(e, 1);
        }
    }
    for (b in bosses) {
        if (bosses[b].spliced) {
            bosses.splice(b, 1);
        }
    }
    for (m in megaBosses) {
        if (megaBosses[m].spliced) {
            megaBosses.splice(m, 1);
        }
    }
    for (g in badProjectiles) {
        if (badProjectiles[g].spliced) {
            badProjectiles.splice(g, 1);
        }
    }
    for (v in veryBadProjectiles) {
        if (veryBadProjectiles[v].spliced) {
            veryBadProjectiles.splice(v, 1);
        }
    }
    for (s in shields) {
        if (shields[s].spliced) {
            shields.splice(s, 1);
        }
    }
    for (a in allSprites) {
        if (allSprites[a].spliced) {
            allSprites.splice(a, 1);
        }
    }
}

// forgot this existed. probably could have used this for a lot of things in here
function createRect(width, height, x, y, color, strokeColor, lineWidth, ){
    ctx.fillStyle = color;
    ctx.linewidth = lineWidth;
    ctx.strokestyle = strokeColor;
    ctx.rect(width, height, x, y);
}

// draws everything on screen
function draw() {
    // gave me a massive headache with adding background
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(background, 64, 0, WIDTH - TILESIZE, HEIGHT-TILESIZE);
    for (i of allSprites) {
        i.draw();
    }
    drawText(0, 255, 0, 1, "32px Helvetica", "left", "top", "Score: " + (score), 100, 32);
    drawText(255, 255, 255, 1, "32px Helvetica", "left", "top", "X toggle stats", 100, 784);
    // notifications to player of game events
    if (frBuffNotif == true) {
        drawText(0, 255, 0, 1, "32px Helvetica", "center", "top", "Fire Rate Increased", WIDTH / 2, HEIGHT / 2);
        setTimeout(() => {
            frBuffNotif = false;
        }, 1000);
    }
    if (mvmtNerfNotif == true && !gameOver) {
        drawText(255, 0, 0, 1, "32px Helvetica", "center", "top", "Movement Speed Decreased", WIDTH / 2, HEIGHT / 2);
        setTimeout(() => {
            mvmtNerfNotif = false;
        }, 1000);
    }
    if (player1.canShield) {
        drawText(0, 0, 255, 1, "32px Helvetica", "center", "top", "shield charged", WIDTH / 2, 784);
    }
    //          **WIP** for shield cooldown bar
    // if (!player1.canshield){
    //     ctx.fillStyle = "blue";
    //     ctx.fillRect((WIDTH / 2) - (150), 784, , 32);
    //     ctx.beginPath();
    // }
    if (bosses.length >= 1) {
        // boss health bars
        for (b of bosses){
            // set y of square = to be multiplied by location of b in the array to allow for as many health bars as there are bosses (and space on the screen)
            // set x to be the bosses health so it shrinks as the bosses health does
            ctx.fillStyle = "red";
            ctx.fillRect((WIDTH / 2) - (187.5), (32 * (bosses.indexOf(b) + 1) + (bosses.indexOf(b) * 10)) + 16, b.health * 15, 32);
            ctx.beginPath();
        }
    }
    if (megaBosses.length >= 1) {
        // boss health bars
        for (m of megaBosses){
            // set y of square = to be multiplied by location of b in the array to allow for as many health bars as there are bosses (and space on the screen)
            // set x to be the bosses health so it shrinks as the bosses health does
            ctx.fillStyle = "green";
            ctx.fillRect((WIDTH / 2) - (300), 0, m.health * 10, 32);
            ctx.beginPath();
        }
    }
    // everything for the showstats feature
    if (showStats == true) {
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "FPS: " + fps, 100, 400);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Enemies: " + enemies.length, 100, 432);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Bosses: " + bosses.length, 100, 464);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Player Projectiles: " + goodProjectiles.length, 100, 496);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Enemy Projectiles: " + badProjectiles.length, 100, 528);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Enemy Speed: " + mvmtScore(), 100, 560);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Boss Fire Rate: " + bossFireDelayVar, 100, 592);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Player Speed: " + player1.speed, 100, 624);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Fire Rate: " + delayShoot, 100, 656);
        drawText(255, 0, 0, 1, "32px Helvetica", "left", "top", "Lives: " + lives, 100, 688);
    }
    // icons in top left for lives left
    if (lives >= 1){
        ctx.drawImage(playerImage, 0, 0, 894, 894, 100, 100, TILESIZE, TILESIZE);
    }
    if (lives >= 2){
        ctx.drawImage(playerImage, 0, 0, 894, 894, 175, 100, TILESIZE, TILESIZE);
    }
    if (lives >= 3){
        ctx.drawImage(playerImage, 0, 0, 894, 894, 250, 100, TILESIZE, TILESIZE);
    }
    if (lives > 3){
        drawText(255, 255, 255, 1, "64px Helvetica", "left", "top", "+", 325, 100);
    }
    // game over text
    if (gameOver){
        drawText(255, 0, 0, 1, "128px Helvetica", "center", "top", "GAME OVER", WIDTH / 2, HEIGHT / 2);
    }
}

let then = performance.now();
let now = null;
let runtime = null;
let fps = null;
// console.log("enemies " + enemies);

// GAMELOOP FUNCTION BEGINS THE GAMELOOP THAT IS CONSTANTLY RUNNING
let gameLoop = function () {
    // console.log('the game loop is alive! now comment this out before it eats up memory...')
    now = performance.now();
    let delta = now - then;
    fps = (Math.ceil(1000 / delta));
    totaltime = now - then;
    then = now;
    update();
    draw();
    // this single line is what makes the entire game possible. it calls for the browser to request a new frame
    window.requestAnimationFrame(gameLoop);
    // console.log(allSprites);
    // console.log(shields);
    // console.log(showStats);
}
// this is what I have so far. theres a few things I need to sort out and a ton of things I want to add.
