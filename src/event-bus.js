export default class EventBus {
  constructor() {
    this.listeners = {};
  }
  on(type, listener) {
    if(!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }
  off(type, listener) {
    if(!this.listeners[type]) {
      return false;
    }

    const index = this.listeners[type].indexOf(listener);

    // TODO: which is better?
    // we slice listener functions
    // on trigger so that it does not mess up the order
    // while we loop through.
    //
    // Here we slice on off so that the loop in trigger
    // can continue using it's old reference to loop without
    // messing up the order.
    this.listeners[type] = this.listeners[type].slice(0);
    this.listeners[type].splice(index, 1);
    return index > -1;
  }
  trigger(type) {
    const callbacks = this.listeners[type];

    if(!callbacks) {
      return;
    }

    // Slicing the arguments on every invocation of this method
    // can add a significant amount of overhead. Avoid the
    // intermediate object creation for the common case of a
    // single callback argument
    if(arguments.length === 2) {
      const length = callbacks.length;

      for(let i = 0; i < length; ++i) {
        callbacks[i].call(this, arguments[1]);
      }
    } else {
      const args = Array.prototype.slice.call(arguments, 1);
      const length = callbacks.length;

      for(let i = 0; i < length; ++i) {
        callbacks[i].apply(this, args);
      }
    }
  }
  dispose() {
    this.listeners = {};
  }
  pipe(destination) {
    this.on('data', function(data) {
      destination.push(data);
    });
  }
}
