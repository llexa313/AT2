'use strict';

function Scope() {
    this.$MaxDigestDepth = 5;

    this.$$watchers = [];
    this.$$postDigestQueue = [];
    this.$$asyncQueue = [];
}

Scope.prototype.$watch = function (getter, listener, equality) {
    if (typeof getter === 'function') {
        this.$$watchers.push({
            getter: getter,
            listener: listener || function () {},
            equality: equality || false // or !!equality
        });
    } else {
        throw 'first parameter should be a function';
    }
};

Scope.prototype.$watchGroup = function(getters, listener) {
    var self = this;
    if (_.isArray(getters) && getters.length > 0) {
        self.$watch(function () {
            var values = [];
            getters.forEach(function (getter) {
                values.push(getter(self));
            });
            return values;
        }, listener, true);
    }
};

Scope.prototype.$postDigest = function (expr) {
    this.$$postDigestQueue.push(expr);
};

Scope.prototype.$apply = function (expr) {
    this.$$beginPhase('apply');
    try {
        return this.$eval(expr);
    } catch (e) {
        console.error(e);
    } finally {
        this.$$clearPhase();
        this.$digest();
    }
};

Scope.prototype.$digest = function (depth) {
    var self = this, watched;

    if (!depth) {
        depth = 0;
        this.$$beginPhase('digest');
    }

    this.$$invokeAsync();

    this.$$watchers.forEach(function (watcher) {
        var oldValue = watcher.lastValue,
            newValue = watcher.getter(self);

        if (!self.$$isEqual(newValue, oldValue, watcher.equality)) {
            try {
                watcher.listener(newValue, oldValue, this);
            } catch (e) {
                console.error(e);
            }
            watcher.lastValue = newValue;
            watched = true;
        }
    });

    // recursion for digest if scope was changed in listeners
    if (watched && depth < this.$MaxDigestDepth) {
        this.$digest(depth + 1);
    } else {
        this.$$clearPhase();
        this.$$invokePostDigest();
    }
};

Scope.prototype.$eval = function (expr) {
    return expr(this);
};

Scope.prototype.$evalAsync = function (expr) {
    this.$$asyncQueue.push(expr);

    if (!this.$$phaseExecuting()) {
        setTimeout(this.$digest.bind(this), 0);
    }
};

Scope.prototype.$$isEqual = function (value1, value2, equality) {
    return equality ? _.isEqual(value1, value2) : value1 === value2;
};

Scope.prototype.$$invokeAsync = function () {
    while (this.$$asyncQueue.length) {
        try {
            this.$eval(this.$$asyncQueue.shift());
        } catch (e) {
            console.error(e);
        }
    }
};

Scope.prototype.$$invokePostDigest = function () {
    while (this.$$postDigestQueue.length) {
        try {
            this.$$postDigestQueue.shift()();
        } catch (e) {
            console.error(e);
        }
    }
};

Scope.prototype.$$phaseExecuting = function () {
    return this.$$phase === undefined;
};

Scope.prototype.$$beginPhase = function (name) {
    if (this.$$phaseExecuting()) {
        throw this.$$phase + ' phase is already started';
    }

    this.$$phase = name;
};

Scope.prototype.$$clearPhase = function () {
    this.$$phase = undefined;
};