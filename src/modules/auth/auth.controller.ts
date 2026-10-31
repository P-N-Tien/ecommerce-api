import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/auth.dto';
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
}
