import { Role } from '@prisma/client'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  roles: Role[]
  selectedRole: string
  isAdmin: boolean
}
