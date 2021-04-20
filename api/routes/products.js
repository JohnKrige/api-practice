const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + file.originalfilename);
    },
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else{
        cb(null, false);
    }
};

const upload = multer({ 
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // accepts files up to 5mb
    },
    fileFilter
 });

const Product = require('../models/products');

router.get('/', (req, res, next) => {
    Product.find()
    .select('name price _id productImage')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs.map(doc => {
                console.log(doc)
                return {
                    name: doc.name,
                    price: doc.price,
                    id: doc._id,
                    productImage: doc.productImage,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/' + doc._id
                    }
                }
            })
        };
        res.status(200).json(response); 
    })
    .catch(error => {
        console.log(error);
        res.status(500).json({ error })
    })
});

router.post('/', checkAuth, upload.single('productImage'), (req, res, next) => {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      productImage: req.file.path,
    });
    product
    .save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: "Created a new product successfully",
            createdProduct: {
                name: result.name,
                price: result.price,
                id: result._id,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products/' + result._id
                }
            }
    });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
    .select('name price _id productImage')
    .exec()
    .then(doc => {
        console.log(doc);
        res.status(200).json(doc);
        if(doc) {
            res.status(200).json({
                product: doc,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products/' + doc._id
                }
            });
        } else {
            res.status(404).json({ message: 'No valid entry found for provided ID' });
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: err });
    })
});

router.patch("/:productId", checkAuth, (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Product.updateOne({ _id: id }, { $set: updateOps })
      .exec()
      .then(result => {
        res.status(200).json({
            message: 'Product updated',
            request: {
                type: 'GET',
                url: 'http://localhost:3000/products/' + id
            }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  });

router.delete('/:productId', checkAuth, (req, res, next) => {
    Product.remove({ _id: req.params.productId })
    .exec()
    .then(result => {
        result.status(200).json({
            message: 'Product deleted',
            request: {
                type: "GET",
                url: 'http:localhost:3000/products/',
                body: {
                    name: 'String',
                    price: 'Number'
                }
            }
        })
    })
    .catch(error => {
        console.log(error);
        res.status(500).json(error);
    });
});


module.exports = router;