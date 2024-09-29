import { Injectable } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { IUser } from './dto/IUser'

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  getUser(id: string) {
    return this.repository.getUser(id)
  }

  getUserInfo(user: IUser) {
    return this.repository.getUserInfo(user)
  }
}
