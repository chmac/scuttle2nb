# scuttle2nb

A simple script to get scuttle data converted to
[nb](https://xwmx.github.io/nb/) format.

## Usage

The scuttle data should be exported from mysql with mysqldump something like:

    mysqldump --tab /var/lib/mysql-files/foo foo

This assumes your scuttle data lives in a table called `foo`.

Then you can (hopefully) run this script like so:

- Clone this repo
- Install node v16 or later (or use nvm)
- Install yarn
- Run `yarn` to install dependencies
- Run `yarn build` to build the script
- Run the script like `/path/to/repo/dist/index.js --help`

```
Usage: scuttle2nb [options]

Options:
  -d --data-path <path>  Path to the scuttle .txt files
  -p --prefix <path>     Database table (and text filename) prefix (default: "")
  -o --offline           Perform all operations offline (bypasses nb commands)
  -v --verbose           Log more messages as the script proceeds
  --dry-run              Show the operations without performing them
  -h, --help             display help for command
```

## Known issues

- URLs must be valid
  - If you have any non URL bookmarks (say javascript bookmarklets) these will
    crash the script, suggest you remove manually them before import.
- Newlines in the `table.txt` file will crash the script
  - Some mysql exports include newlines, so the content of a single row is split
    over 2 lines. In this case, the script will crash, as the second line will
    be interpeted as a new row. These need to be manually fixed before import.

## Support

There is no free support for this code.

I successfully used it to import ~1.8k bookmarks. But your mileage may vary. I
had all kinds of weird issues and bugs. There's no warranty and no support.
