
var Footer = ng
    .Component({
        selector: 'my-footer',
        bindings: [FooterService],
        properties: ['model']
    })
    .View({
        directives: [ng.NgFor],
        templateUrl: 'src/app/footer/footer.html'
    })
    .Class({
        constructor: [FooterService, function (FooterService) {
            this.footerElements = FooterService.getFooterElements()
        }]
    });