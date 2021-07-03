# VibeJS
A small component based app library to build user interfaces.

* Note: not production ready (give me a week or so).



## Usage

Add Vibe to your page before closing body tag (can also bundle files):

```
<script src='https://yoururl.com/vibe.min.js'></script>

```


#### Make a component with a function:

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

#### Render the component to a id with an id of "app" and save a reference to it as "myRef"


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


#### More documentation/Usage/Tutorials coming soon.

Until then read the code!
