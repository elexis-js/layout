# @elexis/layout
Auto layout component for [ElexisJS](https://github.com/defaultkavy/elexis)

## Installation
```
npm i @elexis/layout
```

## Usage
```ts
import "elexis";
import "@elexis/layout";

const $layout = $('layout')
    .type("justified") // justified view
    .gap(4) // 4px gap
    .maxHeight(300) // each row maximum height is 300px
    .content([
        $('div').content([
            // any content here
        ])
    ])
    .render() // start render
```

## How we handle async element?
Sometimes, we need to load data first. Every content of `$Layout` must be sized in DOM before the layout start render. However, there are some situations cause we can't get the accurate size when element inserted to the DOM. Example: image source load.

First, we need an async function to fetch data and return `$Element`:
```ts
async function promiseElement(url: string) {
    const data = await fetch(url);
    return $('div').content(data);
}
```

After that, we should load all the data first, and put element into layout at every promise completed... Wait. This sound good, but the result of layout order will be disrupted. This is because fetch all the data in order doen't mean these data will be promised in ordered. Even if await all data promised, that will make user read a blank page period of time.

### We need some help with `$Async`
ElexisJS can replace unloaded element with `$Async` to put in the DOM. After the element loaded, async element will be replaced by loaded element.

Here is the way to create `$Async`:
```ts
$('async')  // create async element
    .await( promiseElement('/api/hello-world') ) // set the promise function 
    .on('load', () => { $layout.render() }) 
    // this event will be fire when element promised, 
    // we should render layout with the new sized element
```

Thourgh help with async element, we can put unloaded element in the layout first, this will make sure the order of elements will not be disrupted. Now, layout will render everytime the sized element is promised.

## Image element width and height attribute
If image dimension is exists before inserted to DOM, using width and height attribute of image element can make layout compute reserve space for it.

For example:
```ts
const imageDataList: ImageData[] = await fetch('/api/images');
$layout.content([
    imageDataList.map(data => {
        return $('img').width(data.width).height(data.height).src(data.url)
    })
])
```

Store image dimension data should be the best practice for building layout.