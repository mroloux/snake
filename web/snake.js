'use strict'

var SNAKE_PART_SIZE = 20;

function Point(x, y, maxX, maxY) {

    this.x = x;
    this.y = y;

    this.down = function () {
        if (this.y == maxY) {
            return new Point(x, 0, maxX, maxY);
        }
        return new Point(x, ++y, maxX, maxY);
    }

    this.up = function () {
        if (this.y == 0) {
            return new Point(x, maxY, maxX, maxY);
        }
        return new Point(x, --y, maxX, maxY);
    }

    this.left = function () {
        if (this.x == 0) {
            return new Point(maxX, y, maxX, maxY);
        }
        return new Point(--x, y, maxX, maxY);
    }

    this.right = function () {
        if (this.x == maxX) {
            return new Point(0, y, maxX, maxY);
        }
        return new Point(++x, y, maxX, maxY);
    }

    this.goTo = function (direction) {
        if (direction == "up") {
            return this.up();
        }
        if (direction == "right") {
            return this.right();
        }
        if (direction == "down") {
            return this.down();
        }
        if (direction == "left") {
            return this.left();
        }
    }

    this.zelfdeAls = function (point) {
        return this.x == point.x && this.y == point.y;
    }
}

function Snake(maxX, maxY) {

    var me = this;

    this.direction = "right";
    this.position = new Point(0, 0, maxX, maxY);
    this.otherPositions = [];
    this.color = "black";

    this.goToNext = function () {
        this.otherPositions.splice(0, 1);
        this.otherPositions.push(this.position);
        this.position = this.position.goTo(this.direction);
    }

    this.vergroot = function () {
        this.otherPositions.push(this.position);
        this.position = this.position.goTo(this.direction);
    }

    this.drawPart = function (position, context) {
        context.save();
        context.fillStyle = this.color;
        context.fillRect(position.x * SNAKE_PART_SIZE, position.y * SNAKE_PART_SIZE, SNAKE_PART_SIZE, SNAKE_PART_SIZE);
        context.restore();
    }

    this.draw = function (context) {
        this.otherPositions.forEach(function (position) {
            me.drawPart(position, context);
        });
        me.drawPart(me.position, context);
    }

    this.heeftZichzelfOpgefret = function () {
        return me.otherPositions.some(function (position) {
            return me.position.zelfdeAls(position);
        })
    }

    this.positions = function () {
        return this.otherPositions.concat(this.position);
    }

}

function Bolleke(position) {

    var me = this;
    this.position = position;

    this.opZelfdePlaatsAls = function (slang) {
        return this.position.zelfdeAls(slang.position);
    }

    function bollekeX() {
        return ((me.position.x + 1) * SNAKE_PART_SIZE) - (SNAKE_PART_SIZE / 2);
    }

    function bollekeY() {
        return ((me.position.y + 1) * SNAKE_PART_SIZE) - (SNAKE_PART_SIZE / 2);
    }

    this.draw = function (context) {
        context.save();
        context.fillStyle = "red";
        context.beginPath();
        context.arc(bollekeX(), bollekeY(), SNAKE_PART_SIZE / 2, 0, Math.PI * 2, true);
        context.closePath();
        context.fill();
        context.restore();
    }

}

function Score() {

    var score = 0;

    this.omhoog = function () {
        score++;
    }

    this.draw = function (context) {
        context.save();
        context.font = "20px Arial";
        context.fillText("Score: " + score, 5, 20);
        context.restore();
    }

    this.score = function () {
        return score;
    }
}

Snake.fromPositions = function (positions, maxX, maxY) {
    var snake = new Snake(maxX, maxY);
    snake.position = positions[positions.length - 1];
    snake.otherPositions = positions.slice(0, positions.length - 1);
    return snake;
}

function SnakeGame(canvas, socket) {

    var context = canvas.getContext("2d");
    var timeout;
    var snake = new Snake(numVerticalSquares() - 1, numHorizontalSquares() - 1);
    var bolleke;
    var score = new Score();
    speelEenLiedje();
    var otherSnake;
    var me = this;

    function speelEenLiedje() {
        var liedje = new Audio("wesley.mp3");
        liedje.loop = true;
        liedje.play();
    }

    window.onkeydown = function (e) {
        if (e.keyCode == 38) {
            snake.direction = "up";
        } else if (e.keyCode == 39) {
            snake.direction = "right";
        } else if (e.keyCode == 40) {
            snake.direction = "down";
        } else if (e.keyCode == 37) {
            snake.direction = "left";
        }
    };

    function numVerticalSquares() {
        return canvas.height / SNAKE_PART_SIZE;
    }

    function numHorizontalSquares() {
        return canvas.width / SNAKE_PART_SIZE;
    }

    function gameOver() {
        printBoodschap("Game over");
        window.clearTimeout(timeout);
    }

    function geluidseffectje() {
        new Audio("coin.mp3").play();
    }

    function gaDoorMetSpelletje() {
        if (bolleke.opZelfdePlaatsAls(snake)) {
            geluidseffectje();
            score.omhoog();
            snake.vergroot();
            socket.emit('bollekeGepakt');
        }
        snake.draw(context);
        bolleke.draw(context);
        score.draw(context);
        if (otherSnake) {
            otherSnake.draw(context);
        }
    }

    function go() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        snake.goToNext();
        socket.emit('snakeMoved', snake.positions());
        if (snake.heeftZichzelfOpgefret()) {
            gameOver();
            socket.emit('gameOver');
        } else {
            gaDoorMetSpelletje();
            if(score.score() == 10) {
                me.gewonnen();
                socket.emit('ivewon');
            }
        }
    }

    function snelheid() {
        return Math.max(150 - (score.score() * 20), 40);
    }

    function gaanMetDieBanaan() {
        timeout = window.setTimeout(gaanMetDieBanaan, snelheid());
        go();
    }

    function printBoodschap(boodschap) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.fillStyle = "blue";
        context.font = "40px Arial";
        var textWidth = context.measureText(boodschap).width;
        context.fillText(boodschap, (canvas.width / 2) - (textWidth / 2), canvas.height / 2);
        context.restore();
    }

    function printWachtBoodschap() {
        printBoodschap("Wacht op volk...");
    }

    printWachtBoodschap();

    this.gaanMetDieBanaan = gaanMetDieBanaan;

    this.stopTerMee = function () {
        window.clearTimeout(timeout);
        printWachtBoodschap();
    };

    this.updateOtherSnake = function (positions) {
        otherSnake = Snake.fromPositions(positions, numVerticalSquares() - 1, numHorizontalSquares() - 1);
        otherSnake.color = "blue";
    };

    this.gewonnen = function() {
        window.clearTimeout(timeout);
        printBoodschap("Je hebt gewonnen!");
    };

    this.gameOver = gameOver;

    this.bollekeOpPositie = function(positieVanBolleke) {
        bolleke = new Bolleke(new Point(positieVanBolleke.x, positieVanBolleke.y));
    }
};