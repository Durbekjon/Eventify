import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateSheetDto } from './dto/create-sheet.dto'
import { UpdateSheetDto } from './dto/update-sheet.dto'
import { SheetReorderDto } from './dto/reorder-sheets.dto'
import { ColumnRepository } from '@column/column.repository'
@Injectable()
export class SheetRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly columnRepository: ColumnRepository,
  ) {}
  async createSheet(body: CreateSheetDto, companyId: string) {
    const { name, workspaceId, columns } = body

    // Step 1: Create a new sheet in the workspace and associate it with the company
    const sheet = await this.prisma.sheet.create({
      data: {
        name,
        workspace: { connect: { id: workspaceId } },
        company: { connect: { id: companyId } },
      },
    })

    if (columns && columns.length > 0) {
      const defaultColumnKeys = new Set([
        'name',
        'status',
        'priority',
        'link',
        'price',
        'paid',
      ])

      // Step 2: Prepare the columns with unique keys if necessary
      const updatedColumns = columns.map((column) => ({
        ...column,
        sheetId: sheet.id,
        key: defaultColumnKeys.has(column.name)
          ? column.name
          : column.key || column.name,
      }))

      // Step 3: Create each column and handle `selects` if present
      for (const column of updatedColumns) {
        const createdColumn = await this.prisma.column.create({
          data: {
            name: column.name,
            key: column.key,
            show: column.show,
            type: column.type,
            company: { connect: { id: companyId } },
            sheet: { connect: { id: sheet.id } },
          },
        })

        // Step 4: Create `Select` and `Option` entries if `selects` are provided
        if (column.selects && column.selects.length > 0) {
          for (const select of column.selects) {
            const createdSelect = await this.prisma.select.create({
              data: {
                title: select.title,
                color: select.color,
                column: { connect: { id: createdColumn.id } },
                company: { connect: { id: companyId } },
              },
            })

            if (select.options && select.options.length > 0) {
              for (const option of select.options) {
                await this.prisma.option.create({
                  data: {
                    name: option.name,
                    color: option.color,
                    select: { connect: { id: createdSelect.id } },
                  },
                })
              }
            }
          }
        }
      }
    }

    return this.findById(sheet.id)
  }

  findById(id: string) {
    return this.prisma.sheet.findUnique({
      where: { id },
      include: { columns: true, tasks: true },
    })
  }

  getSheetsByWorkspace(workspaceId: string) {
    return this.prisma.sheet.findMany({
      where: { workspaceId },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        name: true,
        order: true,
      },
    })
  }

  findOne(id: string) {
    return this.prisma.sheet.findUnique({ where: { id } })
  }

  updateSheet(id: string, body: UpdateSheetDto) {
    return this.prisma.sheet.update({
      where: { id },
      data: {
        name: body.name,
        order: body.order,
      },
    })
  }

  reorder(body: SheetReorderDto) {
    return this.prisma.$transaction(
      body.sheetIds.map((id, index) =>
        this.prisma.sheet.update({
          where: { id },
          data: { order: body.orders[index] },
        }),
      ),
    )
  }

  deleteSheet(id: string) {
    return this.prisma.sheet.delete({ where: { id } })
  }

  async deleteMultipleSheetsByWorkspace(workspaceId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Delete all tasks in the workspace
      await prisma.task.deleteMany({
        where: { workspaceId },
      })

      // Step 2: Delete all sheets in the workspace
      await prisma.sheet.deleteMany({
        where: { workspaceId },
      })

      // Step 3: Delete related columns
      await prisma.column.deleteMany({
        where: {
          sheet: {
            workspaceId,
          },
        },
      })

      // Step 4: Delete logs related to the workspace
      await prisma.log.deleteMany({
        where: { workspaceId },
      })

      // Step 6: Finally, delete the workspace itself
      await prisma.workspace.delete({
        where: { id: workspaceId },
      })
    })
  }
}
