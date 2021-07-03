# VibeJS
* A small component based library to build user interfaces and apps.


## Basic Usage

#### Add Vibe to your page before closing body tag (can also bundle files):

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
    
    // init runs autmatically if it exists

    const init = function(e) {
    console.log('I am an '+e)
    e.$css('cursor: pointer;');  // can chain e.$funcs DOM functions too 
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


```
// somewhere in your html

<div id='app'> </div>
```

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

##### Components can render other components too (hint: modules/import/export).

#### More documentation/usage/tutorials coming soon...

Until then read the code!
