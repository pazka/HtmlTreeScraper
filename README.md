
# HTML TREE SEARCH

## Problem Description

Given a starting web page, the script will search for a specific regex contuously et dump them in a file.
The script will be limited by and ignore list, a maximum depth and a non redundancy memory to avoid infinite loops.
The scirpt will open any link it encounter that is not prohibited to crawl through the website.
The script will be able to run in parallel to speed up the process.

## Input

- A starting URL
- A regex to search

## Regex Match detail

The match will be made in js in this manner :

```js
    const match = html.match(new RegExp(<your_match_input>,'g'));
    if (match) {
        return match
    }
```

so you just have to provide what's inside the `new RegExp()` function like `'.*\.csv'` for example. This work for follow pattern, ignore pattern and match pattern.

## Configuration

- `ignoreUrlPatterns` : won't register the link as a link to follow it it match the regex pattern
- `followUrlPatterns` : pattern *MUST* match the link to be followed
- `maxDepth` : won't follow a link if the link is found after having followed `maxDepth` links previously (0 is the starting page)
- `maxNbWorkers` : number of workers to run in parallel
- `delayBetweenUrlChecks` : delay between each loop of the main loop that will trigger new workers
- `port` : port to run the IHM Server on
- `dumpHtml` : dump the html of the page crawled by each crawler in a `./dump` folder
- `dumpCrawlerData` : dump the full status of the crawler in a `.dump` file
- `dumpCrawlerMatches` : dump *ONLY* the matches found by the crawler in a `.matches` file

## Usage Example 

```bash
npm i
npm start -- <starting_point_url> <regex_to_match>
```

```bash
npm start -- https://data.seinesaintdenis.fr/ (href=.*\.csv)
```
