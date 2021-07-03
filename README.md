# VibeJS
* A small component based app library to build user interfaces.


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
    
    // If init exists it runs autmatically
    const init = function(e) {
    console.log('I am an '+e)
    e.$css('cursor: pointer;');  // can chain e.$funcs DOM functions too 
    }; 
    
    const click = function click(e) {
        console.log('clicked ' + e.target.tagName );
    };  

    const state = {x:1};

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
const myRef = $vibe.render(myComponent, {
    to: '#app',
    position: 'append',
    className: 'myComponent',
});     
 
```

##### Components can also render other components. (Hint: modules/export/import);

#### More documentation/usage/tutorials coming soon...

Until then read the code!
