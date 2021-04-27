'use strict';

const express= require('express');
const pg= require('pg');
const superagent= require('superagent');
const cors= require('cors');
const methodOverride= require('method-override');

const app = express();

require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

let PORT = process.env.PORT || 3000 ;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,
   ssl: { rejectUnauthorized: false }
});


app.get('/',homePage)
app.get('/result',result)
app.get('/allProduct',allProducts)
app.post('/addToCard',addToCard)
app.get('/myCard',myCard)
app.get('/details/:id',details)
app.put('/update/:id',updateCard)
app.delete('/delete/:id',deleteCard)



function Product (data){
  this.name=data.name;
  this.price=data.price;
  this.image_link=data.image_link;
  this.description=data.description;
}
function deleteCard(req,res) {
  let SQL = 'DELETE FROM mycards WHERE id=$1 ;';
  let safeValue = [req.params.id];
  client.query(SQL,safeValue)
    .then(()=>{
      res.redirect('/myCard')
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}
function updateCard(req,res) {
  let data = req.body;
  let SQL = `UPDATE mycards SET name=$1,price=$2,description=$3 WHERE id=$4 ;`
  let safeValues = [data.name,data.price,data.description,req.params.id]
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect('back');
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}
function details(req,res) {
  let SQL =`SELECT * FROM mycards WHERE id=${req.params.id}`
  client.query(SQL)
    .then((data)=>{
      res.render('details',{data:data.rows})
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}
function myCard(req,res) {
  client.query('SELECT * FROM mycards')
    .then(data=>{
      res.render('myCards',{data:data.rows})
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}

function addToCard(req,res) {
  let data = req.body ;
  let SQL = 'INSERT INTO mycards (name,price,image_link,description) VALUES ($1,$2,$3,$4);'
  let safeValues = [data.name,data.price,data.image_link,data.description]
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect('/myCard');
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}

function allProducts(req,res) {
  superagent.get('http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline')
    .then(data=>{
      let allProducts = data.body.map(val=>{
        return new Product ( val);
      })
      res.render('allProduct',{data:allProducts})
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}


function result(req,res) {
  let URL =`http://makeup-api.herokuapp.com/api/v1/products.json?brand=${req.query.brand}&price_greater_than=${req.query.from}&price_less_than=${req.query.to}`
  superagent.get(URL)
    .then(data=>{
      let resultArr = data.body.map(val=>{
        return new Product (val);
      })
      console.log(data.body,resultArr);
      res.render('result',{data:resultArr})
    })
    .catch(()=>{
      res.send('Somthing Went Wrong');
    })
}
function homePage(req,res) {
  res.render('home')
}

app.get('*',(req,res)=>{
  res.send('Page Not Found');
})



client.connect()
  .then(()=>{
    app.listen(PORT,()=>{console.log(PORT)})
  })
