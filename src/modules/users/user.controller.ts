import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
interface ICurrentUser {
  id: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

interface IProfileResponse {
  success: boolean;
  data: ICurrentUser;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  @Get('profile')
  @ApiOperation({ summary: 'Get current logged in user profile' })
  getProfile(@CurrentUser() user: ICurrentUser): IProfileResponse {
    return {
      success: true,
      data: user,
    };
  }
}
