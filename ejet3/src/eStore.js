const Store = require('electron-store')

class EStore {
  constructor() {
    this.store = new Store({
      windowX: {
        type: 'number',
        default: 32
      },
      windowY: {
        type: 'number',
        default: 32
      },
      windowWidth: {
        type: 'number',
        default: 1280
      },
      windowHeight: {
        type: 'number',
        default: 800
      }
    })
  }

  getBounds() {
    return {
      x: this.store.get('windowX') || 32,
      y: this.store.get('windowY') || 32,
      width: this.store.get('windowWidth') || 1280,
      height: this.store.get('windowHeight') || 800,
    }
  }

  saveBounds(bounds) {
    this.store.set('windowX', bounds.x)
    this.store.set('windowY', bounds.y)
    this.store.set('windowWidth', bounds.width)
    this.store.set('windowHeight', bounds.height)
  }
}

const instance = new EStore()
module.exports = instance
