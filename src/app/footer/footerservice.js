'use strict';

var FooterService = function() {};
FooterService.prototype.getFooterElements = function () {
    return fetch("resources/content/footer.json")
        .then(function(resp){ return resp.json() })
}