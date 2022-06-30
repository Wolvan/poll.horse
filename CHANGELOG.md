# Changelog

## v1.3.3 (2022-06-30)
### Changes & Fixes
* Add Ko-Fi link to footer for people who want to support my server hosting - [04ed4060](https://github.com/Wolvan/poll.horse/commit/04ed4060)

## v1.3.2 (2022-02-13)
### Changes & Fixes
* Fix IP duplication checking behind proxies - [c9ef0788](https://github.com/Wolvan/poll.horse/commit/c9ef0788)

## v1.3.1 (2022-02-04)
### Changes & Fixes
* Fix failing to fetch poll from database due to duplication data field being too small - [8bf01551](https://github.com/Wolvan/poll.horse/commit/8bf01551)
* Fix warning on startup due to invalid MySQL Option `tablePrefix` - [8bf01551](https://github.com/Wolvan/poll.horse/commit/8bf01551)

## v1.3.0 (2022-02-03)
### Additions
+ Dockerization! The project can now be built as a docker image and run - [d34c50c8](https://github.com/Wolvan/poll.horse/commit/d34c50c8)
### Changes & Fixes
* Updated icon to a new version delivered by dotkwa - [afe6da1a](https://github.com/Wolvan/poll.horse/commit/afe6da1a)
* Updated README to explain how to self host - [8b6ccdcb](https://github.com/Wolvan/poll.horse/commit/8b6ccdcb)

## v1.2.0 (2022-02-02)
### Additions
+ Add favicon and embbed icon! Thanks to Shydale and dotkwa for helping me out! - [f68ff6db](https://github.com/Wolvan/poll.horse/commit/f68ff6db)

## v1.1.0 (2022-02-02)
### Additions
+ Add QR Code to page that leads straight to voting page - [26a42333](https://github.com/Wolvan/poll.horse/commit/26a42333)
+ Improve security using headers via `helmet` - [afc7bbad](https://github.com/Wolvan/poll.horse/commit/afc7bbad)
+ Add meta pages to site for web crawlers and embeds - [59f1c7db](https://github.com/Wolvan/poll.horse/commit/59f1c7db)
+ Add MySQL Table Prefix setting - [ee4e83be](https://github.com/Wolvan/poll.horse/commit/ee4e83be)
### Changes & Fixes
* Change version display of dev version to use the commit hash it was build from - [59a2733d](https://github.com/Wolvan/poll.horse/commit/59a2733d)
* Make the heroku start script use the table prefix, if available - [a8958dc7](https://github.com/Wolvan/poll.horse/commit/a8958dc7)
* The pie chart is now also sorted by winning option - [8e8b263c](https://github.com/Wolvan/poll.horse/commit/8e8b263c)

## v1.0.4 (2022-01-29)
### Additions
+ Votes on the result pages are now sorted by the amount of votes on load - [2f40091c](https://github.com/Wolvan/poll.horse/commit/2f40091c)

## v1.0.3 (2022-01-12)
### Additions
+ Increase difficulty for bots to automatically vote - [ab151cb7](https://github.com/Wolvan/poll.horse/commit/ab151cb7)
+ Software version is now displayed in the footer with a link to the tag on Github - [ce260164](https://github.com/Wolvan/poll.horse/commit/ce260164)
+ Move and properly document [API](API.md) - [cfa150cc](https://github.com/Wolvan/poll.horse/commit/cfa150cc)
### Changes & Fixes
* Clean up backend database structure slightly - [5260cfb7](https://github.com/Wolvan/poll.horse/commit/5260cfb7)
* Fix display of NaN on results pages of polls with 0 total votes - [74a0910d](https://github.com/Wolvan/poll.horse/commit/74a0910d)
### Removals
- Remove Backend Voting Endpoint as it would only encourage botting - [6a155f2e](https://github.com/Wolvan/poll.horse/commit/6a155f2e)

## v1.0.2 (2022-01-11) - SECURITY PATCH
### Fixes
* [**SECURITY**] Fix XSS exploit on main page when injecting title from query - [cb0ec9df](https://github.com/Wolvan/poll.horse/commit/cb0ec9df)
* Fix only having 3 options available when using the JS-free version of the front page - [cb0ec9df](https://github.com/Wolvan/poll.horse/commit/cb0ec9df)
* Fix duplicated entries merging into one option, leading to polls with a single option - [39d14aff](https://github.com/Wolvan/poll.horse/commit/39d14aff)
* Fix header not linking back to home - [9e706fb4](https://github.com/Wolvan/poll.horse/commit/9e706fb4)

## v1.0.1 (2022-01-10)
### Fixes
* Fixed heroku losing MySQL database connection on wakeup - [1ad2c8c1](https://github.com/Wolvan/poll.horse/commit/1ad2c8c1)
* Fixed new options only appearing with 2 characters in the input field - [23445f75](https://github.com/Wolvan/poll.horse/commit/23445f75)

## v1.0.0 (2022-01-08)
* Initial release