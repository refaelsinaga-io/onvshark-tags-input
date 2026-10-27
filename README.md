# onvshark-tags-input

Lightweight vanilla-JS tags input. No dependencies, no jQuery, no framework required. Attach it to a text input by id: free tags, or pick-only tags from a local list or a search URL.

![version](https://img.shields.io/badge/version-1.1.0-blue?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![vanilla js](https://img.shields.io/badge/vanilla-JS-f7df1e?style=flat-square&logoColor=black)
![no dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)

**Author:** Refael Sinaga · [refaelsinaga.com](https://refaelsinaga.com)  
**Version:** 1.1.0  
**License:** MIT  
**Demo:** [refaelsinaga-io.github.io/onvshark-tags-input](https://refaelsinaga-io.github.io/onvshark-tags-input/)

---

## Installation

Copy the two files into your project:

```
tagsinput.css
tagsinput.js
```

Include them in your HTML:

```html
<link rel="stylesheet" href="tagsinput.css">
<script src="tagsinput.js"></script>
```

---

## Usage

```html
<input type="text" id="city" name="city" class="form-control" value="Amsterdam,Sydney">

<script>
    const city = OnvTagsInput.init('city');
</script>
```

### Options

| Option      | Default | Description |
|-------------|---------|-------------|
| `source`    | `null`  | Empty = free tags. Array = pick from local list. String URL = search via `fetch(url + query)` |
| `creatable` | `false` | With a `source`: text not in the list can become a new tag ("+ Tambah ..."); its value is the text |
| `max`       | `0`     | Maximum number of tags, `0` = unlimited |
| `separator` | `','`   | Separator used in the input value |

With a `source`, typed text that is not in the list is rejected: tags can only be added by choosing a suggestion (click, or arrows + Enter). Add `creatable: true` to also offer "+ Tambah \"text\"" for text that has no exact match; new tags get the `.onvs-tagsinput-tag-new` chip.

Source items can be strings or `{ value, label }` objects. The input stores the value, the chip shows the label. A URL source must return that array as JSON, or `{ data: [...] }`. An array source is read live: push or splice into the same array and the list updates.

```js
OnvTagsInput.init('category', { source: [{ value: 1, label: 'News' }, { value: 2, label: 'Sports' }] });
OnvTagsInput.init('province', { source: '/api/province?q=', max: 3 });
```

### Instance

| Member          | Description |
|-----------------|-------------|
| `getTags()`     | Array of values (a new tag's value is its text) |
| `getNewTags()`  | Array of texts of new tags (`creatable`) |
| `setTags(list)` | Replace all tags (values or `{ value, label }`) |
| `add(tag)`      | Add one tag, returns `false` when duplicate / full / empty |
| `remove(value)` | Remove a tag by value |
| `element`       | Wrapper element (`.onvs-tagsinput`) |

The original input is hidden, kept in sync (`"a,b,c"`) and fires `change` on every edit, so normal form submits keep working.

---

## Theming

The original input's classes (e.g. `form-control`) move to the wrapper, so the box follows your theme. Chips and the suggestion list use CSS variables:

```css
.onvs-tagsinput {
    --onvs-tagsinput-tag-bg: #2ab57d;
    --onvs-tagsinput-tag-text: #fff;
}
```

See `tagsinput.md` for the full list (Indonesian docs).

---

## Files

| File            | Description |
|-----------------|-------------|
| `tagsinput.css` | Styles |
| `tagsinput.js`  | Library |
| `tagsinput.md`  | Full documentation (Indonesian) |
| `index.html`    | Demo |
| `test.html`     | Automated checks, should show "Semua 24 cek OK" |

---

## License

MIT © 2026 Refael Sinaga
