import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from '../book.controller';
import { BookService } from '../book.service';
import { Book, Category } from '../schemas/book.schema';
import { PassportModule } from '@nestjs/passport';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

describe('Book Controller', () => {
  let bookController: BookController;
  let bookService: BookService;

  const mockedBook = {
    _id: '62fc6313f039332c34c81b2d',
    user: '658c6313f039332c34c81b2d',
    title: 'Mocked Book',
    author: 'Mocked Author',
    description: 'Mocked Description',
    price: 100,
    category: Category.FANTASY,
  };

  const updatedBook = {
    ...mockedBook,
    title: 'Updated Book',
  };

  const newBook = {
    title: 'Mocked Book',
    author: 'Mocked Author',
    description: 'Mocked Description',
    price: 100,
    category: Category.FANTASY,
  };
  const mockUser = {
    _id: '658c6313f039332c34c81b2d',
    name: 'Mocked User',
    email: 'mocked@email.com',
    password: 'hashedPassword',
  };

  const mockBookService = {
    findAll: jest.fn().mockResolvedValueOnce([mockedBook]),
    create: jest.fn().mockResolvedValueOnce(mockedBook),
    findById: jest.fn().mockResolvedValueOnce(mockedBook),
    updateById: jest.fn().mockResolvedValueOnce(updatedBook),
    deleteById: jest.fn().mockResolvedValueOnce(mockedBook),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // we need to mock the passport module to be able to test the controller because it's a protected route and AuthGuard is used
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: mockBookService,
        },
      ],
    }).compile();
    bookController = module.get<BookController>(BookController);
    bookService = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(BookController).toBeDefined();
    expect(bookService).toBeDefined();
  });

  describe('Testing getAllBooks', () => {
    it('should return an array of books', async () => {
      const query = {
        keyword: 'Mocked Book',
        page: '1',
      };
      const result = await bookController.getAllBooks(query);
      expect(result).toEqual([mockedBook]);
      expect(result).toHaveLength(1);
      expect(bookService.findAll).toHaveBeenCalled();
      expect(bookService.findAll).toHaveBeenCalledWith(query);
      expect(bookService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing createBook', () => {
    it('should create a book', async () => {
      const result = await bookController.createBook(newBook as CreateBookDto, {
        user: mockUser,
      });
      expect(result).toEqual(mockedBook);
      expect(bookService.create).toHaveBeenCalled();
      expect(bookService.create).toHaveBeenCalledWith(
        newBook as Book,
        mockUser,
      );
      expect(bookService.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing getBookById', () => {
    it('should return a book by id', async () => {
      const result = await bookController.getBook(mockedBook._id);
      expect(result).toEqual(mockedBook);
      expect(bookService.findById).toHaveBeenCalled();
      expect(bookService.findById).toHaveBeenCalledWith(mockedBook._id);
      expect(bookService.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing updateBookById', () => {
    it('should update a book by id', async () => {
      const result = await bookController.updateBook(mockedBook._id, {
        title: 'Updated Book',
      } as UpdateBookDto);
      expect(result).toEqual(updatedBook);
      expect(bookService.updateById).toHaveBeenCalled();
      expect(bookService.updateById).toHaveBeenCalledWith(mockedBook._id, {
        title: 'Updated Book',
      } as UpdateBookDto);
      expect(bookService.updateById).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing deleteBookById', () => {
    it('should delete a book by id', async () => {
      const result = await bookController.deleteBook(mockedBook._id);
      expect(result).toEqual(mockedBook);
      expect(bookService.deleteById).toHaveBeenCalled();
      expect(bookService.deleteById).toHaveBeenCalledWith(mockedBook._id);
      expect(bookService.deleteById).toHaveBeenCalledTimes(1);
    });
  });
});
