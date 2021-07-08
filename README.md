
![VibeJS JavaScript Library](images/logo.jpg?raw=true "VibeJS")
See https://vibejs.com for ongoing documentation and info.

# VibeJS
* A small component based JavaScript library to build user interfaces and apps.

## Features
* Small - currently under 14KB minified.
* Create self contained components for composing larger components and apps.
* Optionally access components externally.
* Rendered components receive built-in methods (the Vibe).
* Easy Familiar syntax with built-in chainable DOM manipulation methods.
* Built-in Drag and Drop, Swipe
* Pass in external functions or plugin functions to your rendered components.
* Ability set up custom observers on rendered components.
* Convert any element or HTML string to a Vibe'd element.
* And more ...

## Basic Usage

* Basic usage for manually adding and using VibeJS into a web page. (see **Bundle with Webpack** below for alternate method of use with a bundler)

#### Add Vibe to your page before closing body tag :

```
<script src='https://yoururl.com/vibe.min.js'></script>

```


#### Make a component with a function: (in a script tag or external.js/bundle.js)

```
const myComponent = () => {

    const template = `<div>Hey, I am app!</div>`;
    
    const func = function say() {
        console.log('I am app')
    };
    
    // init runs autmatically if it exists (and is in return object)

    const init = function init(e) {
    console.log('I am an '+e)
    e.$css('cursor: pointer;').$text{'I am new text');  // can chain built-in e.$fns DOM methods! 
    }; 
    
    const click = function click(e) {
        console.log('clicked ' + e.target.tagName );
    };  

    const state = {x:1};

   // Render uses this return object to add these to the component

    return {
        template: template,
        className: 'myComponent',
        init: init,
        fn: { 
            func: func
        },  
        events: {
            click: click,
        },  
        state: state
    }   
}   

```

#### Render the component to a DIV with an id of "app" and save a reference to it as "myRef"

* In an html file:
```
// somewhere in your html

<div id='app'> </div>
```

* In a script tag after vibe.min.js:
```
// className, state, events, plugins (like fn of component) etc. can be added here too

const myRef = $vibe.render(myComponent, {
    to: '#app',
    position: 'append',
    className: 'renderedComponent',
});     
 
```
 * Note: You can render a component as many times as you want with different reference names.


#### Components are self contained however, after rendering you can also do things with the reference ( "myRef" in this case)  like:
```
// Call built-in Vibe functions to change the css and the text etc. (chainable).

myRef.$css('display: inline-block').$text('Hey hey!');



// Call the internal function you declared in the component

myRef.$fn.func(); 



// Tack on more events with $on 

myRef.$on('click', function(){ console.log('my Text is: '+this.$text()) });
```

* Components can render other components too (hint: modules/import/export within components).


## Bundle with Webpack

* I assume your are already familiar with Webpack but if not see https://webpack.js.org/guides/getting-started/  and be sure to check out all the different options.

* Now suppose you have installed Webpack. https://webpack.js.org/guides/installation/ 


#### In dist/index.html

```
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
      <div id='app'></div>
    <script src="https://cdn.jsdelivr.net/gh/bretgeek/VibeJS@main/vibe.min.js"></script>
    <script src="main.js"></script>
  </body>
</html>
```



#### In /src/App.js

```
export const App = () => {

    const template = '<div>I am app!</div>';
    const func = function say() {
        console.log('I am app!')
    };  
    
    const init = function(e) {
    console.log('I am e '+e)
         e.$css('cursor: pointer;');
    }; // can add extras on e too a init time

    const click = function click(e) {
        console.log('clicked ' + e.target.tagName );
        this.$text('I was clicked!')
    };  
    const state = {x:1};
    return {
        template: template,
        className: 'webpacked',
        init: init,
        fn: {
            func: func
        },  
        events: {
            click: click,
        },  
        state: state
    }   
}
```

#### In /src/index.js

```
import {App} from '/src/App.js';

function tip() {console.log('tip') };
const Appref = $vibe.render(App, {
    to: '#app',
    position: 'append',
    plugin: {tip: tip} ,
});
Appref.$plugin.tip();
```

#### bundle it to dist/main.js  with.

```
npx webpack
```
* Visit dist/index.html to test!



#### More documentation/usage/tutorials coming soon...

Until then, feel free to ask questions, read the code or visit https://vibejs.com for lots more info.




[![Stargazers repo roster for @bretgeek/vibejs](https://reporoster.com/stars/bretgeek/vibejs)](https://github.com/bretgeek/vibejs/stargazers)
