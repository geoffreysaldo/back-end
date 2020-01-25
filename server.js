let mongoose = require("mongoose");
let express = require("express");
let bodyParser = require("body-parser");
let app = express();
let cors = require("cors");
let router = express.Router();

let swaggerUi = require('swagger-ui-express');
let swaggerDocument = require('./swagger.json');

/*************** 
 * Databse connection
 ***************/
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use('/',router);



mongoose.connect('mongodb://localhost/Products',{useUnifiedTopology:true});

let db = mongoose.connection;
db.on('error',console.error.bind(console,'connection error:'));
db.once('open',function(){
  console.log("connection réussie...");
})

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Origin","GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Content-Type, Accept");
    next();
});

/*************** 
 * Schema definition
 ***************/

let ProductSchema = new mongoose.Schema({
    _id:String,
    name:String,
    price:Number
  })
  
let Product = mongoose.model('Product',ProductSchema);

let CategorySchema = new mongoose.Schema({
    _id:String,
    category : String,
    products: [ProductSchema],
  })

let Category = mongoose.model('Category',CategorySchema);


/*************** 
 * Request API
 ***************/


let updateProduct = function(req, res, next){
    Category.updateOne({category:req.params.category,"products.name":req.params.name},{$set: {"products.$.price":req.params.price}},function(err,product){
      if(err) {
        res.send(err);
      }
      res.json(product);
    })
  }



  let getCategory = function(req,res,next){
    Category.find(function(err,products){
      if(err){
        res.send(err);
      }
      res.json(products)
    })
  }


  let getSpecCategory = function(req,res,next){
      console.log("passage")
      Category.find({"category":req.params.category},function(err,products){
        if(err){
          res.send(err);
        }
        res.json(products)
      })

  }
  
  let createCategory = function(req, res, next){
    let newCategory = new Category();
    let newProducts = [];
    for(product of req.body.products){
      newProducts.push(product)
    }
    newCategory.category = req.body.category;
    newCategory.products = newProducts;
    console.log(newCategory)
    let doc = Category.findOneAndUpdate({category:newCategory.category},{$addToSet : {products :newCategory.products}},{
      upsert:true
    },function(err,doc){
      if (err) { throw err; }
      else { res.send(doc) }
    })
  };

  let deleteProduct = function(req, res, next){
    Category.update({category:req.params.category},{$pull: {"products":{name:req.params.name}}},function(err,product){
      if(err) {
        res.send(err);
      }
      res.json(product);
    })
  }


router.route('/category')
  .post(createCategory)
  .get(getCategory);

router.route('/category/:category')
  .get(getSpecCategory)


router.route('/category/:category/:name/:price')
  .put(updateProduct);


router.route('/category/:category/:name')
    .delete(deleteProduct);


app.use('/api-docs', swaggerUi.serve,swaggerUi.setup(swaggerDocument));
app.listen(3001,'localhost',function(){
  console.log("Le serveur fonctionne");
})