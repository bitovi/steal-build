(function(window, undefined) {
    window.$ = window.dollar = {
        name: 'Dollar',
        conflict: true,
        noConflict: function() {
            this.conflict = false;
            return this;
        }
    };
})(this);