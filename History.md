##

* Breaking change (minor): `catch` to be passed error event, not error object
* Fix: Remove repeated attempt after block event as not working in browser testing
* Fix: Polyfill delete's `newVersion` for Firefox
* Fix: Polyfill PhantomJS' `del` success event, resumed and otherwise
* Fix: `preventDefault` within error handlers to avoid bubbling of errors beyond `catch`
* Feature: Support resumption of blocked events via `resume` property
* Feature: Allow upgrade argument to throw its own error to be catchable on the `open()` promise chain
* Feature: Pass on event object to `del` `onsuccess`

## 1.0.0 / 2015-11-28

* initial release :sparkles:
