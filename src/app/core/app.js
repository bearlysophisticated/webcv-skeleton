
var MyApp = ng
    .Component({
        selector: 'my-app'
    })
    .View({
        directives: [Header, Body, Footer],
        templateUrl: 'src/app/core/app.html'
    })
    .Class({
        constructor: function() {
        },
        afterViewInit: function() {
            $.mainSetup()
        }
    });
    document.addEventListener('DOMContentLoaded', function() {
        ng.bootstrap(MyApp);
    });

    