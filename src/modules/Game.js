import PIXI from 'pixi.js';
import TWEEN from 'tween.js';
import _noop from 'lodash/utility/noop';
import levels from '../data/levels.json';
import Stage from './Stage';
import Duck from './Duck';
import Dog from './Dog';
import Hud from './Hud';

const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;

class Game {
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = PIXI.loader;
    this.renderer =  PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;

    this.waveEnding = false;
    this.waveOver = false;
    this.levels = levels.normal;
    this.score = 0;
    return this;
  }

  get wave() {
    return this.waveNum;
  }

  set wave(val) {
    this.waveNum = val;
    if (!isNaN(val) && val > 0) {
      this.hud.waveStatus = 'Wave ' + val + ' of ' + this.level.waves;
    } else {
      this.hud.waveStatus = '';
    }
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      sprites: this.spritesheet
    });

    this.setupHud();
    this.bindEvents();
    this.scaleToWindow();
    this.startLevel();
    this.animate();
  }

  setupHud() {
    this.hud = this.stage.addChild(new Hud());

    this.hud.createTextBox('score', {
      font: '18px Arial',
      align: 'center',
      fill: 'white'
    }, this.stage.scoreBoxLocation);

    this.hud.createTextBox('waveStatus', {
      font: '18px Arial',
      align: 'left',
      fill: 'white'
    }, this.stage.waveStatusBoxLocation);

    this.hud.createTextBox('gameStatus', {
      font: '40px Arial',
      align: 'left',
      fill: 'white'
    }, this.stage.gameStatusBoxLocation);
  }

  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    let _this = this;

    this.level = this.levels[this.levelIndex];
    this.ducksShotThisLevel = 0;
    this.wave = 0;

    this.hud.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(function() {
      _this.hud.gameStatus = '';
      _this.stage.mousedown = _this.stage.touchstart = _this.handleClick.bind(_this);
      _this.startWave();
    });
  }

  startWave() {
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.shotsFired = 0;
    this.waveEnding = false;
    this.waveOver = false;
    this.stage.addDucks(this.level.ducks, this.level.speed);
  }

  endWave() {
    this.stage.cleanUpDucks();
    this.goToNextWave();
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    return (this.isWaveTimeUp() || this.outOfAmmo() || !this.stage.ducksAlive()) && !this.waveEnding;
  }

  isWaveTimeUp() {
    return this.waveElapsedTime() >= this.level.time;
  }

  waveElapsedTime() {
    return (Date.now() - this.waveStartTime) / 1000;
  }

  outOfAmmo() {
    return this.shotsFired >= this.level.bullets;
  }

  endLevel() {
    this.wave = null;
    this.stage.mousedown = this.stage.touchstart = _noop;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShotThisLevel > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  win() {
    this.hud.gameStatus = 'You Win!';
    this.stage.victoryScreen();
  }

  loss() {
    this.hud.gameStatus = 'You Lose!';
    this.stage.loserScreen();
  }

  handleClick(event) {
    if (!this.outOfAmmo()) {
      this.shotsFired++;
      this.updateScore(this.stage.shotsFired({
        x: event.data.global.x,
        y: event.data.global.y
      }));
    }
  }

  updateScore(ducksShot) {
    this.ducksShotThisLevel += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
    this.hud.score = this.score;
  }

  animate(time) {
    this.renderer.render(this.stage);
    TWEEN.update(time);

    if (!this.stage.isActive() && !this.waveOver) {
      this.waveOver = true;
      this.endWave();
    } else if (this.shouldWaveEnd()) {
      this.waveEnding = true;
      if (this.stage.ducksAlive()) {
        this.renderer.backgroundColor = PINK_SKY_COLOR;
        this.stage.flyAway();
      }
    }

    requestAnimationFrame(this.animate.bind(this));
  }
}

export default Game;
