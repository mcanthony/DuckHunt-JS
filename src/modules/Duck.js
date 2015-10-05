import TWEEN from 'tween.js';
import Howler from 'howler';
import audioSpriteSheet from '../../dist/audio.json';
import _random from 'lodash/number/random';
import _extend from 'lodash/object/assign';
import Utils from '../libs/utils';
import Character from './Character';

const sound = new Howl(audioSpriteSheet);
const DEATH_ANIMATION_SPEED = 600;

class Duck extends Character {
  constructor(color, spritesheet) {
    let spriteId = 'duck/' + color;
    let states = [
      {
        name: 'left',
        animationSpeed: 0.18

      },
      {
        name: 'right',
        animationSpeed: 0.18

      },
      {
        name: 'top-left',
        animationSpeed: 0.18

      },
      {
        name: 'top-right',
        animationSpeed: 0.18

      },
      {
        name: 'dead',
        animationSpeed: 0.18

      },
      {
        name: 'shot',
        animationSpeed: 0.18

      }
    ];
    super(spriteId, spritesheet, states);
    this.alive = true;
    this.anchor.set(0.5, 0.5);
  }

  freeFlight(opts) {
    let options = _extend({
      minX: 0,
      maxX: Infinity,
      minY: 0,
      maxY: Infinity,
      minDistance: 300,
      speed: 1
    }, opts);

    let distance, destination;
    do {
      destination = {
        x: _random(options.minX, options.maxX),
        y: _random(options.minY, options.maxY)
      };
      distance = Utils.pointDistance(this.position, destination);
    } while (distance < options.minDistance);

    this.play();
    let _this = this;
    this.flyTo(destination, options.speed).onComplete(function() {
      if (_this.alive) {
        _this.freeFlight(options);
      }
    });
  }

  flyTo(point, speed) {
    if (speed) {
      this.speed = speed;
    }

    let direction = Utils.directionOfTravel(this.position, point);
    this.setState(direction.replace('bottom', 'top'));
    let _this = this;
    this.tween = new TWEEN.Tween(this.position)
      .to(point, this.flightSpeed + _random(0, 300))
      .onUpdate(function() {
        _this.setPosition(parseInt(this.x), parseInt(this.y));
      })
      .start();
    return this.tween;
  }

  shot() {
    if (!this.alive) {
      return;
    }
    this.alive = false;
    this.stop();
    this.setState('shot');
    sound.play('quak');

    let _this = this;
    this.tween = new TWEEN.Tween({y: this.position.y })
      .to({y: this.parent.getMaxY() }, DEATH_ANIMATION_SPEED)
      .delay(450)
      .onStart(this.setState.bind(this, 'dead'))
      .onUpdate(function() {
        _this.position.y = this.y;
      })
      .onComplete(function() {
        sound.play('thud');
        _this.visible = false;
      })
      .start();

    return this.tween;
  }

  stop() {
    if (this.tween) {
      this.tween.stop();
    }
  }

  get speed() {
    return this.speedLevel;
  }

  set speed(val) {
    let flightAnimationMs;
    switch (val) {
      case 0:
        flightAnimationMs = 3000;
        break;
      case 1:
        flightAnimationMs = 2800;
        break;
      case 2:
        flightAnimationMs = 2500;
        break;
      case 3:
        flightAnimationMs = 2000;
        break;
      case 4:
        flightAnimationMs = 1800;
        break;
      case 5:
        flightAnimationMs = 1500;
        break;
      case 6:
        flightAnimationMs = 1300;
        break;
      case 7:
        flightAnimationMs = 1200;
        break;
      case 8:
        flightAnimationMs = 800;
        break;
      case 9:
        flightAnimationMs = 600;
        break;
      case 10:
        flightAnimationMs = 500;
        break;
    }
    this.speedLevel = val;
    this.flightSpeed = flightAnimationMs;
  }
}

export default Duck;
