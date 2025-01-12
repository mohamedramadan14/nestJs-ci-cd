import { Test, TestingModule } from "@nestjs/testing";
import { BookService } from "../book.service";
import { getModelToken } from "@nestjs/mongoose";
import { Book, Category } from "../schemas/book.schema";
import mongoose, { Model } from "mongoose";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreateBookDto } from "../dto/create-book.dto";
import { User } from "../../auth/schemas/user.schema";

describe("Testing BookService", () => {
    let bookService: BookService;
    let model: Model<Book>;
    const mockBookService = {
        findById: jest.fn(),
        find: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    }
    const mockBook = {
        _id: "61c234567890123456789012",
        user: "62c234567890123456789012",
        title: "Mock Book",
        author: "Mock Author",
        description: "Mock Description",
        price: 10.99,
        category: Category.FANTASY,
    }
    const mockUser = {
        _id: "62c234567890123456789012",
        name: "Mock User",
        email: "mockuser@gmail.com",
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BookService, {
                provide: getModelToken(Book.name),
                useValue: mockBookService,
            }]
        }).compile();

        bookService = module.get<BookService>(BookService);
        model = module.get<Model<Book>>(getModelToken(Book.name));
    })

    it("should be defined", () => {
        expect(bookService).toBeDefined();
        expect(model).toBeDefined();
    })

    describe("Tesing findById", () => {
        it("It should find a book by id and return it", async () => {
            jest.spyOn(model, "findById").mockResolvedValue(mockBook);
            const result = await bookService.findById(mockBook._id);
            expect(result).toEqual(mockBook);
            expect(model.findById).toHaveBeenCalledWith(mockBook._id);
            expect(model.findById).toHaveBeenCalledTimes(1);
        })

        it("It should throw BadRequestException if invalid book id is provided", async () => {
            const invalidObjectId = "invalid-id"
            const isValidObjectIdMocked = jest.spyOn(mongoose, "isValidObjectId").mockReturnValue(false);
            await expect(bookService.findById(invalidObjectId)).rejects.toThrow(BadRequestException);
            expect(isValidObjectIdMocked).toHaveBeenCalledWith(invalidObjectId);
            expect(isValidObjectIdMocked).toHaveBeenCalledTimes(1);
            isValidObjectIdMocked.mockRestore();
        })

        it("It should throw NotFoundException if book is not found", async () => {
            jest.spyOn(model, "findById").mockResolvedValue(null);
            await expect(bookService.findById(mockBook._id)).rejects.toThrow(NotFoundException);
            expect(model.findById).toHaveBeenCalledWith(mockBook._id);
        })
    })

    describe("Testing findAll", () => {
        /**
         * here we use find , limit , skip 
         * so we need to mock all of them
         */
        it("It should return an array of books", async () => {
            const query = { page: "1", keyword: "Mock Book" };
            jest.spyOn(model, "find").mockImplementation(() => {
                return {
                    limit: () => {
                        return {
                            skip: jest.fn().mockResolvedValue([mockBook]),
                        }
                    }
                } as any;
            });

            const result = await bookService.findAll(query);
            expect(result).toEqual([mockBook]);
            expect(model.find).toHaveBeenCalledWith({
                title: { $regex: query.keyword, $options: "i" },
            });
            expect(model.find).toHaveBeenCalledTimes(1);
        })
    })

    describe("Testing create", () => {
        it("should create a book and return it", async () => {
            const newBook = {
                title: "Mock Book",
                author: "Mock Author",
                description: "Mock Description",
                price: 10.99,
                category: Category.FANTASY,
            }
            jest.spyOn(model, "create").mockImplementationOnce(() => Promise.resolve(mockBook));
            const result = await bookService.create(newBook as CreateBookDto, mockUser as User);
            expect(result).toEqual(mockBook);
            expect(model.create).toHaveBeenCalledWith({ ...newBook, user: mockUser._id });
            expect(model.create).toHaveBeenCalledTimes(1);
        })
    })

    describe("Testing updateById", () => {
        it("It should update a book by id and return it", async () => {
            const updatedBook = {
                ...mockBook,
                title: "Updated Mock Book",
                author: "Updated Mock Author",
                description: "Updated Mock Description",
                price: 15.99,
                category: Category.FANTASY,
            }

            const book = {
                title: "Updated Mock Book",
                author: "Updated Mock Author",
                description: "Updated Mock Description",
                price: 15.99,
                category: Category.FANTASY,
            }
            jest.spyOn(model, "findByIdAndUpdate").mockResolvedValue(updatedBook);
            const result = await bookService.updateById(mockBook._id, book as Book);
            expect(result).toEqual(updatedBook);
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith(mockBook._id, book as Book, {
                new: true,
                runValidators: true,
            });
            expect(model.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        })
    })

    describe("Testing deleteById", () => {
        it("It should delete a book by id and return it", async () => {
            jest.spyOn(model, "findByIdAndDelete").mockResolvedValue(mockBook);
            const result = await bookService.deleteById(mockBook._id);
            expect(result).toEqual(mockBook);
            expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockBook._id);
            expect(model.findByIdAndDelete).toHaveBeenCalledTimes(1);
        })
    })
})