const express = require('express');
const app = express(); 

app.get('/', (req, res) => {
    res.send('Hello World')
})

console.log(app);
app.listen(8080,  () => {
     console.log('server listening on port 8080'); 
})