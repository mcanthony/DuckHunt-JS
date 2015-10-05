import PIXI from 'pixi.js';

class Hud extends PIXI.Container {
  constructor() {
    super();
  }

  createTextBox(name, style, location) {

    this[name + 'TextBox'] = new PIXI.Text('', style);

    let textBox = this[name + 'TextBox'];
    textBox.position = textBox.defaultPosition = location;
    textBox.anchor.set(0.5, 0.5);
    this.addChild(textBox);

    Object.defineProperty(this, name, {
      set: function(val) {
        textBox.text = val;
      }
    });
  }

}

export default Hud;
