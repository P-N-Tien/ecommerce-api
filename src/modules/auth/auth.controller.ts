import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto, LoginResponseDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ description: 'User registered successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid input data provided.' })
  @ApiConflictResponse({ description: 'Email address already exists.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error occurred.' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    await this.authService.register(dto);
    return { message: 'User registered successfully.' };
  }

  @Post('login')
  @ApiOperation({ summary: 'User login authentication' })
  @ApiOkResponse({ description: 'Successfully authenticated and logged in.' })
  @ApiBadRequestResponse({ description: 'Invalid login payload format.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials provided.' })
  @ApiForbiddenResponse({ description: 'User account is inactive.' })
  @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return await this.authService.login(dto);
  }
}
