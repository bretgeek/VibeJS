/**
* Vibe.
* (c) 2021 Bret Lowry
* @license MIT
* @description VibeJS a component library for composing apps
* @author Bret Lowry <bretgeek@gmail.com>
* @constructor
* @param {object} $self - optional, defaults to document.
* @return {object} obj with keys pointing to functions and types
*/
function Vibe($self = document, {fn={}} = {} ) {
  let isDocument = false;
  if ($self.nodeName === '#document' ) {
    isDocument = true;
  }


  let vibeloaded = false;
  if (isDocument) {
    (function ready() {
      if (document.readyState != 'loading') {
        vibeloaded = true;
      } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', function() {
          vibeloaded = true;
        });
      } else {
        document.attachEvent('onreadystatechange', function() {
          if (document.readyState != 'loading') {
            vibeloaded = true;
          }
        });
      }
    })();
  }

  /**
* ready
* READY
* @description Checks if document is ready by checking vibeload variable that gets set in the iife above
*/

  function ready(fn, fallbacktime=3000) {
    let docint;
    let tout;
    let inc = 1;
    docint = setInterval( () => {
      if (vibeloaded) {
        clearInterval(docint);
        clearTimeout(tout);
        if (fn && isFunction(fn) && inc <=1) { // Don't run more than once per call
          try {
            fn();
            inc++;
          } catch (e) {
            console.error(e);
          }
        } else {
          // Should also be able to use to check if docready is true
          return true;
        }
      }
    }, 6);
    // If all else fails set vibeloaded after fallbacktime (can pass it in too)
    tout = setTimeout( () => {
      vibeloaded = true;
    }, fallbacktime);
  }// end read


  /* RENDER */

  /**
* render
* Renders a component to a specified element.
* @param {function} component - required, the component function to render
* @param {object} {} - optional with defaults
*/
  function render(component, {to = 'body', type = 'div', position = 'append', state={}, props = {}, plugin = {}, events = {}, className='vibe'} = {} ) {
    // If to is a string and not and existing node i.e. an id or class we must query for it.
    let towhere = to;
    if (!isElement(towhere)) {
      towhere = document.querySelector(to);
    }


    if (isFunction(component)) {
      const el = component();
      // TODO what else do we need here, anything?
      if (isDocument) {
      }

      // attach all functions from Vibe to newComponent as $ and call by $.fname
      const newComponent = document.createElement(`${type}`);
      newComponent.$ = new Vibe(newComponent);
      // / for attaching functions and objects declared in the component's return obj
      if (el.template && el.template.length) {
        newComponent.innerHTML = el.template;
      }

      if (el.className && el.className.length) {
        newComponent.classList.add(el.className);
      }
      // Add class names passed in from render obj
      newComponent.classList.add(className);


      // Access plugins by self.$plugin.name(); sent in by component OR render but not both
      newComponent.$plugin = plugin; // the passed in plugins from render

      if (el.fn) {
        if (Object.keys(el.fn).length > 0) {
          newComponent.$fn = el.fn; // The passed in fn obj
        }
      }

      newComponent.$props = props; // The passed in props obj
      newComponent.$self = newComponent;

      // The state if passed in via component OR by render
      if (el.state) {
        newComponent.$state = el.state;
        newComponent.$origState = el.state;
      } else {
        newComponent.$state = state;
        newComponent.$origState = state;
      }


      // The passed in events/on obj from component
      // For each item in on obj, create events
      if (el.events) {
        if (Object.keys(el.events).length > 0) {
          newComponent.$event = el.events;
          for (const i in newComponent.$event) {
            newComponent.addEventListener(i, newComponent.$event[i], true);
          }
        }
      }
      // Process any events that render obj sent in
      if (Object.keys(events).length > 0) {
        newComponent.$event = events;
        for (const i in newComponent.$event) {
          newComponent.addEventListener(i, newComponent.$event[i], true);
        }
      }

      newComponent.id = uuidv4();


      if (isElement(towhere)) {
        ready(mount(newComponent, towhere, position));
        newComponent.$mountedTo = to;
      } else {
        // A fallback - Poll until towhere element exists
        // Poll will terminate with error after 6 second time limit
        let inc = 0;
        const intv = setInterval(function() {
          inc++;
          if (isElement(towhere)) {
            ready(mount(newComponent, towhere, position));

            newComponent.$mountedTo = to;
            clearInterval(intv);
          }

          if ( inc > 60) { // Approx six seconds
            clearInterval(intv);
            throw new Error(`Whoops! could not mount to ${to} element.`);
          }
        }, 100); // End poll
      }

      // This call to the component's init must run after loading to DOM

      if (isFunction(el.init)) {
        // el.init(newComponent); we could do this but if we want to rerun init later on newComponent make it available
        newComponent.init = el.init;
        ready(newComponent.init(newComponent));
      }


      return newComponent;

      // Component is not a function
    } else {
      // The passed in component is not a function but an existing element
      // Note: existing elements must pass in fn, events, plugins, className, state via render obj
      // because there is no function/obj to get them from
      if (component.nodeType === 1) {
        component.$ = new Vibe(component);

        // Access plugins by self.$plugin.name();
        component.$plugin = plugin; // The passed in plugins  can only come from render obj on existing elements

        component.classList.add(className);

        component.$props = props; // The passed in props obj
        component.$self = component;
        component.$state = state;
        component.$origState = state;


        // The passed in events from render obj
        // For each item in on obj, create events
        if (Object.keys(events).length > 0) {
          component.$event = events;
          for (const i in component.$event) {
            component.addEventListener(i, component.$event[i], true);
          }
        }

        // Existing elements may have an id and if so use that instead
        if (!component.id) {
          component.id = uuidv4();
        }
        return component;
      }
      // Process component as an html string
      else if (isString(component) ) {
        let newComponent = null;
        // NOTE this does not check if it's valid html and attributes are stripped <invalid></invalid> will work and any desired attributes aside from the id must be added later or via component methods!
        // NOTE: events,fn,plugins,className state must be passed in via render obj
        if (isHTML(component)) {
          let newhtml;
          newhtml = isHTML(component, true);
          newComponent = document.createElement(`${newhtml[0]}`);
          newComponent.innerHTML = newhtml[1];
        } else {
          newComponent = document.createElement(`${type}`);
          newComponent.innerHTML = component;
        }

        newComponent.$ = new Vibe(newComponent);
        if (Object.keys(fn).length > 0) {
          newComponent.$fn = fn; // The passed in fn obj via render
        }

        newComponent.$props = props; // The passed in props obj via render
        newComponent.$self = newComponent;
        newComponent.$obj = newComponent.$;
        newComponent.classList.add(className);
        newComponent.$state = state;
        newComponent.$origState = state;
        newComponent.$plugin = plugin; // The passed in plugins oj just like fn

        // The passed in events/on obj
        // For each event in on obj, create events
        if (Object.keys(events).length > 0) {
          newComponent.$events = events;
          for (const i in newComponent.$events) {
            newComponent.addEventListener(i, newComponent.$events[i], true);
          }
        }


        newComponent.id = uuidv4();
        ready(mount(newComponent, towhere, position));
        return newComponent;
      }
    }
  } // End render


  /**
* mount
* MOUNT
* @description Internal function mounts an element to another element
* @return this
*/

  function mount(newComponent, towhere, position ) {
    switch (position) {
      case 'after':
        newComponent.$insertAfter(towhere);
        break;

      case 'before':
        newComponent.$insertBefore(towhere);
        break;

      case 'prepend':
        newComponent.$prependTo(towhere);
        break;

      default:
        newComponent.$appendTo(towhere);
        break;
    }
    return this;
  }


  /*  EVENTS */


  /**
* on
* ON
* @description Adds an event to an element
* @return this
*/
  function on(etype = 'mousedown', handler, cap = false) {
    let userCap = cap;
    // If cap is sent in as boolean then set capture to true
    if (typeof(cap) === 'boolean') {
      if (cap) {
        userCap = {
          'capture': true,
        };
      } else {
        userCap = {
          'capture': false,
        };
      }
    }
    // Note do e.preventDefault() in the handlier
    const types = etype.split(',');
    for (let t of types) { // Let here instead of const because t is immediately mutated
      t = t.trim();
      $self.addEventListener(t, handler, userCap);
    }
    return this;
  }


  /**
* removeEvent / off
* REMOVEEVENT OFF
* @description Triggers an event
* @return this
*/
  function removeEvent(etype = 'mousedown', handler, cap = false) {
    const y = $self;
    let userCap = cap;
    // If cap is sent in as boolean then set capture to true
    if (typeof(cap) === 'boolean') {
      if (cap) {
        userCap = {
          'capture': true,
        };
      } else {
        userCap = {
          'capture': false,
        };
      }
    }

    const types = etype.split(',');
    for (const t of types) {
      y.removeEventListener(t, handler, userCap);
    }
    return this;
  }


  /**
* trigger
* TRIGGER
* @description Triggers an event
* @return collection
*/
  function trigger(e) {
    const y = $self;
    const ev = new Event(e);
    y.dispatchEvent(ev, {
      'bubbles': true,
      'cancelable': true,
    });
    return this;
  }


  /*  DOM functions */

  /**
* select
* SELECT
* @description select elements of another element optionionally vibe them
* @return collection or false if none
*/

  function select(str, {all = false, vibe = true, fn = false} = {} ) {
    if (!all) {
      // Only return first
      let single = false;
      if (str.startsWith('#')) {
        str = str.replace(/#/, '');
        single = document.getElementById(str);
      } else {
        single = $self.querySelectorAll(str)[0];
      }

      if (single) {
        if (vibe) {
          single.$ = Vibe().render(single);
        }

        if (isFunction(fn)) {
          fn(single);
        }
        return single;
      } else {
        return false;
      }
    } else {
      const collection = $self.querySelectorAll(str);
      if (collection.length) {
        if (vibe) {
          collection.forEach((e) => {
            e.$ = Vibe().render(e);
          });
        }

        if (isFunction(fn)) {
          collection.forEach( (c) => {
            fn(c);
          });
        }

        return collection;
      } else {
        return false;
      }
    }
  }


  /**
* rpx
* RPX
*@description  Remove px, %, em from a number
* @return  number
*/
  function rpx(s) {
    s = s.toString();
    s = s.replace(/px/g, '');
    s = s.replace(/%/g, '');
    s = s.replace(/em/g, '');

    s = Math.round(Number(s));

    return s;
  }


  /**
* cs
* CS
* @description  Get computed styles of element
* @return computed stryles of an element
*/
  function cs(prop, trim = false) {
    let cs = getComputedStyle($self).getPropertyValue(prop) || null;
    if (trim) {
      try {
        cs = rpx(cs);
      } catch (e) {
        console.error(e);
      }
    }
    return cs;
  }


  /**
* rect
* RECT
* @description  Get dimensions of element
* @return an element for use by
*/
  function rect(st = false, round = false) {
    const allow = ['x', 'y', 'width', 'height', 'right', 'left', 'top', 'bottom'];
    if (!allow.includes(st)) {
      return null;
    }

    const ret = $self.getBoundingClientRect()[st];

    if (round) {
      return Math.round(ret);
    } else {
      return ret;
    }
  }


  /**
* procHTML
* PROCHTML
*@description Internal function for isHTML - Process html by creating a node of type s
* @return an element
*/
  function procHTML(s) {
    // create a wrapper so we can turn HTML string into a node
    const el = document.createElement(s[0]);
    el.innerHTML = s[1];
    return el;
  }

  /**
* isHTML
* ISHTML
* @description Check if string is html return true or false or tag name if t is true
* @returns this to maintain chain
*/

  function isHTML(str, t = false) {
    // if t is true return the tag name and the html
    const doc = new DOMParser().parseFromString(str, 'text/html');
    if (t) {
      return [doc.body.childNodes[0].tagName.toLowerCase(), doc.body.childNodes[0].innerHTML];
    } else {
      return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1); // should be true if HTML
    }
  }

  /**
* text
* TEXT
* @description Get or set text
* @return this to maintain chain
*/
  function text(str = false) {
    if (isDocument) {
      return this;
    }
    if (!str) {
      return $self.textContent;
    } else {
      $self.textContent = str;
      return this;
    }
  }


  /**
* html
* HTML
* @description Get or set html
* @return this to maintain chain
*/
  function html(str = false) {
    if (isDocument) {
      return this;
    }
    if (!str) {
      return $self.innerHTML;
    } else {
      $self.innerHTML = str;
      return this;
    }
  }


  /**
* after
* AFTER
* @description Insert element after another
* @return this to maintain chain
*/
  function after(str) {
    __beforeOrAfter(str);
    return this;
  }


  /**
* before
* BEFORE
* @description Insert element before another
* @return this to maintain chain
*/
  function before(str) {
    __beforeOrAfter(str, true);
    return this;
  }


  /**
* insertBefore
* INSERTBEFORE
* @description Insert element before another
* @return this to maintain chain
*/
  function insertBefore(str) {
    __beforeOrAfter(str, true, true);
    return this;
  }


  /**
* insertAfter
* INSERTAFTER
* @description Insert element after another
* @return this to maintain chain
*/
  function insertAfter(str) {
    __beforeOrAfter(str, false, true);
    return this;
  }

  /**
* _beforeOrAfter
* _BEFOREORAFTER
* @description internal function for insertAfter etc.
* @return this to maintain chain
*/
  function __beforeOrAfter(str, p = false, I = false) {
    if (isDocument) {
      return this;
    }
    const y = $self;
    if (isString(str)) {
      // Only append to first one found
      let to;
      if (isHTML(str)) {
        to = procHTML(isHTML(str, true), true);
        if (!to) {
          return this;
        } // Break out of for if to does not exist
      } else {
        to = document.querySelectorAll(str)[0];
        if (!to) {
          return this;
        } // Break out of for if to does not exist
      }
      if (p) {
        if (I) {
          to.before(y);
        } else {
          y.before(to);
        }
      } else {
        if (I) {
          to.after(y);
        } else {
          y.after(to);
        }
      }
    }
    if (isElement(str)) {
      if (p) {
        if (I) {
          str.before(y);
        } else {
          y.before(str);
        }
      } else {
        if (I) {
          str.after(y);
        } else {
          y.after(str);
        }
      }
    }
    return this;
  }

  /**
* append
* APPEND
* @description Append text or element to another
* @return this to maintain chain
*/
  function append(str, p = false) {
    if (isDocument) {
      return this;
    }
    const y = $self;
    if (!str) {
      return this;
    }
    if (isString(str)) {
      // Only append to first one found
      let el;
      if (isHTML(str)) {
        el = procHTML(isHTML(str, true), true);
      } else {
        el = str;
      }
      if (p) {
        y.prepend(el);
      } else {
        y.append(el);
      }
    } else {
      if (p) {
        y.prepend(str);
      } else {
        y.append(str);
      }
    }
    return this;
  }


  /**
* prepend
* PREPEND
* @description Prepend text or element to another
* @return this to maintain chain
*/
  function prepend(str) {
    if (isDocument) {
      return this;
    }
    if (!str) {
      return this;
    }
    append(str, true);
    return this;
  }


  /**
* prependTo
* PREPENDTO
* @description Prepend element to another
* @return this to maintain chain
*/
  function prependTo(str) {
    if (!str) {
      return this;
    }


    __To(str, true);
    return this;
  }


  /**
* appendTo
* APPENDTO
* @description Append element to another
* @return this to maintain chain
*/
  function appendTo(str) {
    if (!str) {
      return this;
    }

    __To(str);
    return this;
  }

  /**
* _to
* _TO
* @description internal function for appendTo etc
* @return this to maintain chain
*/
  function __To(str, p = false) {
    if (isDocument) {
      $self = $self.body;
    }
    const y = $self;
    if (isString(str)) {
      // Only append to first one found
      const to = document.querySelectorAll(str)[0];
      if (!to) {
        return this;
      }
      if (p) {
        to.prepend(y);
      } else {
        to.append(y);
      }
    }
    if (isElement(str)) {
      if (p) {
        str.prepend(y);
      } else {
        str.append(y);
      }
      return this;
    }
  }


  /**
* CSS
* @description set the inline css of an element
*@return this and is chainable
*/
  function css(str, {add=true}={} ) {
    if (isDocument) {
      return this;
    }
    if (!str) {
      return this;
    }
    if (!add) {
      $self.style.cssText = str;
    } else {
      $self.style.cssText = $self.style.cssText + str;
    }
    return this;
  }


  /**
* CREATENODE
* @description creates a new node
*@return create node
 */
  function createNode(nodetype = 'div', {
    override = false,
    position = false,
    to = false,
  } = {}) {
    const allowedNodes = ['html', 'head', 'link', 'meta', 'script', 'style', 'title', 'body', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main', 'nav', 'section', 'blockquote', 'div', 'figure', 'hr', 'li', 'ol', 'p', 'pre', 'ul', 'a', 'code', 'data', 'time', 'em', 'i', 'span', 'strong', 'audio', 'source', 'img', 'track', 'video', 'iframe', 'svg', 'canvas', 'noscript', 'col', 'colgroup', 'button', 'option', 'fieldset', 'label', 'form', 'input', 'select', 'textarea', 'menu', 'template'];

    if (!allowedNodes.includes(nodetype)) {
      if (!override) { // You can send in an element not in the list by setting override to true (think custom elements that are properly defined)
        nodetype = 'div';
      }
    }

    const newnode = document.createElement(nodetype);
    const node = newnode;
    node.$ = Vibe().render(newnode);

    if (!to) {
      to = $self;
    }


    // If we call $vibe.createNode('div') then just return the node so user can manually insert the node

    if (isDocument && !to) {
      return node;
    }
    if (!isElement(to)) {
      to = document.querySelector(to);
    }


    // If $self is the document add created nodes to the body
    if (isDocument) {
      if (!to) {
        to = document.body;
      }
      if (position) {
        if (position !== 'prepend') {
          if (position !== 'append') {
            position = 'append';
          }
        }
      }
    }
    if (position && to) { // Nodes are only inserted to dom if position is provided
      switch (position) {
        case 'after':
          node.$insertAfter(to);
          break;

        case 'before':
          node.$insertBefore(to);
          break;

        case 'prepend':
          node.$prependTo(to);
          break;

        default:
          node.$appendTo(to);
          break;
      }
      return node;
    } else {
      return node;
    }
  } // End createNode


  /**
* detach
* DETACH
* @description Remove a node from the DOM and save a reference to a clone if keep flag is set for re-insertion
*@return Clone with original id for re-insertion if keep=true otherwise returns this and is chainable
*/
  function detach( keep=false ) {
    // Dont remove document
    if (isDocument) {
      return this;
    }

    // If keep is true return a ref to clone for re-insertion
    let clone = false;
    let id ='';
    if (keep) {
      id = $self.id;
      clone = $self.cloneNode(true);
    }
    $self.remove();
    if (keep) {
      clone.$ = new Vibe(clone);
      clone.id = id;
      return clone;
    } else {
      return this;
    }
  }

  /**
* clone
* CLONE
* @description Clone a node
*@return clone with new id
*/
  function clone( {to=false, position='append'} = {} ) {
    // Don't clone  document
    if (isDocument) {
      return this;
    }

    const clone = $self.cloneNode(true);
    clone.$ = new Vibe(clone);
    clone.id = uuidv4();
    if (to) {
      if (!isElement(to)) {
        to = document.querySelector(to);
      }
      ready(mount(clone, to, position));
    }
    //  Return a ref to clone for re-insertion
    return clone;
  }


  /**
* addClass
* ADDCLASS
* @description Add to an element's class list
@return this
*/
  function addClass(s, r = false) {
    if (isDocument) {
      return this;
    }
    const y = $self;
    if (!r) {
      y.classList.add(s);
    } else {
      y.classList.remove(s);
    }
    return this;
  }

  /**
* removeClass
* REMOVECLASS
* @description remove a class from element's class list
@return this
*/
  function removeClass(s) {
    if (isDocument) {
      return this;
    }
    addClass(s, true); // Call addClass with remove option
    return this;
  }

  /**
* removeAttr
* REMOVEATTR
@return this
*/
  function removeAttr(str) {
    if (isDocument) {
      return this;
    }
    attr(str, false, true);
    return this;
  }

  /**
* attr
* ATTR
* set or return attr
@return this or attr
*/
  function attr(str, s = false, r = false) {
    if (isDocument) {
      return this;
    }
    const y = $self;
    if (str && isString(str)) {
      if (r) {
        y.removeAttribute(str);
        return this;
      }


      if (isString(s) || typeof(s) === 'number') {
        y.setAttribute(str, s);
        return this;
      }
      if (!s) {
        const a = y.getAttribute(str);
        return a;
      }
    }
  }

  /**
* dataset
* DATASET
* @description set or return data
@return this  dataset if document
*/
  function dataset() {
    if (isDocument) {
      return this;
    }
    return $self.dataset;
  }

  /**
* _data
* _DATA
* @description set or return data-attrs
@return {primitive}
*/
  function data(a, r='set') {
    const e = $self;
    if (isDocument) {
      return this;
    }
    if (r === 'remove' ) {
      e.removeAttribute('data-'+a);
    }
    if (r === 'set') {
      e.setAttribute('data-'+a, a);
    }


    if (r === 'get') {
      return e.getAttribute('data-'+a);
    }
  }


  /**
* parents
* PARENTS
* @description returns all parents and grandparents of $self and optionally vibes them and run functions on them
* @return {Array}
*/
  function parents( {str=false, fn=false, vibe=false, match=false} ) {
    let stk = [];
    let matcharr;
    let els = $self;
    // only parents that match selector string
    if (isString(match)) {
      matcharr = match.split(',');
      while (els = els.parentElement) {
        matcharr.forEach((m) => {
          m = m.trim();
          if (els.matches(m) && !stk.includes(els) ) {
            stk.push(els);
            console.log(els.classList);
          }
        });
      }
    }
    // all parents
    if (!match) {
      while (els = els.parentElement) {
        stk.push(els);
      }
    }
    // if stk has anything in it
    if (stk.length) {
      // make stack unique  since elements could have the same parent
      stk = stk.filter((x, i, a) => a.indexOf(x) == i);


      // vibe any matching parents
      if (vibe) {
        for ( const y of stk) {
          y.$ = new Vibe(y);
        }
      }
      // Run the function any matching parents
      if (isFunction(fn)) {
        for ( const y of stk) {
          fn(y);
        }
      }
    }
    return stk;
  }


  /**
* children
* CHILDREN
* @description returns all children and grandchildren of $self and optionally vibes them and run functions on them
* @return {Array}
*/
  function children( {match=false, fn=false, vibe=false} ) {
    const stk = [];

    let matcharr;

    const els = $self;
    const col = $self.getElementsByTagName('*');

    // only parents that match selector string
    if (isString(match)) {
      matcharr = match.split(',');

      for ( const y of col) {
        matcharr.forEach((m) => {
          m = m.trim();
          if (y.matches(m) ) {
            stk.push(els);
          }
        });
      }
    }
    // all parents
    if (!match) {
      for ( const y of col) {
        stk.push(y);
      }
    }
    // if stk has anything in it
    if (stk.length) {
      // vibe any matching children
      if (vibe) {
        for ( const y of stk) {
          y.$ = new Vibe(y);
        }
      }

      // Run the function any matching children
      if (isFunction(fn)) {
        for ( const y of stk) {
          fn(y);
        }
      }
    }
    return stk;
  }


  /*  Utility functions */

  /**
* isString
* ISSTRING
* @description check if string is a string
* @return boolean
*/
  function isString(thing) {
    return typeof thing === 'string';
  }

  /**
* isNumber
* ISNUMBER
* @description check if string is a number
* @return boolean
*/
  function isNumber(value) {
    return /^-{0,1}\d+$/.test(value);
  }


  /**
* isInt
* ISINT
* @description check if parameter is a an integer
* @return boolean
*/
  function isInt(value) {
    const er = /^-?[0-9]+$/;
    return er.test(value);
  }

  /**
* isFunction
* ISFUNCTION
* @description check if parameter is a function
* @return boolean
*/
  function isFunction(thing) {
    return typeof thing === 'function';
  }

  /**
* isObject
* ISOBJECT
* @description check if parameter is an object
* @return boolean
*/
  function isObject(thing) {
    // arrays are objects too so use isArray if you want to find arrays
    return typeof thing === 'object';
  }

  /**
* isElement
* ISELEMENT
* @description check if parameter is a DOM element
* @return boolean
*/
  function isElement(thing) {
    // arrays are objects too so use isArray if you want to find arrays
    return isObject(thing) && thing.nodeType == 1;
  }


  /**
* isArray
* ISARRAY
* @description check if parameter is an array
* @return boolean
*/
  function isArray(thing) {
    if (Array.isArray(thing)) {
      return true;
    } else {
      return false;
    }
  }


  /**
* uuidv4
* UUIDV4
* @description generate uuidv4 id string
* @return string
*/
  function uuidv4() {
    if (isObject(crypto)) {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16) );
    } else {
      // non crypto uuid just in case crypto not available
      let d = new Date().getTime();
      let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });
    }
  }

  /**
* filterString
* FILTERSTRING
* @description generate uuidv4 id string
* @return string
*/

  function filterString(str, strict=false) {
    str = str.replace(/[^\x20-\x7E]+/g, '');
    if (strict) {
      str = str.replace(/[^a-z0-9-#]+|\s+/gmi, '');
    }
    str = str.trim();
    return str;
  }


  /**
* id
* ID
* @description get this element's id
* @return id
*/
  function id() {
    if (isDocument) {
      return this;
    }
    return $self.id;
  }


  /**
* addplug
* ADDPLUG
* @description Not recommended for use the prefered way to add a plug is component level or at component render obj
* @return this
*/
  function addplug(fn) {
    if (isFunction(fn)) {
      const name = fn.name;

      if (isDocument) {
      // document.plugins[name] = fn;
        document.$plugin[name] = fn;
      } else {
        $self.$plugin[name] = fn;
      }
    }
    return this;
  }

  /**
* run
* @description run a function
* @return this
*/
  function run(fn) {
    if (isFunction(fn)) {
      fn($self);
    }
    return this;
  }

  /**
* setState
* SETSTATE
* @description set state of $self
* @return obj
*/
  function setState(obj ={}) {
    if (isDocument) {
      return this;
    }
    $self.$state = obj;
  }

  /**
* getState
* GETSTATE
* @description get state of $self
* @return obj
*/
  function getState(str) {
    if (isDocument) {
      return this;
    }
    return $self.$state[str];
  }


  /**
* observe
* OBSERVE
* @description observer generator
* @return obj
*/
  function observe(fn, name = 'name', {delay=10, child=true, attr=true, subtree=false, attrs=['none'], chardat=false, attrsOV=false, chardatOV=false} ) {
    // keep a record of observers in an object of global var or component so we can disconnect them later

    if (typeof(fn) !== 'function') {
      return;
    }
    // configuration of the observer
    const config = {
      childList: child,
      attributes: attr,
      characterData: chardat,
      subtree: subtree,
      attributeFilter: attrs,
      attributeOldValue: attrsOV,
      characterDataOldValue: chardatOV,
    };


    // create an observer instance
    const e = $self;
    const ob = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // handle attributes seperately if passed in i.e if you dont pass any attrs in then it will only spy on DOM/node changes

        if (mutation.type === 'attributes') {
          if (attrs[0] !== 'none') {
            setTimeout(() => {
              fn(e);
            }, delay);
          }
        } else {
          if (attrs[0] === 'none') {
            if (mutation.type === 'childList' || mutation.type === 'subtree' || mutation.type === 'characterData' ) {
              setTimeout(() => {
                fn(e);
              }, delay);
            }// end childList
          }
        }
      });
    });


    // debug to see data attributes that hold the name of observer on the element itself
    // let checkob = Object.keys($self.$observers);
    // let i = '';
    // if(checkob.length){
    // i = checkob.length + 1
    // }
    //    $self.$attr(`data-observer${i}`, `${name}`);


    // observers with the same name are overwritten
    if ($self.$observers[name]) {
      $self.$observers[name].disconnect();
      delete $self.$observers[name];
    }
    // add to $observers object, pass in target nodes, and observer config
    $self.$observers[name] = ob;
    $self.$observers[name].observe($self, config);
    const ok = Object.keys($self.$observers);

    return this;
  }// end observe


  /**
* unobserve
* UNOBSERVE
* @description unobserve element
*/

  function unobserve(name='name') {
    // disconnect all
    if (name === 'all') {
      const ok = Object.keys($self.$observers);
      for (const o of ok) {
        delete $self.$observers[o];

        o.disconnect();
      }
    } else {
      if ($self.$observers[name]) {
        $self.$observers[name].disconnect();
        delete $self.$observers[name];
      }
    }
    return this;
  }


  /**
* getobservers
* GETOBSERVERS
* @description Get list of observers
* @return {array}
*/
  function getobservers() {
    const ok = Object.keys($self.$observers);
    return ok;
  }

  /**
* get
* GET
* @description Fetch data from URL via GET
* @return {object}
 */
  async function get( {url = false, type = 'json', fn=false, e={}} = {} ) {
    const response = await fetch(url);
    let data;
    if (type == 'json') {
      data = await response.json();
    }
    if (type == 'text') {
      data = await response.text();
    }

    if (isFunction(fn)) {
      fn(data, e);
    }
  }


  /**
* post
* POST
* @description post data to URL via POST
* @return {object}
 */
  function post({url=false, type='text', body=false, contentType='application/x-www-form-urlencoded', fn=false}={}) {
    // If contentType is urlencoded (default) you must formulate your body as a query string like:
    // body = `title=${title}&blurb=${blurb}&image=${img}&link=${link}&admin=${adminval}`;
    // Each template string variable like ${title} must be encoded like: let title = encodeURIComponent('New Pirate Captain');
    // Which can also be done inline like:
    // body = 'title=' + encodeURIComponent('New Pirate Captain') + '&body=' + encodeURIComponent('Arrrrrr-ent you excited?') + '&userID=3';

    $self.isPost = false;
    if (!url || !body) {
      return false;
    }

    fetch(url, {

      headers: new Headers({
        'Content-Type': `${contentType}`, // <-- Specifying the Content-Type
      }),
      method: 'post',
      body: body,


    }).then(function(response) {
      if (response.ok) {
        if (type === 'json') {
          return response.json();
        } else {
          return response.text();
        }
      }
      return Promise.reject(response);
    }).then(function(data) {
      // console.log(data);
      $self.isPost = true; // for checking if post was a sucess
      if (isFunction(fn)) {
        fn(data); // run fn on data
      }
    }).catch(function(error) {
      console.warn('Something went wrong.', error);
    });
  } // End post


  /**
* isTouch
* @description is touch device?
*@return {boolean}
*/
  function isTouch() {
    return window.matchMedia('(pointer: coarse)').matches || false;
  }

  /**
 *hidekbd
* @description hides the keyboard on mobile devices for use when touching elements that are editable but you don't want the keyboard to show
*@return {object}
*/
  function hidekbd() {
    setTimeout(function() {
      $self.onfocus = blur(); // close the keyboard
    }, 100);
    return this;
  }


  /**
 *requestInterval
 *REQUESTINTERVAL
* @description replacement for setInterval for smooth animations
* @return {object}
* @usage
* intv = requestInterval(function(){console.log('interval1')},2000);
* intv.clear()
*/
  window.requestInterval=function(callback, delay) {
    const dateNow=Date.now;
    const requestAnimation=window.requestAnimationFrame;
    let start=dateNow();
    let stop;
    var intervalFunc=function() {
      dateNow()-start<delay||(start+=delay, callback());
      stop||requestAnimation(intervalFunc);
    };
    requestAnimation(intervalFunc);
    return {
      clear: function() {
        stop=1;
      },
    };
  };

  /**
 *fadein
 *FADEIN
* @description fade in an element with speed in milliseconds and an option display setting to end with
*@return {object}
*/
  function fadeIn({display='block', speed=300}={}) {
    function f() {
      const cdisp = $self.$cs('display');
      // start out hidden;
      $self.$css(`display: ${cdisp}; visibility: visible; opacity: 0.0;`, {add: true});

      $self.$css(`display: ${display}; visibility: visible;`, {add: true});

      let opa = 0;
      // let intv = setInterval(function(){
      const intv = requestInterval(function() {
        opa++;
        if (opa <= 9) {
          $self.$css(`opacity: 0.${opa} `, {add: true});
        } else {
          opa=1;
          $self.$css(`opacity: ${opa} `, {add: true});
          $self.$isrun = false;
          $self.$runq();
          // clearInterval(intv);
          intv.clear();
        }
      }, speed);
    }


    $self.$q.push(f);
    // gotta kickit off
    if ($self.$q.length) {
      $self.$runq();
    }

    return this;
  } // end fadeIn


  /**
 *fadeOut
 *FADEOUT
* @description fade out an element with speed in milliseconds and an option display setting to end with
*@return {object}
*/
  function fadeOut({display='block', speed=300}={}) {
    function f() {
      const cdisp = $self.$cs('display');
      // start out visible;
      $self.$css(`display: ${cdisp}; visibility: visible; opacity: 1;`, {add: true});

      $self.$css(`display: ${display}; visibility: visible;`, {add: true});

      let opa = 1;
      // let intv = setInterval(function(){
      const intv = requestInterval(function() {
        if (opa > 0.1) {
          opa -= 0.1;
          opa = opa.toFixed(2);
          // console.log('opa is '+opa);
          $self.$css(`opacity: ${opa} `, {add: true});
        } else {
          opa=0;
          $self.$css(`opacity: ${opa} `, {add: true});
          $self.$isrun = false;
          $self.$runq();
          // clearInterval(intv);
          intv.clear();
        }
      }, speed);
    }

    $self.$q.push(f);
    // gotta kickit off
    if ($self.$q.length) {
      $self.$runq();
    }

    return this;
  } // end fadeOut


  /**
*show
*show
* @description show and element
*@return {object}
*/
  function show() {
    $self.$fadeIn({speed: 1});
    return this;
  }


  /**
*hide
*HIDE
* @description hide and element
*@return {object}
*/
  function hide() {
    $self.$fadeOut({speed: 1});
    return this;
  }


  /**
*delay
*DELAY
* @description delay exection of next chained function and run optional funtion
*@return {object}
*/
  function delay( {time=1000, fn=false}) {
    function f() {
      // console.log('running delay func')
      // console.log(`running delay func ${fn.name}`)
      const d = new Date();
      const fut = d.getTime()+time;
      // console.log(`d is ${d.getTime()} fut is ${fut}`)
      // let intv = setInterval(function(){
      const intv = requestInterval(function() {
        const newd = new Date();
        if (newd.getTime() >= fut) {
          // console.log('I was delayed')
          if (isFunction(fn)) {
            fn($self);
          }
          $self.$isrun = false;
          $self.$runq();
          // clearInterval(intv)
          intv.clear();
        }
      }, 1);
    }
    $self.$q.push(f);
    // gotta kickit off
    if ($self.$q.length) {
      $self.$runq();
    }


    return this;
  }


  /**
*queue
*queue
* @description A add a function to the queue (uses delay to do it)
*@return this
*/
  function queue(fn, time=1) {
    if (isFunction(fn)) {
      $self.$delay( {time: time, fn: fn});
    }
    return this;
  }


  /**
*runq
*RUNQ
* @description A poorman's queue - each chained function that calls run must set $self.isrun to false when done running
*@return null
*/
  function runq() {
    let fn;
    if (!$self.$isrun) {
      $self.$isrun = true;
      fn = $self.$q.shift();
      if (isFunction(fn)) {
        fn($self);
        runq();
      }
    }
    return null;
  }


  /**
* getAtPt
* GETATPT
* @description Get element at ix, y coords
*@return {boolean}
*/
  function getAtPt(x, y) {
    return document.elementFromPoint(x, y);
  }


  /**
* pager
* PAGER
* @description Get page from url
*@return {string}
*/
  function pager(num=0) {
    let upath = window.location.pathname;
    const fullpath = upath;
    upath = upath.split('/');
    const path = upath[num];
    if (path.length && num > 0) {
      return path;
    } else {
      return fullpath;
    }
  }


  /**
* isTouching
* ISTOUCHING
* @description Is div1 touching div2?
*@return {boolean}
*/
  function isTouching({el=false, el2=false}) { // el2 is self if omitted
    if (isDocument && !el2) { // you might want to call this with 2 params not on vibed (this lets you) OR with vibed elements where both params are not $self
      return this;
    }
    if (!el2) {
      el2=$self;
    }
    const elRect = el.getBoundingClientRect();
    const el2Rect = el2.getBoundingClientRect();

    return !(
      ((elRect.top + elRect.height) < (el2Rect.top)) ||
      (elRect.top > (el2Rect.top + el2Rect.height)) ||
      ((elRect.left + elRect.width) < el2Rect.left) ||
      (elRect.left > (el2Rect.left + el2Rect.width))
    );
  }


  /**
* drag
* DRAG
* @description Make elements dragabble, Example: myRef.$drag({draghandle: '.draggable', contain: '.maindrawn', drop: '.stop', dropfn: dropfn}); - where dropfn exists as:
*   function dropfn({dragee=false, dropee=false} ){  console.log('DROPPED '+dragee.$text());  }
*@return {object}
*/
  function drag({draghandle=false, contain='body', dropfn=false, drop=false, zIndex=1} = {} ) {
    const dragee = $self;
    let active = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    const containment = document.querySelectorAll(contain)[0];
    const parentContainer = dragee.parentNode || dragee.parentElement; // for dragEnd
    const dragItem = dragee;
    let dropEl;
    if (drop && isString(drop) ) {
      dropEl = document.querySelector(drop);
    }

    parentContainer.addEventListener('touchstart', dragStart, false);
    parentContainer.addEventListener('touchend', dragEnd, false);
    parentContainer.addEventListener('touchmove', doDrag, false);

    parentContainer.addEventListener('mousedown', dragStart, false);
    parentContainer.addEventListener('mouseup', dragEnd, false);
    containment.addEventListener('mouseleave', dragEnd, false);
    parentContainer.addEventListener('mousemove', doDrag, false);
    let first = false;
    function dragStart(e) {
      // here we don't set dragee to absolute until dragging begins
      const pos = dragee.$cs('position');
      // console.log(pos);
      if (pos !== 'absolute') {
        dragee.$css('position: absolute;');
      }
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        if (!first) { // for future use on first click/touch
          first = true;
          initialX = e.clientX - xOffset;
          initialY = e.clientY - yOffset;
        // console.log(xOffset);
        } else {
          initialX = e.clientX - xOffset;
          initialY = e.clientY - yOffset;
        }
      }

      if (e.target.matches(draghandle) || !draghandle) {
        e.target.style.cssText = 'user-select: none; cursor: pointer;';
        active = true;
      }
      //   setTranslate(xOffset, yOffset, dragItem);
      setTranslate(currentX, currentY, dragItem);
    }

    function dragEnd(e) {
      // console.log('etype '+e.type)
      initialX = currentX;
      initialY = currentY;
      if (dropEl && dragee.$isTouching({el: dropEl}) && active) {
        dropfn({dragee: $self, dropee: dropEl} );
        active = false;
      }
      active = false;

      setTranslate(currentX, currentY, dragItem);
    }

    function doDrag(e) {
      if (active) {
        e.preventDefault();

        if (e.type === 'touchmove') {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          // console.log('currentX '+currentX)
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, dragItem);
        // setTranslate(xOffset, yOffset, dragItem);
      }
    }

    function setTranslate(xPos, yPos, el) {
      // console.log('xPos '+xPos)
      el.style.transform = 'translate3d(' + xPos + 'px, ' + yPos + 'px, 0)';
    }
    return this;
  } // End drag


  function swipe({node=$self, drop=false, dropfn=false, upfn=false, downfn=false, leftfn=false, rightfn=false} = {}) {
    // TODO do the directional fns  and send in $self to them

    const container = node;
    container.addEventListener('touchstart', startTouch, false);
    container.addEventListener('touchmove', moveTouch, false);

    // Swipe Up / Down / Left / Right
    let initialX = null;
    let initialY = null;

    function startTouch(e) {
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;
    };

    function moveTouch(e) {
      if (initialX === null) {
        return;
      }

      if (initialY === null) {
        return;
      }

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const diffX = initialX - currentX;
      const diffY = initialY - currentY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
      // sliding horizontally
        if (diffX > 0) {
        // swiped left
          if (isFunction(leftfn)) {
            leftfn(node);
          }
        } else {
        // swiped right
          if (isFunction(rightfn)) {
            rightfn(node);
          }
        }
      } else {
      // sliding vertically
        if (diffY > 0) {
        // swiped up
          if (isFunction(upfn)) {
            upfn(node);
          }
        } else {
        // swiped down
          if (isFunction(downfn)) {
            downfn(node);
          }
        }
      }

      initialX = null;
      initialY = null;

      e.preventDefault();
    };

    return this;
  }// End swipe


  /**
* load
* LOAD
* @description Run fn on window load
*@return this
*/
  function load(fn) {
    if (isFunction(fn)) {
      window.addEventListener('load', fn, true);
    }
    return this;
  }


  /**
* scroll
* SCROLL
* @description Run fn on window load
*@return this
*/
  function scroll(fn) {
    if (isFunction(fn)) {
      window.addEventListener('scroll', fn, true);
    }
    return this;
  }


  /**
* w
* W
* @description shortcut for adding and removing events on window
*@return this
*/
  function w(str, fn, remove=false) {
    if (remove) {
      window.removeEventListener(str, fn, true);
    } else {
      window.addEventListener(str, fn, true);
    }
    return this;
  }


  /**
*_pipe
* @description the actual internal pipe function
* @return result
*/
  function _pipe(...fns) {
  // console.log(fns)
    return (arg) => fns.reduce((prev, fn) => fn(prev), arg);
  }


  /**
* pipe
* PIPE
* @description - pipe the result of a function through series of functions
* @usage h1.$pipe({fn:foo}).$pipe({fn:fee}).$pipe({fn: fi}).$pipe({end:true});
* @return function
*/
  function pipe({end=false, fn=()=>{}} = {} ) {
    if (isFunction(fn)) {
      $self.$stream.push(fn);
    }
    if (end) {
      const p = _pipe(...$self.$stream);
      return p();
    } else {
      return this;
    }
  }

  /**
* animate
* ANIMATE
* @description Animate various properties and run optional function on complete
* @return {this}
*/
  function animate( options) {
    // get easing from getEase
    const easing = getEase(options.easing);

    // done
    let done = false;
    if (options.done) {
      done = options.done;
    }


    // directions
    let dir = false;
    let amt = false;
    let unit = false;
    let move;

    if (options.move && isFunction(options.move)) {
      move = options.move;
    }

    if (options.move && !isFunction(options.move)) {
      dir = options.move.dir || 'right';
      amt = options.move.amt || 0;
      unit = options.move.unit || 'px';

      if (dir ==='left') {
        move = function(progress) {
          $self.$css(`left:  -${Math.round(progress * amt)}px`);
        };
      }

      if (dir ==='right') {
        move = function(progress) {
          $self.$css(`left:  ${Math.round(progress * amt)}${unit}`);
        };
      }

      if (dir ==='down') {
        move = function(progress) {
          $self.$css(`top:  ${Math.round(progress * amt)}${unit}`);
        };
      }


      if (dir ==='up') {
        move = function(progress) {
          $self.$css(`bottom:  ${Math.round(progress * amt)}${unit}`);
        };
      }
    } // end if options.move

    // animate opacity

    let opacitydir = false;
    if (options.prop) {
      opacitydir = options.prop.opacity || 'pos';

      if (opacitydir ==='pos') {
        move = function(progress) {
          if (options.prop.to) {
            if (progress >= options.prop.to) {
              progress = options.prop.to;
            }
          }
          $self.$css(`opacity:  ${progress};`);
        };
      }

      if (opacitydir ==='neg') {
        move = function(progress) {
          let opos = $self.$cs('opacity');
          opos -= progress;

          if (options.prop.to) {
            if (opos <= options.prop.to) {
              opos = options.prop.to;
            }
          }
          if (opos <= 0) {
            opos =0;
          }
          $self.$css(`opacity:  ${opos};`);
        };
      }
    } // end opacity


    // All other props besides opacity
    let curamt = 0;
    let punit = '';
    let aprop = 'width';
    let sign = '';
    let apropval = null;
    let transition = null;
    if (options.prop && options.prop.transition) {
      options.prop.opacity = 1; // set this to avoid blink when changing colors
      // console.log(options.prop.transition)
      amt = Number(Math.round(options.duration /1000));

      if (amt < 1) {
        amt =1;
      }

      const tempcolor = $self.$cs(`${options.prop.transition}`) || '#FFF';
      // console.log(tempcolor);

      const fromColor = options.prop.fromColor || tempcolor || '#FFFFFF';
      // console.log(fromColor);
      const toColor = options.prop.toColor || '#FFFFFF';

      // change to function
      function chto(e) {
        e.$css(`${options.prop.transition}: ${toColor}; transition: ${options.prop.transition} ${amt}s;`);
        // console.log(`fromColor ${fromColor} ${options.prop.transition}: ${toColor}; transition: ${options.prop.transition} ${amt}s;`)
      }

      $self.$css(`${options.prop.transition}: ${fromColor};  transition: ${options.prop.transition} ${amt}s;`).$delay({time: options.duration || 1000, fn: chto});
      // console.log(amt)
    } else {
      if (options.prop && !options.prop.opacity) {
        punit = options.prop.unit || 'px';
        transition = options.prop.transition || 'color';
        sign = options.prop.sign || '';
        aprop = Object.entries(options.prop)[0][0] || 'width'; // the prop:
        aprop = aprop.replace(/_/g, '-');
        apropval = Object.entries(options.prop)[0][1] || null;// the prop: value
        curamt = $self.$cs(`${aprop}`, true);
        // console.log('curamt is'+curamt);
        // console.log(aprop)
        move = function(progress) {
          curamt = $self.$cs(`${aprop}`, true);
          let amt;
          // for props with real number/decimals values
          if (!isInt(curamt)) {
            amt = curamt + progress;
            punit = '';
          } else {
            amt = Math.round(curamt + (progress * 2));
          }

          if (amt >= apropval || curamt >= apropval ) {
            amt = apropval;
          }
          $self.$css(`${aprop}:  ${sign}${amt}${punit};`);
        };
      }// end all other props
    }


    const cpos = $self.$cs('position');
    // console.log(cpos)
    // start out change to relative if static - only do this with easing functions
    if (cpos === 'static' && easing) {
      $self.$css(`position: relative;`);
    }

    const start = performance.now();

    requestAnimationFrame(function animate(time) {
    // timeFraction от 0 до 1
      let timeFraction = (time - start) / options.duration;
      if (timeFraction > 1) timeFraction = 1;

      const progress = easing(timeFraction);

      if (options.move && isFunction(options.move)) {
        move($self, progress);
      } else {
        move(progress);
      }

      if (timeFraction < 1) {
        requestAnimationFrame(animate);
      } else {
        if (isFunction(done)) {
          done();
        }
      }
    });
    return this;
  }


  /*
* Begin easing functions
*/

  /**
* getEase
* @description utility to return easing function based on string name
* @return {function}
*/
  function getEase(str) {
    switch (str) {
      case 'bounceEaseOut':
        return bounceEaseOut;
        break;

      case 'quad':
        return quad;
        break;

      case 'cubic':
        return cubic;
        break;


      case 'circ':
        return circ;
        break;


      case 'bounceEaseInOut':
        return bounceEaseInOut;
        break;

      case 'bounce':
        return bounce;
        break;

      // TODO make variants of this with large values in bind
      case 'elastic':
        return elastic.bind(null, 1.5);
        break;

      case 'bow':
        return bow.bind(null, 5.5);
        break;


      default:
        return function() {};
        break;
    }
  }


  /**
* makeEaseOut
* @description Easing utility function
* @return {function}
*/
  function makeEaseOut(timing) {
    return function(timeFraction) {
      return 1 - timing(1 - timeFraction);
    };
  }

  /**
* bounce
* @description Easing utility function
* @return {function}
*/
  function bounce(timeFraction) {
    for (let a = 0, b = 1, result; 1; a += b, b /= 2) {
      if (timeFraction >= (7 - 4 * a) / 11) {
        return -Math.pow((11 - 6 * a - 11 * timeFraction) / 4, 2) + Math.pow(b, 2);
      }
    }
  }

  var bounceEaseOut = makeEaseOut(bounce);

  /**
* makeEaseInOut
* @description Easing utility function
* @return {function}
*/
  function makeEaseInOut(timing) {
    return function(timeFraction) {
      if (timeFraction < .5) {
        return timing(2 * timeFraction) / 2;
      } else {
        return (2 - timing(2 * (1 - timeFraction))) / 2;
      }
    };
  }

  var bounceEaseInOut = makeEaseInOut(bounce);


  /**
* elastic
* @description Easing utility function
* @return {function}
*/
  function elastic(x, timeFraction) {
    return Math.pow(2, 10 * (timeFraction - 1)) * Math.cos(20 * Math.PI * x / 3 * timeFraction);
  }

  /**
* bow
* @description Easing utility function
* @return {function}
*/
  function bow(x, timeFraction) {
    return Math.pow(timeFraction, 2) * ((x + 1) * timeFraction - x);
  }


  /**
* cubic
* @description Easing utility function
* @return {function}
*/
  function cubic(timeFraction) {
    return Math.pow(timeFraction, 5);
  }

  /**
* quad
* @description Easing utility function
* @return {function}
*/
  function quad(timeFraction) {
    return Math.pow(timeFraction, 2);
  }


  /**
* circ
* @description Easing utility function
* @return {function}
*/
  function circ(timeFraction) {
    return 1 - Math.sin(Math.acos(timeFraction));
  }


  /**
* $$
* @description shorthand all in one select to do any of html() css() or other functions to use instead of select with fn
* @usage $vibe.$(obj) OR element.$$('.classname', {func: 'css', val:'color: green; '},);
* @return {function}
*/
  function $({select=false, func='$css', val='display: block;'}={}) {
    if (!select) {
      return;
    } else {
      function fnc(e) {
        e['$'+func](val);
      }
      if (isDocument) {// if called with vibe
        $vibe.select(`${select}`, {all: true, fn: fnc});
      } else {
        $self.$select(`${select}`, {all: true, fn: fnc});
      }
    }
    return this;
  }


  /**
* obj
* RETURN OBJ
* @return {object}
*/
  const obj = {
    fn: fn,
    id: id,
    uuid: uuidv4,
    clone: clone,
    ready: ready,
    get: get,
    post: post,
    css: css,
    isTouch: isTouch,
    rpx: rpx,
    addClass: addClass,
    removeClass: removeClass,
    children: children,
    parents: parents,
    before: before,
    insertBefore: insertBefore,
    insertAfter: insertAfter,
    after: after,
    append: append,
    prepend: prepend,
    select: select,
    attr: attr,
    removeAttr: removeAttr,
    appendTo: appendTo,
    prependTo: prependTo,
    createNode: createNode,
    filterString: filterString,
    dataset: dataset,
    data: data,
    detach: detach,
    render: render,
    addplug: addplug,
    run: run,
    plugin: {},
    doc: document,
    rect: rect,
    mountedTo: false,
    cs: cs,
    on: on,
    observe: observe,
    observers: {},
    unobserve: unobserve,
    getobservers: getobservers,
    off: removeEvent,
    trigger: trigger,
    html: html,
    text: text,
    pager: pager,
    getState: getState,
    setState: setState,
    isFunction: isFunction,
    isObject: isObject,
    isElement: isElement,
    isArray: isArray,
    isString: isString,
    isNumber: isNumber,
    isInt: isInt,
    getAtPt: getAtPt,
    isTouching: isTouching,
    drag: drag,
    swipe: swipe,
    load: load,
    scroll: scroll,
    show: show,
    hide: hide,
    delay: delay,
    queue: queue,
    fadeIn: fadeIn,
    fadeOut: fadeOut,
    q: [],
    runq: runq,
    isrun: false,
    w: w,
    pipe: pipe,
    stream: [],
    animate: animate,
    $: $,
  };

  // This allows you to do Appref.$text()
  // instead of Appref.$.text());
  // use $vibe.funcname with no dollar prefix, only vibed element function calls are prefixed with a dollar

  for (const i in obj) {
    const key = '$'+i;
    $self[key] = obj[i];
  }


  return obj;
}
/* expose as $vibe */
var $vibe = new Vibe(document);

