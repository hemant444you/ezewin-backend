const express = require('express');

const app = express();

app.get('/',function(req,res){
    res.send('its working');
});

app.get('/test',function(req,res){
    res.send('its working');
});

app.listen(process.env.PORT || 8000);
module.export = app