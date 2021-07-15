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

## Support

There is no free support for this code.

I successfully used it to import ~1.8k bookmarks. But your mileage may vary. I
had all kinds of weird issues and bugs. There's no warranty and no support.
