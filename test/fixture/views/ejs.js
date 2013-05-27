steal('./lib/jquery.js', './lib/can.jquery.js', './myView.ejs', function($, can, myView) {
    $('h1').html(myView({name: 'steal-build'}))
});