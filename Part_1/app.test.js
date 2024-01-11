const request = require('supertest');
const app = require('./app');
const fs = require('fs');
const path = require('path');
const slugify = require('./utils');

// jest.mock('fs');

const isISODate = (str) => {
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str;
};

const makePostRequest = async (payload) => {
  const response = await request(app).post('/new')
    .query({test: true}) // this query param tells the API to use a temp mock JSON file
    .field('title', payload.title)
    .field('description', payload.description)
    .field('date_time', payload.date)
    .attach('main_image', payload.image);
  return response;
}

describe('Test the root path', () => {
  it("should fetch all blog posts with formatted dates and added slug field", async () => {
    const response = await request(app).get('/'); // .query({test: true});
    expect(response.statusCode).toBe(200);

    const data = JSON.parse(response.text);
    expect(data.length).toBeDefined();

    for (post of data) {
      expect(isISODate(post['date_time'])).toBeTruthy();
      expect(post['title_slug']).toBeDefined();
    }
  });
});

describe('Test the POST request to create blog posts', () => {
  // SETUP CODE
  const MOCK_FILE = './test.json';
  beforeEach(() => {
    fs.open(MOCK_FILE, 'w', (err, fd) => {
      fs.writeFile(fd, '[]', () => {});
      fs.close(fd, err => {
        if (err) {
          console.log(err.message);
        }
      });
    });
  });


  it("should make a POST request, update blogs.json and return the new blog", async () => {
    // payload data
    const title = 'TESTING POST';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test83.jpg';

    const response = await makePostRequest({ title, description, date, image });
    const newBlog = JSON.parse(response.text);

    expect(response.statusCode).toBe(201);
    expect(newBlog['title']).toEqual(title);
    expect(newBlog['description']).toEqual(description);
    expect(newBlog['main_image']).toEqual(`images/${image}`);
    expect(new Date(newBlog['date_time'])).toEqual(new Date(date));
    // test if the title is being slugified
    expect(newBlog['title_slug']).toEqual(slugify(title));
  });

  it('should return a 400 BAD REQUEST if trying to create a post with missing required fields', async () => {
    // payload data
    const title = '';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test83.jpg';

    const response = await makePostRequest({ title, description, date, image });
    const errorData = JSON.parse(response.text);
    expect(response.statusCode).toBe(400);
    const receivedErrorMessage = errorData["details"][0]["message"];
    expect(receivedErrorMessage).toEqual(`\"title\" is not allowed to be empty`);
  });

  it('should return a 500 INTERNAL SERVER ERROR if trying to upload an image larger than 1MB', async () => {
    const title = 'TESTING';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test_large.jpg';

    const response = await makePostRequest({ title, description, date, image });
    expect(response.statusCode).toBe(500);
  });

  it('should return a 400 BAD REQUEST if trying to submit a title with special characters', async () => {
    // payload data
    const title = '{}A test blog post<>';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test83.jpg';

    const response = await makePostRequest({ title, description, date, image });
    const errorData = JSON.parse(response.text);
    expect(response.statusCode).toBe(400);
    const receivedErrorMessage = errorData["details"][0]["message"];
    expect(receivedErrorMessage).toEqual(`Post title cannot contain special characters`);
  });

  it('should create a new post then check if it was added to the data of all posts', async () => {
    // payload data
    const title = 'TESTING POST';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test83.jpg';

    const oldResponse = await request(app).get('/').query({test: true});
    const oldData = JSON.parse(oldResponse.text);

    const response = await makePostRequest({ title, description, date, image });

    const newBlog = JSON.parse(response.text);

    const newResponse = await request(app).get('/').query({test: true});
    const newData = JSON.parse(newResponse.text);
    expect(response.statusCode).toBe(201);
    expect(newData.length).toEqual(oldData.length + 1);

    newData[newData.length - 1]['date_time'] = Date.parse(newData[newData.length - 1]['date_time']);
    expect(newData[newData.length - 1]).toMatchObject(newBlog);
  });

  it('should fail to create a new post then check that it was NOT added to the data of all posts', async () => {
    // payload data
    const title = '';
    const description = 'This is a blog meant for testing';
    const date = Date.parse('2024-12-23T12:34:56');
    const image = 'test83.jpg';

    const oldResponse = await request(app).get('/').query({test: true});
    const oldData = JSON.parse(oldResponse.text);

    // attempt to create invalid post
    const response = await makePostRequest({ title, description, date, image });

    const newResponse = await request(app).get('/').query({test: true});
    const newData = JSON.parse(newResponse.text);

    expect(response.statusCode).toBe(400);
    expect(newData.length).toEqual(oldData.length);
  });

  it('should make a POST request to get a token for an image, then successfully GET the image data', async () => {
    const IMAGE_PATH = './test83.jpg';
    const response = await request(app).post('/token')
      .send({ 'image_path': IMAGE_PATH })
      .set('Content-Type', 'application/json');
      const token = JSON.parse(response.text)['token'];

      const imageResponse = await request(app).get('/image')
        .send({ 'image_path': IMAGE_PATH })
        .set('Authorization', `Token ${token}`);

      expect(imageResponse.statusCode).toBe(200);
      expect(imageResponse.type).toBe('image/jpeg');
  });

  it('should make a POST request to get a token for an image, then successfully GET the image data', async () => {
    const IMAGE_PATH = './test83.jpg';
    const response = await request(app).post('/token')
      .send({ 'image_path': IMAGE_PATH })
      .set('Content-Type', 'application/json');
      const token = JSON.parse(response.text)['token'];

      const imageResponse = await request(app).get('/image')
        .send({ 'image_path': './wrong_path.jpg' })
        .set('Authorization', `Token ${token}`);

      expect(imageResponse.statusCode).toBe(403);
      expect(imageResponse.error.text).toBe('Invalid token');
  });

  // TEARDOWN CODE
  afterEach(() => {
    if (fs.existsSync(MOCK_FILE)){
      fs.unlink(MOCK_FILE, (err) => {
        if (err) throw err;
        // console.log('test.json was deleted');
      });
    }
  });
})