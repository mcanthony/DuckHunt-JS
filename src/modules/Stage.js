import PIXI from 'pixi.js';
import BPromise from 'bluebird';
import Howler from 'howler';
import TWEEN from'tween.js';
import audioSpriteSheet from '../../dist/audio.json';
import Utils from '../libs/utils';
import Duck from './Duck';
import Dog from './Dog';
import Hud from './Hud';

const sound = new Howl(audioSpriteSheet);
const MAX_X = 800;
const MAX_Y = 600;
const HUD_TEXT_BOX_LOCATIONS = {
  SCORE: new PIXI.Point(MAX_X - 105, 20),
  WAVE_STATUS: new PIXI.Point(60, MAX_Y * 0.97 - 10),
  GAME_STATUS: new PIXI.Point(MAX_X / 2, MAX_Y * 0.45)
};

Howler.Howler.mute();

class Stage extends PIXI.Container {

  constructor(opts) {
    super();
    this.spritesheet = opts.sprites;
    this.interactive = true;
    this.ducks = [];
    this.duckOrigin = new PIXI.Point(MAX_X / 2, MAX_Y);
    this.dog = new Dog(this.spritesheet);
    this.dog.visible = false;
    this.hud = new Hud();

    this._setStage();
    this.scaleToWindow();
  }

  static scoreBoxLocation() {
    return HUD_TEXT_BOX_LOCATIONS.SCORE;
  }

  static waveStatusBoxLocation() {
    return HUD_TEXT_BOX_LOCATIONS.WAVE_STATUS;
  }

  static gameStatusBoxLocation() {
    return HUD_TEXT_BOX_LOCATIONS.GAME_STATUS;
  }

  getCenterPoint() {
    return new PIXI.Point(MAX_X / 2, MAX_Y);
  }

  scaleToWindow() {
    this.scale.set(window.innerWidth / MAX_X, window.innerHeight / MAX_Y);
  }

  _setStage() {
    let background = new PIXI.extras.MovieClip([PIXI.loader.resources[this.spritesheet].textures['scene/back/0.png']]);
    background.position.set(0, 0);

    let tree = new PIXI.extras.MovieClip([PIXI.loader.resources[this.spritesheet].textures['scene/tree/0.png']]);
    tree.position.set(100, 237);

    this.addChild(tree);
    this.addChild(background);
    this.addChild(this.dog);
    this.addChild(this.hud);

    return this;
  }

  preLevelAnimation() {
    this.cleanUpDucks();
    return this.dog.levelIntro();
  }

  addDucks(numDucks, speed) {
    for (let i = 0; i < numDucks; i++) {
      let duckColor = i % 2 === 0 ? 'red' : 'black';

      // Al was here.
      let newDuck = new Duck(duckColor, this.spritesheet);
      newDuck.position.set(this.duckOrigin.x, this.duckOrigin.y);
      this.addChildAt(newDuck, 0);
      newDuck.freeFlight({
        speed: speed,
        maxX: MAX_X,
        maxY: MAX_Y
      });

      this.ducks.push(newDuck);
    }
  }

  shotsFired(clickPoint) {
    sound.play('gunSound');
    clickPoint.x /= this.scale.x;
    clickPoint.y /= this.scale.y;
    let killed = 0;
    for (let i = 0; i < this.ducks.length; i++) {
      let duck = this.ducks[i];
      if (duck.alive && Utils.pointDistance(duck.position, clickPoint) < 60) {
        killed++;
        duck.shot();
        this.dog.retrieve();
      }
    }
    return killed;
  }

  getMaxX() {
    return MAX_X;
  }

  getMaxY() {
    return MAX_Y;
  }

  flyAway() {
    this.dog.laugh();
    while (this.ducks.length > 0) {
      let duck = this.ducks.pop();
      if (duck.alive) {
        duck.stop();
        duck.flyTo({
          x: MAX_X / 2,
          y: -500
        });
      }
    }
  }

  cleanUpDucks() {
    for (let i = 0; i < this.ducks.length; i++) {
      this.removeChild(this.ducks[i]);
    }
    this.ducks = [];
  }

  ducksAlive() {
    for (let i = 0; i < this.ducks.length; i++) {
      if (this.ducks[i].alive) {
        return true;
      }
    }
    return false;
  }

  isActive() {
    return this.dog.isActive() || TWEEN.getAll().length > 0;
  }

  victoryScreen() {
    sound.play('champ');
  }

  loserScreen() {
    sound.play('loserSound');
  }
}

export default Stage;
