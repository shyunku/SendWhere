const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const util = require('./server_side/util');

const port = 6400;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, res)=>{
    res.render('home');
});

app.listen(port, () => {
    console.log("Browser Opened at ...");
});