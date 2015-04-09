## CHANGELOG

## 0.1.#

### 0.1.5

 * Add support for passing namespace to meters and timers.
 * Add instrumentation call for wrapping target asynchronous calls with a timer and counters.
 * Add support for arbitrary time unit conversion.

### 0.1.4
Bug fix - key arrays should not be mutated.

### 0.1.3
Improve key namespacing to use configuration prefix, hostname and process title before user key.

### 0.1.2
Add a timestamp to all metrics collected.

### 0.1.1

 * Add local metrics adapter
 * Add support for collecting system metrics once or on an interval
