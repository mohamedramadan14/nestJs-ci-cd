import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { SignUpDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';

describe('Auth Controller', () => {
  let authController: AuthController;
  let authService: AuthService;

  const loginDto: LoginDto = {
    email: 'mocked@email.com',
    password: 'Test1234#',
  };

  const signUpDto: SignUpDto = {
    name: 'Mocked User',
    email: 'mocked@email.com',
    password: 'Test1234#',
  };

  const jwtToken = 'JWT token';

  const mockAuthService = {
    signUp: jest.fn().mockResolvedValueOnce(jwtToken),
    login: jest.fn().mockResolvedValueOnce(jwtToken),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // we need to mock the passport module to be able to test the controller because it's a protected route and AuthGuard is used
      // imports: [PassportModule.register({ defaultStrategy: "jwt" })],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('Testing signUp', () => {
    it('should return a JWT token', async () => {
      const result = await authController.signUp(signUpDto as SignUpDto);
      expect(result).toEqual(jwtToken);
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing login', () => {
    it('should return a JWT token', async () => {
      const result = await authController.login(loginDto as LoginDto);
      expect(result).toEqual(jwtToken);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });
});
