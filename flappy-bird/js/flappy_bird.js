FlappyBird = {};

var $game = null;

var $config = {
    game : {
        type: Phaser.AUTO,
        width: 288,
        height: 512,
        backgroundColor: '#000000',
        pixelart: true,
        physics: { default: 'arcade', arcade: { debug: false } },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            min: {
                width: 288,
                height: 512
            },
            max: {
                width: 1152,
                height: 2048
            }
        }
    },
    title : "flappy_bird",
    onDesktop : false,
    showFPS : false
};

window.onload = function() {
    $game = new Phaser.Game($config.game);
    initGameScenes();
};

function initGameScenes() {
    $game.scene.add("Boot", SceneBoot, true);
    $game.scene.add("Preload", ScenePreload);
    $game.scene.add("Title", SceneTitle);
    $game.scene.add("Game", SceneGame);
};

SceneBoot = new Phaser.Class({
    Extends: Phaser.Scene,
});
SceneBoot.prototype = {
    init: function() {
    },
    preload: function() {
        this.load.image('background', 'assets/img/background.png');
    },
    create: function() {
        this.scene.start("Preload");
    },
};


ScenePreload = new Phaser.Class({
    Extends: Phaser.Scene,
});
ScenePreload.prototype = {
    init: function() {
        this.add.image(0, 0, 'background').setOrigin(0, 0);
    },
    preload: function() {
        this.preloadImage();
        this.preloadAudio();
        this.load.on('progress', this.onProgress.bind(this));
        this.load.on('complete', this.onComplete.bind(this));
    },
    create: function() {
    },
    preloadImage: function() {
        this.load.spritesheet('birds', 'assets/img/birds.png', { frameWidth: 46, frameHeight: 28 });
        this.load.spritesheet('numbers1', 'assets/img/numbers1.png', { frameWidth: 28, frameHeight: 40 });
        this.load.spritesheet('numbers2', 'assets/img/numbers2.png', { frameWidth: 18, frameHeight: 24 });
        this.load.spritesheet('medals', 'assets/img/medals.png', { frameWidth: 48, frameHeight: 48 });
        this.load.atlas('assets', 'assets/img/assets.png', 'assets/img/assets.json');
    },
    preloadAudio: function() {
        var audio = ['die', 'hit', 'point', 'swooshing', 'wing'];
        audio.forEach(asset => {
            this.load.audio(asset, 'assets/audio/' + asset + '.wav');
        });
    },
    onProgress: function(value) {
    },
    onComplete: function() {
        this.scene.start("Title");
    }
};


SceneTitle = new Phaser.Class({
    Extends: Phaser.Scene,
});
SceneTitle.prototype = {
    init: function() {
        this.cameras.main.flash();
    },
    create: function() {
        this.createBackground();
        this.createTitle();
        this.createButtons();
    },
    createBackground: function() {
        this.add.image(0, 0, 'assets', 'background1').setOrigin(0, 0);
        var ground = this.add.image(0, 0, 'assets', 'ground').setOrigin(0, 0);
        ground.y = $game.canvas.height - ground.height;
    },
    createTitle: function() {
        this.bird = this.add.sprite(252, 186, 'birds');
        this.title = this.add.image(144, 186, 'assets', 'flappy_bird');
        this.tweens.add({
            y: 192,
            targets: [this.title, this.bird],
            duration: 600,
            repeat:-1,
            yoyo: true
        });
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('birds', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });
        this.bird.play('idle');
    },
    createButtons: function() {
        this.interface = this.add.group();
        this.startButton = this.add.image(0, 0, 'assets', 'start_button').setOrigin(0, 0);
        this.startButton.setInteractive().on('pointerdown', this.onStart, this);
        this.scoreButton = this.add.image(0, 0, 'assets', 'score_button');
        this.interface.addMultiple([this.startButton, this.scoreButton]);
        Phaser.Actions.GridAlign(this.interface.getChildren(), {
            x: 144 - this.startButton.width / 2,
            y: 350,
            width: 2,
            height: 1,
            cellWidth: 128,
            cellHeight: 28,
        });
    },
    onStart: function() {
        this.startButton.y += 2
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', function() { this.scene.start("Game"); }, this);
    }
};


SceneGame = new Phaser.Class({
    Extends: Phaser.Scene,
});
SceneGame.prototype = {
    init: function() {
        this.isPaused = false;
        this.isStarted = false;
        this.isEnded = false;
        this.speed = 2;
    },
    create: function() {
        this.createBackground();
        this.createPipes();
        this.createBird();
        this.createStage();
        this.createInput();
        this.createScore();
        this.createCollider();
        this.cameras.main.fadeIn(300);
        this.taptap = this.add.image(144, 293, 'assets', 'taptap');
    },
    update: function(time, delta) {
        Phaser.Scene.prototype.update.call(this);
        if (!this.isPaused && this.isStarted) {
            this.updateGame();
            this.updateGround();
        }
    },
    createBackground: function() {
        this.add.image(0, 0, 'assets', 'background1').setOrigin(0, 0);
        this.ground = this.physics.add.staticImage(0, 0, 'assets', 'ground').setOrigin(0, 0);
        this.ground.y = $game.canvas.height - this.ground.height;
        this.ground.depth = 2;
        this.ground.refreshBody();
    },
    createBird: function() {
        this.bird = new Bird(this, 94, this.cameras.main.centerY);
        this.add.existing(this.bird);
    },
    createPipes: function() {
        this.pipes = this.physics.add.staticGroup();
        this.pipes = this.physics.add.group();
        this.pipes1 = new PipesGroup(this, 288);
        var x = 288 + 288/2 + this.pipes1.pipe1.width / 2;
        this.pipes2 = new PipesGroup(this, x);
    },
    createStage: function() {
        this.stage = new Stage(this);
        this.stage.bird = this.bird;
        this.stage.addPipes(this.pipes1);
        this.stage.addPipes(this.pipes2);
    },
    createInput: function() {
        this.input.on('pointerdown', this.onJump, this);
        this.input.keyboard.on('keydown-SPACE', this.onJump, this);
    },
    createCollider: function() {
        this.groundCollider = this.physics.add.collider(this.bird, this.ground, this.hitGround.bind(this));
        this.pipesOverlap = this.physics.add.overlap(this.bird, this.stage.pipes, this.hitPipes.bind(this));
    },
    createScore: function() {
        this.scoreGroup = this.add.group();
        this.scoreGroup.create(144, 44, 'numbers1');
    },
    updateGame: function() {
        for (var i = 0; i < this.speed; i++) {
            this.stage.update();
        }
    },
    updateGround: function() {
        for (var i = 0; i < this.speed; i++) {
            this.ground.x -= 1;
        }
        if (this.ground.x <= -48) {
            this.ground.x = 0;
        }
    },
    onJump: function() {
        if (!this.isStarted) {
            this.startGame();
        }
        this.bird.jump();
    },
    startGame:function() {
        this.time.addEvent({ delay: 1000, callback: this.stage.start, callbackScope: this.stage });
        this.tweens.add({ targets: this.taptap, delay: 0, alpha: 0, duration: 300, repeat: 0, });
        this.bird.body.setAllowGravity(true);
        this.isStarted = true;
    },
    isBusy: function() {
        return false;
    },
    clear: function() {
        this.stage.clear();
    },
    hitGround: function() {
        if (!this.isEnded) {
            this.isPaused = true;
            this.isEnded = true;
            this.bird.die();
            this.gameOver();
        }
    },
    hitPipes: function() {
        this.pipesOverlap.active = false;
        this.isPaused = true;
        this.cameras.main.flash();
        this.bird.fall();
    },
    gameOver: function() {
        var container = this.add.container(0, 512);
        var scoreboard = this.add.image(144, 0, 'assets', 'scoreboard').setOrigin(.5, 0);
        scoreboard.depth = 2;
        container.add(scoreboard);
        this.drawGameOverScore(container);
        this.drawGameOverMedal(container);
        this.tweens.add( { targets: container, delay: 350, y: 180, duration: 300 } );
        this.time.addEvent({
            delay: 700,
            callback: this.createButtonsGameOver,
            callbackScope: this
        });
    },
    drawGameOverScore: function(container) {
        var length = this.stage.score.toString().length
        for (var i = 0; i < length; i++) {
            var n = this.stage.score.toString()[i];
            var x = (length - i - 1) * - 13;
            var sprite = this.add.image(230+x, 44, 'numbers2');
            sprite.setFrame(n);
            container.add(sprite);
        }
    },
    drawGameOverMedal: function(container) {
        if (this.stage.score >= 10) {
            var sprite = this.add.image(78, 65, 'medals');
            if (this.stage.score >= 40) {
                sprite.setFrame(3);
            } else if (this.stage.score >= 30) {
                sprite.setFrame(2);
            } else if (this.stage.score >= 20) {
                sprite.setFrame(1);
            } else {
                sprite.setFrame(0);
            }
            container.add(sprite);
        }
    },
    createButtonsGameOver: function() {
        this.okButton = this.add.image(0, 0, 'assets', 'ok_button').setOrigin(0, 0);
        this.okButton.setInteractive().on('pointerdown', this.onGameOverOk, this);
        this.scoreButton = this.add.image(0, 0, 'assets', 'score_button');
        var group = this.add.group();
        group.addMultiple([this.okButton, this.scoreButton]);
        Phaser.Actions.GridAlign(group.getChildren(), {
            x: 144 - this.okButton.width / 2,
            y: 350,
            width: 2,
            height: 1,
            cellWidth: 128,
            cellHeight: 28,
        });
    },
    onGameOverOk: function() {
        this.okButton.y += 2
        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', function() { this.scene.start("Title"); }, this);
    }
};


var Bird = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,
    initialize: function() {
        this.initialize.apply(this, arguments);
    }
});
Bird.prototype.initialize = function(scene, x, y) {
    Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, 'birds');
    this.scene.physics.world.enable(this);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(1200);
    this.body.setAllowGravity(false);
    this.isAlive = true;
    this.setSize(30, 20, true);
    this.setupAnims();
};
Bird.prototype.setupAnims = function() {
    this.scene.anims.create({
        key: 'idle',
        frames: this.scene.anims.generateFrameNumbers('birds', { start: 0, end: 2 }),
        frameRate: 16,
        repeat: 2
    });
    this.anims.play('idle');
};
Bird.prototype.update = function() {
};
Bird.prototype.jump = function() {
    if (this.isAlive) {
        this.scene.sound.play('wing');
        this.body.setVelocityY(-370);
        this.anims.play('idle');
        this.playFlapTween();
    }
};
Bird.prototype.playFlapTween = function() {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
        targets: this,
        delay: 0,
        angle: -30,
        duration: 300,
        repeat: 0,
    });
    this.scene.tweens.add({
        targets: this,
        delay: 500,
        angle: { from: -30, to: 90 },
        duration: 300,
        repeat: 0
    });
};
Bird.prototype.fall = function() {
    this.scene.sound.play('hit');
    this.scene.time.addEvent({
        delay: 500,
        callback: function() {this.scene.sound.play('die');},
        callbackScope: this
    });
    this.setVelocityY(0);
    this.anims.stop();
    this.isAlive = false;
    this.playDieTween();
};
Bird.prototype.playDieTween = function() {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
        key: 'die',
        targets: this,
        angle: 90,
        duration: 200,
        repeat: 0
    });
};
Bird.prototype.die = function() {
    if (this.isAlive) {
        this.scene.sound.play('hit');
        this.anims.stop();
        this.scene.tweens.killTweensOf(this);
        this.isAlive = false;
    }
};

var PipesGroup = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Group,
    initialize: function() {
        this.initialize.apply(this, arguments);
    }
});
PipesGroup.prototype.initialize = function(scene, x) {
    var world = scene.physics.world;
    Phaser.Physics.Arcade.Group.call(this, world, scene);
    this.active = false;
    this.gap = 90;
    this.pipe1 = this.createPipe(x, 0, 'pipe1').setOrigin(0.5, 1);
    this.pipe2 = this.createPipe(x, 0, 'pipe2').setOrigin(0.5, 0);
    this.pipe1.x += this.pipe1.width / 2;
    this.pipe2.x += this.pipe2.width / 2;
    this.randomPipes();
};
PipesGroup.prototype.createPipe = function(x, y, texture) {
    pipe = this.create(x, y, 'assets', texture);
    pipe.setImmovable(true);
    return pipe;
};
PipesGroup.prototype.update =  function() {
    if (this.active) {
        this.updatePipes();
    }
};

PipesGroup.prototype.updatePipes = function() {
    this.children.each(child => {
        child.x -= 1;
    });
    if (!this.isOnScreen()) {
        this.randomPipes();
        this.children.each(child => {
            child.x = 288 + child.width;
        });
    }
};
PipesGroup.prototype.isOnScreen =  function() {
    return this.pipe1.getBounds().right >= 0;
};
PipesGroup.prototype.randomPipes =  function() {
    var y = Phaser.Math.Between(110, 290);
    this.pipe1.y = y - this.gap / 2;
    this.pipe2.y = y + this.gap / 2;  
};


var Stage = new Phaser.Class({
    initialize: function() {
        this.initialize.apply(this, arguments);
    }
});
Stage.prototype.initialize = function(scene) {
    this.scene = scene;
    this.score = 0;
    this.bird = null;
    this.pipes = [];
};
Stage.prototype.start = function(scene) {
    this.pipes.forEach(pipe => {
        pipe.active = true;
    });
};
Stage.prototype.clear =  function() {
    this.bird = null;
    this.pipes = [];
};
Stage.prototype.update =  function() {
    this.pipes.forEach(pipe => {
        var headBirdX = this.bird.x + this.bird.width / 2;
        if (pipe.pipe1.x === headBirdX) {
            this.refreshScore();
        }
    }, this);
    if (this.bird) {
        this.bird.update();
    }
    this.pipes.forEach(pipe => {
        pipe.update();
    });
};
Stage.prototype.refreshScore =  function() {
    this.scene.sound.play('point');
    this.score += 1;
    this.scene.scoreGroup.clear(true);
    var length = this.score.toString().length
    for (var i = 0; i < length; i++) {
        var n = this.score.toString()[i];
        var x = (i * 24) - 12 * (length-1);
        var sprite = this.scene.scoreGroup.create(144+x, 44, 'numbers1');
        sprite.setFrame(n);
    }
};
Stage.prototype.addPipes =  function(pipe) {
    this.pipes.push(pipe);
};