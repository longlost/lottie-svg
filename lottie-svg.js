/**
 * `lottie-svg`
 *  lottie-web custom element wrapper
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 * 
 *
 * animation methods:
 *  
 *    play
 *    stop
 *    pause
 *    setLocationHref(href)
 *      href: usually pass as location.href. 
 *            Its useful when you experience mask issue in safari where your url does not have # symbol.
 *    setSpeed(speed)
 *      speed: 1 is normal speed.
 *    goToAndStop(value, isFrame)
 *      value: numeric value.
 *    isFrame: defines if first argument is a time based value or a frame based (default false).
 *    goToAndPlay(value, isFrame)
 *      value: numeric value.
 *      isFrame: defines if first argument is a time based value or a frame based (default false).
 *    setDirection(direction)
 *      direction: 1 is forward, -1 is reverse.
 *    playSegments(segments, forceFlag)
 *      segments: array. Can contain 2 numeric values that will be used as first and last frame of the animation. 
 *                       Or can contain a sequence of arrays each with 2 numeric values.
 *      forceFlag: boolean. If set to false, it will wait until the current segment is complete. 
 *                          If true, it will update values immediately.
 *    setSubframe(useSubFrames)
 *      useSubFrames: If false, it will respect the original AE fps. 
 *                    If true, it will update on every requestAnimationFrame with intermediate values. 
 *                    Default is true.
 *    destroy()
 *    getDuration(inFrames)
 *      inFrames: If true, returns duration in frames, if false, in seconds.
 *
 *
 * events: prefixed by 'lottie-svg-'
 *  
 *    complete
 *    loopComplete
 *    enterFrame
 *    segmentStart
 *    config_ready (when initial config is done)
 *    data_ready (when all parts of the animation have been loaded)
 *    data_failed (when part of the animation can not be loaded)
 *    loaded_images (when all image loads have either succeeded or errored)
 *    DOMLoaded (when elements have been added to the DOM)
 *    destroy
 *
 *
 */
import {
  AppElement, 
  html
}                  from '@longlost/app-element/app-element.js';
import {
  listen, 
  isOnScreen
}                  from '@longlost/utils/utils.js';
import * as lottie from 'lottie-web';


class LottieSvg extends AppElement {
  static get is() { return 'lottie-svg'; }

  static get template() {
    return html`<div id="container"></div>`;
  }


  static get properties() {
    return {
      // returned from lottie, used by comsumer to control animation
      // see lottie-web docs in github for an up to date list of methods
      animation: Object,
      // .json file created by Adobe passed in by consumer
      animationData: Object,

      autoplay: {
        type: Boolean,
        value: false
      },
      // true after lottie DOMLoaded Event fires
      domLoaded: {
        type: Boolean,
        value: false,
        readOnly: true
      },

      events: {
        type: Boolean,
        value: false
      },

      loop: {
        type: Boolean,
        value: false
      },

      noFade: Boolean,
      // The distance in pixels to pad
      // to the carousel trigger threshold.
      // For instance, 0 would mean that the
      // next lazy image would not start to download
      // until a single pixel intersects the edge of
      // the carousel.
      // Or 128 means that the image would start to
      // download 128px before the next image comes
      // into view.
      trigger: {
        type: Number,
        value: 0
      },

    };
  }


  static get observers() {
    return [
      '__animationDataChanged(animationData)'
    ];
  }


  async __animationDataChanged(animationData) {
    try {
      if (!animationData || typeof animationData !== 'object') { return; }

      if (this.domLoaded) {
        this.animation.destroy();
        this.domLoaded = false;
      }
      // default to a fade in after load
      if (!this.noFade) {
        this.$.container.style.transition = 'opacity 0.2s ease-in';
        this.$.container.style.opacity    = '0';
      }

      await isOnScreen(this.$.container, this.trigger);

      this.animation = lottie.loadAnimation({
        animationData,
        autoplay:  this.autoplay,
        // cannot use this as container because the svg would be
        // loaded outside of its shadow dom
        container: this.$.container, 
        loop:      this.loop,
        renderer: 'svg'
      });

      if (this.events) {
        listen(this.animation, 'complete',      this.__fireEvent.bind(this));
        listen(this.animation, 'loopComplete',  this.__fireEvent.bind(this));
        // listen(this.animation, 'enterFrame',    this.__fireEvent.bind(this));
        listen(this.animation, 'segmentStart',  this.__fireEvent.bind(this));
        listen(this.animation, 'destroy',       this.__fireEvent.bind(this));
      }
      // listen(this.animation, 'config_ready',  this.__fireEvent.bind(this));
      // listen(this.animation, 'data_ready',    this.__fireEvent.bind(this));
      // listen(this.animation, 'data_failed',   this.__fireEvent.bind(this));
      // listen(this.animation, 'loaded_images', this.__fireEvent.bind(this));
      listen(this.animation, 'DOMLoaded',     this.__domLoaded.bind(this));
    }
    catch (error) {
      if (error === 'Element removed.') { return; } // isOnScreen error.
      console.error(error);
    }    
  }


  __fireEvent(event) {
    const {type} = event;
    this.fire(`lottie-svg-${type}`, {
      animation: this.animation, 
      data:      event, 
      node:      this
    });
  }


  __domLoaded() {
    this.domLoaded = true;
    this.$.container.style.opacity = '1';
    this.fire('lottie-svg-DOMLoaded');
  }

}

window.customElements.define(LottieSvg.is, LottieSvg);
