# Changelog

## v1.0.2 (2022-01-11)
## SECURITY PATCH
### Fixes
* [**SECURITY**] Fix XSS exploit on main page when injecting title from query (cb0ec9df)
* Fix only having 3 options available when using the JS-free version of the front page (cb0ec9df)
* Fix duplicated entries merging into one option, leading to polls with a single option (39d14aff)
* Fix header not linking back to home (9e706fb4)

## v1.0.1 (2022-01-10)
### Fixes
* Fixed heroku losing MySQL database connection on wakeup (1ad2c8c1)
* Fixed new options only appearing with 2 characters in the input field (23445f75)

## v1.0.0 (2022-01-08)
* Initial release