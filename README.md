
# HTML TREE SEARCH

## Problem Description

Given a starting web page, the script will search for a specific regex contuously et dump them in a file.
The script will be limited by and ignore list, a maximum depth and a non redundancy memory to avoid infinite loops.
The scirpt will open any link it encounter that is not prohibited to crawl through the website.
The script will be able to run in parallel to speed up the process.

## Input

- A starting URL
- A regex to search

## Match detail

The match will be made in js like so :

```js
    const match = html.match(new RegExp(<your_match_input>,'g'));
    if (match) {
        return match
    }
```

so you don't have

## Usage

```bash
npm start -- https://data.seinesaintdenis.fr/ (href=.*\.csv)
```
