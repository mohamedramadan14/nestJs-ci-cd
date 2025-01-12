import { Model } from 'mongoose';
import { AuthService } from '../auth.service';
import { User } from '../schemas/user.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SignUpDto } from '../dto/signup.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let model: Model<User>;
  let jwtService: JwtService;

  const hashedPassword = 'hashedPassword';
  const token = 'JWT token';
  const mockedUser = {
    _id: '61c2201867d0d894dc6e4b85',
    name: 'Mock User',
    email: 'mockuser@gmail.com',
    password: 'hashedPassword',
  };

  const signUpDto = {
    name: 'Mock User',
    email: 'mockuser@gmail.com',
    password: 'mockpassword',
  };

  const mockedLoginDto = {
    email: 'mockuser@gmail.com',
    password: 'mockpassword',
  };

  const mockedAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: getModelToken(User.name), useValue: mockedAuthService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    model = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('dependencies should be defined', () => {
    expect(authService).toBeDefined();
    expect(model).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('Testing signUp', () => {
    it('It should register a new user and return a token', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockedUser));
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await authService.signUp(signUpDto as SignUpDto);

      expect(result).toEqual({ token });
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpDto.password, 10);
      expect(model.create).toHaveBeenCalledWith({
        ...signUpDto,
        password: hashedPassword,
      } as SignUpDto);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: mockedUser._id });
    });
    it('It should throw an error if the user already exists', async () => {
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.reject({ code: 11000 }));

      await expect(authService.signUp(signUpDto as SignUpDto)).rejects.toThrow(
        ConflictException,
      );
      expect(model.create).toHaveBeenCalledWith({
        ...signUpDto,
        password: hashedPassword,
      } as SignUpDto);
    });
  });

  describe('Testing login', () => {
    it('It should login a user and return a token', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(token);

      const result = await authService.login(mockedLoginDto);

      expect(result).toEqual({ token });
      expect(model.findOne).toHaveBeenCalledWith({
        email: mockedLoginDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockedLoginDto.password,
        mockedUser?.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({ id: mockedUser._id });
    });

    it('It should throw an error if the user does not exist', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(null);

      await expect(authService.login(mockedLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(model.findOne).toHaveBeenCalledWith({
        email: mockedLoginDto.email,
      });
    });

    it('It should throw an error if the password is incorrect', async () => {
      jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await expect(
        authService.login({
          ...mockedLoginDto,
          password: mockedLoginDto.password + '1',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(model.findOne).toHaveBeenCalledWith({
        email: mockedLoginDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockedLoginDto.password + '1',
        mockedUser?.password,
      ); // Adding "1" to the password to make it incorrect
    });
  });
});
