import { Injectable } from '@nestjs/common'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  getUser(id: string) {
    return this.repository.getUser(id)
  }
}
