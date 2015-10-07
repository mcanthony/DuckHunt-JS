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
    return this;
  }

  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('score')) {
        this.stage.hud.createTextBox('score', {
          font: '18px Arial',
          align: 'left',
          fill: 'white'
        }, Stage.scoreBoxLocation());
      }

      this.stage.hud.score = val;
    }

  }

  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          font: '18px Arial',
          align: 'left',
          fill: 'white'
        }, Stage.waveStatusBoxLocation());
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'Wave ' + val + ' of ' + this.level.waves;
      }else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  get gameStatus () {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!this.stage.hud.hasOwnProperty('gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          font: '40px Arial',
          align: 'left',
          fill: 'white'
        }, Stage.gameStatusBoxLocation());
      }

      this.stage.hud.gameStatus = val;
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

    this.scaleToWindow();
    this.bindEvents();
    this.startLevel();
    this.animate();
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

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(function() {
      _this.gameStatus = '';
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
    this.gameStatus = 'You Win!';
    this.stage.victoryScreen();
  }

  loss() {
    this.gameStatus = 'You Lose!';
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
