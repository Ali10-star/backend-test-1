const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const slugify = require('./utils');

const app = express();
app.use(express.json());

const SECRET_KEY = crypto.randomBytes(32).toString('hex');
const specialChars = new RegExp(/^.*[<>{}].*$/s);

// Data validation schema
const dataSchema = Joi.object({
  reference: Joi.string(),
  title: Joi.string()
    .min(5)
    .max(50)
    .required()
    .custom((value, helpers) =>
      (specialChars.test(value) ? helpers.error('any.invalid') : value)
    ).messages({
      'any.invalid': "Post title cannot contain special characters"
    }),
  description: Joi.string().max(500).required(),
  main_image: Joi.any().required(),
  date_time: Joi.number().required()
    .custom((value, helpers) => (
      value < Date.now() ? helpers.error('any.invalid') : value
    ))
    .messages({
      'any.invalid': "Cannot choose a date in the past"
    }),
  additional_images: Joi.array()
});

const imageSchema = Joi.object({
  main_image: Joi.any().required(),
  additional_images: Joi.array().max(5)
});

// file upload management
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 1 * 1024 * 1024, // Max file size 1MB
  },
  fileFilter: (req, file, callback) => {
    // Only allow jpg files
    if (path.extname(file.originalname) !== '.jpg') {
      return callback(new Error('Only JPEG images are allowed!'));
    }
    // accept the file and throw no errors
    callback(null, true);
  }
});

app.get('/', (req, res, next) => {
  const FILE = req.query['test'] ? 'test.json' : 'blogs.json';
  let blogs;
  fs.readFile(FILE, 'utf-8', (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while reading the file.');
      return;
    }
    blogs = JSON.parse(data);
    blogs.forEach(blogPost => {
      blogPost['date_time'] = new Date(blogPost['date_time']).toISOString();
      blogPost["title_slug"] = `${slugify(blogPost["title"])}`;
    });
    res.status(200).json(blogs);
  });
});

const cleanTempFiles = function (req, res, next) {
  const TEMP_DIR = './temp';
    fs.readdir(TEMP_DIR, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(TEMP_DIR, file), err => { if (err) throw err });
      }
    });
    next();
}

app.post('/new', upload.fields([{ name: 'main_image', maxCount: 1 }, { name: 'additional_images' }]), async (req, res, next) => {
  try {
    const { error, value } = imageSchema.validate({ main_image: req.files.main_image, additional_images: req.files.additional_images });
    if (error) {
      res.status(400).json(error);
      return;
    }
    const mainImage = req.files.main_image[0];
    const mainImagePath = path.join(__dirname, 'images', `${mainImage.originalname}`);
    await sharp(mainImage.path)
      .resize({ width: 500 })
      .jpeg({ quality: 75 })
      .toFile(mainImagePath);

    const additionalImagesPaths = [];
    if (req.files.additional_images) {
      for (const additionalImage of req.files.additional_images) {
        const additionalImagePath = path.join(__dirname, 'images', additionalImage.originalname);
        await sharp(additionalImage.path)
          .resize({ width: 500 })
          .jpeg({ quality: 75 })
          .toFile(additionalImagePath);
        additionalImagesPaths.push(`images/${additionalImage.originalname}`);
      }
    }

    const FILE = req.query['test'] ? 'test.json' : 'blogs.json';
    fs.readFile(FILE, 'utf-8', (err, data) => {
      blogs = JSON.parse(data);
      const blogRef = blogs.length > 0 ? parseInt(blogs[blogs.length - 1]['reference']) + 1 : 1;

      const newBlogPost = {
        reference: blogRef.toString().padStart(5, '0'),
        title: req.body.title,
        description: req.body.description,
        main_image: `images/${mainImage.originalname}`,
        date_time: parseInt(req.body.date_time), // Date.parse(req.body.date_time),
      };

      if (additionalImagesPaths.length) {
        newBlogPost['additional_images'] = additionalImagesPaths;
      }

      const { error, value } = dataSchema.validate(newBlogPost);
      if (error) {
        res.status(400).json(error);
      } else {
        blogs.push(newBlogPost);
        fs.writeFileSync(FILE, JSON.stringify(blogs, null, 2));

        res.status(201).json({...newBlogPost, title_slug: slugify(newBlogPost['title'])});
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred.');
  }
});

// Generate a JWT token for a given image path
app.post('/token', (req, res) => {
  const image_path = req.body.image_path;
  if (!fs.existsSync(image_path)) {
    res.status(400).json({ message: 'Invalid image path.' });
  }
  const token = jwt.sign({ image_path }, SECRET_KEY, { expiresIn: '5m' });
  res.status(201).json({ token });
});

app.get('/image', (req, res) => {
  const image_path = req.body.image_path;
  const providedToken = req.headers['authorization'].split(' ')[1];

  try {
    const decoded = jwt.verify(providedToken, SECRET_KEY);

    if (decoded.image_path !== image_path) {
      return res.status(403).send('Invalid token');
    }
    const imagePath = path.join(__dirname, image_path);
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (err) {
    res.status(403).send('Invalid or expired token');
  }
});

module.exports = app;