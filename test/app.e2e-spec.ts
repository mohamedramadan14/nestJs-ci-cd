import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SignUpDto } from '../src/auth/dto/signup.dto';
import mongoose from 'mongoose';
import { LoginDto } from '../src/auth/dto/login.dto';
import { Category } from '../src/book/schemas/book.schema';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;
  let bookCreated: any;
  let bookId: string;

  const newBook = {
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    price: 100,
    category: Category.ADVENTURE,
  };
  beforeAll(async () => {
    // More robust database connection and cleanup
    try {
      const mongoUri =
        process.env.DB_URI || 'mongodb://localhost:27017/test-db';
      await mongoose.connect(mongoUri);
      await mongoose.connection.db.dropDatabase();
    } catch (err) {
      console.error('Error connecting to test database:', err);
      throw err;
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    try {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
      await app.close();
    } catch (err) {
      console.error('Error cleaning up test database:', err);
      throw err;
    }
  });

  describe('Auth Endpoints', () => {
    it('(POST) /auth/signup Register a new user with valid credentials', () => {
      const signUpDto: SignUpDto = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'Test1234#',
      };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signUpDto)
        .expect(201)
        .then((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body.token).toBeDefined();
        });
    });
    it('(GET) /auth/login Login a user with valid credentials', () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'Test1234#',
      };
      return request(app.getHttpServer())
        .get('/auth/login')
        .send(loginDto)
        .expect(200)
        .then((res) => {
          expect(res.body).toHaveProperty('token');
          expect(res.body.token).toBeDefined();
          jwtToken = res.body.token;
        });
    });
  });

  describe('Book Endpoints', () => {
    it('(POST) /books Create a new book', () => {
      return request(app.getHttpServer())
        .post('/books')
        .send(newBook)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(201)
        .then((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.title).toBe('Test Book');
          expect(res.body.author).toBe('Test Author');
          expect(res.body.description).toBe('Test Description');
          expect(res.body.price).toBe(100);
          expect(res.body.category).toBe(Category.ADVENTURE);
          bookCreated = res.body;
        });
    });

    it('(GET) /books Get all books', () => {
      return request(app.getHttpServer())
        .get('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.length).toBe(1);
          bookId = bookCreated._id.toString();
        });
    });

    it('(GET) /books/:id Get a book by id', () => {
      return request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body._id).toBe(bookId);
          expect(res.body.title).toBe('Test Book');
          expect(res.body.author).toBe('Test Author');
          expect(res.body.description).toBe('Test Description');
          expect(res.body.price).toBe(100);
          expect(res.body.category).toBe(Category.ADVENTURE);
        });
    });

    it('(PUT) /books/:id Update a book by id', () => {
      return request(app.getHttpServer())
        .put(`/books/${bookId}`)
        .send({
          title: 'Updated Book',
        })
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body._id).toBe(bookId);
          expect(res.body.title).toBe('Updated Book');
          expect(res.body.author).toBe('Test Author');
          expect(res.body.description).toBe('Test Description');
          expect(res.body.price).toBe(100);
          expect(res.body.category).toBe(Category.ADVENTURE);
        });
    });

    it('(DELETE) /books/:id Delete a book by id', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined();
          expect(res.body._id).toBe(bookId);
        });
    });
  });
});
