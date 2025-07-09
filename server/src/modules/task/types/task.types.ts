import { Member, Task } from '@prisma/client'

export type TaskWithRelations = Task & {
  members: Member[]
}
