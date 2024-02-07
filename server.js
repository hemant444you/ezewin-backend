const express = require('express');

const app = express();

app.get('/',functiion(req, res){
    res.send('its working');
})
app.listen(process.env.PORT || 8001);
module.export = app