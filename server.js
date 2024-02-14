import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import multer from 'multer'
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';



const app = express();
const port = 9000;


app.use(bodyParser.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the destination directory exists
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const directory = 'public/images';
    fs.mkdirSync(directory, { recursive: true }); // Create directory if it doesn't exist
    cb(null, directory);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + " " + Date.now() + path.extname(file.originalname));
  }
});


const upload = multer({ storage: storage });

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/public', express.static(join(__dirname, 'public')));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password@123#',
  database: 'product'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});






app.post('/products', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
    res.status(400).send('No file uploaded');
    return;
  }
  
  console.log(req.file);
  const { id, name, desc, category, price } = req.body;
  const image = req.file.filename;
  const INSERT_PRODUCTS_QUERY = `INSERT INTO products (id, name, \`desc\`, image, category, price) VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(INSERT_PRODUCTS_QUERY, [id, name, desc, image, category, price], (err, results) => {
    if (err) {
      console.error('Error adding product:', err);
      res.status(500).send('Error adding product');
    } else {
      console.log('Product added successfully');
      res.send('Product added successfully');
    }
  });
});

app.get('/products', (req, res) => {
  const SELECT_ALL_PRODUCTS_QUERY = `SELECT * FROM products`;
  connection.query(SELECT_ALL_PRODUCTS_QUERY, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});


app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  connection.query('SELECT * FROM products WHERE id = ?', [productId], (error, results, fields) => {
    if (error) {
      console.error('Error retrieving product:', error);
      res.status(500).send('Error retrieving product');
      return;
    }
    

    if (results.length === 0) {
      res.status(404).send('Product not found');
      return;
    }
    
   
    res.json(results[0]);
  });
});

app.put('/products/:id', upload.single('image'), (req, res) => {
  const productId = req.params.id;
  const { name, desc, category, price } = req.body;
  let image = req.body.image; // Existing image filename

  // Check if a new image was uploaded
  if (req.file) {
    image = req.file.filename; // Set the new image filename
  }

  // Initialize arrays to store update values and placeholders
  const updateValues = [];
  const placeholders = [];

  // Check which fields are provided in the request body and add them to the update query
  if (name) {
    updateValues.push(name);
    placeholders.push('name = ?');
  }
  if (desc) {
    updateValues.push(desc);
    placeholders.push('`desc` = ?');
  }
  if (category) {
    updateValues.push(category);
    placeholders.push('category = ?');
  }
  if (price) {
    updateValues.push(price);
    placeholders.push('price = ?');
  }
  if (image) {
    updateValues.push(image);
    placeholders.push('image = ?');
  }

  // Construct the SQL query
  let UPDATE_PRODUCT_QUERY = `UPDATE products SET ${placeholders.join(', ')} WHERE id = ?`;
  updateValues.push(productId);

  connection.query(UPDATE_PRODUCT_QUERY, updateValues, (err, results) => {
    if (err) {
      console.error('Error updating product:', err);
      res.status(500).send('Error updating product');
      return;
    }

    if (results.affectedRows > 0) {
      console.log(`Product with ID ${productId} updated successfully`);
      res.send('Product updated successfully');
    } else {
      console.log(`Product with ID ${productId} not found`);
      res.status(404).send('Product not found');
    }
  });
});



  
  


app.delete('/products/:id', (req, res) => {
    const { id } = req.params;
    const DELETE_PRODUCTS_QUERY = `DELETE FROM products WHERE id = ?`;
    connection.query(DELETE_PRODUCTS_QUERY, [id], (err, results) => {
      if (err) throw err;
      res.send('User deleted successfully');
    });
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
