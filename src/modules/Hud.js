import PIXI from 'pixi.js';

class Hud extends PIXI.Container {
  constructor() {
    super();
  }

  createTextBox(name, style, location) {

    this[name + 'TextBox'] = new PIXI.Text('', style);

    let textBox = this[name + 'TextBox'];
    textBox.position.set(location.x, location.y);
    textBox.anchor.set(0.5, 0.5);
    this.addChild(textBox);

    Object.defineProperty(this, name, {
      set: function(val) {
        console.log(val);
        textBox.text = val;
      },
      get: function() {
        return textBox.text;
      }
    });
  }

}

export default Hud;
